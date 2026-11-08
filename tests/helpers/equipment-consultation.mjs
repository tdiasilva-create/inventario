// Dados exclusivamente sintéticos para banco SQLite em memória. Nunca carga de produção.
export function seedEquipmentConsultation(f){
 const db=f.sqlite,unit=f.ids.pending,visit=crypto.randomUUID(),room=crypto.randomUUID(),now=Date.now(),iso=new Date(now).toISOString();
 db.prepare("INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at,state,completed_at,questionnaire_version) VALUES(?,?,?,?,?,'completed',?,'coleta-3.0')").run(visit,unit,f.root.id,now,now,now);
 db.prepare('INSERT INTO environments(id,unit_id,name,type,created_at,created_by) VALUES(?,?,?,?,?,?)').run(room,unit,'TESTE · Laboratório','Laboratório',now,f.root.id);
 db.prepare('INSERT INTO inspection_environments VALUES(?,?,?)').run(visit,room,JSON.stringify({id:room,name:'TESTE · Laboratório',type:'Laboratório'}));
 const items=[];
 function equipment(n,category='desktop',quantity=1,published=true){const id=crypto.randomUUID(),data={questionnaireVersion:'coleta-3.0',category,mode:quantity>1?'Lote':'Individual',quantity,registration:'Manual',manualReason:'TESTE · sem instalação neste exemplo',environment:room,environmentName:'TESTE · Laboratório',position_label:'Mesa '+n,operation:n%2?'Funcionando':'Não foi possível testar',condition:'Bom',brand:'Fabricante de teste',model:'Modelo '+n,asset:'TESTE-'+n,anydesk:n===1?'001234567':'',rustdesk:n===1?'000987654':''};
  db.prepare('INSERT INTO equipments(id,unit_id,inspection_id,category,environment_id,asset,serial,search_text,data_json,published_json,created_by,created_at,updated_by,updated_at,published_updated_at,position_label) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,unit,visit,category,room,data.asset,'SERIE-'+n,'RASCUNHO SEGREDO',JSON.stringify({...data,model:'MODELO RASCUNHO'}),published?JSON.stringify(data):null,f.root.id,now-n,f.root.id,now,now,data.position_label);items.push({id,data});return id;
 }
 for(let n=1;n<=55;n++)equipment(n);
 const notebook=equipment(56,'notebook'),printer=equipment(57,'printer'),lot=equipment(58,'tablet',8),draft=equipment(59,'desktop',1,false),device=crypto.randomUUID(),inventory=crypto.randomUUID();
 db.prepare("INSERT INTO agent_devices VALUES(?,'linked',?,NULL,NULL,NULL)").run(device,iso);
 db.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,inspection_id,linked_by,linked_at,device_confirmed_at) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(),device,items[0].id,visit,f.root.id,iso,iso);
 db.prepare('INSERT INTO agent_presence(device_id,data_json,updated_at) VALUES(?,?,?)').run(device,JSON.stringify({last_live_contact_at:iso,last_observation_collected_at:iso,health:{state:'ok'},agent_version:'TESTE'}),iso);
 const section=data=>({quality:'ok',source:'teste isolado',collected_at:iso,data});
 const sections={system:section({hostname:'TESTE-PC-001',manufacturer:'Fabricante de teste',model:'Modelo de teste',baseboard:{product:'PLACA-TESTE'}}),cpu:section({processors:[{name:'PROCESSADOR-TESTE',cores:6,logical_processors:12}]}),memory:section({installed_bytes:17179869184,modules:[{slot:'A1',capacity_bytes:8589934592},{slot:'B1',capacity_bytes:8589934592}]}),storage:section({physical_disks:[{model:'SSD-TESTE',size_bytes:549755813888}]}),gpu:section({adapters:[{name:'VIDEO-TESTE'}]}),network:section({adapters:[{name:'REDE-TESTE',mac:'02:00:00:00:00:01'}]}),os:section({caption:'Windows · TESTE',build_number:'TESTE'}),accounts:section({local_accounts:[{name:'usuario-teste',enabled:true}]})};
 db.prepare('INSERT INTO agent_inventory_snapshots(inventory_id,device_id,equipment_id,collected_at,received_at,boot_id,sequence,reason,snapshot_hash,sections_json) VALUES(?,?,?,?,?,?,1,?,?,?)').run(inventory,device,items[0].id,iso,iso,crypto.randomUUID(),'periodic','TESTE',JSON.stringify(sections));
 db.prepare('INSERT INTO agent_current_snapshot VALUES(?,?,?)').run(device,inventory,iso);
 function photo(target=items[0].id,otherUnit=unit,photoVisit=visit){const id=crypto.randomUUID();db.prepare("INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status,storage_provider) VALUES(?,?,?,'equipment',?,?,'image/png',12,'TESTE',?,?,'ready','r2')").run(id,otherUnit,photoVisit,target,'PRIVATE/'+id,f.root.id,now);return id;}
 const firstPhoto=photo(),manualPhoto=photo(items[1].id),wrongUnitPhoto=photo(items[0].id,f.ids.assigned);
 db.prepare('INSERT INTO published_equipment_counts(unit_id,category,records,items) VALUES(?,?,?,?)').run(unit,'desktop',55,55);
 for(const [c,n]of [['notebook',1],['printer',1],['tablet',8]])db.prepare('INSERT INTO published_equipment_counts(unit_id,category,records,items) VALUES(?,?,1,?)').run(unit,c,n);
 db.prepare('INSERT INTO published_unit_status(unit_id,latest,visits,environment_count) VALUES(?,?,1,1)').run(unit,now);
 return {unit,visit,room,items,notebook,printer,lot,draft,device,firstPhoto,manualPhoto,wrongUnitPhoto,photo};
}
