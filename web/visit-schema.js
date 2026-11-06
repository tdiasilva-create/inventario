export const visitVersion='visita-2';
export const labOptions=['Em uso','Uso parcial','Desativado ou usado para outra finalidade','Não existe','Não foi possível verificar','Não se aplica'];
export const topicNames={administrative:'Computadores administrativos',laboratory:'Laboratório de informática',printers:'Impressoras',infrastructure:'Internet, rede e energia',needs:'Problemas e necessidades'};
export function validateVisitEquipment(data,context,validateEquipment){
 const errors=validateEquipment({...data,serial:data.serial||'Não identificado',model:data.model||'Não identificado'},context);
 if(!['Administrativo','Laboratório','Outro'].includes(data.purpose))errors.purpose='Informe a finalidade/local de uso.';
 return errors;
}
export function validateVisitAnswers(a,{equipment=[],photos=[]}={}){
 const errors={};const ready=(kind,target)=>photos.some(p=>p.target_kind===kind&&p.status==='ready'&&(!target||p.target_id===target));
 if(!ready('facade'))errors.facade='Envie a fotografia da fachada. Sem armazenamento habilitado, a visita permanece em rascunho.';
 for(const key of ['administrative','printers'])if(!['Sim','Não','Não avaliado'].includes(a[key]))errors[key]='Responda '+topicNames[key]+'.';
 if(!labOptions.includes(a.laboratory))errors.laboratory='Informe a situação do laboratório.';
 const labExists=labOptions.slice(0,3).includes(a.laboratory);
 if(labExists&&!ready('laboratory'))errors.laboratoryPhoto='Envie uma fotografia do laboratório.';
 if(a.administrative==='Sim'&&!equipment.some(e=>['desktop','notebook'].includes(e.data.category)&&e.data.purpose==='Administrativo'))errors.administrativeItems='Registre os computadores administrativos encontrados.';
 if(labExists&&!equipment.some(e=>['desktop','notebook'].includes(e.data.category)&&e.data.purpose==='Laboratório'))errors.laboratoryItems='Registre os computadores do laboratório ou informe o motivo de não haver máquinas.';
 if(labExists&&a.labNoComputers?.trim())delete errors.laboratoryItems;
 if(a.printers==='Sim'&&!equipment.some(e=>e.data.category==='printer'))errors.printerItems='Registre as impressoras encontradas.';
 for(const e of equipment)if(['desktop','notebook','printer'].includes(e.data.category)&&!ready('equipment',e.id))errors['photo:'+e.id]='Envie a fotografia do equipamento '+(e.data.asset||e.id)+'.';
 for(const [key,label]of [['internet','Internet na unidade'],['wired','Rede cabeada'],['wifi','Wi-Fi'],['outlets','Tomadas suficientes'],['irregular','Irregularidades elétricas'],['specialist','Avaliação elétrica necessária'],['lack','Faltam equipamentos?']])if(!a[key])errors[key]='Responda '+label+'.';
 for(const topic of Object.keys(topicNames))if(!a.completed?.includes(topic))errors['complete:'+topic]='Marque '+topicNames[topic]+' como concluído.';
 for(const [index,p]of (a.problems||[]).entries()){if(!p.description?.trim())errors['problem:'+index]='Descreva o problema/demanda.';if(!p.area||!p.priority)errors['problem:'+index]='Informe área e prioridade do problema/demanda.';}
 if(a.lack==='Sim'&&!a.needs?.length)errors.needs='Registre as necessidades de equipamentos.';
 for(const [index,n]of (a.needs||[]).entries())if(!n.type?.trim()||!n.location?.trim()||!Number.isSafeInteger(Number(n.quantity))||Number(n.quantity)<1)errors['need:'+index]='Informe tipo, local e quantidade positiva para a necessidade.';
 return errors;
}
export function errorsForTopic(errors,topic){
 const keys={administrative:['administrative','administrativeItems','photo:'],laboratory:['laboratory','laboratoryPhoto','laboratoryItems','photo:'],printers:['printers','printerItems','photo:'],infrastructure:['internet','wired','wifi','outlets','irregular','specialist'],needs:['lack','needs','need:','problem:']};
 return Object.fromEntries(Object.entries(errors).filter(([key])=>(keys[topic]||[]).some(k=>key===k||k.endsWith(':')&&key.startsWith(k))));
}
