// D-068: abreviação implementada a partir da referência do pacote de 06/11/2026.
// Validada contra os 141 casos de tests/fixtures/nomes-abreviados.csv; adaptada para
// o tipo aprovado Obra em andamento e desambiguação por tipo cadastrado.
//
// Regra (ordem exata):
//  1. Normaliza espaços. Remove conteúdo entre parênteses e tudo após "/" (apelidos, "antiga UEB…", "(NOVA)", "(UNIDADE 12)").
//  2. Colégio militar (nome contém "COLEGIO MILITAR" ou "CMCB"): devolve "CM <numeral romano da unidade>" (ex.: "CM XII");
//     se houver um nome próprio depois do numeral, acrescenta a última palavra significativa (ex.: "CM XII Paranã").
//  3. (Exceto tipo Obra) Remove UM prefixo de tipo no início: EMI, EM, CMI, UEB, EC, CMEI, NTME, ESCOLA MUNICIPAL (INTEGRAL), CRECHE MUNICIPAL (INTEGRAL),
//     CRECHE ESCOLA, CRECHE, UNIDADE DE CORREÇÃO DE FLUXO, NÚCLEO TECNOLÓGICO, (NÚCLEO) EDUCA PAÇO — com ou sem " - ".
//  4. Junta número a palavra anterior ("POLO 17", "AV 04", "UNIDADE 12") para contar como UM token.
//  5. Se sobrarem até 4 tokens E o texto tiver até 24 caracteres (Obra: 6 tokens / 30 caracteres): mantém inteiro (ex.: "Pão da Vida", "Raio de Luz", "Tia Dalva").
//  6. Senão: primeiro token significativo + último token significativo. Significativo = não é conectivo (de, da, do, das, dos, e, o, a)
//     nem título (Prof, Profª, Profº, Professor(a), Dr, Dra, Min, Ministro, Gov, Governador, Ver, Vereador, Pe, Padre, Sen, Dep, Sr, Sra,
//     Tia, Tio, Vovó, Vovô, Irmã, Ir). Ex.: "Profª Maria de Lourdes Carvalho Silva" → "Maria Silva".
//  7. Capitalização: Título por palavra, preservando acentos; siglas conhecidas em maiúsculas (CM, CT, CLC, CME, SEMED, SEADEX, PEI,
//     UNIESF, NTME, CAE, CACS); numerais romanos em maiúsculas; conectivos em minúsculas, exceto na 1ª posição.
//  8. Etiqueta por tipo quando a unidade NÃO é escola: "EP · " (Núcleo Educa Paço), "NT · " (Núcleo tecnológico), "ADM · "
//     (Unidade administrativa), "OBRA · " (Obra). Escolas (municipal, militar, creche) não levam etiqueta.
//  9. Desambiguação: se duas unidades do MESMO tipo ficarem com a mesma abreviação, acrescenta entre parênteses a 1ª palavra do
//     trecho removido no passo 1 (ex.: "Vila Cafeteira (Quadra)" e "Vila Cafeteira (Is)"); se não houver trecho removido, acrescenta
//     "·" + 3 últimos dígitos do código/INEP. A desambiguação é calculada sobre a LISTA exibida (shortUnitNames(lista)), nunca isolada.
// 10. O nome completo continua em `title` e `aria-label`; a abreviação é só rótulo visual.

