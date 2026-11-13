// D-109: account-wide provider analytics, never a SQL scan/counter in the application DB.
export const USAGE_INTERVAL=300000;
export const USAGE_KEY='d1-usage:v1';
export const FREE_LIMITS=Object.freeze({rowsRead:5000000,rowsWritten:100000});
const DAY=86400000;
export function usagePeriod(now=Date.now()){
 const start=Math.floor(now/DAY)*DAY;
 return {date:new Date(start).toISOString().slice(0,10),start,end:start+DAY};
}
export function usageLevel(percent){return percent>=100?'limit':percent>=95?'critical':percent>=85?'high':percent>=70?'warning':'normal';}
export function usageQuery(account,now){
 const p=usagePeriod(now),recentStart=Math.max(p.start,now-3600000);
 return {query:`query($account:string!,$start:Time!,$end:Time!,$recent:Time!,$date:Date!,$last:Date!){viewer{accounts(filter:{accountTag:$account}){
 current:d1AnalyticsAdaptiveGroups(limit:1,filter:{datetime_geq:$start,datetime_lt:$end}){sum{rowsRead rowsWritten}}
 recent:d1AnalyticsAdaptiveGroups(limit:1,filter:{datetime_geq:$recent,datetime_lt:$end}){sum{rowsRead rowsWritten}}
 history:d1AnalyticsAdaptiveGroups(limit:32,filter:{date_geq:$date,date_leq:$last},orderBy:[date_ASC]){dimensions{date}sum{rowsRead rowsWritten}}
 }}}`,variables:{account,start:new Date(p.start).toISOString(),end:new Date(now).toISOString(),recent:new Date(recentStart).toISOString(),date:new Date(p.start-6*DAY).toISOString().slice(0,10),last:p.date}};
}
const validCount=n=>Number.isSafeInteger(n)&&n>=0;
function sums(groups){
 if(!Array.isArray(groups)||groups.length>1)throw Error('INVALID_ANALYTICS');
 if(!groups.length)return {rowsRead:0,rowsWritten:0};
 const sum=groups[0]?.sum;
 if(!sum||!validCount(sum.rowsRead)||!validCount(sum.rowsWritten))throw Error('INVALID_ANALYTICS');
 return {rowsRead:sum.rowsRead,rowsWritten:sum.rowsWritten};
}
export function parseUsage(data,now){
 const accounts=data?.data?.viewer?.accounts;
 if(data?.errors?.length||!Array.isArray(accounts)||accounts.length!==1)throw Error('INVALID_ANALYTICS');
 const a=accounts[0],current=sums(a.current),recent=sums(a.recent),p=usagePeriod(now);
 if(!Array.isArray(a.history)||a.history.length>7)throw Error('INVALID_ANALYTICS');
 const seen=new Set(),history=a.history.map(row=>{
  const date=row?.dimensions?.date;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>p.date||Date.parse(date)<p.start-6*DAY||seen.has(date))throw Error('INVALID_ANALYTICS');
  seen.add(date);return {date,...sums([row])};
 });
 return {date:p.date,observedAt:now,...current,recent:{...recent,seconds:Math.floor((now-Math.max(p.start,now-3600000))/1000)},history};
}
function metric(used,limit,recent,seconds,at){
 const percent=used/limit*100,rate=seconds>=900?recent/seconds:0;
 return {used,limit,remaining:Math.max(0,limit-used),percent,level:usageLevel(percent),estimatedLimitAt:rate>0&&used<limit?at+Math.ceil((limit-used)/rate)*1000:null};
}
export function usageView(cache,now=Date.now()){
 const p=usagePeriod(now),s=cache?.snapshot;
 const valid=s&&Number.isFinite(s.observedAt)&&validCount(s.rowsRead)&&validCount(s.rowsWritten);
 const current=valid&&s.date===p.date;
 const stale=!current||!!cache?.error||now-s.observedAt>USAGE_INTERVAL*2;
 const metrics=current?Object.fromEntries(Object.entries(FREE_LIMITS).map(([k,limit])=>[k,metric(s[k],limit,s.recent?.[k]||0,s.recent?.seconds||0,s.observedAt)])):null;
 if(stale&&metrics)for(const m of Object.values(metrics))m.estimatedLimitAt=null;
 return {scope:'account',plan:'free',intervalMs:USAGE_INTERVAL,period:p,updatedAt:valid?s.observedAt:null,lastAttemptAt:cache?.attemptAt||null,
  stale,error:cache?.error||(!valid?'WAITING_ANALYTICS':!current?'NEW_PERIOD_PENDING':null),metrics,
  percent:metrics?Math.max(metrics.rowsRead.percent,metrics.rowsWritten.percent):null,
  level:metrics?usageLevel(Math.max(metrics.rowsRead.percent,metrics.rowsWritten.percent)):'unknown',
  history:valid?s.history:[],limits:FREE_LIMITS};
}
export async function refreshD1Usage(env,now=Date.now(),{fetcher=fetch,force=false}={}){
 if(env.APP_KIND==='collector'||!env.USAGE_CACHE||!env.USAGE_ACCOUNT_ID||!env.CLOUDFLARE_ANALYTICS_TOKEN)return {skipped:'configuration'};
 if(!force&&Math.floor(now/60000)%5!==0)return {skipped:'schedule'};
 const old=await env.USAGE_CACHE.get(USAGE_KEY,'json');
 if(!force&&old?.attemptAt&&Math.floor(old.attemptAt/USAGE_INTERVAL)===Math.floor(now/USAGE_INTERVAL))return {skipped:'fresh'};
 let snapshot=old?.snapshot||null,error=null;
 try{
  const res=await fetcher('https://api.cloudflare.com/client/v4/graphql',{method:'POST',headers:{Authorization:`Bearer ${env.CLOUDFLARE_ANALYTICS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(usageQuery(env.USAGE_ACCOUNT_ID,now)),signal:AbortSignal.timeout(10000)});
  if(!res.ok)throw Error(res.status===401||res.status===403?'ANALYTICS_PERMISSION':'ANALYTICS_UNAVAILABLE');
  snapshot=parseUsage(await res.json(),now);
 }catch(e){error=['ANALYTICS_PERMISSION','INVALID_ANALYTICS'].includes(e?.message)?e.message:'ANALYTICS_UNAVAILABLE';}
 await env.USAGE_CACHE.put(USAGE_KEY,JSON.stringify({snapshot,error,attemptAt:now}),{expirationTtl:604800});
 return {ok:!error};
}
export async function d1UsageRoutes(request,url,user,env,{json,fail}){
 if(url.pathname!=='/api/root/d1-usage')return null;
 if(env.APP_KIND==='collector')return fail('Operação indisponível.',404);
 if(user.role!=='root')return fail('Somente root consulta o consumo da conta.',403);
 if(request.method!=='GET')return fail('Método não permitido.',405);
 if(!env.USAGE_CACHE||!env.USAGE_ACCOUNT_ID||!env.CLOUDFLARE_ANALYTICS_TOKEN)return json({...usageView(null),error:'NOT_CONFIGURED'});
 try{return json(usageView(await env.USAGE_CACHE.get(USAGE_KEY,'json')));}
 catch{return json({...usageView(null),error:'CACHE_UNAVAILABLE'});}
}
