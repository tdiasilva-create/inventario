export function unitListState(unit){return Number(unit.inventory_records)>0?'received':unit.collection_started||Number(unit.draft_records)>0?'progress':'pending';}
export const unitStateLabel=unit=>({received:'Inventário recebido',progress:'Em preenchimento',pending:'Não iniciada'}[unitListState(unit)]);
export function visibleCollectorUnits(units,query='',tab='pending'){
 const search=query.trim().toLocaleLowerCase('pt-BR');
 return units.filter(u=>(tab==='received'?unitListState(u)==='received':unitListState(u)!=='received')&&(!search||[u.name,u.code,u.neighborhood,u.address].join(' ').toLocaleLowerCase('pt-BR').includes(search)));
}
