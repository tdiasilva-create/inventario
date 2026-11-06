import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {parseCsv} from '../scripts/lib/csv.mjs';
test('CSV preserva vírgula decimal e campos entre aspas',()=>assert.deepEqual(parseCsv('NOME,LAT\r\n"Local, A","-2,54"\r\n'),[{NOME:'Local, A',LAT:'-2,54'}]));
test('mapa limpo não possui unidades ou coordenadas de locais',async()=>{const data=JSON.parse(await readFile('web/data/map-examples.json','utf8'));assert.deepEqual(data.records,[]);assert.equal(data.sourceUrl,undefined);});
