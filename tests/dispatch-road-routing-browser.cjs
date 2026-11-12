const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f}=h;const dir='docs/05-qualidade/evidencias/rotas-ruas-2026-11-12';fs.mkdirSync(dir,{recursive:true});
 const sample=JSON.parse(fs.readFileSync('tests/fixtures/public-road-paco-d106.json','utf8'));
 let upstream=0;h.env.ROUTING_FETCH=async()=>{upstream++;return Response.json(sample);};
 try{
  const me=await(await page.request.get(origin+'/api/auth/me')).json();const post=async(path,data)=>{const r=await page.request.post(origin+path,{headers:{Origin:origin,'X-CSRF-Token':me.csrf},data});assert.ok(r.ok(),await r.text());return r.json();};
  const cmd=x=>({operationId:crypto.randomUUID(),revision:f.sqlite.prepare('SELECT revision FROM dispatch_meta').get().revision,...x});
  const id=crypto.randomUUID();f.sqlite.prepare('UPDATE units SET latitude=-2.535,longitude=-44.167 WHERE id=?').run(f.ids.pending);
  await post('/api/operations/request-save',{id,operationId:crypto.randomUUID(),version:0,unitId:f.ids.pending,equipmentId:null,description:'TESTE ISOLADO · Rota pelas ruas',kind:'Visita técnica',source:'Painel',requester:'',responsible:'',scheduledDate:'',note:'',status:'Aberta'});
  await post('/api/dispatch/technician',cmd({userId:f.root.id,enabled:true}));await post('/api/dispatch/assign',cmd({id,userIds:[f.root.id]}));
  await post('/api/technician/accept',cmd({id,version:f.sqlite.prepare('SELECT version FROM service_requests WHERE id=?').get(id).version,position:{latitude:-2.54,longitude:-44.17,accuracy:10,observedAt:Date.now()}}));
  await page.goto(origin+'/panorama');await page.locator('.dispatch-route-line').waitFor();assert.match(await page.locator('.dispatch-map-control').innerText(),/pelas ruas, na ordem do root/);assert.equal(upstream,1);
  await page.getByRole('button',{name:'Ampliar área do mapa',exact:true}).click();await page.getByRole('button',{name:'Ampliar mapa',exact:true}).click();await page.getByRole('button',{name:'Ampliar mapa',exact:true}).click();
  await page.mouse.move(350,900);await page.mouse.down();await page.mouse.move(820,520,{steps:12});await page.mouse.up();await page.getByRole('button',{name:'Ampliar mapa',exact:true}).click();await page.waitForTimeout(700);
  await page.evaluate(()=>{let b=document.createElement('div');b.textContent='TESTE LOCAL · Dados sintéticos · geometria pública OSRM';b.style.cssText='position:fixed;bottom:0;right:0;z-index:99999;background:#16191d;color:white;padding:5px;font:12px sans-serif;pointer-events:none';document.body.append(b);});
  await page.screenshot({path:dir+'/01-trajeto-ruas-local.png',fullPage:false,animations:'disabled'});
  assert.ok((await page.locator('.dispatch-route-line').getAttribute('d')).length>20);assert.ok(await page.getByRole('link',{name:'Corrigir mapa',exact:true}).count());
  // Explicit missing coordinate, not a fallback joining the other stops.
  f.sqlite.prepare('UPDATE units SET latitude=NULL WHERE id=?').run(f.ids.pending);await page.reload();await page.getByText(/Cadastre as coordenadas das unidades indicadas/).waitFor();assert.equal(await page.locator('.dispatch-route-line').count(),0);
  await page.screenshot({path:dir+'/02-coordenada-ausente.png',fullPage:false});
  f.sqlite.prepare('UPDATE units SET latitude=-2.535 WHERE id=?').run(f.ids.pending);f.sqlite.exec('DELETE FROM dispatch_road_routes;UPDATE dispatch_routing_gate SET next_at=0,lease_until=0;');h.env.ROUTING_FETCH=async()=>new Response('offline',{status:503});await page.reload();await page.getByText(/Cálculo das ruas indisponível/).waitFor();assert.equal(await page.locator('.dispatch-route-line').count(),0);
  await page.screenshot({path:dir+'/03-falha-provedor.png',fullPage:false});
  f.sqlite.prepare("UPDATE service_requests SET status='Concluída' WHERE id=?").run(id);await page.reload();await page.getByText('0 técnico(s) com posição recente',{exact:true}).waitFor();assert.equal(await page.locator('.dispatch-route-line').count(),0);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_road_routes').get().n,0);
  assert.deepEqual(h.errors,[]);console.log(JSON.stringify({passed:true,realRoadGeometryPoints:sample.routes[0].geometry.coordinates.length,fullscreen:true,missingCoordinate:true,providerFailure:true,completionRemovesRoute:true}));
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
