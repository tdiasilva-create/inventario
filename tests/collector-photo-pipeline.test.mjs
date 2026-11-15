import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync('web/collector-v3.js','utf8'),code=source.slice(source.indexOf('async function preparePhotos('),source.indexOf('// R4: fotos que o navegador conhece'));
const gate=()=>{let release;return {promise:new Promise(r=>release=r),release:(...a)=>release(...a)};};
const tick=()=>new Promise(r=>setImmediate(r));
function harness(){
 const log=[],prepared=[],collection={inspection:{id:'visit-a'},photos:[]},target={id:'pc-a',version:1};
 const ctx=vm.createContext({crypto,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL:()=>{}},Date,Promise,Error,Math,Map,Set,JSON,
  me:{csrf:'test'},collection,item:target,itemVersion:1,targets:new Map(),previews:new Map(),preparing:new Map(),uploads:new Map(),caps:{photosEnabled:true},receivedPhotos:new Map(),readyPreviews:{set:()=>{}},errorSession:false,status:'',renderedContext:'context',contextKey:()=> 'context',render:()=>{},paintStatus:()=>{},setStatus:()=>{},save:async()=>{},saveDraft:async t=>log.push(['draft',t.id]),
  preparePhoto:async file=>{prepared.push(file.name);if(file.wait)await file.wait;return {blob:new Blob(['original']),thumbnail:new Blob(['thumb'])};},
  api:async(path,_,o)=>{log.push([path,o.headers['X-Target-Id']]);return {status:'ready',sha256:'test-hash'};},photoHash:async()=> 'test-hash'});
 vm.runInContext(code,ctx);return {ctx,log,prepared,target,collection};
}
test('D120: first photo uploads before preparing the next; every photo retains its original target while navigating',async()=>{
 const h=harness(),g=gate();const promise=h.ctx.preparePhotos({dataset:{photo:'equipment:pc-a'},files:[{name:'one'},{name:'two',wait:g.promise}]});
 await tick();assert.ok(h.log.some(([p])=>p==='/api/collector/photo-upload'),'first upload already happened while second preparation is paused');assert.equal(h.collection.photos.length,1);
 h.ctx.item={id:'pc-b',version:1};g.release();await promise;await h.ctx.settleUploads();
 assert.equal(h.collection.photos.length,2);assert.ok(h.collection.photos.every(p=>p.target_id==='pc-a'&&p.inspection_id==='visit-a'));
 assert.equal(h.ctx.previews.get('equipment:pc-a').length,0);
});
test('D120: failed first photo is not retried by preparation completion; barrier blocks until explicit retry',async()=>{
 const h=harness(),g=gate();let uploads=0;h.ctx.api=async(path)=>{if(path.endsWith('photo-upload')){uploads++;throw Error('offline');}return {status:'ready'};};
 const promise=h.ctx.preparePhotos({dataset:{photo:'equipment:pc-a'},files:[{name:'one'},{name:'two',wait:g.promise}]});await tick();g.release();await promise;await tick();assert.equal(uploads,1);
 await assert.rejects(h.ctx.settleUploads(),e=>!!e.localPhotos?.length);assert.equal(h.ctx.previews.get('equipment:pc-a').length,2);
 h.ctx.api=async()=>({status:'ready',sha256:'hash'});await h.ctx.startUpload('equipment:pc-a');await h.ctx.settleUploads();assert.equal(h.collection.photos.length,2);
});
