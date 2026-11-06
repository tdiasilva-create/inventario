// Cliente de referência do agente para testes isolados: assina como o executável (ECDSA P-256, P1363, base64url).
// Chave gerada por teste; nunca material real. Não acessa rede: fala com worker.fetch().
import {b64url,thumbprint,canonical,sha256Hex,randomToken} from '../../server/agent-crypto.mjs';
import {digest} from '../../server/security.mjs';
const encoder=new TextEncoder();
export async function agentIdentity(){
 const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
 const publicJwk={kty:'EC',crv:'P-256',x:jwk.x,y:jwk.y};
 return {pair,publicJwk,keyId:await thumbprint(publicJwk),installationId:crypto.randomUUID(),deviceId:null,bootId:crypto.randomUUID(),sequence:0};
}
export async function signedHeaders(identity,method,path,bodyBytes,{scheme='SEMED-Device',subject,timestamp=Math.floor(Date.now()/1000),nonce=randomToken(16)}={}){
 const can=canonical(method,path,timestamp,nonce,await sha256Hex(bodyBytes));
 const sig=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},identity.pair.privateKey,encoder.encode(can)));
 const headers={'Content-Type':'application/json','Authorization':`${scheme} ${subject}`,'X-SEMED-Key-Id':identity.keyId,'X-SEMED-Timestamp':String(timestamp),'X-SEMED-Nonce':nonce,'X-SEMED-Signature':b64url(sig)};
 if(scheme==='SEMED-Device')headers['X-SEMED-Installation']=identity.installationId;
 return headers;
}
/** POST assinado como máquina (sem Origin, sem cookie). */
export async function machinePost(worker,env,origin,identity,path,body,options={}){
 const bytes=encoder.encode(JSON.stringify(body));
 const headers=await signedHeaders(identity,'POST',path,bytes,{scheme:options.scheme||'SEMED-Device',subject:options.subject||identity.deviceId,timestamp:options.timestamp,nonce:options.nonce});
 // Alterar o primeiro caractere muda bits reais; o último pode conter apenas padding ignorado.
 if(options.tamperSignature)headers['X-SEMED-Signature']=headers['X-SEMED-Signature'].replace(/^./,c=>c==='A'?'B':'A');
 if(options.ip)headers['CF-Connecting-IP']=options.ip;
 const response=await worker.fetch(new Request(origin+path,{method:'POST',headers,body:bytes}),env);
 const data=await response.json().catch(()=>null);
 return {status:response.status,data,response};
}
export async function challenge(worker,env,origin,code,{ip}={}){
 const headers={'Content-Type':'application/json','Authorization':'SEMED-Install-Grant '+code};if(ip)headers['CF-Connecting-IP']=ip;
 const r=await worker.fetch(new Request(origin+'/api/agent/v1/enrollment-challenge',{method:'POST',headers,body:JSON.stringify({protocol_version:'1.0',request_id:crypto.randomUUID(),agent_version:'0.1.6-test'})}),env);
 return {status:r.status,data:await r.json()};
}
export const summary={hostname:'PC-TESTE-ISOLADO',manufacturer:'EXEMPLO',model:'MODELO-FICTICIO',serial_hint:'••••0001',cpu_name:'CPU-TESTE',logical_processors:8,installed_memory_bytes:8589934592,os_caption:'Sistema Fictício',os_build:'00000'};
export async function enroll(worker,env,origin,identity,code,{ip}={}){
 const ch=await challenge(worker,env,origin,code,{ip});if(ch.status!==200)return {challenge:ch};
 const r=await machinePost(worker,env,origin,identity,'/api/agent/v1/enrollments',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId,challenge_id:ch.data.challenge_id,challenge:ch.data.challenge,public_key_jwk:identity.publicJwk,agent_version:'0.1.6-test',summary},{scheme:'SEMED-Enroll',subject:ch.data.challenge_id,ip});
 if(r.status===201)identity.deviceId=r.data.device_id;
 return {challenge:ch,enrollment:r};
}
export function heartbeatBody(identity,{sequence,collectedAt=new Date().toISOString().replace(/\.\d{3}Z$/,'Z'),reason='periodic',bootId=identity.bootId}={}){
 return {protocol_version:'1.0',message_id:crypto.randomUUID(),installation_id:identity.installationId,boot_id:bootId,sequence,collected_at:collectedAt,agent_version:'0.1.6-test',uptime_seconds:1234,reason,health:{inventory:'ok',pending_messages:0}};
}
export function inventoryBody(identity,{sequence,collectedAt=new Date().toISOString().replace(/\.\d{3}Z$/,'Z')}={}){
 const t=collectedAt;
 return {protocol_version:'1.0',message_id:crypto.randomUUID(),inventory_id:crypto.randomUUID(),installation_id:identity.installationId,boot_id:identity.bootId,sequence,collected_at:t,previous_inventory_id:null,agent_version:'0.1.6-test',collector_version:'0.1.6-test',reason:'startup',content_hash:'0'.repeat(64),sections:{
  system:{quality:'ok',source:'wmi:test',collected_at:t,duration_ms:10,data:{hostname:'PC-TESTE-ISOLADO',dns_hostname:'PC-TESTE-ISOLADO',manufacturer:'EXEMPLO',model:'MODELO-FICTICIO',system_family:null,sku:null,chassis_types:[3],chassis_kind:'desktop',serial:{value:'TESTE0001',reliability:'ok'},smbios_uuid:{value:'03000200-0400-0500-0006-000700080009',reliability:'generic'},baseboard:{manufacturer:'EXEMPLO',product:'PLACA-FICTICIA',version:null,serial:{value:null,reliability:'absent'}},bios:{manufacturer:'EXEMPLO',version:'FICT-1.0',smbios_version:'3.4',release_date:'2025-01-15',firmware_type:'uefi'},virtual_machine:{is_vm:false,confidence:'medium',evidence:[]},architecture:'x64'}},
  cpu:{quality:'ok',source:'wmi:test',collected_at:t,duration_ms:10,data:{processor_count:1,processors:[{socket:'S1',manufacturer:'EXEMPLO',name:'CPU-TESTE',architecture:'x64',cores:4,logical_processors:8,max_clock_mhz:3000,processor_id:null}]}},
  memory:{quality:'ok',source:'wmi:test',collected_at:t,duration_ms:10,data:{installed_bytes:8589934592,modules:[{slot:'DIMM0',capacity_bytes:8589934592,type:'DDR4',speed_mhz:2666,manufacturer:'EXEMPLO',part_number:'PN-FICT',serial:{value:'MEM0001',reliability:'ok'}}]}},
 }};
}
/** Sessão humana válida no D1 isolado (cookie + CSRF) para um usuário da fixture. */
export async function session(f,user,{csrf='csrf-'+Math.random().toString(16).slice(2)}={}){
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
 f.sqlite.prepare('UPDATE users SET must_change=0 WHERE id=?').run(user.id);
 f.sqlite.prepare('INSERT INTO sessions(token_hash,user_id,csrf,expires_at,created_at,credential_version,user_agent) VALUES(?,?,?,?,?,?,?)').run(await digest(token),user.id,csrf,Date.now()+3600000,Date.now(),0,'teste');
 return {cookie:'__Host-semed='+token,csrf};
}
export async function humanFetch(worker,env,origin,sess,path,data,{method,noCsrf=false,noOrigin=false}={}){
 const m=method||(data?'POST':'GET');
 const headers={Cookie:sess.cookie};if(m==='POST'){headers['Content-Type']='application/json';if(!noOrigin)headers.Origin=origin;if(!noCsrf)headers['X-CSRF-Token']=sess.csrf;}
 const r=await worker.fetch(new Request(origin+path,{method:m,headers,body:m==='POST'?JSON.stringify(data??{}):undefined}),env);
 return {status:r.status,data:await r.json().catch(()=>null)};
}

/** Trava de edição do coletor (mesma política de /api/collector/equipment-save); devolve o lock_token exigido por claim/localização. */
export async function lockFor(worker,env,origin,sess,inspectionId,equipmentId){const r=await humanFetch(worker,env,origin,sess,'/api/collector/equipment-lock',{inspectionId,id:equipmentId});if(r.status!==200)throw Error('lock '+r.status+' '+JSON.stringify(r.data));return r.data.token;}
