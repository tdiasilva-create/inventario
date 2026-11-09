import {collectorFixture} from './collector-db.mjs';
import {hashPassword} from '../../server/security.mjs';
import worker from '../../server/worker.mjs';

export const panelOrigin='https://painel.test';
export const collectorOrigin='https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev';
export const temporaryPassword='TESTE ISOLADO senha provisoria 2026!';
export const personalPassword='TESTE ISOLADO frase pessoal 2026!';
export async function authFixture(){
 const f=collectorFixture(),pepper='SEGREDO EXCLUSIVO DOS TESTES',salt='SAL EXCLUSIVO DOS TESTES';
 f.sqlite.prepare('INSERT INTO settings(key,value) VALUES(?,?)').run('session_seconds',3600);
 f.sqlite.prepare('INSERT INTO settings(key,value) VALUES(?,?)').run('temporary_seconds',86400);
 f.sqlite.prepare('UPDATE users SET password_hash=?,salt=?,temporary_expires=?').run(await hashPassword(temporaryPassword,salt,pepper),salt,Date.now()+86400000);
 const env={DB:f.db,AUTH_PEPPER:pepper,ASSETS:{fetch:async request=>new Response(new URL(request.url).pathname)}};
 async function call(kind,path,{data,cookie='',csrf=''}={}){
  const origin=kind==='collector'?collectorOrigin:panelOrigin,headers={Cookie:cookie};
  if(data){headers.Origin=origin;headers['Content-Type']='application/json';headers['X-CSRF-Token']=csrf;}
  const response=await worker.fetch(new Request(origin+path,{method:data?'POST':'GET',headers,...(data?{body:JSON.stringify(data)}:{})}),{...env,APP_KIND:kind});
  return {response,status:response.status,data:await response.clone().json().catch(()=>null),cookie:response.headers.get('Set-Cookie')?.split(';')[0]};
 }
 async function login(kind,username,password){const r=await call(kind,'/api/auth/login',{data:{username,password}});if(r.cookie){const me=await call(kind,'/api/auth/me',{cookie:r.cookie});r.csrf=me.data?.csrf;}return r;}
 return {...f,env,call,login};
}