const STOP=new Set(['DE','DA','DO','DAS','DOS','E','O','A','OS','AS','D']);
const TITLES=new Set(['PROF','PROFA','PROFO','PROFESSOR','PROFESSORA','DR','DRA','DOUTOR','DOUTORA','MIN','MINISTRO','GOV','GOVERNADOR','VER','VEREADOR','PE','PADRE','SEN','SENADOR','DEP','DEPUTADO','SR','SRA','TIA','TIO','VOVO','IRMA','IR']);
const ACRONYMS=new Set(['CM','CT','CLC','CME','CAE','CACS','SEMED','SEADEX','PEI','UNIESF','NTME','ASPCEMA']);
const PREFIX=/^(EMI|EM|CMI|UEB|EC|CMEI|NTME|ESCOLA MUNICIPAL INTEGRAL|ESCOLA MUNICIPAL|CRECHE MUNICIPAL INTEGRAL|CRECHE MUNICIPAL|CRECHE ESCOLA|CRECHE|UNIDADE DE CORRECAO DE FLUXO|NUCLEO TECNOLOGICO|NUCLEO EDUCA PACO|EDUCA PACO)\b\s*-?\s*/;
export const TYPE_TAGS={'Núcleo Educa Paço':'EP','Núcleo tecnológico':'NT','Unidade administrativa':'ADM','Obra em andamento':'OBRA'};
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[ªº]/g,'').toUpperCase();
const isRoman=t=>/^[IVXLC]+$/.test(norm(t));
function cap(tok,first){const n=norm(tok);if(STOP.has(n))return first?tok[0].toUpperCase()+tok.slice(1).toLowerCase():tok.toLowerCase();if(isRoman(tok)||ACRONYMS.has(n))return n;return tok.split(/(?=['’])/).map(p=>p[0]?p[0].toUpperCase()+p.slice(1).toLowerCase():p).join('');}
function base(name,unitType=''){
 let s=String(name||'').replace(/\s+/g,' ').trim();
 const removed=[...s.matchAll(/\(([^)]*)\)/g)].map(m=>m[1].trim());s=s.replace(/\([^)]*\)/g,' ');
 const slash=s.indexOf('/');if(slash>=0){removed.push(s.slice(slash+1).replace(/[()]/g,' ').trim());s=s.slice(0,slash);}
 s=s.replace(/[^\p{L}\p{N}\s\-'’ªº]/gu,' ').replace(/\s+/g,' ').trim();
 if(/COLEGIO MILITAR|CMCB/.test(norm(s))){const n=norm(s),m=n.match(/UNIDADE\s+([IVXLC]+)/);let rest=n.replace(/^.*?UNIDADE\s+[IVXLC]+\s*-?\s*/,'').replace(/UNIDADE PACO DO LUMIAR.*$/,'').trim();const toks=rest.split(/[\s\-]+/).filter(t=>t&&!STOP.has(t)&&!TITLES.has(t));return {short:('CM '+(m?m[1]:'')+(toks.length?' '+cap(toks[toks.length-1]):'')).trim(),removed};}
 const pm=unitType==='Obra em andamento'?null:norm(s).match(PREFIX);if(pm)s=s.slice(pm[0].length).trim(); // obras mantêm 'Creche'/'Escola' no nome
 let toks=s.split(/[\s\-]+/).filter(Boolean);
 const merged=[];for(const t of toks){if(/^\d+$/.test(t)&&merged.length)merged[merged.length-1]+=' '+t;else merged.push(t);}toks=merged;
 const [maxTok,maxLen]=unitType==='Obra em andamento'?[6,30]:[4,24];
 if(toks.length<=maxTok&&toks.join(' ').length<=maxLen)return {short:toks.map((t,i)=>t.split(' ').map((p,j)=>cap(p,i===0&&j===0)).join(' ')).join(' '),removed};
 const sig=toks.filter(t=>{const n=norm(t.split(' ')[0]);return !STOP.has(n)&&!TITLES.has(n);});
 const pick=sig.length?(sig.length===1?[sig[0]]:[sig[0],sig[sig.length-1]]):[toks[0],toks[toks.length-1]];
 return {short:pick.map((t,i)=>t.split(' ').map((p,j)=>cap(p,i===0&&j===0)).join(' ')).join(' '),removed};
}
export function shortUnitName(name,unitType=''){if(!String(name||'').trim())return '';const tag=TYPE_TAGS[unitType]||'';return (tag?tag+' · ':'')+base(name,unitType).short;}
// Calcula as abreviações de uma lista com desambiguação dentro do mesmo tipo. units: [{id,name,unit_type,code}] → Map(id → abreviação).
export function shortUnitNames(units){
 const info=units.map(u=>({u,...base(u.name,u.unit_type),tag:TYPE_TAGS[u.unit_type]||''}));
 const groups=new Map();for(const x of info){const k=x.u.unit_type+'|'+x.short.toLowerCase();(groups.get(k)||groups.set(k,[]).get(k)).push(x);}
 const out=new Map();
 for(const items of groups.values()){
  for(const x of items){let label=x.short;
   if(items.length>1){const extra=(x.removed.find(Boolean)||'').split(/\s+/).filter(Boolean);label+=extra.length?' ('+extra.slice(0,2).map((p,i)=>cap(p,i===0)).join(' ')+')':' ·'+String(x.u.code||x.u.id||'').slice(-3);}
   out.set(x.u.id,(x.tag?x.tag+' · ':'')+label);}
 }
 return out;
}
