import {visitVersion,validateVisitAnswers,labOptions,topicNames,errorsForTopic} from '../web/visit-schema.js';
const parse=v=>JSON.parse(v||'{}');
export async function visitReview(db,i){
 const row=await db.prepare('SELECT * FROM visit_answers WHERE inspection_id=?').bind(i.id).first(),answers=parse(row?.data_json);
 const equipment=(await db.prepare('SELECT id,data_json FROM equipments WHERE inspection_id=? AND duplicate_flag=0').bind(i.id).all()).results.map(e=>{const d=parse(e.data_json);return {id:e.id,data:{category:d.category,purpose:d.purpose,asset:d.asset}};});
 const photos=(await db.prepare('SELECT id,target_kind,target_id,status FROM collection_photos WHERE inspection_id=?').bind(i.id).all()).results;
 return {answers,version:row?.version||1,equipment,photos,errors:validateVisitAnswers(answers,{equipment,photos}),revision:i.revision};
}
export async function visitRoutes(request,url,user,env,{json,fail,body,unit,inspection,history,touch,store}){
 const p=url.pathname,db=env.DB;if(!['/api/collector/visit-start','/api/collector/visit','/api/collector/visit-save'].includes(p))return null;
 if(!['root','admin','operador'].includes(user.role))return fail('Perfil sem permissão de coleta.',403);
 if(p==='/api/collector/visit-start'&&request.method==='POST'){
  const data=await body(request),u=await unit(data.unitId);if(!u)return fail('Unidade não autorizada.',403);
  const old=await db.prepare("SELECT * FROM inspections WHERE unit_id=? AND state='open'").bind(u.id).first();
  if(old?.questionnaire_version===visitVersion)return json({inspection:old});
  if(old&&!data.preservePrevious)return json({error:'Há um rascunho do roteiro anterior. Você pode continuar nele ou preservá-lo e iniciar o novo roteiro.',legacyInspectionId:old.id},409);
  const id=crypto.randomUUID(),now=Date.now();
  await db.batch([...(old?[db.prepare("UPDATE inspections SET state='paused',updated_at=? WHERE id=? AND state='open'").bind(now,old.id),history(old,old.id,'inspection_paused_for_new_route',null,{newInspection:id})]:[]),db.prepare('INSERT INTO inspections(id,unit_id,questionnaire_version,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id,u.id,visitVersion,user.id,now,now),db.prepare('INSERT INTO visit_answers(inspection_id,updated_by,updated_at) VALUES(?,?,?)').bind(id,user.id,now)]);
  return json({inspection:await db.prepare('SELECT * FROM inspections WHERE id=?').bind(id).first()},201);
 }
 if(p==='/api/collector/visit'&&request.method==='GET'){
  const i=await inspection(url.searchParams.get('id'));if(!i||i.questionnaire_version!==visitVersion)return fail('Visita indisponível.',404);
  const review=await visitReview(db,i),environments=(await db.prepare('SELECT * FROM environments WHERE unit_id=? ORDER BY name').bind(i.unit_id).all()).results;
  return json({...review,inspection:i,unit:await unit(i.unit_id),environments,photosEnabled:store?await store.enabled():!!env.PHOTOS,photoProvider:store?.provider||null});
 }
 if(p==='/api/collector/visit-save'&&request.method==='POST'){
  const input=await body(request),i=await inspection(input.inspectionId);if(!i||i.state!=='open'||i.questionnaire_version!==visitVersion)return fail('Visita indisponível.',409);
  const row=await db.prepare('SELECT * FROM visit_answers WHERE inspection_id=?').bind(i.id).first();if(row.version!==input.version)return fail('Outro operador alterou esta visita. Recarregue antes de salvar; suas respostas continuam nesta tela.',409);
  if(!input.answers||typeof input.answers!=='object'||Array.isArray(input.answers))return fail('Respostas inválidas.');
  const keys=['administrative','laboratory','labNoComputers','printers','internet','wired','wifi','outlets','irregular','specialist','lack','responsible','role','notes','completed','problems','needs'];
  const a=Object.fromEntries(keys.filter(k=>input.answers[k]!==undefined).map(k=>[k,input.answers[k]]));
  for(const [key,options]of Object.entries({administrative:['Sim','Não','Não avaliado'],printers:['Sim','Não','Não avaliado'],laboratory:labOptions,internet:['Funciona','Funciona com falhas','Não funciona','Não existe','Não avaliado'],wired:['Sim','Parcialmente','Não','Não avaliado'],wifi:['Sim','Não','Não avaliado'],outlets:['Sim','Parcialmente','Não','Não avaliado'],irregular:['Sim','Não','Não avaliado'],specialist:['Sim','Não','Não avaliado'],lack:['Sim','Não','Não avaliado']}))if(a[key]!==undefined&&!options.includes(a[key]))return fail('Resposta inválida: '+key);
  for(const key of ['labNoComputers','responsible','role','notes'])if(a[key]!==undefined&&(typeof a[key]!=='string'||a[key].length>4000))return fail('Texto inválido: '+key);
  if(a.completed&&(!Array.isArray(a.completed)||a.completed.some(t=>!Object.keys(topicNames).includes(t))))return fail('Conclusão de assunto inválida.');
  for(const key of ['problems','needs']){if(a[key]!==undefined&&!Array.isArray(a[key]))return fail('Lista inválida.');if(a[key])a[key]=a[key].map(r=>Object.fromEntries((key==='problems'?['id','description','area','location','priority']:['id','type','location','quantity','priority']).filter(k=>r?.[k]!==undefined).map(k=>[k,r[k]])));}
  const previous=parse(row.data_json);
  for(const topic of (a.completed||[]).filter(t=>!previous.completed?.includes(t))){const context=await visitReview(db,i);const errors=errorsForTopic(validateVisitAnswers(a,context),topic);if(Object.keys(errors).length)return json({error:Object.values(errors).join(' '),fields:errors},400);}
  const encoded=JSON.stringify(a);if(encoded===row.data_json)return json({version:row.version,unchanged:true});
  const result=await db.batch([db.prepare('UPDATE visit_answers SET data_json=?,version=version+1,updated_by=?,updated_at=? WHERE inspection_id=? AND version=? AND EXISTS(SELECT 1 FROM inspections WHERE id=? AND state=?)').bind(encoded,user.id,Date.now(),i.id,input.version,i.id,'open'),touch(i),history(i,i.id,'visit_answers_saved',parse(row.data_json),a)]);if(!result[0].meta.changes)return fail('Conflito de edição. Recarregue.',409);
  return json({version:row.version+1});
 }
 return fail('Método não permitido.',405);
}
