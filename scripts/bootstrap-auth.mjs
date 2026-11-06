import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {random,hashPassword} from '../server/security.mjs';
const local=process.argv.includes('--local');await mkdir('private-data',{recursive:true});
if(!local){try{await readFile('private-data/initial-credentials.json');throw Error('Credenciais de produção já existem; não sobrescrever.');}catch(e){if(e.code!=='ENOENT')throw e;}}
const secretPath=local?'private-data/auth-secrets.json':'private-data/production-auth-secrets.json';let secrets;try{secrets=JSON.parse(await readFile(secretPath,'utf8'));}catch{secrets={AUTH_PEPPER:random()};await writeFile(secretPath,JSON.stringify(secrets));}
if(local)await writeFile('.dev.vars','AUTH_PEPPER='+secrets.AUTH_PEPPER+'\n');
const stamp=Date.now(),users=[];let sql=local?'DELETE FROM sessions; DELETE FROM audit; DELETE FROM attempts; DELETE FROM users; DELETE FROM settings;\n':'';
for(const role of ['root','admin','operador','visualizador']){const password=random(),salt=random(),hash=await hashPassword(password,salt,secrets.AUTH_PEPPER);users.push({username:role,password});sql+=`INSERT INTO users(id,username,role,password_hash,salt,temporary_expires,created_at) VALUES('${crypto.randomUUID()}','${role}','${role}','${hash}','${salt}',${stamp+86400000},${stamp});\n`;}
sql+="INSERT INTO settings(key,value) VALUES('session_seconds',3600),('temporary_seconds',86400);\n";
await writeFile('private-data/'+(local?'local-seed':'production-seed')+'.sql',sql);await writeFile('private-data/'+(local?'local-credentials.json':'initial-credentials.json'),JSON.stringify(users));
if(!local)await writeFile('private-data/ACESSOS_INICIAIS_SEMED.txt','ACESSOS INICIAIS — SEMED\nEntregue cada credencial somente ao responsável correspondente. Troca obrigatória no primeiro acesso. Não compartilhar contas.\nURL: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login\n\n'+users.map(u=>u.username+'\nSenha provisória: '+u.password+'\n').join('\n'));
console.log(local?'Credenciais de teste local geradas (valores omitidos).':'Credenciais iniciais geradas no diretório privado (valores omitidos).');

