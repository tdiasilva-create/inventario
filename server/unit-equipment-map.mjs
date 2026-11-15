import {inventoryScopeSql} from './unit-scope.mjs';

// The current FK wins. Legacy JSON is used only when that FK is absent;
// a name never creates a relationship, and a foreign unit's room never matches.
export const currentSectorSql = (equipment='e', room='r') => `${room}.id=COALESCE(NULLIF(${equipment}.environment_id,''),json_extract(${equipment}.data_json,'$.environment')) AND ${room}.unit_id=${equipment}.unit_id`;
export const equipmentQuantitySql = record => `CASE WHEN json_extract(${record},'$.mode')='Lote' THEN COALESCE(json_extract(${record},'$.quantity'),1) ELSE 1 END`;
const uuid = value => typeof value==='string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);

export async function unitEquipmentMapRead(request,url,user,env,{json,fail}) {
 if(!user)return fail('Autenticação necessária.',401);
 if(!['root','admin','visualizador'].includes(user.role)||env.APP_KIND==='collector')return fail('Consulta gerencial não permitida.',403);
 if(request.method!=='GET')return fail('Consulta disponível somente para leitura.',405);
 const unitId=url.searchParams.get('unitId');
 if(!uuid(unitId))return fail('Unidade inválida.');
 const unit=await env.DB.prepare(`SELECT u.id,u.name FROM units u WHERE u.id=? AND u.active=1 AND ${inventoryScopeSql('u')}`).bind(unitId).first();
 if(!unit)return fail('Unidade indisponível.',403);
 const [rooms,counts]=await env.DB.batch([
  env.DB.prepare('SELECT id,name,type FROM environments WHERE unit_id=? ORDER BY name COLLATE NOCASE,id').bind(unitId),
  env.DB.prepare(`SELECT r.id AS id,COUNT(*) AS records,COALESCE(SUM(${equipmentQuantitySql('e.data_json')}),0) AS items,SUM(CASE WHEN e.published_json IS NULL OR e.published_json!=e.data_json THEN 1 ELSE 0 END) AS partial_records FROM inventory_equipment_all e LEFT JOIN environments r ON ${currentSectorSql()} WHERE e.unit_id=? AND e.data_json IS NOT NULL GROUP BY r.id`).bind(unitId)
 ]);
 const totals=new Map(counts.results.map(row=>[row.id,row]));
 const sectors=rooms.results.map(room=>({...room,records:0,items:0,partial_records:0,...totals.get(room.id)}));
 if(totals.has(null))sectors.push({...totals.get(null),id:'unassigned',name:'Setor não informado',type:''});
 return json({unit,sectors,records:sectors.reduce((n,r)=>n+r.records,0),items:sectors.reduce((n,r)=>n+r.items,0),source:'current',server_time:new Date().toISOString()});
}
