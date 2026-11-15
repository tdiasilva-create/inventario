// Read-only deployment checks; unsigned machine calls must fail before any job/write.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const bases=process.argv.slice(2);if(bases.length!==2)throw Error('Informe painel e coletor publicados.');
const checks=[];
for(const base of bases){
 for(const path of ['/api/root/network-tests','/api/root/network-tests/computers']){
  const r=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(15000)});
  assert.equal(r.status,401,path);checks.push({base,path,status:r.status});
 }
 for(const action of ['start','check','result']){
  const path='/api/agent/v1/network-tests/'+action;
  const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});
  assert.equal(r.status,401,path);assert.equal((await r.json()).code,'AUTH_FAILED');checks.push({base,path,status:r.status});
 }
}
for(const path of ['/testes-internet','/network-tests.html','/network-tests.js']){
 const r=await fetch(bases[0]+path,{redirect:'manual',signal:AbortSignal.timeout(15000)});
 assert.equal(r.status,302,path);assert.equal(r.headers.get('location'),'/login');checks.push({base:bases[0],path,status:r.status});
}
const dir='docs/05-qualidade/evidencias/internet-d118/producao';await mkdir(dir,{recursive:true});
await writeFile(dir+'/network-release.json',JSON.stringify({status:'PASS',at:new Date().toISOString(),checks,noOfficialRecordsWritten:true},null,2));
console.log(JSON.stringify({status:'PASS',checks:checks.length}));
