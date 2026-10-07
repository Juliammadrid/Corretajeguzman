import {esc,priceText,propertyPath,isPublic,isAvailable} from './seo-core.mjs';
export const homeImage=src=>src.startsWith('/assets/')?'/.netlify/images?url='+encodeURIComponent(src)+'&w=800&q=80&fm=webp':src;
export const homeProperties=rows=>(rows||[]).filter(p=>p.id&&isPublic(p)&&isAvailable(p)&&p.activa!==false&&!/rentando/i.test(p.source||''));
export const isDailyRental=p=>/arriendo\s+diario|por\s+d[ií]a/i.test(p.title||'');
export function summaryProperty(p){
 const keys=['id','source','operation','title','commune','priceValue','currency','bedrooms','bathrooms','usableArea','propertyType','status','promo','photoKey'];
 return {...Object.fromEntries(keys.filter(k=>p[k]!=null).map(k=>[k,p[k]])),coverPhoto:p.cardPhoto||p.coverPhoto||p.photos?.[0]||''};
}
export function rentalCard(p,index=0){
 const promo=/50\s*%/.test(p.promo||''), price=promo?p.priceValue/2:p.priceValue;
 const img=p.coverPhoto;
 const photo=img?'<img src="'+esc(homeImage(img))+'" data-original="'+esc(img)+'" onerror="this.onerror=null;this.src=this.dataset.original" alt="'+esc(p.title)+'" width="640" height="420" loading="'+(index<3?'eager':'lazy')+'" decoding="async">':'<span class="rental-photo-pending" style="display:grid;place-items:center;height:100%;font-size:14px">Fotos por actualizar</span>';
 return '<a class="ac" href="'+esc(propertyPath(p))+'"><div class="ph">'+photo+(promo?'<span class="promo">50% primer mes</span>':'')+'</div><div class="bd"><div class="pr">'+esc(priceText({...p,priceValue:price}))+' <small>'+(isDailyRental(p)?'/ día':promo?'1er mes':'/ mes')+'</small></div><h3>'+esc(p.title)+'</h3><span class="cm"><i data-lucide="map-pin" class="ico"></i>'+esc(p.commune)+'</span><div class="sp"><span><i data-lucide="bed-double" class="ico"></i>'+esc(p.bedrooms??'—')+' dorm</span><span><i data-lucide="bath" class="ico"></i>'+esc(p.bathrooms??'—')+' baño'+(p.bathrooms>1?'s':'')+'</span>'+(p.usableArea?'<span><i data-lucide="ruler" class="ico"></i>'+esc(p.usableArea)+' m²</span>':'')+'</div></div></a>';
}
// Compare monthly rents in one currency, while displaying each original CLP/UF price.
export function selectHomeRentals(rows,ufValue){
 const uf=Number(ufValue);
 const price=p=>Number(p.priceValue)*(['UF','CLF'].includes(String(p.currency).toUpperCase())?(uf>0?uf:NaN):1);
 const seen=new Set();
 const sorted=homeProperties(rows).filter(p=>p.operation==='arriendo'&&!isDailyRental(p)&&Number.isFinite(price(p))&&price(p)>0&&!seen.has(p.id)&&seen.add(p.id))
  .sort((a,b)=>price(a)-price(b)||String(a.id).localeCompare(String(b.id)));
 return sorted.length<=8?sorted:[...sorted.slice(0,4),...sorted.slice(-4)];
}
export const rentalCards=(rows,ufValue)=>selectHomeRentals(rows,ufValue).map(rentalCard).join('');
export function projectCards(projects){
 const badges={inmediata:['Entrega inmediata','#1f8a5b'],futura:['Entrega futura','#5b7088'],verde:['Venta en verde','#7c3aed'],ultimas:['Últimas unidades','#c0182a']};
 return [...projects].sort((a,b)=>(a.entrega==='inmediata'?0:1)-(b.entrega==='inmediata'?0:1)||a.desdeUF-b.desdeUF).slice(0,10).map(p=>{
 const badge=badges[p.entrega];
 return '<a class="pc" href="'+esc(p.detalle)+'"><div class="ph"><img src="'+esc(homeImage(p.image))+'" data-original="'+esc(p.image)+'" onerror="this.onerror=null;this.src=this.dataset.original" alt="'+esc(p.name)+'" width="640" height="420" loading="lazy" decoding="async">'+(badge?'<span class="bdg" style="background:'+badge[1]+'">'+badge[0]+'</span>':'')+'</div><div class="bd"><h3>'+esc(p.name)+'</h3><span class="cm">'+esc(p.commune)+'</span><div class="uf">Desde UF '+new Intl.NumberFormat('es-CL').format(p.desdeUF)+'</div></div></a>';
 }).join('');
}
