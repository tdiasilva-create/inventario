import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {unitColumns,validateUnitFields} from '../web/unit-schema.js';
globalThis.window={ExcelJS,addEventListener(){}};
const {readUnitFile}=await import('../web/spreadsheet-io.js');
const sample={name:'DEMO · Arquivo',unit_type:'Unidade administrativa',active:'Ativa',students_total:0,classes_total:12,figures_reference_date:'2026-01-01'};

test('CSV antigo de 12 colunas e novo de 27 preservam vazio, zero e cabeçalhos',async()=>{
 for(const count of [12,27]){
  const columns=unitColumns.slice(0,count),csv='\ufeff'+columns.map(c=>c[1]).join(';')+'\n'+columns.map(([k])=>sample[k]??'').join(';');
  const [row]=await readUnitFile(new File([csv],'DEMO.csv'));
  const result=validateUnitFields(row);assert.ok(!result.error);assert.equal(result.value.students_total,count===12?null:0);assert.equal(result.value.classes_total,count===12?null:12);
 }
});

test('XLSX mantém números decimais inválidos e datas, sem interpretar fórmula',async()=>{
 const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('DEMO');sheet.addRow(unitColumns.map(c=>c[1]));
 sheet.addRow(unitColumns.map(([k])=>k==='figures_reference_date'?new Date('2026-01-01T00:00:00Z'):sample[k]??''));
 const read=async()=>readUnitFile(new File([await book.xlsx.writeBuffer()],'DEMO.xlsx'));
 let [row]=await read();assert.equal(row.figures_reference_date,'2026-01-01');assert.equal(validateUnitFields(row).value.students_total,0);
 const column=unitColumns.findIndex(([k])=>k==='students_total')+1;
 sheet.getCell(2,column).value=1.232;[row]=await read();assert.equal(row.students_total,1.232);assert.ok(validateUnitFields(row).fields.students_total);
 sheet.getCell(2,column).value={formula:'1+1',result:2};await assert.rejects(read,/Remova fórmulas/);
});
