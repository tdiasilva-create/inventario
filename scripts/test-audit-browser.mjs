// Current cross-module browser regression, with isolated fixtures only.
// Run both asset builds first. Does not include legacy V2 screen tests.
import {spawnSync} from 'node:child_process';
const files=[
 'collector-concurrency-browser.cjs','collection-photos-d124-browser.cjs','collector-unit-navigation-browser.cjs',
 'mobile-app-browser.cjs','mobile-safe-viewport-browser.cjs',
 'technician-tracking-browser.cjs','technician-redesign-browser.cjs',
 'collection-control-browser.cjs','collection-overview-browser.cjs',
 'network-tests-browser.cjs','panel-unit-search-browser.cjs',
 'panorama-map-browser.cjs','equipment-consultation-browser.cjs',
 'demand-activity-deletion-browser.cjs','unit-agent-overview-browser.cjs','collection-designation-browser.cjs','technical-dispatch-browser.cjs','dispatch-road-routing-runtime.cjs'
];
const results=[];
for(const name of files){
 const started=Date.now();
 const result=spawnSync(process.execPath,['tests/'+name],{stdio:'inherit',timeout:240_000});
 results.push({file:'tests/'+name,passed:result.status===0&&!result.error,exitCode:result.status,ms:Date.now()-started,error:result.error?.code??null});
}
console.log(JSON.stringify({kind:'isolated-audit-regression',results},null,2));
process.exitCode=results.every(r=>r.passed)?0:1;
