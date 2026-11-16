import {v3EquipmentFields} from '../web/collector-v3-schema.js';
// Compare persisted answers, independently of JSON key order and server-only metadata.
export function stableAnswers(value){
 if(Array.isArray(value))return value.map(stableAnswers);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stableAnswers(value[k])]));
 return value;
}
export const equalAnswers=(a,b)=>JSON.stringify(stableAnswers(a))===JSON.stringify(stableAnswers(b));
export function sameEquipmentAnswers(a,b){
 const metadata=new Set(['position_description','location_state','location_confirmed_by','location_confirmed_at']);
 const clean=v=>Object.fromEntries(Object.entries(v).filter(([k])=>!metadata.has(k)));
 return equalAnswers(clean(a),clean(b));
}

// ACK recovery only: the caller still passes fresh unit/profile authorization.
export function sameEquipmentSubmission(input,stored){
 const d=input.data||{};if(!!stored.draft!==(input.draft===true))return false;
 const canon=v=>v==null?'':typeof v==='object'?JSON.stringify(stableAnswers(v)):String(v).trim();
 const keys=['category','mode',...v3EquipmentFields.filter(f=>!f.when||f.when(d)).map(f=>f.key)].filter(k=>k!=='environmentName');
 if(!keys.every(k=>canon(d[k])===canon(stored[k])))return false;
 if(Number(d.mode==='Individual'?1:d.quantity)!==Number(stored.quantity))return false;
 if(d.category!=='other')return Object.hasOwn(input,'environmentId')?input.environmentId===stored.environment:String(d.environmentName||'').trim().replace(/\s+/g,' ')===stored.environmentName;
 return true;
}
