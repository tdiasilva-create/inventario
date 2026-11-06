// Snapshot somente leitura para uma correção isolada; nunca registra credenciais.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const auth=await readFile(join(process.env.APPDATA,'xdg.config','.wrangler','config','default.toml'),'utf8');
const token=auth.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
if(!token)throw Error('Sessão Wrangler indisponível.');
const base='https://api.cloudflare.com/client/v4/accounts/ce059c2b3e50037922a441a66814090d/workers/scripts/painel-semed-paco';
const headers={Authorization:'Bearer '+token};
const service=base.replace('/scripts/','/services/');
const metadata=await fetch(service,{headers});if(!metadata.ok)throw Error('Serviço: HTTP '+metadata.status);
const environment=(await metadata.json()).result.default_environment.environment;
const response=await fetch(service+'/environments/'+encodeURIComponent(environment)+'/content/v2',{headers});
if(!response.ok)throw Error('Leitura do Worker: HTTP '+response.status);
const dir='private-data/partial-photos-release';await mkdir(dir,{recursive:true});
const type=response.headers.get('content-type');
if(type.includes('multipart')){
 const form=await response.formData();
 for(const [name,file] of form){if(typeof file==='string')continue;if(!/^[a-zA-Z0-9_.-]+$/.test(name))throw Error('Nome de módulo inesperado.');await writeFile(join(dir,name),Buffer.from(await file.arrayBuffer()));console.log({module:name,bytes:file.size});}
}else{await writeFile(join(dir,'worker.mjs'),await response.text());console.log({module:'worker.mjs'});}
const settings=await fetch(base+'/settings',{headers});if(!settings.ok)throw Error('Configuração: HTTP '+settings.status);
const data=(await settings.json()).result;
// Somente metadados não secretos: nomes/tipos, nunca valores de bindings secretos.
await writeFile(join(dir,'settings.json'),JSON.stringify({...data,bindings:data.bindings.map(b=>b.type.startsWith('secret')?{name:b.name,type:b.type}:b)},null,2));
console.log({settingsSaved:true,bindings:data.bindings.map(b=>({name:b.name,type:b.type}))});
