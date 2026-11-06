// Somente SQLite em memória; nunca abre D1 remoto nem banco de produção.
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const db=new DatabaseSync(':memory:');
const migrations=[];
for(const file of (await readdir('migrations')).filter(x=>x.endsWith('.sql')).sort()){
 const bytes=await readFile('migrations/'+file);db.exec(bytes.toString());
 migrations.push({file,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const quote=s=>'"'+s.replaceAll('"','""')+'"';
const objects=db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY type,name").all();
const tables=objects.filter(o=>o.type==='table').map(o=>({name:o.name,columns:db.prepare('PRAGMA table_info('+quote(o.name)+')').all(),foreignKeys:db.prepare('PRAGMA foreign_key_list('+quote(o.name)+')').all()}));
const directory='docs/07-operacao/gerado';await mkdir(directory,{recursive:true});
await writeFile(directory+'/schema.json',JSON.stringify({source:'Migrações locais aplicadas em SQLite vazio, sem dados de produção',migrations,tables,objects},null,2)+'\n');
let md='# Dicionário físico do D1/SQLite\n\nGerado por `pnpm docs:schema`. Nenhum dado de produção. Instalação deve usar as migrações ordenadas, não copiar tabelas avulsas deste catálogo.\n\n'+migrations.map(m=>'- `'+m.file+'`').join('\n')+'\n\n';
for(const t of tables){md+='## '+t.name+'\n\n| Coluna | Tipo | NOT NULL | PK | Default |\n|---|---|---|---|---|\n'+t.columns.map(c=>'| '+[c.name,c.type,c.notnull?'sim':'não',c.pk||'',String(c.dflt_value??'—').replaceAll('|','\\|')].join(' | ')+' |').join('\n')+'\n\n';if(t.foreignKeys.length)md+='Referências: '+t.foreignKeys.map(k=>'`'+k.from+'` → `'+k.table+'.'+k.to+'` (delete: '+k.on_delete+')').join('; ')+'.\n\n';}
md+='## Views e triggers\n\n'+objects.filter(o=>o.type==='view'||o.type==='trigger').map(o=>'- `'+o.name+'` ('+o.type+', '+o.tbl_name+')').join('\n')+'\n';
await writeFile(directory+'/DICIONARIO_DADOS.md',md);
const counts=Object.fromEntries(['table','index','view','trigger'].map(type=>[type,objects.filter(x=>x.type===type).length]));
console.log(JSON.stringify({migrations:migrations.length,...counts,integrity:db.prepare('PRAGMA integrity_check').get().integrity_check,foreignKeyErrors:db.prepare('PRAGMA foreign_key_check').all().length}));db.close();
