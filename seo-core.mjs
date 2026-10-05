// Shared, dependency-free SEO rendering. Same content for visitors and crawlers.
export const SITE = 'https://corretajeguzman.com';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
export const slugify = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/&/g,' y ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90) || 'propiedad';
export const propertyPath = p => '/propiedad/' + slugify([p.operation==='venta'?'venta':'arriendo',p.propertyType||'propiedad',p.title||'',p.commune||''].filter(Boolean).join(' ')) + '-' + encodeURIComponent(p.id);
export const isAvailable = p => !/(arrendad[oa]|vendid[oa]|no disponible|borrador|inactiv[oa]|retirad[oa]|reservad[oa]|ocult[oa])/i.test(String(p.status || ''));
export const isPublic = p => !/(borrador|privad|ocult|inactiv|eliminad)/i.test(String(p.status || ''));
export const isIndexable = p => isPublic(p) && isAvailable(p) && p.id && p.title && p.commune && p.priceValue > 0;
export const availableProperties = properties => properties.filter(p => isPublic(p) && isAvailable(p));
export function lastmod(value) {
  const v=String(value||'');
  if(!/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(v))return '';
  const d=new Date(v);
  return Number.isFinite(+d) && d <= new Date() && d.toISOString().slice(0,10)===v.slice(0,10) ? d.toISOString() : '';
}
export const TYPES = {departamentos:'Departamento',casas:'Casa',oficinas:'Oficina',locales:'Local',parcelas:'Parcela',estudios:'Estudio'};
// Only two levels, with at least two available properties; no arbitrary filter combinations.
export function landingPages(properties) {
  const groups=new Map();
  for(const p of properties.filter(isIndexable)) {
    const base=p.operation==='venta'?'/comprar':'/arriendos';
    const commune=slugify(p.commune);
    const type=Object.keys(TYPES).find(k=>TYPES[k]===p.propertyType);
    const paths=[[base+'/'+commune,''], ...(type?[[base+'/'+commune+'/'+type,type]]:[])];
    for(const [path,typeSlug] of paths) {
      if(!groups.has(path))groups.set(path,{path,commune:p.commune,operation:p.operation,type:typeSlug,properties:[]});
      groups.get(path).properties.push(p);
    }
  }
  return [...groups.values()].filter(g=>g.properties.length>=2&&(!g.type||g.properties.length<(groups.get(g.path.slice(0,g.path.lastIndexOf('/')))?.properties.length||0)));
}
export const businessSchema = {'@type':'RealEstateAgent','@id':SITE+'/#organization',name:'Corretaje Guzmán',url:SITE+'/',telephone:'+56944637680',email:'contacto@corretajeguzman.com',address:{'@type':'PostalAddress',streetAddress:'Av. Manquehue Sur 350, of. 201',addressLocality:'Las Condes',addressCountry:'CL'}};
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
  const available=isIndexable(p);
  return {title:p.title+' | '+(p.operation==='venta'?'Venta':'Arriendo')+' | Corretaje Guzmán',description,url,image,robots:available?'index,follow,max-image-preview:large':'noindex,follow',schema:{'@context':'https://schema.org','@graph':[
    {'@type':'RealEstateListing','@id':url+'#listing',name:p.title,url,description,image,mainEntity:{'@type':p.propertyType==='Casa'?'House':p.propertyType==='Departamento'?'Apartment':'Place',name:p.title,address:{'@type':'PostalAddress',streetAddress:p.address||'',addressLocality:p.commune||'',addressCountry:'CL'},...(p.bedrooms!=null?{numberOfBedrooms:p.bedrooms}:{}),...(p.usableArea?{floorSize:{'@type':'QuantitativeValue',value:p.usableArea,unitCode:'MTK'}}:{})},...(p.priceValue>0?{offers:{'@type':'Offer',url,price:p.priceValue,priceCurrency:p.currency==='UF'?'CLF':'CLP',availability:'https://schema.org/'+(available?'InStock':'OutOfStock'),businessFunction:p.operation==='arriendo'?'http://purl.org/goodrelations/v1#LeaseOut':'http://purl.org/goodrelations/v1#Sell'}}:{})},
    businessSchema,
    breadcrumbs([['Inicio','/'],[p.operation==='venta'?'Propiedades en venta':'Arriendos',p.operation==='venta'?'/comprar':'/arriendos'],[p.title,url]])
  ]}};
}

