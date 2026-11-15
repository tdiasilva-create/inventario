// All current Node suites, explicitly enumerated for Windows/Linux shell parity.
// Tests use isolated fixtures. This command never invokes deployment/remote probes.
import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=readdirSync('tests').filter(name=>name.endsWith('.test.mjs')).sort().map(name=>'tests/'+name);
console.log(`Auditoria: ${files.length} arquivos de testes Node; banco de fixtures isolado.`);
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
