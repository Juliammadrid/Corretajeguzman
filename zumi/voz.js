(() => {
  const lab = window.ZumiPelucheLab;
  const button = document.getElementById('liveVoice');
  const status = document.getElementById('voiceStatus');
  const form = document.getElementById('chatForm');
  let current;
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function selectRows(rows, f) {
    const type = normalize(f.tipo).replace(/^depto\.?$/, 'departamento');
    return rows.filter(p =>
      p.kind === f.operacion && (!f.comuna || normalize(p.commune).replace(/^santiago centro$/, 'santiago') === normalize(f.comuna).replace(/^santiago centro$/, 'santiago')) &&
      (f.dormitorios == null || Number(p.beds) === f.dormitorios) &&
      (f.banos == null || Number(p.baths) === f.banos) &&
      (!type || normalize(p.name).includes(type)) &&
      (!f.estacionamiento || /^(?:[1-9]\d*\b|si\b|incluid)/.test(normalize(p.parking))) &&
      (!f.maximo || (p.currency === f.moneda && p.price <= f.maximo))
    ).sort((a,b) => a.currency.localeCompare(b.currency) || a.price-b.price).slice(0,3);
  }
  function showProperty(s,id) {
    const property = lab.voiceProperty(id);
    if (!s.known.has(id) || !property?.url) return false;
    const url = new URL(property.url,location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/propiedad/') || !url.pathname.includes(id)) return false;
    const doc = window.parent.document;
    if (!s.viewer) {
      const dialog = doc.createElement('dialog');
      dialog.setAttribute('aria-label','Ficha de propiedad');
      dialog.style.cssText = 'position:fixed;inset:0;margin:auto;padding:0;width:100%;height:100%;max-width:100%;max-height:100%;border:0;background:white;color:#322638;';
      const bar = doc.createElement('div');
      bar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px;padding-top:max(8px,env(safe-area-inset-top));background:#faf6fd;flex:none';
      const makeButton = (label,action) => {
        const b = doc.createElement('button');
        b.type = 'button'; b.textContent = label;
        b.style.cssText = 'padding:10px 14px;min-height:44px;border:1px solid #dac8de;border-radius:22px;color:#58336d;background:white;font:600 14px system-ui;cursor:pointer';
        b.onclick = action; bar.append(b);
      };
      makeButton('Volver a Zumi',()=>dialog.close());
      makeButton('Finalizar voz',()=>stop('Voz finalizada.'));
      const frame = doc.createElement('iframe');
      frame.style.cssText = 'width:100%;flex:1;min-height:0;border:0';
      dialog.append(bar,frame);doc.body.append(dialog);
      dialog.addEventListener('close',()=>{dialog.remove();if(s.viewer?.dialog===dialog)s.viewer=null;});
      s.viewer={dialog,frame};
      dialog.showModal();
      dialog.style.display='flex';dialog.style.flexDirection='column';
    }
    s.viewer.frame.title=property.name;
    if(s.viewer.frame.src!==url.href)s.viewer.frame.src=url.href;
    return true;
  }
  function stop(note = '') {
    const s = current;
    if (!s) return;
    current = null;
    s.viewer?.dialog.close();
    clearTimeout(s.timeout);
    s.abort.abort();
    s.stream?.getTracks().forEach(track => track.stop());
    s.channel?.close();
    s.pc?.close();
    s.audio.pause();
    s.audio.srcObject = null;
    s.audio.remove();
    form.inert = false;
    button.textContent = 'Hablar con Zumi';
    button.setAttribute('aria-pressed','false');
    status.textContent = note;
    lab.setSpeechActive(false);
  }
  async function runTool(s, event) {
    if (s.calls.has(event.call_id)) return;
    s.calls.add(event.call_id);
    let result;
    try {
      const args = JSON.parse(event.arguments);
      if (event.name === 'buscar_propiedades') {
        const rows = await lab.voiceCatalog();
        if (current !== s) return;
        const matches = selectRows(rows,args);
        for (const row of matches) s.known.add(row.id);
        lab.renderPropertyIds(matches.map(row => row.id));
        result = matches.map(({id,name,price,currency,commune,beds,baths,parking,status}) =>
          ({id,name,price,currency,commune,beds,baths,parking,status}));
      } else if (event.name === 'abrir_ficha') {
        result = {fichaAbierta:showProperty(s,args.id)};
      } else if (event.name === 'preparar_visita') {
        if(s.known.has(args.id))s.viewer?.dialog.close();
        result = {formularioAbierto:s.known.has(args.id) && lab.voiceVisit(args.id)};
      } else result = {error:'Acción desconocida'};
    } catch { result = {error:'No se pudo consultar. Pide al visitante que vuelva a intentarlo.'}; }
    if (current !== s || s.channel.readyState !== 'open') return;
    s.send({type:'conversation.item.create',item:{type:'function_call_output',call_id:event.call_id,output:JSON.stringify(result)}});
    s.send({type:'response.create'});
  }
  async function start() {
    if (form.querySelector('[type=submit]').disabled || document.querySelector('#zumi-record.recording')) {
      status.textContent = 'Termina la consulta en curso para iniciar la voz.'; return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      status.textContent = 'Este navegador no admite voz en vivo.'; return;
    }
    const s = {audio:document.createElement('audio'),abort:new AbortController(),calls:new Set(),known:new Set()};
    current = s;
    window.speechSynthesis?.cancel();
    button.textContent = 'Finalizar voz';
    button.setAttribute('aria-pressed','true');
    status.textContent = 'Conectando micrófono…';
    form.inert = true;
    s.timeout = setTimeout(() => { if(current === s) stop('Conexión agotada. Puedes volver a intentar.'); },35000);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true},video:false});
      if (current !== s) { stream.getTracks().forEach(t=>t.stop()); return; }
      s.stream = stream;
      s.pc = new RTCPeerConnection();
      s.audio.autoplay = true;
      document.body.append(s.audio);
      s.pc.ontrack = e => { s.audio.srcObject = e.streams[0] || new MediaStream([e.track]); s.audio.play().catch(()=>{if(current===s)stop('El navegador bloqueó el audio. Vuelve a tocar Hablar con Zumi.');}); };
      stream.getTracks().forEach(track => s.pc.addTrack(track,stream));
      s.pc.onconnectionstatechange = () => { if(current===s && s.pc.connectionState==='failed') stop('Se perdió la conexión.'); };
      const channel = s.channel = s.pc.createDataChannel('oai-events');
      s.send = event => channel.send(JSON.stringify(event));
      channel.onopen = () => {
        if(current!==s)return;
        clearTimeout(s.timeout);
        s.timeout = setTimeout(()=>{if(current===s)stop('Finalizaron los 5 minutos de voz.');},300000);
        status.textContent = 'Voz en vivo · micrófono activo';
        const cards = Array.from(document.querySelectorAll('#chatHistory [data-property-key]')).slice(-6).map(card=>{
          s.known.add(card.dataset.propertyKey);
          return {id:card.dataset.propertyKey,nombre:card.querySelector('.recommend-name')?.textContent};
        });
        const ficha = new URLSearchParams(location.search).get('zumi_property_id');
        if(ficha)s.known.add(ficha);
        const history = Array.from(document.querySelectorAll('#chatHistory .message')).slice(-6).map(el=>el.textContent.slice(0,300));
        s.send({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:'Contexto previo de esta pestaña: '+JSON.stringify({history,cards,ficha})}]}});
        s.send({type:'response.create',response:{instructions:'Saluda brevemente como Zumi, asistente de voz con IA, e invita a continuar.'}});
      };
      channel.onclose = () => { if(current===s)stop('La conversación de voz terminó.'); };
      channel.onmessage = e => {
        if(current!==s)return;
        const event = JSON.parse(e.data);
        if(event.type==='response.function_call_arguments.done')void runTool(s,event);
        if(event.type==='conversation.item.input_audio_transcription.completed' && event.transcript)lab.voiceMessage(event.transcript,'user');
        if(event.type==='response.output_audio_transcript.done' && event.transcript)lab.voiceMessage(event.transcript);
        if(event.type==='output_audio_buffer.started')lab.setSpeechActive(true);
        if(['output_audio_buffer.stopped','output_audio_buffer.cleared'].includes(event.type))lab.setSpeechActive(false);
        if(event.type==='error')status.textContent='No se pudo completar ese turno. Puedes volver a hablar.';
      };
      const offer = await s.pc.createOffer();
      await s.pc.setLocalDescription(offer);
      const reply = await fetch('/.netlify/functions/zumi-voz',{method:'POST',headers:{'Content-Type':'application/sdp'},body:offer.sdp,signal:s.abort.signal});
      if(!reply.ok)throw Error(reply.status===429?'Vuelve a intentar en unos minutos.':'La voz está temporalmente indisponible.');
      await s.pc.setRemoteDescription({type:'answer',sdp:await reply.text()});
    } catch(e) { if(current===s)stop(e.name==='NotAllowedError'?'Permite el micrófono para conversar.':e.message || 'No se pudo conectar.'); }
  }
  document.getElementById('chatHistory').addEventListener('click',event=>{
    const link=event.target.closest('a.recommend-primary');
    if(!current || !link)return;
    const id=link.closest('[data-property-key]')?.dataset.propertyKey;
    if(id && showProperty(current,id))event.preventDefault();
  });
  button.addEventListener('click',()=>current?stop('Voz finalizada.'):void start());
  for(const id of ['closeChat','resetChat'])document.getElementById(id).addEventListener('click',()=>stop());
  new MutationObserver(()=>{if(document.getElementById('chatPanel').hidden)stop();}).observe(document.getElementById('chatPanel'),{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('pagehide',()=>stop());
})();
