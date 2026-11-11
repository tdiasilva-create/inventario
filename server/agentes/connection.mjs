// D-097: observation of a validated live heartbeat at the Cloudflare edge.
// Never take the provider from a client header/body, nor infer school coordinates.
export function normalizeIp(value){
 if(typeof value!=='string'||!value||value.length>64||value!==value.trim())return null;
 if(/^\d{1,3}(\.\d{1,3}){3}$/.test(value))return value.split('.').every(p=>Number(p)<=255)?value.split('.').map(Number).join('.'):null;
 if(!/^[0-9a-f:.]+$/i.test(value)||!value.includes(':'))return null;
 try{return new URL('http://['+value+']/').hostname.slice(1,-1);}catch{return null;}
}
export function observeConnection(request,receivedAt){
 const cf=request.cf;
 if(!cf||typeof cf!=='object'||request.headers.has('CF-Worker'))return null;
 // Pseudo IPv4 can replace CF-Connecting-IP; prefer the original IPv6 when present.
 const ip=normalizeIp(request.headers.get('CF-Connecting-IPv6'))||normalizeIp(request.headers.get('CF-Connecting-IP'));
 if(!ip)return null;
 const provider=typeof cf.asOrganization==='string'?cf.asOrganization.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,200):'';
 return {public_ip:ip,ip_version:ip.includes(':')?6:4,provider:provider||null,asn:Number.isSafeInteger(cf.asn)&&cf.asn>0&&cf.asn<=4294967295?cf.asn:null,observed_at:receivedAt,source:'cloudflare'};
}
