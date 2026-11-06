import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {random,hashPassword} from '../server/security.mjs';
if(process.argv[2]!=='--confirm-root-recovery'){console.log('Recuperação emergencial: node scripts/recover-root.mjs --confirm-root-recovery\nExige Cloudflare autenticada e segredo privado local. Invalida senha/sessões root.');process.exit(0);}
const config=JSON.parse((await readFile('wrangler.jsonc','utf8')).replace(/^\uFEFF/,'').replace(/^\s*\/\/.*$/gm,''));
if(config.name!=='painel-semed-paco'||config.account_id!=='ce059c2b3e50037922a441a66814090d'||config.d1_databases[0].database_id!=='acb9a3dc-f667-44cf-a4f3-127641860f3e')throw Error('Destino inesperado.');
const pepper=JSON.parse(await readFile('private-data/production-auth-secrets.json','utf8')).AUTH_PEPPER;
const args=['node_modules/wrangler/bin/wrangler.js','d1','execute','semed-inventario-auth','--remote'];
const rows=JSON.parse(execFileSync(process.execPath,[...args,'--command',"SELECT id FROM users WHERE username='root' AND role='root'; SELECT value FROM settings WHERE key='temporary_seconds';",'--json'],{encoding:'utf8'}));
const id=rows[0].results[0]?.id,seconds=rows[1].results[0]?.value;if(!id||!/^[a-f0-9-]{36}$/.test(id)||!seconds)throw Error('Conta root ou configuração ausente.');
const password=random(),salt=random(),now=Date.now();
await writeFile('private-data/root-recovery.sql',`UPDATE users SET password_hash='${await hashPassword(password,salt,pepper)}',salt='${salt}',must_change=1,active=1,temporary_expires=${now+seconds*1000},credential_version=credential_version+1 WHERE id='${id}'; DELETE FROM sessions WHERE user_id='${id}'; INSERT INTO audit(user_id,event,created_at) VALUES('${id}','root_recovery',${now});`);
execFileSync(process.execPath,[...args,'--file','private-data/root-recovery.sql'],{stdio:'ignore'});
await writeFile('private-data/RECUPERACAO_ROOT.txt','Conta: root\nSenha provisória: '+password+'\nTroca obrigatória. Validade até '+new Date(now+seconds*1000).toLocaleString('pt-BR',{timeZone:'America/Fortaleza'})+' (Fortaleza).\n');
console.log('Root recuperado. Credencial entregue somente em private-data/RECUPERACAO_ROOT.txt.');
