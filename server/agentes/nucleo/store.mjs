// Armazenamento EM MEMÓRIA do servidor mock — somente desenvolvimento/testes.
// Implementa a MESMA interface (assíncrona do ponto de vista do worker) que d1-store.mjs:
// o worker sempre usa `await store.metodo(...)`; aqui os métodos são síncronos.
//
// Não é persistente entre isolates do Workers nem entre reinícios do processo.
// Cada método que precisa de atomicidade (consumir autorização, consumir código
// de pareamento, criar vínculo) faz verificação + escrita sem nenhum `await` no
// meio, o que em JavaScript é atômico dentro de um isolate. Um adaptador D1 real
// deve reproduzir essa semântica com UPDATE condicional (WHERE consumed_at IS NULL)
// e conferência de `meta.changes`, ou com db.batch() — ver migrations-proposed/.

import { OPEN_ENROLLMENT, OPEN_PENDING_TTL_MS, PENDING_EXPIRATION_REASON } from './enrollment-policy.mjs';
export const EMPTY_CATALOG = { units: [], environments: [], equipment: [], users: [], inspections: [] };

export class MemoryStore {
  /** O catálogo fictício (seed.mjs) só é carregado quando passado explicitamente (dev/testes). */
  constructor(seed = EMPTY_CATALOG) {
    const clone = structuredClone(seed);
    this.units = new Map(clone.units.map((u) => [u.unit_id, u]));
    this.environments = new Map(clone.environments.map((e) => [e.environment_id, e]));
    this.equipment = new Map(clone.equipment.map((e) => [e.id, e]));
    this.users = new Map(clone.users.map((u) => [u.id, u]));
    this.inspections = new Map(clone.inspections.map((i) => [i.inspection_id, i]));
    this.equipmentHistory = new Map(); // equipment id -> [mudanças de localização/versão]
    this.locationRequests = new Map(); // `${user}|${request_id}` -> {body_hash, status, body}

    this.sessions = new Map(); // token -> {user_id, csrf, expires_at}
    this.grants = new Map(); // grant_id -> grant
    this.grantByHash = new Map(); // code_hash -> grant_id
    this.challenges = new Map(); // challenge_id -> challenge
    this.devices = new Map(); // device_id -> device
    this.installations = new Map(); // installation_id -> installation
    this.keys = new Map(); // key_id -> key
    this.enrollments = new Map(); // enrollment_id -> enrollment
    this.enrollmentByDevice = new Map();
    this.links = new Map(); // link_id -> link
    this.activeLinkByDevice = new Map();
    this.activeLinkByEquipment = new Map();
    this.presence = new Map(); // device_id -> presence
    this.heartbeats = new Map(); // device_id -> [observações recentes, limitado]
    this.snapshots = new Map(); // inventory_id -> snapshot
    this.snapshotsByDevice = new Map(); // device_id -> [inventory_id]
    this.currentSnapshot = new Map(); // device_id -> inventory_id
    this.baseline = new Map(); // device_id -> {inventory_id, version, set_at}
    this.receipts = new Map(); // `${device_id}|${message_id}` -> {body_hash, ack, expires_at}
    this.nonces = new Map(); // `${key_id}|${nonce}` -> expires_at_ms
    this.rate = new Map(); // chave -> {count, window_start}
    this.claimRequests = new Map(); // `${user_id}|${request_id}` -> {body_hash, status, body}
    this.queueGaps = new Map(); // `${device_id}|${gap_id}` -> lacuna (deduplicada por gap_id)
    this.audit = []; // eventos de auditoria (somente leitura humana)
    this.conflicts = []; // conflitos de identidade
    this._nonceInserts = 0;
  }

  // ---------- auditoria ----------
  logAudit(entry) {
    this.audit.push({ at: new Date().toISOString(), ...entry });
    if (this.audit.length > 5000) this.audit.splice(0, this.audit.length - 5000);
  }

