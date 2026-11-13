// Synthetic local browser scenarios; no production accounts, GPS or writes.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f}=h;
 const dir='docs/05-qualidade/evidencias/app-tecnico-d113-2026-11-13/revisao';fs.mkdirSync(dir,{recursive:true});
 const rid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 const make=(n,done=false)=>({id:rid(n),number:n,version:1,status:done?'Concluída':'Aberta',description:'TESTE LOCAL · Atendimento '+n,current_unit_name:'TESTE · Unidade '+n,context:{environment:'Laboratório'},latitude:-2.54,longitude:-44.17,updated_at:Date.now(),assignments:[{userId:f.root.id,name:'Técnico de teste',accepted:false}]});
 let queue=Array.from({length:150},(_,i)=>make(i+1)),history=[make(901,true)],hold=null,denyDetail=false,failNote=true;
 const reads=[],notes=[],events=new Set();let detailReads=0;
 const shot=async name=>{await page.evaluate(()=>{let b=document.querySelector('#test-label');if(!b){b=document.createElement('div');b.id='test-label';b.textContent='TESTE LOCAL · dados sintéticos';b.style.cssText='position:fixed;bottom:64px;right:0;z-index:99999;background:#16191d;color:white;padding:5px;font:11px sans-serif;pointer-events:none';document.body.append(b);}});await page.screenshot({path:dir+'/'+name+'.png',fullPage:true});};
 await page.route('**/api/technician/**',async route=>{
  const req=route.request(),url=new URL(req.url()),end=url.pathname.split('/').at(-1);
  const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  if(end==='queue'){
   const offset=Number(url.searchParams.get('offset')||0),done=url.searchParams.get('history')==='1',list=done?history:queue;
   reads.push({offset,done});const result={items:list.slice(offset,offset+100),offset,total:list.length,nextOffset:offset+100<list.length?offset+100:null,notifications:[],unread:0,serverTime:Date.now()};
   if(hold&&!done){const p=hold;hold=null;await p.promise;}
   return json(result).catch(()=>{});
  }
  if(end==='active')return json({attendance:null});
  if(end==='notifications')return json({notifications:[{id:1,request_id:rid(901),message:'TESTE · demanda concluída',created_at:Date.now(),read_at:null}],unread:1});
  if(end==='notifications-read')return json({ok:true});
  if(end==='request'){detailReads++;return denyDetail?json({error:'Demanda indisponível ou não mais atribuída a você.'},404):json({item:make(Number(url.searchParams.get('id').slice(-12)),true)});}
  if(end==='note'){const body=req.postDataJSON();notes.push(body);events.add(body.operationId);if(failNote){failNote=false;return route.abort('failed');}return json({ok:true,replayed:true});}
  throw Error('Unexpected mocked endpoint '+end);
 });
 try{
  await page.setViewportSize({width:390,height:844});await page.goto(origin+'/tecnico');await page.locator('.task').nth(99).waitFor();
  assert.equal(await page.locator('.task').count(),100);
  assert.equal(await page.locator('.row-body[inert]').count(),99);
  await page.getByRole('button',{name:'Mostrar mais',exact:true}).click();await page.locator('.task').nth(149).waitFor();
  let n=reads.length;await page.getByRole('button',{name:'Atualizar',exact:true}).click();await page.locator('#extra-pages:not([hidden])').waitFor();
  assert.equal(await page.locator('.task').count(),150);assert.deepEqual(reads.slice(n),[{offset:0,done:false}]);
  queue=queue.filter(r=>r.number!==150);n=reads.length;
  await page.getByRole('button',{name:'Atualizar páginas carregadas'}).click();await page.waitForFunction(()=>document.querySelectorAll('.task').length===149);
  assert.deepEqual(reads.slice(n),[{offset:0,done:false},{offset:100,done:false}]);
  assert.equal(await page.locator('#extra-pages').isHidden(),true);
  // The late queue reply cannot paint an open demand inside Concluídos.
  let release;hold={promise:new Promise(r=>release=r)};n=reads.length;
  await page.getByRole('button',{name:'Atualizar',exact:true}).click();await page.waitForTimeout(100);
  await page.getByRole('button',{name:'Concluídos',exact:true}).click();await page.locator('.task.done').waitFor();release();await page.waitForTimeout(250);
  assert.equal(await page.locator('.task:not(.done):visible').count(),0);
  assert.equal(await page.evaluate(()=>window.semedHandleBack()),true);await page.locator('.task.agora').waitFor();
  // Lost ACK after committing a note: immutable retry, no duplicate and no text loss.
  await page.locator('.task.agora').getByRole('button',{name:'Observação',exact:true}).click();
  await page.locator('dialog textarea').fill('TESTE · texto preservado');
  n=reads.length;await page.waitForTimeout(15500);assert.equal(reads.length,n,'poll pauses while typing in the sheet');
  await page.locator('dialog [data-ok]').click();await page.locator('dialog [data-feedback]:not([hidden])').waitFor();
  assert.equal(await page.locator('dialog textarea').inputValue(),'TESTE · texto preservado');assert.equal(await page.locator('dialog textarea').evaluate(e=>e.readOnly),true);
  await shot('01-reenvio-protegido');
  assert.equal(await page.evaluate(()=>window.semedHandleBack()),true);await page.locator('dialog').waitFor({state:'detached'});
  await page.getByRole('button',{name:'Conferir envio pendente'}).click();
  assert.equal(await page.locator('dialog textarea').inputValue(),'TESTE · texto preservado');
  await page.locator('dialog [data-ok]').click();await page.locator('dialog').waitFor({state:'detached'});
  assert.equal(notes.length,2);assert.deepEqual(notes[0],notes[1]);assert.equal(events.size,1);
  // Notice detail fetches only on click, includes completed/outside-page request.
  await page.getByRole('button',{name:/^Avisos/}).click();await page.getByRole('button',{name:'Ver demanda',exact:true}).waitFor();assert.equal(detailReads,0);
  await page.getByRole('button',{name:'Ver demanda',exact:true}).click();await page.locator('dialog').waitFor();assert.match(await page.locator('dialog').innerText(),/Demanda #901/);assert.match(await page.locator('dialog').innerText(),/Concluída/i);assert.equal(detailReads,1);
  await shot('02-aviso-demanda-concluida');await page.locator('dialog [data-ok]').click();await page.locator('dialog').waitFor({state:'detached'});
  denyDetail=true;await page.getByRole('button',{name:'Ver demanda',exact:true}).click();await page.getByText('Demanda indisponível ou não mais atribuída a você.',{exact:true}).waitFor();assert.equal(await page.locator('dialog').count(),0);
  await page.getByRole('button',{name:/^Fila/}).click();await page.locator('.task.agora').waitFor();await shot('03-fila-390');
  for(const viewport of [{width:360,height:740},{width:812,height:375}]){await page.setViewportSize(viewport);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await shot('04-'+viewport.width+'x'+viewport.height);}
  assert.deepEqual(h.errors,[]);
  const result={passed:true,pagesPreserved:true,extraPagesOnDemand:true,lateReplyIgnored:true,pollPausedInSheet:true,immutableRetry:true,deduplicatedAck:true,noticeDetailOnClick:true,permissionFailureVisible:true,nativeBackContract:true,viewports:[390,360,812],scope:'Local browser with synthetic API data. Android hardware pending.'};
  fs.writeFileSync(dir+'/resultado.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
