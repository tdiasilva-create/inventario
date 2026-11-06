export function parseCsv(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(cell);cell='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 if(quoted)throw new Error('CSV com aspas não fechadas.');
 if(cell||row.length){row.push(cell);rows.push(row);}
 const headers=rows.shift()?.map(h=>h.replace(/^\ufeff/,'').trim())||[];
 if(new Set(headers).size!==headers.length)throw new Error('Cabeçalhos repetidos.');
 return rows.map((values,index)=>{if(values.length!==headers.length)throw new Error(`Número de colunas divergente na linha ${index+2}`);return Object.fromEntries(headers.map((h,i)=>[h,values[i]]));});
}
