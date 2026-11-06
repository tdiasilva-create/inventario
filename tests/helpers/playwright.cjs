// Testes independentes da instalação do Codex. Navegador padrão preservado: Edge.
const playwright=require('playwright');
const chromium=playwright.chromium;
module.exports={...playwright,chromium:new Proxy(chromium,{get(target,key){
 if(key==='launch')return options=>{
  const settings={...options};
  if(process.env.SEMED_TEST_BROWSER==='chromium')delete settings.channel;
  else if(process.env.SEMED_TEST_BROWSER)settings.channel=process.env.SEMED_TEST_BROWSER;
  return target.launch(settings);
 };
 const value=target[key];return typeof value==='function'?value.bind(target):value;
}})};
