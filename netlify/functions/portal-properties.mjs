// Private property feed. No service-role key needed: identity/profile checked with caller JWT.
const env=k=>globalThis.Netlify?.env.get(k)||process.env[k];
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const pick=x=>x?.name??x;
// Only Airtable attachment hosts; never return arbitrary URLs from source data.
export function attachmentURL(value) {
  try {
    const u=new URL(value);
    return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
      /^(?:[a-z0-9-]+\.)*airtableusercontent\.com$/.test(u.hostname)?u.href:null;
  }catch{return null;}
}
export function commission(price,owner) {
  const normalized=String(pick(owner)??'').trim().replace(/\s/g,'');
  const percent=normalized==='50%'||normalized==='50'?50:normalized==='0%'||normalized==='0'?0:null;
  if(percent===null)return {comisionDueno:null,comisionPct:null,comision:null,comisionCorredor:null};
  const total=Number.isFinite(price)&&price>0?price*(50+percent)/100:null;
  return {comisionDueno:percent,comisionPct:50+percent,comision:total,comisionCorredor:total===null?null:total/2};
}
export function normalizeProperty(rec,uf) {
  const f=rec.fields||{}, original=Number(f['Precio valor']), currency=String(pick(f.Moneda)||'').toUpperCase();
  if(!Number.isFinite(original)||!(original>0)||!['UF','CLP'].includes(currency))return null;
  const title=String(f['Nombre de la propiedad']||'').trim();
  if(/por\s+d[ií]a|diari[oa]/i.test(title))return null;
  const state=String(pick(f.Estado)||'').toLowerCase();
  if(!['disponible','reservada','arrendada'].includes(state))return null;
  // A missing conversion must not hide the listing or become a zero-peso rent.
  const hasUF=Number.isFinite(uf)&&uf>30000&&uf<80000;
  const price=currency==='UF'?(hasUF?original*uf:null):original;
  const com=commission(price,f['Comisión dueño']);
  const nativeCommission=commission(original,f['Comisión dueño']);
  return {id:rec.id,titulo:title,comuna:String(f.Comuna||''),direccion:String(f['Direccion publica']||f['Dirección']||''),
    estado:state,precio:price,moneda:currency,precioOriginal:original,
    conversionPendiente:currency==='UF'&&!hasUF,
    comisionUF:currency==='UF'?nativeCommission.comision:null,
    descripcion:String(f['Descripción pública']||'').trim(),
    fotos:(Array.isArray(f.Fotos)?f.Fotos:[]).map(x=>attachmentURL(x?.url)).filter(Boolean),
    dorm:Number(f.Dormitorios)||0,banos:String(f['Baños']||'—'),estac:String(f.Estacionamiento||'—'),
    disponibleDesde:'Consultar',...com,
    notaInterna:com.comisionPct===null?'Comisión del dueño por confirmar.':`Arrendatario 50% + dueño ${com.comisionDueno}%. Corredor recibe 50% de la comisión total; Corretaje Guzmán recibe el otro 50%.${currency==='UF'&&!hasUF?' Equivalencia en pesos pendiente de UF actualizada.':''}`};
}
export function makeHandler({getEnv=env,fetcher=fetch}={}) {
 return async request=>{
  if(request.method!=='GET')return json({error:'Método no permitido'},405);
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer [^\s]+$/.test(authorization))return json({error:'Inicia sesión'},401);
  const url=getEnv('SUPABASE_URL')||'https://aoemvstjbwvkoqjoirsx.supabase.co';
  const key=getEnv('SUPABASE_PUBLISHABLE_KEY');
  if(!key)return json({error:'Conexión privada pendiente de configuración'},503);
  try {
   const headers={apikey:key,Authorization:authorization};
   const auth=await fetcher(url+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)});
   if(!auth.ok)return json({error:'Sesión inválida'},401);
   const user=await auth.json();if(!user.id)return json({error:'Sesión inválida'},401);
   const profileResponse=await fetcher(url+'/rest/v1/corredores?select=id,estado&user_id=eq.'+encodeURIComponent(user.id),{headers,signal:AbortSignal.timeout(8000)});
   if(!profileResponse.ok)return json({error:'No se pudo verificar la cuenta'},403);
   const profiles=await profileResponse.json();if(!profiles.some(p=>p.estado==='activa'))return json({error:'Cuenta sin acceso activo'},403);
   const token=getEnv('AIRTABLE_API_KEY')||getEnv('AIRTABLE_TOKEN');if(!token)return json({error:'Conexión de Airtable pendiente de configuración'},503);
   const base=getEnv('AIRTABLE_BASE_ID')||'appkG5ldIIHTVkXf6';
   const table=getEnv('AIRTABLE_RENT_TABLE_ID')||'tblOZztlu6qSLMAtc';
   const fields=['Nombre de la propiedad','Comuna','Direccion publica','Dirección','Precio valor','Moneda','Comisión dueño','Estado','Fotos','Descripción pública','Dormitorios','Baños','Estacionamiento'];
   let offset,records=[];const offsets=new Set();
   do {
     const endpoint=new URL(`https://api.airtable.com/v0/${base}/${table}`);
     fields.forEach(f=>endpoint.searchParams.append('fields[]',f));
     endpoint.searchParams.set('pageSize','100');if(offset)endpoint.searchParams.set('offset',offset);
     const response=await fetcher(endpoint,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});
     if(!response.ok)throw new Error('airtable');
     const page=await response.json();
     if(!Array.isArray(page.records))throw new Error('invalid records');
     records.push(...page.records);offset=page.offset;
     if(records.length>10000||offsets.size>=100)throw new Error('pagination limit');
     if(offset&&typeof offset!=='string')throw new Error('invalid offset');
     if(offset&&offsets.has(offset))throw new Error('pagination');offsets.add(offset);
   }while(offset);
   let uf=null,ufDate=null;
   if(records.some(r=>pick(r.fields.Moneda)==='UF')){
     try{
       const response=await fetcher('https://corretajeguzman.com/api/uf-actual',{signal:AbortSignal.timeout(4000)});
       const result=await response.json();
       if(response.ok&&Number.isFinite(result.value)&&result.value>30000&&result.value<80000){uf=result.value;ufDate=result.date;}
     }catch{/* UF is optional: keep native-currency listings when its service fails. */}
   }
   return json({properties:records.map(r=>normalizeProperty(r,uf)).filter(Boolean),uf,ufDate});
  }catch{return json({error:'No pudimos cargar las propiedades. Inténtalo nuevamente.'},502);}
 };
}
export default makeHandler();
