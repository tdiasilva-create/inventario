// Public/read-only release checks; never creates technicians, tasks or positions.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.argv[2];if(!base)throw Error('Informe o endereço do painel.');
const expectations=[['/tecnico',200],['/technician.js',200],['/technician.css',200],['/tecnico/SEMED-Tecnico.apk',200],['/roteiro-demandas',302],['/api/dispatch/queue',401],['/api/dispatch/map',401],['/api/technician/queue',401],['/api/technician/active',401],['/api/technician/notifications',401],['/api/technician/request?id=00000000-0000-4000-8000-000000000001',401]];
const manifest=await readFile('android/technician/AndroidManifest.xml','utf8'),version=manifest.match(/android:versionName="([0-9.]+)"/)?.[1];
assert.ok(version,'Versão Android no manifesto');
const release=JSON.parse(await readFile(`private-data/releases/SEMED-Tecnico-${version}.json`,'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const checks=await Promise.all(expectations.map(async([path,status])=>{const r=await fetch(new URL(path,base),{redirect:'manual',signal:AbortSignal.timeout(20000)});assert.equal(r.status,status,path);if(path==='/tecnico'){assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'self'/);assert.match(await r.text(),/technician\.js/);}if(path.endsWith('.apk')){const bytes=Buffer.from(await r.arrayBuffer());assert.equal(hash(bytes),release.sha256);assert.match(r.headers.get('content-type'),/android.package-archive/);}if(['/technician.js','/technician.css'].includes(path))assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(await readFile('dist/painel'+path)),path+' publicado igual ao build');return {path,status:r.status};}));
const dir=process.argv[3]||'docs/05-qualidade/evidencias/app-tecnico-d113-2026-11-13/producao';await mkdir(dir,{recursive:true});await writeFile(dir+'/release.json',JSON.stringify({at:new Date().toISOString(),status:'PASS',version,checks,apkSha256:release.sha256},null,2));console.log(JSON.stringify({status:'PASS',version,checks:checks.length,apkSha256:release.sha256}));
