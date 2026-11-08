import {presenceState,presenceThreshold} from './agentes/presence.mjs';
const parse=s=>s?JSON.parse(s):{};
const clean=v=>typeof v==='string'?v.trim().replace(/\s+/g,' ').toUpperCase():v;
const serial=v=>v?.reliability==='ok'&&typeof v.value==='string'&&v.value.trim()?clean(v.value):null;
const sorted=a=>a.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
// Exige informação suficiente e qualidade ok. IP, usuário, firmware, driver e espaço livre não são peças.
export function hardwareComponents(sections){
 const out={},ok=k=>sections[k]?.quality==='ok'?sections[k].data:null;
 const cpu=ok('cpu');if(cpu?.processors?.length&&cpu.processors.every(p=>p.name&&Number.isInteger(p.cores)))out.cpu=sorted(cpu.processors.map(p=>({modelo:clean(p.name),nucleos:p.cores})));
 const mem=ok('memory');if(Number.isSafeInteger(mem?.installed_bytes)&&mem.installed_bytes>0){
  out.memory_total={bytes:mem.installed_bytes};
  if(mem.modules?.length&&mem.modules.every(m=>Number.isSafeInteger(m.capacity_bytes)&&m.capacity_bytes>0)){
   out.memory_modules=sorted(mem.modules.map(m=>({bytes:m.capacity_bytes})));
   if(mem.modules.every(m=>m.memory_type||m.type))out.memory_types=sorted(mem.modules.map(m=>({bytes:m.capacity_bytes,tipo:clean(m.memory_type||m.type)})));
   if(mem.modules.every(m=>serial(m.serial)))out.memory_serials=sorted(mem.modules.map(m=>({serie:serial(m.serial),bytes:m.capacity_bytes})));
  }
 }
 const disks=ok('storage')?.physical_disks?.filter(d=>!['external','removable','virtual'].includes(d.location));
 if(disks?.length&&disks.every(d=>d.model&&Number.isSafeInteger(d.size_bytes)&&d.size_bytes>0)){
  out.storage=sorted(disks.map(d=>({modelo:clean(d.model),bytes:d.size_bytes})));
  if(disks.every(d=>serial(d.serial)))out.storage_serials=sorted(disks.map(d=>({serie:serial(d.serial),modelo:clean(d.model),bytes:d.size_bytes})));
 }
 const gpu=ok('gpu')?.adapters;
 if(gpu?.length&&gpu.every(a=>/^PCI\\VEN_[A-F0-9]{4}&DEV_[A-F0-9]{4}/i.test(a.pnp_device_id||'')))out.gpu=sorted(gpu.map(a=>({identificador:clean(a.pnp_device_id.split('\\').slice(0,2).join('\\'))})));
 const board=ok('system')?.baseboard;
 if(board?.manufacturer&&board?.product)out.board={fabricante:clean(board.manufacturer),modelo:clean(board.product)};
 if(serial(board?.serial))out.board_serial={serie:serial(board.serial)};
 return out;
}
export const componentNames={gpu:'Adaptadores de vídeo (PCI)',cpu:'Processador',memory_total:'Memória total',memory_types:'Tipos dos módulos de memória',memory_modules:'Módulos de memória',memory_serials:'Séries da memória',storage:'Discos físicos',storage_serials:'Séries dos discos',board:'Placa-mãe',board_serial:'Série da placa-mãe'};
const active=`FROM agent_equipment_links l JOIN agent_devices d ON d.device_id=l.device_id JOIN equipments e ON e.id=l.equipment_id JOIN units u ON u.id=e.unit_id LEFT JOIN agent_presence p ON p.device_id=d.device_id WHERE l.ended_at IS NULL AND d.state='linked' AND u.active=1`;
const liveSelect=`SELECT l.link_id,l.device_id,l.equipment_id,l.linked_at,e.unit_id,e.published_json,e.data_json,u.name AS unit_name,d.state,p.data_json AS presence_json ${active}`;
// Uma rodada em lote; sem painel aberto também funciona. Repetições/concorrrência não duplicam eventos.
export async function runAgentMonitoring(env,now=Date.now()){
 const db=env.DB,threshold=presenceThreshold(env),rows=(await db.prepare(liveSelect).all()).results;
 const cursors=new Map((await db.prepare('SELECT * FROM agent_monitor_cursors').all()).results.map(r=>[r.device_id,r]));
 const snapshots=(await db.prepare(`SELECT s.*,l.link_id FROM agent_inventory_snapshots s JOIN agent_equipment_links l ON l.device_id=s.device_id AND l.equipment_id=s.equipment_id AND l.ended_at IS NULL JOIN equipments e ON e.id=s.equipment_id JOIN units u ON u.id=e.unit_id LEFT JOIN agent_monitor_cursors m ON m.device_id=s.device_id JOIN agent_current_snapshot c ON c.device_id=s.device_id JOIN agent_devices d ON d.device_id=s.device_id WHERE u.active=1 AND d.state='linked' AND ((m.device_id IS NULL OR m.link_id<>l.link_id) AND s.inventory_id=c.inventory_id OR (m.link_id=l.link_id AND CAST((julianday(s.collected_at)-2440587.5)*86400000+0.5 AS INTEGER)>m.collected_ms)) ORDER BY julianday(s.collected_at),s.inventory_id LIMIT 200`).all()).results;
 const statements=[],q=(sql,...args)=>db.prepare(sql).bind(...args);
 const open=(await db.prepare("SELECT * FROM agent_notifications WHERE kind='communication_lost' AND resolved_at IS NULL").all()).results;
 const links=new Map(rows.map(r=>[r.link_id,r]));
 for(const n of open){const r=links.get(n.link_id),p=parse(r?.presence_json),state=presenceState(r,p,now,threshold);
  if(!r||state!=='no_recent_communication'||p.last_live_contact_at!==n.observed_at){
   const resolution=!r?'Vínculo encerrado, revogado ou unidade inativa':state==='reported_suspend'?'Suspensão informada':state==='reported_shutdown'?'Desligamento informado':'Comunicação retomada';
   statements.push(q('UPDATE agent_notifications SET resolved_at=?,resolution=? WHERE id=? AND resolved_at IS NULL',now,resolution,n.id));
  }
 }
 for(const r of rows){const p=parse(r.presence_json);if(presenceState(r,p,now,threshold)!=='no_recent_communication')continue;
  const key='loss|'+r.link_id+'|'+p.last_live_contact_at;
  // Confere novamente o contato no momento da escrita: heartbeat concorrente não gera perda falsa.
  statements.push(q(`INSERT OR IGNORE INTO agent_notifications(id,event_key,device_id,link_id,equipment_id,unit_id,kind,observed_at,detected_at,details_json) SELECT ?,?,?,?,?,?,'communication_lost',?,?,? WHERE EXISTS(SELECT 1 FROM agent_presence p JOIN agent_equipment_links l ON l.device_id=p.device_id JOIN agent_devices d ON d.device_id=l.device_id WHERE l.link_id=? AND l.ended_at IS NULL AND d.state='linked' AND p.data_json=?)`,crypto.randomUUID(),key,r.device_id,r.link_id,r.equipment_id,r.unit_id,p.last_live_contact_at,now,JSON.stringify({threshold_seconds:threshold}),r.link_id,r.presence_json));
 }
 const grouped=new Map();for(const s of snapshots){if(!grouped.has(s.device_id))grouped.set(s.device_id,[]);grouped.get(s.device_id).push(s);}
 for(const [deviceId,list]of grouped){const row=rows.find(r=>r.device_id===deviceId);if(!row)continue;
  const old=cursors.get(deviceId),same=old?.link_id===row.link_id,components=same?parse(old.components_json):{},changes=[];let watermark=same?old.collected_ms:0;
  for(const s of list){const ms=Date.parse(s.collected_at);if(!Number.isFinite(ms)||ms<=watermark||ms>now+300000)continue;
   const next=hardwareComponents(parse(s.sections_json)),diff=[];
   for(const [k,value]of Object.entries(next)){if(components[k]&&JSON.stringify(components[k].value)!==JSON.stringify(value))diff.push({component:k,label:componentNames[k],before:components[k].value,after:value,previous_collected_at:components[k].at});components[k]={value,at:s.collected_at};}
   if(diff.length)changes.push({snapshot:s,changes:diff});watermark=ms;
  }
  const token=crypto.randomUUID(),revision=old?.revision??-1;
  if(!old)statements.push(q(`INSERT OR IGNORE INTO agent_monitor_cursors VALUES(?,?,?,?,0,?,?)`,deviceId,row.link_id,watermark,JSON.stringify(components),token,now));
  else statements.push(q(`UPDATE agent_monitor_cursors SET link_id=?,collected_ms=?,components_json=?,revision=revision+1,commit_token=?,updated_at=? WHERE device_id=? AND revision=?`,row.link_id,watermark,JSON.stringify(components),token,now,deviceId,revision));
  for(const c of changes){const s=c.snapshot;statements.push(q(`INSERT OR IGNORE INTO agent_notifications(id,event_key,device_id,link_id,equipment_id,unit_id,kind,observed_at,detected_at,details_json) SELECT ?,?,?,?,?,?,'hardware_change',?,?,? WHERE EXISTS(SELECT 1 FROM agent_monitor_cursors m JOIN agent_equipment_links l ON l.link_id=m.link_id WHERE m.device_id=? AND m.commit_token=? AND l.ended_at IS NULL)`,crypto.randomUUID(),'hardware|'+row.link_id+'|'+s.inventory_id,deviceId,row.link_id,row.equipment_id,row.unit_id,s.collected_at,now,JSON.stringify({inventory_id:s.inventory_id,changes:c.changes,queue_gaps:parse(s.queue_gaps_json)}),deviceId,token));}
 }
 statements.push(q('INSERT INTO agent_monitor_health VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET last_success_at=excluded.last_success_at,processed=excluded.processed',now,snapshots.length));
 await db.batch(statements);return {devices:rows.length,snapshots:snapshots.length};
}
export async function monitoringRoutes(request,url,user,env,{json,fail,body}){
 if(!['/api/inventory/monitoring','/api/inventory/notifications/read'].includes(url.pathname))return null;
 if(env.APP_KIND==='collector'||!['root','admin','visualizador'].includes(user.role))return fail('Consulta disponível somente no painel gerencial.',403);
 const db=env.DB,now=Date.now();
 if(url.pathname.endsWith('/read')){
  if(request.method!=='POST')return fail('Método não permitido.',405);
  const data=await body(request);if(typeof data.id!=='string'||data.id.length>80)return fail('Notificação inválida.',422);
  await db.prepare('INSERT OR IGNORE INTO agent_notification_reads SELECT n.id,?,? FROM agent_notifications n JOIN units u ON u.id=n.unit_id WHERE n.id=?').bind(user.id,now,data.id).run();
  return json({ok:true});
 }
 if(request.method!=='GET')return fail('Método não permitido.',405);
 const offset=Number(url.searchParams.get('offset')||0),ids=(url.searchParams.get('equipmentIds')||'').split(',').filter(Boolean);
 if(!Number.isSafeInteger(offset)||offset<0||ids.length>50||ids.some(id=>!/^[-a-f0-9]{36}$/i.test(id)))return fail('Filtro inválido.',422);
 const onlyUnread=url.searchParams.get('unread')==='1';
 const joins=`FROM agent_notifications n JOIN units u ON u.id=n.unit_id JOIN equipments e ON e.id=n.equipment_id LEFT JOIN agent_notification_reads r ON r.notification_id=n.id AND r.user_id=?`;
 const [page,count,health,statuses]=await Promise.all([
  db.prepare(`SELECT n.*,u.name AS unit_name,e.published_json IS NULL AS partial,COALESCE(json_extract(e.published_json,'$.environmentName'),json_extract(e.data_json,'$.environmentName')) AS environment_name,r.read_at ${joins} ${onlyUnread?'WHERE r.read_at IS NULL':''} ORDER BY n.detected_at DESC,n.id DESC LIMIT 25 OFFSET ?`).bind(user.id,offset).all(),
  db.prepare(`SELECT COUNT(*) AS total,SUM(r.read_at IS NULL) AS unread,SUM(n.kind='communication_lost' AND n.resolved_at IS NULL) AS communication_lost ${joins}`).bind(user.id).first(),
  db.prepare('SELECT last_success_at FROM agent_monitor_health WHERE id=1').first(),
  ids.length?db.prepare(liveSelect+` AND e.id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all():Promise.resolve({results:[]})
 ]);
 const total=Number(onlyUnread?count.unread:count.total)||0;
 return json({items:page.results.map(n=>({...n,details:parse(n.details_json),details_json:undefined})),total,unread:Number(count.unread)||0,communication_lost:Number(count.communication_lost)||0,nextOffset:offset+page.results.length<total?offset+25:null,server_time:new Date(now).toISOString(),monitor_last_success_at:health?.last_success_at??null,statuses:[...ids.filter(id=>!statuses.results.some(r=>r.equipment_id===id)).map(id=>({equipment_id:id,state:'not_linked',last_live_contact_at:null})),...statuses.results.map(r=>({equipment_id:r.equipment_id,state:presenceState(r,parse(r.presence_json),now,presenceThreshold(env)),last_live_contact_at:parse(r.presence_json).last_live_contact_at??null}))]});
}
