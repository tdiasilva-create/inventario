import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {random} from '../server/security.mjs';
const base=process.argv[2]||'https://127.0.0.1:4182';
const local=base.includes('127.0.0.1')||new URL(base).hostname==='painel-semed-paco-validacao.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev';
const credentials=JSON.parse(await readFile(local?'private-data/local-credentials.json':'private-data/initial-credentials.json','utf8'));
const require=createRequire(import.meta.url);const {chromium,request:pwRequest}=require('C:/Users/SIGAE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const apiOnly=process.env.AUTH_API_ONLY==='1';const browser=apiOnly?{newContext:async()=>{const r=await pwRequest.newContext({ignoreHTTPSErrors:true});return {request:r,cookies:async()=>(await r.storageState()).cookies,close:()=>r.dispose()};},close:async()=>{}}:await chromium.launch({channel:'chrome',headless:true});const checks=[];
async function post(context,path,data,csrf){return context.request.post(base+path,{headers:{Origin:base,'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{})},data});}
try{
 const anonymous=await browser.newContext({ignoreHTTPSErrors:true});for(const path of ['/','/index.html','/desktop.js','/data/map-examples.json','/assets/referencia-visual.png']){const r=await anonymous.request.get(base+path,{maxRedirects:0});assert.equal(r.status(),302,path);}assert.equal((await anonymous.request.get(base+'/api/auth/me')).status(),401);checks.push('anonymous blocked: HTML, JS, data, photos and API');
 assert.equal((await anonymous.request.post(base+'/api/auth/login',{headers:{Origin:'https://evil.example','Content-Type':'application/json'},data:{}})).status(),403);checks.push('cross-origin POST denied');await anonymous.close();
 const contexts={};
 for(const item of credentials){const context=await browser.newContext({ignoreHTTPSErrors:true});contexts[item.username]=context;const response=await post(context,'/api/auth/login',item);assert.equal(response.status(),200,'login '+item.username);const me=await (await context.request.get(base+'/api/auth/me')).json();assert.equal(me.role,item.username);assert.equal(me.mustChange,true);const cookies=await context.cookies();assert.equal(cookies[0].httpOnly,true);assert.equal(cookies[0].secure,true);assert.equal(cookies[0].sameSite,'Strict');assert.equal((await context.request.get(base+'/',{maxRedirects:0})).headers().location,'/conta');assert.equal((await context.request.get(base+'/api/admin/users')).status(),403);
 if(local){const password=random();const result=await post(context,'/api/auth/password',{currentPassword:item.password,password},me.csrf);assert.equal(result.status(),200,'change password '+item.username+': '+await result.text());const after=await context.request.get(base+'/api/auth/me');assert.equal(after.status(),401);const login=await post(context,'/api/auth/login',{username:item.username,password});assert.equal(login.status(),200);item.newPassword=password;}
 checks.push('valid login, role, secure cookie, first access required: '+item.username);
 }
 if(local){
 for(const item of credentials){const context=contexts[item.username],me=await (await context.request.get(base+'/api/auth/me')).json();assert.equal(me.mustChange,false);const root=await context.request.get(base+'/',{maxRedirects:0});assert.equal(root.status(),item.username==='operador'?302:200);const users=await context.request.get(base+'/api/admin/users');assert.equal(users.status(),['root','admin'].includes(item.username)?200:403);if(item.username==='admin')assert.ok((await users.json()).users.every(x=>['operador','visualizador'].includes(x.role)));assert.equal((await post(context,'/api/auth/logout',{},'wrong')).status(),403);}
 const context=contexts.root,me=await (await context.request.get(base+'/api/auth/me')).json();const users=(await (await context.request.get(base+'/api/admin/users')).json()).users;const visual=users.find(x=>x.username==='visualizador');assert.equal((await post(context,'/api/admin/revoke',{id:visual.id},me.csrf)).status(),200);assert.equal((await contexts.visualizador.request.get(base+'/api/auth/me')).status(),401);checks.push('server roles, operator separation, admin scope, CSRF, revoke');
  const admin=contexts.admin,adminMe=await (await admin.request.get(base+'/api/auth/me')).json();
 assert.equal((await post(admin,'/api/admin/create',{username:'forbidden.root',role:'root'},adminMe.csrf)).status(),403);
 assert.equal((await post(admin,'/api/admin/reset',{id:users.find(x=>x.username==='root').id},adminMe.csrf)).status(),403);
 assert.equal((await post(context,'/api/admin/status',{id:users.find(x=>x.username==='root').id,active:false},me.csrf)).status(),403);
 const created=await post(context,'/api/admin/create',{username:'teste.fluxo',role:'operador'},me.csrf);assert.equal(created.status(),201);const createdPassword=(await created.json()).temporaryPassword;
 const createdUsers=(await (await context.request.get(base+'/api/admin/users')).json()).users;const createdUser=createdUsers.find(x=>x.username==='teste.fluxo');assert.ok(createdUser);
 assert.equal((await post(context,'/api/admin/status',{id:createdUser.id,active:false},me.csrf)).status(),200);
 assert.equal((await post(context,'/api/admin/status',{id:createdUser.id,active:true},me.csrf)).status(),200);
 const createdContext=await browser.newContext({ignoreHTTPSErrors:true});assert.equal((await post(createdContext,'/api/auth/login',{username:'teste.fluxo',password:createdPassword})).status(),200);
 const reset=await post(context,'/api/admin/reset',{id:createdUser.id},me.csrf);assert.equal(reset.status(),200);assert.equal((await createdContext.request.get(base+'/api/auth/me')).status(),401);const resetPassword=(await reset.json()).temporaryPassword;
 assert.equal((await post(createdContext,'/api/auth/login',{username:'teste.fluxo',password:resetPassword})).status(),200);await createdContext.close();
 assert.equal((await context.request.get(base+'/api/admin/audit')).status(),200);assert.equal((await admin.request.get(base+'/api/admin/audit')).status(),403);
 assert.equal((await post(context,'/api/admin/settings',{session_seconds:3600,temporary_seconds:86400},me.csrf)).status(),200);
 checks.push('create, activate/deactivate, reset invalidates sessions, admin escalation denied, self-disable denied, root settings/audit');
 if(!apiOnly){const page=await context.newPage();await page.goto(base+'/');await page.locator('#municipal-map[data-map-ready="true"]').waitFor();await mkdir('docs/05-qualidade/evidencias/auth',{recursive:true});await page.screenshot({path:'docs/05-qualidade/evidencias/auth/local-dashboard.png',fullPage:true});await page.goto(base+'/conta');await page.getByText('root • root',{exact:true}).waitFor();await page.screenshot({path:'docs/05-qualidade/evidencias/auth/local-account.png',fullPage:true});}const sessions=(await (await context.request.get(base+'/api/auth/sessions')).json()).sessions;assert.ok(sessions.length);await post(context,'/api/auth/logout',{},me.csrf);assert.equal((await context.request.get(base+'/api/auth/me')).status(),401);checks.push(apiOnly?'session listing and logout via real API':'browser dashboard/account, session listing, logout');
 }else{if(!apiOnly){const page=await contexts.root.newPage();await page.goto(base+'/conta');await page.getByText('root • root',{exact:true}).waitFor();await mkdir('docs/05-qualidade/evidencias/auth',{recursive:true});await page.screenshot({path:'docs/05-qualidade/evidencias/auth/public-first-access.png',fullPage:true});}for(const context of Object.values(contexts)){const me=await (await context.request.get(base+'/api/auth/me')).json();await post(context,'/api/auth/logout',{},me.csrf);}checks.push(apiOnly?'all public sessions logged out; temporary passwords unchanged':'public first-access screenshot, all test sessions logged out; temporary passwords unchanged');}
 await mkdir('docs/05-qualidade/evidencias/auth',{recursive:true});await writeFile('docs/05-qualidade/evidencias/auth/'+(local?'local':'public')+'-result.json',JSON.stringify({status:'PASS',checks},null,2));console.log(JSON.stringify({status:'PASS',checks}));
}catch(e){console.error(String(e.message).replace(/__Host-semed=[a-f0-9]+/g,'[cookie omitido]'));process.exitCode=1;}finally{await browser.close();}




