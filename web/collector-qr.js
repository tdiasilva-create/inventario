// Leitor de QR Code do coletor (vínculo do agente Windows). Decodificação LOCAL: BarcodeDetector quando existir,
// senão jsQR (web/vendor/jsqr, Apache-2.0) sobre quadros da câmera ou sobre uma imagem escolhida da galeria.
// Nunca envia a imagem a serviços externos; nunca navega para URLs lidas; encerra as trilhas da câmera ao sair.
const QR_TYPE='semed.agent.pairing';
let jsQRPromise=null;
function loadJsQR(){if(globalThis.jsQR)return Promise.resolve(globalThis.jsQR);jsQRPromise??=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/vendor/jsqr/jsQR.js';s.onload=()=>resolve(globalThis.jsQR);s.onerror=()=>reject(Error('Leitor local de QR indisponível (vendor/jsqr).'));document.head.append(s);});return jsQRPromise;}
async function detector(){if('BarcodeDetector' in globalThis){try{const formats=await globalThis.BarcodeDetector.getSupportedFormats?.();if(!formats||formats.includes('qr_code')){const d=new globalThis.BarcodeDetector({formats:['qr_code']});return {kind:'native',async decode(source){const codes=await d.detect(source);return codes[0]?.rawValue||null;}};}}catch{/* cai para jsQR */}}
 const jsQR=await loadJsQR();const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 return {kind:'jsqr',decode(source){const w=source.videoWidth||source.naturalWidth||source.width,h=source.videoHeight||source.naturalHeight||source.height;if(!w||!h)return null;const scale=Math.min(1,800/Math.max(w,h));canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);ctx.drawImage(source,0,0,canvas.width,canvas.height);const img=ctx.getImageData(0,0,canvas.width,canvas.height);const r=jsQR(img.data,img.width,img.height,{inversionAttempts:'attemptBoth'});return r?.data||null;}};}
/** Valida o conteúdo do QR temporário. Devolve {enrollment_id,pairing_code,expires_at} ou lança erro legível. */
export function parsePairingQr(text){
 if(typeof text!=='string'||text.length>512)throw Error('QR inválido: conteúdo inesperado.');
 let data;try{data=JSON.parse(text);}catch{throw Error('Este QR não é do agente SEMED.');}
 if(!data||data.type!==QR_TYPE)throw Error('Este QR não é do agente SEMED.');
 if(data.version!==1)throw Error('Versão do QR não suportada por este coletor.');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(data.enrollment_id||'')))throw Error('QR inválido: pedido de pareamento ausente.');
 if(!/^[A-Za-z0-9_-]{22,64}$/.test(String(data.pairing_code||'')))throw Error('QR inválido: código de pareamento ausente.');
 const expires=typeof data.expires_at==='string'&&!Number.isNaN(Date.parse(data.expires_at))?data.expires_at:null;
 return {enrollment_id:data.enrollment_id,pairing_code:data.pairing_code,expires_at:expires};
}
export function describeCameraError(error){const name=error?.name||'';if(name==='NotAllowedError'||name==='SecurityError')return 'Permissão de câmera negada. Libere a câmera para este site ou escolha uma imagem do QR da galeria.';if(name==='NotFoundError'||name==='OverconstrainedError')return 'Nenhuma câmera disponível neste aparelho. Escolha uma imagem do QR da galeria.';if(name==='NotReadableError'||name==='AbortError')return 'A câmera está em uso por outro aplicativo. Feche-o e tente novamente.';return error?.message||'Não foi possível abrir a câmera.';}
/**
 * Abre a leitura em tela cheia. Resolve com o texto decodificado ou null (cancelado).
 * A câmera de leitura é distinta da câmera de fotografia de evidência: aqui nada é gravado.
 */
export function scanPairingQr({title='Ler QR Code do agente',hint='Aponte para o QR exibido na tela do computador. Nada é fotografado nem enviado; a leitura acontece neste aparelho.'}={}){
 return new Promise(async resolve=>{
  const root=document.createElement('div');root.className='qr-scanner';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
  root.innerHTML=`<div class="qr-head"><strong>${title}</strong><button type="button" class="text-button" data-qr="cancel">Cancelar</button></div><div class="qr-stage"><video playsinline muted autoplay></video><div class="qr-frame" aria-hidden="true"></div></div><p class="qr-hint">${hint}</p><p class="qr-status" role="status">Abrindo a câmera…</p><div class="qr-actions"><label class="secondary photo-control">Escolher imagem do QR<input type="file" accept="image/*" data-qr="file"></label></div>`;
  document.body.append(root);document.body.classList.add('qr-open');
  const video=root.querySelector('video'),status=root.querySelector('.qr-status');let stream=null,timer=null,finished=false;
  // [REV-07] encerra trilhas mesmo quando o stream chega depois do cancelamento; saída da página também encerra.
  const stopStream=st=>{try{for(const t of st?.getTracks?.()||[])t.stop();}catch{/* trilha já parada */}};
  const onLeave=()=>finish(null);
  const finish=value=>{if(finished)return;finished=true;clearTimeout(timer);stopStream(stream);stream=null;video.srcObject=null;try{video.pause?.();}catch{}root.remove();document.body.classList.remove('qr-open');globalThis.removeEventListener?.('pagehide',onLeave);resolve(value);};
  globalThis.addEventListener?.('pagehide',onLeave);
  root.addEventListener('click',e=>{if(e.target.closest('[data-qr="cancel"]'))finish(null);});
  let dec;try{dec=await detector();}catch(e){status.textContent=e.message;dec=null;}
  if(finished)return;
  root.querySelector('[data-qr="file"]').addEventListener('change',async e=>{const file=e.target.files[0];if(!file||!dec)return;status.textContent='Lendo a imagem…';let url=null;try{url=URL.createObjectURL(file);const img=new Image();img.src=url;await img.decode();const text=await dec.decode(img);if(finished)return;if(text)finish(text);else status.textContent='Nenhum QR legível nesta imagem. Aproxime mais e tente de novo.';}catch{if(!finished)status.textContent='Não foi possível ler esta imagem.';}finally{if(url)URL.revokeObjectURL(url);e.target.value='';}});
  if(!navigator.mediaDevices?.getUserMedia){status.textContent='Este navegador não permite abrir a câmera aqui. Escolha uma imagem do QR da galeria.';return;}
  let granted=null;
  try{granted=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});}
  catch(error){if(!finished)status.textContent=describeCameraError(error);return;}
  if(finished){stopStream(granted);return;} // cancelado enquanto a permissão/câmera abria
  stream=granted;video.srcObject=stream;
  try{await video.play();}catch{/* autoplay bloqueado: o quadro ainda é lido pelo laço abaixo */}
  if(finished){stopStream(granted);video.srcObject=null;return;}
  status.textContent=dec?'Enquadre o QR dentro da moldura.':'Leitor indisponível; use uma imagem da galeria.';
  if(!dec)return;
  const tick=async()=>{if(finished)return;try{if(video.readyState>=2){const text=await dec.decode(video);if(finished)return;if(text){finish(text);return;}}}catch{/* quadro ilegível ou decodificador falhou neste quadro */}if(!finished)timer=setTimeout(tick,dec.kind==='native'?200:120);};
  tick();
 });
}
