// Read-only production boundary checks: no valid credentials or real positions.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2];if(!base)throw Error('Provide panel URL.');
const checks=[];
for(const route of ['tracking-heartbeat','tracking-stop']){
 for(const [method,headers,status] of [
  ['GET',{},405],
  ['POST',{'Content-Type':'application/json'},401],
  ['POST',{'Content-Type':'application/json',Origin:'https://example.invalid'},403]
 ]){
  const r=await fetch(new URL('/api/technician/'+route,base),{method,headers,body:method==='POST'?'{}':undefined,redirect:'manual',signal:AbortSignal.timeout(20000)});
  assert.equal(r.status,status,route+' '+method);checks.push({route,method,foreignOrigin:!!headers.Origin,status:r.status});
 }
}
const apk=await fetch(new URL('/tecnico/SEMED-Tecnico.apk',base),{method:'HEAD',signal:AbortSignal.timeout(20000)});
assert.equal(apk.status,200);assert.equal(apk.headers.get('content-disposition'),'attachment; filename=SEMED-Tecnico.apk');
checks.push({route:'apk',method:'HEAD',status:200,filename:'SEMED-Tecnico.apk'});
const dir='docs/05-qualidade/evidencias/localizacao-d114-2026-11-13/producao';await mkdir(dir,{recursive:true});
await writeFile(dir+'/tracking-boundaries.json',JSON.stringify({status:'PASS',at:new Date().toISOString(),checks},null,2));
console.log(JSON.stringify({status:'PASS',checks:checks.length,noOfficialRecordsWritten:true}));
