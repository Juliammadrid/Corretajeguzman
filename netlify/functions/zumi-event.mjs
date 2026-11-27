// Whitelisted anonymous event ingestion. No text or contact fields are accepted.
const EVENTS=new Set(['conversation','message','call_attempt','call_connected','call_end','call_error','voice_latency','greeting_latency','search','search_empty','property_view','visit_sent','owner_sent','rental_sent','rental_open','quote_open','whatsapp_open']);
const SECTIONS=new Set(['home','arriendos','ventas','ficha','parcelas','proyectos','propietario','admin','corredor','solicitud','simulador']);
const COMMUNES=new Set(["Santiago (Centro)","Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Ñuñoa","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca","San Joaquín","San Miguel","San Ramón","Vitacura","Puente Alto","Pirque","San José de Maipo","San Bernardo","Buin","Calera de Tango","Paine","Talagante","El Monte","Isla de Maipo","Padre Hurtado","Peñaflor","Melipilla","Alhué","Curacaví","María Pinto","San Pedro","Colina","Lampa","Tiltil","Villarrica","Pucón","Concón","Temuco"]);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function clean(x){
 if(!x||!uuid.test(x.id||'')||!uuid.test(x.session_id||'')||!EVENTS.has(x.event)||!SECTIONS.has(x.section)||!['text','voice'].includes(x.channel))return null;
 return {id:x.id,session_id:x.session_id,event:x.event,section:x.section,channel:x.channel,commune:COMMUNES.has(x.commune)?x.commune:null,value:Number.isInteger(x.value)&&x.value>=0&&x.value<=300000?x.value:null};
}
export default async function handler(req){
 if(req.method!=='POST')return new Response(null,{status:405});
 if(req.headers.get('origin')!==new URL(req.url).origin)return new Response(null,{status:403});
 try{
  const raw=await req.text();if(raw.length>2048)return new Response(null,{status:413});
  const event=clean(JSON.parse(raw));if(!event)return new Response(null,{status:400});
  const result=await fetch('https://aoemvstjbwvkoqjoirsx.supabase.co/rest/v1/zumi_events',{method:'POST',headers:{apikey:'sb_publishable_W0jdkGh4ZfYsd-5C5WcHpA_vDDMEw2u','Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(event),signal:AbortSignal.timeout(4000)});
  return new Response(null,{status:result.ok?204:502,headers:{'cache-control':'no-store'}});
 }catch{return new Response(null,{status:400});}
}
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:120}};
