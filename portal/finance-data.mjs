const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean=(v,max)=>String(v??'').trim().slice(0,max);
export function normalizeRUT(value){
  const raw=String(value??'').replace(/[.\s-]/g,'').toUpperCase();
  if(!/^\d{7,8}[0-9K]$/.test(raw))throw new Error('Ingresa un RUT válido, incluido el dígito verificador.');
  const body=raw.slice(0,-1);let sum=0,m=2;
  for(const n of [...body].reverse()){sum+=Number(n)*m;m=m===7?2:m+1;}
  const dv=11-sum%11,expected=dv===11?'0':dv===10?'K':String(dv);
  if(raw.at(-1)!==expected)throw new Error('Revisa el dígito verificador del RUT.');
  return body+'-'+expected;
}
export function bankPayload(input,owner){
  const value={corredor_id:owner,titular:clean(input.titular,120),rut:normalizeRUT(input.rut),banco:clean(input.banco,80),tipo_cuenta:input.tipo_cuenta,
    numero_cuenta:String(input.numero_cuenta??'').trim(),email_transferencia:clean(input.email_transferencia,254).toLowerCase()};
  if(value.titular.length<3||value.banco.length<2)throw new Error('Completa el titular y el banco.');
  if(!['corriente','vista','ahorro','rut'].includes(value.tipo_cuenta))throw new Error('Selecciona el tipo de cuenta.');
  if(!/^\d{4,30}$/.test(value.numero_cuenta))throw new Error('El número de cuenta debe tener entre 4 y 30 dígitos, sin espacios ni guiones.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email_transferencia))throw new Error('Ingresa un correo válido para el comprobante.');
  return value;
}
function date(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function paymentPayload(input){
  const monto=Number(input.monto),estado=input.estado;
  if(!uuid.test(input.corredor_id))throw new Error('Selecciona un corredor.');
  if(!Number.isSafeInteger(monto)||monto<=0||monto>999999999999)throw new Error('Ingresa un monto entero en pesos mayor que cero.');
  if(!date(input.fecha))throw new Error('Ingresa la fecha en que se ganó la comisión.');
  if(!['pendiente','pagado','anulado'].includes(estado))throw new Error('Selecciona el estado de la comisión.');
  if(estado==='pagado'&&!date(input.fecha_pago))throw new Error('Ingresa la fecha de la transferencia realizada.');
  const concepto=clean(input.concepto,250);if(!concepto)throw new Error('Escribe el concepto o la propiedad de esta comisión.');
  return {corredor_id:input.corredor_id,monto,fecha:input.fecha,estado,fecha_pago:estado==='pagado'?input.fecha_pago:null,concepto,nota:clean(input.nota,1000)||null};
}
export function commissionTotals(rows){
  return rows.reduce((t,x)=>{if(x.estado==='anulado')return t;const n=Number(x.monto)||0;t.ganado+=n;if((x.estado||'pagado')==='pagado')t.pagado+=n;else t.pendiente+=n;return t;},{ganado:0,pagado:0,pendiente:0});
}
export function createFinanceData(client,activeProfile){
  async function requireAdmin(){const p=await activeProfile();if(p.rol!=='admin')throw new Error('Solo administración puede registrar o modificar comisiones.');return p;}
  return {
    async bank(owner){
      const p=await activeProfile(),id=owner||p.id;
      if(id!==p.id&&p.rol!=='admin')throw new Error('No tienes acceso a esta cuenta bancaria.');
      const {data,error}=await client.from('cuentas_bancarias').select('*').eq('corredor_id',id).maybeSingle();
      if(error)throw new Error('No se pudo consultar la cuenta bancaria. Inténtalo nuevamente.');return data;
    },
    async saveBank(input){
      const p=await activeProfile(),body=bankPayload(input,p.id);
      const {data,error}=await client.from('cuentas_bancarias').upsert({...body,actualizado:new Date().toISOString()},{onConflict:'corredor_id'}).select().single();
      if(error)throw new Error('No se pudo guardar la cuenta bancaria. No cierres el formulario y vuelve a intentarlo.');return data;
    },
    async removeBank(){
      const p=await activeProfile();const {error}=await client.from('cuentas_bancarias').delete().eq('corredor_id',p.id);
      if(error)throw new Error('No se pudo quitar la cuenta bancaria.');
    },
    async savePayment(input,id,isNew){
      await requireAdmin();if(!uuid.test(id))throw new Error('Identificador de comisión inválido.');
      const body=paymentPayload(input);
      const query=client.from('pagos');
      const {data,error}=await (isNew?query.insert({id,...body}):query.update(body).eq('id',id)).select().single();
      // A retried insert after a lost response is accepted only if its data is identical.
      if(error?.code==='23505'&&isNew){
        const previous=await client.from('pagos').select('*').eq('id',id).single();
        if(!previous.error&&Object.entries(body).every(([key,value])=>previous.data[key]===value))return previous.data;
      }
      if(error)throw new Error('No se pudo guardar la comisión. Revisa la conexión e inténtalo nuevamente.');return data;
    }
  };
}
