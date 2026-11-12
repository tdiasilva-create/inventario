// Private SQL export -> isolated workerd D1. No network, production queries or data output.
// Usage: node scripts/measure-d1-budget-local.mjs <private SQL export>
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {collectionCTE,collectionCountsSql} from '../server/pending-indicators.mjs';
import {fleetPresenceSql,fleetCatalogueSql,computerWhereSql} from '../server/service-desk.mjs';
import {pendingSnapshotBatches,readPendingSnapshots} from '../server/monitoring-queries.mjs';
import {livePresenceSql} from '../server/agent-monitoring.mjs';
import {collectorFixture} from '../tests/helpers/collector-db.mjs';
import {seedEquipmentConsultation} from '../tests/helpers/equipment-consultation.mjs';
import {session} from '../tests/helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
import {runAgentMonitoring} from '../server/agent-monitoring.mjs';
import {measuredEnvironment,timingHeader} from '../server/request-timing.mjs';
const input=process.argv[2];if(!input)throw Error('Provide an existing private SQL export.');
const require=createRequire(import.meta.url),{Miniflare,convertV4MiniflareOptions}=createRequire(require.resolve('wrangler'))('miniflare');
let sqlite,localSession;
if(input==='--synthetic'){
 const f=collectorFixture({beforeMigration:'0030'}),seed=seedEquipmentConsultation(f);sqlite=f.sqlite;
 localSession=await session(f,f.root);
 for(let n=0;n<71;n++){const unit=crypto.randomUUID();sqlite.prepare("INSERT INTO units(id,name,name_key,unit_type,active,created_at,updated_at) VALUES(?,?,?,'Escola municipal',1,0,0)").run(unit,'TESTE · Unidade '+n,'test-budget-'+n);for(let j=0;j<10;j++)sqlite.prepare("INSERT INTO inspections(id,unit_id,state,created_by,created_at,updated_at) VALUES(?,?,'completed',?,0,0)").run(crypto.randomUUID(),unit,f.root.id);}
 const template=sqlite.prepare('SELECT * FROM equipments WHERE id=?').get(seed.items[0].id),cols=Object.keys(template);
 const insert=sqlite.prepare('INSERT INTO equipments('+cols.join(',')+') VALUES('+cols.map(()=>'?').join(',')+')');
 const base=Date.parse('2026-11-12T12:00:00Z'),at=new Date(base).toISOString();
 for(let n=0;n<200;n++){
  const device=n?crypto.randomUUID():seed.device,equipment=n?crypto.randomUUID():seed.items[0].id;
  if(n){insert.run(...cols.map(k=>k==='id'?equipment:template[k]));sqlite.prepare("INSERT INTO agent_devices VALUES(?,'linked',?,NULL,NULL,NULL)").run(device,at);sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,linked_by,linked_at) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),device,equipment,f.root.id,at);sqlite.prepare('INSERT INTO agent_presence(device_id,data_json,updated_at) VALUES(?,?,?)').run(device,JSON.stringify({last_live_contact_at:at}),at);}
  let id;for(let j=0;j<30;j++){id=crypto.randomUUID();const date=new Date(base+j*1000).toISOString();sqlite.prepare('INSERT INTO agent_inventory_snapshots(inventory_id,device_id,equipment_id,collected_at,received_at,boot_id,sequence,reason,snapshot_hash,sections_json) VALUES(?,?,?,?,?,?,1,?,?,?)').run(id,device,equipment,date,date,crypto.randomUUID(),'periodic',id,'{}');}
  sqlite.prepare('INSERT INTO agent_current_snapshot VALUES(?,?,?) ON CONFLICT(device_id) DO UPDATE SET inventory_id=excluded.inventory_id,collected_at=excluded.collected_at').run(device,id,new Date(base+29000).toISOString());
  const link=sqlite.prepare('SELECT link_id FROM agent_equipment_links WHERE device_id=? AND ended_at IS NULL').get(device).link_id;
  sqlite.prepare('INSERT INTO agent_monitor_cursors VALUES(?,?,?,?,0,?,?)').run(device,link,base+29000,'{}',crypto.randomUUID(),base);
 }
}else{sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(input,'utf8'));}
const legacy=JSON.parse(readFileSync('tests/fixtures/d1-budget-legacy-queries.json','utf8'));
const oldJoins=legacy.joins,oldLive=legacy.live,oldSnapshots=legacy.snapshots;
const pairs=[
 ['pending.collections',collectionCTE+' SELECT state,COUNT(*) AS total FROM pending GROUP BY state',collectionCountsSql],
 ['fleet.catalogue',fleetCatalogueSql,null],
 ['fleet.presence',`SELECT e.unit_id,l.device_id,d.state,p.data_json AS presence_json ${oldJoins} WHERE ${computerWhereSql}`,fleetPresenceSql],
 ['monitor.presence',oldLive,livePresenceSql],
 ['monitor.snapshots',oldSnapshots,'bounded'],
 ['demands.pending',"SELECT unit_id,COUNT(*) AS total FROM service_requests WHERE status!='Concluída' GROUP BY unit_id",null]
];
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,compatibilityDate:'2026-10-27',script:'export default {fetch(){return new Response("local only")}}',d1Databases:['DB']}));
try{
 const db=await mf.getD1Database('DB');
 const schema=sqlite.prepare("SELECT name,type,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all();
 const tables=schema.filter(s=>s.type==='table');
 await db.batch(tables.map(t=>db.prepare(t.sql)));
 const statements=[db.prepare('PRAGMA defer_foreign_keys=ON')];let records=0;
 for(const t of tables){const rows=sqlite.prepare('SELECT * FROM "'+t.name.replaceAll('"','""')+'"').all();for(const row of rows){const cols=Object.keys(row);statements.push(db.prepare(`INSERT INTO "${t.name}" (${cols.map(c=>'"'+c+'"').join(',')}) VALUES(${cols.map(()=>'?').join(',')})`).bind(...Object.values(row)));records++;}}
 await db.batch(statements);
 for(const s of schema.filter(s=>s.type!=='table'))await db.prepare(s.sql).run();
 console.log(JSON.stringify({runtime:'local workerd D1',tables:tables.length,records,privateDataPrinted:false}));
 const digest=rows=>createHash('sha256').update(JSON.stringify(rows.map(r=>JSON.stringify(Object.fromEntries(Object.entries(r).sort(([a],[b])=>a.localeCompare(b))))).sort())).digest('hex');
 const project=(name,rows)=>rows.map(r=>name==='monitor.presence'?Object.fromEntries(['link_id','device_id','equipment_id','unit_id','state','presence_json'].map(k=>[k,r[k]])):name==='monitor.snapshots'?Object.fromEntries(Object.entries(r).filter(([k])=>k!=='monitor_ms')):r);
 const out=[];
 for(const [name,before] of pairs){const r=await db.prepare(before).all();out.push({name,before:r.meta,resultCount:r.results.length,digestBefore:digest(project(name,r.results))});}
 const migration=readFileSync('migrations/0030_d1_read_budget.sql','utf8').split('\n').filter(l=>!l.trimStart().startsWith('--')).join(' ');
 await db.exec(migration);
 for(const [i,[name,before,after]] of pairs.entries()){
  let r,plan;
  if(after==='bounded'){
   const rows=(await db.prepare(livePresenceSql).all()).results,cursors=new Map((await db.prepare('SELECT * FROM agent_monitor_cursors').all()).results.map(r=>[r.device_id,r]));
   const batches=pendingSnapshotBatches(rows,cursors),measurement=measuredEnvironment(new Request('https://local.test/api/measure'),{DB:db});
   const results=await readPendingSnapshots(measurement.DB,rows,cursors),header=timingHeader(measurement);
   r={meta:{rows_read:Number(header.match(/d1_rows_read;desc="(\d+)"/)?.[1]||0),rows_written:Number(header.match(/d1_rows_written;desc="(\d+)"/)?.[1]||0)},results};
   plan=batches.length?(await db.prepare('EXPLAIN QUERY PLAN '+batches[0].sql).bind(...batches[0].args).all()).results.map(r=>r.detail):[];
  }else{r=await db.prepare(after||before).all();plan=(await db.prepare('EXPLAIN QUERY PLAN '+(after||before)).all()).results.map(r=>r.detail);}
  out[i].after=r.meta;out[i].equivalent=out[i].digestBefore===digest(project(name,r.results));delete out[i].digestBefore;out[i].reductionPercent=+(100*(1-r.meta.rows_read/out[i].before.rows_read)).toFixed(1);out[i].plan=plan;
 }
 const scenarios=[];
 if(localSession){
  const env={DB:db,AUTH_PEPPER:'TEST-ONLY'};
  const metrics=value=>Object.fromEntries([...value.matchAll(/(d1_rows_read|d1_rows_written|d1_calls|d1_unmeasured);desc="(\d+)"/g)].map(m=>[m[1],Number(m[2])]));
  for(const path of ['/api/inventory/panel-status','/api/operations/units','/api/operations/computers?presence=lost','/api/dispatch/map']){
   const response=await worker.fetch(new Request('https://local.test'+path,{headers:{Cookie:localSession.cookie}}),env);
   if(response.status!==200)throw Error('Local scenario failed: '+path+' '+response.status);
   scenarios.push({path,status:response.status,...metrics(response.headers.get('Server-Timing')||'')});
  }
  const measured=measuredEnvironment(new Request('https://local.test/api/local-measurement'),env);
  await runAgentMonitoring(measured);scenarios.push({path:'cron:monitor',...metrics(timingHeader(measured)||'')});
 }
 const report={at:new Date().toISOString(),runtime:'Miniflare/workerd isolated D1, not current production',dataset:input==='--synthetic'?'200 agents, 76 units, 6000 historical snapshots, synthetic':'historical private export',pairs:out,scenarios};
 mkdirSync('docs/05-qualidade/evidencias/d1-budget-2026-11-12',{recursive:true});writeFileSync('docs/05-qualidade/evidencias/d1-budget-2026-11-12/'+(input==='--synthetic'?'synthetic-200-costs.json':'local-query-costs.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(out.map(({name,before,after,equivalent,reductionPercent})=>({name,before:before.rows_read,after:after.rows_read,equivalent,reductionPercent})),null,2));
 if(scenarios.length)console.log(JSON.stringify({scenarios}));
 if(out.some(r=>!r.equivalent))throw Error('Query equivalence failed');
}finally{sqlite.close();await mf.dispose();}
