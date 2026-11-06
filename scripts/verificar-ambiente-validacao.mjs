// Verifica proteção HTTP pública; 401 não comprova existência de rota nem migração.
// Padrão: somente GET. --probe-agent acrescenta POST que altera agent_rate_limits.
import {pathToFileURL} from 'node:url';
export async function verifyEnvironments(urls,{fetchImpl=fetch,probeAgent=false,log=console.log}={}){
 if(!urls.length)throw Error('Informe um ou mais endereços.');
 const bases=urls.map(value=>{const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw Error('Use somente a origem HTTP(S), sem credenciais, caminho ou parâmetros.');return u.origin;});
 const results=[];
 const expect=(cond,msg)=>{if(!cond)throw Error(msg);};
 for(const base of bases){
  log('\n== '+base);
  const request=(path,options={})=>fetchImpl(base+path,{...options,redirect:'manual',signal:AbortSignal.timeout(15000)});
  const check=async(name,fn)=>{try{await fn();results.push({base,name,ok:true});log('OK    '+name);}catch(e){results.push({base,name,ok:false,error:e.message});log('FALHA '+name+' → '+e.message);}};
  await check('GET /login → 200',async()=>{const r=await request('/login');expect(r.status===200,'status '+r.status);expect(/login/i.test(await r.text()),'HTML sem identificação de login');});
  await check('GET / sem sessão → /login',async()=>{const r=await request('/');const l=r.headers.get('location');expect(r.status===302&&l&&new URL(l,base).href===base+'/login','redirecionamento inesperado');});
  for(const path of ['/api/inventory/agent-status?equipmentId=x','/api/agent/v1/pairings/claim-status?request_id=x','/api/inventory/equipment-location-status?request_id=x','/api/collector/capabilities']){
   await check('GET '+path+' sem sessão → 401',async()=>{const r=await request(path);expect(r.status===401,'status '+r.status);});
  }
  if(probeAgent){
   log('Sonda ativa solicitada: o POST pode gravar o contador de tentativas agent_rate_limits.');
   await check('POST enrollment-challenge sem grant → 401 INVALID_GRANT',async()=>{
    const r=await request('/api/agent/v1/enrollment-challenge',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    expect(r.status===401,'status '+r.status+'; diagnosticar a causa, sem atribuir automaticamente à migração');
    const body=await r.json();expect(body?.code==='INVALID_GRANT','resposta diferente da recusa esperada do módulo');
   });
  }
 }
 const passed=results.filter(r=>r.ok).length;
 log('\n'+passed+'/'+results.length+' verificações HTTP aprovadas.');
 log('Limite: 401 de rota humana também ocorre em caminhos inexistentes. Não comprova versão, migração 0014 completa, vínculo ou fotos.');
 log('Conferir migrações/esquema no D1 e exercitar as rotas com sessão de validação no roteiro integrado.');
 return {passed,total:results.length,failures:results.length-passed,scope:'protecao-http',migrationVerified:false,results};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const args=process.argv.slice(2);if(args.some(a=>a.startsWith('--')&&a!=='--probe-agent'))throw Error('Opção desconhecida. Use --probe-agent somente para a sonda ativa.');
 const r=await verifyEnvironments(args.filter(a=>a!=='--probe-agent'),{probeAgent:args.includes('--probe-agent')});process.exitCode=r.failures?1:0;
 }catch(e){console.error(e.message);process.exitCode=2;}
}
