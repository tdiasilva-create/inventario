import {validateUnit} from './unit-validation.mjs';
export async function importRoutes(request,url,user,db,{json,fail,body,audit}){
 if(!url.pathname.startsWith('/api/root/import-'))return null;if(user.role!=='root')return fail('Sem permissão.',403);
 const all=(await db.prepare('SELECT name,name_key,code FROM units').all()).results;
 function inspect(rows){const names=new Map(all.map(x=>[x.name_key,x.name])),codes=new Map(all.filter(x=>x.code).map(x=>[x.code,x.name]));return rows.map((row,index)=>{const result=validateUnit({...row,active:row.active});const errors={...(result.fields||{})};if(result.value){const v=result.value;if(names.has(v.name_key))errors.name='Nome repetido: '+names.get(v.name_key);if(v.code&&codes.has(v.code))errors.code='INEP já cadastrado em '+codes.get(v.code);names.set(v.name_key,v.name);if(v.code)codes.set(v.code,v.name);}return {line:index+2,input:row,value:result.value,errors};});}
 if(url.pathname==='/api/root/import-preview'&&request.method==='POST'){
  const data=await body(request);if(!Array.isArray(data.rows)||!data.rows.length||data.rows.length>200)return fail('Envie entre 1 e 200 linhas por importação.');const rows=inspect(data.rows);const invalid=rows.some(x=>Object.keys(x.errors).length);let batchId=null;
  if(!invalid){const values=rows.map(x=>x.value),encoded=JSON.stringify(values);if(new TextEncoder().encode(encoded).length>90000)return fail('Planilha muito extensa. Divida em lotes menores.');batchId=crypto.randomUUID();const now=Date.now();await db.batch([db.prepare('DELETE FROM import_batches WHERE expires_at<? AND commit_token IS NULL').bind(now),db.prepare('INSERT INTO import_batches(id,actor_id,rows_json,created_at,expires_at) VALUES(?,?,?,?,?)').bind(batchId,user.id,encoded,now,now+1800000)]);}
  return json({rows,batchId,valid:!invalid,count:rows.length});
 }
 if(url.pathname==='/api/root/import-confirm'&&request.method==='POST'){
  const data=await body(request),batch=await db.prepare('SELECT * FROM import_batches WHERE id=? AND actor_id=?').bind(String(data.batchId),user.id).first();if(!batch)return fail('Prévia não encontrada. Gere uma nova prévia.',404);
  const values=JSON.parse(batch.rows_json);if(batch.commit_token)return json({count:values.length,alreadyImported:true});if(batch.expires_at<Date.now())return fail('Prévia expirada. Valide a planilha novamente.',409);
  const review=inspect(values.map(x=>({...x,active:!!x.active})));if(review.some(x=>Object.keys(x.errors).length))return json({error:'O cadastro mudou desde a prévia. Valide novamente.',rows:review},409);
  const token=crypto.randomUUID(),now=Date.now();const rows=values.map(v=>({...v,id:crypto.randomUUID(),now}));const encoded=JSON.stringify(rows);
  const result=await db.batch([db.prepare('UPDATE import_batches SET commit_token=? WHERE id=? AND commit_token IS NULL').bind(token,batch.id),db.prepare("INSERT INTO units(id,name,name_key,code,address,neighborhood,latitude,longitude,active,manager_name,unit_type,region,phone,email,created_at,updated_at) SELECT json_extract(value,'$.id'),json_extract(value,'$.name'),json_extract(value,'$.name_key'),json_extract(value,'$.code'),json_extract(value,'$.address'),json_extract(value,'$.neighborhood'),json_extract(value,'$.latitude'),json_extract(value,'$.longitude'),json_extract(value,'$.active'),json_extract(value,'$.manager_name'),json_extract(value,'$.unit_type'),json_extract(value,'$.region'),json_extract(value,'$.phone'),json_extract(value,'$.email'),?,? FROM json_each(?) WHERE EXISTS(SELECT 1 FROM import_batches WHERE id=? AND commit_token=?)").bind(now,now,encoded,batch.id,token),db.prepare("INSERT INTO unit_changes(actor_id,event,target_id,payload,created_at) SELECT ?,'units_imported',?,?,? WHERE EXISTS(SELECT 1 FROM import_batches WHERE id=? AND commit_token=?)").bind(user.id,batch.id,JSON.stringify({count:values.length}),now,batch.id,token),db.prepare('INSERT INTO audit(user_id,event,created_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM import_batches WHERE id=? AND commit_token=?)').bind(user.id,'units_imported:'+batch.id,now,batch.id,token)]);
  return json({count:values.length,alreadyImported:!result[0].meta.changes});
 }
 return fail('Operação não encontrada.',404);
}


