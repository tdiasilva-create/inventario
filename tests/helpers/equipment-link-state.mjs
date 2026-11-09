import {seedEquipmentConsultation} from './equipment-consultation.mjs';
export function seedLinkStates(f){
 const s=seedEquipmentConsultation(f),db=f.sqlite;
 const update=(n,registration)=>{for(const column of ['data_json','published_json'])db.prepare(`UPDATE equipments SET ${column}=json_set(${column},'$.registration',?) WHERE id=?`).run(registration,s.items[n].id);};
 update(2,'Agente');update(3,'Manual');update(4,null);
 const device=crypto.randomUUID(),now=new Date().toISOString();
 db.prepare("INSERT INTO agent_devices VALUES(?,'revoked',?,NULL,NULL,NULL)").run(device,now);
 db.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,inspection_id,linked_by,linked_at,ended_at) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(),device,s.items[3].id,s.visit,f.root.id,now,now);
 // Active link overrides the original Manual form. Old contact does NOT make it manual.
 db.prepare("UPDATE agent_presence SET data_json=json_set(data_json,'$.last_live_contact_at',?) WHERE device_id=?").run(new Date(Date.now()-3600000).toISOString(),s.device);
 return s;
}
