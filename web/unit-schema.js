export const unitTypes=['Escola municipal','Escola municipal militar','Creche municipal','Núcleo Educa Paço','Núcleo tecnológico','Unidade administrativa','Obra em andamento'];
export const legacyUnitTypes=['Escola conveniada'];
export const collectorHiddenTypes=['Obra em andamento'];
export const schoolTypes=['Escola municipal','Escola municipal militar','Creche municipal'];
export const isOutOfScope=type=>legacyUnitTypes.includes(type);
export const requiresInep=type=>schoolTypes.includes(type);
export const numericUnitColumns=[['students_total','Alunos (total)'],['students_daycare','Alunos creche'],['students_preschool','Alunos pré-escola'],['students_early_years','Alunos anos iniciais'],['students_final_years','Alunos anos finais'],['students_eja','Alunos EJA'],['classes_total','Turmas'],['seats_available','Vagas disponíveis'],['capacity_total','Capacidade total'],['staff_total','Servidores lotados'],['teachers_total','Professores']];
export const extraUnitColumns=[...numericUnitColumns,['building_code','Código do prédio'],['notes','Observações'],['figures_source','Fonte dos números'],['figures_reference_date','Data de referência']];
export const compareUnitCodes=(a,b)=>a.code&&b.code?String(a.code).localeCompare(String(b.code),'pt-BR'):a.code?-1:b.code?1:0;
export const unitColumns=[['name','Nome da unidade'],['code','INEP'],['unit_type','Tipo de unidade'],['region','Polo/Regional'],['neighborhood','Bairro'],['address','Endereço'],['manager_name','Nome do gestor'],['phone','Telefone'],['email','E-mail'],['latitude','Latitude'],['longitude','Longitude'],['active','Situação'],...extraUnitColumns];
export const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
export function validateUnitFields(data){
 const fields={},warnings={},trim=(key,max)=>{const value=String(data[key]??'').trim();if(value.length>max)fields[key]='Use no máximo '+max+' caracteres.';return value;};
 const name=trim('name',180),code=trim('code',8)||null,typeValue=trim('unit_type',80),unit_type=[...unitTypes,...legacyUnitTypes].find(x=>normalize(x)===normalize(typeValue))||typeValue;
 if(name.length<2)fields.name='Informe o nome da unidade.';if(!unitTypes.includes(unit_type)&&!isOutOfScope(unit_type))fields.unit_type='Selecione o tipo da unidade.';
 if(isOutOfScope(unit_type)&&!(data.id&&data.active===false))fields.unit_type='Escolas comunitárias/conveniadas estão fora do escopo deste inventário.';
 if(code&&!/^\d{8}$/.test(code))fields.code='INEP deve conter exatamente 8 dígitos.';if(!code&&requiresInep(unit_type))fields.code='Escolas municipais, militares e creches precisam do INEP de 8 dígitos.';
 const region=trim('region',120),neighborhood=trim('neighborhood',120),address=trim('address',300),manager_name=trim('manager_name',180),phone=trim('phone',60),email=trim('email',180);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fields.email='Informe um e-mail válido.';
 function coordinate(key,min,max){const raw=String(data[key]??'').trim();if(!raw)return null;const n=Number(raw.replace(',','.'));if(!/^-?\d+(?:[.,]\d+)?$/.test(raw)||!Number.isFinite(n)||n<min||n>max){fields[key]='Confira a coordenada: use a área de Paço do Lumiar ('+min+' a '+max+').';return null;}return n;}
 const latitude=coordinate('latitude',-2.62,-2.45),longitude=coordinate('longitude',-44.20,-44.02);if((latitude===null)!==(longitude===null)){if(latitude===null&&!fields.latitude)fields.latitude='Informe latitude e longitude juntas.';if(longitude===null&&!fields.longitude)fields.longitude='Informe latitude e longitude juntas.';}
 if(typeof data.active!=='boolean')fields.active='Selecione Ativa ou Inativa.';
 const extra={};for(const [key]of numericUnitColumns){const raw=String(data[key]??'').trim();extra[key]=raw===''?null:Number(raw.replaceAll('.',''));if(raw&&((typeof data[key]==='number'&&!Number.isInteger(data[key]))||!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(raw)||!Number.isInteger(extra[key])||extra[key]>99999))fields[key]='Use um número inteiro entre 0 e 99.999.';}
 extra.building_code=trim('building_code',20).toUpperCase();if(!/^[A-Z0-9-]{0,20}$/.test(extra.building_code))fields.building_code='Use até 20 letras, números ou hífens.';
 extra.notes=trim('notes',500);extra.figures_source=trim('figures_source',180);extra.figures_reference_date=trim('figures_reference_date',10)||null;
 const date=extra.figures_reference_date,today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date>today))fields.figures_reference_date='Informe uma data válida, não futura.';
 const stageSum=numericUnitColumns.slice(1,6).reduce((n,[key])=>n+(extra[key]||0),0);if(extra.students_total!==null&&stageSum>extra.students_total)warnings.students='A soma por etapa ('+stageSum+') é maior que o total ('+extra.students_total+').';
 if(extra.seats_available!==null&&extra.capacity_total!==null&&extra.seats_available>extra.capacity_total)warnings.seats='As vagas disponíveis superam a capacidade total.';
 if(extra.teachers_total!==null&&extra.staff_total!==null&&extra.teachers_total>extra.staff_total)warnings.staff='O número de professores supera o de servidores lotados.';
 if(Object.keys(fields).length)return {error:Object.values(fields)[0],fields,warnings};
 return {warnings,value:{name,name_key:normalize(name),code,unit_type,region,neighborhood,address,manager_name,phone,email,latitude,longitude,active:data.active?1:0,...extra}};
}
