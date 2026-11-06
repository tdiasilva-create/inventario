// NÚCLEO da API de agentes SEMED /api/agent/v1 (contrato 1.0) — cópia adaptada ao inventário SEMED.
// Origem: revisoes/agente-0.1.6-fonte/mock-server/src/worker.mjs (sha256 ab28afb1…). Alterações marcadas com [SEMED] e
// descritas em docs/04-dados-apis/CONTRATO_QR_E_AGENTE.md (R1–R5 da revisão 0.1.6 e perfis root/admin/operador/visualizador).
// NÚCLEO original — compartilhado pelo servidor
// simulado (MemoryStore) e pelo módulo para o sistema de inventário (D1Store, ver ../../modulo-servidor).
//
// - Formato de Cloudflare Worker (export default { fetch }), roda também em Node 22.
// - Todo acesso a dados passa pela interface ASSÍNCRONA do store (store.mjs = memória; d1-store.mjs = D1).
// - Sessão humana: função `auth` injetada. No simulado, sessão fictícia do seed; no sistema real,
//   o adaptador `sistema.mjs` usa a sessão/CSRF do próprio sistema.
// - Rotas humanas usam cookie de sessão + X-CSRF-Token + Origin (como as rotas reais);
//   rotas /api/agent/v1/* usam assinatura de máquina e NÃO exigem Origin, exceto
//   /api/agent/v1/pairings/* que são HUMANAS.

import {
  UUID_RE, B64URL_RE, sha256Hex, randomToken, timingSafeEqualStr, canonicalString,
  jwkThumbprint, importPublicJwk, verifyP1363, validatePublicJwk,
} from './crypto.mjs';
import { MemoryStore } from './store.mjs';
import { OPEN_ENROLLMENT, OPEN_PENDING_TTL_MS } from './enrollment-policy.mjs';
import {
  ValidationError, reqObj, reqStr, reqUuid, reqEnum, reqBool, reqInt, optStr, noExtraKeys,
  validateHeartbeat, validateInventory, validateSummary, isObj,
} from './validate.mjs';

export const PROTOCOL_VERSION = '1.0';
const AGENT = '/api/agent/v1';

export const DEFAULT_CONFIG = {
  humanOrigins: ['http://127.0.0.1:8787', 'http://localhost:8787'],
  clockSkewSeconds: 300,
  pairingTtlSeconds: 600,
  challengeTtlSeconds: 300,
  maxPairingFailures: 5,
  maxRenewals: 20,
  liveWindowSeconds: 120, // heartbeat só renova presença se coletado há <= isso
  heartbeatIntervalSeconds: 300,
  presenceToleranceSeconds: 120,
  keyOverlapSeconds: 900,
  receiptTtlSeconds: 7 * 24 * 3600,
  maxGrantUses: 1000,
  maxGrantTtlSeconds: 7 * 86400,
  requireInstallGrant: true, // D-058: produção seleciona false explicitamente nos dois Workers.
  ipHourlyLimit: 600, // [SEMED R4] desafios/cadastros por IP e hora (NAT de escola); abuso continua limitado por autorização e por IP
  // DECISÕES DE IMPLANTAÇÃO (ver 04-DECISOES.txt do pacote do desenvolvedor):
  requireInspection: true,   // vínculo exige vistoria ABERTA da unidade
  requireLock: false,        // [SEMED REV-03] exige trava de edição do coletor (lock_token) em claim/localização; ligado na integração
  allowNewEquipment: true,   // operador pode criar ficha nova (rascunho) no vínculo
  equipmentIdFormat: 'uuid', // 'uuid' | 'texto' (ids numéricos/textuais do sistema: 1–64 caracteres [A-Za-z0-9_.:-])
  limits: { heartbeat: 2048, inventory: 65536, default: 8192 },
  policy: {
    config_version: 1,
    heartbeat_interval_seconds: 300,
    heartbeat_jitter_percent: 20,
    inventory_interval_seconds: 21600,
    inventory_force_send_seconds: 86400,
    change_confirmation_delay_seconds: 90,
    performance_enabled: false,
    performance_interval_seconds: 600,
    collect_named_accounts: false,
    collect_network_addresses: false,
    collect_domain_name: false,
  },
};

// Faixas aceitas pelo agente; o servidor também nunca envia valores fora delas.
export const POLICY_BOUNDS = {
  heartbeat_interval_seconds: [60, 3600],
  heartbeat_jitter_percent: [0, 50],
  inventory_interval_seconds: [900, 7 * 86400],
  inventory_force_send_seconds: [3600, 30 * 86400],
  change_confirmation_delay_seconds: [30, 600],
  performance_interval_seconds: [300, 3600],
};

class ApiError extends Error {
  constructor(status, code, message, { retryable = false, headers = {}, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.headers = headers;
    this.details = details;
  }
}

/** JSON canônico (chaves ordenadas) para hash de conteúdo imutável. */
function canonicalJson(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(v[k])}`).join(',')}}`;
}

export { ApiError };

const VISUAL_ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY34679'; // sem 0/O, 1/I, 2/Z, 5/S, 8/B
function visualCode() {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  const chars = [...b].map((x) => VISUAL_ALPHABET[x % VISUAL_ALPHABET.length]);
  return `${chars.slice(0, 3).join('')}-${chars.slice(3).join('')}`;
}

