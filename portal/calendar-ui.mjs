const COMPANY='corretajeguzman@gmail.com';
const CORPORATE='contacto@corretajeguzman.com';
export function calendarLink(visit){
  if(!/^(?:c0)?[a-f0-9]{64}$/.test(visit.gcal_event_id||''))return '';
  const organizer=visit.gcal_event_id.length===66?CORPORATE:COMPANY;
  return 'https://calendar.google.com/calendar/event?eid='+encodeURIComponent(btoa(visit.gcal_event_id+' '+organizer));
}
export function createCalendarUI({api,me,getState,propertyById,openDrawer,closeDrawer,refresh,route,toast,esc}){
  const $=s=>document.querySelector(s);
  const status={configured:false,connected:false,canConnect:false,checked:false,organizer:CORPORATE,connectOrganizer:CORPORATE};
  async function loadStatus(){
    Object.assign(status,await api.calendar(),{checked:true});getState().cal=status.connected;return status;
  }
  function banner(){return '<div class="cal-banner"><div><b>Calendario de Corretaje Guzmán</b><span>La empresa organiza las visitas e invita al corredor y al candidato.</span></div><button class="btn btn-p btn-sm" data-cal>Ver conexión</button></div>';}
  async function connect(){
    openDrawer('Calendario de Corretaje Guzmán','<p role="status">Verificando la conexión…</p>','');
    try{await loadStatus();}catch(error){openDrawer('Calendar','<p>'+esc(error.message)+'</p>','');return;}
    const detail=status.connected?'La empresa ya autorizó su calendario. Puedes agendar desde una propiedad.':!status.configured?'Falta configurar las credenciales de Google Calendar en Netlify. La autorización todavía no está disponible.':status.canConnect?'Pulsa Autorizar y elige '+status.connectOrganizer+'. Google te pedirá permiso para gestionar eventos.':'Administración debe autorizar la conexión. Tú no necesitas conectar tu calendario personal.';
    openDrawer('Calendario de Corretaje Guzmán',`<div class="gcal-box"><h3>${status.connected?'Calendario autorizado':'Conexión central'}</h3><p>${esc(detail)}</p><p>Organizador: <b>${esc(status.organizer)}</b></p><p>Las invitaciones se enviarán al correo del corredor y del candidato. Su aparición en la agenda depende de la configuración y aceptación de cada invitado.</p>${status.canConnect?'<p>Autoriza con '+esc(status.connectOrganizer)+'. Las visitas anteriores conservarán su calendario original.</p><p>Esta autorización permite gestionar eventos. El portal utiliza el acceso para las visitas; las credenciales permanecen en el servidor.</p>':''}</div>`,
      '<button class="btn btn-g" id="calendarClose">Cerrar</button>'+(status.configured&&status.canConnect?'<button class="btn btn-p" id="calendarAuthorize">'+(status.connected?'Volver a autorizar':'Autorizar con Google')+'</button>':''));
    $('#calendarClose').onclick=closeDrawer;
    if($('#calendarAuthorize'))$('#calendarAuthorize').onclick=async()=>{
      const button=$('#calendarAuthorize');button.disabled=true;
      try{const result=await api.calendar('connect');const target=new URL(result.url);if(target.origin!=='https://accounts.google.com')throw new Error('Destino de autorización inválido.');location.assign(target.href);}
      catch(error){toast(error.message);button.disabled=false;}
    };
  }
  async function retry(id,button){
    button.disabled=true;
    try{await api.calendar('visit',{id});await refresh();route();toast('Visita sincronizada con Calendar.');}
    catch(error){try{await refresh();}catch{}toast(error.message);button.disabled=false;}
  }
  function visit(propId,pre){
    const p=propertyById(propId);
    if(!p||p.estado==='arrendada'){toast('Selecciona una propiedad disponible.');return;}
    // ID survives failures within the drawer. Stored visits can also be retried from Mis visitas.
    const id=crypto.randomUUID();let saving=false;
    const pros=getState().prospects.filter(x=>x.owner===me.id&&x.estado!=='no');
    const tomorrow=new Date(Date.now()+86400000);
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(tomorrow);
    openDrawer('Agendar visita',`<div class="psum"><div><b>${esc(p.titulo)}</b><span>${esc(p.comuna)}</span></div></div>
      <p class="mnote">Candidato nuevo o prospecto existente. Duración: 30 minutos · horario de Chile (Santiago).</p>
      <form id="calendarVisit" class="fgrid">
        <div class="f full"><label for="visitOrganizer">Organizador</label><input id="visitOrganizer" value="${esc(status.organizer)}" readonly></div>
        <div class="f full"><label for="visitBroker">Correo del corredor</label><input id="visitBroker" value="${esc(me.email)}" readonly></div>
        <div class="f full"><label for="visitCandidate">Nombre del candidato</label><input id="visitCandidate" name="cliente" required maxlength="120" list="visitProspects" value="${esc(pre?.cliente||'')}" placeholder="No necesita estar registrado"><datalist id="visitProspects">${pros.map(x=>'<option value="'+esc(x.nombre)+'">').join('')}</datalist></div>
        <div class="f full"><label for="visitEmail">Correo del candidato</label><input id="visitEmail" name="email" type="email" required maxlength="254" value="${esc(pre?.email||'')}" placeholder="Para enviarle la invitación"></div>
        <div class="f full"><label for="visitPhone">Teléfono (opcional)</label><input id="visitPhone" name="telefono" type="tel" maxlength="40" value="${esc(pre?.tel||'')}"></div>
        <div class="f"><label for="visitDate">Fecha</label><input id="visitDate" name="fecha" type="date" required value="${date}"></div>
        <div class="f"><label for="visitTime">Hora</label><input id="visitTime" name="hora" type="time" required value="18:30"></div>
        <div class="f full"><label for="visitPlace">Lugar de encuentro</label><input id="visitPlace" name="propiedad_direccion" required maxlength="400" value="${esc([p.direccion,p.comuna].filter(Boolean).join(', '))}"></div>
        <div class="f full"><label for="visitNotes">Notas internas (no se envían al candidato)</label><textarea id="visitNotes" name="notas" maxlength="2000"></textarea></div>
      </form><p id="calendarVisitMessage" role="status" class="mnote">Al confirmar se guardará la visita y Google enviará las invitaciones.</p>`,
      '<button class="btn btn-g" id="calendarCancel">Cancelar</button><button class="btn btn-p" id="calendarSave" type="submit" form="calendarVisit">Agendar y enviar</button>');
    const form=$('#calendarVisit'),button=$('#calendarSave'),message=$('#calendarVisitMessage');
    if(status.checked&&(!status.configured||!status.connected||!status.visitConfigured))message.textContent='Conexión central pendiente: administración debe completar la configuración antes de enviar invitaciones.';
    $('#calendarCancel').onclick=closeDrawer;
    form.elements.cliente.addEventListener('change',()=>{const prospect=pros.find(x=>x.nombre.toLowerCase()===form.elements.cliente.value.trim().toLowerCase());if(prospect){form.elements.email.value=prospect.email||'';form.elements.telefono.value=prospect.tel||'';}});
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(saving||!form.reportValidity())return;
      saving=true;button.disabled=true;message.textContent='Guardando visita y confirmando con Google…';
      try{
        const body={...Object.fromEntries(new FormData(form)),id,propiedad_id:p.id,propiedad_titulo:p.titulo};
        await api.calendar('visit',body);
        closeDrawer();
        try{await refresh();location.hash='#/visitas';route();}catch{toast('Google confirmó la visita. Recarga para actualizar Mis visitas.');return;}
        toast('Visita creada en Calendar; invitaciones solicitadas para el corredor y el candidato.');
      }catch(error){
        try{await refresh();}catch{}
        message.textContent=error.message+' Si ya aparece en Mis visitas, usa Reintentar Calendar allí.';
        button.textContent='Reintentar visita';
      }finally{saving=false;button.disabled=false;}
    });
  }
  return {status,loadStatus,banner,connect,visit,retry};
}
