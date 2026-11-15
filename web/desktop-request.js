// Bounded, read-only queries. No automatic retries or changes to saved data.
const sharedReads=new Map();
// Page-memory only, explicit server revalidation on EVERY request. No offline cache.
const validatedResults=new Map();
let validationEpoch=0;
let quotaBlock=null;
let sessionExpired=false;
const expiredMessage='Sua sessão expirou. Entre novamente no painel.';
let initialIdentity;
// Bootstrap identity only; permissions and every API request remain validated on the server.
export const initialPanelIdentity=()=>initialIdentity??=(readPanelJson('/api/auth/me').catch(e=>{initialIdentity=null;throw e;}));
// Only coalesce concurrent reads. Completed responses are not cached; never share writes.
export function sharedPanelJson(url){
 if(!sharedReads.has(url)){
  const promise=readPanelJson(url).finally(()=>{if(sharedReads.get(url)===promise)sharedReads.delete(url);});
  sharedReads.set(url,promise);
 }
 return sharedReads.get(url);
}
export async function readPanelJson(url,{timeoutMs=15000,signal}={}){
 try{
  // A definitive 401 ends reads for this document. Login reloads the document;
  // this helper is not used by collection or the native tracking capability.
  if(sessionExpired)throw Error(expiredMessage);
  if(quotaBlock&&Date.now()<quotaBlock.retryAt)throw Error(quotaBlock.message);
  quotaBlock=null;
  const timeout=AbortSignal.timeout(timeoutMs);
  const eligible=/^\/api\/inventory\/results(?:\?|$)/.test(url),cached=eligible?validatedResults.get(url):null,epoch=validationEpoch;
  const response=await fetch(url,{signal:signal?AbortSignal.any([signal,timeout]):timeout,cache:'no-store',...(cached?{headers:{'If-None-Match':cached.etag}}:{})});
  if(response.status===401||response.status===403){validatedResults.clear();validationEpoch++;if(response.status===401)sessionExpired=true;throw Error(response.status===401?expiredMessage:'Sua conta não tem permissão para esta consulta.');}
  if(sessionExpired)throw Error(expiredMessage);
  if(response.status===304){
   if(!cached||epoch!==validationEpoch||response.headers.get('ETag')!==cached.etag)throw Error('Não foi possível revalidar os resultados. Atualize a página.');
   return structuredClone(cached.data);
  }
  let data;
  try{data=await response.json();}catch(error){if(['TimeoutError','AbortError'].includes(error.name))throw error;throw Error('O servidor retornou uma resposta inválida. Tente novamente.');}
  if(!response.ok){
   if(data.code==='D1_DAILY_QUOTA'&&Number.isFinite(data.retryAt)&&data.retryAt>Date.now()&&data.retryAt-Date.now()<=86400000)quotaBlock={retryAt:data.retryAt,message:data.error};
   throw Error(data.message||data.error||'Não foi possível concluir a consulta. Tente novamente.');
  }
  if(eligible&&epoch===validationEpoch){
   const etag=response.headers.get('ETag');validatedResults.delete(url);
   if(etag){validatedResults.set(url,{etag,data:structuredClone(data)});while(validatedResults.size>20)validatedResults.delete(validatedResults.keys().next().value);}
  }
  return data;
 }catch(error){
  if(signal?.aborted)throw error;
  if(['TimeoutError','AbortError'].includes(error.name))throw Error('A consulta demorou mais que o esperado. Verifique a conexão e tente novamente.');
  if(error instanceof TypeError)throw Error('Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.');
  throw error;
 }
}
