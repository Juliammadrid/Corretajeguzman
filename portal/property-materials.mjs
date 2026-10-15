// Public marketing assets only. No tokens or owner details sent to attachment hosts.
export const safeName=value=>String(value||'propiedad').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'propiedad';
export function photoURL(value){
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||u.port||!/^([a-z0-9-]+\.)*airtableusercontent\.com$/.test(u.hostname))throw new Error('Origen de foto no permitido.');
  return u.href;
}
export function imageFormat(b){
  if(b[0]===255&&b[1]===216&&b[2]===255)return ['jpg','image/jpeg'];
  if([137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x))return ['png','image/png'];
  const s=new TextDecoder().decode(b.slice(0,12));
  if(s.startsWith('RIFF')&&s.slice(8)==='WEBP')return ['webp','image/webp'];
  if(s.startsWith('GIF87a')||s.startsWith('GIF89a'))return ['gif','image/gif'];
  throw new Error('Una foto no tiene un formato compatible (JPG, PNG, WebP o GIF).');
}
export async function preparePhotos(property,{fetcher=fetch,signal,onProgress=()=>{},maxBytes=100*1024*1024}={}){
  const urls=property.fotos||[];
  if(!urls.length)throw new Error('Esta propiedad aún no tiene fotos.');
  if(urls.length>200)throw new Error('Hay demasiadas fotos para preparar en este dispositivo.');
  let bytes=0,done=0,next=0;const files=new Array(urls.length);
  const stop=new AbortController();const combined=signal?AbortSignal.any([signal,stop.signal]):stop.signal;
  async function worker(){
    for(let i; (i=next++)<urls.length;){
      const response=await fetcher(photoURL(urls[i]),{credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.any([combined,AbortSignal.timeout(30000)])});
      if(!response.ok)throw new Error('No se pudo descargar una foto. Vuelve a intentarlo para renovar los enlaces.');
      const reader=response.body.getReader(),chunks=[];let size=0;
      try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;size+=value.length;
        if(bytes>maxBytes)throw new Error('Las fotos superan 100 MB. Prueba desde un computador o solicita un paquete más pequeño.');chunks.push(value);
      }}catch(error){await reader.cancel();throw error;}finally{reader.releaseLock();}
      const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
      const [ext,type]=imageFormat(data);
      files[i]={name:safeName(property.titulo)+'-'+String(i+1).padStart(2,'0')+'.'+ext,type,data};
      onProgress(++done,urls.length);
    }
  }
  try{await Promise.all(Array.from({length:Math.min(3,urls.length)},worker));}catch(error){stop.abort();throw error;}
  return files;
}
export async function photoArchive(files){
  const {zipSync}=await import('./vendor/fflate-0.8.3.mjs');
  // Photos are already compressed: store, don't recompress or reduce resolution.
  return new Blob([zipSync(Object.fromEntries(files.map(f=>[f.name,f.data])),{level:0})],{type:'application/zip'});
}
