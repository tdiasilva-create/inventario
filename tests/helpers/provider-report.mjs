import {connectionFixture} from './agent-connection.mjs';
// Only synthetic local SQLite data. Includes old/offline and incomplete installations.
export async function providerReportFixture(f,env,{extra=0}={}){
 const s=await connectionFixture(f,{...env,APP_KIND:'collector'});await s.send(1);
 const base=f.sqlite.prepare('SELECT * FROM equipments WHERE id=?').get(s.items[0].id),cols=Object.keys(base);
 const insert=f.sqlite.prepare('INSERT INTO equipments('+cols.join(',')+') VALUES('+cols.map(()=>'?').join(',')+')');
 const original=f.sqlite.prepare('SELECT * FROM agent_inventory_snapshots WHERE device_id=?').get(s.device);
 const old='2026-01-01T12:00:00Z';let sequence=1;
 function add({unit=s.unit,host='TESTE-PC-'+String(++sequence).padStart(3,'0'),state='linked',at=old,ip='203.0.113.10',provider='PROVEDOR TESTE',data=true,snapshot=true,ended=false,category='desktop'}={}){
  const id=crypto.randomUUID(),device=crypto.randomUUID(),inventory=crypto.randomUUID(),link=crypto.randomUUID();
  insert.run(...cols.map(k=>k==='id'?id:k==='unit_id'?unit:k==='category'?category:base[k]));
  f.sqlite.prepare('INSERT INTO agent_devices VALUES(?,?,?,NULL,NULL,NULL)').run(device,state,old);
  f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,inspection_id,linked_by,linked_at,ended_at) VALUES(?,?,?,?,?,?,?)').run(link,device,id,s.visit,f.root.id,old,ended?old:null);
  if(data)f.sqlite.prepare('INSERT INTO agent_presence(device_id,data_json,updated_at) VALUES(?,?,?)').run(device,JSON.stringify({last_live_contact_at:at,network_observation:ip?{public_ip:ip,provider,asn:64512,observed_at:at,source:'cloudflare'}:null}),at);
  if(snapshot){const sections=JSON.parse(original.sections_json);sections.system.data.hostname=host;const names=Object.keys(original);f.sqlite.prepare('INSERT INTO agent_inventory_snapshots('+names.join(',')+') VALUES('+names.map(()=>'?').join(',')+')').run(...names.map(k=>({inventory_id:inventory,device_id:device,equipment_id:id,sections_json:JSON.stringify(sections)})[k]??original[k]));f.sqlite.prepare('INSERT INTO agent_current_snapshot VALUES(?,?,?)').run(device,inventory,old);}
  return {id,device,link};
 }
 const offline=add(),legacy=add({ip:null}),snapshotOnly=add({data:false}),never=add({data:false,snapshot:false}),ended=add({ended:true}),printer=add({category:'printer'});
 for(let i=0;i<extra;i++)add({host:'TESTE-EXTRA-'+String(i).padStart(3,'0')});
 return {...s,add,offline,legacy,snapshotOnly,never,ended,printer,expected:4+extra};
}
