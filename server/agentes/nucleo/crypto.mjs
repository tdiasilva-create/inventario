// Primitivas criptográficas do contrato SEMED-Device v1 (Web Crypto).
// Compatível com Cloudflare Workers e Node >= 20 (globalThis.crypto).
// Ver contract/ASSINATURA.md para a especificação normativa.

const enc = new TextEncoder();

export const B64URL_RE = /^[A-Za-z0-9_-]+$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function b64urlEncode(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(str) {
  if (typeof str !== 'string' || !B64URL_RE.test(str)) throw new Error('base64url inválido');
  if (str.length % 4 === 1) throw new Error('base64url com tamanho inválido');
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  // Rejeita codificações não canônicas (bits sobrando no último caractere).
  if (b64urlEncode(out) !== str) throw new Error('base64url não canônico');
  return out;
}

export function toHex(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u8.length; i++) s += u8[i].toString(16).padStart(2, '0');
  return s;
}

export async function sha256(bytes) {
  const data = typeof bytes === 'string' ? enc.encode(bytes) : bytes;
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

export async function sha256Hex(bytes) {
  return toHex(await sha256(bytes));
}

export function randomToken(nBytes = 16) {
  const u8 = new Uint8Array(nBytes);
  crypto.getRandomValues(u8);
  return b64urlEncode(u8);
}

/** Comparação em tempo constante de duas strings ASCII. */
export function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ea = enc.encode(a);
  const eb = enc.encode(b);
  let diff = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

/**
 * String canônica: 5 linhas separadas por LF, sem LF final.
 * METHOD \n PATH \n TIMESTAMP \n NONCE \n SHA256HEX(corpo)
 */
export function canonicalString(method, path, timestamp, nonce, bodySha256Hex) {
  return [String(method).toUpperCase(), path, String(timestamp), nonce, bodySha256Hex].join('\n');
}

/** Valida JWK pública P-256 estritamente. Lança Error com mensagem curta. */
export function validatePublicJwk(jwk) {
  if (!jwk || typeof jwk !== 'object' || Array.isArray(jwk)) throw new Error('JWK ausente');
  const allowed = new Set(['kty', 'crv', 'x', 'y', 'alg', 'use', 'key_ops', 'ext']);
  for (const k of Object.keys(jwk)) {
    if (k === 'd') throw new Error('JWK contém componente privado');
    if (!allowed.has(k)) throw new Error(`JWK com campo não permitido: ${k}`);
  }
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') throw new Error('JWK deve ser EC P-256');
  const x = b64urlDecode(jwk.x);
  const y = b64urlDecode(jwk.y);
  if (x.length !== 32 || y.length !== 32) throw new Error('Coordenadas JWK devem ter 32 bytes');
  return { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y };
}

/** RFC 7638: thumbprint SHA-256 da JWK, base64url sem padding (43 caracteres). */
export async function jwkThumbprint(jwk) {
  const j = validatePublicJwk(jwk);
  const canonical = `{"crv":"${j.crv}","kty":"${j.kty}","x":"${j.x}","y":"${j.y}"}`;
  return b64urlEncode(await sha256(canonical));
}

export async function importPublicJwk(jwk) {
  const j = validatePublicJwk(jwk);
  // importKey valida que o ponto pertence à curva.
  return crypto.subtle.importKey('jwk', { ...j, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
}

/** Verifica assinatura IEEE P1363 (r||s, 64 bytes) base64url sem padding. */
export async function verifyP1363(publicKey, signatureB64url, message) {
  let sig;
  try {
    sig = b64urlDecode(signatureB64url);
  } catch {
    return false;
  }
  if (sig.length !== 64) return false;
  const data = typeof message === 'string' ? enc.encode(message) : message;
  return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, sig, data);
}

export async function signP1363(privateKey, message) {
  const data = typeof message === 'string' ? enc.encode(message) : message;
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data);
  return b64urlEncode(sig);
}
