// Katty — Chilean TTS. No API key in the browser. Keep the existing voice if unavailable.
const VOICE='rydssQ600JSAmdsCmuQu';
const json=(status,data)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
export default async function handler(req){
  const key=process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_api_key;
  if(req.method==='GET')return json(200,{configured:!!key,voice:'Katty'});
  if(req.method!=='POST')return json(405,{error:'method'});
  if(req.headers.get('origin')!==new URL(req.url).origin)return json(403,{error:'origin'});
  if(!key)return json(503,{error:'voice_unavailable'});
  if(!/^application\/json/i.test(req.headers.get('content-type')||''))return json(415,{error:'type'});
  if(Number(req.headers.get('content-length'))>5000)return json(413,{error:'length'});
  let raw;try{raw=await req.text();if(raw.length>5000)return json(413,{error:'length'});}catch{return json(400,{error:'body'});}
  let body;try{body=JSON.parse(raw);}catch{return json(400,{error:'json'});}
  const text=typeof body.text==='string'?body.text.trim():'';
  if(!text||text.length>650)return json(400,{error:'text'});
  try{
    const upstream=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+VOICE+'?output_format=mp3_44100_64',{
      method:'POST',headers:{'xi-api-key':key,'content-type':'application/json',accept:'audio/mpeg'},
      body:JSON.stringify({text,model_id:'eleven_flash_v2_5',language_code:'es',voice_settings:{stability:0.55,similarity_boost:0.8,speed:0.98}}),
      signal:AbortSignal.timeout(8000)
    });
    if(!upstream.ok){console.warn('zumi-tts provider status',upstream.status);return json(upstream.status===429?429:503,{error:'voice_unavailable'});}
    if(!upstream.body)return json(503,{error:'voice_unavailable'});
    return new Response(upstream.body,{headers:{'content-type':'audio/mpeg','cache-control':'no-store','x-content-type-options':'nosniff'}});
  }catch{return json(503,{error:'voice_unavailable'});}
}
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:6}};
