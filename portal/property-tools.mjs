const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function materialButtons(p){
  return '<div class="property-tools"><button class="btn btn-g btn-sm" data-photos="'+escapeHTML(p.id)+'" '+(p.fotos?.length?'':'disabled')+'><i data-lucide="images" class="ico"></i>Descargar fotos</button><button class="btn btn-g btn-sm" data-description="'+escapeHTML(p.id)+'" '+(p.descripcion?'':'disabled')+'><i data-lucide="file-text" class="ico"></i>Descripción</button></div>';
}
function modal(title){
  const d=document.createElement('dialog');d.className='materials-dialog';
  d.innerHTML='<div class="materials-head"><h2 id="materials-title">'+escapeHTML(title)+'</h2><button class="btn btn-g btn-sm" aria-label="Cerrar">✕</button></div><div class="materials-body"></div>';
  d.setAttribute('aria-labelledby','materials-title');document.body.append(d);
  d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',()=>d.remove(),{once:true});
  d.showModal();return d;
}
function download(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function canSharePhotos(files,nav=navigator){
  try{return !!nav.share&&!!nav.canShare?.({files});}catch{return false;}
}
export async function savePhotos(files,{nav=navigator,save=download}={}){
  // Called directly by the ready button: Web Share needs a fresh user gesture.
  if(canSharePhotos(files,nav)){await nav.share({files});return 'shared';}
  for(const file of files)save(file,file.name);
  return 'downloads';
}
export function installPropertyTools({getProperty,refreshProperties}){
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-photos],[data-description]');if(!button||button.disabled)return;
    event.stopPropagation();event.preventDefault();
    const id=button.dataset.photos||button.dataset.description,p=getProperty(id);
    const d=modal(button.dataset.photos?'Fotos para publicar':'Descripción para publicar'),body=d.querySelector('.materials-body');
    const controller=new AbortController();d.addEventListener('close',()=>controller.abort(),{once:true});
    try{
      const {preparePhotos}=await import('./property-materials.mjs');
      if(!d.open)return;
      if(button.dataset.description){
        body.innerHTML='<p>'+escapeHTML(p.titulo)+'</p><label for="public-description">Texto público de Airtable · listo para copiar</label><textarea id="public-description" readonly></textarea><div class="materials-actions"><button class="btn btn-p" data-copy>Copiar descripción</button></div><p role="status" class="mnote"></p>';
        const area=body.querySelector('textarea');area.value=p.descripcion||'';
        body.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(area.value);body.querySelector('[role=status]').textContent='Descripción copiada.';}catch{area.focus();area.select();body.querySelector('[role=status]').textContent='Selecciona Copiar en el menú de tu dispositivo o usa Ctrl+C.';}};
        return;
      }
      body.innerHTML='<p>'+escapeHTML(p.titulo)+'</p><p role="status" aria-live="polite">Preparando todas las fotos…</p><p class="mnote">Se conservan las fotos originales, sin reducir su calidad.</p>';
      const status=body.querySelector('[role=status]');
      // Attachment URLs expire. Obtain a fresh authenticated feed on every download.
      const fresh=(await refreshProperties()).find(x=>x.id===id);
      if(!fresh)throw new Error('Esta propiedad ya no está disponible en la cartera.');
      if(!d.open)return;
      const files=await preparePhotos(fresh,{signal:controller.signal,onProgress:(n,total)=>status.textContent='Preparando fotos: '+n+' de '+total});
      if(!d.open)return;
      status.textContent=files.length+' fotos listas para descargar.';
      const actions=document.createElement('div');actions.className='materials-actions';
      const nativeFiles=files.map(f=>new File([f.data],f.name,{type:f.type}));
      const save=document.createElement('button');save.className='btn btn-p';save.textContent=canSharePhotos(nativeFiles)?'Guardar / compartir fotos':'Descargar fotos individuales';
      save.onclick=async()=>{save.disabled=true;try{const result=await savePhotos(nativeFiles);status.textContent=result==='shared'?'Fotos entregadas al menú de tu dispositivo.':'Descargas solicitadas. Si el navegador bloquea varias, utiliza los botones individuales.';}catch(e){status.textContent=e.name==='AbortError'?'Operación cancelada. Puedes intentarlo nuevamente.':'No se pudieron compartir. Puedes descargar cada foto abajo.';}finally{save.disabled=false;}};
      actions.append(save);
      const note=document.createElement('p');note.className='mnote';note.textContent='Fotos originales, sin ZIP. En el menú de tu teléfono elige Guardar imágenes o Fotos si está disponible. Según el navegador, las descargas pueden quedar en Archivos o Descargas; el portal no puede guardarlas automáticamente en la galería.';
      const individual=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('div');summary.textContent='Guardar una foto a la vez';list.className='materials-actions';
      nativeFiles.forEach((file,i)=>{const one=document.createElement('button');one.className='btn btn-g btn-sm';one.textContent='Foto '+(i+1);one.onclick=()=>download(file,file.name);list.append(one);});
      individual.append(summary,list);body.append(actions,note,individual);
    }catch(error){if(d.open){const p=document.createElement('p');p.setAttribute('role','alert');p.textContent=error.message||'No se pudo preparar la descarga. Inténtalo otra vez.';body.append(p);}}
  },true);
}
