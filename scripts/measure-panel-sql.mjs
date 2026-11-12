// Read-only baseline: exact queries used by pending-summary and operations/units.
// Records query plans and D1 metadata, never returned application records.
import {collectionCTE,hardwarePendingFrom} from '../server/pending-indicators.mjs';
import {computerJoins,computerWhereSql} from '../server/service-desk.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const dir=resolve('docs/05-qualidade/evidencias/desempenho-2026-11-12');mkdirSync(dir,{recursive:true});
const queries=[
 ['pending.collections',collectionCTE+' SELECT state,COUNT(*) AS total FROM pending GROUP BY state'],
 ['pending.demands',"SELECT unit_id,COUNT(*) AS total FROM service_requests WHERE status!='Concluída' GROUP BY unit_id ORDER BY unit_id"],
 ['pending.hardware','SELECT COUNT(*) AS total '+hardwarePendingFrom],
 ['fleet.catalogue',"SELECT u.id,u.name,u.unit_type,u.active,c.value AS computer_declaration,c.version AS context_version,EXISTS(SELECT 1 FROM inspections i WHERE i.unit_id=u.id AND i.state='completed') AS collected FROM units u LEFT JOIN computer_context c ON c.target_id=u.id AND c.kind='unit' WHERE u.unit_type!='Escola conveniada' ORDER BY u.name COLLATE NOCASE,u.id"],
 ['fleet.presence',`SELECT e.unit_id,l.device_id,d.state,p.data_json AS presence_json ${computerJoins} WHERE ${computerWhereSql}`],
 ['fleet.demands',"SELECT unit_id,COUNT(*) AS total FROM service_requests WHERE status!='Concluída' GROUP BY unit_id"],
];
const list=[];for(let i=1;i<=5;i++)for(const [name,sql] of queries)list.push({name,iteration:i,sql});
for(const [name,sql] of queries)list.push({name,explain:true,sql:'EXPLAIN QUERY PLAN '+sql});
const file=resolve(dir,'read-only-measurements.sql');writeFileSync(file,list.map(x=>x.sql+';').join('\n'));
const startedAt=new Date().toISOString(),run=spawnSync(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),'d1','execute','semed-inventario-auth','--remote','--json','--command',list.map(x=>x.sql+';').join('\n')],{windowsHide:true,encoding:'utf8',maxBuffer:20*1024*1024,env:{...process.env,CLOUDFLARE_ACCOUNT_ID:'ce059c2b3e50037922a441a66814090d'}});
if(run.status!==0)throw Error('Read-only D1 measurement failed; no application results saved.');
const result=JSON.parse(run.stdout);if(result.length!==list.length)throw Error('Unexpected measurement count.');
const rows=result.map((r,i)=>({name:list[i].name,iteration:list[i].iteration,explain:!!list[i].explain,success:r.success,meta:r.meta,...(list[i].explain?{plan:r.results.map(p=>p.detail)}:{resultRows:r.results.length})}));
if(rows.some(r=>r.meta?.rows_written>0))throw Error('Unexpected write metadata.');
const output={startedAt,finishedAt:new Date().toISOString(),method:'30 SELECTs and 6 EXPLAINs, one Wrangler D1 remote execution; excludes HTTP auth, Worker serialization, Drive, browser and network',rows};
writeFileSync(resolve(dir,'d1-read-only.json'),JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
