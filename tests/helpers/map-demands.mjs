// Dados sintéticos usados exclusivamente em SQLite isolado.
export function seedMapDemands(f){
 let number=0;const now=Date.now();
 const add=(unit,status='Aberta',description='TESTE · Trocar teclado e mouse')=>{
  const id=crypto.randomUUID(),name=f.sqlite.prepare('SELECT name FROM units WHERE id=?').get(unit)?.name||'TESTE · Unidade removida';
  f.sqlite.prepare('INSERT INTO service_requests(id,number,unit_id,context_json,description,kind,source,status,created_at,created_by,updated_at,last_operation) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,++number,unit,JSON.stringify({unit_name:name}),description,'Manutenção','Telefone',status,now,f.root.id,now,crypto.randomUUID());return id;
 };
 const {pending,progress,blocked,assigned,inactive}=f.ids;
 f.sqlite.prepare("UPDATE units SET latitude=-2.51,longitude=-44.17,unit_type='Escola municipal' WHERE id=?").run(pending);
 f.sqlite.prepare("UPDATE units SET latitude=-2.52,longitude=-44.13,unit_type='Unidade administrativa' WHERE id=?").run(progress);
 f.sqlite.prepare("UPDATE units SET latitude=-2.49,longitude=-44.12,unit_type='Escola municipal militar' WHERE id=?").run(blocked);
 const ids=[add(pending),add(pending,'Aguardando material','TESTE · Repor toner'),add(progress,'Visita agendada','TESTE · Visita à unidade'),add(blocked,'Concluída'),add(assigned,'Em atendimento','TESTE · Sem coordenadas'),add(inactive,'Aberta','TESTE · Unidade inativa'),add('unidade-removida-teste','Aberta')];
 return {add,ids};
}
