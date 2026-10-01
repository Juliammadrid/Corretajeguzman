// Shared, dependency-free SEO rendering. Same content for visitors and crawlers.
export const SITE = 'https://corretajeguzman.com';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
export const slugify = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/&/g,' y ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90) || 'propiedad';
export const propertyPath = p => '/propiedad/' + slugify([p.operation==='venta'?'venta':'arriendo',p.propertyType||'propiedad',p.title||'',p.commune||''].filter(Boolean).join(' ')) + '-' + encodeURIComponent(p.id);
export const isAvailable = p => !/(arrendad[oa]|vendid[oa]|no disponible|borrador|inactiv[oa]|retirad[oa]|reservad[oa]|ocult[oa])/i.test(String(p.status || ''));
export const absolute = value => new URL(value || '/assets/guzman-logo.jpg', SITE).href;
export const priceText = p => (p.currency==='UF'?'UF ':'$') + new Intl.NumberFormat('es-CL').format(p.priceValue || 0);
export function element(html, id, content) {
  const pattern = new RegExp('(<([a-z][a-z0-9]*)\\b[^>]*\\bid="'+id+'"[^>]*>)[\\s\\S]*?(</\\2>)','i');
  return html.replace(pattern, (_,open,tag,close) => open + content + close);
}
export function head(html, {title,description,url,image,schema,robots='index,follow,max-image-preview:large',project=false}) {
  html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(title)+'</title>');
  const metas={'description':description,'robots':robots,'og:type':'website','og:site_name':'Corretaje Guzmán','og:locale':'es_CL','og:title':title,'og:description':description,'og:url':url,'og:image':image,'og:image:secure_url':image,'og:image:alt':title,'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image};
  const tags=[];
  for(const [key,value] of Object.entries(metas)){
    const re=new RegExp('<meta\\b(?=[^>]*(?:name|property)=["\']'+key+'["\'])[^>]*>','gi');
    const old=html.match(re)?.[0];const id=old?.match(/\bid="([^"]+)"/)?.[1];
    html=html.replace(re,'');
    tags.push('<meta '+(key.startsWith('og:')?'property':'name')+'="'+key+'"'+(id?' id="'+id+'"':'')+' content="'+esc(value)+'">');
  }
  html=html.replace(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/gi,'');
  html=html.replace(/<script\b[^>]*(?:data-seo-schema|data-project-schema)[^>]*>[\s\S]*?<\/script>/gi,'');
  tags.push('<link rel="canonical" id="canonical" href="'+esc(url)+'">');
  if(schema)tags.push('<script type="application/ld+json" data-seo-schema'+(project?' data-project-schema':'')+'>'+json(schema)+'</script>');
  return html.replace('</head>',tags.join('\n')+'\n</head>');
}
export function breadcrumbs(items) {
  return {'@type':'BreadcrumbList',itemListElement:items.map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item:absolute(item)}))};
}
export function propertySeo(p) {
  const url=SITE+propertyPath(p),image=absolute(p.coverPhoto);
  const description=[p.title,p.operation==='venta'?'En venta':'En arriendo',p.commune,p.bedrooms!=null?p.bedrooms+' dormitorios':'',p.bathrooms!=null?p.bathrooms+' baños':'',p.priceValue?priceText(p):''].filter(Boolean).join(' · ')+'. Fotos y visitas con Corretaje Guzmán.';
  const available=isAvailable(p);
  return {title:p.title+' | '+(p.operation==='venta'?'Venta':'Arriendo')+' | Corretaje Guzmán',description,url,image,robots:available?'index,follow,max-image-preview:large':'noindex,follow',schema:{'@context':'https://schema.org','@graph':[
    {'@type':'RealEstateListing','@id':url+'#listing',name:p.title,url,description,image,mainEntity:{'@type':p.propertyType==='Casa'?'House':p.propertyType==='Departamento'?'Apartment':'Place',name:p.title,address:{'@type':'PostalAddress',streetAddress:p.address||'',addressLocality:p.commune||'',addressCountry:'CL'},...(p.bedrooms!=null?{numberOfBedrooms:p.bedrooms}:{}),...(p.usableArea?{floorSize:{'@type':'QuantitativeValue',value:p.usableArea,unitCode:'MTK'}}:{})},...(p.priceValue>0?{offers:{'@type':'Offer',url,price:p.priceValue,priceCurrency:p.currency==='UF'?'CLF':'CLP',availability:'https://schema.org/'+(available?'InStock':'OutOfStock'),businessFunction:p.operation==='arriendo'?'http://purl.org/goodrelations/v1#LeaseOut':'http://purl.org/goodrelations/v1#Sell'}}:{})},
    breadcrumbs([['Inicio','/'],[p.operation==='venta'?'Propiedades en venta':'Arriendos',p.operation==='venta'?'/comprar':'/arriendos'],[p.title,url]])
  ]}};
}
