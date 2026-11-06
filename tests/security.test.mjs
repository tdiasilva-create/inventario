import test from 'node:test';
import assert from 'node:assert/strict';
import {canManage,canView,equal,hashPassword,validatePassword,encode} from '../server/security.mjs';
test('admin não concede root/admin; leitura e coleta não administram',()=>{
 for(const role of ['root','admin'])assert.equal(canManage('admin',role),false);
 for(const actor of ['operador','visualizador'])for(const role of ['root','admin','operador','visualizador'])assert.equal(canManage(actor,role),false);
 assert.equal(canManage('root','admin'),true);assert.equal(canView('operador'),false);assert.equal(canView('visualizador'),true);
});
test('sal e segredo de servidor mudam o hash',async()=>{
 const a=await hashPassword('frase de teste extensa','sal-a','segredo-a');
 assert.equal(a.length,64);assert.equal(await hashPassword('frase de teste extensa','sal-a','segredo-a'),a);
 assert.notEqual(await hashPassword('frase de teste extensa','sal-b','segredo-a'),a);
 assert.notEqual(await hashPassword('frase de teste extensa','sal-a','segredo-b'),a);
 assert.equal(equal(a,a),true);assert.equal(equal(a,'f'.repeat(64)),false);
});
test('política recusa senha curta, comprometida e falha de verificação',async()=>{
 assert.match(await validatePassword('curta'),/12/);const original=globalThis.fetch;
 try{
  const password='senha-comprometida-para-teste';
  const sha=encode(await crypto.subtle.digest('SHA-1',new TextEncoder().encode(password))).toUpperCase();
  globalThis.fetch=async url=>{assert.ok(url.endsWith(sha.slice(0,5)));assert.equal(url.includes(password),false);return new Response(sha.slice(5)+':10\r\n');};
  assert.match(await validatePassword(password),/vazamentos/);
  globalThis.fetch=async()=>{throw Error('offline');};assert.match(await validatePassword(password),/Não foi possível/);
 }finally{globalThis.fetch=original;}
});
