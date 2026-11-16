import factory from '@jsquash/jpeg/codec/dec/mozjpeg_dec.js';
import {initEmscriptenModule} from '@jsquash/jpeg/utils.js';

// Same decoder in Node tests and Workers; only loading the WASM module differs.
// Warnings such as premature entropy termination are failures, not grey pixels.
export async function createThumbnailDecoder(wasm){
 let warning=false;
 const codec=await initEmscriptenModule(factory,wasm,{printErr(){warning=true;},print(){}});
 return bytes=>{
  warning=false;
  try{const image=codec.decode(bytes,false);return warning?null:image;}catch{return null;}
 };
}
