export const FALLBACK_IMAGE='/assets/home-apartamento.jpg';
export function projectImage(project){
  const image=String(project?.image||'');
  return /^\/assets\/[a-zA-Z0-9_./%-]+\.(?:jpe?g|png|webp|avif)$/i.test(image)&&!image.includes('..')?image:FALLBACK_IMAGE;
}
export function installProjectImageFallback(){
  document.addEventListener('error',event=>{
    const img=event.target;
    if(!img?.matches?.('img[data-project-image]'))return;
    if(img.dataset.fallbackUsed){const replacement=document.createElement('span');replacement.className='project-image-unavailable';replacement.textContent='Sin foto';replacement.setAttribute('aria-label','Imagen no disponible');img.replaceWith(replacement);return;}
    img.dataset.fallbackUsed='true';img.src=FALLBACK_IMAGE;
  },true);
}
