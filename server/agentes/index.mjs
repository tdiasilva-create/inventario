// Montagem do módulo de agentes Windows dentro dos Workers do inventário (painel e coletor; mesmo D1).
// Rotas de MÁQUINA (assinatura ECDSA) são atendidas antes da sessão humana e sem exigir Origin.
// Rotas HUMANAS usam a sessão, o CSRF e o Origin já verificados por server/worker.mjs.
import {createApp,DEFAULT_CONFIG} from './nucleo/worker.mjs';
import {D1Store} from './nucleo/d1-store.mjs';
import {catalogo} from './catalogo.mjs';
export const VERSAO_MODULO='0.1.8-semed.2';
const AGENT='/api/agent/v1';
export const MACHINE_ROUTES=new Set([`${AGENT}/enrollment-challenge`,`${AGENT}/enrollments`,`${AGENT}/enrollment-status`,`${AGENT}/enrollment-renew`,`${AGENT}/pairings/confirm-device`,`${AGENT}/heartbeat`,`${AGENT}/inventory`,`${AGENT}/config`,`${AGENT}/rotate-key`]);
export const HUMAN_POST_ROUTES=new Set([`${AGENT}/pairings/preview`,`${AGENT}/pairings/claim`,'/api/root/agent-install-grants','/api/root/agent-install-grants/revoke','/api/root/agent-revoke','/api/inventory/equipment-location','/api/root/agent-maintenance']);
export const HUMAN_GET_ROUTES=new Set([`${AGENT}/pairings/catalog`,`${AGENT}/pairings/claim-status`,'/api/inventory/agent-status','/api/inventory/agent-history','/api/inventory/equipment-location-status','/api/root/agent-install-grants','/api/root/agent-devices']);
// [R2-A] consulta do recibo de um comando humano (claim / localização) pelo request_id do PRÓPRIO usuário: permite ao coletor
// reconciliar um resultado desconhecido (resposta perdida) sem repetir efeitos nem inventar sucesso.
const RECEIPT_ROUTES={[`${AGENT}/pairings/claim-status`]:'agent_claim_requests','/api/inventory/equipment-location-status':'agent_location_requests'};
// Rotas administrativas da integração (fora do núcleo do pacote): listagem de agentes por unidade e manutenção sob demanda. Root apenas.
const ROOT_EXTRA_GET=new Set(['/api/root/agent-devices']),ROOT_EXTRA_POST=new Set(['/api/root/agent-maintenance']);
export const isMachineRoute=(path,method)=>method==='POST'&&MACHINE_ROUTES.has(path);
export const isHumanRoute=(path,method)=>method==='POST'?HUMAN_POST_ROUTES.has(path):method==='GET'?HUMAN_GET_ROUTES.has(path):false;
const simNao=(v,padrao)=>v===undefined||v===null||v===''?padrao:!/^(nao|não|no|false|0)$/i.test(String(v).trim());
export function agentConfig(env={}){
 const intervalo=Math.min(3600,Math.max(60,Number(env.AGENTES_INTERVALO_HEARTBEAT??300)||300));
 return {
  heartbeatIntervalSeconds:intervalo,
  requireInstallGrant:simNao(env.AGENTES_EXIGIR_AUTORIZACAO,true),
  requireInspection:simNao(env.AGENTES_EXIGIR_VISTORIA,true),
  // [REV-02/REV-03] claim e mudança de localização seguem a mesma política do coletor: unidade ativa, visita aberta e trava
  // de edição (lock_token) do próprio usuário, verificadas dentro da transação. Não é configurável por variável.
  requireLock:true,
  // Ficha nova nasce pelo fluxo normal do coletor (validação V2, autoria, histórico); o vínculo é sempre a uma ficha existente.
  allowNewEquipment:false,
  maxGrantUses:Math.min(1000,Math.max(1,Number(env.AGENTES_LOTE_MAX_MAQUINAS??1000)||1000)),
  maxGrantTtlSeconds:Math.min(168,Math.max(1,Number(env.AGENTES_LOTE_MAX_HORAS??168)||168))*3600,
  equipmentIdFormat:'uuid',
  policy:{...DEFAULT_CONFIG.policy,heartbeat_interval_seconds:intervalo},
 };
}
// Usuário do sistema → usuário do módulo. Quatro perfis preservados; acesso por unidade segue D-046 (qualquer unidade oficial ativa),
// com as verificações de unidade ativa / vistoria aberta feitas pelo próprio módulo e pelas rotas de coleta.
export const moduleUser=user=>user?{id:user.id,name:user.display_name||user.username||user.id,role:user.role,unit_ids:['*']}:null;
function app(env,user,opts={}){
 const store=new D1Store(env.DB,{catalogo,keepHeartbeats:Math.max(0,Number(env.AGENTES_GUARDAR_HEARTBEATS??20)||0)});
 const auth=async(request,{ApiError})=>{const u=moduleUser(user);if(!u)throw new ApiError(401,'SESSION_REQUIRED','Sessão humana obrigatória');return u;};
 return createApp({store,auth,now:opts.now,config:agentConfig(env)});
}
/** Rotas de máquina (antes da autenticação de sessão). Devolve null quando a rota não é do módulo. */
export async function handleAgentMachine(request,url,env,opts){if(!isMachineRoute(url.pathname,request.method))return null;return app(env,null,opts).fetch(request);}
/** Rotas humanas (após sessão + CSRF do Worker). Devolve null quando a rota não é do módulo. */
export async function handleAgentHuman(request,url,user,env,opts){if(!isHumanRoute(url.pathname,request.method))return null;
 if(RECEIPT_ROUTES[url.pathname]){
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  if(!['operador','admin','root'].includes(user?.role))return json({code:'FORBIDDEN',message:'Perfil sem permissão.'},403);
  const rid=String(url.searchParams.get('request_id')||'');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rid))return json({code:'VALIDATION_FAILED',message:'request_id inválido'},422);
  const row=await env.DB.prepare(`SELECT status,response_json,created_at FROM ${RECEIPT_ROUTES[url.pathname]} WHERE request_key=?1`).bind(user.id+'|'+rid).first();
  if(!row)return json({found:false,request_id:rid});
  let body=null;try{body=JSON.parse(row.response_json);}catch{body=null;}
  return json({found:true,request_id:rid,status:row.status,created_at:row.created_at,body:body&&{...body,duplicate:true}});
 }
 if(ROOT_EXTRA_GET.has(url.pathname)||ROOT_EXTRA_POST.has(url.pathname)){
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  if(user?.role!=='root')return json({code:'FORBIDDEN',message:'Somente root administra os agentes.'},403);
  if(url.pathname==='/api/root/agent-devices')return json({...await listAgentDevices(env.DB,url.searchParams,opts?.now?.()??Date.now()),enrollment_policy:{require_install_grant:agentConfig(env).requireInstallGrant,pending_ttl_days:30}});
  if(url.pathname==='/api/root/agent-maintenance'){const r=await manutencaoAgentes(env,opts?.now?.()??Date.now());return json({ok:true,...r,actor:user.id});}
 }
 return app(env,user,opts).fetch(request);}
