// D-079: vínculo atual e forma de cadastro não são o estado de comunicação.
export const linkStates = Object.freeze({
 linked: {label:'Agente vinculado', description:'Este cadastro possui vínculo ativo com o agente. A comunicação aparece separadamente.'},
 manual: {label:'Cadastro manual', description:'Preenchido manualmente, sem vínculo ativo com agente.'},
 pending: {label:'Aguardando vínculo', description:'Foi escolhida a coleta por agente, mas o vínculo ainda não foi realizado.'},
 ended: {label:'Vínculo encerrado', description:'Este cadastro já teve um agente vinculado. O vínculo anterior foi encerrado; o histórico está preservado.'},
 unknown: {label:'Cadastro não informado', description:'Não há vínculo ativo nem informação suficiente para afirmar que o cadastro foi manual.'}
});
export const linkFilterOptions = [['','Todos os cadastros'], ...Object.entries(linkStates).map(([key,value])=>[key,value.label]), ['unlinked','Todos sem vínculo ativo']];
export function equipmentLinkState(item){
 if(Object.hasOwn(linkStates,item.link_state)||item.link_state==='not_applicable')return item.link_state;
 const d=item.data||item,category=d.category;
 if(category&&!['computer','desktop','notebook'].includes(category))return 'not_applicable';
 if(item.agent_linked===true||item.agent_linked===1)return 'linked';
 if(item.link_ended_at||item.agent_history)return 'ended';
 if(d.registration==='Manual')return 'manual';
 if(d.registration==='Agente')return 'pending';
 return 'unknown';
}
export function equipmentLinkLabel(item){return linkStates[equipmentLinkState(item)]?.label||'';}
export function equipmentLinkBadge(item,{explain=false}={}){
 const state=equipmentLinkState(item),meta=linkStates[state];if(!meta)return '';
 // All attributes/text below are static; no data or user-provided label becomes HTML.
 return `<span class="equipment-link-badge" data-link-state="${state}" title="${meta.description}"><span aria-hidden="true">${state==='linked'?'↔':state==='manual'?'✎':state==='pending'?'…':state==='ended'?'×':'?'}</span>${meta.label}</span>${explain?`<p class="equipment-link-explanation">${meta.description}</p>`:''}`;
}
