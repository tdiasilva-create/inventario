// Índice estático reproduzível; não consulta a produção nem lê arquivos privados.
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const selected=[...new Set(files)].filter(p=>/^(server|web|shared|scripts|migrations|android\/technician|windows\/agent|config|tests)\//.test(p)||/^(wrangler[^/]*\.jsonc|package\.json|pnpm-lock\.yaml|\.github\/workflows\/ci\.yml)$/.test(p)).filter(p=>/\.(mjs|cjs|js|html|css|sql|java|xml|jsonc?|ya?ml|properties|cs|csproj|ps1|nsi|py)$/.test(p)&&!p.includes('/vendor/')&&!p.includes('/build/')&&!p.includes('/bin/')&&!p.includes('/obj/')).sort();
const unique=a=>[...new Set(a)].sort();
const records=[];
for(const path of selected){
 const source=(await readFile(path,'utf8')).replaceAll('\r\n','\n'),bytes=Buffer.from(source);
 records.push({path,bytes:bytes.length,lines:source.split('\n').length,sha256:createHash('sha256').update(bytes).digest('hex'),
  imports:unique([...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?|\brequire\s*\()\s*['"]([^'"]+)['"]/g)].map(m=>m[1])),
  exports:unique([...source.matchAll(/\bexport\s+(?:async\s+)?(?:function|class|const|let|var)\s+([\w$]+)/g)].map(m=>m[1])),
  environment:unique([...source.matchAll(/\benv\??\.([A-Z][A-Z_0-9]+)/g)].map(m=>m[1])),
  apiLiterals:unique([...source.matchAll(/['"`]([/]api[/][^'"`\s]*)['"`]/g)].map(m=>m[1]))});
}
const out='docs/07-operacao/gerado';await mkdir(out,{recursive:true});
await writeFile(out+'/codigo.json',JSON.stringify({scope:'Código e configuração públicos, sem vendor e binários. Extração estática por expressão regular; imports dinâmicos, exports agrupados e rotas compostas podem não constar. Não é OpenAPI nem grafo completo de execução.',files:records},null,2)+'\n');
let md='# Índice do código e referências de API\n\nGerado por `pnpm docs:code`. '+records.length+' arquivos de texto. Hashes/bytes usam UTF-8 com finais de linha LF normalizados; hashes exatos das migrações estão no catálogo físico separado. Não inclui bibliotecas vendor, binários, segredos nem dados reais. O JSON inclui imports literais, exports nomeados, nomes de variáveis de ambiente e referências de API. **Índice estático parcial de rotas**, não contrato executável: conferir método, autenticação e parâmetros na implementação/testes.\n\n';
for(const family of ['server','web','shared','migrations','android','windows','config','scripts','tests','configuração raiz']){
 const group=records.filter(r=>(r.path.includes('/')&&!r.path.startsWith('.github/')?r.path.split('/')[0]:'configuração raiz')===family);
 md+='## '+family+'\n\n| Arquivo | Linhas | Bytes |\n|---|---:|---:|\n'+group.map(r=>`| [${r.path}](../../../${r.path}) | ${r.lines} | ${r.bytes} |`).join('\n')+'\n\n';
}
md+='## API e dependências de plataforma por módulo servidor\n\n';
for(const r of records.filter(r=>r.path.startsWith('server/'))){md+='### '+r.path+'\n\n';if(r.environment.length)md+='Ambiente: '+r.environment.map(v=>'`'+v+'`').join(', ')+'.\n\n';if(r.apiLiterals.length)md+=r.apiLiterals.map(v=>'- `'+v+'`').join('\n')+'\n\n';else md+='Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.\n\n';}
await writeFile(out+'/CODIGO_E_ROTAS.md',md.trimEnd()+'\n');console.log(JSON.stringify({files:records.length,server:records.filter(r=>r.path.startsWith('server/')).length,output:out}));
