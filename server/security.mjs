export const encode=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
export const random=()=>encode(crypto.getRandomValues(new Uint8Array(32)));
export async function digest(value){return encode(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));}
export async function hashPassword(password,salt,pepper){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password+'\0'+pepper),'PBKDF2',false,['deriveBits']);return encode(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-512',iterations:100000,salt:new TextEncoder().encode(salt)},key,256));}
export function equal(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
export const canManage=(actor,target)=>actor==='root'||(actor==='admin'&&['operador','visualizador'].includes(target));
export const canView=role=>['root','admin','visualizador'].includes(role);
// D-096: comprimento livre de composição; nenhuma consulta externa de senha.
export async function validatePassword(password){return typeof password!=='string'||password.length<6||password.length>256?'Use uma senha entre 6 e 256 caracteres.':null;}
