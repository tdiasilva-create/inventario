import {readFile,readdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('.',import.meta.url));
const names=(await readdir(dir)).filter(n=>/^\d{2}_.*\.md$/.test(n)).sort();
let result='SEMED — ANÁLISE PARA MIGRAÇÃO A SERVIDOR FÍSICO\nReferência: 12/11/2026, código funcional D-110 / 5cb844b.\nBranch: codex/analise-migracao-servidor-fisico\nSTATUS: PROPOSTA TÉCNICA. Não executa migração ou corte de produção.\nSem segredos, dumps, fotos operacionais ou binários privados.\n\n';
for(const name of names){const md=(await readFile(dir+name,'utf8')).replaceAll('\r\n','\n');result+='='.repeat(78)+'\n'+name+'\n'+'='.repeat(78)+'\n\n'+md.replace(/^#{1,6} /gm,'').replace(/^```[^\n]*\n?/gm,'').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1 ($2)').replaceAll('**','').replaceAll('`','').trim()+'\n\n';}
await writeFile(dir+'PLANO_COMPLETO_MIGRACAO.txt',result.trimEnd()+'\n');
console.log(JSON.stringify({chapters:names.length,bytes:Buffer.byteLength(result),output:'docs/09-migracao-servidor-fisico/PLANO_COMPLETO_MIGRACAO.txt'}));
