import {readFile,readdir,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const base='docs/07-operacao';
const files=['README.md','DEVELOPMENT.md','COMECE_AQUI.md','COMO_PUBLICAR_NO_GITHUB.md','PLANO_DE_TRANSFERENCIA_E_IMPLANTACAO.md',...(await readdir(base)).filter(x=>x.endsWith('.md')).map(x=>base+'/'+x)];
files.push(...(await readdir('docs/08-auditoria')).filter(x=>x.endsWith('.md')).map(x=>'docs/08-auditoria/'+x));
for(const extra of ['docs/07-operacao/gerado','docs/09-migracao-servidor-fisico']){
 try{files.push(...(await readdir(extra)).filter(x=>x.endsWith('.md')).map(x=>extra+'/'+x));}catch(error){if(error.code!=='ENOENT')throw error;}
}
const errors=[];let checked=0;
for(const file of files){const text=await readFile(file,'utf8');for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
 const url=match[1].split('#')[0];if(!url||/^[a-z]+:/i.test(url))continue;
 const target=resolve(dirname(file),decodeURIComponent(url));checked++;
 try{await access(target);}catch{errors.push({file,target:url});}
}}
console.log(JSON.stringify({passed:errors.length===0,files:files.length,links:checked,errors}));if(errors.length)process.exitCode=1;
