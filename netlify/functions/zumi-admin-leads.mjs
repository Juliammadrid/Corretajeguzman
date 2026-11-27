const SB='https://aoemvstjbwvkoqjoirsx.supabase.co',KEY="sb_publishable_W0jdkGh4ZfYsd-5C5WcHpA_vDDMEw2u";
const sources=[{kind:'Arriendo',table:'tblZE0MIc1SynvJlF',env:'AIRTABLE_LEADS_TABLE_ID',fields:['Nombre','Comunas de interés','Presupuesto arriendo','Fecha de cambio','Estado lead','Fecha de envío']},{kind:'Propietario',table:'tblyfQhZbSoaaVztd',env:'AIRTABLE_OWNERS_TABLE_ID',fields:['Nombre','Comuna','Valor arriendo estimado','Plan de interés','Estado','Origen','Fecha de envío']}];
export default async function handler(req){
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private,no-store'}});
 if(req.method!=='GET')return reply({},405);
 const auth=req.headers.get('authorization')||'';if(!/^Bearer [A-Za-z0-9._-]+$/.test(auth)||auth.length>5000)return reply({},401);
 try{
 const headers={apikey:KEY,Authorization:auth},u=await fetch(SB+'/auth/v1/user',{headers,signal:AbortSignal.timeout(4000)});
 if(!u.ok)return reply({},401);const user=await u.json();if(!/^[a-f0-9-]{36}$/i.test(user.id||''))return reply({},401);
 const pr=await fetch(SB+'/rest/v1/corredores?select=rol,estado&user_id=eq.'+encodeURIComponent(user.id),{headers,signal:AbortSignal.timeout(4000)});
 if(!pr.ok||!(await pr.json()).some(x=>x.rol==='admin'&&x.estado==='activa'))return reply({},403);
 const token=process.env.AIRTABLE_API_KEY||process.env.AIRTABLE_TOKEN,base=process.env.AIRTABLE_BASE_ID||'appkG5ldIIHTVkXf6';if(!token)return reply({},503);
 const groups=await Promise.all(sources.map(async s=>{try{
 const table=process.env[s.env]||s.table,q=new URLSearchParams({maxRecords:'25',pageSize:'25','sort[0][field]':'Fecha de envío','sort[0][direction]':'desc'});s.fields.forEach(f=>q.append('fields[]',f));
 const r=await fetch('https://api.airtable.com/v0/'+encodeURIComponent(base)+'/'+encodeURIComponent(table)+'?'+q,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();
 const a=await r.json();return {kind:s.kind,records:(a.records||[]).map(r=>({name:r.fields.Nombre||'',kind:s.kind,commune:r.fields['Comunas de interés']||r.fields.Comuna||'',amount:r.fields['Presupuesto arriendo']??r.fields['Valor arriendo estimado']??null,detail:r.fields['Fecha de cambio']||r.fields['Plan de interés']||'',status:r.fields['Estado lead']||r.fields.Estado||'Sin estado',source:r.fields.Origen||'No registrado',date:r.fields['Fecha de envío']||r.createdTime,link:'https://airtable.com/'+encodeURIComponent(base)+'/'+encodeURIComponent(table)+'/'+encodeURIComponent(r.id)}))};
 }catch{return {kind:s.kind,error:true,records:[]};}}));return reply({groups});
 }catch{return reply({error:'No se pudo consultar Airtable'},502);}
}
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:20}};
