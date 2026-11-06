import {groups,demoUnits,createDraft,equipmentErrors,photoError,completionErrors} from './domain.js';
const app=document.querySelector('#app');
let view='login',group='A',step=0,draft=createDraft(),unit=null,notice='',photos=[],selectedItem=null;
let environmentForm={type:'Outro ambiente',name:''};
const paths={building:'M4 21V3h12v18M2 21h20M8 7h1m3 0h1M8 11h1m3 0h1M8 15h1m3 0h1M8 21v-3h4v3',rooms:'M3 3h18v18H3zM3 12h9V3m0 9v9m0-9h9',monitor:'M3 3h18v13H3zM12 16v5m-5 0h10',wifi:'M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0M12 20h.01',network:'M8 3h8v6H8zM3 16h6v5H3zM15 16h6v5h-6zM12 9v4M6 16v-3h12v3',bolt:'M13 2 4 14h7l-1 8 10-13h-8z',projector:'M3 6h18v13H3zM7 19l-2 3m12-3 2 3M8 10h.01M17 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',alert:'m12 3 10 18H2zM12 9v5m0 3h.01',arrow:'m9 5 7 7-7 7',back:'m15 5-7 7 7 7M8 12h13',camera:'M3 6h5l2-3h4l2 3h5v15H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',check:'m4 12 5 5L20 6',save:'M4 3h14l3 3v15H3V3zM7 3v6h10V3M7 21v-8h10v8',pin:'M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 0 1 14 0M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0'};
const icon=(name)=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.monitor}"/></svg>`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,cls='primary',extra='')=>`<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
function field(label,key,value='',options=null,type='text',scope='item'){
 const attr=`data-field="${key}" data-scope="${scope}" aria-label="${esc(label)}"`;
 return `<label class="field"><span>${esc(label)}</span>${options?`<select ${attr}><option value="">Selecionar</option>${options.map(o=>`<option ${value===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`:type==='textarea'?`<textarea ${attr}>${esc(value)}</textarea>`:`<input ${attr} type="${type}" value="${esc(value)}" ${type==='number'?'min="0" step="1"':''}>`}</label>`;
}
const brand=()=>`<header class="brand"><span class="brandmark">${icon('building')}</span><div><strong>SEMED</strong><small>Inventário Tecnológico<br>Coleta em campo</small></div></header>`;
const top=(action='cards')=>`<div class="topbar">${button(icon('back')+' Voltar',action,'ghost')}<span>COLETA EM CAMPO</span></div>`;
const context=()=>`<div class="context">${icon('pin')}${esc(unit?.name||'Nenhuma unidade selecionada')}</div>`;
function go(next){view=next;notice='';render();window.scrollTo(0,0);document.querySelector('h1')?.focus({preventScroll:true});}
function message(text){notice=text;render();document.querySelector('[role="status"]')?.scrollIntoView({block:'nearest'});}
function confirmDialog(title,body,accept){
 const dialog=document.createElement('dialog');dialog.innerHTML=`<h2>${esc(title)}</h2><p>${esc(body)}</p>${button('Confirmar','accept')}${button('Cancelar','cancel','secondary')}`;document.body.append(dialog);
 dialog.addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.action;if(a==='accept'){dialog.close();dialog.remove();accept();}if(a==='cancel'){dialog.close();dialog.remove();}});dialog.addEventListener('cancel',()=>dialog.remove());dialog.showModal();
}
function render(){
 let html='';
 if(view==='login')html=`<div class="eyebrow">ACESSO À COLETA</div><h1 tabindex="-1">Tecnologia presente.<br>Inventário em dia.</h1><p>Uma ferramenta para registrar e atualizar os recursos tecnológicos de cada unidade.</p><form id="login"><label class="field"><span>Nome de usuário</span><input name="username" autocomplete="username" required></label><label class="field"><span>Senha</span><input name="password" type="password" autocomplete="current-password" required></label><button class="primary">Entrar</button></form><p class="hint">Contas e redefinição de senha são gerenciadas pela administração.</p><div class="notice">O acesso institucional aguarda integração com Workers. Não informe credenciais reais neste protótipo.</div>${button('Explorar demonstração '+icon('arrow'),'demo','secondary')}`;
 if(view==='home')html=`<div class="eyebrow">COLETA EM CAMPO</div><div class="hero-symbol">${icon('monitor')}</div><h1 tabindex="-1">Olá,<br>vamos coletar?</h1><p>Visite a unidade, confira os recursos existentes e registre o que precisa de atenção.</p>${button((unit?'Retomar demonstração':'Iniciar coleta DEMO')+icon('arrow'),'start')}<div class="notice">${icon('save')} Rascunho de demonstração apenas nesta aba. Recarregar ou fechar a página apaga as respostas e fotos.</div>${button('Unidades','units','secondary')}${button('Status da integração','status','ghost')}`;
 if(view==='units')html=`${top('home')}<div class="eyebrow">UNIDADE ESCOLAR</div><h1 tabindex="-1">Selecionar unidade</h1><p>Escolha uma unidade existente para iniciar ou retomar a coleta.</p><label class="field"><span>Buscar unidade</span><input id="search" type="search" placeholder="Digite o nome da unidade"></label><div id="units-list">${unitList('')}</div><div class="notice">Catálogo oficial ainda não importado. Esta lista contém somente uma unidade DEMO isolada. A autorização por coletor será validada no servidor.</div>`;
 if(view==='cards')html=`${top('home')}${context()}<h1 tabindex="-1">O que vamos<br>registrar hoje?</h1><p>Ordem sugerida de A a H. Acesse os cartões conforme sua tarefa.</p><div class="cards">${groups.map(([id,name,sub,glyph,color])=>`<button class="card ${color}" data-action="group" data-id="${id}"><span class="glyph">${icon(glyph)}</span><span class="copy"><strong>${id} · ${name}</strong><small>${sub}</small><span class="state">${draft.sections[id]}${['B','C','D','E','F','G','H'].includes(id)?' · escopo parcial':''}</span></span>${icon('arrow')}</button>`).join('')}</div>${button('Revisar vistoria '+icon('arrow'),'review','secondary')}${button('Trocar unidade','change','ghost')}`;
 if(view==='group')html=groupContent();
 if(view==='equipment')html=equipmentContent();
 if(view==='saved')html=`${top('inventory')}${context()}<div class="hero-symbol success">${icon('check')}</div><h1 tabindex="-1">Item no rascunho DEMO</h1><p>Os dados permanecem somente na memória desta aba. O equipamento não foi gravado no D1 e as fotos não foram enviadas ao R2.</p><div class="listitem"><strong>${esc(selectedItem?.category)}</strong><small>Patrimônio: ${esc(selectedItem?.asset)}<br>ID de demonstração: ${esc(selectedItem?.id)}</small></div>${button('Adicionar outro computador','new-equipment')}${button('Voltar aos equipamentos','inventory','secondary')}${button('Voltar às categorias','cards','ghost')}`;
 if(view==='review')html=`${top()}${context()}<div class="eyebrow">REVISÃO DA VISTORIA</div><h1 tabindex="-1">Confira antes de enviar</h1><p>Conclusão de cartão e conclusão oficial da vistoria são estados distintos.</p>${groups.map(([id,name])=>`<div class="listitem row"><div><strong>${id} · ${name}</strong><small>${draft.sections[id]}</small></div>${button('Abrir','group','ghost',`data-id="${id}"`)}</div>`).join('')}<div class="notice warning">Envio indisponível: questionário incompleto e API não integrada. Nenhuma vistoria pode ser concluída oficialmente nesta fase.</div><button class="primary" disabled>Confirmar envio · indisponível</button>${button('Voltar às categorias','cards','secondary')}`;
 if(view==='status')html=`${top('home')}<h1 tabindex="-1">Status da integração</h1><div class="listitem"><strong>Interface de demonstração</strong><small>Navegação e respostas em memória disponíveis.</small></div><div class="listitem"><strong>Workers · D1 · R2</strong><small>Não integrados. Login, permissões, gravação e upload indisponíveis.</small></div><div class="listitem"><strong>Offline e proteção local</strong><small>Não implementados. Nenhuma alegação de armazenamento protegido ou retomada após recarregar.</small></div>`;
 app.innerHTML=`<main class="shell"><div class="demo">DEMONSTRAÇÃO · sem dados oficiais<br>Rascunho em memória · sem login ou sincronização</div>${brand()}${notice?`<div class="notice warning" role="status">${esc(notice)}</div>`:''}${html}<footer class="footer">SEMED · Inventário Tecnológico<br>Protótipo mobile • Questionário de referência v1.0</footer></main>`;
}
function unitList(q){return demoUnits.filter(u=>u.name.toLocaleLowerCase('pt-BR').includes(q.toLocaleLowerCase('pt-BR'))).map(u=>`<button class="unit" data-action="select-unit" data-id="${u.id}">${icon('building')}<span><strong>${esc(u.name)}</strong><small>${esc(u.detail)}</small><small>DEMO • unidade pré-cadastrada de teste</small></span><span class="arrow">›</span></button>`).join('')||'<div class="empty">Nenhuma unidade encontrada nesta demonstração.</div>';}
function groupContent(){
 const g=groups.find(([id])=>id===group);
 let content='';
 if(group==='A')content=`<div class="listitem"><strong>${esc(unit.name)}</strong><small>Coletor: demonstração, sem autenticação<br>Versão de referência: 1.0<br>Identificadores e datas oficiais dependem do servidor.</small></div>${field('Responsável presente na unidade (opcional)','responsible',draft.a.responsible,null,'text','a')}${field('Cargo (opcional)','role',draft.a.role,null,'text','a')}${field('Observações (opcional)','notes',draft.a.notes,null,'textarea','a')}${button('Marcar como concluído · DEMO','complete','primary')}`;
 else if(group==='B')content=`<p>Identifique os ambientes relevantes para vincular os equipamentos.</p><div class="notice">Fatia inicial: identificação individual. Contagem por tipos e catálogo institucional ainda pendentes de implementação. Tipo disponível: Outro ambiente.</div>${draft.environments.map(e=>`<div class="listitem"><strong>${esc(e.name)}</strong><small>${esc(e.type)} • DEMO</small></div>`).join('')}${field('Nome do ambiente','name',environmentForm.name,null,'text','env')}${button('Adicionar ambiente ao rascunho','add-environment')}${button('Marcar como concluído','complete','secondary')}`;
 else if(['F','G'].includes(group)){
 const items=group==='G'?draft.equipment.filter(e=>e.audiovisual):draft.equipment;
 content=`<p>${group==='G'?'Os recursos audiovisuais usam os mesmos registros do grupo F.':'Confira um registro do rascunho ou cadastre um novo equipamento.'}</p>${items.length?items.map(e=>`<div class="listitem"><strong>${esc(e.category)}</strong><small>Patrimônio: ${esc(e.asset)}<br>${esc(e.operation)} · ${esc(e.use)}<br>Última alteração DEMO: ${esc(e.modified)}<br>Última verificação DEMO: ${esc(e.verified||'Não verificado')}</small>${button('Abrir ficha do rascunho','edit-item','secondary',`data-id="${e.id}"`)}</div>`).join(''):'<div class="empty">Nenhum equipamento neste rascunho DEMO.</div>'}${group==='F'?button('Cadastrar computador desktop '+icon('arrow'),'new-equipment'):''}<div class="notice">${group==='G'?'TV/painel, projetor, webcam, microfone e caixa de som terão acesso às fichas F. Nenhum cadastro separado é criado aqui.':'Fatia inicial: computador desktop individual. Demais categorias, lotes e conferência do inventário oficial serão implementados em etapas seguintes.'}</div>${button('Marcar como concluído','complete','secondary')}`;
 }else content=`<div class="notice">${esc(g[1])}: fluxo completo ainda não implementado. As regras do TXT permanecem preservadas e este cartão não pode ser concluído.</div><p>Referência funcional: Base de Coleta v1.0, grupo ${group}. Navegação disponível; sem gravação ou resposta presumida.</p>${button('Voltar às categorias','cards','secondary')}`;
 return `${top()}${context()}<div class="eyebrow">GRUPO ${group}</div><h1 tabindex="-1">${esc(g[1])}</h1>${content}${button(icon('save')+' Salvar rascunho','save','ghost')}`;
}
function equipmentContent(){
 const i=draft.item;
 let content='';
 if(step===0)content=`<h2>Onde está o equipamento?</h2><p>Vincule o computador a um ambiente cadastrado na unidade.</p>${draft.environments.length?field('Ambiente','environment',i.environment,draft.environments.map(e=>e.name)):`<div class="notice warning">Cadastre um ambiente no grupo B para continuar nesta etapa. As respostas do item serão preservadas.</div>${button('Ir para ambientes','dependency','secondary')}`}<div class="listitem"><strong>Computador desktop</strong><small>Cadastro individual • ID interno independente de patrimônio e série</small></div>`;
 if(step===1)content=`<h2>Identificação do computador</h2><p>Informe os dados disponíveis. Patrimônio preserva zeros à esquerda.</p>${['asset','serial','brand','model'].map((key,n)=>field(['Patrimônio','Número de série','Marca / fabricante','Modelo'][n],key,i[key])).join('')}<div class="hint">Use as alternativas correspondentes quando não houver identificação:</div>${button('Sem patrimônio','alternative','secondary','data-key="asset" data-value="Sem patrimônio"')}${button('Sem número de série','alternative','secondary','data-key="serial" data-value="Sem número de série"')}${button('Não identificado · marca','alternative','secondary','data-key="brand" data-value="Não identificado"')}${button('Não identificado · modelo','alternative','secondary','data-key="model" data-value="Não identificado"')}`;
 if(step===2)content=`<h2>Condições de uso</h2>${field('Conservação física','condition',i.condition,['Bom','Regular','Ruim','Não avaliado'])}${field('Funcionamento','operation',i.operation,['Funcionando','Funciona parcialmente','Não funciona','Não testado'])}${field('Situação de uso','use',i.use,['Em uso','Fora de uso','Reserva','Desconhecido'])}`;
 if(step===3)content=`<h2>Problemas e ação</h2><p>Obrigatórios quando houver falhas. É possível apontar um problema mesmo se o equipamento funciona.</p>${field('Problemas identificados','problem',i.problem,null,'textarea')}${button('Problema não identificado','alternative','secondary','data-key="problem" data-value="Problema não identificado"')}${field('Ação recomendada','action',i.action,['Manutenção','Substituição','Instalação','Avaliação técnica','Outra ação (especificar)'])}${field('Especificar outra ação','otherAction',i.otherAction)}${field('Prioridade preliminar','priority',i.priority,['Baixa','Média','Alta','Crítica'])}<div class="hint">Lista de problemas por categoria e critérios institucionais de prioridade ainda pendentes. Este é um campo inicial de descrição.</div>`;
 if(step===4)content=`<h2>Detalhes técnicos</h2><p>Todos estes campos são opcionais.</p>${[['cpu','Processador (CPU)'],['ram','Memória RAM'],['storage','Armazenamento · tipo e capacidade'],['os','Sistema operacional']].map(([k,l])=>field(l,k,i[k])).join('')}${field('Observações adicionais (opcional)','notes',i.notes,null,'textarea')}`;
 if(step===5)content=`<h2>Registrar fotos</h2><p>Fotos do equipamento são opcionais, mesmo com defeito. Inclua etiquetas e detalhes, se desejar.</p><div class="row"><span>${photos.length} de 5 fotos</span><span class="badge">Sem upload</span></div><div class="photos">${photos.map((p,n)=>`<div class="photo"><img src="${p.url}" alt="Prévia da fotografia ${n+1} do computador">${button('Remover foto '+(n+1),'remove-photo','ghost',`data-index="${n}"`)}</div>`).join('')}</div><label class="upload">${icon('camera')} Tirar foto<input type="file" id="camera" accept="image/*" capture="environment"></label><label class="upload">Escolher da galeria<input type="file" id="gallery" accept="image/*" multiple></label><div class="hint">Câmera depende do navegador e da permissão do aparelho. Prévias só nesta aba; sem compressão, armazenamento durável ou envio ao R2 nesta fase.</div>`;
 if(step===6)content=`<h2>Revisar equipamento</h2><div class="listitem"><strong>Computador desktop • individual</strong>${[['environment','Ambiente'],['asset','Patrimônio'],['serial','Série'],['brand','Marca'],['model','Modelo'],['condition','Conservação'],['operation','Funcionamento'],['use','Uso'],['problem','Problemas'],['action','Ação'],['priority','Prioridade'],['cpu','CPU opcional'],['ram','RAM opcional'],['storage','Armazenamento opcional'],['os','Sistema opcional'],['notes','Observações']].map(([k,l])=>`<small>${l}: ${esc(i[k]||'Não informado')}</small>`).join('')}<small>${photos.length} foto(s) opcionais • não enviadas</small></div><div class="notice">Adicionar ao rascunho não conclui o cartão nem oficializa a vistoria.</div>`;
 return `${top('leave-item')}${context()}<div class="wizardhead"><div class="steps">${Array.from({length:7},(_,n)=>`<i class="${n<=step?'active':''}"></i>`).join('')}</div><span>Etapa ${step+1} de 7 · item</span></div><div class="eyebrow">NOVO COMPUTADOR · DEMO</div><h1 class="sr" tabindex="-1">Cadastro de computador, etapa ${step+1}</h1>${content}<div class="actions">${button('Voltar','previous','secondary')}${button(step===6?'Adicionar ao rascunho':'Próximo '+icon('arrow'),step===6?'save-item':'next')}</div>`;
}
app.addEventListener('submit',e=>{if(e.target.id==='login'){e.preventDefault();e.target.reset();message('Login não integrado. A autenticação institucional será feita por Workers. Use a demonstração sem credenciais.');}});
app.addEventListener('input',e=>{
 if(e.target.id==='search'){document.querySelector('#units-list').innerHTML=unitList(e.target.value);return;}
 const {field:key,scope}=e.target.dataset;if(!key)return;
 if(scope==='a')draft.a[key]=e.target.value;else if(scope==='env')environmentForm[key]=e.target.value;else if(draft.item)draft.item[key]=e.target.value;
});
app.addEventListener('change',async e=>{
 if(!['camera','gallery'].includes(e.target.id))return;
 const files=Array.from(e.target.files||[]);const error=photoError(files,photos.length);if(error){message(error);return;}
 const itemId=draft.item?.id;
 const next=[];
 for(const file of files){const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();next.push({url,file});}catch{URL.revokeObjectURL(url);next.forEach(p=>URL.revokeObjectURL(p.url));message('Não foi possível abrir a fotografia. Escolha um formato compatível com este navegador.');return;}}
 // A navigation away while decoding must not attach files to another item.
 if(view!=='equipment'||step!==5||draft.item?.id!==itemId){next.forEach(p=>URL.revokeObjectURL(p.url));return;}
 if(photos.length+next.length>5){next.forEach(p=>URL.revokeObjectURL(p.url));message('O limite é de 5 fotos por equipamento.');return;}
 photos.push(...next);render();
});
app.addEventListener('click',e=>{
 const b=e.target.closest('button[data-action]');if(!b)return;const a=b.dataset.action;
 if(a==='demo'){go('home');return;}
 if(a==='start'){go(unit?'cards':'units');return;}
 if(['home','units','cards','review','status'].includes(a)){go(a);return;}
 if(a==='select-unit'){unit=demoUnits.find(u=>u.id===b.dataset.id);go('cards');return;}
 if(a==='change'){confirmDialog('Trocar unidade?','O rascunho DEMO continuará apenas na memória desta aba. O catálogo oficial ainda não está disponível.',()=>go('units'));return;}
 if(a==='group'){
  const id=b.dataset.id;
  const open=()=>{group=id;go('group');};
  if(draft.sections[id]==='Concluído')confirmDialog('Reabrir cartão?','O cartão voltará a Em andamento e precisará ser concluído manualmente novamente.',()=>{draft.sections[id]='Em andamento';open();});else{draft.sections[id]='Em andamento';open();}return;
 }
 if(a==='complete'){const errors=completionErrors(group,draft);if(errors.length){message(errors.join(' '));return;}draft.sections[group]='Concluído';go('cards');return;}
 if(a==='save'){message('Rascunho mantido apenas na memória desta aba. Persistência local protegida e sincronização não integradas.');return;}
 if(a==='add-environment'){
  if(!environmentForm.name.trim()){message('Informe o nome do ambiente antes de adicioná-lo.');return;}
  if(draft.environments.some(x=>x.name.toLocaleLowerCase('pt-BR')===environmentForm.name.trim().toLocaleLowerCase('pt-BR'))){message('Esse ambiente já está no rascunho.');return;}
  draft.environments.push({id:crypto.randomUUID(),name:environmentForm.name.trim(),type:'Outro ambiente'});environmentForm.name='';go('group');return;
 }
 if(a==='inventory'){group='F';go('group');return;}
 if(a==='new-equipment'){
  if(draft.item){go('equipment');return;}
  draft.item={id:crypto.randomUUID(),category:'Computador desktop'};photos=[];step=0;group='F';draft.sections.F='Em andamento';go('equipment');return;
 }
 if(a==='edit-item'){
  const item=draft.equipment.find(x=>x.id===b.dataset.id);
  const open=()=>{draft.item={...item};photos=[...item.photos];step=0;go('equipment');};
  if(draft.item&&draft.item.id!==item.id)confirmDialog('Descartar a edição em andamento?','Existe outro equipamento em edição nesta aba. Abrir esta ficha descartará as alterações ainda não adicionadas ao rascunho.',open);else open();return;
 }
 if(a==='dependency'){group='B';draft.sections.B='Em andamento';go('group');return;}
 if(a==='leave-item'){confirmDialog('Voltar às categorias?','As respostas deste item continuarão no rascunho em memória desta aba. Recarregar a página as apaga.',()=>go('cards'));return;}
 if(a==='previous'){if(step>0){step--;go('equipment');}else go('cards');return;}
 if(a==='next'){
  if(step===0&&!draft.environments.some(e=>e.name===draft.item.environment)){message('Para avançar, cadastre e selecione o ambiente no grupo B.');return;}
  step++;go('equipment');return;
 }
 if(a==='alternative'){draft.item[b.dataset.key]=b.dataset.value;render();return;}
 if(a==='remove-photo'){photos.splice(Number(b.dataset.index),1);render();return;}
 if(a==='save-item'){
  const errors=equipmentErrors(draft.item);if(errors.length){message(errors.join(' '));return;}
  const i={...draft.item,photos:[...photos],modified:new Date().toLocaleString('pt-BR',{timeZone:'America/Fortaleza'})};
  const n=draft.equipment.findIndex(e=>e.id===i.id);if(n<0)draft.equipment.push(i);else draft.equipment[n]=i;
  selectedItem=i;draft.item=null;photos=[];go('saved');return;
 }
});
window.addEventListener('beforeunload',e=>{if(unit){e.preventDefault();e.returnValue='';}});
render();
