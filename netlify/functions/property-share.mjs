// Compatibility endpoint only. Public property URLs are rendered by the Edge function.
export default async function handler(request) {
 const url=new URL(request.url), id=url.searchParams.get('id')||url.searchParams.get('path')?.match(/(rec[a-zA-Z0-9]{14})/)?.[1];
 if(!/^rec[a-zA-Z0-9]{14}$/.test(id||''))return new Response('Propiedad no encontrada',{status:404});
 return new Response(null,{status:301,headers:{Location:'/propiedad?id='+encodeURIComponent(id),'Cache-Control':'public, max-age=120'}});
}
