// Validação manual (sem geração de código, compatível com Workers).
// Espelha contract/schemas/*.json; os testes conferem ambos com os mesmos exemplos.

import { UUID_RE } from './crypto.mjs';

export class ValidationError extends Error {
  constructor(field, message, status = 422) {
    super(`${field}: ${message}`);
    this.field = field;
    this.status = status;
  }
}

const ISO_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,7})?Z$/;
export const QUALITY = ['ok', 'partial', 'unsupported', 'access_denied', 'timeout', 'error'];
export const SECTIONS = ['system', 'cpu', 'memory', 'storage', 'gpu', 'network', 'os', 'accounts'];
const HB_REASONS = ['startup', 'periodic', 'resume', 'suspend', 'shutdown', 'network_change'];
const INV_REASONS = ['startup', 'periodic', 'change_confirmed', 'forced', 'after_link'];

export function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function reqObj(v, f) {
  if (!isObj(v)) throw new ValidationError(f, 'deve ser objeto', 400);
  return v;
}

export function reqStr(v, f, { max = 256, min = 1, nullable = false, re } = {}) {
  if (v === null && nullable) return null;
  if (typeof v !== 'string') throw new ValidationError(f, 'deve ser texto');
  if (v.length < min || v.length > max) throw new ValidationError(f, `tamanho fora de ${min}..${max}`);
  if (re && !re.test(v)) throw new ValidationError(f, 'formato inválido');
  return v;
}

export function optStr(v, f, opts = {}) {
  if (v === undefined || v === null) return null;
  return reqStr(v, f, opts);
}

export function reqInt(v, f, { min = 0, max = Number.MAX_SAFE_INTEGER, nullable = false } = {}) {
  if (v === null && nullable) return null;
  if (!Number.isSafeInteger(v)) throw new ValidationError(f, 'deve ser inteiro (não texto)');
  if (v < min || v > max) throw new ValidationError(f, `fora de ${min}..${max}`);
  return v;
}

export function optInt(v, f, opts = {}) {
  if (v === undefined || v === null) return null;
  return reqInt(v, f, opts);
}

export function reqNum(v, f, { min = -Infinity, max = Infinity } = {}) {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new ValidationError(f, 'deve ser número');
  if (v < min || v > max) throw new ValidationError(f, `fora de ${min}..${max}`);
  return v;
}

export function reqUuid(v, f, { nullable = false } = {}) {
  if (v === null && nullable) return null;
  if (typeof v !== 'string' || !UUID_RE.test(v)) throw new ValidationError(f, 'deve ser UUID minúsculo');
  return v;
}

export function reqIso(v, f) {
  if (typeof v !== 'string' || !ISO_UTC_RE.test(v) || Number.isNaN(Date.parse(v))) {
    throw new ValidationError(f, 'deve ser data ISO 8601 UTC terminada em Z');
  }
  return v;
}

export function reqEnum(v, f, values) {
  if (!values.includes(v)) throw new ValidationError(f, `valor não permitido (${values.join('|')})`);
  return v;
}

export function reqBool(v, f) {
  if (typeof v !== 'boolean') throw new ValidationError(f, 'deve ser booleano');
  return v;
}

export function noExtraKeys(obj, f, allowed) {
  for (const k of Object.keys(obj)) if (!allowed.includes(k)) throw new ValidationError(`${f}.${k}`, 'campo não previsto no contrato');
}

/** Limites estruturais genéricos para dados técnicos. */
export function checkDeep(v, f, depth = 0) {
  if (depth > 6) throw new ValidationError(f, 'profundidade excessiva', 413);
  if (typeof v === 'string') {
    if (v.length > 512) throw new ValidationError(f, 'texto longo demais', 413);
  } else if (Array.isArray(v)) {
    if (v.length > 64) throw new ValidationError(f, 'lista longa demais (máx. 64)', 413);
    v.forEach((x, i) => checkDeep(x, `${f}[${i}]`, depth + 1));
  } else if (isObj(v)) {
    const keys = Object.keys(v);
    if (keys.length > 64) throw new ValidationError(f, 'objeto com campos demais', 413);
    for (const k of keys) {
      if (k.length > 64) throw new ValidationError(f, 'nome de campo longo demais');
      checkDeep(v[k], `${f}.${k}`, depth + 1);
    }
  } else if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new ValidationError(f, 'número inválido');
  } else if (v !== null && typeof v !== 'boolean') {
    throw new ValidationError(f, 'tipo inválido');
  }
}

