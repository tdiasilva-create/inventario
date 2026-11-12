// Bounded, read-only queries. No automatic retries or changes to saved data.
const sharedReads=new Map();
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
  const timeout=AbortSignal.timeout(timeoutMs);
  const response=await fetch(url,{signal:signal?AbortSignal.any([signal,timeout]):timeout,cache:'no-store'});
  if(response.status===401)throw Error('Sua sessão expirou. Entre novamente no painel.');
  if(response.status===403)throw Error('Sua conta não tem permissão para esta consulta.');
  let data;
  try{data=await response.json();}catch(error){if(['TimeoutError','AbortError'].includes(error.name))throw error;throw Error('O servidor retornou uma resposta inválida. Tente novamente.');}
  if(!response.ok)throw Error(data.message||data.error||'Não foi possível concluir a consulta. Tente novamente.');
  return data;
 }catch(error){
  if(signal?.aborted)throw error;
  if(['TimeoutError','AbortError'].includes(error.name))throw Error('A consulta demorou mais que o esperado. Verifique a conexão e tente novamente.');
  if(error instanceof TypeError)throw Error('Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.');
  throw error;
 }
}
