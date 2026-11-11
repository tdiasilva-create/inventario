import test from 'node:test';
import assert from 'node:assert/strict';
import {canManage,canView,equal,hashPassword,validatePassword} from '../server/security.mjs';
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
test('D-096 aceita 6 a 256 caracteres sem composição ou serviço externo',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('Serviço externo não deve ser chamado');});
 for(const value of [undefined,null,123456,'','12345','a'.repeat(257)])assert.match(await validatePassword(value),/6 e 256/);
 for(const value of ['123456','abcdef','!!!!!!',' abcd ','a'.repeat(256),'senha comum aceita'])assert.equal(await validatePassword(value),null);
 assert.equal(calls,0);
});
