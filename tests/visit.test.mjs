import test from 'node:test';import assert from 'node:assert/strict';import {collectorFixture} from './helpers/collector-db.mjs';import {collectorRoutes} from '../server/collector.mjs';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=','base64');
test('roteiro novo preserva anterior, salva ficha curta, exige evidências e só publica após confirmação',async()=>{
 const f=collectorFixture(),env={DB:f.db},objects=new Map();
 const call=async(path,data,user=f.operator)=>{const r=new Request('http://test/api/collector/'+path,data?{method:'POST',body:JSON.stringify(data)}:{});return collectorRoutes(r,new URL(r.url),user,env,f.helpers);};
 const ok=async(path,data)=>{const r=await call(path,data);assert.ok(r.status<300,await r.clone().text());return r.json();};
 const upload=async(i,kind,target,id=crypto.randomUUID())=>{const r=new Request('http://test/api/collector/photo-upload',{method:'POST',headers:{'Content-Type':'image/png','X-Photo-Id':id,'X-Inspection-Id':i,'X-Target-Kind':kind,'X-Target-Id':target},body:png});return collectorRoutes(r,new URL(r.url),f.operator,env,f.helpers);};
 try{const legacy=await ok('start',{unitId:f.ids.pending});await ok('section-save',{inspectionId:legacy.inspection.id,section:'A',version:1,answers:{notes:'Preservar este rascunho'}});
 assert.equal((await call('visit-start',{unitId:f.ids.pending})).status,409);assert.equal((await call('visit-start',{unitId:f.ids.pending},{...f.operator,role:'visualizador'})).status,403);
 const {inspection:i}=await ok('visit-start',{unitId:f.ids.pending,preservePrevious:true});assert.equal(i.questionnaire_version,'visita-2');assert.equal(f.sqlite.prepare('SELECT state FROM inspections WHERE id=?').get(legacy.inspection.id).state,'paused');assert.match(f.sqlite.prepare("SELECT data_json FROM inspection_sections WHERE inspection_id=? AND section='A'").get(legacy.inspection.id).data_json,/Preservar/);
 assert.equal((await ok('visit-start',{unitId:f.ids.pending})).inspection.id,i.id);
 const {environment}=await ok('environment-save',{inspectionId:i.id,name:'Secretaria isolada',type:'Secretaria'}),id=crypto.randomUUID();const item={category:'desktop',purpose:'Administrativo',mode:'Individual',quantity:1,environment:environment.id,asset:'0000123',brand:'Não identificado',operation:'Funcionando',condition:'Bom',use:'Em uso'};
 assert.equal((await ok('equipment-save',{inspectionId:i.id,id,data:item})).version,1);
 const a={administrative:'Sim',laboratory:'Não existe',printers:'Não',internet:'Não existe',wired:'Não',wifi:'Não',outlets:'Sim',irregular:'Não',specialist:'Não',lack:'Não',completed:[]};
 await ok('visit-save',{inspectionId:i.id,version:1,answers:a});assert.equal((await call('visit-save',{inspectionId:i.id,version:1,answers:a})).status,409);
 let review=await ok('review?id='+i.id);assert.ok(review.errors.facade);assert.ok(review.errors['photo:'+id]);assert.equal((await call('finish',{inspectionId:i.id,revision:review.revision,confirm:true})).status,400);
 assert.equal((await upload(i.id,'facade',f.ids.pending)).status,503);
 env.PHOTOS={put:async(key,bytes)=>objects.set(key,bytes),get:async key=>objects.has(key)?{body:objects.get(key)}:null,delete:async key=>objects.delete(key)};
 assert.equal((await upload(i.id,'facade',f.ids.blocked)).status,409);
 assert.equal((await upload(i.id,'facade',f.ids.pending)).status,201);assert.equal((await upload(i.id,'equipment',id)).status,201);
 const saved=await ok('visit?id='+i.id);a.completed=['administrative','laboratory','printers','infrastructure','needs'];await ok('visit-save',{inspectionId:i.id,version:saved.version,answers:a});review=await ok('review?id='+i.id);assert.deepEqual(review.errors,{});
 const official=new Request('http://test/api/inventory/results');let result=await(await collectorRoutes(official,new URL(official.url),f.root,env,f.helpers)).json();assert.ok(!result.equipment.some(x=>x.unit_id===f.ids.pending));
 await ok('finish',{inspectionId:i.id,revision:review.revision,confirm:true});assert.ok(f.sqlite.prepare('SELECT published_json FROM equipments WHERE id=?').get(id).published_json.includes('0000123'));assert.equal((await ok('finish',{inspectionId:i.id,revision:review.revision,confirm:true})).completed,true);
 result=await(await collectorRoutes(official,new URL(official.url),f.root,env,f.helpers)).json();assert.equal(result.equipment.find(x=>x.unit_id===f.ids.pending).purpose,'Administrativo');assert.equal(result.units.find(x=>x.unit_id===f.ids.pending).laboratory,'Não existe');assert.equal(objects.size,2);
 }finally{f.sqlite.close();}
});
