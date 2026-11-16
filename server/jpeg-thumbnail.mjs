import {decodeThumbnail} from '#jpeg-decoder';

// A bounded envelope check precedes decoding: dimensions, frame count and scan
// count cannot be hidden after the first SOS. No original is decoded here.
export function thumbnailFrame(bytes){
 if(bytes.length<20||bytes.length>65536||bytes[0]!==255||bytes[1]!==216)return null;
 let offset=2,frame=null,scans=0,segments=0;
 while(offset<bytes.length){
  if(bytes[offset++]!==255)return null;
  while(bytes[offset]===255)offset++;
  const marker=bytes[offset++];
  if(marker===0xd9)return frame&&scans&&offset===bytes.length?frame:null;
  if(++segments>128||offset+2>bytes.length)return null;
  const length=bytes[offset]*256+bytes[offset+1];
  if(length<2||offset+length>bytes.length)return null;
  if([0xc0,0xc1,0xc2].includes(marker)){
   if(frame||length<11||bytes[offset+2]!==8)return null;
   const height=bytes[offset+3]*256+bytes[offset+4],width=bytes[offset+5]*256+bytes[offset+6],components=bytes[offset+7];
   if(!width||!height||width>320||height>320||![1,3,4].includes(components)||length!==8+3*components)return null;
   let blocks=0;
   for(let i=0;i<components;i++){const sampling=bytes[offset+9+3*i],h=sampling>>4,v=sampling&15;if(!h||!v||h>4||v>4)return null;blocks+=h*v;}
   if(blocks>10)return null;
   frame={width,height};
  }else if(![0xc4,0xda,0xdb,0xdd,0xfe].includes(marker)&&!(marker>=0xe0&&marker<=0xef))return null;
  offset+=length;
  if(marker===0xda){
   if(!frame||++scans>16)return null;
   while(offset<bytes.length){
    if(bytes[offset]!==255){offset++;continue;}
    const next=bytes[offset+1];
    if(next===0||(next>=0xd0&&next<=0xd7)){offset+=2;continue;}
    break;
   }
  }
 }
 return null;
}

export async function validThumbnail(bytes){
 const frame=thumbnailFrame(bytes);if(!frame)return null;
 try{
  const image=await decodeThumbnail(bytes);
  return image&&image.width===frame.width&&image.height===frame.height&&image.data.length===frame.width*frame.height*4?frame:null;
 }catch{return null;}
}
