export const unitTypes=['Escola municipal','Escola conveniada','Núcleo Educa Paço','Núcleo tecnológico','Unidade administrativa'];
export const requiresInep=type=>['Escola municipal','Escola conveniada'].includes(type);
export const compareUnitCodes=(a,b)=>a.code&&b.code?String(a.code).localeCompare(String(b.code),'pt-BR'):a.code?-1:b.code?1:0;
export const unitColumns=[['name','Nome da unidade'],['code','INEP'],['unit_type','Tipo de unidade'],['region','Polo/Regional'],['neighborhood','Bairro'],['address','Endereço'],['manager_name','Nome do gestor'],['phone','Telefone'],['email','E-mail'],['latitude','Latitude'],['longitude','Longitude'],['active','Situação']];
export const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
export function validateUnitFields(data){
 const fields={},trim=(key,max)=>{const value=String(data[key]??'').trim();if(value.length>max)fields[key]='Use no máximo '+max+' caracteres.';return value;};
 const name=trim('name',180),code=trim('code',8)||null,typeValue=trim('unit_type',80),unit_type=unitTypes.find(x=>normalize(x)===normalize(typeValue))||typeValue;
 if(name.length<2)fields.name='Informe o nome da unidade.';if(!unitTypes.includes(unit_type))fields.unit_type='Selecione o tipo da unidade.';
 if(code&&!/^\d{8}$/.test(code))fields.code='INEP deve conter exatamente 8 dígitos.';if(!code&&requiresInep(unit_type))fields.code='Escolas municipais e conveniadas precisam do INEP de 8 dígitos.';
 const region=trim('region',120),neighborhood=trim('neighborhood',120),address=trim('address',300),manager_name=trim('manager_name',180),phone=trim('phone',60),email=trim('email',180);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fields.email='Informe um e-mail válido.';
 function coordinate(key,min,max){const raw=String(data[key]??'').trim();if(!raw)return null;const n=Number(raw.replace(',','.'));if(!/^-?\d+(?:[.,]\d+)?$/.test(raw)||!Number.isFinite(n)||n<min||n>max){fields[key]='Confira a coordenada: use a área de Paço do Lumiar ('+min+' a '+max+').';return null;}return n;}
 const latitude=coordinate('latitude',-2.62,-2.45),longitude=coordinate('longitude',-44.20,-44.02);if((latitude===null)!==(longitude===null)){if(latitude===null&&!fields.latitude)fields.latitude='Informe latitude e longitude juntas.';if(longitude===null&&!fields.longitude)fields.longitude='Informe latitude e longitude juntas.';}
 if(typeof data.active!=='boolean')fields.active='Selecione Ativa ou Inativa.';
 if(Object.keys(fields).length)return {error:Object.values(fields)[0],fields};
 return {value:{name,name_key:normalize(name),code,unit_type,region,neighborhood,address,manager_name,phone,email,latitude,longitude,active:data.active?1:0}};
}
