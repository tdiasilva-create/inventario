import test from 'node:test';import assert from 'node:assert/strict';
import {sections,validateFields,sectionStages,sectionProblems} from '../web/collector-schema.js';
import {contextualErrors,issueStep} from '../web/collector-errors.js';
import {routeFromLocation,routeUrl} from '../web/collector-navigation.js';
import {collectorFixture} from './helpers/collector-db.mjs';import {collectorRoutes} from '../server/collector.mjs';
const context={environments:[],hasProblems:true};
export const network={wired:'Sim',wifi:'Sim',coverageDescription:'Salas do corredor',quality:'Adequada',routers:'Sim',routersDetails:[{quantity:2,environmentDescription:'Recepção',condition:'Bom'}],aps:'Não',switches:'Sim',switchesDetails:[{quantity:1,environmentDescription:'Sala técnica',condition:'Regular'}],racks:'Não',cables:'Adequada',damaged:'Não'};
test('rede, energia e demandas aceitam descrição sem cadastro B, mantendo campos necessários',()=>{
 assert.deepEqual(validateFields(sections.D,network,context),{});
 assert.ok(sectionStages('D',network,context).length<=8);
 assert.ok(validateFields(sections.D,{...network,routersDetails:[{quantity:2,environment:'inventado',condition:'Bom'}]},context)['routersDetails.0.environmentDescription']);
 assert.deepEqual(validateFields(sections.E,{outlets:'Parcialmente',affectedDescription:'Corredor',irregular:'Não',protected:'Sim',protections:[{type:'Nobreak',quantity:1,environmentDescription:'Recepção',condition:'Bom'}],waiting:'Não',specialist:'Não'},context),{});
 assert.deepEqual(validateFields(sections.H,{impact:'Prejudica parcialmente',affectedDescription:'Recepção',lack:'Sim',needs:[{environmentDescription:'Recepção',type:'Notebook',quantity:1,justification:'Atendimento',priority:'Média',origin:'Constatada pelo coletor'}]},context),{});
});
test('pendências identificam equipamento, registro e etapa correta',()=>{
 const fields=validateFields(sections.D,{...network,routersDetails:[{quantity:1,condition:'Bom'},{quantity:2}]},context),messages=contextualErrors('D',fields,network,context);
 assert.match(messages['routersDetails.1.condition'],/Roteadores.*Registro 2.*Conservação/);
 assert.equal(issueStep('D','routersDetails.1.condition',network,context),2);
 assert.ok(Object.values(messages).every(s=>!s.includes('Informe há')));
});
test('URL guarda apenas identificação e posição, restaura etapa/revisão',()=>{
 const route={inspectionId:crypto.randomUUID(),view:'group',group:'D',step:2,returnReview:true};const url=routeUrl(route,'https://test/?senha=proibida');
 assert.equal(url.includes('senha'),false);assert.deepEqual(routeFromLocation({href:'https://test'+url}),route);
 assert.deepEqual(routeFromLocation({href:'https://test/?vistoria=invalida'}),{view:'units'});
});
test('respostas antigas de ramos ocultos não criam falhas indevidas',()=>{
 assert.equal(sectionProblems('C',{exists:'Não',works:'Não',stability:'Instável',uncovered:'Não'}),false);
 assert.equal(sectionProblems('D',{wifi:'Não',quality:'Insuficiente',cables:'Adequada',damaged:'Não'}),false);
});
test('navegar/salvar sem alterar não modifica estado, versão ou histórico',async()=>{
 const f=collectorFixture();const post=async(path,data)=>{const r=new Request('http://test/api/collector/'+path,{method:'POST',body:JSON.stringify(data)});return collectorRoutes(r,new URL(r.url),f.operator,{DB:f.db},f.helpers);};
 try{const {inspection}=await(await post('start',{unitId:f.ids.pending})).json();
 for(let n=0;n<3;n++){const r=await post('section-save',{inspectionId:inspection.id,section:'E',version:1,answers:{}});assert.equal(r.status,200);assert.equal((await r.json()).unchanged,true);}
 const row=f.sqlite.prepare("SELECT * FROM inspection_sections WHERE inspection_id=? AND section='E'").get(inspection.id);assert.equal(row.state,'Pendente');assert.equal(row.version,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM collection_history').get().n,0);
 const r=await post('section-save',{inspectionId:inspection.id,section:'D',version:1,answers:network,complete:true});assert.equal(r.status,200,await r.text());
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM environments').get().n,0);
 const request=new Request('http://test/api/collector/review?id='+inspection.id),review=await(await collectorRoutes(request,new URL(request.url),f.operator,{DB:f.db},f.helpers)).json();assert.equal(review.errors.D,undefined);assert.ok(review.details.E.outlets);assert.match(review.details.E.outlets,/E ·/);
 }finally{f.sqlite.close();}
});