function isoNow(ms) {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * `extensions` (somente desenvolvimento/testes, ver dev-routes.mjs):
 *   route(request, ctx) → Response | null   rotas extras (/dev/*)
 *   wrap(next, ctx)     → handler           ex.: injeção de falhas
 * O export padrão do Worker NÃO usa extensões, nem seed, nem rotas de desenvolvimento.
 */
export function createApp({ store = new MemoryStore(), now = () => Date.now(), config = {}, extensions = null, auth = null, pages = null } = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config, limits: { ...DEFAULT_CONFIG.limits, ...(config.limits ?? {}) }, policy: { ...DEFAULT_CONFIG.policy, ...(config.policy ?? {}) } };

  // ---------------------------------------------------------------- utilidades
  function json(status, body, headers = {}) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
    });
  }

  function errorResponse(err, correlationId) {
    const body = {
      code: err.code,
      message: err.message,
      retryable: !!err.retryable,
      correlation_id: correlationId,
      server_time: isoNow(now()),
    };
    if (err.details) body.details = err.details;
    return json(err.status, body, err.headers);
  }

  async function readBody(request, limit) {
    const ct = request.headers.get('content-type') ?? '';
    if (!/^application\/json(\s*;\s*charset=utf-8)?$/i.test(ct.trim())) {
      throw new ApiError(400, 'UNSUPPORTED_CONTENT_TYPE', 'Content-Type deve ser application/json');
    }
    const cl = request.headers.get('content-length');
    if (cl && Number(cl) > limit) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', `Corpo excede ${limit} bytes`);
    const buf = new Uint8Array(await request.arrayBuffer());
    if (buf.length > limit) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', `Corpo excede ${limit} bytes`);
    if (buf.length === 0) throw new ApiError(400, 'EMPTY_BODY', 'Corpo JSON obrigatório');
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(buf);
    } catch {
      throw new ApiError(400, 'INVALID_UTF8', 'Corpo deve ser UTF-8 válido');
    }
    if (text.charCodeAt(0) === 0xfeff) throw new ApiError(400, 'BOM_NOT_ALLOWED', 'Corpo não pode iniciar com BOM');
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      throw new ApiError(400, 'INVALID_JSON', 'JSON malformado');
    }
    if (!isObj(value)) throw new ApiError(400, 'INVALID_JSON', 'Corpo deve ser objeto JSON');
    return { bytes: buf, value };
  }

  async function rate(key, limit, windowSeconds) {
    const r = await store.hitRate(key, limit, windowSeconds * 1000, now());
    if (!r.ok) {
      throw new ApiError(429, 'RATE_LIMITED', 'Limite de requisições excedido', {
        retryable: true,
        headers: { 'retry-after': String(Math.max(1, r.retryAfter)) },
      });
    }
  }

  function clientIp(request) {
    return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-mock-client-ip') ?? 'local';
  }

  function checkTimestamp(tsHeader) {
    if (!/^\d{9,11}$/.test(tsHeader ?? '')) throw new ApiError(401, 'AUTH_FAILED', 'Cabeçalho de timestamp inválido');
    const ts = Number(tsHeader);
    const skew = Math.abs(now() / 1000 - ts);
    if (skew > cfg.clockSkewSeconds) {
      throw new ApiError(401, 'CLOCK_SKEW', 'Relógio do dispositivo fora da tolerância; compare com server_time', {
        retryable: true,
        details: { tolerance_seconds: cfg.clockSkewSeconds },
      });
    }
    return ts;
  }

  function checkNonceFormat(nonce) {
    if (typeof nonce !== 'string' || nonce.length < 22 || nonce.length > 64 || !B64URL_RE.test(nonce)) {
      throw new ApiError(401, 'AUTH_FAILED', 'Nonce inválido');
    }
  }

  function checkSigFormat(sig) {
    if (typeof sig !== 'string' || sig.length !== 86 || !B64URL_RE.test(sig)) {
      throw new ApiError(401, 'BAD_SIGNATURE_FORMAT', 'Assinatura deve ser P1363 (64 bytes) em base64url sem padding');
    }
  }

  async function verifySigned(request, path, bodyBytes, jwk, keyId) {
    const ts = request.headers.get('x-semed-timestamp');
    const nonce = request.headers.get('x-semed-nonce');
    const sig = request.headers.get('x-semed-signature');
    checkTimestamp(ts);
    checkNonceFormat(nonce);
    checkSigFormat(sig);
    const canonical = canonicalString(request.method, path, ts, nonce, await sha256Hex(bodyBytes));
    const key = await importPublicJwk(jwk);
    if (!(await verifyP1363(key, sig, canonical))) throw new ApiError(401, 'AUTH_FAILED', 'Assinatura inválida');
    // Nonce é registrado somente após assinatura válida (evita poluição por anônimos).
    const expires = now() + 2 * cfg.clockSkewSeconds * 1000 + 60_000;
    if (!(await store.useNonce(keyId, nonce, expires, now()))) throw new ApiError(401, 'REPLAY', 'Nonce já utilizado');
  }

  /** Autenticação de máquina para rotas /api/agent/v1 (exceto cadastro e pareamento humano). */
  async function authDevice(request, path, bodyBytes, { states }) {
    const auth = request.headers.get('authorization') ?? '';
    const m = /^SEMED-Device ([0-9a-f-]{36})$/.exec(auth);
    const installationId = request.headers.get('x-semed-installation');
    const keyId = request.headers.get('x-semed-key-id');
    if (!m || !UUID_RE.test(m[1]) || !UUID_RE.test(installationId ?? '') || !/^[A-Za-z0-9_-]{43}$/.test(keyId ?? '')) {
      throw new ApiError(401, 'AUTH_FAILED', 'Cabeçalhos de autenticação de dispositivo ausentes ou inválidos');
    }
    const deviceId = m[1];
    const [device, inst, key] = await Promise.all([store.getDevice(deviceId), store.getInstallation(installationId), store.getKey(keyId)]);
    if (!device || !inst || !key || inst.device_id !== deviceId || key.installation_id !== installationId) {
      throw new ApiError(401, 'AUTH_FAILED', 'Credencial de dispositivo não reconhecida');
    }
    if (device.state === 'revoked' || inst.revoked_at) throw new ApiError(403, 'REVOKED', 'Instalação revogada');
    if (key.status === 'revoked') throw new ApiError(401, 'KEY_REVOKED', 'Chave revogada ou substituída');
    if (key.status === 'retiring' && Date.parse(key.valid_until) <= now()) {
      throw new ApiError(401, 'KEY_REVOKED', 'Período de sobreposição da chave anterior encerrado');
    }
    await verifySigned(request, path, bodyBytes, key.jwk, keyId);
    if (device.state === 'pending_pairing' && await store.expireOpenPendingDevice(deviceId, now())) throw new ApiError(403, 'REVOKED', 'Cadastro sem vínculo expirado após 30 dias');
    if (key.status === 'active' && inst.current_key_id === keyId) await store.retireOtherKeys(installationId, keyId, isoNow(now()));
    if (!states.includes(device.state)) {
      if (device.state === 'pending_pairing') throw new ApiError(403, 'DEVICE_NOT_LINKED', 'Dispositivo ainda não vinculado a um equipamento');
      throw new ApiError(409, 'INVALID_STATE', `Operação não permitida no estado ${device.state}`);
    }
    return { device, inst, key };
  }

  // [SEMED REV-01] Ingestão só com vínculo ativo cuja ficha ainda existe. Ficha apagada (exclusão de unidade) ou vínculo
  // encerrado => 403 DEVICE_NOT_LINKED; o vínculo órfão é encerrado e auditado, nunca recriado por telemetria.
  async function requireLiveLink(device) {
    const link = await store.getActiveLink(device.device_id);
    if (!link) throw new ApiError(403, 'DEVICE_NOT_LINKED', 'Vínculo encerrado; aguarde novo pareamento');
    const eq = await store.getEquipment(link.equipment_id);
    if (!eq) {
      await store.endOrphanLink(link.link_id, isoNow(now()), 'equipment_missing');
      await store.logAudit({ type: 'link_ended_equipment_missing', device_id: device.device_id, link_id: link.link_id, equipment_id: link.equipment_id });
      throw new ApiError(403, 'DEVICE_NOT_LINKED', 'A ficha vinculada não existe mais; vínculo encerrado');
    }
    return { link, equipment: eq };
  }

  // [SEMED REV-02/REV-03] motivos da política compartilhada do coletor → erros legíveis.
  const POLICY_ERRORS = {
    UNIT_NOT_FOUND: [422, 'UNIT_NOT_FOUND', 'Unidade inexistente'],
    UNIT_INACTIVE: [422, 'UNIT_INACTIVE', 'Unidade inativa; localização e vínculo exigem unidade ativa'],
    INSPECTION_REQUIRED: [422, 'INSPECTION_CLOSED', 'Abra uma visita da unidade antes de alterar a ficha'],
    INSPECTION_NOT_IN_UNIT: [422, 'INSPECTION_NOT_IN_UNIT', 'Vistoria não pertence à unidade'],
    INSPECTION_CLOSED: [422, 'INSPECTION_CLOSED', 'Vistoria não está aberta'],
    LOCK_REQUIRED: [409, 'LOCK_REQUIRED', 'Obtenha a edição exclusiva da ficha (equipment-lock) antes de gravar'],
    EQUIPMENT_LOCKED: [409, 'EQUIPMENT_LOCKED', 'Outro usuário está editando esta ficha; aguarde a liberação'],
    SECTION_COMPLETED: [422, 'SECTION_COMPLETED', 'O assunto Computadores desta visita está concluído. Reabra-o no coletor (confirmação explícita) antes de vincular ou mover a ficha'], // [SEMED R2-B]
  };
  function throwPolicy(reason) { if (!reason) return; const [st, c, msg] = POLICY_ERRORS[reason] ?? [409, reason, 'Operação não permitida pela política da coleta']; throw new ApiError(st, c, msg); }

  function requireBodyInstallation(body, inst) {
    if (body.installation_id !== undefined && body.installation_id !== inst.installation_id) {
      throw new ApiError(422, 'INSTALLATION_MISMATCH', 'installation_id do corpo difere do autenticado');
    }
  }

  // ----------------------------------------------------- sessão humana
  /** Simulado: sessão fictícia (cookie semed_dev_session) guardada no MemoryStore. */
  async function mockSessionAuth(request, { csrf }) {
    const cookie = request.headers.get('cookie') ?? '';
    const m = /(?:^|;\s*)semed_dev_session=([A-Za-z0-9_-]{20,})/.exec(cookie);
    const sess = m ? await store.getSession(m[1]) : undefined;
    if (!sess || sess.expires_at < now()) throw new ApiError(401, 'SESSION_REQUIRED', 'Sessão humana obrigatória');
    const origin = request.headers.get('origin');
    if (csrf) {
      if (!origin || !cfg.humanOrigins.includes(origin)) throw new ApiError(403, 'ORIGIN_REJECTED', 'Origin não autorizada');
      const token = request.headers.get('x-csrf-token');
      if (!timingSafeEqualStr(token ?? '', sess.csrf)) throw new ApiError(403, 'CSRF_REJECTED', 'Token CSRF inválido');
    }
    const user = await store.getUser(sess.user_id);
    if (!user) throw new ApiError(401, 'SESSION_REQUIRED', 'Usuário inexistente');
    return user;
  }

  /**
   * Usuário humano = { id, name?, role: 'root'|'operador'|'visualizador', unit_ids: [...]|['*'] }.
   * `auth(request, { csrf, ApiError })` deve lançar ApiError 401/403 quando não autenticado/autorizado.
   */
  async function humanSession(request, opts) {
    const fn = auth ?? mockSessionAuth;
    const user = await fn(request, { ...opts, ApiError, cfg });
    if (!user || typeof user.id !== 'string' || !['root', 'admin', 'operador', 'visualizador'].includes(user.role) /* [SEMED] quatro perfis */ || !Array.isArray(user.unit_ids)) {
      throw new ApiError(401, 'SESSION_REQUIRED', 'Sessão humana obrigatória');
    }
    return user;
  }

  /** Id da ficha: UUID (padrão do contrato) ou texto curto, conforme o sistema (decisão de implantação). */
  function reqEquipmentId(v, name) {
    if (cfg.equipmentIdFormat === 'texto') {
      if (typeof v === 'number' && Number.isSafeInteger(v)) v = String(v);
      return reqStr(v, name, { min: 1, max: 64, re: /^[A-Za-z0-9_.:-]{1,64}$/ });
    }
    return reqUuid(v, name);
  }

  const canAccessUnit = (user, unitId) => user.unit_ids.includes('*') || user.unit_ids.includes(unitId);

  function requireRole(user, roles) {
    if (!roles.includes(user.role)) throw new ApiError(403, 'FORBIDDEN', 'Perfil sem permissão para esta operação');
  }

  // ------------------------------------------------------------ presença
  async function presenceView(deviceId) {
    const [device, p] = await Promise.all([store.getDevice(deviceId), store.getPresence(deviceId)]);
    const nowMs = now();
    const thresholdMs = (3 * cfg.heartbeatIntervalSeconds + cfg.presenceToleranceSeconds) * 1000;
    let state;
    if (!device) state = 'unknown';
    else if (device.state === 'revoked') state = 'revoked';
    else if (!p || !p.last_live_contact_at) state = 'never_communicated';
    else if (p.last_reason && ['shutdown', 'suspend'].includes(p.last_reason) && p.last_reason_at >= p.last_live_contact_at) {
      state = p.last_reason === 'shutdown' ? 'reported_shutdown' : 'reported_suspend';
    } else if (nowMs - Date.parse(p.last_live_contact_at) <= thresholdMs) {
      state = p.last_health_inventory && ['error', 'timeout'].includes(p.last_health_inventory) ? 'communicating_with_failure' : 'communicating';
    } else state = 'no_recent_communication';
    return {
      state,
      last_live_contact_at: p?.last_live_contact_at ?? null,
      last_observation_collected_at: p?.last_collected_at ?? null,
      last_received_at: p?.last_received_at ?? null,
      last_boot_id: p?.boot_id ?? null,
      last_sequence: p?.sequence ?? null,
      agent_version: p?.agent_version ?? null,
      health: p?.health ?? null,
      threshold_seconds: thresholdMs / 1000,
      note: 'Ausência de comunicação não prova que a máquina está desligada.',
    };
  }

  // --------------------------------------------------- idempotência (ACK)
  async function withReceipt(deviceId, messageId, bodyBytes, produceAck) {
    const bodyHash = await sha256Hex(bodyBytes);
    const prev = await store.getReceipt(deviceId, messageId);
    if (prev) {
      if (prev.body_hash !== bodyHash) {
        throw new ApiError(409, 'MESSAGE_ID_CONFLICT', 'message_id já recebido com conteúdo diferente');
      }
      return { ...prev.ack, duplicate: true };
    }
    // Os efeitos são idempotentes (snapshot imutável por inventory_id, lacuna por gap_id, presença
    // monotônica); o recibo é gravado por último. Falha no meio → o agente reenvia e o efeito não duplica.
    const ack = await produceAck();
    await store.putReceipt(deviceId, messageId, { body_hash: bodyHash, ack, expires_at: now() + cfg.receiptTtlSeconds * 1000 });
    return ack;
  }

  // ------------------------------------------------------------ rotas agente
  async function enrollmentChallenge(request) {
    const auth = request.headers.get('authorization') ?? '';
    const m = /^SEMED-Install-Grant ([A-Za-z0-9_-]{22,64})$/.exec(auth);
    await rate(`challenge-ip:${clientIp(request)}`, cfg.ipHourlyLimit, 3600); // [SEMED R4] lote atrás do mesmo IP
    if (cfg.requireInstallGrant && !m) throw new ApiError(401, 'INVALID_GRANT', 'Autorização de instalação ausente ou malformada');
    const { value: body } = await readBody(request, cfg.limits.default);
    noExtraKeys(body, 'body', ['protocol_version', 'request_id', 'agent_version']);
    reqEnum(body.protocol_version, 'protocol_version', [PROTOCOL_VERSION]);
    reqUuid(body.request_id, 'request_id');
    reqStr(body.agent_version, 'agent_version', { max: 32 });
    let grantId = OPEN_ENROLLMENT;
    if (cfg.requireInstallGrant) {
    const grant = await store.findGrantByHash(await sha256Hex(m[1]));
    if (!grant) throw new ApiError(401, 'INVALID_GRANT', 'Autorização de instalação não reconhecida');
    if (grant.revoked_at) throw new ApiError(403, 'GRANT_REVOKED', 'Autorização revogada');
    if (grantExhausted(grant)) throw new ApiError(409, 'GRANT_USED', grant.max_uses > 1 ? 'Autorização de lote esgotada' : 'Autorização já utilizada');
    if (Date.parse(grant.expires_at) <= now()) throw new ApiError(410, 'GRANT_EXPIRED', 'Autorização expirada');
    // Lote: limite por autorização proporcional ao número de usos (desafio + reenvios).
    await rate(`challenge-grant:${grant.grant_id}`, Math.max(10, 3 * (grant.max_uses ?? 1)), 3600);
    grantId = grant.grant_id;
    }
    const ch = {
      challenge_id: crypto.randomUUID(),
      grant_id: grantId,
      challenge: randomToken(32),
      created_at: isoNow(now()),
      expires_at: isoNow(now() + cfg.challengeTtlSeconds * 1000),
      used_by: null,
    };
    await store.createChallenge(ch);
    return json(200, {
      challenge_id: ch.challenge_id,
      challenge: ch.challenge,
      expires_at: ch.expires_at,
      server_time: isoNow(now()),
    });
  }

  async function issuePairingCode() {
    const code = randomToken(16); // 128 bits
    return { code, hash: await sha256Hex(code), visual: visualCode(), expires_at: isoNow(now() + cfg.pairingTtlSeconds * 1000) };
  }

  async function enrollments(request, path) {
    const auth = request.headers.get('authorization') ?? '';
    const m = /^SEMED-Enroll ([0-9a-f-]{36})$/.exec(auth);
    await rate(`enroll-ip:${clientIp(request)}`, cfg.ipHourlyLimit, 3600); // [SEMED R4]
    if (!m || !UUID_RE.test(m[1])) throw new ApiError(401, 'AUTH_FAILED', 'Cabeçalho SEMED-Enroll ausente ou inválido');
    const keyId = request.headers.get('x-semed-key-id') ?? '';
    const { bytes, value: body } = await readBody(request, cfg.limits.default);
    noExtraKeys(body, 'body', ['protocol_version', 'request_id', 'installation_id', 'challenge_id', 'challenge', 'public_key_jwk', 'agent_version', 'summary']);
    reqEnum(body.protocol_version, 'protocol_version', [PROTOCOL_VERSION]);
    reqUuid(body.request_id, 'request_id');
    reqUuid(body.installation_id, 'installation_id');
    reqUuid(body.challenge_id, 'challenge_id');
    reqStr(body.challenge, 'challenge', { max: 64, re: B64URL_RE });
    reqStr(body.agent_version, 'agent_version', { max: 32 });
    let jwk;
    try {
      jwk = validatePublicJwk(body.public_key_jwk);
    } catch (e) {
      throw new ValidationError('public_key_jwk', e.message);
    }
    validateSummary(body.summary);
    if (body.challenge_id !== m[1]) throw new ApiError(422, 'CHALLENGE_MISMATCH', 'challenge_id do corpo difere do cabeçalho');
    if ((await jwkThumbprint(jwk)) !== keyId) throw new ApiError(422, 'KEY_ID_MISMATCH', 'X-SEMED-Key-Id deve ser o thumbprint RFC 7638 da chave');

    const ch = await store.getChallenge(body.challenge_id);
    if (!ch || !timingSafeEqualStr(ch.challenge, body.challenge)) throw new ApiError(401, 'AUTH_FAILED', 'Desafio inválido');
    if (Date.parse(ch.expires_at) <= now()) throw new ApiError(410, 'CHALLENGE_EXPIRED', 'Desafio expirado; solicite outro');
    await verifySigned(request, path, bytes, jwk, keyId);
    const openEnrollment = ch.grant_id === OPEN_ENROLLMENT;
    if (openEnrollment && cfg.requireInstallGrant) throw new ApiError(403, 'GRANT_REQUIRED', 'Cadastro automático desabilitado; solicite autorização');

    // Reenvio da mesma instalação com a mesma chave (ex.: timeout após gravação).
    const existingInst = await store.getInstallation(body.installation_id);
    if (existingInst) {
      const k = await store.getKey(keyId);
      if (k && k.installation_id === existingInst.installation_id) {
        const enr = await store.getEnrollmentForDevice(existingInst.device_id);
        const dev = await store.getDevice(existingInst.device_id);
        if (!dev || dev.state === 'revoked' || existingInst.revoked_at || k.status === 'revoked' ||
            (k.status === 'retiring' && Date.parse(k.valid_until) <= now()) || await store.expireOpenPendingDevice(dev.device_id, now())) {
          throw new ApiError(403, 'REVOKED', 'Identidade revogada ou cadastro sem vínculo expirado');
        }
        return json(200, {
          device_id: dev.device_id,
          enrollment_id: enr.enrollment_id,
          state: dev.state,
          pairing_code: null,
          visual_code: null,
          expires_at: enr.expires_at,
          renew_required: dev.state === 'pending_pairing',
          server_time: isoNow(now()),
        });
      }
      await store.recordConflict({ at: isoNow(now()), type: 'installation_id_reused_with_other_key', installation_id: body.installation_id });
      throw new ApiError(409, 'IDENTITY_CONFLICT', 'installation_id já registrado com outra chave (possível clonagem de imagem)');
    }
    if (await store.getKey(keyId)) {
      await store.recordConflict({ at: isoNow(now()), type: 'key_reused', key_id: keyId });
      throw new ApiError(409, 'IDENTITY_CONFLICT', 'Chave já registrada por outra instalação (possível clonagem)');
    }

    if (!openEnrollment) {
    const grant = await store.getGrant(ch.grant_id);
    if (!grant || grant.revoked_at) throw new ApiError(403, 'GRANT_REVOKED', 'Autorização revogada');
    if (Date.parse(grant.expires_at) <= now()) throw new ApiError(410, 'GRANT_EXPIRED', 'Autorização expirada');
    }

    const pc = await issuePairingCode();
    const nowIso = isoNow(now());
    const deviceId = crypto.randomUUID();
    const enrollmentId = crypto.randomUUID();
    const res = await store.createEnrollmentAtomic({
      challengeId: ch.challenge_id,
      grantId: ch.grant_id,
      openEnrollment,
      nowIso,
      device: { device_id: deviceId, state: 'pending_pairing', created_at: nowIso },
      installation: {
        installation_id: body.installation_id, device_id: deviceId, created_at: nowIso,
        agent_version: body.agent_version, current_key_id: keyId, revoked_at: null,
      },
      key: { key_id: keyId, installation_id: body.installation_id, jwk, status: 'active', created_at: nowIso },
      enrollment: {
        enrollment_id: enrollmentId, device_id: deviceId, grant_id: ch.grant_id, created_at: nowIso,
        code_hash: pc.hash, visual_code: pc.visual, expires_at: pc.expires_at, failed_attempts: 0,
        consumed_at: null, summary: body.summary,
      },
    });
    if (!res.ok) {
      const map = {
        CHALLENGE_USED: [409, 'CHALLENGE_USED', 'Desafio já utilizado'],
        GRANT_USED: [409, 'GRANT_USED', 'Autorização já utilizada ou lote esgotado'],
        INSTALLATION_EXISTS: [409, 'IDENTITY_CONFLICT', 'Instalação já registrada'],
        KEY_EXISTS: [409, 'IDENTITY_CONFLICT', 'Chave já registrada'],
      };
      const [s, c, msg] = map[res.reason];
      throw new ApiError(s, c, msg);
    }
    await store.logAudit({ type: 'enrollment_created', device_id: deviceId, enrollment_id: enrollmentId, grant_id: ch.grant_id });
    return json(201, {
      device_id: deviceId,
      enrollment_id: enrollmentId,
      state: 'pending_pairing',
      pairing_code: pc.code,
      visual_code: pc.visual,
      expires_at: pc.expires_at,
      renew_required: false,
      poll_after_seconds: 10,
      server_time: nowIso,
    });
  }

  /** Localização OFICIAL vem da ficha (fonte de verdade); o vínculo não guarda cópia. */
  async function officialLocation(eq) {
    if (!eq) return null;
    const [unit, env] = await Promise.all([store.getUnit(eq.unit_id), eq.environment_id ? store.getEnvironment(eq.environment_id) : null]);
    return {
      unit_id: eq.unit_id,
      unit_name: unit?.name ?? null,
      environment_id: eq.environment_id,
      environment_name: env?.name ?? null,
      position_label: eq.position_label ?? null,
      position_description: eq.position_description ?? null,
      location_state: eq.location_state ?? 'declarada',
      location_confirmed_by: eq.location_confirmed_by ?? null,
      location_confirmed_at: eq.location_confirmed_at ?? null,
      equipment_version: eq.version,
      provenance: 'ficha_patrimonial',
    };
  }

  async function linkView(link) {
    if (!link) return null;
    const loc = await officialLocation(await store.getEquipment(link.equipment_id));
    return {
      link_id: link.link_id,
      equipment_id: link.equipment_id,
      unit_name: loc?.unit_name ?? null,
      environment_name: loc?.environment_name ?? null,
      position_label: loc?.position_label ?? null,
      linked_at: link.linked_at,
      device_confirmed_at: link.device_confirmed_at ?? null,
    };
  }

  async function enrollmentStatus(request, path) {
    const { bytes, value: body } = await readBody(request, cfg.limits.default);
    const { device, inst } = await authDevice(request, path, bytes, { states: ['pending_pairing', 'linked'] });
    noExtraKeys(body, 'body', ['protocol_version', 'request_id', 'installation_id']);
    reqUuid(body.request_id, 'request_id');
    requireBodyInstallation(body, inst);
    await rate(`status:${device.device_id}`, 120, 3600);
    const enr = await store.getEnrollmentForDevice(device.device_id);
    let state = device.state;
    if (state === 'pending_pairing' && Date.parse(enr.expires_at) <= now()) state = 'pairing_expired';
    return json(200, {
      device_id: device.device_id,
      enrollment_id: enr.enrollment_id,
      state,
      expires_at: device.state === 'pending_pairing' ? enr.expires_at : null,
      link: await linkView(await store.getActiveLink(device.device_id)),
      server_time: isoNow(now()),
    });
  }

  async function enrollmentRenew(request, path) {
    const { bytes, value: body } = await readBody(request, cfg.limits.default);
    const { device, inst } = await authDevice(request, path, bytes, { states: ['pending_pairing'] });
    noExtraKeys(body, 'body', ['protocol_version', 'request_id', 'installation_id']);
    reqUuid(body.request_id, 'request_id');
    requireBodyInstallation(body, inst);
    const enr = await store.getEnrollmentForDevice(device.device_id);
    if ((enr.renewals ?? 0) >= cfg.maxRenewals) throw new ApiError(429, 'RENEWAL_LIMIT', 'Limite de renovações atingido; contate o root');
    await rate(`renew:${device.device_id}`, 6, 600);
    const pc = await issuePairingCode();
    if (!await store.renewPairing(enr.enrollment_id, pc.hash, pc.visual, pc.expires_at)) {
      throw new ApiError(409, 'ALREADY_LINKED', 'Pedido já consumido');
    }
    return json(200, {
      device_id: device.device_id,
      enrollment_id: enr.enrollment_id,
      state: 'pending_pairing',
      pairing_code: pc.code,
      visual_code: pc.visual,
      expires_at: pc.expires_at,
      server_time: isoNow(now()),
    });
  }

  async function checkPairingCode(enr, code) {
    if (!enr) throw new ApiError(404, 'ENROLLMENT_NOT_FOUND', 'Pedido de pareamento não encontrado');
    if (enr.grant_id === OPEN_ENROLLMENT && Date.parse(enr.created_at) + OPEN_PENDING_TTL_MS <= now()) {
      if (await store.expireOpenPendingDevice(enr.device_id, now())) throw new ApiError(403, 'DEVICE_REVOKED', 'Cadastro sem vínculo expirado após 30 dias');
    }
    const dev = await store.getDevice(enr.device_id); // [SEMED R1] QR de agente revogado não pareia
    if (!dev || dev.state === 'revoked') throw new ApiError(403, 'DEVICE_REVOKED', 'Agente revogado; o QR não pode ser usado');
    if (enr.consumed_at) throw new ApiError(410, 'PAIRING_CONSUMED', 'QR já utilizado');
    if (Date.parse(enr.expires_at) <= now()) throw new ApiError(410, 'PAIRING_EXPIRED', 'QR expirado; renove na máquina');
    if ((enr.failed_attempts ?? 0) >= cfg.maxPairingFailures) throw new ApiError(429, 'PAIRING_LOCKED', 'Tentativas excedidas; renove o QR na máquina');
    const hash = await sha256Hex(code);
    if (!enr.code_hash || !timingSafeEqualStr(hash, enr.code_hash)) {
      await store.registerFailedPairingAttempt(enr.enrollment_id);
      throw new ApiError(422, 'PAIRING_CODE_INVALID', 'Código de pareamento inválido');
    }
    return hash;
  }

  function maskSerial(serial) {
    if (!serial) return null;
    return serial.length <= 4 ? '••••' : `••••${serial.slice(-4)}`;
  }

  async function pairingPreview(request, user) {
    const { value: body } = await readBody(request, cfg.limits.default);
    noExtraKeys(body, 'body', ['enrollment_id', 'pairing_code', 'unit_id']);
    reqUuid(body.enrollment_id, 'enrollment_id');
    reqStr(body.pairing_code, 'pairing_code', { min: 22, max: 64, re: B64URL_RE });
    const unitId = optStr(body.unit_id, 'unit_id', { max: 64 });
    await rate(`preview-user:${user.id}`, 60, 600);
    const enr = await store.getEnrollment(body.enrollment_id);
    await checkPairingCode(enr, body.pairing_code);
    const s = enr.summary;
    // Sinais de conciliação: SUGESTÕES, nunca união automática.
    const suggestions = [];
    if (unitId && canAccessUnit(user, unitId)) {
      // [SEMED R5] uma consulta paginada com vínculo ativo embutido; ambientes resolvidos uma única vez.
      const [computers, environments, unit] = await Promise.all([store.listComputersInUnit(unitId, { limit: 50, q: '' }), store.listEnvironments(unitId), store.getUnit(unitId)]);
      const envName = new Map(environments.map((e) => [e.environment_id, e.name]));
      for (const eq of computers) {
        const reasons = [];
        if (eq.serial && s.serial_hint && eq.serial.endsWith(s.serial_hint.replace(/[*•]/g, ''))) reasons.push('final_da_serie_coincide');
        suggestions.push({
          equipment_id: eq.id,
          asset: eq.asset,
          category: eq.category,
          version: eq.version,
          brand: eq.brand ?? null,
          model: eq.model ?? null,
          registration: eq.registration ?? null,
          location: { unit_id: eq.unit_id, unit_name: unit?.name ?? null, environment_id: eq.environment_id, environment_name: envName.get(eq.environment_id) ?? null, position_label: eq.position_label ?? null, location_state: eq.location_state ?? 'declarada' },
          already_linked: !!eq.already_linked,
          reasons,
        });
      }
    }
    return json(200, {
      enrollment_id: enr.enrollment_id,
      visual_code: enr.visual_code,
      expires_at: enr.expires_at,
      summary: s,
      equipment_suggestions: suggestions,
      server_time: isoNow(now()),
    });
  }

  /**
   * Regra de localização (correção do achado 3.1 da revisão 0.1.0):
   * - A FICHA é a fonte de verdade de unidade/ambiente/posição. O vínculo não guarda localização.
   * - Ficha existente: exige `expected_version` (o que o operador viu). Se o ambiente ou a posição
   *   informados diferem da ficha, exige `location_change {confirmed:true, reason}` e a ficha é
   *   atualizada NA MESMA operação atômica do vínculo, com versão, antes/depois, motivo e autoria.
   *   Sem isso: 409 LOCATION_MISMATCH. Versão desatualizada: 409 EQUIPMENT_VERSION_CONFLICT.
   * - Mudança de UNIDADE nunca acontece pelo claim (fluxo root).
   */
  async function pairingClaim(request, user) {
    requireRole(user, ['operador', 'admin', 'root']); // [SEMED] escrita de coleta: root/admin/operador
    const { bytes, value: body } = await readBody(request, cfg.limits.default);
    noExtraKeys(body, 'body', ['request_id', 'enrollment_id', 'pairing_code', 'unit_id', 'environment_id', 'inspection_id', 'equipment', 'position', 'location_change', 'visual_code_confirmed', 'lock_token']);
    reqUuid(body.request_id, 'request_id');
    if (cfg.requireLock || body.lock_token !== undefined) reqStr(body.lock_token, 'lock_token', { max: 64 }); // [SEMED REV-03]
    // Idempotência por usuário + request_id.
    const bodyHash = await sha256Hex(bytes);
    const reqKey = `${user.id}|${body.request_id}`;
    const prior = await store.getClaimRequest(reqKey);
    if (prior) {
      if (prior.body_hash !== bodyHash) throw new ApiError(409, 'REQUEST_ID_CONFLICT', 'request_id reutilizado com outro conteúdo');
      return json(prior.status, { ...prior.body, duplicate: true });
    }
    reqUuid(body.enrollment_id, 'enrollment_id');
    reqStr(body.pairing_code, 'pairing_code', { min: 22, max: 64, re: B64URL_RE });
    reqStr(body.unit_id, 'unit_id', { max: 64 });
    reqStr(body.environment_id, 'environment_id', { max: 64 });
    if (cfg.requireInspection || (body.inspection_id !== undefined && body.inspection_id !== null)) reqStr(body.inspection_id, 'inspection_id', { max: 64 });
    const v3Inspection=body.inspection_id?await store.getInspection(body.inspection_id):null;
    const simplified=v3Inspection?.questionnaire_version==='coleta-3.0';
    if (!simplified && reqBool(body.visual_code_confirmed, 'visual_code_confirmed') !== true) {
      throw new ApiError(422, 'VISUAL_CODE_NOT_CONFIRMED', 'Operador deve confirmar o código visual exibido na máquina');
    }
    reqObj(body.equipment, 'equipment');
    reqEnum(body.equipment.mode, 'equipment.mode', ['existing', 'new']);
    if (body.equipment.mode === 'new' && !cfg.allowNewEquipment) {
      throw new ApiError(422, 'NEW_EQUIPMENT_DISABLED', 'Criação de ficha pelo vínculo está desativada neste sistema; use uma ficha existente');
    }
    const pos = reqObj(body.position, 'position');
    noExtraKeys(pos, 'position', ['label', 'description']);
    reqStr(pos.label, 'position.label', { max: 64 });
    optStr(pos.description, 'position.description', { max: 280 });
    let locationChange = null;
    if (body.location_change !== undefined && body.location_change !== null) {
      locationChange = reqObj(body.location_change, 'location_change');
      noExtraKeys(locationChange, 'location_change', ['confirmed', 'reason']);
      if (reqBool(locationChange.confirmed, 'location_change.confirmed') !== true) throw new ValidationError('location_change.confirmed', 'deve ser true');
      if(!simplified)reqStr(locationChange.reason, 'location_change.reason', { min: 5, max: 280 });else optStr(locationChange.reason,'location_change.reason',{max:280});
    }
    await rate(`claim-user:${user.id}`, 30, 600);
    // [SEMED] QR consumido/expirado/revogado é diagnosticado ANTES das verificações de ficha, para o operador receber o motivo certo.
    const enr = await store.getEnrollment(body.enrollment_id);
    const codeHash = await checkPairingCode(enr, body.pairing_code);

    const unit = await store.getUnit(body.unit_id);
    if (!unit) throw new ApiError(422, 'UNIT_NOT_FOUND', 'Unidade inexistente');
    if (!canAccessUnit(user, unit.unit_id)) throw new ApiError(403, 'UNIT_FORBIDDEN', 'Usuário sem autorização para esta unidade');
    if (!unit.active) throw new ApiError(422, 'UNIT_INACTIVE', 'Unidade inativa');
    const env = await store.getEnvironment(body.environment_id);
    if (!env || env.unit_id !== unit.unit_id) throw new ApiError(422, 'ENVIRONMENT_NOT_IN_UNIT', 'Ambiente não pertence à unidade');
    let insp = null;
    if (body.inspection_id) {
      insp = await store.getInspection(body.inspection_id);
      if (!insp || insp.unit_id !== unit.unit_id) throw new ApiError(422, 'INSPECTION_NOT_IN_UNIT', 'Vistoria não pertence à unidade');
      if (insp.state !== 'open') throw new ApiError(422, 'INSPECTION_CLOSED', 'Vistoria não está aberta');
    }
    // [SEMED REV-03] mesma política do coletor (unidade ativa, visita aberta, trava do próprio usuário), também DENTRO do batch.
    const policy = cfg.requireLock ? { unitId: unit.unit_id, inspectionId: insp?.inspection_id ?? null, equipmentId: body.equipment?.equipment_id, userId: user.id, lockToken: body.lock_token } : null;

    const nowMs = now();
    const nowIso = isoNow(nowMs);
    const after = {
      environment_id: env.environment_id,
      position_label: pos.label,
      position_description: pos.description ?? null,
      location_state: 'confirmada_em_visita',
      location_confirmed_by: user.id,
      location_confirmed_at: nowIso,
    };
    let equipmentId;
    let newEquipment = null;
    let expectedVersion = null;
    let historyEntry;
    if (body.equipment.mode === 'existing') {
      noExtraKeys(body.equipment, 'equipment', ['mode', 'equipment_id', 'expected_version']);
      equipmentId = reqEquipmentId(body.equipment.equipment_id, 'equipment.equipment_id');
      expectedVersion = reqInt(body.equipment.expected_version, 'equipment.expected_version', { min: 1 });
      const eq = await store.getEquipment(equipmentId);
      if (!eq) throw new ApiError(422, 'EQUIPMENT_NOT_FOUND', 'Equipamento inexistente');
      if (eq.unit_id !== unit.unit_id) {
        throw new ApiError(409, 'EQUIPMENT_IN_OTHER_UNIT', 'Equipamento pertence a outra unidade; transferência é fluxo root');
      }
      if (!(simplified?['computer','desktop','notebook']:['desktop','notebook']).includes(eq.category)) throw new ApiError(422, 'EQUIPMENT_CATEGORY', 'Equipamento não é computador');
      if (policy) throwPolicy(await store.checkPolicy?.({ ...policy, equipmentId, nowMs }));
      if (eq.version !== expectedVersion) {
        throw new ApiError(409, 'EQUIPMENT_VERSION_CONFLICT', 'A ficha foi alterada desde a conferência; recarregue e confira novamente', { details: { current_version: eq.version, current_location: await officialLocation(eq) } });
      }
      const envDiffers = eq.environment_id !== env.environment_id;
      const posDiffers = eq.position_label != null && eq.position_label !== pos.label;
      if ((envDiffers || posDiffers) && !locationChange && !simplified) {
        throw new ApiError(409, 'LOCATION_MISMATCH', 'Ambiente/posição informados diferem da ficha. Confirme a mudança de localização com motivo, ou use a localização atual.', {
          details: { current_location: await officialLocation(eq), requested: { environment_id: env.environment_id, position_label: pos.label } },
        });
      }
      const before = { environment_id: eq.environment_id, position_label: eq.position_label ?? null, position_description: eq.position_description ?? null, location_state: eq.location_state };
      historyEntry = {
        at: nowIso, by: user.id, source: 'pairing_claim', inspection_id: insp?.inspection_id ?? null, version_before: eq.version,
        kind: envDiffers || posDiffers ? 'mudanca_de_localizacao' : eq.position_label == null ? 'posicao_definida_e_confirmada' : 'localizacao_confirmada',
        reason: locationChange?.reason ?? null, before, after: { ...after },
      };
    } else {
      noExtraKeys(body.equipment, 'equipment', ['mode', 'asset', 'category']);
      const asset = optStr(body.equipment.asset, 'equipment.asset', { max: 64 });
      const category = body.equipment.category === undefined ? 'desktop' : reqEnum(body.equipment.category, 'equipment.category', ['desktop', 'notebook']);
      if (asset) {
        const dup = await store.findEquipmentByAsset(asset);
        if (dup) throw new ApiError(409, 'ASSET_EXISTS', 'Patrimônio já cadastrado; use a ficha existente ou concilie', { details: { equipment_id: dup.id } });
      }
      // No sistema real, a ficha nova passa pelo fluxo autorizado do coletor (validação, autoria, contagem, histórico).
      equipmentId = crypto.randomUUID();
      newEquipment = {
        id: equipmentId, unit_id: unit.unit_id, category, asset, serial: null, status: 'rascunho', version: 1,
        created_by: user.id, inspection_id: insp?.inspection_id ?? null, ...after,
      };
      historyEntry = { at: nowIso, by: user.id, source: 'pairing_claim', inspection_id: insp?.inspection_id ?? null, version_before: 0, kind: 'ficha_criada', reason: null, before: null, after: { ...after } };
    }

    const link = {
      link_id: crypto.randomUUID(),
      device_id: enr.device_id,
      equipment_id: equipmentId,
      inspection_id: insp?.inspection_id ?? null,
      linked_by: user.id,
      linked_at: nowIso,
      device_confirmed_at: null,
      ended_at: null,
    };
    // [SEMED R2] a resposta é determinística (versão esperada + 1) e o recibo entra no mesmo batch do vínculo.
    const plannedVersion = newEquipment ? newEquipment.version : expectedVersion + 1;
    const planned = {
      link_id: link.link_id, device_id: link.device_id, equipment_id: equipmentId, equipment_created: !!newEquipment,
      equipment_status: newEquipment ? 'rascunho_parcial' : null, equipment_version: plannedVersion, unit_id: unit.unit_id, environment_id: env.environment_id,
      position: { label: pos.label, description: pos.description ?? null }, location_state: 'confirmada_em_visita',
      location_change_applied: historyEntry.kind === 'mudanca_de_localizacao', linked_by: user.id, linked_at: link.linked_at, duplicate: false,
    };
    const r = await store.claimAtomic({ enrollmentId: enr.enrollment_id, codeHash, link, newEquipment, expectedVersion, location: after, historyEntry, nowMs, receipt: { key: reqKey, body_hash: bodyHash, status: 201, body: planned }, actor: user.id, unitId: unit.unit_id, policy: policy && { ...policy, equipmentId } });
    if (!r.ok) {
      const map = {
        ALREADY_CONSUMED: [410, 'PAIRING_CONSUMED', 'QR já utilizado'],
        EXPIRED: [410, 'PAIRING_EXPIRED', 'QR expirado'],
        BAD_CODE: [422, 'PAIRING_CODE_INVALID', 'Código substituído por renovação'],
        DEVICE_ALREADY_LINKED: [409, 'DEVICE_ALREADY_LINKED', 'Dispositivo já vinculado'],
        DEVICE_REVOKED: [403, 'DEVICE_REVOKED', 'Agente revogado durante o vínculo; nada foi gravado'], // [SEMED R1]
        EQUIPMENT_ALREADY_LINKED: [409, 'EQUIPMENT_ALREADY_LINKED', 'Equipamento já possui agente ativo; use reconciliação root'],
        EQUIPMENT_VERSION_CONFLICT: [409, 'EQUIPMENT_VERSION_CONFLICT', 'A ficha foi alterada durante o vínculo; recarregue e confira novamente'],
        EQUIPMENT_NOT_FOUND: [422, 'EQUIPMENT_NOT_FOUND', 'Equipamento inexistente'],
        EQUIPMENT_ID_COLLISION: [503, 'RETRY', 'Colisão de ID, tente novamente'],
        NOT_FOUND: [404, 'ENROLLMENT_NOT_FOUND', 'Pedido não encontrado'],
        ...POLICY_ERRORS, // [SEMED REV-03]
      };
      const [st, c, msg] = map[r.reason];
      throw new ApiError(st, c, msg, { retryable: st === 503, details: r.current ? { current_version: r.current.version, current_location: await officialLocation(r.current) } : undefined });
    }
    const eq = r.equipment;
    await store.logAudit({ type: 'pairing_claimed', by: user.id, device_id: enr.device_id, equipment_id: equipmentId, unit_id: unit.unit_id, environment_id: env.environment_id, equipment_version: eq.version });
    const out = { ...planned, equipment_status: newEquipment ? 'rascunho_parcial' : eq.status, equipment_version: eq.version };
    return json(201, out);
  }

  /**
   * Mudança EXPLÍCITA de ambiente/posição dentro da MESMA unidade, pelo fluxo autorizado,
   * com versão esperada, motivo, antes/depois e autoria. Mudança de unidade: fluxo root (não implementado).
   */
  async function equipmentLocation(request, user) {
    requireRole(user, ['operador', 'admin', 'root']); // [SEMED]
    const { bytes, value: body } = await readBody(request, cfg.limits.default);
    noExtraKeys(body, 'body', ['request_id', 'equipment_id', 'expected_version', 'environment_id', 'position', 'reason', 'inspection_id', 'lock_token']);
    reqUuid(body.request_id, 'request_id');
    if (cfg.requireInspection || body.inspection_id !== undefined) reqStr(body.inspection_id, 'inspection_id', { max: 64 }); // [SEMED REV-02]
    if (cfg.requireLock || body.lock_token !== undefined) reqStr(body.lock_token, 'lock_token', { max: 64 });
    const bodyHash = await sha256Hex(bytes);
    const reqKey = `${user.id}|${body.request_id}`;
    const prior = await store.getLocationRequest(reqKey);
    if (prior) {
      if (prior.body_hash !== bodyHash) throw new ApiError(409, 'REQUEST_ID_CONFLICT', 'request_id reutilizado com outro conteúdo');
      return json(prior.status, { ...prior.body, duplicate: true });
    }
    const equipmentId = reqEquipmentId(body.equipment_id, 'equipment_id');
    const expectedVersion = reqInt(body.expected_version, 'expected_version', { min: 1 });
    reqStr(body.environment_id, 'environment_id', { max: 64 });
    const pos = reqObj(body.position, 'position');
    noExtraKeys(pos, 'position', ['label', 'description']);
    reqStr(pos.label, 'position.label', { max: 64 });
    optStr(pos.description, 'position.description', { max: 280 });
    const reasonInspection=body.inspection_id?await store.getInspection(body.inspection_id):null;
    if(reasonInspection?.questionnaire_version==='coleta-3.0')optStr(body.reason,'reason',{max:280});else reqStr(body.reason, 'reason', { min: 5, max: 280 });
    const eq = await store.getEquipment(equipmentId);
    if (!eq) throw new ApiError(404, 'EQUIPMENT_NOT_FOUND', 'Equipamento não encontrado');
    if (!canAccessUnit(user, eq.unit_id)) throw new ApiError(403, 'UNIT_FORBIDDEN', 'Sem acesso à unidade');
    const env = await store.getEnvironment(body.environment_id);
    if (!env) throw new ApiError(422, 'ENVIRONMENT_NOT_FOUND', 'Ambiente inexistente');
    if (env.unit_id !== eq.unit_id) throw new ApiError(409, 'TRANSFER_REQUIRES_ROOT', 'Mudança de escola é fluxo administrativo root');
    // [SEMED REV-02] visita aberta da unidade + trava do próprio usuário + unidade ativa (pré-verificação legível; o batch decide).
    let insp = null;
    if (body.inspection_id) {
      insp = await store.getInspection(body.inspection_id);
      if (!insp || insp.unit_id !== eq.unit_id) throw new ApiError(422, 'INSPECTION_NOT_IN_UNIT', 'Vistoria não pertence à unidade');
      if (insp.state !== 'open') throw new ApiError(422, 'INSPECTION_CLOSED', 'Vistoria não está aberta');
    }
    const policy = cfg.requireLock ? { unitId: eq.unit_id, inspectionId: insp?.inspection_id ?? null, equipmentId, userId: user.id, lockToken: body.lock_token } : null;
    const nowMs = now();
    if (policy) throwPolicy(await store.checkPolicy?.({ ...policy, nowMs }));
    const nowIso = isoNow(nowMs);
    // Posição informada pelo humano na visita: confirmada em visita (quem, quando); o modo de cadastro NÃO muda aqui.
    const after = { environment_id: env.environment_id, position_label: pos.label, position_description: pos.description ?? null, location_state: 'confirmada_em_visita', location_confirmed_by: user.id, location_confirmed_at: nowIso };
    const historyEntry = {
      at: nowIso, by: user.id, source: 'equipment_location', inspection_id: insp?.inspection_id ?? null, version_before: expectedVersion, kind: eq.environment_id !== env.environment_id ? 'mudanca_de_localizacao' : 'localizacao_confirmada', reason: body.reason,
      before: { environment_id: eq.environment_id, position_label: eq.position_label ?? null, position_description: eq.position_description ?? null, location_state: eq.location_state, registration: eq.registration ?? null },
      after: { ...after, registration: eq.registration ?? null },
    };
    const planned = { equipment_id: equipmentId, equipment_version: expectedVersion + 1, location: { ...after, environment_name: env.name ?? null }, duplicate: false };
    const r = await store.updateLocationAtomic(equipmentId, expectedVersion, after, historyEntry, { policy, receipt: { key: reqKey, body_hash: bodyHash, status: 200, body: planned }, actor: user.id, unitId: eq.unit_id, nowMs });
    if (!r.ok) {
      if (r.reason === 'EQUIPMENT_VERSION_CONFLICT') throw new ApiError(409, 'EQUIPMENT_VERSION_CONFLICT', 'A ficha foi alterada; recarregue', { details: { current_version: r.current.version, current_location: await officialLocation(r.current) } });
      if (POLICY_ERRORS[r.reason]) throwPolicy(r.reason);
      throw new ApiError(404, 'EQUIPMENT_NOT_FOUND', 'Equipamento não encontrado');
    }
    await store.logAudit({ type: 'equipment_location_changed', by: user.id, equipment_id: equipmentId, version: r.equipment.version, inspection_id: insp?.inspection_id ?? null });
    const out = { equipment_id: equipmentId, equipment_version: r.equipment.version, location: await officialLocation(r.equipment), duplicate: false };
    return json(200, out);
  }

  async function confirmDevice(request, path) {
    const { bytes, value: body } = await readBody(request, cfg.limits.default);
    const { device, inst } = await authDevice(request, path, bytes, { states: ['linked'] });
    noExtraKeys(body, 'body', ['protocol_version', 'request_id', 'installation_id', 'link_id']);
    reqUuid(body.request_id, 'request_id');
    reqUuid(body.link_id, 'link_id');
    requireBodyInstallation(body, inst);
    const link = await store.getActiveLink(device.device_id);
    if (!link || link.link_id !== body.link_id) throw new ApiError(409, 'LINK_MISMATCH', 'link_id não corresponde ao vínculo ativo');
    const confirmedAt = await store.confirmLink(link.link_id, isoNow(now()));
    return json(200, { link_id: link.link_id, device_confirmed_at: confirmedAt, server_time: isoNow(now()) });
  }

  async function heartbeat(request, path) {
    const { bytes, value: body } = await readBody(request, cfg.limits.heartbeat);
    const { device, inst } = await authDevice(request, path, bytes, { states: ['linked'] });
    validateHeartbeat(body);
    requireBodyInstallation(body, inst);
    await requireLiveLink(device); // [SEMED REV-01]
    await rate(`hb:${device.device_id}`, 60, 600);
    const ack = await withReceipt(device.device_id, body.message_id, bytes, async () => {
      const nowMs = now();
      const receivedAt = isoNow(nowMs);
      const collectedMs = Date.parse(body.collected_at);
      const p = (await store.getPresence(device.device_id)) ?? {};
      const fresh = Math.abs(nowMs - collectedMs) <= cfg.liveWindowSeconds * 1000;
      const newer = p.boot_id !== body.boot_id ? !p.collected_ms || collectedMs > p.collected_ms : body.sequence > (p.sequence ?? 0);
      let live = fresh && newer;
      await store.recordHeartbeat(device.device_id, { collected_at: body.collected_at, received_at: receivedAt, boot_id: body.boot_id, sequence: body.sequence, reason: body.reason ?? 'periodic', live });
      if (live) {
        // [SEMED R3] gravação CONDICIONAL: só avança se (boot_id, sequence) ainda for mais novo no momento da escrita.
        const applied = await store.setPresenceIfNewer(device.device_id, {
          ...p,
          last_live_contact_at: receivedAt,
          last_collected_at: body.collected_at,
          collected_ms: collectedMs,
          last_received_at: receivedAt,
          boot_id: body.boot_id,
          sequence: body.sequence,
          agent_version: body.agent_version,
          health: body.health,
          last_health_inventory: body.health.inventory,
          last_reason: body.reason ?? 'periodic',
          last_reason_at: receivedAt,
        }, { boot_id: body.boot_id, sequence: body.sequence, collected_ms: collectedMs });
        if (!applied) live = false;
      }
      if (!live) await store.touchPresenceReceived(device.device_id, receivedAt);
      if (inst.agent_version !== body.agent_version) await store.setInstallationVersion(inst.installation_id, body.agent_version);
      return {
        message_id: body.message_id,
        accepted: true,
        duplicate: false,
        server_received_at: receivedAt,
        presence_updated: live,
        config_version: cfg.policy.config_version,
      };
    });
    return json(200, ack);
  }

  function baselineEligible(snap) {
    const need = ['system', 'cpu', 'memory'];
    return need.every((k) => snap.sections[k]?.quality === 'ok');
  }

  /**
   * Hash do conteúdo IMUTÁVEL de um snapshot (tudo exceto message_id). Correção do achado 3.2:
   * o mesmo inventory_id só pode significar o mesmo snapshot.
   */
  async function snapshotHash(body) {
    const { message_id: _ignored, ...content } = body;
    return sha256Hex(canonicalJson(content));
  }

  async function inventory(request, path) {
    const { bytes, value: body } = await readBody(request, cfg.limits.inventory);
    const { device, inst } = await authDevice(request, path, bytes, { states: ['linked'] });
    validateInventory(body);
    requireBodyInstallation(body, inst);
    await requireLiveLink(device); // [SEMED REV-01]
    await rate(`inv:${device.device_id}`, 30, 3600);
    const contentHash = await snapshotHash(body);
    const ack = await withReceipt(device.device_id, body.message_id, bytes, async () => {
      const existing = await store.getSnapshot(body.inventory_id);
      if (existing && (existing.device_id !== device.device_id || existing.snapshot_hash !== contentHash)) {
        throw new ApiError(409, 'INVENTORY_ID_CONFLICT', 'inventory_id já usado com conteúdo diferente (snapshot é imutável)', {
          details: existing.device_id === device.device_id ? { stored_collected_at: existing.collected_at } : undefined,
        });
      }
      const receivedAt = isoNow(now());
      let snap = existing;
      if (!snap) {
        const link = await store.getActiveLink(device.device_id);
        snap = {
          inventory_id: body.inventory_id,
          device_id: device.device_id,
          equipment_id: link?.equipment_id ?? null,
          collected_at: body.collected_at,
          received_at: receivedAt,
          boot_id: body.boot_id,
          sequence: body.sequence,
          reason: body.reason ?? 'periodic',
          previous_inventory_id: body.previous_inventory_id,
          content_hash: body.content_hash ?? null,
          snapshot_hash: contentHash,
          queue_gaps: body.queue_gaps ?? null,
          sections: body.sections,
        };
        await store.addSnapshot(snap);
      }
      // Lacunas deduplicadas por gap_id: reenvio da mesma lacuna em outra mensagem não conta duas vezes.
      const gapResult = await store.recordQueueGaps(device.device_id, snap.inventory_id, body.queue_gaps, receivedAt);
      // Decisões usam o snapshot ARMAZENADO, nunca o corpo recebido.
      const cur = await store.getCurrentSnapshot(device.device_id);
      let becameCurrent = false;
      let currentId = cur?.inventory_id ?? null;
      if (!cur || (cur.inventory_id !== snap.inventory_id && Date.parse(snap.collected_at) > Date.parse(cur.collected_at))) {
        await store.setCurrentSnapshot(device.device_id, snap.inventory_id, snap.collected_at);
        becameCurrent = true;
        currentId = snap.inventory_id;
      }
      let baselineSet = false;
      if (baselineEligible(snap)) {
        baselineSet = await store.setBaselineIfAbsent(device.device_id, { inventory_id: snap.inventory_id, version: 1, set_at: receivedAt });
      }
      return {
        message_id: body.message_id,
        accepted: true,
        duplicate: !!existing,
        server_received_at: existing ? existing.received_at : receivedAt,
        stored_inventory_id: snap.inventory_id,
        became_current: becameCurrent,
        is_current: currentId === snap.inventory_id,
        baseline_set: baselineSet,
        queue_gaps_recorded: gapResult.added,
      };
    });
    return json(200, ack);
  }

  async function configRoute(request, path) {
    const { bytes, value: body } = await readBody(request, cfg.limits.default);
    const { inst } = await authDevice(request, path, bytes, { states: ['pending_pairing', 'linked'] });
    noExtraKeys(body, 'body', ['protocol_version', 'request_id', 'installation_id', 'current_config_version']);
    reqUuid(body.request_id, 'request_id');
    requireBodyInstallation(body, inst);
    return json(200, {
      config_version: cfg.policy.config_version,
      policy: cfg.policy,
      bounds: POLICY_BOUNDS,
      server_time: isoNow(now()),
      note: 'Política declarativa. O agente não executa comandos recebidos.',
    });
  }

  async function rotateKey(request, path) {
    const { bytes, value: body } = await readBody(request, cfg.limits.default);
    const { device, inst, key } = await authDevice(request, path, bytes, { states: ['pending_pairing', 'linked'] });
    if (key.status !== 'active') throw new ApiError(409, 'INVALID_STATE', 'Somente a chave ativa pode iniciar rotação');
    noExtraKeys(body, 'body', ['protocol_version', 'request_id', 'installation_id', 'new_public_key_jwk', 'new_key_id', 'proof']);
    reqUuid(body.request_id, 'request_id');
    requireBodyInstallation(body, inst);
    let jwk;
    try {
      jwk = validatePublicJwk(body.new_public_key_jwk);
    } catch (e) {
      throw new ValidationError('new_public_key_jwk', e.message);
    }
    if ((await jwkThumbprint(jwk)) !== body.new_key_id) throw new ApiError(422, 'KEY_ID_MISMATCH', 'new_key_id deve ser o thumbprint da chave nova');
    if (body.new_key_id === key.key_id) throw new ApiError(422, 'SAME_KEY', 'Chave nova igual à atual');
    const proof = reqObj(body.proof, 'proof');
    noExtraKeys(proof, 'proof', ['timestamp', 'nonce', 'signature']);
    checkTimestamp(String(proof.timestamp));
    checkNonceFormat(proof.nonce);
    checkSigFormat(proof.signature);
    const proofBody = `${device.device_id}\n${inst.installation_id}\n${key.key_id}\n${body.new_key_id}`;
    const canonical = canonicalString('POST', `${AGENT}/rotate-key#proof`, String(proof.timestamp), proof.nonce, await sha256Hex(proofBody));
    if (!(await verifyP1363(await importPublicJwk(jwk), proof.signature, canonical))) {
      throw new ApiError(401, 'AUTH_FAILED', 'Prova de posse da chave nova inválida');
    }
    if (!(await store.useNonce(body.new_key_id, proof.nonce, now() + 2 * cfg.clockSkewSeconds * 1000 + 60_000, now()))) {
      throw new ApiError(401, 'REPLAY', 'Nonce da prova já utilizado');
    }
    const until = isoNow(now() + cfg.keyOverlapSeconds * 1000);
    const r = await store.rotateKeyAtomic(inst.installation_id, key.key_id, {
      key_id: body.new_key_id, installation_id: inst.installation_id, jwk, status: 'active', created_at: isoNow(now()),
    }, until);
    if (!r.ok) throw new ApiError(409, r.reason === 'KEY_EXISTS' ? 'IDENTITY_CONFLICT' : 'INVALID_STATE', 'Rotação recusada');
    await store.logAudit({ type: 'key_rotated', device_id: device.device_id, old_key_id: key.key_id, new_key_id: body.new_key_id });
    return json(200, { new_key_id: body.new_key_id, old_key_id: key.key_id, old_key_valid_until: until, server_time: isoNow(now()) });
  }

  // ------------------------------------------------------------ rotas humanas
  async function deviceForEquipment(equipmentId) {
    const link = await store.getActiveLinkForEquipment(equipmentId);
    if (link) return { link, deviceId: link.device_id };
    // Vínculo encerrado mais recente (ex.: revogado) — histórico preservado.
    const last = await store.getLatestLinkForEquipment(equipmentId);
    return { link: last, deviceId: last?.device_id };
  }

  async function agentStatus(url, user) {
    const equipmentId = url.searchParams.get('equipmentId') ?? '';
    const eq = await store.getEquipment(equipmentId);
    if (!eq) throw new ApiError(404, 'EQUIPMENT_NOT_FOUND', 'Equipamento não encontrado');
    if (!canAccessUnit(user, eq.unit_id)) throw new ApiError(403, 'UNIT_FORBIDDEN', 'Sem acesso à unidade');
    const { link, deviceId } = await deviceForEquipment(equipmentId);
    // [SEMED R2-C] a ficha OFICIAL é a última publicação; o estado atual da visita aberta vai separado como parcial.
    const official = eq.published_location ? await officialLocation({ ...eq, ...eq.published_location }) : null;
    const draft = eq.partial_location || !eq.published_location ? { ...(await officialLocation(eq)), inspection_id: eq.inspection_id, provenance: 'rascunho_visita_aberta' } : null;
    if (!deviceId) return json(200, { equipment_id: equipmentId, equipment_status: eq.status, official_record: { location: official, version: eq.version, partial: !!eq.partial_location }, draft_location: draft, agent: null, server_time: isoNow(now()) });
    const [snap, inst, device, history, baseline, gaps, presence, location] = await Promise.all([
      store.getCurrentSnapshot(deviceId), store.getInstallationForDevice(deviceId), store.getDevice(deviceId),
      store.getEquipmentHistory(eq.id, 10), store.getBaseline(deviceId), store.queueGapSummary(deviceId),
      presenceView(deviceId), officialLocation(eq),
    ]);
    return json(200, {
      equipment_id: equipmentId,
      equipment_status: eq.status,
      official_record: {
        asset: eq.asset, category: eq.category, version: eq.version, provenance: 'ficha_patrimonial',
        location: official, // [SEMED R2-C] publicado (null se a ficha nunca foi publicada)
        partial: !!eq.partial_location,
        location_history: history,
      },
      draft_location: draft, // [SEMED R2-C] estado da visita aberta ainda não publicado (ou ficha nunca publicada)
      agent: {
        device_id: deviceId,
        device_state: device?.state,
        agent_version: inst?.agent_version ?? null,
        // Sem cópia de localização no vínculo: o painel mostra a da ficha (official_record.location).
        link: link ? { link_id: link.link_id, linked_by: link.linked_by, linked_at: link.linked_at, device_confirmed_at: link.device_confirmed_at ?? null, ended_at: link.ended_at } : null,
        presence,
        current_inventory: snap
          ? {
              inventory_id: snap.inventory_id,
              collected_at: snap.collected_at,
              queue_gaps: snap.queue_gaps ?? null,
              received_at: snap.received_at,
              provenance: 'reportado_pelo_agente',
              quality: Object.fromEntries(Object.entries(snap.sections).map(([k, v]) => [k, v.quality])),
              sections: snap.sections,
            }
          : null,
        baseline: baseline ?? null,
        history_gaps: gaps,
      },
      server_time: isoNow(now()),
    });
  }

  async function agentHistory(url, user) {
    const equipmentId = url.searchParams.get('equipmentId') ?? '';
    const eq = await store.getEquipment(equipmentId);
    if (!eq) throw new ApiError(404, 'EQUIPMENT_NOT_FOUND', 'Equipamento não encontrado');
    if (!canAccessUnit(user, eq.unit_id)) throw new ApiError(403, 'UNIT_FORBIDDEN', 'Sem acesso à unidade');
    const { deviceId } = await deviceForEquipment(equipmentId);
    const cursor = Number(url.searchParams.get('cursor') ?? '0');
    if (!Number.isSafeInteger(cursor) || cursor < 0) throw new ApiError(400, 'BAD_CURSOR', 'Cursor inválido');
    const { items, total } = deviceId ? await store.listSnapshots(deviceId, cursor, 20) : { items: [], total: 0 };
    const page = items.map((s) => ({ inventory_id: s.inventory_id, collected_at: s.collected_at, received_at: s.received_at, reason: s.reason, content_hash: s.content_hash }));
    return json(200, { equipment_id: equipmentId, items: page, next_cursor: cursor + 20 < total ? String(cursor + 20) : null });
  }

  /** Catálogo para a página "Vincular computador": somente unidades às quais o usuário tem acesso. */
  async function pairingCatalog(url, user) {
    const units = (await store.listUnits()).filter((u) => canAccessUnit(user, u.unit_id));
    const unitId = url.searchParams.get('unit_id');
    const policy = { require_inspection: !!cfg.requireInspection, allow_new_equipment: !!cfg.allowNewEquipment, max_grant_uses: cfg.maxGrantUses, max_grant_hours: Math.floor(cfg.maxGrantTtlSeconds / 3600) };
    if (!unitId) return json(200, { user: { id: user.id, name: user.name ?? null, role: user.role }, units, policy, server_time: isoNow(now()) });
    if (!units.some((u) => u.unit_id === unitId)) throw new ApiError(403, 'UNIT_FORBIDDEN', 'Sem acesso à unidade');
    // [SEMED R5] cursor + filtro; vínculo ativo vem na própria consulta.
    const cursor = url.searchParams.get('cursor') || null;
    const q = url.searchParams.get('q') || '';
    const [environments, inspections, computers] = await Promise.all([
      store.listEnvironments(unitId), store.listOpenInspections(unitId), store.listComputersInUnit(unitId, { cursor, q, limit: 50 }),
    ]);
    const equipment = computers.map((eq) => ({
      id: eq.id, asset: eq.asset ?? null, category: eq.category, version: eq.version, unit_id: eq.unit_id,
      environment_id: eq.environment_id ?? null, position_label: eq.position_label ?? null, brand: eq.brand ?? null, model: eq.model ?? null,
      already_linked: !!eq.already_linked,
    }));
    return json(200, { user: { id: user.id, name: user.name ?? null, role: user.role }, units, policy, unit_id: unitId, environments, inspections, equipment, next_cursor: computers.nextCursor ?? null, server_time: isoNow(now()) });
  }

  async function rootCreateGrant(request, user) {
    requireRole(user, ['root']);
    if (!cfg.requireInstallGrant) throw new ApiError(409, 'INSTALL_GRANT_NOT_REQUIRED', 'Cadastro automático ativo; não é necessário emitir autorização de instalação');
    const { value: body } = await readBody(request, cfg.limits.default);
    noExtraKeys(body, 'body', ['expires_in_seconds', 'note', 'max_uses']);
    const ttl = body.expires_in_seconds ?? 86400;
    if (!Number.isSafeInteger(ttl) || ttl < 300 || ttl > cfg.maxGrantTtlSeconds) throw new ValidationError('expires_in_seconds', `entre 300 e ${cfg.maxGrantTtlSeconds}`);
    const note = optStr(body.note, 'note', { max: 140 });
    // Lote: um código para N instalações (pendrive), com prazo, contagem e revogação.
    const maxUses = body.max_uses === undefined ? 1 : reqInt(body.max_uses, 'max_uses', { min: 1, max: cfg.maxGrantUses });
    const code = randomToken(24);
    const grant = {
      grant_id: crypto.randomUUID(),
      code_hash: await sha256Hex(code),
      created_by: user.id,
      created_at: isoNow(now()),
      expires_at: isoNow(now() + ttl * 1000),
      used_at: null,
      revoked_at: null,
      note,
      max_uses: maxUses,
      uses_count: 0,
    };
    await store.createGrant(grant);
    await store.logAudit({ type: 'install_grant_created', by: user.id, grant_id: grant.grant_id, max_uses: maxUses });
    return json(201, { grant_id: grant.grant_id, grant_code: code, expires_at: grant.expires_at, max_uses: maxUses, single_use: maxUses === 1 });
  }

  function grantView(g) {
    return {
      grant_id: g.grant_id, created_by: g.created_by, created_at: g.created_at, expires_at: g.expires_at,
      max_uses: g.max_uses ?? 1, uses_count: g.uses_count ?? (g.used_at ? 1 : 0), revoked_at: g.revoked_at ?? null, note: g.note ?? null,
      state: g.revoked_at ? 'revogada' : grantExhausted(g) ? 'esgotada' : Date.parse(g.expires_at) <= now() ? 'expirada' : 'ativa',
    };
  }

  async function rootListGrants(user) {
    requireRole(user, ['root']);
    return json(200, { items: (await store.listGrants(100)).map(grantView), note: 'Os códigos não são armazenados (somente o hash).', server_time: isoNow(now()) });
  }

  async function rootRevokeGrant(request, user) {
    requireRole(user, ['root']);
    const { value: body } = await readBody(request, cfg.limits.default);
    noExtraKeys(body, 'body', ['grant_id', 'reason']);
    reqUuid(body.grant_id, 'grant_id');
    reqStr(body.reason, 'reason', { min: 3, max: 280 });
    const g = await store.revokeGrant(body.grant_id, isoNow(now()));
    if (!g) throw new ApiError(404, 'GRANT_NOT_FOUND', 'Autorização não encontrada');
    await store.logAudit({ type: 'install_grant_revoked', by: user.id, grant_id: body.grant_id, reason: body.reason });
    return json(200, grantView(g));
  }

  async function rootRevoke(request, user) {
    requireRole(user, ['root']);
    const { value: body } = await readBody(request, cfg.limits.default);
    noExtraKeys(body, 'body', ['device_id', 'reason']);
    reqUuid(body.device_id, 'device_id');
    reqStr(body.reason, 'reason', { max: 280 });
    if (!(await store.revokeDevice(body.device_id, isoNow(now()), body.reason, user.id))) {
      throw new ApiError(404, 'DEVICE_NOT_FOUND', 'Dispositivo não encontrado');
    }
    return json(200, { device_id: body.device_id, state: 'revoked', revoked_at: isoNow(now()) });
  }

  // ------------------------------------------------------------ roteador
  async function route(request) {
    if (extensions?.route) {
      const r = await extensions.route(request, ctx);
      if (r) return r;
    }
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();
    if (url.search && path.startsWith(AGENT) && method === 'POST') {
      throw new ApiError(400, 'QUERY_NOT_ALLOWED', 'Rotas de escrita do agente não aceitam query string');
    }

    if (method === 'POST') {
      switch (path) {
        case `${AGENT}/enrollment-challenge`: return enrollmentChallenge(request);
        case `${AGENT}/enrollments`: return enrollments(request, path);
        case `${AGENT}/enrollment-status`: return enrollmentStatus(request, path);
        case `${AGENT}/enrollment-renew`: return enrollmentRenew(request, path);
        case `${AGENT}/pairings/confirm-device`: return confirmDevice(request, path);
        case `${AGENT}/heartbeat`: return heartbeat(request, path);
        case `${AGENT}/inventory`: return inventory(request, path);
        case `${AGENT}/config`: return configRoute(request, path);
        case `${AGENT}/rotate-key`: return rotateKey(request, path);
        // HUMANAS (sessão + CSRF + Origin), mesmo estando sob o prefixo do agente:
        case `${AGENT}/pairings/preview`: return pairingPreview(request, await humanSession(request, { csrf: true }));
        case `${AGENT}/pairings/claim`: return pairingClaim(request, await humanSession(request, { csrf: true }));
        case '/api/root/agent-install-grants': return rootCreateGrant(request, await humanSession(request, { csrf: true }));
        case '/api/root/agent-install-grants/revoke': return rootRevokeGrant(request, await humanSession(request, { csrf: true }));
        case '/api/root/agent-revoke': return rootRevoke(request, await humanSession(request, { csrf: true }));
        case '/api/root/agent-reconcile':
        case '/api/root/hardware-event-review':
          await humanSession(request, { csrf: true });
          throw new ApiError(501, 'NOT_IMPLEMENTED', 'Fora do escopo das fases 0–2 (ver docs/PENDENCIAS.md)');
        case '/api/inventory/equipment-location': return equipmentLocation(request, await humanSession(request, { csrf: true }));
      }
    }
    if (method === 'GET') {
      if (path === '/api/inventory/agent-status') return agentStatus(url, await humanSession(request, { csrf: false }));
      if (path === '/api/inventory/agent-history') return agentHistory(url, await humanSession(request, { csrf: false }));
      if (path === `${AGENT}/pairings/catalog`) return pairingCatalog(url, await humanSession(request, { csrf: false }));
      if (path === '/api/root/agent-install-grants') return rootListGrants(await humanSession(request, { csrf: false }));
      if (pages && pages[path]) return pages[path](request, ctx);
      if (path === '/health') return json(200, { ok: true, mock: !auth, protocol_version: PROTOCOL_VERSION, server_time: isoNow(now()) });
    }
    throw new ApiError(404, 'NOT_FOUND', 'Rota inexistente');
  }

  const ctx = { store, now, cfg, json, readBody, humanSession, canAccessUnit, isoNow, randomToken, ApiError, AGENT, PROTOCOL_VERSION };
  const handler = extensions?.wrap ? extensions.wrap(route, ctx) : route;

  async function fetchHandler(request) {
    const correlationId = crypto.randomUUID();
    try {
      return await handler(request);
    } catch (err) {
      if (err instanceof ApiError) return errorResponse(err, correlationId);
      if (err instanceof ValidationError) {
        return errorResponse(new ApiError(err.status, err.status === 413 ? 'PAYLOAD_TOO_LARGE' : err.status === 400 ? 'BAD_REQUEST' : 'VALIDATION_FAILED', err.message), correlationId);
      }
      // Nunca expor stack trace ao cliente.
      console.error(`[${correlationId}]`, err);
      return errorResponse(new ApiError(503, 'INTERNAL_UNAVAILABLE', 'Falha interna temporária', { retryable: true }), correlationId);
    }
  }

  return { fetch: fetchHandler, store, cfg, presenceView };
}

/** Lote: usos consumidos ≥ máximo. Compatível com autorizações antigas de uso único (used_at). */
export function grantExhausted(g) {
  const max = g.max_uses ?? 1;
  const used = g.uses_count ?? (g.used_at ? 1 : 0);
  return used >= max;
}

let app;
export default {
  async fetch(request, env) {
    // Sem seed, sem rotas de desenvolvimento, sem injeção de falhas: só as rotas do contrato.
    app ??= createApp({
      config: {
        humanOrigins: env?.HUMAN_ORIGINS ? env.HUMAN_ORIGINS.split(',') : DEFAULT_CONFIG.humanOrigins,
      },
    });
    return app.fetch(request);
  },
};
