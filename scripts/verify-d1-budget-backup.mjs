// Rehearse 0030 on a private D1 export. Never prints records or contacts production.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {collectionCTE} from '../server/pending-indicators.mjs';
const file=process.argv[2];if(!file)throw Error('Provide a PRIVATE SQL export path.');
const sql=readFileSync(file),db=new DatabaseSync(':memory:');
try{
 db.exec(sql.toString());
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
 const digest=table=>createHash('sha256').update(JSON.stringify(db.prepare('SELECT * FROM "'+table.replaceAll('"','""')+'"').all())).digest('hex');
 const original=new Map(tables.map(t=>[t,digest(t)]));
 const foreignBefore=db.prepare('PRAGMA foreign_key_check').all();
 db.exec(readFileSync('migrations/0030_d1_read_budget.sql','utf8'));
 for(const table of tables)assert.equal(digest(table),original.get(table),'existing table changed: '+table);
 assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),foreignBefore,'new foreign-key violation');
 const canonical=db.prepare(collectionCTE+' SELECT state,COUNT(*) AS total FROM pending GROUP BY state ORDER BY state').all();
 assert.deepEqual(db.prepare('SELECT state,total FROM panel_collection_counts WHERE total>0 ORDER BY state').all(),canonical);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM panel_collection_state_source s LEFT JOIN panel_collection_states p ON p.unit_id=s.unit_id WHERE p.unit_id IS NULL OR s.state IS NOT p.state').get().n,0);
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 console.log(JSON.stringify({passed:true,exportBytes:sql.length,exportSha256:createHash('sha256').update(sql).digest('hex'),originalTablesUnchanged:tables.length,preExistingForeignKeyIssues:foreignBefore.length,projectionMatches:true,integrity:'ok',localOnly:true}));
}finally{db.close();}
