import {numericUnitColumns,collectorHiddenTypes,isOutOfScope} from './unit-schema.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const known=v=>v!==null&&v!==undefined&&v!==''&&Number.isInteger(v)&&v>=0;
const num=v=>new Intl.NumberFormat('pt-BR').format(v);
export function unitFiguresLine(u){const text=[['students_total','Alunos'],['classes_total','Turmas']].filter(([k])=>known(u[k])).map(([k,l])=>l+' '+num(u[k])).join(' · ');return text?'<small class="unit-figures-line">'+text+'</small>':'';}
export function networkFigures(units,loaded=true){
 const rows=units.filter(u=>!isOutOfScope(u.unit_type)&&!collectorHiddenTypes.includes(u.unit_type)),metrics=[['students_total','Alunos'],['classes_total','Turmas'],['seats_available','Vagas disponíveis'],['staff_total','Servidores']],covered=rows.filter(u=>metrics.some(([k])=>known(u[k]))).length;
 return '<section class="network-figures" aria-labelledby="network-figures-title"><h3 id="network-figures-title">Rede em números (cadastro)</h3><dl>'+metrics.map(([key,label])=>{const values=rows.filter(u=>known(u[key]));return '<div data-figure="'+key+'"><dt>'+label+'</dt><dd>'+(loaded&&values.length?num(values.reduce((n,u)=>n+u[key],0)):'—')+'</dd><small>'+(loaded?values.length+' de '+rows.length+' unidades informaram':'Consulta indisponível')+'</small></div>';}).join('')+'</dl><p>'+(loaded?covered+' de '+rows.length+' unidades com números informados.':'Números indisponíveis.')+' Cadastro mestre; obras excluídas. Valores ausentes não são zero. As fontes e datas podem variar por unidade.</p></section>';
}
export function unitFigures(u,compact=false){
 const fields=numericUnitColumns.filter(([key])=>known(u[key]));
 return (compact?'<details class="unit-master-figures"><summary>Cadastro da unidade</summary>':'<section class="panel unit-master-figures"><div class="dialog-body"><h3>Cadastro da unidade</h3>')+'<p>'+esc(u.unit_type||'Tipo não informado')+'</p>'+(fields.length?'<dl>'+fields.map(([k,l])=>'<div><dt>'+l+'</dt><dd>'+num(u[k])+'</dd></div>').join('')+'</dl>':'<p>Números do cadastro ainda não informados.</p>')+[['building_code','Código do prédio'],['notes','Observações'],['figures_source','Fonte dos números'],['figures_reference_date','Data de referência']].filter(([k])=>u[k]).map(([k,l])=>'<p><strong>'+l+':</strong> '+esc(k==='figures_reference_date'?u[k].split('-').reverse().join('/'):u[k])+'</p>').join('')+(compact?'</details>':'</div></section>');
}
