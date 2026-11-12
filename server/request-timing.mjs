// Per-request measurements only. Never retain SQL, parameters, credentials or IDs.
const timingKey=Symbol('request-timing'),databaseKey=Symbol('database-identity');
export const databaseIdentity=db=>db?.[databaseKey]||db;
export async function timed(env,name,operation){
 const metrics=env?.[timingKey];if(!metrics)return operation();
 const start=performance.now();try{return await operation();}finally{metrics.durations[name]=(metrics.durations[name]||0)+performance.now()-start;}
}
function measuredDatabase(db,env){
 const originals=new WeakMap();
 const record=result=>{const metrics=env[timingKey];for(const item of Array.isArray(result)?result:[result]){
  const meta=item?.meta;
  if(Number.isFinite(meta?.rows_read)&&Number.isFinite(meta?.rows_written)){metrics.rowsRead+=meta.rows_read;metrics.rowsWritten+=meta.rows_written;metrics.measuredStatements++;}
  else metrics.unmeasuredStatements++;
 }return result;};
 const wrapStatement=statement=>{
  const proxy=new Proxy(statement,{get(target,key){
   if(key==='bind')return (...args)=>wrapStatement(target.bind(...args));
   if(['first','all','raw','run'].includes(key))return (...args)=>{env[timingKey].calls++;return timed(env,'d1',async()=>{
    // Native first() discards metadata. Execute the same SQL once via all(), then
    // return the same first row. Column-name first/raw remain native and explicit
    // as unmeasured. No extra query or data retained for accounting.
    if(key==='first'&&!args.length&&typeof target.all==='function')return record(await target.all()).results?.[0]??null;
    return record(await target[key](...args));
   });};
   const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;
  }});originals.set(proxy,statement);return proxy;
 };
 return new Proxy(db,{get(target,key){
  if(key===databaseKey)return databaseIdentity(target);
  if(key==='prepare')return sql=>wrapStatement(target.prepare(sql));
  if(key==='batch')return statements=>{env[timingKey].calls++;return timed(env,'d1',async()=>record(await target.batch(statements.map(s=>originals.get(s)||s))));};
  if(key==='withSession'&&typeof target.withSession==='function')return (...args)=>measuredDatabase(target.withSession(...args),env);
  const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;
 }});
}
export function measuredEnvironment(request,env){
 if(env.APP_KIND==='collector'||request.method!=='GET'||!new URL(request.url).pathname.startsWith('/api/'))return env;
 const measured={...env,[timingKey]:{start:performance.now(),durations:{},calls:0,rowsRead:0,rowsWritten:0,measuredStatements:0,unmeasuredStatements:0}};
 if(env.DB)measured.DB=measuredDatabase(env.DB,measured);
 return measured;
}
export function timingHeader(env){
 const metrics=env[timingKey];if(!metrics)return null;
 const durations={...metrics.durations,total:performance.now()-metrics.start};
 // Durations may overlap (auth contains D1). They must not be summed.
 return Object.entries(durations).filter(([key])=>['auth','d1','drive_headers','total'].includes(key)).map(([key,value])=>`${key};dur=${Math.max(0,value).toFixed(1)}`).concat(`d1_calls;desc="${metrics.calls}"`,
  ...(metrics.measuredStatements?[`d1_rows_read;desc="${metrics.rowsRead}"`,`d1_rows_written;desc="${metrics.rowsWritten}"`]:[]),
  ...(metrics.unmeasuredStatements?[`d1_unmeasured;desc="${metrics.unmeasuredStatements}"`]:[])).join(', ');
}
