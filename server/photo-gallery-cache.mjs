import {databaseIdentity} from './request-timing.mjs';

// Counts only, never sessions, permissions, photograph rows or file contents.
// The caller authenticates each request; every page and its revision are fresh
// and transactional. Both Workers invalidate the revision through SQL triggers.
const revisionSql='SELECT epoch,revision FROM photo_gallery_revision WHERE id=1';
const caches=new WeakMap(),limit=64;
function revision(result){const row=result.results[0];if(!row)throw Error('Photo gallery revision unavailable');return row.epoch+':'+row.revision;}
export async function readGalleryPage(db,pageSql,pageParams,countSql,countParams){
 const identity=databaseIdentity(db),key=JSON.stringify([countSql,countParams]);
 const [version,page]=await db.batch([db.prepare(revisionSql),db.prepare(pageSql).bind(...pageParams)]);
 const token=revision(version),existing=caches.get(identity);
 if(existing?.revision===token&&existing.entries.has(key)){
  const counts=existing.entries.get(key);existing.entries.delete(key);existing.entries.set(key,counts);
  return {rows:page.results,counts};
 }
 // On a miss, reread the page with the counts in ONE database snapshot. A
 // concurrent publication/inactivation must not pair old counts with new rows.
 const [actual,fresh,totals]=await db.batch([db.prepare(revisionSql),db.prepare(pageSql).bind(...pageParams),db.prepare(countSql).bind(...countParams)]);
 const current=revision(actual);let cache=caches.get(identity);
 if(cache?.revision!==current){cache={revision:current,entries:new Map()};caches.set(identity,cache);}
 cache.entries.delete(key);cache.entries.set(key,totals.results);
 if(cache.entries.size>limit)cache.entries.delete(cache.entries.keys().next().value);
 return {rows:fresh.results,counts:totals.results};
}
