import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {coordinatesForUnit,geolocatedUnits} from '../web/map-geography.js';
import {sampleUnits} from '../web/desktop-data.js';
test('posições ilustrativas x/y nunca viram coordenadas no mapa real',()=>assert.deepEqual(geolocatedUnits(sampleUnits),[]));
test('aceita coordenadas explícitas e rejeita ausência, infinito, zero e limites inválidos',()=>{
 assert.deepEqual(coordinatesForUnit({latitude:'-2,5451',longitude:-44.1646}),[-2.5451,-44.1646]);
 for(const unit of [{},{latitude:'',longitude:2},{latitude:0,longitude:0},{latitude:91,longitude:-44},{latitude:-2,longitude:-181},{latitude:Infinity,longitude:-44},{latitude:-2,longitude:-44,coordenadaValida:false}])assert.equal(coordinatesForUnit(unit),null);
});
test('geometria extraída contém apenas os dados cartográficos permitidos',async()=>{
 const geo=JSON.parse(await readFile('web/data/map-v33.json','utf8'));
 assert.deepEqual(Object.keys(geo).sort(),['source','sourceSha256','label','municipality','center','initialZoom','ring','schools'].sort());
 assert.equal(geo.ring.length,159);assert.deepEqual(geo.ring[0],geo.ring.at(-1));assert.equal(geo.schools.length,0);assert.equal(geo.source,'MAPA-SEMED-V33.html');
 assert.deepEqual(geo.center,[-2.5451,-44.1646]);
});
