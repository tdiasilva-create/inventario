import {computerWhereSql,computerJoins} from './service-desk.mjs';
import {inventoryScopeSql} from './unit-scope.mjs';
import {presenceState,presenceThreshold} from './agentes/presence.mjs';

// D-098: one network-wide read, not one request per computer, no date/online filter.
export async function computerProviderReport(db,env,now=Date.now()){
 const result=await db.prepare(`SELECT e.id,e.unit_id,u.name AS unit_name,u.active AS unit_active,
  (e.published_json IS NULL OR e.published_json!=e.data_json) AS partial,
  COALESCE(json_extract(si.sections_json,'$.system.data.hostname'),json_extract(en.summary_json,'$.hostname')) AS hostname,
  d.state AS device_state,p.data_json AS presence_json
  ${computerJoins} JOIN units u ON u.id=e.unit_id
  WHERE ${computerWhereSql} AND ${inventoryScopeSql('u')} AND d.device_id IS NOT NULL
  AND (json_extract(p.data_json,'$.last_live_contact_at') IS NOT NULL
    OR json_extract(p.data_json,'$.last_received_at') IS NOT NULL OR si.inventory_id IS NOT NULL)
  ORDER BY u.name COLLATE NOCASE,e.unit_id,hostname COLLATE NOCASE,e.id`).all();
 const items=result.results.map(r=>{
  const p=JSON.parse(r.presence_json||'{}'),c=p.network_observation;
  return {id:r.id,unit_id:r.unit_id,unit_name:r.unit_name,unit_active:!!r.unit_active,hostname:r.hostname||null,
   public_ip:c?.public_ip||null,provider:c?.provider||null,asn:c?.asn||null,observed_at:c?.observed_at||null,
   last_contact_at:p.last_live_contact_at||null,partial:!!r.partial,
   presence_state:presenceState({state:r.device_state},p,now,presenceThreshold(env))};
 });
 return {items,total:items.length,complete:true,scope:'all-linked-with-data',server_time:new Date(now).toISOString(),
  totals:{units:new Set(items.map(r=>r.unit_id)).size,with_provider:items.filter(r=>r.provider).length,
   without_provider:items.filter(r=>!r.provider).length}};
}

// D-099: one representative per unit ID. Prefer a complete provider observation,
// then its most recent timestamp. Never combine IP/provider/contact from different PCs.
export async function providerReport(db,env,now=Date.now()){
 const source=await computerProviderReport(db,env,now),units=new Map();
 const stamp=v=>Number.isFinite(Date.parse(v))?Date.parse(v):0;
 const complete=r=>!!(r.public_ip&&r.provider&&stamp(r.observed_at));
 const time=r=>complete(r)?stamp(r.observed_at):stamp(r.last_contact_at);
 for(const row of source.items){
  const old=units.get(row.unit_id);
  if(!old||Number(complete(row))>Number(complete(old))||complete(row)===complete(old)&&(time(row)>time(old)||time(row)===time(old)&&row.id<old.id))units.set(row.unit_id,row);
 }
 const items=[...units.values()];
 return {items,total:items.length,complete:true,scope:'one-per-unit-with-agent-data',server_time:source.server_time,
  totals:{units:items.length,with_provider:items.filter(complete).length,without_provider:items.filter(r=>!complete(r)).length}};
}
