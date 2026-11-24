import {icon} from './desktop-icons.js';
import {readPanelJson} from './desktop-request.js';
import {isOutOfScope} from './unit-schema.js';

const normalize=value=>String(value??'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g,' ');
export function unitSearchMarkup(){
 return `<form class="search unit-search" role="search" aria-label="Buscar unidades" autocomplete="off"><input name="q" type="search" maxlength="120" role="combobox" aria-label="Buscar unidade por nome ou INEP" placeholder="Buscar unidade por nome ou INEP" aria-autocomplete="list" aria-expanded="false" aria-controls="header-unit-options" aria-describedby="header-unit-hint"><button type="button" class="unit-search-clear" aria-label="Limpar busca de unidades" hidden>×</button><kbd aria-hidden="true">/</kbd><button type="submit" aria-label="Procurar unidade" title="Procurar unidade">${icon('search')}</button><div class="unit-search-popup" hidden><p id="header-unit-hint" role="status"></p><ul id="header-unit-options" role="listbox" aria-label="Unidades encontradas"></ul></div></form>`;
}

// One catalogue per page. Typing filters in memory; never queries equipment or D1 per key.
export function bindUnitSearch(form,{getUnits=async()=> (await readPanelJson('/api/units')).units,filterUnits=units=>units,onSelect=unit=>location.assign('/unidade?id='+encodeURIComponent(unit.id))}={}){
 if(!form)return;
 const input=form.querySelector('input'),clear=form.querySelector('.unit-search-clear'),popup=form.querySelector('.unit-search-popup'),list=form.querySelector('ul'),hint=form.querySelector('[role=status]');
 let catalogue=null,loading=null,matches=[],active=-1,open=false,generation=0;
 function close(){generation++;open=false;popup.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
 function choose(unit){input.value=unit.name;clear.hidden=false;close();input.focus({preventScroll:true});onSelect(unit);}
 function focusOption(index){active=index;for(const [i,item]of [...list.children].entries())item.setAttribute('aria-selected',String(i===active));const item=list.children[active];if(item){input.setAttribute('aria-activedescendant',item.id);item.scrollIntoView({block:'nearest'});}}
 async function draw(){
  const turn=++generation,query=normalize(input.value);active=-1;matches=[];list.replaceChildren();input.removeAttribute('aria-activedescendant');clear.hidden=!input.value;
  open=true;popup.hidden=false;input.setAttribute('aria-expanded','true');
  if(!query){hint.textContent='Digite o nome ou INEP da unidade.';return;}
  if(!catalogue){
   hint.textContent='Consultando unidades…';
   try{
    loading??=Promise.resolve().then(getUnits).then(units=>{
     if(!Array.isArray(units))throw Error('Catálogo inválido');
     catalogue=units.filter(u=>u.active&&!isOutOfScope(u.unit_type)).slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id));
    }).finally(()=>{loading=null;});
    await loading;
   }catch{if(turn===generation)hint.textContent='Não foi possível consultar as unidades. Use a lupa para tentar novamente.';return;}
  }
  if(turn!==generation||!open)return;
  matches=filterUnits(catalogue).filter(u=>normalize(u.name).includes(query)||normalize(u.code).includes(query));
  hint.textContent=matches.length?matches.length+' unidade(s) encontrada(s). Selecione uma unidade.':'Nenhuma unidade encontrada.';
  matches.forEach((unit,index)=>{
   const option=document.createElement('li');option.id='header-unit-option-'+index;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.dataset.unitId=unit.id;
   const name=document.createElement('strong');name.textContent=unit.name;option.append(name);
   const detail=document.createElement('small');detail.textContent=[unit.unit_type,unit.code?'INEP '+unit.code:unit.region].filter(Boolean).join(' · ');option.append(detail);
   option.addEventListener('mousedown',event=>event.preventDefault());option.addEventListener('click',()=>choose(unit));list.append(option);
  });
 }
 input.addEventListener('input',draw);
 input.addEventListener('focus',()=>{if(!open)draw();});
 input.addEventListener('keydown',event=>{
  if(event.isComposing)return;
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close();return;}
  if(event.key==='Tab'){close();return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();if(!open){void draw().then(()=>{if(open&&matches.length)focusOption(event.key==='ArrowDown'?0:matches.length-1);});return;}
   if(matches.length)focusOption(active<0?(event.key==='ArrowDown'?0:matches.length-1):(active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length);
  }
 });
 form.addEventListener('submit',event=>{event.preventDefault();if(open&&(active>=0||matches.length===1)){choose(matches[active>=0?active:0]);return;}input.focus();void draw().then(()=>{if(open&&matches.length)focusOption(0);});});
 clear.addEventListener('click',()=>{input.value='';input.focus();void draw();});
 form.addEventListener('focusout',event=>{if(!form.contains(event.relatedTarget))close();});
 document.addEventListener('pointerdown',event=>{if(!form.contains(event.target))close();});
 form.addEventListener('semed:close-unit-search',close);
 return {close};
}
