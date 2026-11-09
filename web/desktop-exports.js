import {excel,saveBlob,downloadUnits} from './spreadsheet-io.js';
import {readPanelJson} from './desktop-request.js';
import {categories} from './desktop-data.js';
import {categories as equipmentCategories} from './collector-schema.js';
const safe=v=>typeof v==='string'&&/^[\s]*[=+@\t\r]|^-(?!\d+(?:[.,]\d+)?$)/.test(v)?"'"+v:v;
const name=c=>equipmentCategories.find(x=>x[0]===c)?.[1]||(c==='computer'?'Computador (tipo não informado)':c);
export async function downloadTable(columns,rows,format,filename){
 if(format==='XLSX'){
  const E=await excel(),book=new E.Workbook(),sheet=book.addWorksheet('Inventário');
  sheet.addRow(columns);for(const row of rows)sheet.addRow(row.map(v=>safe(v??'')));
  sheet.getRow(1).font={bold:true};sheet.columns.forEach(c=>c.width=26);sheet.views=[{state:'frozen',ySplit:1}];
  saveBlob(await book.xlsx.writeBuffer(),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',filename+'.xlsx');
 }else{
  const quote=v=>'"'+String(safe(v??'')).replace(/"/g,'""')+'"';
  saveBlob('\ufeff'+[columns,...rows].map(row=>row.map(quote).join(';')).join('\r\n'),'text/csv;charset=utf-8',filename+'.csv');
 }
}
export async function exportInventory({kind,format='CSV',units,matrix,onProgress=()=>{}}){
 if(kind==='units')return downloadUnits(units,format);
 if(kind==='matrix')return downloadTable(['ID da unidade','Unidade','Regional',...categories.map(c=>c[0]),'Total'],matrix.map(u=>[u.id,u.name,u.region,...u.values,u.values.reduce((n,v)=>n+v,0)]),format,'SEMED_MATRIZ');
 const rows=[];
 for(let index=0;index<units.length;index++){
  const unit=units[index];let offset=0;const seen=new Set();
  do{
   onProgress(`Consultando unidade ${index+1} de ${units.length} · ${rows.length} registro(s)`);
   const data=await readPanelJson('/api/inventory/'+(kind==='equipment'?'equipment':'findings')+'?'+new URLSearchParams({unitId:unit.id,offset}));
   for(const item of data.items){
    if(seen.has(item.id))continue;seen.add(item.id);
    if(kind==='equipment'){const d=item.data;rows.push([unit.id,unit.name,item.id,name(d.category),item.environment_name||d.environmentName||'',d.position_label||'',d.mode==='Lote'?d.quantity:1,d.asset,d.serial,d.brand,d.model,d.operation,d.condition,d.anydesk,d.rustdesk,item.agent_linked?'Sim':'Não',item.updated_at?new Date(item.updated_at).toISOString():'',JSON.stringify(d)]);}
    else rows.push([unit.id,unit.name,item.id,item.kind,item.description,item.location,item.priority,item.quantity,item.brand,item.operation,item.inspection_id,(item.photos||[]).length]);
   }
   if(data.nextOffset===null||data.nextOffset===undefined)break;
   if(data.nextOffset<=offset)throw Error('A paginação não avançou. Nenhum arquivo incompleto foi gerado.');
   offset=data.nextOffset;
  }while(true);
 }
 const columns=kind==='equipment'?['ID da unidade','Unidade','ID permanente','Categoria','Ambiente','Posição','Quantidade','Patrimônio','Série','Marca','Modelo','Funcionamento','Conservação','AnyDesk','RustDesk','Agente vinculado','Atualização publicada (UTC)','Ficha publicada (JSON)']:['ID da unidade','Unidade','ID do registro','Tipo de registro','Descrição','Local','Prioridade','Quantidade','Marca','Funcionamento','ID da vistoria','Fotografias recebidas'];
 return downloadTable(columns,rows,format,kind==='equipment'?'SEMED_EQUIPAMENTOS_PUBLICADOS':'SEMED_OCORRENCIAS_RECEBIDAS');
}
