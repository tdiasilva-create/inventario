export const snapshotMillis="CAST((julianday(s.collected_at)-2440587.5)*86400000+0.5 AS INTEGER)";
// The cron already read active links and cursors. Reuse those bounds instead of
// joining the whole catalogue again. At most 80 bound parameters per statement.
export function pendingSnapshotsQuery(size){
 if(!Number.isInteger(size)||size<1||size>20)throw Error('Invalid snapshot batch size');
 return `WITH bounds(device_id,equipment_id,link_id,after_ms) AS MATERIALIZED (VALUES ${Array(size).fill('(?,?,?,?)').join(',')}), candidates AS (
 SELECT s.inventory_id,a.link_id,${snapshotMillis} AS monitor_ms
 FROM bounds a JOIN agent_current_snapshot c ON c.device_id=a.device_id
 JOIN agent_inventory_snapshots s ON s.inventory_id=c.inventory_id
 WHERE a.after_ms IS NULL AND s.device_id=a.device_id AND s.equipment_id=a.equipment_id
 UNION ALL
 SELECT s.inventory_id,a.link_id,${snapshotMillis} AS monitor_ms
 FROM bounds a CROSS JOIN agent_inventory_snapshots s
 WHERE a.after_ms IS NOT NULL AND s.device_id=a.device_id AND s.equipment_id=a.equipment_id
 AND ${snapshotMillis}>a.after_ms
)
SELECT * FROM candidates ORDER BY monitor_ms,inventory_id LIMIT 200`;
}
export function pendingSnapshotBatches(rows,cursors){
 const batches=[];
 for(let i=0;i<rows.length;i+=20){const group=rows.slice(i,i+20);batches.push({sql:pendingSnapshotsQuery(group.length),args:group.flatMap(r=>{
  const cursor=cursors.get(r.device_id);
  return [r.device_id,r.equipment_id,r.link_id,cursor?.link_id===r.link_id?cursor.collected_ms:null];
 })});}
 return batches;
}
export async function readPendingSnapshots(db,rows,cursors){
 const batches=pendingSnapshotBatches(rows,cursors);if(!batches.length)return [];
 const results=await db.batch(batches.map(b=>db.prepare(b.sql).bind(...b.args)));
 // A 200-row bound on each chunk contains every candidate for the global first
 // 200. The next minute resumes the remaining history; no intermediate loss.
 const candidates=results.flatMap(r=>r.results).sort((a,b)=>a.monitor_ms-b.monitor_ms||(a.inventory_id<b.inventory_id?-1:a.inventory_id>b.inventory_id?1:0)).slice(0,200);
 // Select keys first: a backlog across many batches must not load hundreds of
 // full hardware JSONs per batch, only the final 200 snapshots for this round.
 if(!candidates.length)return [];
 const details=[];for(let i=0;i<candidates.length;i+=50){const ids=candidates.slice(i,i+50).map(s=>s.inventory_id);details.push(db.prepare(`SELECT * FROM agent_inventory_snapshots WHERE inventory_id IN (${ids.map(()=>'?').join(',')})`).bind(...ids));}
 const full=new Map((await db.batch(details)).flatMap(r=>r.results).map(s=>[s.inventory_id,s]));
 return candidates.filter(s=>full.has(s.inventory_id)).map(s=>({...full.get(s.inventory_id),link_id:s.link_id,monitor_ms:s.monitor_ms}));
}
