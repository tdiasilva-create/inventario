import {execFileSync} from 'node:child_process';
import {mkdirSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
const tool=resolve('private-data/android-toolchain'),jdk=join(tool,'jdk',readdirSync(join(tool,'jdk'))[0],'bin'),out=resolve('private-data/android-tests');mkdirSync(out,{recursive:true});
execFileSync(join(jdk,'javac.exe'),['--release','8','-encoding','UTF-8','-d',out,'android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/TrackingPolicy.java','tests/android/TrackingPolicyTest.java'],{stdio:'inherit'});
execFileSync(join(jdk,'java.exe'),['-cp',out,'br.gov.ma.pacodolumiar.semed.tecnico.TrackingPolicyTest'],{stdio:'inherit'});
