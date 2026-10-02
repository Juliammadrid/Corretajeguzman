/* Visor compartido, limitado a las plantas: no modifica las galerías. */
(function(){
  const selector='#tpImg, .sim-tipo img, .cz-tipo .pl img, #sumPlan img';
  let dialog, image, trigger, previousOverflow, enlarged=false;
  function ensure(){
    if(dialog)return;
    const style=document.createElement('style');
    style.textContent=`
      #cg-planta-visor{position:fixed;inset:0;margin:auto;padding:0;border:0;border-radius:14px;width:96vw;max-width:1600px;height:94dvh;max-height:94dvh;background:#fff;color:#191321;overflow:hidden;box-sizing:border-box}
      #cg-planta-visor::backdrop{background:rgba(20,15,30,.88)}
      #cg-planta-visor .pv-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #e5dff0;min-height:64px;box-sizing:border-box}
      #cg-planta-visor .pv-title{margin:0;font:600 14px/1.4 system-ui;min-width:0;overflow-wrap:anywhere}
      #cg-planta-visor .pv-actions{display:flex;gap:8px;flex-shrink:0}
      #cg-planta-visor button{cursor:pointer;border:1px solid #e5dff0;border-radius:8px;background:#fff;color:#6725c5;padding:10px;font:600 14px system-ui;min-height:44px}
      #cg-planta-visor .pv-scroll{height:calc(100% - 90px);overflow:auto;overscroll-behavior:contain;background:white}
      #cg-planta-visor img{display:block;margin:auto;width:100%;height:100%;object-fit:contain;max-width:none}
      #cg-planta-visor .pv-scroll.zoom img{width:200%;height:auto;min-height:100%;margin:0}
      ${selector}{cursor:zoom-in}
      ${selector.split(',').map(s=>s.trim()+':focus-visible').join(',')}{outline:3px solid #7c3aed;outline-offset:4px}
      @media(max-width:480px){#cg-planta-visor .pv-head{padding:8px;gap:6px}.pv-title{font-size:12px!important}}
    `;
    document.head.appendChild(style);
    dialog=document.createElement('dialog');dialog.id='cg-planta-visor';dialog.setAttribute('aria-labelledby','pvTitle');
    dialog.innerHTML='<div class="pv-head"><p class="pv-title" id="pvTitle"></p><div class="pv-actions"><button type="button" id="pvZoom" aria-pressed="false">Ampliar +</button><button type="button" id="pvClose" aria-label="Cerrar planta ampliada">Cerrar ×</button></div></div><div class="pv-scroll"><img alt=""></div>';
    document.body.appendChild(dialog);image=dialog.querySelector('img');
    dialog.querySelector('#pvClose').onclick=()=>dialog.close();
    dialog.querySelector('#pvZoom').onclick=()=>{
      enlarged=!enlarged;dialog.querySelector('.pv-scroll').classList.toggle('zoom',enlarged);
      const b=dialog.querySelector('#pvZoom');b.textContent=enlarged?'Ajustar −':'Ampliar +';b.setAttribute('aria-pressed',String(enlarged));
    };
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;trigger?.focus({preventScroll:true});});
  }
  function open(img){
    if(!img.getAttribute('src'))return;
    ensure();trigger=img;previousOverflow=document.body.style.overflow;
    image.src=img.currentSrc||img.src;image.alt=img.alt||'Planta de la tipología';
    dialog.querySelector('#pvTitle').textContent=image.alt;
    enlarged=false;dialog.querySelector('.pv-scroll').classList.remove('zoom');
    const zoom=dialog.querySelector('#pvZoom');zoom.textContent='Ampliar +';zoom.setAttribute('aria-pressed','false');
    document.body.style.overflow='hidden';dialog.showModal();dialog.querySelector('.pv-scroll').scrollTo(0,0);
  }
  function prepare(){
    document.querySelectorAll(selector).forEach(img=>{
      // El resumen sin planta usa el hero: no convertirlo en una planta ampliable.
      if(img.closest('#sumPlan')&&img.alt!=='Planta')return;
      img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-haspopup','dialog');
      img.setAttribute('aria-label','Ampliar '+(img.alt||'planta'));img.dataset.plantaZoom='';
    });
  }
  document.addEventListener('click',e=>{
    const img=e.target.closest('img[data-planta-zoom]');if(!img)return;
    e.preventDefault();e.stopPropagation();
    const card=img.closest('.cz-tipo');if(card)card.click();
    open(img);
  },true);
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.matches('img[data-planta-zoom]')){e.preventDefault();e.stopPropagation();open(e.target);}
  },true);
  prepare();new MutationObserver(prepare).observe(document.body,{childList:true,subtree:true});
})();
