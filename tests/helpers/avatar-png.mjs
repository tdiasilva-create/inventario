import {deflateSync} from 'node:zlib';
// Synthetic solid image generated only for isolated tests; not a production avatar.
export function avatarPng(color=42,width=8){
 const chunk=(type,bytes)=>{const b=Buffer.concat([Buffer.alloc(4),Buffer.from(type),bytes,Buffer.alloc(4)]);b.writeUInt32BE(bytes.length);let crc=0xffffffff;for(const v of b.subarray(4,-4)){crc^=v;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}b.writeUInt32BE((crc^0xffffffff)>>>0,b.length-4);return b;};
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(width,4);header[8]=8;header[9]=6;
 const pixels=Buffer.alloc((1+width*4)*width);for(let y=0;y<width;y++)for(let x=0;x<width;x++){const p=y*(1+width*4)+1+x*4;pixels[p]=color;pixels[p+1]=109;pixels[p+2]=119;pixels[p+3]=255;}
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
