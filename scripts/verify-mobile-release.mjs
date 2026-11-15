// D-115: public/read-only checks. No login, seed, photo or location is submitted.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.argv[2];if(!base)throw Error('Informe o endereço do painel.');
const dir=process.argv[3]||'docs/05-qualidade/evidencias/app-unificado-d115/producao';
const checks=[];
const expected=[['/app',200],['/mobile-app.js',200],['/mobile-app.css',200],['/collector-app.js',200],['/api/mobile/me',401],['/api/mobile/units',401],['/api/collector/capabilities',401],['/app/coleta',302],['/app/coleta/v3',302],['/app/coleta/v2',302],['/app/coleta/visita',302],['/collector-v3.js',302],['/tecnico?app=1',200],['/tecnico/SEMED-Tecnico.apk',200]];
const manifest=await readFile('android/technician/AndroidManifest.xml','utf8');
const version=manifest.match(/android:versionName="([0-9.]+)"/)?.[1];assert.ok(version,'Versão Android no manifesto');
const release=JSON.parse(await readFile(`private-data/releases/SEMED-Tecnico-${version}.json`,'utf8'));
const hash=data=>createHash('sha256').update(data).digest('hex');
for(const [path,status] of expected){
 const r=await fetch(new URL(path,base),{redirect:'manual',signal:AbortSignal.timeout(20000)});
 assert.equal(r.status,status,path);
 if(path.startsWith('/app/coleta'))assert.equal(r.headers.get('location'),'/app',path);
 if(path==='/collector-v3.js')assert.equal(r.headers.get('location'),'/login');
 if(path==='/app'){
  assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.match(await r.text(),/mobile-app\.js/);
 }
 if(path.endsWith('.js')&&status===200||path.endsWith('.css'))assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(await readFile('dist/painel'+path)),path+' igual ao build');
 if(path==='/tecnico?app=1'){
  assert.equal(r.headers.get('x-frame-options'),'SAMEORIGIN');
  assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'self'/);
 }
 if(path.endsWith('.apk')){
  assert.match(r.headers.get('content-type'),/android.package-archive/);
  const bytes=Buffer.from(await r.arrayBuffer());assert.equal(hash(bytes),release.sha256);
  assert.equal(bytes.length,release.bytes);
 }
 checks.push({path,status:r.status});
}
await mkdir(dir,{recursive:true});
await writeFile(dir+'/mobile-release.json',JSON.stringify({status:'PASS',at:new Date().toISOString(),base,version,apkSha256:release.sha256,checks,noOfficialRecordsWritten:true},null,2));
console.log(JSON.stringify({status:'PASS',checks:checks.length,version,apkSha256:release.sha256}));
