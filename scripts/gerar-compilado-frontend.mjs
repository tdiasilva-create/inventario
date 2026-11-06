import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {v3Sections,v3EquipmentFields,topics,questionnaireVersion,computerOperationLabels,registrationLabels} from '../web/collector-v3-schema.js';
import {collectorFixture} from '../tests/helpers/collector-db.mjs';
const root=path.resolve('.'),out=path.resolve('entregas/COMPILADO_FRONTEND_COLETOR_SEMED_2026-11-05');
if(!out.startsWith(root+path.sep+'entregas'+path.sep))throw Error('Destino inválido');
fs.mkdirSync(out,{recursive:true});
const writes=(name,text)=>{const dest=path.join(out,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,text,'utf8');};
const json=(name,value)=>writes(name,JSON.stringify(value,null,2)+'\n');
const copied=[];
function copy(source,dest=source){const p=path.join(out,dest);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(source,p);copied.push({source,destination:dest,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')});}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const base of ['web','server','migrations'])for(const file of walk(base))copy(file,'codigo/'+file.replaceAll('\\','/'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const testFiles=pkg.scripts.test.split(' ').filter(p=>p.startsWith('tests/'));
for(const file of testFiles)copy(file,'codigo/'+file);
for(const file of walk('tests/helpers'))copy(file,'codigo/'+file.replaceAll('\\','/'));
copy('tests/collector-v3-browser.cjs','codigo/tests/collector-v3-browser.cjs');
copy('scripts/build-collector.mjs','codigo/scripts/build-collector.mjs');
copy('scripts/build-desktop.mjs','codigo/scripts/build-desktop.mjs');
copy('scripts/lib/csv.mjs','codigo/scripts/lib/csv.mjs');
copy('package.json','referencias/PACKAGE_ORIGINAL_APENAS_REFERENCIA.json');
json('codigo/package.json',{name:'semed-coletor-referencia-isolada',private:true,type:'module',engines:{node:'>=24'},scripts:{start:'node scripts/visualizar-coletor-isolado.mjs',test:pkg.scripts.test,'test:browser':'node tests/collector-v3-browser.cjs','build:collector':pkg.scripts['build:collector'],'build:desktop':pkg.scripts['build:desktop']},dependencies:{...pkg.dependencies,qrcode:pkg.devDependencies.qrcode},devDependencies:{playwright:'^1.55.0'}});
const browserPath=path.join(out,'codigo/tests/collector-v3-browser.cjs');
let browser=fs.readFileSync(browserPath,'utf8').replace("const pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));","const pw=require(process.env.SEMED_PLAYWRIGHT_MODULE||'playwright');");
fs.writeFileSync(browserPath,browser);
const docs=['00_LEIA_ANTES_DE_TUDO.md','AGENTS.md','docs/00-governanca/REGRAS_DE_PRECEDENCIA.md','docs/00-governanca/DECISOES.md','docs/00-governanca/PENDENCIAS.md','docs/00-governanca/CONFLITOS_DOCUMENTAIS.md','docs/00-governanca/RASTREABILIDADE.md','docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt','docs/02-coleta-mobile/06_ESPECIFICACAO_TELA_A_TELA.md','docs/02-coleta-mobile/02_TELAS_E_TRANSICOES.md','docs/02-coleta-mobile/03_CATALOGO_E_MAPEAMENTO.md','docs/02-coleta-mobile/04_FOTOS_E_ESTADOS.md','docs/02-coleta-mobile/05_GUIA_VISUAL_MOBILE.md','docs/05-qualidade/FOTO_COMPUTADOR_E_APRESENTACAO_2026-11-05.md','docs/05-qualidade/ANYDESK_RUSTDESK_2026-11-05.md','docs/05-qualidade/PUBLICACAO_V3_2026-11-05.md','docs/05-qualidade/CADASTRO_AUTOMATICO_2026-11-05.md'];
for(const file of docs)if(fs.existsSync(file))copy(file,'referencias/'+file);
for(const file of walk('docs/05-qualidade/evidencias/coletor-foto-computador-2026-11-05'))copy(file,'evidencias/ultima-entrega/'+path.basename(file));
// Não copiar logs do Wrangler: podem conter e-mails administrativos ou URLs temporárias.
function latest(file){const data=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));const d=data.sort((a,b)=>Date.parse(a.created_on)-Date.parse(b.created_on)).at(-1);return {publishedAt:d.created_on,versions:d.versions.map(v=>({id:v.version_id,percentage:v.percentage}))};}
json('evidencias/producao-versoes-consultadas.json',{checkedAt:new Date().toISOString(),source:'Wrangler deployments list, somente leitura; campos administrativos omitidos',collector:latest('private-data/compilado-deploy-coletor.json'),panel:latest('private-data/compilado-deploy-painel.json')});
json('referencias/ORIGEM_DAS_COPIAS.json',{copiedAt:new Date().toISOString(),files:copied,adaptations:['codigo/package.json: sem comandos de deploy, com visualizador isolado e Playwright portátil','codigo/tests/collector-v3-browser.cjs: resolução do Playwright portátil; lógica de testes preservada'],excluded:['Credenciais, cookies, tokens, arquivos OAuth, .env, private-data, backups, banco oficial, executáveis, node_modules, .git e configuração de deploy autenticada']});
const when={
 'C.linkCount':'Quando existe internet = Sim.', 'C.links':'Quando existe internet = Sim. Cada registro tem suas próprias condições.', 'C.links.frequency':'Quando este link informa quedas frequentes = Sim.',
 'equipment.category':'Computador; não exibido em impressora/outros.', 'equipment.registration':'Computador; na interface é escolhido por Ler QR Code ou Cadastrar sem agente, não por select.', 'equipment.manualReason':'Computador em cadastro Manual.',
 'equipment.environmentName':'Computador e impressora.', 'equipment.position_label':'Computador.', 'equipment.anydesk':'Computador (tipo não informado, desktop ou notebook).', 'equipment.rustdesk':'Computador (tipo não informado, desktop ou notebook).', 'equipment.assetStatus':'Computador.', 'equipment.computerOrigin':'Computador.', 'equipment.brand':'Impressora.', 'equipment.model':'Impressora.', 'equipment.operation':'Computador e impressora.', 'equipment.problems':'Computador e impressora.', 'equipment.origin':'Impressora.', 'equipment.acquisition':'Impressora.', 'equipment.supplies':'Impressora.', 'equipment.connection':'Impressora.', 'equipment.ip':'Impressora com conexão Cabo de rede ou Wi-Fi.', 'equipment.customCategory':'Outros equipamentos.'
};
const fields=[];
function flatten(defs,prefix,parent=null){for(const f of defs){const key=prefix+'.'+f.key;fields.push({path:key,label:f.label,type:f.type,required:typeof f.required==='function'?'condicional':!!f.required,requiredExpression:typeof f.required==='function'?f.required.toString():null,condition:when[key]||(f.when?'Ver expressão técnica':'Sempre dentro deste bloco; herda condições do registro pai.'),conditionExpression:f.when?.toString()||null,parent,options:f.options||[]});if(f.children)flatten(f.children,key,key);}}
for(const [g]of topics)flatten(v3Sections[g]||[],g);flatten(v3EquipmentFields,'equipment');
json('contratos/catalogo-perguntas-atual.json',{technicalVersion:questionnaireVersion,visibleVersion:false,topics,fields,displayLabels:{computerOperationLabels,registrationLabels}});
const lines=['SEMED — TODAS AS PERGUNTAS E CAMPOS ATUAIS','Extração do catálogo executável em 05/11/2026, após D-060. Não usar o exportador antigo da Base como catálogo atual.','A versão técnica é coleta-3.0, invisível para o operador.','Ordem atual: '+topics.map(([id,name])=>id+' — '+name).join(' → '),'','REGRAS ADICIONAIS FORA DO CATÁLOGO','Fachada: câmera/galeria; evidência necessária para concluir, inclusive reutilização histórica autorizada.','Ambientes: Nome do ambiente (obrigatório ao adicionar); foto opcional.','Computadores: 0–5 fotos opcionais por ficha/visita; ambiente e posição antes do envio inicial.','Impressoras: fotografia inicial exigida na revisão; histórico pode satisfazer a evidência conforme servidor.','Outros equipamentos: foto opcional; nome opcional; sem ambiente no formulário atual.','Problemas adicionais: foto opcional por ocorrência.','Não há campo de senha Wi-Fi, número de patrimônio ou questionário de energia separado no fluxo atual.','Cada equipamento atual é Individual, quantity=1; listas comportam múltiplos registros com paginação.','','CATÁLOGO COMPLETO (condições do pai também se aplicam)'];
for(const f of fields)lines.push('',f.path+' — '+f.label,'Tipo: '+f.type,'Obrigatório: '+(f.required===true?'Sim, quando aplicável':f.required===false?'Não':'Somente em computador com funcionamento parcial ou não funciona'),'Exibição: '+f.condition,...(f.options.length?['Opções gravadas: '+f.options.join(' | ')]:[]),...(f.conditionExpression?['Condição técnica: '+f.conditionExpression]:[]),...(f.requiredExpression?['Obrigatoriedade técnica: '+f.requiredExpression]:[]));
lines.push('','Limites e particularidades: ambiente 180 caracteres; posição 64; texto geral 4.000. AnyDesk/RustDesk são texto de dígitos, preservam zeros, aceitam vazio. LinkCount=1 ou 2 exige quantidade igual de fichas; 3 ou mais exige ao menos três. Mbps aceita número não negativo ou o literal Não soube informar. Nome/cargo do acompanhante são opcionais, apresentados diretamente. Cargo usa opções do catálogo. Nenhuma fotografia é incluída no JSON de respostas: usar endpoint binário.');
writes('02_PERGUNTAS_CAMPOS_E_CONDICOES.txt',lines.join('\n')+'\n');
const f=collectorFixture();
const tables=f.sqlite.prepare("SELECT name,type,sql FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(t=>({...t,columns:f.sqlite.prepare('PRAGMA table_info("'+t.name+'")').all()}));f.sqlite.close();
json('contratos/esquema-banco-sem-registros.json',{source:'Migrações do código aplicadas somente a SQLite em memória; não é dump do D1 de produção',objects:tables});
const routes=[];
for(const file of walk('server').filter(p=>p.endsWith('.mjs'))){const s=fs.readFileSync(file,'utf8');for(const [i,line]of s.split('\n').entries())for(const match of line.matchAll(/['"`]((?:\/api\/)[a-zA-Z0-9_/?=.:+-]+)/g))routes.push({path:match[1],source:file.replaceAll('\\','/'),line:i+1});}
json('contratos/rotas-encontradas-no-servidor.json',{note:'Índice lexical com linhas de origem, não OpenAPI completo; prefixos/dinâmicas exigem conferir código. Endpoints de referência manual no TXT de contratos.',routes:[...new Map(routes.map(r=>[r.path+'@'+r.source,r])).values()]});
const actions=[];const s=fs.readFileSync('web/collector-v3.js','utf8');for(const [i,line]of s.split('\n').entries())for(const m of line.matchAll(/a==='([^']+)'/g))actions.push({action:m[1],line:i+1,source:'web/collector-v3.js'});json('contratos/acoes-tecnicas.json',{note:'Handlers existentes incluem compatibilidade sem botão visível. Não mostrar ações antigas só por existirem no código.',actions});
console.log(JSON.stringify({out,sourceFiles:copied.length,fields:fields.length,schemaObjects:tables.length}));
