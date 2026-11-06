// ARMAZENAMENTO D1 (Cloudflare) do módulo de agentes — mesma interface do MemoryStore (store.mjs).
//
// Regras de atomicidade:
// - Operações compostas (cadastro, vínculo, mudança de localização, rotação, revogação) usam UM db.batch():
//   o D1 executa o batch como transação; qualquer erro desfaz tudo.
// - Pré-condições dentro do batch são "asserções": INSERT INTO agent_tx_guard(ok) SELECT 0 WHERE NOT (...)
//   viola o CHECK (ok = 1) e desfaz o batch. Depois de uma falha, o motivo é obtido relendo o estado.
// - Operações simples e idempotentes (presença, recibos, snapshots, lacunas) não precisam de batch:
//   o agente reenvia com o mesmo message_id/inventory_id/gap_id e o efeito não duplica.
//
// Tabelas: migrations/0100_agentes.sql. Catálogo do sistema (escolas, salas, vistorias, fichas): ./catalogo.mjs.

import { catalogoReferencia } from './catalogo.mjs';
import { OPEN_ENROLLMENT, OPEN_PENDING_TTL_MS, PENDING_EXPIRATION_REASON } from './enrollment-policy.mjs';

const J = (v) => (v === undefined || v === null ? null : JSON.stringify(v));
const P = (s) => (s === null || s === undefined ? null : JSON.parse(s));
const n = (v) => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v);

const grantRow = (r) => r && ({
  grant_id: r.grant_id, code_hash: r.code_hash, created_by: r.created_by, created_at: r.created_at, expires_at: r.expires_at,
  max_uses: r.max_uses, uses_count: r.uses_count, used_at: r.used_at, last_used_at: r.last_used_at,
  used_by_installation: r.used_by_installation, revoked_at: r.revoked_at, note: r.note,
});
const keyRow = (r) => r && ({ key_id: r.key_id, installation_id: r.installation_id, jwk: P(r.public_jwk), status: r.status, created_at: r.created_at, valid_until: r.valid_until });
const enrRow = (r) => r && ({
  enrollment_id: r.enrollment_id, device_id: r.device_id, grant_id: r.grant_id, code_hash: r.code_hash, visual_code: r.visual_code,
  expires_at: r.expires_at, failed_attempts: r.failed_attempts, renewals: r.renewals, consumed_at: r.consumed_at,
  summary: P(r.summary_json), created_at: r.created_at,
});
const linkRow = (r) => r && ({
  link_id: r.link_id, device_id: r.device_id, equipment_id: r.equipment_id, inspection_id: r.inspection_id, linked_by: r.linked_by,
  linked_at: r.linked_at, device_confirmed_at: r.device_confirmed_at, ended_at: r.ended_at, end_reason: r.end_reason,
});
const snapRow = (r) => r && ({
  inventory_id: r.inventory_id, device_id: r.device_id, equipment_id: r.equipment_id, collected_at: r.collected_at, received_at: r.received_at,
  boot_id: r.boot_id, sequence: r.sequence, reason: r.reason, previous_inventory_id: r.previous_inventory_id, content_hash: r.content_hash,
  snapshot_hash: r.snapshot_hash, queue_gaps: P(r.queue_gaps_json), sections: P(r.sections_json),
});
const histRow = (r) => ({
  at: r.changed_at, by: r.changed_by, source: r.source, inspection_id: r.inspection_id, version_before: r.version_before,
  version_after: r.version_after, kind: r.kind, reason: r.reason, before: P(r.before_json), after: P(r.after_json),
});

export class D1Store {
  /**
   * @param db        binding D1 (env.DB)
   * @param catalogo  adaptador das tabelas do sistema (ver catalogo.mjs)
   * @param opts.keepHeartbeats  quantas observações de heartbeat guardar por dispositivo (0 = nenhuma; economiza gravações)
   */
  constructor(db, { catalogo = catalogoReferencia, keepHeartbeats = 50 } = {}) {
    if (!db?.prepare || !db?.batch) throw new Error('D1Store: binding D1 inválido');
    this.db = db;
    this.cat = catalogo;
    this.keepHeartbeats = keepHeartbeats;
  }

  q(sql, ...args) { return this.db.prepare(sql).bind(...args.map(n)); }
  async first(sql, ...args) { return (await this.q(sql, ...args).first()) ?? undefined; }
  async all(sql, ...args) { return (await this.q(sql, ...args).all()).results ?? []; }
  async run(sql, ...args) { return this.q(sql, ...args).run(); }
  guard(sql, ...args) { return this.q(`INSERT INTO agent_tx_guard(ok) SELECT 0 WHERE NOT (${sql})`, ...args); }
  async tryBatch(stmts) {
    try { await this.db.batch(stmts); return true; } catch (e) {
      const m = String(e?.message ?? e);
      if (/constraint|CHECK|UNIQUE|NOT NULL/i.test(m)) return false; // asserção ou unicidade → reler estado
      throw e;
    }
  }

