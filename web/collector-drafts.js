// Rascunhos na memória da aba. Contexto imutável por visita/assunto; nunca é offline durável.
export function createDraftQueue({send,reconcile,onState=()=>{}}){
 const entries=new Map();
 const key=(i,g)=>i+':'+g;
 const encode=v=>JSON.stringify(v);
 function entry(i,g,version,data){const k=key(i,g);if(!entries.has(k))entries.set(k,{i,g,version,local:structuredClone(data),confirmed:encode(data),pending:null,error:null});return entries.get(k);}
 function set(i,g,version,data){const e=entry(i,g,version,data);e.local=structuredClone(data);onState();return e;}
 async function flush(i,g){const e=entries.get(key(i,g));if(!e)return;
  if(e.pending){await e.pending;return flush(i,g);}
  // A newer server version needs an explicit choice, never another autosave.
  if(e.error?.conflict)throw e.error;
  if(encode(e.local)===e.confirmed){e.error=null;return;}
  const payload=structuredClone(e.local),encoded=encode(payload),version=e.version;e.error=null;
  e.pending=(async()=>{let r;try{r=await send({inspectionId:i,section:g,version,answers:payload});}
   catch(error){if(error.unknown&&reconcile){const found=await reconcile(i,g).catch(()=>null);if(found&&found.version===version+1&&encode(found.data)===encoded)r={version:found.version,state:found.state};}if(!r)throw error;}
   e.version=r.version;e.confirmed=encoded;e.state=r.state;
  })().catch(error=>{e.error=error;throw error;}).finally(()=>{e.pending=null;onState();});onState();await e.pending;
  if(encode(e.local)!==e.confirmed)return flush(i,g);
 }
 return {set,entry,flush,async flushAll({skipConflicts=false}={}){let first;for(const e of entries.values()){if(skipConflicts&&e.error?.conflict)continue;try{await flush(e.i,e.g);}catch(error){first??=error;}}if(first)throw first;},
  adopt(i,g,row){const e=entries.get(key(i,g));if(e?.pending)throw Error('Aguarde o salvamento em curso.');entries.set(key(i,g),{i,g,version:row.version,local:structuredClone(row.data),confirmed:encode(row.data),state:row.state,pending:null,error:null});onState();},
  hasPending:()=>[...entries.values()].some(e=>e.pending||encode(e.local)!==e.confirmed),
  failed:()=>[...entries.values()].find(e=>e.error),
  forget(i,g){entries.delete(key(i,g));},
  get(i,g){return entries.get(key(i,g));}
 };
}
