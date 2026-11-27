// Zumi 5.2.1 — stable photo endpoint backed by Airtable.
// This endpoint serves only the FIRST photograph of a currently public listing.
// Never expose an Airtable token or internal fields to the browser.
import {normalize} from './properties.mjs';
import {isPublic,isAvailable} from '../../seo-core.mjs';
const env=k=>globalThis.Netlify?.env.get(k)||process.env[k];
const SOURCES={rent:{table:env('AIRTABLE_RENT_TABLE_ID')||'tblOZztlu6qSLMAtc',operation:'arriendo'},buy:{table:env('AIRTABLE_SALE_TABLE_ID')||'tblB67Zm9zxDlFwY7',operation:'venta'}};
function visibleRecord(row,source,id){
 if(row?.id!==id)return false;
 const p=normalize(row,source.operation);
 return p.operation===source.operation&&isPublic(p)&&isAvailable(p)&&p.priceValue>0;
}
const fail=(status=404)=>new Response('',{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export default async function handler(req){
 if(req.method!=='GET')return fail(405);
 const {searchParams}=new URL(req.url);const id=String(searchParams.get('id')||'');const kind=String(searchParams.get('kind')||'');
 const rawIndex=String(searchParams.get('index')??'0');
 if(!/^[0-3]$/.test(rawIndex)||!/^rec[A-Za-z0-9]{14}$/.test(id)||!SOURCES[kind])return fail(400);
 const index=Number(rawIndex);
 const token=(env('AIRTABLE_API_KEY') || env('AIRTABLE_TOKEN')),base=(env('AIRTABLE_BASE_ID') || 'appkG5ldIIHTVkXf6');
 if(!token||!/^app[A-Za-z0-9]{14}$/.test(base||''))return fail(503);
 try{
  const source=SOURCES[kind];
  const path=`https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(source.table)}/${encodeURIComponent(id)}`;
  const recordRes=await fetch(path,{headers:{authorization:`Bearer ${token}`,accept:'application/json'},signal:AbortSignal.timeout(7500)});
  if(!recordRes.ok)return fail(404);
  const row=await recordRes.json();if(!visibleRecord(row,source,id))return fail(404);
  const picture=(Array.isArray(row.fields?.Fotos)?row.fields.Fotos:[])[index];
  const signed=picture?.thumbnails?.large?.url||picture?.url;
  if(!signed)return fail(404);
  const remote=new URL(signed);
  if(remote.protocol!=='https:'||!['v5.airtableusercontent.com','dl.airtable.com'].includes(remote.hostname))return fail(502);
  const imageRes=await fetch(remote.toString(),{signal:AbortSignal.timeout(8500)});
  if(!imageRes.ok)return fail(502);
  const mime=String(imageRes.headers.get('content-type')||'');
  if(!/^image\/(jpeg|png|webp|gif)/i.test(mime))return fail(502);
  // Content size capped for a small preview image. Usually Airtable 'large' thumb ~ 100 KB.
  const size=Number(imageRes.headers.get('content-length')||0);
  if(size>2_000_000)return fail(413);
  const bytes=await imageRes.arrayBuffer();if(bytes.byteLength>2_000_000)return fail(413);
  return new Response(bytes,{headers:{'content-type':mime,'cache-control':'public,max-age=600,s-maxage=1800,stale-while-revalidate=3600','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; sandbox"}});
 }catch(err){console.error('zumi-photo error',String(err?.message||err).slice(0,80));return fail(502);}
}
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:80}};
