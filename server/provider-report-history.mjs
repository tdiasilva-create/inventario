import {providerReport} from './provider-report.mjs';
export const providerSchedule={weekday:1,hour:8,minute:0,timezone:'America/Fortaleza',label:'Toda segunda-feira às 08h (Fortaleza)'};
const WEEK=7*86400000;
export function nextProviderReportAt(now){
 // Fortaleza UTC-03: Monday 08:00 = Monday 11:00 UTC. Strictly future.
 const d=new Date(now),monday=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),11));
 monday.setUTCDate(monday.getUTCDate()+(1-monday.getUTCDay()+7)%7);
 if(monday.getTime()<=now)monday.setUTCDate(monday.getUTCDate()+7);
 return monday.toISOString();
}
export async function runProviderReports(env,now=Date.now()){
 if(!env.DB||env.APP_KIND==='collector')return {skipped:true};
 const db=env.DB,state=await db.prepare('SELECT * FROM provider_report_schedule WHERE id=1').first();
 if(state&&Date.parse(state.next_due_at)>now)return {due:false};
 const generated=new Date(now).toISOString(),kind=state?'weekly':'initial',due=state?.next_due_at||generated;
 const key=state?'weekly:'+due:'initial',id=crypto.randomUUID(),next=nextProviderReportAt(now);
 // No retrospective fabrication after downtime: one current reading, original due
 // date and skipped weeks are explicit; retries never overwrite a saved report.
 const missed=state?Math.max(0,Math.floor((now-Date.parse(due))/WEEK)):0;
 const report=await providerReport(db,env,now);
 await db.batch([
  db.prepare('INSERT INTO provider_reports(id,period_key,kind,scheduled_at,generated_at,missed_weeks,unit_count,with_provider,report_json) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(period_key) DO NOTHING').bind(id,key,kind,due,generated,missed,report.total,report.totals.with_provider,JSON.stringify(report)),
  state?db.prepare('UPDATE provider_report_schedule SET next_due_at=? WHERE id=1 AND next_due_at=?').bind(next,due):db.prepare('INSERT INTO provider_report_schedule(id,started_at,next_due_at) VALUES(1,?,?) ON CONFLICT(id) DO NOTHING').bind(generated,next)
 ]);
 return {generated:true,kind,scheduled_at:due,next_due_at:next};
}
export async function listProviderReports(db,offset=0){
 const [page,total,state]=await db.batch([
  db.prepare('SELECT id,kind,scheduled_at,generated_at,missed_weeks,unit_count,with_provider FROM provider_reports ORDER BY generated_at DESC,id DESC LIMIT 20 OFFSET ?').bind(offset),
  db.prepare('SELECT COUNT(*) AS count FROM provider_reports'),
  db.prepare('SELECT started_at,next_due_at FROM provider_report_schedule WHERE id=1')
 ]);
 const count=total.results[0].count;
 return {items:page.results,total:count,offset,nextOffset:offset+page.results.length<count?offset+20:null,
  schedule:{...providerSchedule,...state.results[0],initialized:!!state.results[0]},server_time:new Date().toISOString()};
}
export async function savedProviderReport(db,id){
 const r=await db.prepare('SELECT * FROM provider_reports WHERE id=?').bind(id).first();
 if(!r)return null;
 return {...JSON.parse(r.report_json),archive:{id:r.id,kind:r.kind,scheduled_at:r.scheduled_at,generated_at:r.generated_at,missed_weeks:r.missed_weeks}};
}
