import {isolatedCollector} from '../tests/helpers/collector-http.mjs';
import {readFile} from 'node:fs/promises';
const bytes=await readFile('web/assets/prefeitura-paco.png');
const fixture=await isolatedCollector({role:'root',desktop:true,extraEnv:{PHOTOS:{get:async()=>({body:bytes})}}});
const id=fixture.sqlite.prepare("SELECT id FROM inspections WHERE unit_id=? AND state='open'").get(fixture.ids.progress).id;
for(let n=0;n<3;n++){const p=crypto.randomUUID();fixture.sqlite.prepare('INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(p,fixture.ids.progress,id,n===0?'facade':'answer',fixture.ids.progress,'isolated/'+p,'image/png',bytes.length,'TEST-ONLY',fixture.operator.id,Date.now(),n===2?'pending':'ready');}
console.log(fixture.base+'/coletas-em-andamento?vistoria='+id);
process.on('SIGINT',async()=>{await fixture.close();process.exit();});
