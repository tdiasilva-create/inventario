import {parseCsv} from './lib/csv.mjs';
import {coordinatesForUnit} from '../web/map-geography.js';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const url='https://docs.google.com/spreadsheets/d/1FTNJJwNQkJtNONheGevNgLBJypwFRzhFcfoY3PsoR6s/export?format=csv&gid=1835004469';
const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
if(!response.ok||!response.headers.get('content-type')?.includes('text/csv'))throw new Error('A fonte não devolveu CSV legível.');
const raw=await response.text(),rows=parseCsv(raw);
const counts={};for(const r of rows)counts[r.TIPO_INSTITUICAO||'(não informado)']=(counts[r.TIPO_INSTITUICAO||'(não informado)']||0)+1;
if(process.argv.includes('--inspect')){
 console.log(JSON.stringify({rows:rows.length,types:counts,nonSchoolRows:rows.filter(r=>/administr|secret|instituc|local|orgao|órgão|outro/i.test(r.TIPO_INSTITUICAO+' '+r.NOME_ESCOLA)).map(r=>({name:r.NOME_ESCOLA,type:r.TIPO_INSTITUICAO,hasCoordinates:!!coordinatesForUnit({latitude:r.LATITUDE,longitude:r.LONGITUDE})}))},null,2));
}else{
 const records=rows.map((r,index)=>({r,index})).filter(({r})=>r.TIPO_INSTITUICAO.trim()==='UNIDADE ADMINISTRATIVA').map(({r,index})=>{
  const coordinates=coordinatesForUnit({latitude:r.LATITUDE,longitude:r.LONGITUDE});
  return {id:'sheet-row-'+(index+2),sourceRow:index+2,code:r.CODIGO_INEP?.trim()||null,name:r.NOME_ESCOLA.trim(),officialName:r.NOME_OFICIAL.trim()||null,type:r.TIPO_INSTITUICAO.trim()||null,pole:r.POLO.trim()||null,neighborhood:r.BAIRRO.trim()||null,latitude:coordinates?.[0]??null,longitude:coordinates?.[1]??null,example:true};
 });
 if(records.some(r=>!r.name)||new Set(records.map(r=>r.id)).size!==records.length)throw new Error('Nomes ausentes ou identificadores duplicados: revisar antes de extrair.');
 const data={sourceUrl:'https://docs.google.com/spreadsheets/d/1FTNJJwNQkJtNONheGevNgLBJypwFRzhFcfoY3PsoR6s/edit?gid=1835004469',sheetGid:'1835004469',retrievedAt:new Date().toISOString(),csvSha256:createHash('sha256').update(raw).digest('hex'),usage:'Exemplos cartográficos extraídos da fonte fornecida; não constitui importação no catálogo oficial D1.',records};
 await writeFile('web/data/map-examples.json',JSON.stringify(data,null,2)+'\n');
 console.log(JSON.stringify({rows:records.length,geolocated:records.filter(r=>r.latitude!==null).length,withoutCoordinates:records.filter(r=>r.latitude===null).map(r=>r.name),types:counts,examples:records.slice(0,4).map(r=>({name:r.name,type:r.type}))},null,2));
}
