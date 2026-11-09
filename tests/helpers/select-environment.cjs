// Ação de usuário na UI atual; nenhum preenchimento direto de estado interno.
module.exports=async function selectEnvironment(page,name){
 await page.locator('[data-action=choose-environment]').click();
 const dialog=page.getByRole('dialog',{name:'Selecionar ambiente'});
 await dialog.getByText(/ambiente\(s\) · lista atualizada/).waitFor();
 const option=dialog.locator('[data-room-id]').filter({has:page.getByText(name,{exact:true})});
 if(await option.count())await option.click();
 else{
  await dialog.getByRole('button',{name:'+ Cadastrar novo ambiente',exact:true}).click();
  await dialog.getByLabel('Nome do novo ambiente').fill(name);
  await dialog.getByRole('button',{name:'Cadastrar e selecionar',exact:true}).click();
 }
 await dialog.waitFor({state:'detached'});
};
