let started=false;
export function startDemandCount(user){
 if(started||!['root','admin','visualizador'].includes(user?.role))return;started=true;let busy=false;
 async function update(){if(busy||document.hidden)return;busy=true;try{const r=await fetch('/api/operations/queue-summary',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();const v=await r.json();const a=document.querySelector('.navigation a[href="/demandas"]');if(a){let b=a.querySelector('[data-demand-count]');if(!b){b=document.createElement('small');b.dataset.demandCount='';a.append(b);}b.textContent=v.pending?'('+v.pending+')':'';b.title=v.pending+' demanda(s) pendente(s) de atendimento';b.setAttribute('aria-label',b.title);}}catch{const b=document.querySelector('[data-demand-count]');if(b){b.textContent='!';b.title='Contagem de demandas temporariamente indisponível';}}finally{busy=false;}}
 update();setInterval(update,15000);document.addEventListener('visibilitychange',update);
}