  // ---------- limites de taxa (janela fixa) ----------
  hitRate(key, limit, windowMs, nowMs) {
    const r = this.rate.get(key);
    if (!r || nowMs - r.window_start >= windowMs) {
      this.rate.set(key, { count: 1, window_start: nowMs });
      return { ok: true, retryAfter: 0 };
    }
    r.count += 1;
    if (r.count > limit) {
      return { ok: false, retryAfter: Math.ceil((r.window_start + windowMs - nowMs) / 1000) };
    }
    return { ok: true, retryAfter: 0 };
  }

  // ---------- nonces (proteção de replay) ----------
  /** Registra nonce; devolve false se já visto e ainda não expirado. Atômico. */
  useNonce(keyId, nonce, expiresAtMs, nowMs) {
    const k = `${keyId}|${nonce}`;
    const prev = this.nonces.get(k);
    if (prev !== undefined && prev > nowMs) return false;
    this.nonces.set(k, expiresAtMs);
    if (++this._nonceInserts % 256 === 0) this.sweepNonces(nowMs);
    return true;
  }

  sweepNonces(nowMs) {
    for (const [k, exp] of this.nonces) if (exp <= nowMs) this.nonces.delete(k);
  }

  // ---------- autorizações de instalação ----------
  createGrant(grant) {
    this.grants.set(grant.grant_id, grant);
    this.grantByHash.set(grant.code_hash, grant.grant_id);
    return grant;
  }

  findGrantByHash(hash) {
    const id = this.grantByHash.get(hash);
    return id ? this.grants.get(id) : undefined;
  }

  getGrant(grantId) { return this.grants.get(grantId); }

  listGrants(limit = 100) {
    return [...this.grants.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, limit);
  }

  revokeGrant(grantId, nowIso) {
    const g = this.grants.get(grantId);
    if (!g) return null;
    g.revoked_at ??= nowIso;
    return g;
  }

  /** Lote: true se ainda há usos. Compatível com o formato antigo (used_at). */
  static grantHasUses(g) {
    const max = g.max_uses ?? 1;
    const used = g.uses_count ?? (g.used_at ? 1 : 0);
    return used < max;
  }

  // ---------- desafios ----------
  createChallenge(ch) {
    this.challenges.set(ch.challenge_id, ch);
    // Limpeza simples de desafios expirados.
    if (this.challenges.size > 2000) {
      const now = Date.now();
      for (const [id, c] of this.challenges) if (Date.parse(c.expires_at) < now - 3600_000) this.challenges.delete(id);
    }
  }

  getChallenge(id) { return this.challenges.get(id); }

  /** Marca desafio como usado. Atômico. */
  useChallenge(challengeId, installationId) {
    const c = this.challenges.get(challengeId);
    if (!c || c.used_by) return false;
    c.used_by = installationId;
    return true;
  }

  // ---------- cadastro (operação composta e atômica) ----------
  /**
   * Cria dispositivo + instalação + chave + pedido pendente, consumindo desafio e
   * autorização. Nada é gravado se qualquer pré-condição falhar.
   * Devolve {ok:true} ou {ok:false, reason}.
   */
  createEnrollmentAtomic({ challengeId, grantId, device, installation, key, enrollment, nowIso, openEnrollment = false }) {
    const c = this.challenges.get(challengeId);
    if (!c || c.used_by || c.grant_id !== grantId || Date.parse(c.expires_at) <= Date.parse(nowIso)) return { ok: false, reason: 'CHALLENGE_USED' };
    if (openEnrollment !== (grantId === OPEN_ENROLLMENT)) return { ok: false, reason: 'GRANT_USED' };
    const g = this.grants.get(grantId);
    if (!openEnrollment && (!g || g.revoked_at || !MemoryStore.grantHasUses(g) || Date.parse(g.expires_at) <= Date.parse(nowIso))) return { ok: false, reason: 'GRANT_USED' };
    if (this.installations.has(installation.installation_id)) return { ok: false, reason: 'INSTALLATION_EXISTS' };
    if (this.keys.has(key.key_id)) return { ok: false, reason: 'KEY_EXISTS' };
    c.used_by = installation.installation_id;
    if (!openEnrollment) {
    g.uses_count = (g.uses_count ?? (g.used_at ? 1 : 0)) + 1;
    g.used_at ??= nowIso; // primeiro uso
    g.last_used_at = nowIso;
    g.used_by_installation = installation.installation_id; // último uso
    }
    this.devices.set(device.device_id, device);
    this.installations.set(installation.installation_id, installation);
    this.keys.set(key.key_id, key);
    this.enrollments.set(enrollment.enrollment_id, enrollment);
    this.enrollmentByDevice.set(device.device_id, enrollment.enrollment_id);
    return { ok: true };
  }

