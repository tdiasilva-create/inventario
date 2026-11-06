import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/worker.mjs';
import {collectorFixture} from './helpers/collector-db.mjs';
import {verifyEnvironments} from '../scripts/verificar-ambiente-validacao.mjs';
function setup(){
 const f=collectorFixture(),calls=[];
 const env={DB:f.db,AUTH_PEPPER:'TESTE-ISOLADO',APP_KIND:'collector',ASSETS:{fetch:async()=>new Response('<form>Login</form>')}};
 const fetchImpl=async(url,init)=>{calls.push({method:init?.method||'GET',url});return worker.fetch(new Request(url,init),env);};
 return {...f,env,calls,fetchImpl};
}
test('Sonda padrão só lê: dois endereços, 12 respostas e nenhuma escrita no banco',async()=>{
 const s=setup();try{
  const changes=s.sqlite.prepare('SELECT total_changes() n').get().n;
  const r=await verifyEnvironments(['https://coletor-validacao.test','https://painel-validacao.test'],{fetchImpl:s.fetchImpl,log:()=>{}});
  assert.equal(r.total,12);assert.equal(r.failures,0);assert.equal(r.migrationVerified,false);
  assert.ok(s.calls.every(c=>c.method==='GET'));assert.equal(s.sqlite.prepare('SELECT total_changes() n').get().n,changes);
 }finally{s.sqlite.close();}
});
test('401 não comprova rota/migração: tabela de recibos ausente não pode ser anunciada como validada',async()=>{
 const s=setup();try{
  s.sqlite.exec('DROP TABLE agent_claim_requests');
  const r=await s.fetchImpl('https://coletor-validacao.test/api/rota-inexistente',{method:'GET'});assert.equal(r.status,401);
  const logs=[];const result=await verifyEnvironments(['https://coletor-validacao.test'],{fetchImpl:s.fetchImpl,probeAgent:true,log:m=>logs.push(m)});
  assert.equal(result.passed,7);assert.equal(result.migrationVerified,false);assert.ok(logs.some(m=>m.includes('Não comprova versão')));
  assert.equal(s.sqlite.prepare('SELECT sum(count) n FROM agent_rate_limits').get().n,1,'POST registra tentativa mesmo sem credenciais');
 }finally{s.sqlite.close();}
});
test('Resposta inesperada falha e origem com credenciais é rejeitada antes da rede',async()=>{
 const r=await verifyEnvironments(['https://validacao.test'],{fetchImpl:async()=>new Response('erro',{status:500}),log:()=>{}});assert.equal(r.failures,6);
 let called=false;await assert.rejects(verifyEnvironments(['https://nome:segredo@validacao.test'],{fetchImpl:async()=>{called=true;}}),/sem credenciais/);assert.equal(called,false);
});
