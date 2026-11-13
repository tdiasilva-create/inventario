// Inspeção somente leitura. Nunca imprime o conteúdo de uma possível credencial.
import {execFileSync, spawnSync} from 'node:child_process';
const base=process.argv[2]||'origin/main';
execFileSync('git',['rev-parse','--verify',base],{stdio:'pipe'});
const lines=execFileSync('git',['rev-list','--objects',`${base}..HEAD`],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const paths=new Map(lines.map(line=>{const i=line.indexOf(' ');return[i<0?line:line.slice(0,i),i<0?'':line.slice(i+1)];}));
const input=[...paths.keys()].join('\n')+'\n';
if(!lines.length){console.log(JSON.stringify({passed:true,base,objects:0}));process.exit(0);}
const result=spawnSync('git',['cat-file','--batch'],{input,encoding:null,maxBuffer:256*1024*1024});
if(result.status!==0)throw Error('Falha ao ler objetos Git para a conferência.');
const forbidden=/(^|\/)(private-data|backups|exports-reais|node_modules|\.wrangler)(\/|$)|(^|\/)\.dev\.vars(?!\.example$)|(^|\/)\.env(?!\.example$)|\.(exe|msi|zip|sqlite3?|db|pem|pfx|p12|key|har|trace|keystore)$/i;
const rules=[['chave privada',/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],['Google OAuth secret',/GOCSPX-[A-Za-z0-9_-]{20,}/],['Google refresh token',/1\/\/[A-Za-z0-9_-]{50,}/],['GitHub token',/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/],['JWT serializado',/eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/]];
let offset=0,blobs=0;const errors=[];
while(offset<result.stdout.length){
 const end=result.stdout.indexOf(10,offset);if(end<0)break;
 const [id,type,length]=result.stdout.subarray(offset,end).toString().split(' '),size=Number(length);
 if(!Number.isFinite(size))throw Error('Objeto Git incompleto.');
 const body=result.stdout.subarray(end+1,end+1+size);offset=end+size+2;
 if(type!=='blob')continue;blobs++;const file=paths.get(id)||'(sem caminho)';
 if(forbidden.test(file)||/(^|\/)(client_secret[^/]*|[^/]*credentials[^/]*|[^/]*secrets[^/]*)\.json$/i.test(file))errors.push({id,file,reason:'caminho privado'});
 if(!/\.(mjs|cjs|js|jsonc?|sql|md|txt|ya?ml|html|css|csv|java|xml)$|\.example$/.test(file))continue;
 const source=body.toString('utf8');for(const [reason,re]of rules)if(re.test(source))errors.push({id,file,reason});
}
console.log(JSON.stringify({passed:!errors.length,base,objects:lines.length,blobs,errors,scope:'Assinaturas conhecidas e caminhos privados em versões de arquivos ainda não publicadas; complementar com revisão humana.'},null,2));
if(errors.length)process.exitCode=1;