  getEnrollment(id) { return this.enrollments.get(id); }
  expireOpenPendingDevice(deviceId, nowMs) {
    const d = this.devices.get(deviceId), e = this.getEnrollmentForDevice(deviceId);
    if (d?.state !== 'pending_pairing' || e?.grant_id !== OPEN_ENROLLMENT || e.consumed_at || Date.parse(e.created_at) + OPEN_PENDING_TTL_MS > nowMs || [...this.links.values()].some(l=>l.device_id===deviceId)) return false;
    const at = new Date(nowMs).toISOString();
    Object.assign(d,{state:'revoked',revoked_at:at,revoked_by:'sistema',revoke_reason:PENDING_EXPIRATION_REASON});
    for (const i of this.installations.values()) if (i.device_id===deviceId) { i.revoked_at=at; for (const k of this.keys.values()) if (k.installation_id===i.installation_id) k.status='revoked'; }
    e.code_hash=null;e.visual_code=null;
    this.logAudit({type:'open_enrollment_expired',device_id:deviceId,reason:PENDING_EXPIRATION_REASON});
    return true;
  }

  getEnrollmentForDevice(deviceId) {
    const id = this.enrollmentByDevice.get(deviceId);
    return id ? this.enrollments.get(id) : undefined;
  }

  /** Renova código: invalida o anterior. Atômico. */
  renewPairing(enrollmentId, codeHash, visualCode, expiresAt) {
    const e = this.enrollments.get(enrollmentId);
    if (!e || e.consumed_at) return false;
    e.code_hash = codeHash;
    e.visual_code = visualCode;
    e.expires_at = expiresAt;
    e.failed_attempts = 0;
    e.renewals = (e.renewals ?? 0) + 1;
    return true;
  }

  registerFailedPairingAttempt(enrollmentId) {
    const e = this.enrollments.get(enrollmentId);
    if (e) e.failed_attempts = (e.failed_attempts ?? 0) + 1;
    return e?.failed_attempts ?? 0;
  }

  /**
   * Consome o código de pareamento, aplica a localização confirmada NA FICHA (fonte de verdade)
   * e cria o vínculo — tudo ou nada. Pré-condições reconferidas aqui (sem await) para que
   * reivindicações simultâneas ou uma edição concorrente da ficha nunca produzam estado divergente.
   * `expectedVersion` null = ficha nova.
   */
  claimAtomic({ enrollmentId, codeHash, link, newEquipment, expectedVersion, location, historyEntry, nowMs, receipt = null }) {
    const e = this.enrollments.get(enrollmentId);
    if (!e) return { ok: false, reason: 'NOT_FOUND' };
    if (this.devices.get(e.device_id)?.state === 'revoked') return { ok: false, reason: 'DEVICE_REVOKED' }; // [SEMED R1]
    if (e.consumed_at) return { ok: false, reason: 'ALREADY_CONSUMED' };
    if (Date.parse(e.expires_at) <= nowMs) return { ok: false, reason: 'EXPIRED' };
    if (e.code_hash !== codeHash) return { ok: false, reason: 'BAD_CODE' };
    if (this.activeLinkByDevice.has(e.device_id)) return { ok: false, reason: 'DEVICE_ALREADY_LINKED' };
    if (this.activeLinkByEquipment.has(link.equipment_id)) return { ok: false, reason: 'EQUIPMENT_ALREADY_LINKED' };
    let eq;
    if (newEquipment) {
      if (this.equipment.has(newEquipment.id)) return { ok: false, reason: 'EQUIPMENT_ID_COLLISION' };
      eq = newEquipment;
    } else {
      eq = this.equipment.get(link.equipment_id);
      if (!eq) return { ok: false, reason: 'EQUIPMENT_NOT_FOUND' };
      if (eq.version !== expectedVersion) return { ok: false, reason: 'EQUIPMENT_VERSION_CONFLICT', current: eq };
    }
    // --- a partir daqui, somente escritas ---
    if (newEquipment) this.equipment.set(newEquipment.id, newEquipment);
    else {
      Object.assign(eq, location);
      eq.version += 1;
    }
    this.appendHistory(eq.id, { ...historyEntry, version_after: eq.version });
    e.consumed_at = new Date(nowMs).toISOString();
    e.code_hash = null; // código não pode mais ser usado
    this.links.set(link.link_id, link);
    this.activeLinkByDevice.set(e.device_id, link.link_id);
    this.activeLinkByEquipment.set(link.equipment_id, link.link_id);
    this.devices.get(e.device_id).state = 'linked';
    if (receipt) this.claimRequests.set(receipt.key, { body_hash: receipt.body_hash, status: receipt.status, body: receipt.body }); // [SEMED R2] mesmo passo atômico
    return { ok: true, equipment: eq };
  }

