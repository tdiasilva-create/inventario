// Navigation stores identifiers and position only. Answers stay in the API/RAM.
export function routeFromLocation(location){
 const p=new URL(location.href).searchParams,id=p.get('vistoria');
 if(!id||!/^[a-f0-9-]{36}$/i.test(id))return {view:'units'};
 const view=['facade','cards','group','inventory','review','photo-queue'].includes(p.get('tela'))?p.get('tela'):'cards';
 return {view,inspectionId:id,group:/^[A-H]$/.test(p.get('cartao')||'')?p.get('cartao'):'A',step:Math.max(0,Math.min(100,Number(p.get('etapa'))||0)),returnReview:p.get('retorno')==='revisao'};
}
export function routeUrl(route,href){
 const url=new URL(href);url.search='';url.hash='';
 if(route.inspectionId){url.searchParams.set('vistoria',route.inspectionId);url.searchParams.set('tela',route.view);if(['group','inventory'].includes(route.view)){url.searchParams.set('cartao',route.group);if(route.view==='group')url.searchParams.set('etapa',String(route.step||0));if(route.returnReview)url.searchParams.set('retorno','revisao');}}
 return url.pathname+url.search;
}
export function installCollectorHistory(read,apply,onError){
 let restoring=false,queue=Promise.resolve();
 const remember=(replace=false)=>{if(restoring)return;const route=read(),url=routeUrl(route,location.href);if(url===location.pathname+location.search&&history.state?.collector)return;history[replace?'replaceState':'pushState']({collector:true,route},'',url);};
 const restore=async route=>{restoring=true;try{await apply(route);}finally{restoring=false;}remember(true);};
 addEventListener('popstate',event=>{const route=event.state?.collector?event.state.route:routeFromLocation(location);queue=queue.then(()=>restore(route)).catch(error=>{remember(true);onError(error);});});
 return {remember,restore,initial:()=>routeFromLocation(location)};
}
