// Derived images only: full private JPEG and a small JPEG for authenticated lists.
// No device EXIF/location metadata is copied into either result.
const MAX_FILE=30*1024*1024,MAX_PIXELS=50_000_000;
function jpegSize(bytes){
 let width,height,orientation=1;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 try{for(let p=2;p+4<bytes.length;){if(bytes[p++]!==255)break;const marker=bytes[p++],length=view.getUint16(p);if(length<2||p+length>bytes.length)break;
  if([0xc0,0xc1,0xc2].includes(marker)){height=view.getUint16(p+3);width=view.getUint16(p+5);}
  if(marker===0xe1&&String.fromCharCode(...bytes.subarray(p+2,p+6))==='Exif'){const base=p+8,little=view.getUint16(base)===0x4949,dir=base+view.getUint32(base+4,little),count=view.getUint16(dir,little);for(let n=0;n<Math.min(count,128);n++){const entry=dir+2+12*n;if(view.getUint16(entry,little)===0x112)orientation=view.getUint16(entry+8,little);}}
  if(marker===0xda)break;p+=length;
 }}catch{/* Incomplete header: let the browser validate and decode. */}
 return width&&height?{width:orientation>=5?height:width,height:orientation>=5?width:height}:null;
}
async function knownSize(blob){const bytes=new Uint8Array(await blob.slice(0,262144).arrayBuffer());if(bytes[0]===255&&bytes[1]===216)return jpegSize(bytes);if(bytes.length>=24&&bytes[0]===137&&bytes[1]===80){const v=new DataView(bytes.buffer);return {width:v.getUint32(16),height:v.getUint32(20)};}return null;}
export function fitPhoto(width,height,max){const scale=Math.min(1,max/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};}
async function sourceFor(blob,max){
 const size=await knownSize(blob);if(size&&size.width*size.height>MAX_PIXELS)throw Error('Foto muito grande para preparar neste aparelho. Use até 50 megapixels.');
 if(typeof createImageBitmap==='function')try{const bitmap=await createImageBitmap(blob,{imageOrientation:'from-image',...(size?{resizeWidth:fitPhoto(size.width,size.height,max).width,resizeHeight:fitPhoto(size.width,size.height,max).height,resizeQuality:'high'}:{})});return {image:bitmap,width:bitmap.width,height:bitmap.height,close:()=>bitmap.close()};}catch{}
 const url=URL.createObjectURL(blob),image=new Image();
 try{image.src=url;await image.decode();return {image,width:image.naturalWidth,height:image.naturalHeight,close:()=>{image.src='';URL.revokeObjectURL(url);}};}catch{URL.revokeObjectURL(url);}
 if(/^image\/(heic|heif)/i.test(blob.type)||/\.(heic|heif)$/i.test(blob.name||'')){
  // Loaded from our own version-pinned asset only when the browser cannot decode HEIC.
  const {heicTo}=await import('./vendor/heic-to/heic-to.min.js');
  const bitmap=await heicTo({blob,type:'bitmap'});return {image:bitmap,width:bitmap.width,height:bitmap.height,close:()=>bitmap.close()};
 }
 throw Error('Não foi possível abrir a imagem. Selecione uma fotografia JPEG, PNG, WebP ou HEIC válida.');
}
const encode=(canvas,quality)=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Não foi possível preparar a fotografia.')),'image/jpeg',quality));
async function jpeg(source,max,quality,limit){
 const {width,height}=fitPhoto(source.width,source.height,max),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 try{const ctx=canvas.getContext('2d');if(!ctx)throw Error('Este navegador não conseguiu preparar a imagem.');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(source.image,0,0,width,height);
  let blob=await encode(canvas,quality);while(blob.size>limit&&quality>.35){quality-=.1;blob=await encode(canvas,quality);}if(blob.size>limit)throw Error('A fotografia continua grande após a otimização. Escolha outra imagem.');return {blob,width,height};
 }finally{canvas.width=canvas.height=1;}
}
export async function preparePhoto(file,{thumbnailOnly=false}={}){
 if(!file.size||file.size>MAX_FILE||(!/^image\/(jpeg|png|webp|heic|heif)(-sequence)?$/i.test(file.type)&&!(/\.(heic|heif)$/i.test(file.name||'')&&!file.type)))throw Error('Use JPEG, PNG, WebP ou HEIC de até 30 MB.');
 const source=await sourceFor(file,thumbnailOnly?320:1600);
 try{if(!source.width||!source.height||source.width*source.height>MAX_PIXELS)throw Error('Foto muito grande ou inválida para este aparelho.');
  const thumbnail=await jpeg(source,320,.7,30*1024);
  if(thumbnailOnly)return thumbnail;
  return {...await jpeg(source,1600,.85,3*1024*1024),thumbnail:thumbnail.blob};
 }finally{source.close();}
}
export async function photoHash(blob){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');}