export function validateHeartbeat(b) {
  reqObj(b, 'body');
  noExtraKeys(b, 'body', [
    'protocol_version', 'message_id', 'installation_id', 'boot_id', 'sequence', 'collected_at', 'agent_version',
    'uptime_seconds', 'reason', 'health', 'latest_inventory_id', 'performance',
  ]);
  reqEnum(b.protocol_version, 'protocol_version', ['1.0']);
  reqUuid(b.message_id, 'message_id');
  reqUuid(b.installation_id, 'installation_id');
  reqUuid(b.boot_id, 'boot_id');
  reqInt(b.sequence, 'sequence', { min: 1 });
  reqIso(b.collected_at, 'collected_at');
  reqStr(b.agent_version, 'agent_version', { max: 32 });
  reqInt(b.uptime_seconds, 'uptime_seconds', { min: 0 });
  if (b.reason !== undefined) reqEnum(b.reason, 'reason', HB_REASONS);
  reqObj(b.health, 'health');
  noExtraKeys(b.health, 'health', ['inventory', 'pending_messages', 'dropped_messages', 'last_error_code']);
  reqEnum(b.health.inventory, 'health.inventory', [...QUALITY, 'not_run']);
  reqInt(b.health.pending_messages, 'health.pending_messages', { min: 0, max: 1_000_000 });
  optInt(b.health.dropped_messages, 'health.dropped_messages', { min: 0 });
  optStr(b.health.last_error_code, 'health.last_error_code', { max: 64 });
  if (b.latest_inventory_id !== undefined) reqUuid(b.latest_inventory_id, 'latest_inventory_id', { nullable: true });
  if (b.performance !== undefined && b.performance !== null) {
    const p = reqObj(b.performance, 'performance');
    noExtraKeys(p, 'performance', ['cpu_percent', 'sample_seconds', 'memory_total_bytes', 'memory_available_bytes']);
    reqNum(p.cpu_percent, 'performance.cpu_percent', { min: 0, max: 100 });
    reqNum(p.sample_seconds, 'performance.sample_seconds', { min: 0, max: 600 });
    reqInt(p.memory_total_bytes, 'performance.memory_total_bytes');
    reqInt(p.memory_available_bytes, 'performance.memory_available_bytes');
  }
  return b;
}

function validateSection(name, s) {
  const f = `sections.${name}`;
  reqObj(s, f);
  noExtraKeys(s, f, ['quality', 'source', 'collected_at', 'duration_ms', 'error_code', 'truncated', 'data']);
  if (s.truncated !== undefined) reqBool(s.truncated, `${f}.truncated`);
  if (s.truncated === true && s.quality === 'ok') throw new ValidationError(`${f}.quality`, 'seção truncada não pode ser ok (use partial)');
  reqEnum(s.quality, `${f}.quality`, QUALITY);
  optStr(s.source, `${f}.source`, { max: 128 });
  if (s.collected_at !== undefined) reqIso(s.collected_at, `${f}.collected_at`);
  optInt(s.duration_ms, `${f}.duration_ms`, { min: 0, max: 600_000 });
  optStr(s.error_code, `${f}.error_code`, { max: 64 });
  if (s.data === undefined) throw new ValidationError(`${f}.data`, 'obrigatório (use null quando indisponível)');
  if (s.data !== null && !isObj(s.data)) throw new ValidationError(`${f}.data`, 'deve ser objeto ou null');
  if ((s.quality === 'ok' || s.quality === 'partial') && s.data === null) {
    throw new ValidationError(`${f}.data`, 'quality ok/partial exige data');
  }
  checkDeep(s.data, `${f}.data`);
  // Checagens semânticas de unidades em campos conhecidos.
  const d = s.data;
  if (!d) return;
  if (name === 'memory') {
    reqInt(d.installed_bytes, `${f}.data.installed_bytes`, { nullable: true });
    if (d.visible_bytes !== undefined) reqInt(d.visible_bytes, `${f}.data.visible_bytes`, { nullable: true });
    if (d.modules !== undefined && d.modules !== null) {
      if (!Array.isArray(d.modules)) throw new ValidationError(`${f}.data.modules`, 'deve ser lista');
      d.modules.forEach((m, i) => reqInt(m.capacity_bytes, `${f}.data.modules[${i}].capacity_bytes`, { nullable: true }));
    }
  }
  if (name === 'cpu' && d.processors) {
    if (!Array.isArray(d.processors)) throw new ValidationError(`${f}.data.processors`, 'deve ser lista');
    d.processors.forEach((p, i) => {
      optInt(p.cores, `${f}.data.processors[${i}].cores`, { max: 1024 });
      optInt(p.logical_processors, `${f}.data.processors[${i}].logical_processors`, { max: 4096 });
      optInt(p.max_clock_mhz, `${f}.data.processors[${i}].max_clock_mhz`, { max: 100_000 });
    });
  }
  if (name === 'storage' && d.physical_disks) {
    if (!Array.isArray(d.physical_disks)) throw new ValidationError(`${f}.data.physical_disks`, 'deve ser lista');
    d.physical_disks.forEach((x, i) => optInt(x.size_bytes, `${f}.data.physical_disks[${i}].size_bytes`));
  }
  if (name === 'accounts') {
    noExtraKeys(d, `${f}.data`, [
      'enabled_local_count', 'disabled_local_count', 'interactive_session_count', 'console_session_count',
      'remote_session_count', 'named_accounts_collected',
    ]);
    if (d.named_accounts_collected !== false) {
      throw new ValidationError(`${f}.data.named_accounts_collected`, 'coleta nominal não autorizada nesta versão do contrato');
    }
  }
}

