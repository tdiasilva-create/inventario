const categories={computer:'Computador',desktop:'Computador desktop',notebook:'Notebook',printer:'Impressora',other:'Equipamento',tablet:'Tablet',projector:'Projetor',tv:'Televisor'};
const kinds={facade:'Fachada da unidade',environment:'Ambiente',equipment:'Equipamento',answer:'Evidência da resposta',occurrence:'Ocorrência',laboratory:'Laboratório'};
const groups={A:'Identificação',B:'Ambientes',C:'Internet',D:'Rede / Wi-Fi',E:'Energia',F:'Computadores',G:'Impressoras',H:'Problemas e necessidades'};
const parse=s=>{try{return JSON.parse(s||'{}');}catch{return {};}};
// One bounded metadata query per page, never the image BLOB. Published captions use published data/snapshots.
export async function describePhotos(db,photos){
 if(!photos.length)return photos;
 const rows=(await db.prepare(`SELECT p.id,p.target_kind,p.target_id,p.unit_id,p.inspection_id,p.created_at,i.state AS inspection_state,u.name AS unit_name,
  COALESCE(NULLIF(author.display_name,''),author.username,'Usuário indisponível') AS created_by_name,
  CASE WHEN i.state='completed' THEN eq.published_json ELSE eq.data_json END AS equipment_json,n.name AS display_name,
  COALESCE((SELECT r.name FROM environments r WHERE r.unit_id=p.unit_id AND r.name_version>1 AND r.id=CASE WHEN p.target_kind='environment' THEN p.target_id ELSE json_extract(CASE WHEN i.state='completed' THEN eq.published_json ELSE eq.data_json END,'$.environment') END),CASE WHEN i.state='completed' THEN (SELECT json_extract(ie.data_json,'$.name') FROM inspection_environments ie WHERE ie.inspection_id=i.id AND ie.environment_id=COALESCE(json_extract(eq.published_json,'$.environment'),e.id) LIMIT 1) ELSE COALESCE(e.name,ee.name) END) AS environment_name,
  (SELECT json_group_array(json_object('section',s.section,'data',json(s.data_json))) FROM inspection_sections s WHERE s.inspection_id=i.id AND p.target_kind IN ('answer','occurrence')) AS sections_json
  FROM collection_photos p JOIN inspections i ON i.id=p.inspection_id JOIN units u ON u.id=p.unit_id
  LEFT JOIN users author ON author.id=p.created_by
  LEFT JOIN inventory_equipment_all eq ON p.target_kind='equipment' AND eq.id=p.target_id AND eq.unit_id=p.unit_id
  LEFT JOIN equipment_names n ON n.equipment_id=eq.id AND n.unit_id=eq.unit_id
  LEFT JOIN environments e ON p.target_kind='environment' AND e.id=p.target_id AND e.unit_id=p.unit_id
  LEFT JOIN environments ee ON ee.id=eq.environment_id AND ee.unit_id=p.unit_id
  WHERE p.id IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(photos.map(p=>p.id))).all()).results;
 const byId=new Map(rows.map(r=>[r.id,r]));
 return photos.map(photo=>{
  const row=byId.get(photo.id);if(!row)return photo;
  let label=kinds[row.target_kind]||'Fotografia da coleta';
  if(row.target_kind==='equipment'){const data=parse(row.equipment_json);label=[row.display_name||categories[data.category]||label,row.environment_name||data.environmentName,data.position_label].filter(Boolean).join(' · ');}
  if(row.target_kind==='environment'&&row.environment_name)label+=' · '+row.environment_name;
  if(['answer','occurrence'].includes(row.target_kind))for(const section of parse(row.sections_json)||[]){
   const data=section.data||{},occurrence=(data.occurrences||[]).find?.(o=>o.id===row.target_id);
   if(occurrence){label=[groups[section.section]||label,occurrence.type,occurrence.description].filter(Boolean).join(' · ');break;}
   if(Object.values(data._photoEvidence||{}).includes(row.target_id)){label+=' · '+(groups[section.section]||section.section);break;}
  }
  return {...photo,label:label.slice(0,300),unit_id:row.unit_id,unit_name:row.unit_name,inspection_id:row.inspection_id,inspection_state:row.inspection_state,created_at:row.created_at,created_by_name:row.created_by_name};
 });
}
