// Read-only public field projection from Corretaje Guzmán Airtable.
// Requires AIRTABLE_TOKEN and AIRTABLE_BASE_ID in Netlify Function env.
// Never send all Airtable fields, and never expose this token in frontend.
const PUBLIC_FIELDS = ['Nombre de la propiedad','Comuna','Dormitorios','Baños','Precio valor','Moneda','Estado','Fotos','Estacionamiento'];
const SOURCE=[{name:'Propiedades en arriendo',kind:'rent',link:'Link de la web'},
 {name:'Propiedades en venta',kind:'buy',link:'Link sitio web'}];
function safeURL(url){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname.replace(/^www\./,'')==='corretajeguzman.com'?u.href:'';}catch{return '';}}
function number(v){if(typeof v==='number')return Number.isFinite(v)?v:0;const n=Number(String(v??'').replace(/[^\d.,]/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.'));return Number.isFinite(n)?n:0;}
const enumName=v=>typeof v==='object'&&v!==null?String(v.name||''):String(v||'');
function mapRow(r,kind,link){const f=r.fields||{};const url=safeURL(f[link]);
 if(!url||!url.includes(r.id))return null;
 const status=enumName(f.Estado)||'Por confirmar';if(/reservad|vendid|arrendad|inactiv|retirad|eliminad/i.test(status))return null;
 const pictures=Array.isArray(f.Fotos)?f.Fotos:[];
 // Use a stable same-origin route, not short-lived Airtable signed image URLs.
 const images=pictures.slice(0,4).map((_,index)=>`/.netlify/functions/zumi-photo?kind=${kind}&id=${encodeURIComponent(r.id)}&index=${index}`);
 const image=images[0]||'';
 return {id:r.id,name:String(f['Nombre de la propiedad']||'').slice(0,150),
 commune:String(f.Comuna||'').slice(0,70),beds:number(f.Dormitorios),baths:number(f['Baños']),
 price:number(f['Precio valor']),currency:/uf/i.test(enumName(f.Moneda))?'UF':'CLP',
 commonExpensesCLP:kind==='rent' && number(f['Valor gasto comun'])>0 ? number(f['Valor gasto comun']) : null,
 parking:enumName(f.Estacionamiento)||'Consultar',url,image,images,kind,status};
}
async function readTable(base,token,source){let all=[],offset='';let count=0;
 do{const u=new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(source.name)}`);
 u.searchParams.set('pageSize','100');for(const n of [...PUBLIC_FIELDS,source.link,...(source.kind==='rent'?['Valor gasto comun']:[])])u.searchParams.append('fields[]',n);
 if(offset)u.searchParams.set('offset',offset);
 const r=await fetch(u,{headers:{authorization:'Bearer '+token,accept:'application/json'},signal:AbortSignal.timeout(8500)});
 if(!r.ok)throw new Error('Airtable '+r.status);const body=await r.json();
 all.push(...(Array.isArray(body.records)?body.records:[]));offset=String(body.offset||'');count++;
 }while(offset&&count<5);
 return all.map(r=>mapRow(r,source.kind,source.link)).filter(Boolean).filter(p=>p.price>0);
}
export async function readPublicCatalog(token=(process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY),base=(process.env.AIRTABLE_BASE_ID || 'appkG5ldIIHTVkXf6')){
 if(!token||!/^app[A-Za-z0-9]{14}$/.test(base||''))return null;
 const [rent,buy]=await Promise.all(SOURCE.map(t=>readTable(base,token,t)));
 return {rent,buy,fetchedAt:new Date().toISOString(),source:'Airtable: campos públicos'};
}
export default async function handler(req){if(req.method!=='GET')return Response.json({error:'Método no permitido'},{status:405});
 const token=(process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY),base=(process.env.AIRTABLE_BASE_ID || 'appkG5ldIIHTVkXf6');
 if(!token||!/^app[A-Za-z0-9]{14}$/.test(base||''))return Response.json({available:false,reason:'no_configurado'},{headers:{'cache-control':'no-store'}});
 try{const publicData=await readPublicCatalog(token,base);
 return Response.json({available:true,...publicData,status:'datos_publicos'},
 {headers:{'cache-control':'public,max-age=60,s-maxage=300','x-content-type-options':'nosniff'}});
 }catch(e){console.error('zumi-catalog',String(e.message||e).slice(0,80));return Response.json({available:false,reason:'error_lectura'},{status:502,headers:{'cache-control':'no-store'}});}
}
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:40}};