  /** Mudança explícita de localização da ficha, com controle de versão. Atômico. */
  updateLocationAtomic(equipmentId, expectedVersion, location, historyEntry) {
    const eq = this.equipment.get(equipmentId);
    if (!eq) return { ok: false, reason: 'EQUIPMENT_NOT_FOUND' };
    if (eq.version !== expectedVersion) return { ok: false, reason: 'EQUIPMENT_VERSION_CONFLICT', current: eq };
    Object.assign(eq, location);
    eq.version += 1;
    this.appendHistory(equipmentId, { ...historyEntry, version_after: eq.version });
    return { ok: true, equipment: eq };
  }

  appendHistory(equipmentId, entry) {
    const list = this.equipmentHistory.get(equipmentId) ?? [];
    list.push(entry);
    this.equipmentHistory.set(equipmentId, list);
  }

  async endOrphanLink(linkId, nowIso, reason) { const l = [...this.links.values()].find((x) => x.link_id === linkId && !x.ended_at); if (l) { l.ended_at = nowIso; l.end_reason = reason; } }

  getActiveLink(deviceId) {
    const id = this.activeLinkByDevice.get(deviceId);
    return id ? this.links.get(id) : undefined;
  }

  getActiveLinkForEquipment(equipmentId) {
    const id = this.activeLinkByEquipment.get(equipmentId);
    return id ? this.links.get(id) : undefined;
  }

  getLatestLinkForEquipment(equipmentId) {
    let last;
    for (const l of this.links.values()) if (l.equipment_id === equipmentId && (!last || l.linked_at > last.linked_at)) last = l;
    return last;
  }

  /** Grava a confirmação do agente uma única vez; devolve a data efetiva. */
  confirmLink(linkId, nowIso) {
    const l = this.links.get(linkId);
    if (!l) return null;
    l.device_confirmed_at ??= nowIso;
    return l.device_confirmed_at;
  }

  // ---------- identidade ----------
  getDevice(id) { return this.devices.get(id); }
  getInstallation(id) { return this.installations.get(id); }
  getKey(id) { return this.keys.get(id); }
  getInstallationForDevice(deviceId) { return [...this.installations.values()].find((i) => i.device_id === deviceId); }
  setInstallationVersion(installationId, version) {
    const i = this.installations.get(installationId);
    if (i) i.agent_version = version;
  }
  recordConflict(entry) { this.conflicts.push(entry); }

  // ---------- contagens (diagnóstico/testes) ----------
  countLinks() { return this.links.size; }
  countConflicts() { return this.conflicts.length; }
  countHeartbeats(deviceId) { return (this.heartbeats.get(deviceId) ?? []).length; }
  listHeartbeats(deviceId) { return [...(this.heartbeats.get(deviceId) ?? [])]; }
  countEquipment() { return this.equipment.size; }

  // ---------- idempotência de pedidos humanos ----------
  getClaimRequest(k) { return this.claimRequests.get(k); }
  putClaimRequest(k, v) { this.claimRequests.set(k, v); }
  getLocationRequest(k) { return this.locationRequests.get(k); }
  putLocationRequest(k, v) { this.locationRequests.set(k, v); }

