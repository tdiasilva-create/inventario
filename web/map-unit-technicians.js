// Uses only the assignments already returned to root by the map endpoint.
export function mapUnitTechnicians(routes){
 if(!Array.isArray(routes))throw Error('Designações indisponíveis');
 const units=new Map();
 for(const r of routes){
  if(!r||typeof r.unit_id!=='string'||typeof r.user_id!=='string'||typeof r.technician_name!=='string'||!r.technician_name.trim())throw Error('Designações inválidas');
  let users=units.get(r.unit_id);if(!users)units.set(r.unit_id,users=new Map());
  const previous=users.get(r.user_id);users.set(r.user_id,{name:r.technician_name,accepted:!!previous?.accepted||r.accepted===1});
 }
 return new Map([...units].map(([id,users])=>[id,[...users.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))]));
}
export function unitTechniciansText(state,id,openDemands){
 if(!state?.enabled)return '';
 const people=state.units?.get(id)||[];
 if(!openDemands&&!people.length)return '';
 if(!state.ready)return state.error?'Designações: consulta indisponível.':'Técnicos: consultando designações…';
 const lines=[people.length?(people.length===1?'Técnico designado: ':'Técnicos designados: ')+people.map(p=>p.name).join('; '):'Técnico ainda não designado.'];
 const accepted=people.filter(p=>p.accepted);if(accepted.length)lines.push('Aceite confirmado: '+accepted.map(p=>p.name).join('; '));
 if(state.error)lines.push('Designações: última leitura; atualização indisponível.');
 return lines.join('\n');
}
