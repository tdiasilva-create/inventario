// Autenticação de máquina SEMED-Device v1 (contrato do agente 0.1.6, contract/ASSINATURA.md).
// ECDSA P-256 / SHA-256, assinatura IEEE P1363 (r||s, 64 bytes) em base64url sem padding;
// key_id = thumbprint RFC 7638 da JWK pública. Somente verificação: o servidor nunca possui chave privada.
export const b64url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export function unb64url(text){if(typeof text!=='string'||!/^[A-Za-z0-9_-]*$/.test(text))throw new Error('base64url inválido');const pad=text.length%4===2?'==':text.length%4===3?'=':text.length%4===1?null:'';if(pad===null)throw new Error('base64url inválido');return Uint8Array.from(atob(text.replace(/-/g,'+').replace(/_/g,'/')+pad),c=>c.charCodeAt(0));}
export const sha256Hex=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
export const randomToken=(bytes=16)=>b64url(crypto.getRandomValues(new Uint8Array(bytes)));
const encoder=new TextEncoder();
export function validJwk(jwk){return !!jwk&&typeof jwk==='object'&&jwk.kty==='EC'&&jwk.crv==='P-256'&&typeof jwk.x==='string'&&typeof jwk.y==='string'&&/^[A-Za-z0-9_-]{43}$/.test(jwk.x)&&/^[A-Za-z0-9_-]{43}$/.test(jwk.y)&&!('d' in jwk);}
// RFC 7638: SHA-256 do JSON canônico {"crv","kty","x","y"} (ordem lexicográfica, sem espaços).
export async function thumbprint(jwk){if(!validJwk(jwk))throw new Error('JWK inválida');return b64url(await crypto.subtle.digest('SHA-256',encoder.encode(`{"crv":"${jwk.crv}","kty":"${jwk.kty}","x":"${jwk.x}","y":"${jwk.y}"}`)));}
export function canonical(method,path,timestamp,nonce,bodyHashHex){if(String(path).includes('?')||/\n/.test(path+nonce))throw new Error('Caminho ou nonce inválido');return [String(method).toUpperCase(),path,String(timestamp),nonce,bodyHashHex].join('\n');}
const keyCache=new Map();
async function importKey(jwk){const id=jwk.x+'.'+jwk.y;if(!keyCache.has(id))keyCache.set(id,crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x:jwk.x,y:jwk.y,ext:true},{name:'ECDSA',namedCurve:'P-256'},false,['verify']));return keyCache.get(id);}
export async function verifySignature(jwk,canonicalString,signatureB64url){
 let sig;try{sig=unb64url(signatureB64url);}catch{return false;}
 if(sig.byteLength!==64)return false; // DER ou tamanho errado → BAD_SIGNATURE_FORMAT
 try{return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},await importKey(jwk),sig,encoder.encode(canonicalString));}catch{return false;}
}
export const NONCE_RE=/^[A-Za-z0-9_-]{22,64}$/,SIGNATURE_RE=/^[A-Za-z0-9_-]{86}$/,UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,KEY_ID_RE=/^[A-Za-z0-9_-]{43}$/;
// Lê e valida o formato dos cabeçalhos assinados. Não consulta banco; a coerência com o dispositivo é feita depois.
export function parseSignedHeaders(request){
 const auth=request.headers.get('Authorization')||'',m=/^(SEMED-Device|SEMED-Enroll|SEMED-Install-Grant)\s+(\S+)$/.exec(auth);
 if(!m)return {error:'AUTH_FAILED',reason:'authorization'};
 const scheme=m[1],subject=m[2];
 if(scheme==='SEMED-Install-Grant')return {scheme,subject};
 const keyId=request.headers.get('X-SEMED-Key-Id')||'',timestamp=request.headers.get('X-SEMED-Timestamp')||'',nonce=request.headers.get('X-SEMED-Nonce')||'',signature=request.headers.get('X-SEMED-Signature')||'',installation=request.headers.get('X-SEMED-Installation')||'';
 if(!KEY_ID_RE.test(keyId)||!/^\d{1,12}$/.test(timestamp)||!NONCE_RE.test(nonce)||!SIGNATURE_RE.test(signature))return {error:'AUTH_FAILED',reason:'headers'};
 if(scheme==='SEMED-Device'&&(!UUID_RE.test(subject)||!UUID_RE.test(installation)))return {error:'AUTH_FAILED',reason:'identity'};
 if(scheme==='SEMED-Enroll'&&!UUID_RE.test(subject))return {error:'AUTH_FAILED',reason:'challenge'};
 return {scheme,subject,keyId,timestamp:Number(timestamp),nonce,signature,installation:installation||null};
}
export const CLOCK_SKEW_SECONDS=300;
