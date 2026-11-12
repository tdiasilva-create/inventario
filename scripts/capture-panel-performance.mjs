// Read-only production observation. Saves sanitized request metadata only.
// Usage: node scripts/capture-panel-performance.mjs [seconds=900] [all]
// "all" observes GETs from all clients; default restricts to the workstation IP.
// Requires Wrangler authentication. Does not deploy or modify application data.
import {spawn} from 'node:child_process';
import {mkdirSync,appendFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const seconds=Number(process.argv[2]||900);
const all=process.argv[3]==='all';
if(!Number.isFinite(seconds)||seconds<10||seconds>1800)throw Error('Duration: 10–1800 seconds.');
const folder=resolve(process.env.SEMED_PERF_DIR||'docs/05-qualidade/evidencias/desempenho-2026-11-12');
mkdirSync(folder,{recursive:true});
const file=resolve(folder,all?'worker-all-sanitized.ndjson':'worker-sanitized.ndjson');
writeFileSync(file,'');
const run={startedAt:new Date().toISOString(),filter:all?'GET, all clients, default sampling; not tab-specific':'GET, IP self, default sampling; other clients sharing the IP may appear',events:0,parsed:0,parseErrors:0};
const child=spawn(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),'tail','painel-semed-paco','--format','json','--method','GET',...(all?[]:['--ip','self'])],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,NO_COLOR:'1',CLOUDFLARE_ACCOUNT_ID:'ce059c2b3e50037922a441a66814090d'}});
let buffer='',depth=0,start=-1,quoted=false,escaped=false;
function consume(chunk){for(const c of chunk){
 if(start<0){if(c!=='{')continue;buffer='';start=0;depth=0;quoted=false;escaped=false;}
 buffer+=c;
 if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}
 else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}')depth--;
 if(depth!==0)continue;
 try{const e=JSON.parse(buffer),r=e.event?.request;run.parsed++;if(r?.url){const u=new URL(r.url);const route=u.pathname.replace(/[a-f0-9]{8}-[a-f0-9-]{27,}/gi,':id');
 const row={observedAt:new Date().toISOString(),eventTimestamp:e.eventTimestamp,method:r.method,route,status:e.event?.response?.status??null,outcome:e.outcome??null,cpuTimeMs:e.cpuTimeMs??null,wallTimeMs:e.wallTimeMs??null,exceptions:(e.exceptions||[]).map(x=>({name:x.name})),serverTimingAvailable:!!e.event?.response?.headers?.['server-timing']};
 appendFileSync(file,JSON.stringify(row)+'\n');run.events++;if(run.events===1)console.log('First sanitized request received.');}}
 catch{run.parseErrors++;/* No raw events, headers, URLs or diagnostic output are persisted. */}
 start=-1;buffer='';
 }}
child.stdout.setEncoding('utf8');child.stdout.on('data',consume);
child.stderr.on('data',()=>{});
const timer=setTimeout(()=>child.kill(),seconds*1000);
child.on('exit',(code,signal)=>{clearTimeout(timer);run.finishedAt=new Date().toISOString();run.exitCode=code;run.signal=signal;writeFileSync(resolve(folder,all?'capture-all-run.json':'capture-run.json'),JSON.stringify(run,null,2));console.log(JSON.stringify(run));});
process.on('SIGINT',()=>child.kill());
console.log(JSON.stringify({startedAt:run.startedAt,seconds,file,filter:run.filter}));
