import { commissionTotals } from './finance-data.mjs';
const money=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const statusLabel={pendiente:'Pendiente de pago',pagado:'Pagado',anulado:'Anulado'};
const accountTypes={corriente:'Cuenta corriente',vista:'Cuenta vista',ahorro:'Cuenta de ahorro',rut:'CuentaRUT'};
const bankLabels={titular:'Titular',rut:'RUT del titular',banco:'Banco',tipo_cuenta:'Tipo de cuenta',numero_cuenta:'Número de cuenta',email_transferencia:'Correo para el comprobante'};
export function createFinanceUI({api,me,getState,openDrawer,closeDrawer,refresh,toast,esc,icons}){
  let filter='',loadingBroker=0;
  const admin=()=>me.rol==='admin';
  const rowsFor=id=>getState().pagos.filter(p=>!id||(p.owner||p.corredor_id)===id);
  const summary=rows=>{const t=commissionTotals(rows);return '<div class="tiles">'+[['Ganado',t.ganado],['Pendiente de pago',t.pendiente],['Pagado',t.pagado]].map(([label,value])=>'<div class="card tile"><div class="k">'+label+'</div><div class="v">'+money(value)+'</div></div>').join('')+'</div>';};
  const bankDetails=bank=>bank?'<dl class="finance-bank">'+Object.entries(bankLabels).map(([key,label])=>'<div><dt>'+label+'</dt><dd>'+esc(key==='tipo_cuenta'?accountTypes[bank[key]]:bank[key])+'</dd></div>').join('')+'</dl>':'<p class="finance-note">Todavía no ha registrado su cuenta bancaria.</p>';
  async function account(root){
    const card=document.createElement('section');card.className='card bank-card';card.innerHTML='<h2>Cuenta para recibir comisiones</h2><p class="finance-note">Solo tú y administración pueden ver estos datos. Nunca ingreses claves bancarias ni datos de tarjetas.</p><div data-bank-content role="status">Consultando tu cuenta…</div>';
    root.append(card);const content=card.querySelector('[data-bank-content]');
    async function load(){
      try{const bank=await api.bank();if(!card.isConnected)return;
        content.innerHTML=bankDetails(bank)+'<button class="btn btn-p" data-bank-edit>'+(bank?'Editar cuenta':'Agregar cuenta bancaria')+'</button>'+(bank?' <button class="btn btn-g" data-bank-remove>Quitar mis datos</button>':'');
        content.querySelector('[data-bank-edit]').onclick=()=>editBank(bank,load);
        content.querySelector('[data-bank-remove]')?.addEventListener('click',async e=>{if(!confirm('¿Quitar tu cuenta bancaria del portal? Podrás registrarla nuevamente.'))return;const b=e.currentTarget;b.disabled=true;try{await api.removeBank();await load();toast('Datos bancarios eliminados.');}catch(error){toast(error.message);b.disabled=false;}});
      }catch(error){if(!card.isConnected)return;content.replaceChildren();const p=document.createElement('p');p.className='finance-error';p.textContent=error.message;const retry=document.createElement('button');retry.className='btn btn-g';retry.textContent='Reintentar';retry.onclick=load;content.append(p,retry);}
    }
    await load();
  }
  function editBank(bank,after){
    const values=bank||{titular:me.nombre,email_transferencia:me.email};
    openDrawer('Cuenta bancaria',`<p class="finance-note">Comprueba los datos antes de guardar. Se usarán para transferencias manuales de Corretaje Guzmán.</p>
      <form id="bankForm" class="fgrid">${Object.entries(bankLabels).map(([key,label])=>'<div class="f full"><label for="bank-'+key+'">'+label+'</label>'+(key==='tipo_cuenta'?'<select id="bank-'+key+'" name="'+key+'" required><option value="">Selecciona el tipo</option>'+Object.entries(accountTypes).map(([v,l])=>'<option value="'+v+'"'+(values[key]===v?' selected':'')+'>'+l+'</option>').join('')+'</select>':'<input id="bank-'+key+'" name="'+key+'" value="'+esc(values[key]||'')+'" required maxlength="'+({titular:120,rut:12,banco:80,numero_cuenta:30,email_transferencia:254}[key])+'"'+(key==='numero_cuenta'?' inputmode="numeric" autocomplete="off"':key==='email_transferencia'?' type="email"':'')+'>')+'</div>').join('')}<p id="bankError" class="finance-error full" role="alert"></p></form>`,
      '<button class="btn btn-g" id="bankCancel">Cancelar</button><button class="btn btn-p" type="submit" form="bankForm" id="bankSave">Guardar cuenta</button>');
    document.querySelector('#bankCancel').onclick=closeDrawer;
    document.querySelector('#bankForm').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,b=document.querySelector('#bankSave'),errorNode=document.querySelector('#bankError');b.disabled=true;errorNode.textContent='';
      try{await api.saveBank(Object.fromEntries(new FormData(form)));if(form.isConnected){closeDrawer();await after();}toast('Cuenta bancaria guardada.');}catch(error){errorNode.textContent=error.message;b.disabled=false;}};
  }
  function commissions(){
    const root=document.querySelector('#view'),brokers=getState().brokers;
    root.innerHTML='<div class="ph"><div><h1>'+(admin()?'Comisiones':'Mis comisiones')+'</h1><p>Montos del corredor, registrados por Corretaje Guzmán. Ya corresponden a su parte.</p></div>'+(admin()?'<button class="btn btn-p" id="newCommission">Registrar comisión</button>':'')+'</div><p class="finance-note">Ganado = pendiente + pagado. Este registro no realiza transferencias bancarias.</p>'+(admin()?'<div class="chips"><select id="commissionBroker" aria-label="Filtrar comisiones por corredor"><option value="">Todos los corredores</option>'+brokers.map(b=>'<option value="'+esc(b.id)+'"'+(b.id===filter?' selected':'')+'>'+esc(b.nombre)+'</option>').join('')+'</select></div>':'')+'<div id="financeRows"></div>';
    document.querySelector('#commissionBroker')?.addEventListener('change',e=>{filter=e.target.value;draw();});
    document.querySelector('#newCommission')?.addEventListener('click',()=>editPayment(null,filter));
    draw();
  }
  function draw(){
    const rows=rowsFor(admin()?filter:me.id).slice().sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.id.localeCompare(a.id)),groups={};
    for(const row of rows)(groups[row.fecha.slice(0,7)]??=[]).push(row);
    document.querySelector('#financeRows').innerHTML=summary(rows)+(rows.length?Object.entries(groups).map(([month,items])=>'<h2 class="sec-t">'+esc(new Intl.DateTimeFormat('es-CL',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z')))+'</h2><div class="card clist">'+items.map((x,i)=>'<div class="crow"><span class="cn">N° '+(i+1)+'</span><div class="cc"><b>'+esc(x.concepto||'Comisión')+'</b><span>'+esc(x.fecha)+(admin()?' · '+esc(getState().brokers.find(b=>b.id===(x.owner||x.corredor_id))?.nombre||'Corredor'):'')+'</span><span class="finance-status">'+statusLabel[x.estado||'pagado']+(x.fecha_pago?' · Transferencia '+esc(x.fecha_pago):'')+'</span>'+(x.nota?'<span>'+esc(x.nota)+'</span>':'')+'</div><b class="cm">'+money(x.monto)+'</b>'+(admin()?'<button class="ib" data-payment="'+esc(x.id)+'" aria-label="Editar comisión"><i data-lucide="pencil" class="ico"></i></button>':'')+'</div>').join('')+'</div>').join(''):'<div class="card empty">Aún no hay comisiones registradas.</div>');
    document.querySelectorAll('[data-payment]').forEach(b=>b.onclick=()=>editPayment(b.dataset.payment));icons();
  }
  function editPayment(id,owner){
    if(!admin())return;
    const previous=id?getState().pagos.find(p=>p.id===id):null;if(id&&!previous)return;
    const x=previous||{owner:owner||getState().brokers.find(b=>b.rol==='corredor')?.id,fecha:today(),estado:'pendiente'},requestId=id||crypto.randomUUID();
    const options=getState().brokers.map(b=>'<option value="'+esc(b.id)+'"'+(b.id===(x.owner||x.corredor_id)?' selected':'')+'>'+esc(b.nombre)+'</option>').join('');
    openDrawer(previous?'Editar comisión':'Registrar comisión',`<p class="finance-note">Ingresa solamente lo que gana el corredor, no la comisión total de la operación. Marcar como pagado no envía dinero.</p>
      <form id="paymentForm" class="fgrid">
        <div class="f full"><label for="pay-owner">Corredor</label><select id="pay-owner" name="corredor_id" required ${previous?'disabled':''}>${options}</select></div>
        <div class="f"><label for="pay-amount">Monto del corredor (CLP)</label><input id="pay-amount" name="monto" inputmode="numeric" pattern="[0-9]+" required value="${esc(x.monto||'')}" placeholder="250000"><small>Pesos enteros, sin puntos.</small></div>
        <div class="f"><label for="pay-date">Fecha en que se ganó</label><input id="pay-date" name="fecha" type="date" required value="${esc(x.fecha)}"></div>
        <div class="f full"><label for="pay-concept">Propiedad / concepto</label><input id="pay-concept" name="concepto" required maxlength="250" value="${esc(x.concepto||'')}" placeholder="Arriendo · Dirección de la propiedad"></div>
        <div class="f"><label for="pay-status">Estado</label><select id="pay-status" name="estado">${Object.entries(statusLabel).filter(([k])=>previous||k!=='anulado').map(([k,l])=>'<option value="'+k+'"'+(k===(x.estado||'pagado')?' selected':'')+'>'+l+'</option>').join('')}</select></div>
        <div class="f" id="paidDateField"><label for="pay-paid">Fecha de transferencia</label><input id="pay-paid" name="fecha_pago" type="date" value="${esc(x.fecha_pago||today())}"></div>
        <div class="f full"><label for="pay-note">Nota o referencia de transferencia (visible al corredor)</label><textarea id="pay-note" name="nota" maxlength="1000">${esc(x.nota||'')}</textarea></div>
        <p id="paymentError" class="finance-error full" role="alert"></p>
      </form>`, '<button class="btn btn-g" id="paymentCancel">Cancelar</button><button class="btn btn-p" type="submit" form="paymentForm" id="paymentSave">Guardar comisión</button>');
    const form=document.querySelector('#paymentForm'),button=document.querySelector('#paymentSave');
    document.querySelector('#paymentCancel').onclick=closeDrawer;
    const syncDate=()=>{const paid=form.elements.estado.value==='pagado';document.querySelector('#paidDateField').hidden=!paid;form.elements.fecha_pago.required=paid;};form.elements.estado.onchange=syncDate;syncDate();
    let saved=false;
    form.onsubmit=async e=>{e.preventDefault();button.disabled=true;const errorNode=document.querySelector('#paymentError');errorNode.textContent='';
      try{
        if(!saved){const input=Object.fromEntries(new FormData(form));if(previous)input.corredor_id=previous.owner||previous.corredor_id;await api.savePayment(input,requestId,!previous);saved=true;}
        await refresh();if(form.isConnected)closeDrawer();if(location.hash.startsWith('#/comisiones'))commissions();toast('Comisión guardada. No se realizó ninguna transferencia.');
      }catch(error){errorNode.textContent=saved?'La comisión quedó guardada, pero falta refrescar la vista. Pulsa nuevamente para reintentar sin duplicarla.':error.message;button.disabled=false;}
    };
  }
  async function broker(id){
    if(!admin())return;const b=getState().brokers.find(x=>x.id===id);if(!b)return;
    const generation=++loadingBroker;
    openDrawer('Cuenta y comisiones', '<h3>'+esc(b.nombre)+'</h3>'+summary(rowsFor(id))+'<div id="brokerBank">Consultando datos bancarios…</div>', '<button class="btn btn-g" id="brokerClose">Cerrar</button><button class="btn btn-p" id="brokerPayment">Registrar comisión</button>');
    const target=document.querySelector('#brokerBank');document.querySelector('#brokerClose').onclick=closeDrawer;document.querySelector('#brokerPayment').onclick=()=>editPayment(null,id);
    try{const bank=await api.bank(id);if(target.isConnected&&generation===loadingBroker)target.innerHTML='<h3>Datos para transferencia</h3>'+bankDetails(bank)+'<p class="finance-note">Confirma estos datos con el corredor antes de transferir. Después registra el pago en Comisiones.</p>';}
    catch(error){if(target.isConnected)target.textContent=error.message;}
  }
  return {account,commissions,broker};
}
