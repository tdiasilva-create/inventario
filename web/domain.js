export const groups=[
 ['A','Identificação','Unidade e responsável','building','blue'],
 ['B','Ambientes e setores','Organize os locais da coleta','rooms','teal'],
 ['C','Internet e conectividade','Links e disponibilidade','wifi','violet'],
 ['D','Rede interna e Wi-Fi','Cobertura e infraestrutura','network','amber'],
 ['E','Energia e instalações','Observação visual das condições','bolt','orange'],
 ['F','Equipamentos','Cadastrar e conferir bens','monitor','blue'],
 ['G','Recursos audiovisuais','Acesso às mesmas fichas de equipamentos','projector','violet'],
 ['H','Problemas e necessidades','Achados, demandas e prioridades','alert','rose']
];
export const demoUnits=[{id:'demo-unidade-01',name:'Unidade de demonstração',detail:'Ambiente de teste • sem vínculo com o catálogo oficial'}];
export function createDraft(){return {sections:Object.fromEntries(groups.map(([id])=>[id,'Pendente'])),a:{},environments:[],equipment:[],item:null};}
export function equipmentErrors(item){
 const errors=[];
 if(!item.environment)errors.push('Selecione o ambiente do equipamento.');
 for(const [key,label] of [['asset','patrimônio'],['serial','número de série'],['brand','marca'],['model','modelo']])if(!item[key]?.trim())errors.push(`Informe ${label} ou a alternativa de identificação disponível.`);
 for(const [key,label] of [['condition','conservação física'],['operation','funcionamento'],['use','situação de uso']])if(!item[key])errors.push(`Informe ${label}.`);
 const failed=['Funciona parcialmente','Não funciona'].includes(item.operation);
 if(failed&&!item.problem?.trim())errors.push('Descreva o problema ou informe Problema não identificado.');
 if((failed||item.problem?.trim())&&(!item.action||!item.priority))errors.push('Problemas exigem ação recomendada e prioridade.');
 if(item.action==='Outra ação (especificar)'&&!item.otherAction?.trim())errors.push('Especifique a outra ação.');
 return errors;
}
export function photoError(files,current){if(current+files.length>5)return 'O limite é de 5 fotos por equipamento.';if(files.some(f=>!f.type.startsWith('image/')))return 'Selecione somente fotografias. Vídeos e documentos não são permitidos.';return '';}
export function completionErrors(id,draft){
 if(id==='A')return [];
 return ['Este cartão ainda possui requisitos não implementados nesta fase. Não pode ser marcado como concluído.'];
}
