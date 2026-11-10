import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolsPresence} from '../web/school-presence.js';

test('D-083 conta escolas distintas, não computadores, e respeita tipo, situação e filtro',()=>{
 const units=[
  {id:'a',unit_type:'Escola municipal',active:1},
  {id:'b',unit_type:'Escola municipal militar',active:1},
  {id:'c',unit_type:'Creche municipal',active:1},
  {id:'d',unit_type:'Unidade administrativa',active:1},
  {id:'e',unit_type:'Escola municipal',active:0},
  {id:'f',unit_type:'Núcleo tecnológico',active:1},
  {id:'g',unit_type:'Obra em andamento',active:1},
  {id:'h',unit_type:'Escola conveniada',active:1}
 ];
 const fleet={units:units.map((u,i)=>({id:u.id,online:i===1?0:20}))};
 assert.deepEqual(schoolsPresence([...units,units[0]],fleet),{online:2,offline:1,schools:[{id:'a',state:'online'},{id:'b',state:'offline'},{id:'c',state:'online'}]});
 assert.equal(schoolsPresence([units[0]],fleet).online,1);
 assert.equal(schoolsPresence([units[3]],fleet).online,0);
});

test('D-083 nenhuma comunicação inclui escola sem agente; leitura inválida não significa offline',()=>{
 const units=[{id:'a',unit_type:'Escola municipal',active:true}];
 assert.equal(schoolsPresence(units,{units:[{id:'a',online:0,computers:0}]}).offline,1);
 for(const fleet of [null,{}, {units:[]},{units:[{id:'a',online:null}]},{units:[{id:'a',online:-1}]},{units:[{id:'a',online:'2'}]},{units:[{id:'a',online:1},{id:'a',online:1}]}])assert.throws(()=>schoolsPresence(units,fleet));
 assert.deepEqual(schoolsPresence([],{units:[]}),{online:0,offline:0,schools:[]});
});
