// Local test/runtime adapter. Wrangler aliases #jpeg-decoder to the static WASM
// adapter; neither node:fs nor runtime compilation is shipped to Cloudflare.
import {readFileSync} from 'node:fs';
import {createThumbnailDecoder} from './jpeg-decoder-runtime.mjs';
const wasm=new WebAssembly.Module(readFileSync(new URL(import.meta.resolve('@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm'))));
export const decodeThumbnail=await createThumbnailDecoder(wasm);
