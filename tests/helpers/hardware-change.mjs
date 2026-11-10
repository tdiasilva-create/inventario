import {seedEquipmentConsultation} from './equipment-consultation.mjs';
import {runAgentMonitoring} from '../../server/agent-monitoring.mjs';
// Somente SQLite isolado; nunca executado na conta Cloudflare.
export async function hardwareChange(f,env){
 const s=seedEquipmentConsultation(f),base=Date.now();await runAgentMonitoring(env,base);
 const snapshot=f.sqlite.prepare('SELECT * FROM agent_inventory_snapshots WHERE device_id=?').get(s.device);
 async function change(bytes=34359738368,offset=1000){const sections=JSON.parse(snapshot.sections_json);sections.memory.data.installed_bytes=bytes;const id=crypto.randomUUID(),iso=new Date(base+offset).toISOString();f.sqlite.prepare('INSERT INTO agent_inventory_snapshots(inventory_id,device_id,equipment_id,collected_at,received_at,boot_id,sequence,reason,snapshot_hash,sections_json) VALUES(?,?,?,?,?,?,2,?,?,?)').run(id,s.device,s.items[0].id,iso,iso,crypto.randomUUID(),'hardware_change',id,JSON.stringify(sections));f.sqlite.prepare('UPDATE agent_current_snapshot SET inventory_id=?,collected_at=? WHERE device_id=?').run(id,iso,s.device);await runAgentMonitoring(env,base+offset+100);return f.sqlite.prepare("SELECT id FROM agent_notifications WHERE json_extract(details_json,'$.inventory_id')=?").get(id).id;}
 return {...s,change,id:await change()};
}
