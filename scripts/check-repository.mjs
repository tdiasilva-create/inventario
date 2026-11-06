// Examina somente arquivos rastreados/staged. Nunca imprime valores encontrados.
import {execFileSync} from 'node:child_process';
const paths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
if(!paths.length)throw Error('Não há arquivos no índice Git para conferir.');
const errors=[];
const forbidden=/(^|\/)(private-data|backups|exports-reais|node_modules|\.wrangler|revisoes|entregas)(\/|$)|(^|\/)\.dev\.vars(?!\.example$)|(^|\/)\.env(?!\.example$)|\.(exe|msi|zip|sqlite3?|db|pem|pfx|p12|key|har|trace)$/i;
const rules=[
 ['chave privada',/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
 ['Google OAuth secret',/GOCSPX-[A-Za-z0-9_-]{20,}/],
 ['Google refresh token',/1\/\/[A-Za-z0-9_-]{50,}/],
 ['GitHub token',/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/],
 ['JWT serializado',/eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/]
];
for(const file of paths){
 if(forbidden.test(file)||/(^|\/)(client_secret[^/]*|[^/]*credentials[^/]*|[^/]*secrets[^/]*)\.json$/i.test(file))errors.push({file,reason:'arquivo privado/binário não permitido'});
 if(!/\.(mjs|cjs|js|jsonc?|sql|md|txt|ya?ml|html|css|csv)$|(^|\/)\.dev\.vars\.example$/.test(file))continue;
 const source=execFileSync('git',['show',':'+file],{maxBuffer:16*1024*1024}).toString('utf8');
 for(const [label,pattern]of rules)if(pattern.test(source))errors.push({file,reason:label});
}
if(errors.length){console.error(JSON.stringify({passed:false,errors},null,2));process.exitCode=1;}
else console.log(JSON.stringify({passed:true,files:paths.length,scope:'Índice Git: caminhos privados e assinaturas conhecidas de segredos. Não substitui revisão humana.'}));
