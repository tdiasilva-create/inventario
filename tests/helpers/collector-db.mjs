import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
export function collectorFixture(){
 const sqlite=new DatabaseSync(':memory:');
 for(const f of readdirSync('migrations').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('migrations/'+f,'utf8'));
 function prepare(sql,params=[]){return {bind:(...p)=>prepare(sql,p),first:async()=>sqlite.prepare(sql).get(...params)||null,all:async()=>({results:sqlite.prepare(sql).all(...params)}),run:async()=>{const statement=sqlite.prepare(sql);if(statement.columns().length)return {results:statement.all(...params),meta:{changes:0}};const r=statement.run(...params);return {results:[],meta:{changes:Number(r.changes)}};}};}
 const db={prepare,batch:async statements=>{sqlite.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 const root={id:crypto.randomUUID(),role:'root',username:'root'},operator={id:crypto.randomUUID(),role:'operador',username:'operador',displayName:'Operador · teste isolado'};
 for(const u of [root,operator])sqlite.prepare('INSERT INTO users(id,username,role,password_hash,salt,created_at,display_name) VALUES(?,?,?,?,?,?,?)').run(u.id,u.username,u.role,'TEST-ONLY','TEST-ONLY',Date.now(),u.displayName||'');
 const ids={};for(const [key,name,active]of [['pending','TESTE ISOLADO · Unidade sem inventário',1],['progress','TESTE ISOLADO · Unidade em preenchimento',1],['blocked','TESTE ISOLADO · Inventário de outra equipe',1],['assigned','TESTE ISOLADO · Unidade atribuída com inventário',1],['inactive','TESTE ISOLADO · Inativa',0]]){const id=crypto.randomUUID();ids[key]=id;sqlite.prepare('INSERT INTO units(id,name,name_key,active,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id,name,key,active,Date.now(),Date.now());}
 sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),ids.progress,root.id,Date.now(),Date.now());
 sqlite.prepare('INSERT INTO unit_collection_totals(unit_id,records,items) VALUES(?,1,1)').run(ids.progress);
 for(const key of ['blocked','assigned'])sqlite.prepare('INSERT INTO published_equipment_counts(unit_id,category,records,items) VALUES(?,?,1,1)').run(ids[key],'desktop');
 sqlite.prepare('INSERT INTO unit_assignments(user_id,unit_id,assigned_by,assigned_at) VALUES(?,?,?,?)').run(operator.id,ids.assigned,root.id,Date.now());
 const helpers={json:(value,status=200)=>Response.json(value,{status}),fail:(error,status=400)=>Response.json({error},{status}),body:r=>r.json(),audit:()=>prepare('SELECT 1')};
 return {sqlite,db,root,operator,ids,helpers};
}
