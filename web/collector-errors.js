import {sections,groups,sectionStages} from './collector-schema.js';
export function contextualErrors(group,errors,data,context){
 const result={};
 for(const [key,message]of Object.entries(errors)){
  const parts=key.split('.');let definitions=sections[group]||[],node=data,labels=[],field;
  for(let index=0;index<parts.length;index++){
   field=definitions.find(f=>f.key===parts[index]);if(!field)break;labels.push(field.label);node=node?.[field.key];
   if(/^\d+$/.test(parts[index+1]||'')){const row=Number(parts[++index]);labels.push('Registro '+(row+1));node=node?.[row];definitions=field.children||[];}
  }
  if(key.startsWith('photo-')){const n=(data.occurrences||[]).findIndex(o=>o.id===key.slice(6));labels=['Ocorrências',...(n>=0?['Registro '+(n+1)]:[])];}
  result[key]=group+' · '+(labels.length?labels.join(' / '):groups.find(g=>g[0]===group)?.[1]||group)+' — '+message;
 }
 return result;
}
export function issueStep(group,key,data,context){
 const top=key?.startsWith('photo-')?'occurrences':key?.split('.')[0];
 const stages=sectionStages(group,data,context);
 return Math.max(0,stages.findIndex(fields=>fields.some(f=>f.key===top)));
}