export function validateInventory(b) {
  reqObj(b, 'body');
  noExtraKeys(b, 'body', [
    'protocol_version', 'message_id', 'inventory_id', 'installation_id', 'boot_id', 'sequence', 'collected_at',
    'previous_inventory_id', 'agent_version', 'collector_version', 'reason', 'content_hash', 'queue_gaps', 'sections',
  ]);
  if (b.queue_gaps !== undefined && b.queue_gaps !== null) {
    if (!Array.isArray(b.queue_gaps) || b.queue_gaps.length < 1 || b.queue_gaps.length > 16) throw new ValidationError('queue_gaps', 'lista de 1 a 16 lacunas');
    const seen = new Set();
    b.queue_gaps.forEach((g, i) => {
      const f = `queue_gaps[${i}]`;
      reqObj(g, f);
      noExtraKeys(g, f, ['gap_id', 'dropped_count', 'dropped_change_count', 'first_dropped_collected_at', 'last_dropped_collected_at']);
      reqUuid(g.gap_id, `${f}.gap_id`);
      if (seen.has(g.gap_id)) throw new ValidationError(`${f}.gap_id`, 'repetido na mesma mensagem');
      seen.add(g.gap_id);
      reqInt(g.dropped_count, `${f}.dropped_count`, { min: 1 });
      reqInt(g.dropped_change_count, `${f}.dropped_change_count`, { min: 0, max: g.dropped_count });
      reqIso(g.first_dropped_collected_at, `${f}.first_dropped_collected_at`);
      reqIso(g.last_dropped_collected_at, `${f}.last_dropped_collected_at`);
    });
  }
  reqEnum(b.protocol_version, 'protocol_version', ['1.0']);
  reqUuid(b.message_id, 'message_id');
  reqUuid(b.inventory_id, 'inventory_id');
  reqUuid(b.installation_id, 'installation_id');
  reqUuid(b.boot_id, 'boot_id');
  reqInt(b.sequence, 'sequence', { min: 1 });
  reqIso(b.collected_at, 'collected_at');
  reqUuid(b.previous_inventory_id, 'previous_inventory_id', { nullable: true });
  optStr(b.agent_version, 'agent_version', { max: 32 });
  optStr(b.collector_version, 'collector_version', { max: 32 });
  if (b.reason !== undefined) reqEnum(b.reason, 'reason', INV_REASONS);
  if (b.content_hash !== undefined) reqStr(b.content_hash, 'content_hash', { min: 64, max: 64, re: /^[0-9a-f]{64}$/ });
  reqObj(b.sections, 'sections');
  for (const k of Object.keys(b.sections)) {
    if (!SECTIONS.includes(k)) throw new ValidationError(`sections.${k}`, 'seção não prevista no contrato');
    validateSection(k, b.sections[k]);
  }
  if (!b.sections.system) throw new ValidationError('sections.system', 'obrigatória');
  return b;
}

export function validateSummary(s) {
  reqObj(s, 'summary');
  noExtraKeys(s, 'summary', [
    'hostname', 'manufacturer', 'model', 'serial_hint', 'cpu_name', 'logical_processors', 'installed_memory_bytes',
    'os_caption', 'os_build',
  ]);
  reqStr(s.hostname, 'summary.hostname', { max: 255 });
  for (const k of ['manufacturer', 'model', 'serial_hint', 'cpu_name', 'os_caption', 'os_build']) optStr(s[k], `summary.${k}`, { max: 128 });
  if (s.serial_hint && s.serial_hint.replace(/[*•]/g, '').length > 6) {
    throw new ValidationError('summary.serial_hint', 'deve conter no máximo 6 caracteres visíveis da série');
  }
  optInt(s.logical_processors, 'summary.logical_processors', { max: 4096 });
  optInt(s.installed_memory_bytes, 'summary.installed_memory_bytes');
  return s;
}
