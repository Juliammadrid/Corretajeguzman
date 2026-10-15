// Advance by a complete card, including the scroll container's inset.
export function carouselTarget(centers, current, viewport, maximum, direction) {
  if (!centers.length) return 0;
  const targets=centers.map(center=>Math.max(0,Math.min(maximum,center-viewport/2)));
  let nearest=0;
  targets.forEach((target,i)=>{if(Math.abs(target-current)<Math.abs(targets[nearest]-current))nearest=i;});
  return targets[Math.max(0,Math.min(targets.length-1,nearest+direction))];
}
export function moveCarousel(row,direction){
  if(!row)return;
  const rect=row.getBoundingClientRect();
  const centers=[...row.children].map(card=>{const r=card.getBoundingClientRect();return r.left-rect.left+row.scrollLeft+r.width/2;});
  row.scrollTo({left:carouselTarget(centers,row.scrollLeft,row.clientWidth,row.scrollWidth-row.clientWidth,direction),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
let savedY=null;
export function lockPage(){
  if(savedY!==null)return;
  savedY=window.scrollY;
  Object.assign(document.body.style,{position:'fixed',top:`-${savedY}px`,left:'0',right:'0',width:'100%',overflow:'hidden'});
}
export function unlockPage(){
  if(savedY===null)return;
  const y=savedY;savedY=null;
  for(const key of ['position','top','left','right','width','overflow'])document.body.style[key]='';
  window.scrollTo(0,y);
}
