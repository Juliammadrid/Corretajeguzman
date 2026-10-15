import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export const COMPANY='corretajeguzman@gmail.com';
export const SCOPE='https://www.googleapis.com/auth/calendar.events';
export const ZONE='America/Santiago';
export class CalendarError extends Error {
  constructor(message,status=400){super(message);this.status=status;}
}
export const fail=(message,status=400)=>{throw new CalendarError(message,status);};
export const hash=value=>createHash('sha256').update(value).digest('hex');
export function seal(value,secret,context){
  const iv=randomBytes(12),key=createHash('sha256').update(secret+'\0'+context).digest();
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64url');
}
export function unseal(value,secret,context){
  const bytes=Buffer.from(value,'base64url');
  const decipher=createDecipheriv('aes-256-gcm',createHash('sha256').update(secret+'\0'+context).digest(),bytes.subarray(0,12));
  decipher.setAuthTag(bytes.subarray(12,28));
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString('utf8'));
}
export const canConnect=(user,profile)=>profile.rol==='admin'&&profile.estado==='activa'&&user.email?.toLowerCase()===COMPANY&&!!user.email_confirmed_at;
export function email(value){
  const text=String(value||'').trim().toLowerCase();
  if(text.length>254||! /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(text))fail('Ingresa un correo válido para el candidato.');
  return text;
}
function text(value,max,required=false){
  const str=String(value??'').trim();
  if(str.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(str)||required&&!str)fail('Revisa los campos de la visita.');
  return str;
}
const localFormat=new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function localMinute(date){
  const p=Object.fromEntries(localFormat.formatToParts(date).map(p=>[p.type,p.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
// Resolve the named zone using ICU, rejecting skipped/repeated local DST times.
// Never hard-code Chile's current UTC offset.
export function visitInstant(date,time){
  if(!/^20\d{2}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))fail('Fecha u hora inválida.');
  const naive=Date.parse(date+'T'+time+':00Z');
  if(!Number.isFinite(naive))fail('Fecha inválida.');
  const target=date+'T'+time,matches=[];
  for(let offset=-720;offset<=840;offset+=15){
    const candidate=naive-offset*60000;
    if(localMinute(candidate)===target)matches.push(candidate);
  }
  if(matches.length!==1)fail('Esa hora no existe o se repite por el cambio de horario de Chile. Elige otra.');
  return matches[0];
}
export function normalizeVisit(body,actor,now=Date.now()){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id||''))fail('Identificador de visita inválido.');
  const fecha=text(body.fecha,10,true),hora=text(body.hora,5,true),start=visitInstant(fecha,hora);
  if(start<=now||start>now+366*86400000)fail('Elige una fecha futura dentro de los próximos 12 meses.');
  const candidate=email(body.email);
  if(candidate===COMPANY||candidate===actor.user.email.toLowerCase())fail('El correo del candidato debe ser distinto del organizador y del corredor.');
  const propiedad_id=text(body.propiedad_id,80,true);
  if(!/^rec[a-zA-Z0-9]+$/.test(propiedad_id))fail('Selecciona una propiedad del catálogo.');
  return {id:body.id.toLowerCase(),corredor_id:actor.profile.id,propiedad_id,
    propiedad_titulo:text(body.propiedad_titulo,180,true),propiedad_direccion:text(body.propiedad_direccion,400,true),
    cliente:text(body.cliente,120,true),telefono:text(body.telefono,40),email:candidate,
    fecha,hora,notas:text(body.notas,2000)};
}
export function eventForVisit(v,actor,origin){
  const start=visitInstant(v.fecha,v.hora.slice(0,5));
  const id=hash(origin+'\0'+actor.profile.id+'\0'+v.id);
  const attendees=[...new Set([actor.user.email.toLowerCase(),email(v.email)])].filter(x=>x!==COMPANY).map(email=>({email}));
  const plain=value=>String(value||'').replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
  const event={id,summary:'Visita · '+v.propiedad_titulo,location:v.propiedad_direccion,
    description:'Visita coordinada por Corretaje Guzmán.\nCorredor: '+plain(actor.profile.nombre)+'\nCandidato: '+plain(v.cliente),
    start:{dateTime:new Date(start).toISOString(),timeZone:ZONE},
    end:{dateTime:new Date(start+30*60000).toISOString(),timeZone:ZONE},attendees,
    visibility:'private',guestsCanModify:false,guestsCanInviteOthers:false,guestsCanSeeOtherGuests:true};
  const fingerprint=hash(JSON.stringify(event));
  event.extendedProperties={private:{portalVisit:v.id,portalOwner:actor.profile.id,portalFingerprint:fingerprint}};
  return event;
}
export function verifyEvent(existing,expected){
  if(existing.status==='cancelled'||existing.organizer?.email?.toLowerCase()!==COMPANY||existing.extendedProperties?.private?.portalFingerprint!==expected.extendedProperties.private.portalFingerprint)
    fail('La visita ya existe en Calendar con cambios. Revísala con administración antes de reintentar.',409);
}
