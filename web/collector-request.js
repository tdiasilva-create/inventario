// The deadline covers headers AND the response body. Unknown writes are never retried here.
export async function readCollectorJson(path,options={}, {timeoutMs=30000,fetchImpl=globalThis.fetch}={}){
 const controller=new AbortController();let response,timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Object.assign(Error('O servidor demorou a confirmar. Confira a conexão e tente novamente; nada foi apagado desta tela.'),{unknown:true,httpStatus:response?.status}));},timeoutMs);});
 try{
  return await Promise.race([deadline,(async()=>{
   try{response=await fetchImpl(path,{...options,signal:controller.signal});}
   catch(cause){throw Object.assign(Error('Sem conexão com o servidor. O resultado é desconhecido; nada foi apagado desta tela.'),{unknown:true,cause});}
   let value;try{value=await response.json();}
   catch(cause){throw Object.assign(Error('O servidor não confirmou a operação. Nada foi apagado desta tela.'),{unknown:true,httpStatus:response.status,cause});}
   return {response,value};
  })()]);
 }finally{clearTimeout(timer);}
}
