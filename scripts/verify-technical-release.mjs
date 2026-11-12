// Public/read-only release checks; never creates technicians, tasks or positions.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.argv[2];if(!base)throw Error('Informe o endereço do painel.');
const expectations=[['/tecnico',200],['/technician.js',200],['/technician.css',200],['/tecnico/SEMED-Tecnico.apk',200],['/roteiro-demandas',302],['/api/dispatch/queue',401],['/api/dispatch/map',401],['/api/technician/queue',401],['/api/technician/active',401],['/api/technician/notifications',401]];
const release=JSON.parse(await readFile('private-data/releases/SEMED-Tecnico-1.0.0.json','utf8'));
const checks=await Promise.all(expectations.map(async([path,status])=>{const r=await fetch(new URL(path,base),{redirect:'manual'});assert.equal(r.status,status,path);if(path==='/tecnico'){assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(await r.text(),/technician\.js/);}if(path.endsWith('.apk')){const bytes=Buffer.from(await r.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),release.sha256);assert.match(r.headers.get('content-type'),/android.package-archive/);}return {path,status:r.status};}));
const dir='docs/05-qualidade/evidencias/roteiro-tecnico-2026-11-12';await mkdir(dir,{recursive:true});await writeFile(dir+'/release.json',JSON.stringify({at:new Date().toISOString(),status:'PASS',checks,apkSha256:release.sha256},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length,apkSha256:release.sha256}));
