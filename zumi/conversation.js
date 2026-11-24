// Free-form chat and editable voice notes. The browser only calls the site's own endpoint.
(() => {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('answer');
  const history = document.getElementById('chatHistory');
  const record = document.getElementById('zumi-record');
  const upload = document.getElementById('zumi-file');
  const fileButton = document.getElementById('zumi-attach');
  const submit = form.querySelector('[type=submit]');
  let recorder, timer, generation = 0, busy = false;
  const message = (text, who='zumi') => {
    const node = document.createElement('div');
    node.className = 'message from-' + who;
    node.textContent = text;
    history.append(node);
    history.scrollTop = history.scrollHeight;
    return node;
  };
  const setBusy = value => {
    busy = value;
    submit.disabled = record.disabled = fileButton.disabled = value;
  };
  async function request(body, type) {
    const r = await fetch('/.netlify/functions/zumi-conversar', {
      method:'POST', headers:{'Content-Type':type}, body, signal:AbortSignal.timeout(40000)
    });
    if (!r.ok) throw Error(r.status === 429 ? 'Espera un minuto y vuelve a intentarlo.' : 'No pude completar la consulta. Inténtalo de nuevo.');
    return r.json();
  }
  form.addEventListener('submit', async e => {
    const text = input.value.trim();
    const guided = window.ZumiPelucheLab?.getDialog?.();
    if (!text || /^(volver|inicio|reiniciar|volver al inicio)$/i.test(text) ||
        (guided?.steps?.length && !guided.done && text.split(/\s+/).length <= 4)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (busy || recorder) return;
    const previous = Array.from(history.querySelectorAll('.message')).slice(-8).map(el=>({
      role:el.classList.contains('from-user')?'user':'assistant',content:el.textContent.slice(0,750)
    }));
    const turn = generation;
    input.value=''; message(text,'user'); setBusy(true);
    const pending=message('Zumi está escribiendo…');
    try {
      const propertyId=new URLSearchParams(location.search).get('zumi_property_id');
      const result=await request(JSON.stringify({message:text,history:previous,propertyId}),'application/json');
      if(turn!==generation)return;
      message(result.reply);
      const catalog=window.ZUMI_CATALOG;
      for(const id of result.ids||[]){
        const p=[...catalog.rent,...catalog.buy].find(p=>p.id===id);
        if(!p || !p.url.startsWith('https://corretajeguzman.com/propiedad/'))continue;
        const a=document.createElement('a');a.href=p.url;a.target='_blank';a.rel='noopener';a.className='recommend-primary';a.textContent=p.name;history.append(a);
      }
    } catch(error) {if(turn===generation){message(error.message); if(!input.value)input.value=text;}}
    finally {pending.remove();setBusy(false);history.scrollTop=history.scrollHeight;}
  }, true);
  async function transcribe(blob,type) {
    if(!blob.size || blob.size>3000000){message('Elige un audio de hasta 3 MB.');return;}
    const turn=generation;
    setBusy(true);const pending=message('Transcribiendo audio…');
    try {
      const result=await request(blob,type);
      if(turn!==generation)return;
      if(!result.text?.trim())throw Error('No se escuchó una frase. Puedes grabarla otra vez.');
      input.value=[input.value.trim(),result.text.trim()].filter(Boolean).join(' ').slice(0,1000);
      input.focus();
    } catch(error){if(turn===generation)message(error.message);}
    finally {pending.remove();setBusy(false);}
  }
  fileButton.onclick=()=>upload.click();
  upload.onchange=()=>{const file=upload.files[0];upload.value='';if(!file)return;
    const ext=file.name.split('.').pop().toLowerCase();
    const mime={mp3:'audio/mpeg',mp4:'audio/mp4',m4a:'audio/mp4',wav:'audio/wav',webm:'audio/webm',ogg:'audio/ogg',flac:'audio/flac'}[ext]||file.type;
    void transcribe(file,mime);
  };
  function stop(cancel=false){
    if(recorder && recorder.state==='recording'){if(cancel)recorder.ondataavailable=null;recorder.stop();}
  }
  record.onclick=async()=>{
    if(recorder){stop();return;}
    const turn=generation;
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){message('Usa el clip para adjuntar una nota de voz.');return;}
    let stream;record.disabled=true;
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if(turn!==generation){stream.getTracks().forEach(t=>t.stop());return;}
      const type=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
      const r=new MediaRecorder(stream,type?{mimeType:type}:undefined);
      recorder=r;const chunks=[];
      r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      r.onstop=()=>{clearTimeout(timer);stream.getTracks().forEach(t=>t.stop());recorder=null;
        record.textContent='🎙';record.setAttribute('aria-label','Grabar audio');fileButton.disabled=submit.disabled=false;
        if(turn===generation && chunks.length)void transcribe(new Blob(chunks,{type:r.mimeType}),r.mimeType);
      };
      r.start();record.textContent='⏹';record.setAttribute('aria-label','Detener y transcribir');fileButton.disabled=submit.disabled=true;
      timer=setTimeout(()=>stop(),45000);
    } catch {stream?.getTracks().forEach(t=>t.stop());recorder=null;message('Para grabar, permite usar el micrófono o adjunta un audio con el clip.');}
    finally{record.disabled=false;}
  };
  for(const id of ['closeChat','resetChat'])document.getElementById(id).addEventListener('click',()=>{generation++;stop(true);});
  window.addEventListener('pagehide',()=>{generation++;stop(true);});
})();