  // ---------- auditoria / conflitos ----------
  async logAudit(entry) {
    const { type, by, device_id, ...rest } = entry;
    await this.run('INSERT INTO agent_audit_log (audit_id, at, actor, action, target, details_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
      crypto.randomUUID(), new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), by ?? (device_id ? `device:${device_id}` : 'sistema'), type, device_id ?? null, J(rest));
  }
  async recordConflict(c) {
    await this.run('INSERT INTO agent_identity_conflicts (conflict_id, detected_at, kind, installation_id, key_id) VALUES (?1, ?2, ?3, ?4, ?5)',
      crypto.randomUUID(), c.at, c.type, c.installation_id ?? null, c.key_id ?? null);
  }

  // ---------- limites de taxa e nonces ----------
  async hitRate(key, limit, windowMs, nowMs) {
    const r = await this.first(`INSERT INTO agent_rate_limits (rate_key, count, window_start) VALUES (?1, 1, ?2)
      ON CONFLICT(rate_key) DO UPDATE SET
        count = CASE WHEN ?2 - window_start >= ?3 THEN 1 ELSE count + 1 END,
        window_start = CASE WHEN ?2 - window_start >= ?3 THEN ?2 ELSE window_start END
      RETURNING count, window_start`, key, nowMs, windowMs);
    if (r.count > limit) return { ok: false, retryAfter: Math.ceil((r.window_start + windowMs - nowMs) / 1000) };
    return { ok: true, retryAfter: 0 };
  }

  /** true = nonce novo (ou expirado e reaproveitado); false = replay. Atômico. */
  async useNonce(keyId, nonce, expiresAtMs, nowMs) {
    const r = await this.first(`INSERT INTO agent_request_nonces (key_id, nonce, expires_at) VALUES (?1, ?2, ?3)
      ON CONFLICT(key_id, nonce) DO UPDATE SET expires_at = excluded.expires_at WHERE agent_request_nonces.expires_at <= ?4
      RETURNING key_id`, keyId, nonce, expiresAtMs, nowMs);
    return !!r;
  }

  // ---------- autorizações ----------
  async createGrant(g) {
    await this.run(`INSERT INTO agent_install_grants (grant_id, code_hash, created_by, created_at, expires_at, max_uses, uses_count, note)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7)`, g.grant_id, g.code_hash, g.created_by, g.created_at, g.expires_at, g.max_uses ?? 1, g.note ?? null);
    return g;
  }
  async findGrantByHash(h) { return grantRow(await this.first('SELECT * FROM agent_install_grants WHERE code_hash = ?1', h)); }
  async getGrant(id) { return grantRow(await this.first('SELECT * FROM agent_install_grants WHERE grant_id = ?1', id)); }
  async listGrants(limit = 100) { return (await this.all('SELECT * FROM agent_install_grants ORDER BY created_at DESC LIMIT ?1', limit)).map(grantRow); }
  async revokeGrant(id, nowIso) {
    await this.run('UPDATE agent_install_grants SET revoked_at = COALESCE(revoked_at, ?2) WHERE grant_id = ?1', id, nowIso);
    return this.getGrant(id);
  }

  // ---------- desafios ----------
  async createChallenge(c) {
    await this.run('INSERT INTO agent_enrollment_challenges (challenge_id, grant_id, challenge, created_at, expires_at) VALUES (?1, ?2, ?3, ?4, ?5)',
      c.challenge_id, c.grant_id, c.challenge, c.created_at, c.expires_at);
  }
  async getChallenge(id) { return this.first('SELECT * FROM agent_enrollment_challenges WHERE challenge_id = ?1', id); }

  // ---------- cadastro (atômico) ----------
  async createEnrollmentAtomic({ challengeId, grantId, device, installation, key, enrollment, nowIso, openEnrollment = false }) {
    const inst = installation.installation_id;
    if (openEnrollment !== (grantId === OPEN_ENROLLMENT)) return { ok: false, reason: 'GRANT_USED' };
    const ok = await this.tryBatch([
      this.guard('EXISTS (SELECT 1 FROM agent_enrollment_challenges WHERE challenge_id = ?1 AND grant_id = ?2 AND expires_at > ?3 AND used_by IS NULL)', challengeId, grantId, nowIso),
      this.q('UPDATE agent_enrollment_challenges SET used_by = ?2 WHERE challenge_id = ?1 AND used_by IS NULL', challengeId, inst),
      this.guard('(SELECT used_by FROM agent_enrollment_challenges WHERE challenge_id = ?1) = ?2', challengeId, inst),
      ...(openEnrollment ? [] : [
      this.guard('EXISTS (SELECT 1 FROM agent_install_grants WHERE grant_id=?1 AND revoked_at IS NULL AND uses_count<max_uses AND expires_at>?2)', grantId, nowIso),
      this.q(`UPDATE agent_install_grants SET uses_count = uses_count + 1, used_at = COALESCE(used_at, ?2), last_used_at = ?2, used_by_installation = ?3
              WHERE grant_id = ?1 AND revoked_at IS NULL AND uses_count < max_uses AND expires_at > ?2`, grantId, nowIso, inst),
      this.guard('(SELECT used_by_installation FROM agent_install_grants WHERE grant_id = ?1) = ?2 AND (SELECT last_used_at FROM agent_install_grants WHERE grant_id = ?1) = ?3', grantId, inst, nowIso),
      ]),
      this.q('INSERT INTO agent_devices (device_id, state, created_at) VALUES (?1, ?2, ?3)', device.device_id, device.state, device.created_at),
      this.q('INSERT INTO agent_installations (installation_id, device_id, agent_version, current_key_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5)',
        inst, installation.device_id, installation.agent_version, installation.current_key_id, installation.created_at),
      this.q('INSERT INTO agent_keys (key_id, installation_id, public_jwk, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)',
        key.key_id, key.installation_id, J(key.jwk), key.status, key.created_at),
      this.q(`INSERT INTO agent_enrollments (enrollment_id, device_id, grant_id, code_hash, visual_code, expires_at, failed_attempts, renewals, summary_json, created_at)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, 0, ?7, ?8)`, enrollment.enrollment_id, enrollment.device_id, enrollment.grant_id,
        enrollment.code_hash, enrollment.visual_code, enrollment.expires_at, J(enrollment.summary), enrollment.created_at),
    ]);
    if (ok) return { ok: true };
    const ch = await this.getChallenge(challengeId);
    if (!ch || (ch.used_by && ch.used_by !== inst)) return { ok: false, reason: 'CHALLENGE_USED' };
    if (!openEnrollment) {
      const g = await this.getGrant(grantId);
      if (!g || g.revoked_at || g.uses_count >= g.max_uses || g.expires_at <= nowIso) return { ok: false, reason: 'GRANT_USED' };
    }
    if (await this.getInstallation(inst)) return { ok: false, reason: 'INSTALLATION_EXISTS' };
    if (await this.getKey(key.key_id)) return { ok: false, reason: 'KEY_EXISTS' };
    return { ok: false, reason: 'CHALLENGE_USED' };
  }

  // ---------- identidade ----------
  async getDevice(id) { return this.first('SELECT device_id, state, created_at, revoked_at FROM agent_devices WHERE device_id = ?1', id); }
  // D-058: expira somente cadastros abertos nunca vinculados. Não apaga identidades/histórico.
  async expireOpenPendingDevice(deviceId, nowMs) {
    const cutoff = new Date(nowMs - OPEN_PENDING_TTL_MS).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const eligible = `EXISTS (SELECT 1 FROM agent_devices d JOIN agent_enrollments e ON e.device_id=d.device_id
      WHERE d.device_id=?1 AND d.state='pending_pairing' AND e.grant_id=?2 AND e.created_at<=?3 AND e.consumed_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM agent_equipment_links l WHERE l.device_id=d.device_id))`;
    if (!(await this.first(`SELECT 1 AS ok WHERE ${eligible}`, deviceId, OPEN_ENROLLMENT, cutoff))) return false;
    const at = new Date(nowMs).toISOString().replace(/\.\d{3}Z$/, 'Z');
    return this.tryBatch([
      this.guard(eligible, deviceId, OPEN_ENROLLMENT, cutoff),
      this.q("UPDATE agent_devices SET state='revoked',revoked_at=?2,revoked_by='sistema',revoke_reason=?3 WHERE device_id=?1", deviceId, at, PENDING_EXPIRATION_REASON),
      this.q('UPDATE agent_installations SET revoked_at=?2 WHERE device_id=?1', deviceId, at),
      this.q("UPDATE agent_keys SET status='revoked' WHERE installation_id IN (SELECT installation_id FROM agent_installations WHERE device_id=?1)", deviceId),
      this.q('UPDATE agent_enrollments SET code_hash=NULL,visual_code=NULL WHERE device_id=?1', deviceId),
      this.q("INSERT INTO agent_audit_log (audit_id,at,actor,action,target,details_json) VALUES (?1,?2,'sistema','open_enrollment_expired',?3,?4)", crypto.randomUUID(), at, deviceId, J({reason:PENDING_EXPIRATION_REASON})),
    ]);
  }
  async getInstallation(id) { return this.first('SELECT * FROM agent_installations WHERE installation_id = ?1', id); }
  async getKey(id) { return keyRow(await this.first('SELECT * FROM agent_keys WHERE key_id = ?1', id)); }
  async getInstallationForDevice(deviceId) { return this.first('SELECT * FROM agent_installations WHERE device_id = ?1 ORDER BY created_at DESC LIMIT 1', deviceId); }
  async setInstallationVersion(id, v) { await this.run('UPDATE agent_installations SET agent_version = ?2 WHERE installation_id = ?1', id, v); }
  async retireOtherKeys(installationId, activeKeyId, nowIso) {
    await this.run("UPDATE agent_keys SET status = 'revoked', valid_until = ?3 WHERE installation_id = ?1 AND key_id <> ?2 AND status = 'retiring'", installationId, activeKeyId, nowIso);
  }
  async rotateKeyAtomic(installationId, oldKeyId, newKey, overlapUntilIso) {
    const ok = await this.tryBatch([
      this.guard("EXISTS (SELECT 1 FROM agent_keys WHERE key_id = ?1 AND status = 'active')", oldKeyId),
      this.q("UPDATE agent_keys SET status = 'retiring', valid_until = ?2 WHERE key_id = ?1", oldKeyId, overlapUntilIso),
      this.q('INSERT INTO agent_keys (key_id, installation_id, public_jwk, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)',
        newKey.key_id, newKey.installation_id, J(newKey.jwk), newKey.status, newKey.created_at),
      this.q('UPDATE agent_installations SET current_key_id = ?2 WHERE installation_id = ?1', installationId, newKey.key_id),
    ]);
    if (ok) return { ok: true };
    if (await this.getKey(newKey.key_id)) return { ok: false, reason: 'KEY_EXISTS' };
    return { ok: false, reason: 'OLD_KEY_NOT_ACTIVE' };
  }
  async revokeDevice(deviceId, nowIso, reason, by) {
    if (!(await this.getDevice(deviceId))) return false;
    await this.db.batch([
      this.q("UPDATE agent_devices SET state = 'revoked', revoked_at = ?2, revoked_by = ?3, revoke_reason = ?4 WHERE device_id = ?1", deviceId, nowIso, by, reason),
      this.q('UPDATE agent_installations SET revoked_at = COALESCE(revoked_at, ?2) WHERE device_id = ?1', deviceId, nowIso),
      this.q("UPDATE agent_keys SET status = 'revoked' WHERE installation_id IN (SELECT installation_id FROM agent_installations WHERE device_id = ?1)", deviceId),
      this.q("UPDATE agent_equipment_links SET ended_at = ?2, end_reason = 'revoked' WHERE device_id = ?1 AND ended_at IS NULL", deviceId, nowIso),
    ]);
    await this.logAudit({ type: 'agent_revoked', device_id: deviceId, reason, by });
    return true;
  }

  // ---------- pareamento ----------
  async getEnrollment(id) { return enrRow(await this.first('SELECT * FROM agent_enrollments WHERE enrollment_id = ?1', id)); }
  async getEnrollmentForDevice(deviceId) { return enrRow(await this.first('SELECT * FROM agent_enrollments WHERE device_id = ?1', deviceId)); }
  async renewPairing(id, codeHash, visual, expiresAt) {
    const r = await this.run(`UPDATE agent_enrollments SET code_hash = ?2, visual_code = ?3, expires_at = ?4, failed_attempts = 0, renewals = renewals + 1
      WHERE enrollment_id = ?1 AND consumed_at IS NULL`, id, codeHash, visual, expiresAt);
    return (r.meta?.changes ?? 0) === 1;
  }
  async registerFailedPairingAttempt(id) {
    const r = await this.first('UPDATE agent_enrollments SET failed_attempts = failed_attempts + 1 WHERE enrollment_id = ?1 RETURNING failed_attempts', id);
    return r?.failed_attempts ?? 0;
  }

  historyStmt(equipmentId, h) {
    return this.q(`INSERT INTO agent_equipment_location_history (history_id, equipment_id, version_before, version_after, kind, source, before_json, after_json, reason, changed_by, changed_at, inspection_id)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`, crypto.randomUUID(), equipmentId, h.version_before, h.version_after, h.kind, h.source,
      J(h.before), J(h.after), h.reason ?? null, h.by, h.at, h.inspection_id ?? null);
  }

  /** Consome o QR, atualiza/cria a ficha (fonte de verdade da localização) e cria o vínculo — tudo ou nada. */
  async claimAtomic({ enrollmentId, codeHash, link, newEquipment, expectedVersion, location, historyEntry, nowMs, receipt = null, actor = null, unitId = null, policy = null }) {
    const nowIso = new Date(nowMs).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const enr = await this.getEnrollment(enrollmentId);
    if (!enr) return { ok: false, reason: 'NOT_FOUND' };
    const st = [
      // [SEMED R1] estado do dispositivo verificado DENTRO da transação: revogação concorrente desfaz o vínculo.
      this.guard("EXISTS (SELECT 1 FROM agent_devices WHERE device_id = ?1 AND state = 'pending_pairing')", enr.device_id),
      this.guard('EXISTS (SELECT 1 FROM agent_enrollments WHERE enrollment_id = ?1 AND consumed_at IS NULL AND code_hash = ?2 AND expires_at > ?3)', enrollmentId, codeHash, nowIso),
      this.guard('NOT EXISTS (SELECT 1 FROM agent_equipment_links WHERE device_id = ?1 AND ended_at IS NULL)', enr.device_id),
      this.guard('NOT EXISTS (SELECT 1 FROM agent_equipment_links WHERE equipment_id = ?1 AND ended_at IS NULL)', link.equipment_id),
    ];
    // [SEMED REV-03] mesma política do coletor dentro da transação: unidade ativa, visita aberta e trava do próprio usuário.
    if (policy && this.cat.policyGuards) st.push(...this.cat.policyGuards(this.db, { ...policy, nowMs }));
    if (newEquipment) {
      st.push(this.cat.insertEquipment(this.db, newEquipment));
      st.push(this.historyStmt(newEquipment.id, { ...historyEntry, version_after: newEquipment.version }));
    } else {
      st.push(this.cat.assertEquipmentVersion(this.db, link.equipment_id, expectedVersion));
      st.push(this.cat.updateEquipmentLocation(this.db, link.equipment_id, expectedVersion, location, { by: actor, nowMs, markAgent: true, inspectionId: policy?.inspectionId ?? link.inspection_id ?? null }));
      st.push(this.historyStmt(link.equipment_id, { ...historyEntry, version_after: expectedVersion + 1 }));
      // [SEMED] trilha do inventário (collection_history) na mesma transação, quando o catálogo a oferece.
      if (this.cat.historyStatement) st.push(this.cat.historyStatement(this.db, { equipmentId: link.equipment_id, unitId, inspectionId: link.inspection_id, event: 'agent_linked', before: historyEntry.before ?? null, after: { ...historyEntry.after, device_id: link.device_id, link_id: link.link_id }, actorId: actor ?? link.linked_by, nowMs }));
    }
    if (receipt) st.push(this.q('INSERT INTO agent_claim_requests (request_key, body_hash, status, response_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5)', receipt.key, receipt.body_hash, receipt.status, J(receipt.body), nowIso)); // [SEMED R2]
    if (policy?.inspectionId && this.cat.touchInspection) st.push(this.cat.touchInspection(this.db, policy.inspectionId, nowMs)); // [SEMED REV-03] revisão da visita avança
    st.push(
      this.q('UPDATE agent_enrollments SET consumed_at = ?2, code_hash = NULL WHERE enrollment_id = ?1', enrollmentId, nowIso),
      this.q(`INSERT INTO agent_equipment_links (link_id, device_id, equipment_id, inspection_id, linked_by, linked_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        link.link_id, link.device_id, link.equipment_id, link.inspection_id, link.linked_by, link.linked_at),
      this.q("UPDATE agent_devices SET state = 'linked' WHERE device_id = ?1", enr.device_id),
    );
    if (await this.tryBatch(st)) return { ok: true, equipment: await this.getEquipment(link.equipment_id) };
    // Motivo (relendo o estado):
    if (policy && this.cat.checkPolicy) { const why = await this.cat.checkPolicy(this.db, { ...policy, nowMs }); if (why) return { ok: false, reason: why }; }
    const e = await this.getEnrollment(enrollmentId);
    const dev = await this.getDevice(e.device_id);
    if (!dev || dev.state === 'revoked') return { ok: false, reason: 'DEVICE_REVOKED' }; // [SEMED R1]
    if (e.consumed_at) return { ok: false, reason: 'ALREADY_CONSUMED' };
    if (Date.parse(e.expires_at) <= nowMs) return { ok: false, reason: 'EXPIRED' };
    if (e.code_hash !== codeHash) return { ok: false, reason: 'BAD_CODE' };
    if (await this.getActiveLink(e.device_id)) return { ok: false, reason: 'DEVICE_ALREADY_LINKED' };
    if (await this.getActiveLinkForEquipment(link.equipment_id)) return { ok: false, reason: 'EQUIPMENT_ALREADY_LINKED' };
    if (newEquipment) return { ok: false, reason: 'EQUIPMENT_ID_COLLISION' };
    const cur = await this.getEquipment(link.equipment_id);
    if (!cur) return { ok: false, reason: 'EQUIPMENT_NOT_FOUND' };
    return { ok: false, reason: 'EQUIPMENT_VERSION_CONFLICT', current: cur };
  }

  // [SEMED REV-02] política compartilhada, trilha do inventário, revisão da visita e recibo idempotente na MESMA transação.
  async updateLocationAtomic(equipmentId, expectedVersion, location, historyEntry, { policy = null, receipt = null, actor = null, unitId = null, nowMs = Date.now() } = {}) {
    const nowIso = new Date(nowMs).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const st = [];
    if (policy && this.cat.policyGuards) st.push(...this.cat.policyGuards(this.db, { ...policy, nowMs }));
    st.push(
      this.cat.assertEquipmentVersion(this.db, equipmentId, expectedVersion),
      this.cat.updateEquipmentLocation(this.db, equipmentId, expectedVersion, location, { by: actor, nowMs, markAgent: false, inspectionId: policy?.inspectionId ?? historyEntry.inspection_id ?? null }),
      this.historyStmt(equipmentId, { ...historyEntry, version_after: expectedVersion + 1 }),
    );
    if (this.cat.historyStatement) st.push(this.cat.historyStatement(this.db, { equipmentId, unitId, inspectionId: policy?.inspectionId ?? historyEntry.inspection_id ?? null, event: 'equipment_location_changed', before: historyEntry.before ?? null, after: { ...historyEntry.after, reason: historyEntry.reason ?? null }, actorId: actor ?? historyEntry.by, nowMs }));
    if (policy?.inspectionId && this.cat.touchInspection) st.push(this.cat.touchInspection(this.db, policy.inspectionId, nowMs));
    if (receipt) st.push(this.q('INSERT INTO agent_location_requests (request_key, body_hash, status, response_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5)', receipt.key, receipt.body_hash, receipt.status, J(receipt.body), nowIso));
    const ok = await this.tryBatch(st);
    const cur = await this.getEquipment(equipmentId);
    if (ok) return { ok: true, equipment: cur };
    if (policy && this.cat.checkPolicy) { const why = await this.cat.checkPolicy(this.db, { ...policy, nowMs }); if (why) return { ok: false, reason: why, current: cur }; }
    if (!cur) return { ok: false, reason: 'EQUIPMENT_NOT_FOUND' };
    return { ok: false, reason: 'EQUIPMENT_VERSION_CONFLICT', current: cur };
  }
  async checkPolicy(policy) { return this.cat.checkPolicy ? this.cat.checkPolicy(this.db, policy) : null; }

  // ---------- vínculos ----------
  /** [SEMED REV-01] encerra um vínculo cuja ficha deixou de existir; idempotente. */
  async endOrphanLink(linkId, nowIso, reason) { await this.run('UPDATE agent_equipment_links SET ended_at = ?2, end_reason = ?3 WHERE link_id = ?1 AND ended_at IS NULL', linkId, nowIso, reason); }
  async getActiveLink(deviceId) { return linkRow(await this.first('SELECT * FROM agent_equipment_links WHERE device_id = ?1 AND ended_at IS NULL', deviceId)); }
  async getActiveLinkForEquipment(eqId) { return linkRow(await this.first('SELECT * FROM agent_equipment_links WHERE equipment_id = ?1 AND ended_at IS NULL', eqId)); }
  async getLatestLinkForEquipment(eqId) { return linkRow(await this.first('SELECT * FROM agent_equipment_links WHERE equipment_id = ?1 ORDER BY linked_at DESC LIMIT 1', eqId)); }
  async confirmLink(linkId, nowIso) {
    const r = await this.first('UPDATE agent_equipment_links SET device_confirmed_at = COALESCE(device_confirmed_at, ?2) WHERE link_id = ?1 RETURNING device_confirmed_at', linkId, nowIso);
    return r?.device_confirmed_at ?? null;
  }

  // ---------- pedidos humanos idempotentes ----------
  async getClaimRequest(k) { const r = await this.first('SELECT * FROM agent_claim_requests WHERE request_key = ?1', k); return r && { body_hash: r.body_hash, status: r.status, body: P(r.response_json) }; }
  async putClaimRequest(k, v) { await this.run('INSERT OR IGNORE INTO agent_claim_requests (request_key, body_hash, status, response_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5)', k, v.body_hash, v.status, J(v.body), new Date().toISOString()); }
  async getLocationRequest(k) { const r = await this.first('SELECT * FROM agent_location_requests WHERE request_key = ?1', k); return r && { body_hash: r.body_hash, status: r.status, body: P(r.response_json) }; }
  async putLocationRequest(k, v) { await this.run('INSERT OR IGNORE INTO agent_location_requests (request_key, body_hash, status, response_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5)', k, v.body_hash, v.status, J(v.body), new Date().toISOString()); }

  // ---------- recibos (ACK) ----------
  async getReceipt(deviceId, messageId) {
    const r = await this.first('SELECT body_hash, ack_json, expires_at FROM agent_message_receipts WHERE device_id = ?1 AND message_id = ?2', deviceId, messageId);
    return r && { body_hash: r.body_hash, ack: P(r.ack_json), expires_at: r.expires_at };
  }
  async putReceipt(deviceId, messageId, rc) {
    await this.run('INSERT OR IGNORE INTO agent_message_receipts (device_id, message_id, body_hash, ack_json, expires_at) VALUES (?1, ?2, ?3, ?4, ?5)',
      deviceId, messageId, rc.body_hash, J(rc.ack), rc.expires_at);
  }

  // ---------- presença ----------
  async getPresence(deviceId) { const r = await this.first('SELECT data_json FROM agent_presence WHERE device_id = ?1', deviceId); return r ? P(r.data_json) : undefined; }
  async setPresence(deviceId, p) {
    await this.run('INSERT INTO agent_presence (device_id, data_json, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(device_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at',
      deviceId, J(p), new Date().toISOString());
  }
  /** [SEMED R3] Atualização condicional e atômica: um heartbeat atrasado nunca regride a presença atual. */
  async setPresenceIfNewer(deviceId, p, { boot_id, sequence, collected_ms }) {
    const r = await this.first(`INSERT INTO agent_presence (device_id, data_json, updated_at, boot_id, sequence, collected_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      ON CONFLICT(device_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at, boot_id = excluded.boot_id, sequence = excluded.sequence, collected_ms = excluded.collected_ms
      WHERE agent_presence.boot_id IS NULL
         OR (agent_presence.boot_id <> excluded.boot_id AND (agent_presence.collected_ms IS NULL OR excluded.collected_ms > agent_presence.collected_ms))
         OR (agent_presence.boot_id = excluded.boot_id AND excluded.sequence > COALESCE(agent_presence.sequence, 0))
      RETURNING device_id`, deviceId, J(p), new Date().toISOString(), boot_id, sequence, collected_ms);
    return !!r;
  }
  async touchPresenceReceived(deviceId, receivedAt) {
    await this.run(`INSERT INTO agent_presence (device_id, data_json, updated_at) VALUES (?1, json_object('last_received_at', ?2), ?3)
      ON CONFLICT(device_id) DO UPDATE SET data_json = json_set(agent_presence.data_json, '$.last_received_at', ?2), updated_at = excluded.updated_at`, deviceId, receivedAt, new Date().toISOString());
  }
  async recordHeartbeat(deviceId, o) {
    if (!this.keepHeartbeats) return;
    const r = await this.first('INSERT INTO agent_heartbeats (device_id, collected_at, received_at, boot_id, sequence, reason, live) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING id',
      deviceId, o.collected_at, o.received_at, o.boot_id, o.sequence, o.reason, o.live ? 1 : 0);
    if (r.id % 20 === 0) {
      await this.run('DELETE FROM agent_heartbeats WHERE device_id = ?1 AND id <= (SELECT id FROM agent_heartbeats WHERE device_id = ?1 ORDER BY id DESC LIMIT 1 OFFSET ?2)', deviceId, this.keepHeartbeats);
    }
  }

  // ---------- inventário ----------
  async getSnapshot(id) { return snapRow(await this.first('SELECT * FROM agent_inventory_snapshots WHERE inventory_id = ?1', id)); }
  async addSnapshot(s) {
    await this.run(`INSERT INTO agent_inventory_snapshots (inventory_id, device_id, equipment_id, collected_at, received_at, boot_id, sequence, reason,
        previous_inventory_id, content_hash, snapshot_hash, queue_gaps_json, sections_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
      s.inventory_id, s.device_id, s.equipment_id, s.collected_at, s.received_at, s.boot_id, s.sequence, s.reason, s.previous_inventory_id ?? null,
      s.content_hash, s.snapshot_hash, J(s.queue_gaps), J(s.sections));
  }
  async getCurrentSnapshot(deviceId) {
    return snapRow(await this.first('SELECT s.* FROM agent_current_snapshot c JOIN agent_inventory_snapshots s ON s.inventory_id = c.inventory_id WHERE c.device_id = ?1', deviceId));
  }
  async setCurrentSnapshot(deviceId, inventoryId, collectedAt) {
    // Monotônico: nunca volta para um snapshot mais antigo, mesmo com envios fora de ordem simultâneos.
    await this.run(`INSERT INTO agent_current_snapshot (device_id, inventory_id, collected_at) VALUES (?1, ?2, ?3)
      ON CONFLICT(device_id) DO UPDATE SET inventory_id = excluded.inventory_id, collected_at = excluded.collected_at WHERE excluded.collected_at > agent_current_snapshot.collected_at`,
      deviceId, inventoryId, collectedAt);
  }
  async getBaseline(deviceId) { return this.first('SELECT inventory_id, version, set_at FROM agent_baseline WHERE device_id = ?1', deviceId); }
  async setBaselineIfAbsent(deviceId, b) {
    const r = await this.run('INSERT OR IGNORE INTO agent_baseline (device_id, inventory_id, version, set_at) VALUES (?1, ?2, ?3, ?4)', deviceId, b.inventory_id, b.version, b.set_at);
    return (r.meta?.changes ?? 0) === 1;
  }
  async listSnapshots(deviceId, offset, limit) {
    const [rows, c] = await Promise.all([
      this.all('SELECT * FROM agent_inventory_snapshots WHERE device_id = ?1 ORDER BY collected_at, inventory_id LIMIT ?2 OFFSET ?3', deviceId, limit, offset),
      this.first('SELECT COUNT(*) AS n FROM agent_inventory_snapshots WHERE device_id = ?1', deviceId),
    ]);
    return { items: rows.map(snapRow), total: c?.n ?? 0 };
  }
  async recordQueueGaps(deviceId, inventoryId, gaps, receivedAt) {
    const r = { added: 0, duplicates: 0, conflicts: 0 };
    for (const g of gaps ?? []) {
      const ins = await this.run(`INSERT OR IGNORE INTO agent_queue_gaps (device_id, gap_id, dropped_count, dropped_change_count, first_dropped_collected_at,
          last_dropped_collected_at, first_reported_inventory_id, received_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
        deviceId, g.gap_id, g.dropped_count, g.dropped_change_count, g.first_dropped_collected_at, g.last_dropped_collected_at, inventoryId, receivedAt);
      if ((ins.meta?.changes ?? 0) === 1) { r.added++; continue; }
      const prev = await this.first('SELECT * FROM agent_queue_gaps WHERE device_id = ?1 AND gap_id = ?2', deviceId, g.gap_id);
      if (prev.dropped_count === g.dropped_count && prev.dropped_change_count === g.dropped_change_count
        && prev.first_dropped_collected_at === g.first_dropped_collected_at && prev.last_dropped_collected_at === g.last_dropped_collected_at) r.duplicates++;
      else { r.conflicts++; await this.logAudit({ type: 'queue_gap_conflict', device_id: deviceId, gap_id: g.gap_id }); }
    }
    return r;
  }
  async queueGapSummary(deviceId) {
    const r = await this.first(`SELECT COUNT(*) AS gap_count, SUM(dropped_count) AS dropped_count, SUM(dropped_change_count) AS dropped_change_count,
        MIN(first_dropped_collected_at) AS first_dropped_collected_at, MAX(last_dropped_collected_at) AS last_dropped_collected_at
        FROM agent_queue_gaps WHERE device_id = ?1`, deviceId);
    if (!r || !r.gap_count) return null;
    return { ...r, note: 'Inventários descartados pela fila do agente: o histórico desse período está incompleto.' };
  }

  // ---------- catálogo do sistema (adaptador) ----------
  getUnit(id) { return this.cat.getUnit(this.db, id); }
  listUnits() { return this.cat.listUnits(this.db); }
  getEnvironment(id) { return this.cat.getEnvironment(this.db, id); }
  listEnvironments(unitId) { return this.cat.listEnvironments(this.db, unitId); }
  getInspection(id) { return this.cat.getInspection(this.db, id); }
  listOpenInspections(unitId) { return this.cat.listOpenInspections(this.db, unitId); }
  getEquipment(id) { return this.cat.getEquipment(this.db, id); }
  listComputersInUnit(unitId, opts = {}) { return this.cat.listComputersInUnit(this.db, unitId, opts); } // [SEMED R5]
  findEquipmentByAsset(asset) { return this.cat.findEquipmentByAsset(this.db, asset); }
  async getEquipmentHistory(eqId, limit = 10) {
    const rows = await this.all('SELECT * FROM agent_equipment_location_history WHERE equipment_id = ?1 ORDER BY version_after DESC LIMIT ?2', eqId, limit);
    return rows.reverse().map(histRow);
  }

  // ---------- contagens (diagnóstico/testes) ----------
  async countLinks() { return (await this.first('SELECT COUNT(*) AS n FROM agent_equipment_links')).n; }
  async countConflicts() { return (await this.first('SELECT COUNT(*) AS n FROM agent_identity_conflicts')).n; }
  async countHeartbeats(deviceId) { return (await this.first('SELECT COUNT(*) AS n FROM agent_heartbeats WHERE device_id = ?1', deviceId)).n; }
  async listHeartbeats(deviceId) {
    return (await this.all('SELECT collected_at, received_at, boot_id, sequence, reason, live FROM agent_heartbeats WHERE device_id = ?1 ORDER BY id', deviceId))
      .map((r) => ({ ...r, live: !!r.live }));
  }
  /** Diagnóstico: total de fichas no catálogo (se o adaptador oferecer). */
  async countEquipment() { return this.cat.countEquipment ? this.cat.countEquipment(this.db) : NaN; }

  // ---------- manutenção (chamar pelo agendamento "scheduled" do Worker) ----------
  async purgeExpired(nowMs, { keepSnapshotsPerDevice = 60 } = {}) {
    const nowIso = new Date(nowMs).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const dayAgo = new Date(nowMs - 86400_000).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const out = {};
    // Uma transação em lote, sem duas consultas por máquina: cabe nos limites do Worker com 200+ PCs.
    const pendingIds = `SELECT d.device_id FROM agent_devices d JOIN agent_enrollments e ON e.device_id=d.device_id
      WHERE d.state='pending_pairing' AND e.grant_id=?1 AND e.created_at<=?2 AND e.consumed_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM agent_equipment_links l WHERE l.device_id=d.device_id) ORDER BY e.created_at,d.device_id LIMIT 250`;
    const cutoff = new Date(nowMs - OPEN_PENDING_TTL_MS).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const expired = await this.db.batch([
      this.q(`INSERT INTO agent_audit_log (audit_id,at,actor,action,target,details_json)
        SELECT lower(hex(randomblob(16))),?3,'sistema','open_enrollment_expired',device_id,?4 FROM agent_devices WHERE device_id IN (${pendingIds})`, OPEN_ENROLLMENT, cutoff, nowIso, J({reason:PENDING_EXPIRATION_REASON})),
      this.q(`UPDATE agent_keys SET status='revoked' WHERE installation_id IN (SELECT installation_id FROM agent_installations WHERE device_id IN (${pendingIds}))`, OPEN_ENROLLMENT, cutoff),
      this.q(`UPDATE agent_installations SET revoked_at=?3 WHERE device_id IN (${pendingIds})`, OPEN_ENROLLMENT, cutoff, nowIso),
      this.q(`UPDATE agent_enrollments SET code_hash=NULL,visual_code=NULL WHERE device_id IN (${pendingIds})`, OPEN_ENROLLMENT, cutoff),
      this.q(`UPDATE agent_devices SET state='revoked',revoked_at=?3,revoked_by='sistema',revoke_reason=?4 WHERE device_id IN (${pendingIds})`, OPEN_ENROLLMENT, cutoff, nowIso, PENDING_EXPIRATION_REASON),
    ]);
    out.expired_pending = expired.at(-1).meta?.changes ?? 0;
    out.nonces = (await this.run('DELETE FROM agent_request_nonces WHERE expires_at < ?1', nowMs)).meta?.changes ?? 0;
    out.receipts = (await this.run('DELETE FROM agent_message_receipts WHERE expires_at < ?1', nowMs)).meta?.changes ?? 0;
    out.rate = (await this.run('DELETE FROM agent_rate_limits WHERE window_start < ?1', nowMs - 86400_000)).meta?.changes ?? 0;
    out.challenges = (await this.run('DELETE FROM agent_enrollment_challenges WHERE expires_at < ?1', dayAgo)).meta?.changes ?? 0;
    // Retenção de snapshots: mantém os N mais recentes por dispositivo + o atual + a linha de base.
    out.snapshots = (await this.run(`DELETE FROM agent_inventory_snapshots WHERE inventory_id IN (
        SELECT inventory_id FROM (SELECT inventory_id, ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY collected_at DESC) AS rn FROM agent_inventory_snapshots) WHERE rn > ?1)
      AND inventory_id NOT IN (SELECT inventory_id FROM agent_current_snapshot) AND inventory_id NOT IN (SELECT inventory_id FROM agent_baseline)`, keepSnapshotsPerDevice)).meta?.changes ?? 0;
    out.at = nowIso;
    return out;
  }
}
