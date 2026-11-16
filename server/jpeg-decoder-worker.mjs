import wasm from '@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm';
import {createThumbnailDecoder} from './jpeg-decoder-runtime.mjs';
export const decodeThumbnail=await createThumbnailDecoder(wasm);