/** Agentes conhecidos com vínculo/ficha/unidade/presença, para a tela do root. Paginado por cursor (device_id); sem dados pessoais.
 * [rev2] Quando não há vínculo ativo, devolve o ÚLTIMO vínculo histórico rotulado (link.active=false, ended_at/end_reason), para que um
 * agente revogado continue aparecendo no filtro da sua unidade. */
export async function listAgentDevices(db,params,nowMs=Date.now()){
 const unitId=String(params.get('unit_id')||'').slice(0,64),q=String(params.get('q')||'').trim().toLowerCase().slice(0,60),cursor=String(params.get('cursor')||'').slice(0,64),state=String(params.get('state')||'').slice(0,20);
 const cond=['1=1'],args=[];
 if(unitId){args.push(unitId);cond.push(`e.unit_id=?${args.length}`);}
 if(state){args.push(state);cond.push(`d.state=?${args.length}`);}
 if(q){args.push(q);cond.push(`(instr(lower(COALESCE(e.search_text,'')),?${args.length})>0 OR instr(lower(COALESCE(u.name,'')),?${args.length})>0 OR instr(lower(COALESCE((SELECT json_extract(x.summary_json,'$.hostname') FROM agent_enrollments x WHERE x.device_id=d.device_id ORDER BY x.created_at DESC LIMIT 1),'')),?${args.length})>0)`);}
 if(cursor){args.push(cursor);cond.push(`d.device_id>?${args.length}`);}
 args.push(51);
 const rows=(await db.prepare(`SELECT d.device_id,d.state,d.created_at,d.revoked_at,d.revoke_reason,l.link_id,l.linked_at,l.device_confirmed_at,l.inspection_id,l.ended_at AS link_ended_at,l.end_reason AS link_end_reason,e.id AS equipment_id,e.unit_id,e.environment_id,e.position_label,e.location_state,e.asset,e.category,u.name AS unit_name,en.name AS environment_name,p.data_json AS presence_json,p.updated_at AS presence_updated_at,(SELECT agent_version FROM agent_installations i WHERE i.device_id=d.device_id ORDER BY i.created_at DESC LIMIT 1) AS agent_version,(SELECT json_extract(summary_json,'$.hostname') FROM agent_enrollments x WHERE x.device_id=d.device_id ORDER BY x.created_at DESC LIMIT 1) AS hostname FROM agent_devices d LEFT JOIN agent_equipment_links l ON l.link_id=(SELECT x.link_id FROM agent_equipment_links x WHERE x.device_id=d.device_id ORDER BY (x.ended_at IS NULL) DESC,x.linked_at DESC LIMIT 1) LEFT JOIN equipments e ON e.id=l.equipment_id LEFT JOIN units u ON u.id=e.unit_id LEFT JOIN environments en ON en.id=e.environment_id LEFT JOIN agent_presence p ON p.device_id=d.device_id WHERE ${cond.join(' AND ')} ORDER BY d.device_id LIMIT ?${args.length}`).bind(...args).all()).results;
 const page=rows.slice(0,50).map(r=>{let presence=null;try{presence=r.presence_json?JSON.parse(r.presence_json):null;}catch{presence=null;}const last=presence?.last_live_contact_at?Date.parse(presence.last_live_contact_at):null;return {device_id:r.device_id,state:r.state,created_at:r.created_at,revoked_at:r.revoked_at,revoke_reason:r.revoke_reason,hostname:r.hostname||null,agent_version:r.agent_version||null,link:r.link_id?{link_id:r.link_id,linked_at:r.linked_at,device_confirmed_at:r.device_confirmed_at,inspection_id:r.inspection_id,active:!r.link_ended_at,ended_at:r.link_ended_at||null,end_reason:r.link_end_reason||null}:null,equipment:r.equipment_id?{id:r.equipment_id,asset:r.asset,category:r.category,unit_id:r.unit_id,unit_name:r.unit_name,environment_name:r.environment_name,position_label:r.position_label,location_state:r.location_state}:null,presence:{last_live_contact_at:presence?.last_live_contact_at??null,last_collected_at:presence?.last_collected_at??null,silent_minutes:last?Math.round((nowMs-last)/60000):null,health:presence?.health??null}};});
 return {items:page,next_cursor:rows.length>50?page.at(-1).device_id:null,server_time:new Date(nowMs).toISOString()};
}
/** Limpeza periódica (nonces, recibos, limites, desafios, retenção de snapshots). Chamar de um scheduled handler quando existir. */
export async function manutencaoAgentes(env,nowMs=Date.now()){return new D1Store(env.DB,{catalogo}).purgeExpired(nowMs,{keepSnapshotsPerDevice:Number(env.AGENTES_SNAPSHOTS_POR_MAQUINA??60)||60});}
