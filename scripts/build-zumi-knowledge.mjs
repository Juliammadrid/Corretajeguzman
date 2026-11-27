// Build the public Zumi knowledge from the same sources as the website.
import vm from 'node:vm';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const pick=(x,keys)=>Object.fromEntries(keys.filter(k=>x[k]!=null).map(k=>[k,x[k]]));
const labels=a=>(Array.isArray(a)?a:[]).map(x=>typeof x==='string'?x:x.t).filter(Boolean);
export function makeKnowledge(window){
 const parcelas=Object.entries(window.PARCELA_PROYECTOS||{}).filter(([id,p])=>p.activa!==false&&p.name).map(([id,p])=>{
   const lotes=(p.parcelas||[]).map(x=>({numero:x.n,uf:x.uf,estado:x.status||'disponible'}));
   const precios=lotes.filter(x=>x.estado==='disponible'&&x.uf>0).map(x=>x.uf);
   return {id:'parcel:'+id,slug:id,nombre:p.name,sector:p.sector,region:p.region,direccion:p.address,desdeUF:precios.length?Math.min(...precios):p.desdeUF,hastaUF:precios.length?Math.max(...precios):null,superficieM2:p.supParcela,descripcion:p.lead,urbanizacion:labels(p.urbanizacion),distancias:p.distancias,credito:pick(p.credito||{},['pieMin','tasaMes','plazos','nota']),lotes,imagen:p.heroImg,url:p.detalle||p.ficha||'/parcelas/'+id};
 });
 const proyectos=(window.PROYECTOS||[]).filter(p=>p.activa!==false).map(p=>{
   const d=window.PROYECTO_FICHAS?.[p.slug]||{};
   const confirmadas=window.TIPOLOGIAS_CONFIRMADAS?.[p.slug]||[];
   return {id:p.slug,nombre:p.name,comuna:p.commune,direccion:p.address,desdeUF:p.desdeUF,entrega:p.entrega,especificaciones:p.specs,url:p.detalle,imagen:p.image,cotizacion:'/cotizacion.html?slug='+encodeURIComponent(p.slug),
    ...pick(d,['lead','reserva','subsidioTasa','caracteristicas','cerca','off']),comunes:labels(d.comunes),
    tipologias:(d.tipologias||[]).map(x=>pick(x,['id','nombre','m2int','m2tot','desdeUF','hastaUF','plano','orientacion'])),
    tipologiasConfirmadas:confirmadas.map(x=>pick(x,['id','nombre','planta','m2int','m2tot','terraza','orientacion','desdeUF','plano']))};
 });
 return {version:1,parcelas,proyectos,servicios:{
  propietario:{titulo:'Arrendar mi propiedad',datos:['Plan Prioridad: 50% de un mes de arriendo, se cobra solo al concretar el arriendo.','Plan Básico: sin costo de corretaje para el propietario, publicación simple sin publicidad.','Gestionamos publicación, visitas, evaluación, contrato y firma.'],url:'/propietarios'},
  admin:{titulo:'Administración de propiedades',datos:['Hasta $600.000 de arriendo mensual: tarifa anual fija de $350.000. Sobre $600.000: 7% mensual de lo efectivamente recaudado.','Cobro, pagos, gastos comunes y servicios, inspecciones, mantenciones, reportes mensuales, respaldo legal y cobranza.','Se pueden administrar propiedades ya arrendadas o disponibles. Reparaciones del propietario con autorización previa.'],url:'/administracion'},
  corredor:{titulo:'Sé corredor',datos:['Gratis: mostrar propiedades y ganar por visitas. Premium: $35.000 mensual o $199.000 anual, catálogo completo y ganancias por cierres de arriendos y ventas.','No es indispensable tener experiencia. Puedes pasar de Gratis a Premium.','Postula con tus datos y elige un plan; el equipo coordina la activación. Los montos por visita y cierre no se publican en esta sección.'],url:'/corredores'},
  solicitud:{titulo:'Formulario de arriendo',datos:['Permite registrar preferencias y datos para buscar una propiedad.','Si se concreta el arriendo presentado, comisión del arrendatario de 50% de un mes de arriendo más IVA.','Enviar la solicitud no implica reserva, aprobación ni disponibilidad inmediata.'],url:'/solicitud'},
  simulador:{titulo:'Capacidad de compra',datos:['Simulación referencial según renta líquida, ahorro, destino de compra y plazo.','Carga financiera máxima referencial 25% de la renta; pie 20% primera vivienda, 25% inversión, 30% segunda vivienda.','No constituye aprobación bancaria. Pie financiado y subsidio de tasa dependen de condiciones de cada proyecto y evaluación. Usa el simulador web para cifras actualizadas.'],url:'/simulador-capacidad/'}
 }};
}
export async function buildKnowledge(root,output){
 const ctx={window:{}};for(const file of ['data-proyectos.js','data-proyectos-detalle.js','tipologias-confirmadas.js','data-parcelas-proyectos.js'])vm.runInNewContext(await readFile(path.join(root,file),'utf8'),ctx,{timeout:2000});
 const result=makeKnowledge(ctx.window);await writeFile(path.join(output,'zumi-knowledge.json'),JSON.stringify(result));return result;
}
