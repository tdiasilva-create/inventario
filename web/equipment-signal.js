// Presentation only: presence is classified by the server, never inferred from inventory data.
const labels={communicating:'Online · comunicação recente',communicating_with_failure:'Online · falha na leitura do inventário',no_recent_communication:'Offline · sem comunicação recente',reported_suspend:'Offline · suspensão informada pelo agente',reported_shutdown:'Offline · desligamento informado pelo agente',never_communicated:'Aguardando primeiro contato',revoked:'Agente revogado',not_linked:'Sem agente vinculado',unknown:'Status indisponível'};
export function equipmentSignal(item){
 const state=item.monitorState??(item.agent_linked?item.presence_state:'not_linked');
 const label=item.signalError?'Status desatualizado · aguardando atualização':labels[state]||labels.unknown;
 const color=item.signalError?'unknown':['communicating','communicating_with_failure'].includes(state)?'online':['no_recent_communication','reported_suspend','reported_shutdown'].includes(state)?'offline':'unknown';
 const date=new Date(item.last_contact_at||NaN),contact=Number.isFinite(date.valueOf())?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Fortaleza',dateStyle:'short',timeStyle:'medium'}).format(date):'Não recebido';
 return {color,label,title:`${label}\nÚltimo contato: ${contact} (Fortaleza)\nOnline indica comunicação recente do agente; offline não comprova que o computador está desligado.`};
}
