// Seleção por ID; digitar um nome nunca cria ou vincula uma unidade automaticamente.
const normalize=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g,' ');
export function mountUnitNamePicker(host,{units=[],value='',required=false,label='Buscar unidade por nome',onChange=()=>{}}={}){
 const id='unit-picker-'+crypto.randomUUID();let catalogue=[],chosen='',matches=[],active=-1,open=false;
 host.classList.add('unit-name-picker');
 host.innerHTML=`<label for="${id}"></label><div class="unit-name-input"><input id="${id}" type="text" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-list" aria-describedby="${id}-hint" autocomplete="off" maxlength="180"><button type="button" class="ops-btn" aria-label="Limpar unidade">Limpar</button></div><input type="hidden" name="unit"><div class="unit-name-options" hidden><ul id="${id}-list" role="listbox" aria-label="Unidades encontradas"></ul></div><small id="${id}-hint" role="status"></small>`;
 host.querySelector('label').textContent=label+(required?' *':'');
 const input=host.querySelector('[role=combobox]'),hidden=host.querySelector('[name=unit]'),clear=host.querySelector('button'),box=host.querySelector('.unit-name-options'),list=host.querySelector('ul'),hint=host.querySelector('small');
 input.required=required;input.placeholder=required?'Digite parte do nome da unidade':'Todas as unidades · digite para buscar';
 function validate(){input.setCustomValidity(chosen?'':input.value.trim()?'Selecione uma unidade nos resultados da busca.':required?'Selecione a unidade para registrar a demanda.':'');}
 function close(){open=false;box.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
 function select(unit,notify=true){
  const next=unit?.id||'',changed=chosen!==next;chosen=next;hidden.value=chosen;input.value=unit?.name||'';clear.hidden=!input.value;validate();close();
  hint.textContent=chosen?'Unidade selecionada.':required?'Escolha uma unidade nos resultados.':'Todas as unidades.';
  if(changed&&notify)onChange(chosen);
 }
 function draw(){
  const query=normalize(input.value);matches=catalogue.filter(u=>normalize(u.name).includes(query));active=-1;list.replaceChildren();input.removeAttribute('aria-activedescendant');
  const duplicateNames=new Map();for(const unit of catalogue){const key=normalize(unit.name);duplicateNames.set(key,(duplicateNames.get(key)||0)+1);}
  matches.forEach((unit,index)=>{
   const li=document.createElement('li');li.id=id+'-option-'+index;li.setAttribute('role','option');li.setAttribute('aria-selected',String(unit.id===chosen));li.dataset.unitId=unit.id;li.textContent=unit.name;
   if(duplicateNames.get(normalize(unit.name))>1){const detail=document.createElement('small');detail.textContent=(unit.unit_type||'Unidade')+' · ID '+unit.id.slice(0,8);li.append(detail);}
   li.addEventListener('mousedown',event=>event.preventDefault());li.addEventListener('click',()=>{select(unit);input.focus();});list.append(li);
  });
  open=true;box.hidden=!matches.length;input.setAttribute('aria-expanded',String(!!matches.length));
  hint.textContent=matches.length?matches.length+' unidade(s) encontrada(s). Selecione pelo nome.':'Nenhuma unidade encontrada.';
 }
 input.addEventListener('input',()=>{const hadSelection=!!chosen;chosen='';hidden.value='';clear.hidden=!input.value;validate();draw();if(hadSelection)onChange('');});
 input.addEventListener('focus',draw);
 input.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close();return;}
  if(event.key==='Tab'){close();return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();if(!open)draw();if(!matches.length)return;
   active=active<0?(event.key==='ArrowDown'?0:matches.length-1):(active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length;
   for(const [index,item]of [...list.children].entries())item.dataset.focused=String(index===active);
   input.setAttribute('aria-activedescendant',list.children[active].id);list.children[active].scrollIntoView({block:'nearest'});return;
  }
  if(event.key==='Enter'&&open){event.preventDefault();if(active>=0||matches.length===1)select(matches[active>=0?active:0]);else if(matches.length){active=0;list.children[0].dataset.focused='true';input.setAttribute('aria-activedescendant',list.children[0].id);}}
 });
 host.addEventListener('focusout',event=>{if(!host.contains(event.relatedTarget))close();});
 clear.addEventListener('click',()=>{select(null);input.focus();draw();});
 function update(next){
  catalogue=next.filter(u=>u.active||u.id===value).slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id));
  if(open)draw();
 }
 update(units);select(catalogue.find(u=>u.id===value),false);
 return {get value(){return chosen;},update,focus:()=>input.focus()};
}
