// Extract only the embedded Leaflet runtime, its CSS, and numeric map geometry.
// Never execute the supplied application or copy its operational datasets.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=process.argv[2];
if(!source)throw new Error('Informe o caminho local do HTML V33.');
const bytes=await readFile(source),html=bytes.toString('utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const vendor=scripts.find(s=>s.includes('t.version="1.9.4"')&&s.includes('t.map=function'));
const css=html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i)?.[1]?.split(/\r?\n:root\s*\{/)[0];
const main=scripts.find(s=>s.includes('const DENS_DATA ='));
if(!vendor||!css?.startsWith('.leaflet-image-layer')||!main)throw new Error('Estrutura cartográfica V33 não reconhecida.');
const ringBlock=main.match(/const DENS_DATA\s*=\s*\{\s*ring:\s*\[([\s\S]*?)\]\s*,?\s*\};/)?.[1];
if(!ringBlock)throw new Error('Contorno não encontrado.');
const ring=[...ringBlock.matchAll(/\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/g)].map(m=>[Number(m[1]),Number(m[2])]);
const lat=Number(main.match(/const CENTER_LAT\s*=\s*(-?[\d.]+)/)?.[1]);
const lng=Number(main.match(/CENTER_LNG\s*=\s*(-?[\d.]+)/)?.[1]);
if(ring.length<3||ring.some(p=>p.some(v=>!Number.isFinite(v)))||!Number.isFinite(lat)||!Number.isFinite(lng))throw new Error('Geometria inválida.');
await mkdir('web/vendor/leaflet',{recursive:true});
await writeFile('web/vendor/leaflet/leaflet.js','/* Leaflet 1.9.4 — see LICENSE.txt in this directory. Extracted from the supplied V33 map. */\n'+vendor.trim()+'\n');
await writeFile('web/vendor/leaflet/leaflet.css','/* Leaflet 1.9.4 — see LICENSE.txt. */\n'+css.trim()+'\n');
await mkdir('web/data',{recursive:true});
const geometry={source:'MAPA-SEMED-V33.html',sourceSha256:createHash('sha256').update(bytes).digest('hex'),label:'Contorno fornecido no V33 — não homologado como limite oficial',municipality:'Paço do Lumiar',center:[lat,lng],initialZoom:Number(main.match(/ZOOM_INICIAL\s*=\s*(\d+)/)?.[1]||12),ring,schools:[]};
await writeFile('web/data/map-v33.json',JSON.stringify(geometry,null,2)+'\n');
console.log(JSON.stringify({leaflet:'1.9.4',boundaryVertices:ring.length,embeddedSchoolCoordinates:0,sourceSha256:geometry.sourceSha256}));
