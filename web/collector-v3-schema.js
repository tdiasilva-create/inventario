// D-057: documento V3 e decisões explícitas do responsável em 05/11/2026.
// V2 é preservada; este catálogo só vale para visitas coleta-3.0.
import {validateFields,remoteAccessFields} from './collector-schema.js';
import {v2Sections,v2EquipmentFields,registrationLabels,computerOperationLabels,containsSecret} from './collector-v2-schema.js';
export {registrationLabels,computerOperationLabels,containsSecret};
export const questionnaireVersion='coleta-3.0';
// D-061: quarto item = cor do tile do assunto (laranja, preto, vermelho, grafite ou pessego), fixa por assunto.
export const topics=[['A','Acompanhante','building','pessego'],['C','Internet','wifi','laranja'],['D','Redes Wi-Fi','network','vermelho'],['B','Ambientes','rooms','preto'],['F','Computadores','monitor','laranja'],['G','Impressoras','print','grafite'],['O','Outros equipamentos','box','pessego'],['H','Problemas','alert','vermelho']];
const f=(key,label,type='text',options=[],required=false,when=null)=>({key,label,type,options,required,when});
const fields=(source,keys)=>source.filter(f=>keys.includes(f.key)).map(f=>({...f}));
const linkFields=fields(v2Sections.C.find(f=>f.key==='links').children,['provider','type','contracted','drops','frequency','quality','satisfaction','problems']);
export const v3Sections={
 A:fields(v2Sections.A,['name','role']).map(f=>({...f,when:null,required:false})),
 C:[...fields(v2Sections.C,['exists','linkCount']),{...v2Sections.C.find(f=>f.key==='links'),children:linkFields}],
 D:[{...v2Sections.D[0],children:fields(v2Sections.D[0].children,['ssid','notes'])}],
 B:[],F:[],G:[],O:[],
 H:[{...v2Sections.H[0],label:'Problemas adicionais',children:fields(v2Sections.H[0].children,['type','description'])}]
};
export const origins=['Adquirido por pedido à SEMED','Adquirido com recursos próprios','Contrato de locação','Outros','Não sabe informar'];
const computer=d=>!['printer','other'].includes(d.category);
export const v3EquipmentFields=[
 f('category','Tipo de computador (opcional)','select',['desktop','notebook'],false,computer),
 f('registration','Cadastro','select',['Agente','Manual'],true,computer),
 {...v2EquipmentFields.find(f=>f.key==='manualReason'),when:d=>computer(d)&&d.registration==='Manual'},
 f('environmentName','Qual ambiente?','text',[],true,d=>d.category!=='other'),
 f('position_label','Posição no ambiente (ex.: Bancada 2 / PC 7)','text',[],true,computer),
 ...remoteAccessFields,
 f('assetStatus','Situação do patrimônio','select',['Possui patrimônio','Sem patrimônio','Etiqueta ilegível','Não identificado'],true,computer),
 f('computerOrigin','Origem do equipamento','select',origins,false,computer),
 ...fields(v2EquipmentFields,['brand','model']).map(f=>({...f,when:d=>d.category==='printer'})),
 {...v2EquipmentFields.find(f=>f.key==='operation'),when:d=>d.category!=='other'},
 {...v2EquipmentFields.find(f=>f.key==='problems'),when:d=>d.category!=='other',required:d=>computer(d)&&['Funciona parcialmente','Não funciona'].includes(d.operation)},
 ...fields(v2EquipmentFields,['origin','acquisition','supplies','connection','ip']),
 f('customCategory','Qual equipamento? (opcional)','text',[],false,d=>d.category==='other')
];
export const isComputer=d=>['computer','desktop','notebook',''].includes(d?.category??'');
export function validateV3Equipment(data,context={},draft=false){
 const d={...data,category:data.category==='computer'?'':data.category};
 const errors=validateFields(draft?v3EquipmentFields.filter(f=>['environmentName','position_label','anydesk','rustdesk'].includes(f.key)):v3EquipmentFields,d,context);
 if(!['','computer','desktop','notebook','printer','other'].includes(data.category??''))errors.category='Tipo de equipamento inválido.';
 if(data.mode!=='Individual'||Number(data.quantity)!==1)errors.mode='Use uma ficha individual por equipamento.';
 if(data.category!=='other'&&(!data.environment||!context.environments?.some(e=>e.id===data.environment)))errors.environmentName='Informe o ambiente onde está o equipamento.';
 if(data.environmentName&&String(data.environmentName).length>180)errors.environmentName='Use até 180 caracteres.';
 if(isComputer(data)&&String(data.position_label||'').trim().length>64)errors.position_label='Use até 64 caracteres para a posição.';
 if(draft&&isComputer(data)&&!['Agente','Manual'].includes(data.registration))errors.registration='Escolha o cadastro com agente ou manual.';
 return errors;
}
export function validateV3Section(section,data,context={}){
 const errors=validateFields(v3Sections[section]||[],data,context);
 if(section==='C'&&data.exists==='Sim'){
  const links=data.links||[];
  if(['1','2'].includes(data.linkCount)&&links.length!==Number(data.linkCount))errors.links='Registre uma ficha para cada link informado.';
  if(data.linkCount==='3 ou mais'&&links.length<3)errors.links='Registre pelo menos três links.';
  for(const [i,l]of links.entries())if(l.contracted&&l.contracted!=='Não soube informar'&&(!Number.isFinite(Number(String(l.contracted).replace(',','.')))||Number(String(l.contracted).replace(',','.'))<0))errors[`links.${i}.contracted`]='Informe Mbps ou Não soube informar.';
 }
 return errors;
}
export function validV3SectionShape(section,data){
 const check=(definitions,value,extra=[])=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([key,v])=>{if(extra.includes(key))return typeof v==='string'&&v.length<=64;const f=definitions.find(f=>f.key===key);return f&&(f.type==='rows'?Array.isArray(v)&&v.every(row=>check(f.children,row,['id'])):['string','number','boolean'].includes(typeof v)&&String(v).length<=4000);});
 return !!v3Sections[section]&&!containsSecret(data)&&!!check(v3Sections[section],data);
}
export function problemSummary(sections,equipment=[]){
 const result=[],add=(source,description,id)=>{if(typeof description==='string'&&description.trim())result.push({source,description:description.trim(),id});};
 for(const l of sections.C?.links||[]){add('Internet · '+(l.provider||'Link'),l.problems,l.id);if(l.drops==='Sim')add('Internet · '+(l.provider||'Link'),'Quedas: '+(l.frequency||'frequência não informada'),l.id);}
 for(const n of sections.D?.networks||[])add('Wi-Fi · '+(n.ssid||'Não identificado'),n.notes,n.id);
 for(const e of equipment)add(e.data?.category==='printer'?'Impressora':'Computador',e.data?.problems,e.id);
 return result;
}
