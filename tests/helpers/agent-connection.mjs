import {seedEquipmentConsultation} from './equipment-consultation.mjs';
import {agentIdentity,machinePost,heartbeatBody} from './agent-client.mjs';
import worker from '../../server/worker.mjs';
// Synthetic installed agent; no installer execution or production requests.
export async function connectionFixture(f,env){
 const data=seedEquipmentConsultation(f),identity=await agentIdentity(),at=new Date().toISOString();identity.deviceId=data.device;
 f.sqlite.prepare('INSERT INTO agent_installations VALUES(?,?,?,?,?,NULL)').run(identity.installationId,data.device,'0.1.6-test',identity.keyId,at);
 f.sqlite.prepare("INSERT INTO agent_keys VALUES(?,?,?,'active',?,NULL)").run(identity.keyId,identity.installationId,JSON.stringify(identity.publicJwk),at);
 const row=f.sqlite.prepare('SELECT inventory_id,sections_json FROM agent_inventory_snapshots WHERE device_id=?').get(data.device),sections=JSON.parse(row.sections_json);
 sections.network.data.addresses_collected=true;sections.network.data.adapters[0].ipv4=['192.168.10.25'];sections.network.data.adapters[0].ipv6=['fe80::25'];
 f.sqlite.prepare('UPDATE agent_inventory_snapshots SET sections_json=? WHERE inventory_id=?').run(JSON.stringify(sections),row.inventory_id);
 const send=(sequence,options={},bodyOptions={})=>machinePost(worker,env,'https://collector.test',identity,'/api/agent/v1/heartbeat',heartbeatBody(identity,{sequence,...bodyOptions}),{ip:'198.51.100.25',cf:{asOrganization:'REDE TESTE ISOLADO',asn:64512},...options});
 return {...data,identity,send};
}
