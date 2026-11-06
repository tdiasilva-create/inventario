import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {random,hashPassword,digest} from '../server/security.mjs';
const base='https://painel-semed-paco-validacao.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev';
const pepper=JSON.parse(await readFile('private-data/auth-secrets.json','utf8')).AUTH_PEPPER;
const password=random(),salt=random(),token=random(),id=crypto.randomUUID(),hash=await hashPassword(password,salt,pepper),now=Date.now();
await writeFile('private-data/boundaries.sql',`INSERT INTO users(id,username,role,password_hash,salt,temporary_expires,created_at) VALUES('${id}','teste.expirado','visualizador','${hash}','${salt}',${now-60000},${now}); INSERT INTO sessions(token_hash,user_id,csrf,expires_at,created_at) VALUES('${await digest(token)}','${id}','${random()}',${now-1000},${now-10000});`);
execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','semed-auth-validacao','--remote','--config','wrangler.validation.jsonc','--file','private-data/boundaries.sql'],{stdio:'ignore'});
const require=createRequire(import.meta.url),{request}=require('C:/Users/SIGAE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const context=await request.newContext();
try{assert.equal((await context.get(base+'/api/auth/me',{headers:{Cookie:'__Host-semed='+token}})).status(),401);const post=data=>context.post(base+'/api/auth/login',{headers:{Origin:base,'Content-Type':'application/json'},data});const expired=await post({username:'teste.expirado',password});assert.equal(expired.status(),401);const unknown=await post({username:'teste.desconhecido',password});assert.equal(unknown.status(),401);assert.deepEqual(await expired.json(),await unknown.json());const blocked=await post({username:'teste.desconhecido',password});assert.equal(blocked.status(),429);await writeFile('docs/05-qualidade/evidencias/auth/boundaries.json',JSON.stringify({status:'PASS',checks:['expired session rejected','expired temporary credential rejected','unknown/expired account same message','progressive attempt block enforced']},null,2));console.log('PASS: expiração, credencial provisória, mensagem genérica e bloqueio progressivo.');}finally{await context.dispose();}
