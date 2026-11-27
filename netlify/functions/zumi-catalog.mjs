// Zumi uses exactly the same normalized, public inventory as the website.
import readProperties from './properties.mjs';
import {propertyPath,isPublic,isAvailable} from '../../seo-core.mjs';

export function projectListing(p){
 if(!/^rec[A-Za-z0-9]{14}$/.test(p?.id||'')||!isPublic(p)||!isAvailable(p)||
   !['arriendo','venta'].includes(p.operation)||!(p.priceValue>0))return null;
 const kind=p.operation==='venta'?'buy':'rent';
 const images=(p.photos||[]).slice(0,4).map((_,index)=>`/.netlify/functions/zumi-photo?kind=${kind}&id=${encodeURIComponent(p.id)}&index=${index}`);
 return {id:p.id,name:String(p.title||'Propiedad').slice(0,150),commune:String(p.commune||'').slice(0,70),
  beds:p.bedrooms??null,baths:p.bathrooms??null,price:p.priceValue,currency:p.currency,
  propertyType:p.propertyType,commonExpensesCLP:kind==='rent'&&p.commonExpenses>0?p.commonExpenses:null,
  parking:p.parking==null?'Consultar':p.parking>0?String(p.parking):'No',
  url:'https://corretajeguzman.com'+propertyPath(p),image:images[0]||'',images,kind,status:p.status};
}
export async function readPublicCatalog(){
 const response=await readProperties(new Request('https://corretajeguzman.com/api/properties'));
 if(!response.ok)throw Error('Inventario no disponible');
 const data=await response.json();
 if(data.complete!==true||!Array.isArray(data.properties))throw Error('Inventario incompleto');
 const rows=Array.from(new Map(data.properties.map(projectListing).filter(Boolean).map(p=>[p.id,p])).values());
 return {rent:rows.filter(p=>p.kind==='rent'),buy:rows.filter(p=>p.kind==='buy'),fetchedAt:new Date().toISOString(),source:'Inventario público compartido'};
}
export default async function handler(req){
 if(req.method!=='GET')return Response.json({error:'Método no permitido'},{status:405});
 try{return Response.json({available:true,...await readPublicCatalog(),status:'datos_publicos'},
 {headers:{'cache-control':'public,max-age=0,s-maxage=60','x-content-type-options':'nosniff'}});}
 catch(e){console.error('zumi-catalog',String(e.message||e).slice(0,80));return Response.json({available:false,reason:'error_lectura'},{status:502,headers:{'cache-control':'no-store'}});}
}
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:40}};
