// Local Android tools only. Signing material stays under ignored private-data/.
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,copyFileSync,rmSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';import {execFileSync} from 'node:child_process';import {randomBytes,createHash} from 'node:crypto';
const root=resolve('.'),tool=resolve('private-data/android-toolchain'),source=resolve('android/technician'),out=resolve('private-data/android-build');
if(!out.startsWith(root+sep+'private-data'+sep)||out===root)throw Error('Invalid build output');
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
const jdk=join(tool,'jdk',readdirSync(join(tool,'jdk'))[0],'bin'),platform=join(tool,'platform',readdirSync(join(tool,'platform'))[0],'android.jar'),build=join(tool,'tools',readdirSync(join(tool,'tools'))[0]);
const signing=resolve('private-data/android-signing');mkdirSync(signing,{recursive:true});
const config=join(signing,'config.json');if(!existsSync(config))writeFileSync(config,JSON.stringify({password:randomBytes(32).toString('hex'),alias:'semed-tecnico'}));
const secret=JSON.parse(readFileSync(config)),env={...process.env,SEMED_ANDROID_STOREPASS:secret.password};
const run=(cmd,args)=>execFileSync(cmd,args,{cwd:out,env,stdio:'pipe'});
const key=join(signing,'semed-tecnico.keystore');
if(!existsSync(key))run(join(jdk,'keytool.exe'),['-genkeypair','-keystore',key,'-storepass:env','SEMED_ANDROID_STOREPASS','-keypass:env','SEMED_ANDROID_STOREPASS','-alias',secret.alias,'-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=SEMED Tecnico, O=SEMED Paco do Lumiar, C=BR']);
run(join(build,'aapt2.exe'),['compile','--dir',join(source,'res'),'-o',join(out,'res.zip')]);
mkdirSync(join(out,'gen'));mkdirSync(join(out,'classes'));mkdirSync(join(out,'dex'));
run(join(build,'aapt2.exe'),['link','-I',platform,'--manifest',join(source,'AndroidManifest.xml'),'--java',join(out,'gen'),'-R',join(out,'res.zip'),'-o',join(out,'unsigned.apk')]);
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]);}
run(join(jdk,'javac.exe'),['--release','8','-encoding','UTF-8','-classpath',platform,'-d',join(out,'classes'),...files(join(source,'src')).filter(f=>f.endsWith('.java')),...files(join(out,'gen')).filter(f=>f.endsWith('.java'))]);
run(join(jdk,'jar.exe'),['cf',join(out,'classes.jar'),'-C',join(out,'classes'),'.']);
run(join(jdk,'java.exe'),['-cp',join(build,'lib','d8.jar'),'com.android.tools.r8.D8','--lib',platform,'--min-api','26','--output',join(out,'dex'),join(out,'classes.jar')]);
run(join(jdk,'jar.exe'),['uf',join(out,'unsigned.apk'),'-C',join(out,'dex'),'classes.dex']);
run(join(build,'zipalign.exe'),['-f','-p','4',join(out,'unsigned.apk'),join(out,'aligned.apk')]);
mkdirSync(resolve('private-data/releases'),{recursive:true});const apk=resolve('private-data/releases/SEMED-Tecnico-1.0.0.apk');
run(join(jdk,'java.exe'),['-jar',join(build,'lib','apksigner.jar'),'sign','--ks',key,'--ks-key-alias',secret.alias,'--ks-pass','env:SEMED_ANDROID_STOREPASS','--out',apk,join(out,'aligned.apk')]);
const certificate=run(join(jdk,'java.exe'),['-jar',join(build,'lib','apksigner.jar'),'verify','--verbose','--print-certs',apk]).toString();
const metadata={file:'SEMED-Tecnico-1.0.0.apk',sha256:createHash('sha256').update(readFileSync(apk)).digest('hex'),bytes:readFileSync(apk).length,minimumAndroid:8,targetSdk:35,certificate,builtAt:new Date().toISOString()};
writeFileSync(resolve('private-data/releases/SEMED-Tecnico-1.0.0.json'),JSON.stringify(metadata,null,2));
console.log(JSON.stringify(metadata));
