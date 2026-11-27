export default async function handler(req){
 if(req.method!=='GET')return new Response(null,{status:405});
 const token=process.env.ZUMI_BRIDGE_TOKEN;if(!token)return new Response(null,{status:503});
 try{const r=await fetch('https://aoemvstjbwvkoqjoirsx.supabase.co/functions/v1/zumi-asistente',{method:'POST',headers:{'x-zumi-bridge':token,'Content-Type':'application/vnd.cg.zumi-control+json'},body:'{}',signal:AbortSignal.timeout(4000)});
 if(!r.ok)return new Response(null,{status:503});const c=await r.json();
 return Response.json({greeting:c.greeting,tone:c.tone,voice:c.voice,max_call_seconds:c.max_call_seconds,calls_enabled:c.calls_enabled,analytics_enabled:c.analytics_enabled,revision:c.revision},{headers:{'cache-control':'public,max-age=0,s-maxage=15'}});
 }catch{return new Response(null,{status:503});}
}
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:60}};
