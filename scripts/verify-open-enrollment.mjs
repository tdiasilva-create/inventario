// Sonda de produção autorizada por D-058: cria apenas desafio temporário, nunca cadastra computador/ficha.
// Não usa credenciais. Assinatura deliberadamente nula deve ser rejeitada antes de qualquer cadastro.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {agentIdentity,signedHeaders,summary} from '../tests/helpers/agent-client.mjs';
const hosts=['https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev','https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev'];
const results=[];
for(const origin of hosts){
 const out={origin,at:new Date().toISOString(),checks:{}};
 const req=async(path,body,headers={})=>fetch(origin+path,{method:body?'POST':'GET',redirect:'manual',headers:{'Content-Type':'application/json',...headers},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 out.checks.login=(await req('/login')).status;assert.equal(out.checks.login,200);
 const response=await req('/api/agent/v1/enrollment-challenge',{protocol_version:'1.0',request_id:crypto.randomUUID(),agent_version:'0.1.8'});
 out.checks.challenge_without_grant=response.status;assert.equal(response.status,200);const ch=await response.json();assert.ok(ch.challenge&&ch.challenge_id);out.challenge_expires_at=ch.expires_at;
 const id=await agentIdentity(),path='/api/agent/v1/enrollments',body={protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:id.installationId,challenge_id:ch.challenge_id,challenge:ch.challenge,public_key_jwk:id.publicJwk,agent_version:'0.1.8',summary:{...summary,hostname:'SONDA-NAO-CADASTRADA'}};
 const headers=await signedHeaders(id,'POST',path,new TextEncoder().encode(JSON.stringify(body)),{scheme:'SEMED-Enroll',subject:ch.challenge_id});headers['X-SEMED-Signature']='A'.repeat(86);
 const invalid=await req(path,body,headers);out.checks.invalid_signature=invalid.status;const failure=await invalid.json();out.invalid_signature_code=failure.code;assert.equal(invalid.status,401);
 out.checks.claim_without_session=(await req('/api/agent/v1/pairings/claim',{request_id:crypto.randomUUID()},{Origin:origin})).status;assert.equal(out.checks.claim_without_session,401);
 out.checks.heartbeat_without_identity=(await req('/api/agent/v1/heartbeat',{protocol_version:'1.0'})).status;assert.equal(out.checks.heartbeat_without_identity,401);
 results.push(out);console.log(JSON.stringify(out));
}
fs.writeFileSync('docs/05-qualidade/evidencias/cadastro-automatico-2026-11-05/production-http.json',JSON.stringify(results,null,2)+'\n');
