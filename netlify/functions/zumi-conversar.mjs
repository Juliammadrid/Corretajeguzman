import {readPublicCatalog} from './zumi-catalog.mjs';
let cached;
async function publicListings(){
  if(cached && cached.until>Date.now())return cached.rows;
  const catalog=await readPublicCatalog();
  if(!catalog)return null;
  const rows=[...catalog.rent,...catalog.buy].map(({id,name,commune,beds,price,currency,baths,parking,commonExpensesCLP,kind,propertyType})=>({id,name,commune,beds,price,currency,baths,parking,commonExpensesCLP,kind,propertyType}));
  cached={until:Date.now()+120000,rows};return rows;
}
const backend = 'https://aoemvstjbwvkoqjoirsx.supabase.co/functions/v1/zumi-asistente';
export default async function handler(req){
  if(req.method!=='POST')return new Response(null,{status:405});
  const mime=req.headers.get('content-type')||'';
  const limit=mime.startsWith('application/json')?12000:3000000;
  if(Number(req.headers.get('content-length'))>limit)return new Response(null,{status:413});
  let body=await req.arrayBuffer();
  if(body.byteLength>limit)return new Response(null,{status:413});
  if(mime.startsWith('application/json')){
    let data;
    try{data=JSON.parse(new TextDecoder().decode(body));}catch{return new Response(null,{status:400});}
    if(typeof data?.message!=='string')return new Response(null,{status:400});
    const section=['parcelas','proyectos','propietario','admin','corredor','solicitud','simulador'].includes(data.section)?data.section:'';
    body=JSON.stringify({message:data.message,history:data.history,propertyId:data.propertyId,section,focus:typeof data.focus==='string'?data.focus.slice(0,100):'',rows:section&&section!=='parcelas'?null:await publicListings().catch(()=>null)});
  }
  const token=process.env.ZUMI_BRIDGE_TOKEN;
  if(!token)return Response.json({error:'Servicio temporalmente no disponible.'},{status:503});
  try{
    const response=await fetch(backend,{method:'POST',headers:{'content-type':mime,'x-zumi-bridge':token},body,signal:AbortSignal.timeout(35000)});
    return new Response(response.body,{status:response.status,headers:{'content-type':'application/json','cache-control':'no-store'}});
  }catch{return new Response(null,{status:503});}
}
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:8}};
