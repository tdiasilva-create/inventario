// Rehearse 0033 against a PRIVATE export; no record contents are printed.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const file=process.argv[2];if(!file)throw Error('Provide a private SQL export path.');
const sql=readFileSync(file),db=new DatabaseSync(':memory:');
try{
 db.exec(sql.toString());
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
 const digest=table=>{const h=createHash('sha256');for(const row of db.prepare('SELECT * FROM "'+table.replaceAll('"','""')+'"').iterate())h.update(JSON.stringify(row));return h.digest('hex');};
 const before=new Map(tables.map(t=>[t,digest(t)])),foreignBefore=db.prepare('PRAGMA foreign_key_check').all();
 db.exec(readFileSync('migrations/0033_technician_tracking.sql','utf8'));
 for(const t of tables)assert.equal(digest(t),before.get(t),'Existing table changed: '+t);
 assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),foreignBefore,'New foreign-key issue');
 const canonical=db.prepare("SELECT a.user_id,COUNT(*) AS open_count FROM dispatch_assignments a JOIN service_requests r ON r.id=a.request_id WHERE a.ended_at IS NULL AND r.status!='Concluída' GROUP BY a.user_id ORDER BY a.user_id").all();
 assert.deepEqual(db.prepare('SELECT user_id,open_count FROM dispatch_open_counts ORDER BY user_id').all(),canonical);
 for(const t of ['dispatch_tracking','dispatch_tracking_positions','dispatch_tracking_routes'])assert.equal(db.prepare('SELECT COUNT(*) n FROM '+t).get().n,0);
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 console.log(JSON.stringify({passed:true,localOnly:true,exportBytes:sql.length,exportSha256:createHash('sha256').update(sql).digest('hex'),originalTablesUnchanged:tables.length,preExistingForeignKeyIssues:foreignBefore.length,queueCounters:canonical.length,projectionMatches:true,trackingRows:0,integrity:'ok'}));
}finally{db.close();}
