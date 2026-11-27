// Synchronize public canonical property URLs to Airtable; never touch calendar.
import { SITE, propertyPath, isPublic, isAvailable } from '../../seo-core.mjs';
import { normalize } from './properties.mjs';
const env = k => globalThis.Netlify?.env.get(k) || process.env[k];
const base = env('AIRTABLE_BASE_ID') || 'appkG5ldIIHTVkXf6';
const tables = [
 {id:env('AIRTABLE_RENT_TABLE_ID')||'tblOZztlu6qSLMAtc',operation:'arriendo',field:'Link de la web'},
 {id:env('AIRTABLE_SALE_TABLE_ID')||'tblB67Zm9zxDlFwY7',operation:'venta',field:'Link sitio web'}
];
export async function syncLinks({fetcher=fetch,token=env('AIRTABLE_API_KEY')||env('AIRTABLE_TOKEN'),maxWrites=10}={}) {
 if(!token) throw Error('Missing Airtable token');
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const report={updated:0,unchanged:0,skipped:0,errors:0};
 for(const table of tables){
  const endpoint='https://api.airtable.com/v0/'+base+'/'+encodeURIComponent(table.id);
  let offset;
  do {
   const list=new URL(endpoint);list.searchParams.set('pageSize','100');
   if(offset)list.searchParams.set('offset',offset);
   const res=await fetcher(list,{headers,signal:AbortSignal.timeout(8000)});
   if(!res.ok)throw Error('Airtable read '+res.status);
   const data=await res.json();offset=data.offset;
   const changes=[];
   for(const rec of data.records||[]){
    const p=normalize(rec,table.operation);
    if(!/^rec[A-Za-z0-9]{14}$/.test(p.id)||!isPublic(p)||!isAvailable(p)||!p.commune||!p.priceValue){report.skipped++;continue;}
    const target=SITE+propertyPath(p);
    if(rec.fields?.[table.field]===target){report.unchanged++;continue;}
    if(report.updated+changes.length>=maxWrites)break;
    changes.push({id:p.id,fields:{[table.field]:target},target});
   }
   // Check the actual public page and its canonical tag, not just HTTP 200.
   const verified=[];
   for(let i=0;i<changes.length;i+=4){
    await Promise.all(changes.slice(i,i+4).map(async change=>{
     try{
      const page=await fetcher(change.target,{redirect:'follow',signal:AbortSignal.timeout(5000)});
      const html=page.ok?await page.text():'';
      const canonical=html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0]?.match(/\bhref=["']([^"']+)["']/i)?.[1];
      if(page.ok&&canonical===change.target)verified.push({id:change.id,fields:change.fields});
      else report.errors++;
     }catch{report.errors++;}
    }));
   }
   if(verified.length){
    const write=await fetcher(endpoint,{method:'PATCH',headers,body:JSON.stringify({records:verified}),signal:AbortSignal.timeout(8000)});
    if(!write.ok)throw Error('Airtable write '+write.status);
    report.updated+=(await write.json()).records?.length||0;
   }
   if(report.updated>=maxWrites)break;
  }while(offset);
  if(report.updated>=maxWrites)break;
 }
 return report;
}
export default async function handler(){
 try{const report=await syncLinks();console.log('Property link sync',JSON.stringify(report));return new Response(JSON.stringify(report),{status:report.errors?502:200});}
 catch(error){console.error('Property link sync failed',error.message);return new Response('Sync failed',{status:502});}
}
export const config={schedule:'*/15 * * * *'};
