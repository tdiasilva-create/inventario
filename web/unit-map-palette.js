// D-087: cores de categoria aprovadas em 10/11/2026. Não representam status.
export const unitMapColors=Object.freeze({
 'Escola municipal':'#7523C9',
 'Escola municipal militar':'#DC2626',
 'Creche municipal':'#DB2777',
 'Núcleo Educa Paço':'#EA580C',
 'Núcleo tecnológico':'#0891B2',
 'Unidade administrativa':'#EAB308',
 'Obra em andamento':'#64748B'
});
export const unitMapColor=type=>Object.hasOwn(unitMapColors,type)?unitMapColors[type]:'#475569';
export function unitMapLegend(){
 return '<details class="unit-map-legend"><summary>Tipos de unidade</summary><ul>'+Object.entries(unitMapColors).map(([type,color])=>'<li><span class="unit-map-swatch" style="--unit-color:'+color+'" aria-hidden="true"></span>'+type+'</li>').join('')+'</ul><p><span class="demand-map-key" aria-hidden="true"></span> Anel verde-petróleo: demandas aguardando atendimento. Clique no anel para consultar.</p><p><span class="demand-map-key attending" aria-hidden="true"></span> Anel azul: aceite confirmado · a caminho ou em atendimento.</p><p>Círculo vermelho: hardware aguardando parecer. Consulte o comparativo pelo sino.</p><p data-map-demand-status role="status">Consultando demandas abertas…</p></details>';
}
