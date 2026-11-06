import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,equipmentErrors,photoError,completionErrors,groups} from '../web/domain.js';
const valid={environment:'Ambiente DEMO',asset:'00001',serial:'Sem número de série',brand:'Não identificado',model:'Não identificado',condition:'Bom',operation:'Funcionando',use:'Em uso'};
test('CPU e fotos opcionais não bloqueiam ficha individual',()=>assert.deepEqual(equipmentErrors(valid),[]));
test('falha exige problema, ação e prioridade',()=>{assert.equal(equipmentErrors({...valid,operation:'Não funciona'}).length,2);assert.deepEqual(equipmentErrors({...valid,operation:'Não funciona',problem:'Problema não identificado',action:'Avaliação técnica',priority:'Média'}),[]);});
test('zero inicial é preservado e ambiente exigido',()=>{assert.equal(valid.asset,'00001');assert.ok(equipmentErrors({...valid,environment:''}).length);});
test('fotos têm limite de cinco e rejeitam outras mídias',()=>{assert.equal(photoError([],0),'');assert.equal(photoError([{type:'image/png'}],4),'');assert.ok(photoError([{type:'image/png'}],5));assert.ok(photoError([{type:'video/mp4'}],0));assert.ok(photoError([{type:'application/pdf'}],0));});
test('oito cartões independentes e escopo incompleto não pode ser concluído',()=>{const d=createDraft();assert.equal(groups.length,8);assert.deepEqual(completionErrors('A',d),[]);for(const id of 'BCDEFGH')assert.ok(completionErrors(id,d).length);assert.ok(Object.values(d.sections).every(s=>s==='Pendente'));});
