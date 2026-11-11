// Equivalente ao antigo page.on('dialog', accept), somente para roteiros que já confirmavam tudo.
module.exports=async page=>{
 await page.addInitScript(()=>{
  new MutationObserver(()=>{
   document.querySelector('.collector-confirm[open] [data-confirm]')?.click();
  }).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
 });
};