export function enrichedPropertySeo(p) {
  const seo=propertySeo(p), listing=seo.schema['@graph'][0], entity=listing.mainEntity;
  entity['@id']=seo.url+'#property';
  if(entity['@type']==='Place')delete entity.numberOfBedrooms;
  if(p.bathrooms!=null&&entity['@type']!=='Place')entity.numberOfBathroomsTotal=p.bathrooms;
  if(Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180)entity.geo={'@type':'GeoCoordinates',latitude:p.latitude,longitude:p.longitude};
  if(typeof p.petsAllowed==='boolean')entity.petsAllowed=p.petsAllowed;
  entity.amenityFeature=(p.features||[]).map(name=>({'@type':'LocationFeatureSpecification',name,value:true}));
  if(p.parking!=null)entity.amenityFeature.push({'@type':'LocationFeatureSpecification',name:'Estacionamientos',value:p.parking});
  if(!entity.amenityFeature.length)delete entity.amenityFeature;
  const modified=lastmod(p.updatedAt);if(modified)listing.dateModified=modified;
  listing.description=p.description||seo.description;
  listing.publisher={'@id':SITE+'/#organization'};
  return seo;
}

export function similarProperties(properties,p) {
  const price=q=>q.currency===p.currency?Math.abs(q.priceValue-p.priceValue)/Math.max(p.priceValue,1):2;
  return availableProperties(properties).filter(q=>q.id!==p.id&&q.operation===p.operation)
    .sort((a,b)=>((a.commune!==p.commune)*10+(a.propertyType!==p.propertyType)*3+price(a))-((b.commune!==p.commune)*10+(b.propertyType!==p.propertyType)*3+price(b))).slice(0,3);
}

export function cardMarkup(p) {
  const stats=[[p.bedrooms,'dormitorios'],[p.bathrooms,'baños'],[p.usableArea,'m² útiles']].filter(([v])=>v!=null).map(([v,k])=>'<span class="f">'+esc(v+' '+k)+'</span>').join('');
  return '<a class="pcardm" data-id="'+esc(p.id)+'" href="'+esc(propertyPath(p))+'"><div class="ph">'+(p.coverPhoto?'<img src="'+esc(p.coverPhoto)+'" alt="'+esc(p.title+' · '+p.commune)+'" loading="lazy">':'')+'<span class="tag">'+(p.operation==='venta'?'En venta':'En arriendo')+'</span></div><div class="bd"><div class="pr">'+esc(priceText(p))+'</div><div class="ti">'+esc(p.title)+'</div><div class="ad">'+esc(p.address||p.commune)+'</div><div class="ft">'+stats+'</div></div></a>';
}

export function sitemap(properties,kind='properties') {
  const rows=kind==='landings'?landingPages(properties).map(g=>({url:SITE+g.path,updatedAt:g.properties.map(p=>lastmod(p.updatedAt)).filter(Boolean).sort().at(-1)})):properties.filter(isIndexable).map(p=>({url:SITE+propertyPath(p),updatedAt:p.updatedAt,image:p.coverPhoto}));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+rows.map(r=>'<url><loc>'+esc(r.url)+'</loc>'+(lastmod(r.updatedAt)?'<lastmod>'+lastmod(r.updatedAt)+'</lastmod>':'')+(r.image?'<image:image><image:loc>'+esc(r.image)+'</image:loc></image:image>':'')+'</url>').join('\n')+'</urlset>';
}
