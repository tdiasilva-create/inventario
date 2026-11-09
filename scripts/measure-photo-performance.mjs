// Local only: SQLite in memory and fake Google. No remote mode.
import {photoFixture} from '../tests/helpers/photo-performance.mjs';
const f=await photoFixture(),rows=[];
try{
 const id=crypto.randomUUID(),next=crypto.randomUUID();
 async function measure(operation,action){const {response,...counts}=await f.measure(action);const body=await response.arrayBuffer();rows.push({operation,...counts,status:response.status,bytes:body.byteLength});return response;}
 await measure('first_upload',()=>f.upload(id));await measure('upload_existing_folder',()=>f.upload(next));
 const read=await measure('collector_read',()=>f.read(id));
 await measure('collector_read_repeated',()=>f.read(id));
 await measure('gallery_read',()=>f.read(id,null,true));
 if(read.headers.has('ETag')){
  await measure('collector_conditional',()=>f.read(id,read.headers.get('ETag')));
  await measure('gallery_conditional',()=>f.read(id,read.headers.get('ETag'),true));
 }
 console.log(JSON.stringify({method:'SQL terminal executions; batch statements counted once; excludes Worker session query; all Google calls counted; local synthetic PNG',rows},null,2));
}finally{f.close();}
