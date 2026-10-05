import fs from 'node:fs';
// Metadata only: do not resize or recompress the original image.
export function imageDimensions(file) {
 try {
  const b=fs.readFileSync(file);
  if(b.subarray(1,4).toString()==='PNG')return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
  if(b[0]===255&&b[1]===216){
   let i=2;
   while(i+9<b.length){
    if(b[i]!==255){i++;continue;}
    const marker=b[i+1];i+=2;
    if(marker===0xd8||marker===0x01)continue;
    if(marker===0xd9||marker===0xda)break;
    const length=b.readUInt16BE(i);if(length<2)break;
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {width:b.readUInt16BE(i+5),height:b.readUInt16BE(i+3)};
    i+=length;
   }
  }
 }catch{}
 return null;
}