  // ---------- catálogo do sistema (no D1: tabelas do próprio sistema, via mapeamento) ----------
  getUnit(id) { return this.units.get(id); }
  getEnvironment(id) { return this.environments.get(id); }
  getInspection(id) { return this.inspections.get(id); }
  getEquipment(id) { return this.equipment.get(id); }
  listUnits() { return [...this.units.values()]; }
  listEnvironments(unitId) { return [...this.environments.values()].filter((e) => e.unit_id === unitId); }
  listOpenInspections(unitId) { return [...this.inspections.values()].filter((i) => i.unit_id === unitId && i.state === 'open'); }
  listComputersInUnit(unitId, { cursor = null, limit = 50, q = '' } = {}) { // [SEMED R5] paginado, com vínculo ativo embutido
    const term = String(q || '').toLowerCase();
    const all = [...this.equipment.values()].filter((e) => e.unit_id === unitId && ['desktop', 'notebook'].includes(e.category) && (!term || [e.asset, e.serial].join(' ').toLowerCase().includes(term))).sort((a, b) => (a.id < b.id ? -1 : 1)).filter((e) => !cursor || e.id > cursor);
    const page = all.slice(0, limit).map((e) => ({ ...e, already_linked: this.activeLinkByEquipment.has(e.id) }));
    return Object.assign(page, { nextCursor: all.length > limit ? page.at(-1).id : null });
  }
  findEquipmentByAsset(asset) {
    for (const e of this.equipment.values()) if (e.asset === asset) return e;
    return undefined;
  }
  getEquipmentHistory(equipmentId, limit = 10) { return (this.equipmentHistory.get(equipmentId) ?? []).slice(-limit); }

  // ---------- sessão fictícia (somente simulado) ----------
  getSession(token) { return this.sessions.get(token); }
  createSession(token, sess) { this.sessions.set(token, sess); }
  getUser(id) { return this.users.get(id); }

  // ---------- revogação ----------
  revokeDevice(deviceId, nowIso, reason, by) {
    const d = this.devices.get(deviceId);
    if (!d) return false;
    d.state = 'revoked';
    d.revoked_at = nowIso;
    for (const inst of this.installations.values()) {
      if (inst.device_id !== deviceId) continue;
      inst.revoked_at ??= nowIso;
      for (const k of this.keys.values()) if (k.installation_id === inst.installation_id) k.status = 'revoked';
    }
    const linkId = this.activeLinkByDevice.get(deviceId);
    if (linkId) {
      const l = this.links.get(linkId);
      l.ended_at = nowIso;
      l.end_reason = 'revoked';
      this.activeLinkByDevice.delete(deviceId);
      this.activeLinkByEquipment.delete(l.equipment_id);
    }
    this.logAudit({ type: 'agent_revoked', device_id: deviceId, reason, by });
    return true;
  }

  // ---------- rotação de chave ----------
  rotateKeyAtomic(installationId, oldKeyId, newKey, overlapUntilIso) {
    const old = this.keys.get(oldKeyId);
    if (!old || old.status !== 'active') return { ok: false, reason: 'OLD_KEY_NOT_ACTIVE' };
    if (this.keys.has(newKey.key_id)) return { ok: false, reason: 'KEY_EXISTS' };
    old.status = 'retiring';
    old.valid_until = overlapUntilIso;
    this.keys.set(newKey.key_id, newKey);
    this.installations.get(installationId).current_key_id = newKey.key_id;
    return { ok: true };
  }

  /** Chamado ao primeiro uso da chave nova: encerra a sobreposição. */
  retireOtherKeys(installationId, activeKeyId, nowIso) {
    for (const k of this.keys.values()) {
      if (k.installation_id === installationId && k.key_id !== activeKeyId && k.status === 'retiring') {
        k.status = 'revoked';
        k.valid_until = nowIso;
      }
    }
  }

  // ---------- idempotência ----------
  getReceipt(deviceId, messageId) {
    return this.receipts.get(`${deviceId}|${messageId}`);
  }

  putReceipt(deviceId, messageId, receipt) {
    this.receipts.set(`${deviceId}|${messageId}`, receipt);
  }

