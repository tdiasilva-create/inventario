// Only thumbnails of photos selected in THIS document and acknowledged ready.
// No downloaded photo or authorization cache; bounded to 32 * 30 KiB.
export function createPhotoPreviews({limit=32,urls=URL,onEvict=()=>{}}={}){
 const entries=new Map();
 function remove(id){const url=entries.get(id);if(!url)return;entries.delete(id);onEvict(id,url);urls.revokeObjectURL(url);}
 return {
  get:id=>entries.get(id),
  set(id,blob){remove(id);entries.set(id,urls.createObjectURL(blob));while(entries.size>limit)remove(entries.keys().next().value);},
  remove,
  clear(){for(const id of [...entries.keys()])remove(id);},
  retain(ids){for(const id of [...entries.keys()])if(!ids.has(id))remove(id);},
  get size(){return entries.size;}
 };
}