  // ---------- presença / heartbeats ----------
  recordHeartbeat(deviceId, obs, maxKeep = 500) {
    const list = this.heartbeats.get(deviceId) ?? [];
    list.push(obs);
    if (list.length > maxKeep) list.splice(0, list.length - maxKeep);
    this.heartbeats.set(deviceId, list);
  }

  getPresence(deviceId) {
    return this.presence.get(deviceId);
  }

  setPresence(deviceId, p) {
    this.presence.set(deviceId, p);
  }
  // [SEMED R3] só grava se (boot_id, sequence) for mais novo que o estado atual no momento da escrita.
  setPresenceIfNewer(deviceId, p, { boot_id, sequence, collected_ms }) {
    const cur = this.presence.get(deviceId);
    const newer = !cur || !cur.boot_id || (cur.boot_id !== boot_id ? !cur.collected_ms || collected_ms > cur.collected_ms : sequence > (cur.sequence ?? 0));
    if (!newer) return false;
    this.presence.set(deviceId, p);
    return true;
  }
  touchPresenceReceived(deviceId, receivedAt) {
    const cur = this.presence.get(deviceId) ?? {};
    this.presence.set(deviceId, { ...cur, last_received_at: receivedAt });
  }

  // ---------- inventário ----------
  addSnapshot(snap) {
    this.snapshots.set(snap.inventory_id, snap);
    const list = this.snapshotsByDevice.get(snap.device_id) ?? [];
    list.push(snap.inventory_id);
    this.snapshotsByDevice.set(snap.device_id, list);
  }

  /** Registra lacunas de forma idempotente por gap_id. Devolve {added, duplicates, conflicts}. Atômico. */
  recordQueueGaps(deviceId, inventoryId, gaps, receivedAt) {
    const r = { added: 0, duplicates: 0, conflicts: 0 };
    for (const g of gaps ?? []) {
      const k = `${deviceId}|${g.gap_id}`;
      const prev = this.queueGaps.get(k);
      if (!prev) {
        this.queueGaps.set(k, { ...g, device_id: deviceId, first_reported_inventory_id: inventoryId, received_at: receivedAt });
        r.added++;
      } else if (prev.dropped_count === g.dropped_count && prev.dropped_change_count === g.dropped_change_count
        && prev.first_dropped_collected_at === g.first_dropped_collected_at && prev.last_dropped_collected_at === g.last_dropped_collected_at) {
        r.duplicates++;
      } else {
        r.conflicts++; // mantém o primeiro registro; divergência vai para auditoria
        this.logAudit({ type: 'queue_gap_conflict', device_id: deviceId, gap_id: g.gap_id });
      }
    }
    return r;
  }

  queueGapSummary(deviceId) {
    const list = [...this.queueGaps.values()].filter((g) => g.device_id === deviceId);
    if (!list.length) return null;
    return {
      gap_count: list.length,
      dropped_count: list.reduce((a, g) => a + g.dropped_count, 0),
      dropped_change_count: list.reduce((a, g) => a + g.dropped_change_count, 0),
      first_dropped_collected_at: list.map((g) => g.first_dropped_collected_at).sort()[0],
      last_dropped_collected_at: list.map((g) => g.last_dropped_collected_at).sort().at(-1),
      note: 'Inventários descartados pela fila do agente: o histórico desse período está incompleto.',
    };
  }

  getCurrentSnapshot(deviceId) {
    const id = this.currentSnapshot.get(deviceId);
    return id ? this.snapshots.get(id) : undefined;
  }

  getSnapshot(id) { return this.snapshots.get(id); }
  setCurrentSnapshot(deviceId, inventoryId) { this.currentSnapshot.set(deviceId, inventoryId); }
  getBaseline(deviceId) { return this.baseline.get(deviceId); }
  /** Define a linha de base só se ainda não existe. Devolve true se definiu. Atômico. */
  setBaselineIfAbsent(deviceId, b) {
    if (this.baseline.has(deviceId)) return false;
    this.baseline.set(deviceId, b);
    return true;
  }
  listSnapshots(deviceId, offset, limit) {
    const ids = this.snapshotsByDevice.get(deviceId) ?? [];
    return { items: ids.slice(offset, offset + limit).map((id) => this.snapshots.get(id)), total: ids.length };
  }
}
