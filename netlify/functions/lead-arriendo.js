function firstNumber(v){
  const m=String(v||"").match(/\d+/);
  return m?Number(m[0]):undefined;
}

exports.handler=async function(event){
  if(event.httpMethod!=="POST") return {statusCode:405,body:JSON.stringify({error:"Método no permitido"})};
  const token=process.env.AIRTABLE_API_KEY||process.env.AIRTABLE_TOKEN;
  if(!token) return {statusCode:500,headers:{"Content-Type":"application/json"},body:JSON.stringify({error:"Falta AIRTABLE_API_KEY"})};

  let data={};
  try{data=JSON.parse(event.body||"{}");}catch(e){return {statusCode:400,headers:{"Content-Type":"application/json"},body:JSON.stringify({error:"JSON inválido"})};}
  if(data._gotcha) return {statusCode:200,headers:{"Content-Type":"application/json"},body:JSON.stringify({ok:true})};

  const dorm=String(data.dormitorios||"").toLowerCase().includes("indiferente")?undefined:firstNumber(data.dormitorios);
  const personas=firstNumber(data.personas);
  const fields={
    "fldsZx9PpyZ29e7ap":data.nombre||"",
    "fldqbsl6ECVKmS5ID":data.whatsapp||"",
    "fldKIFebftavSjWfS":data.email||"",
    "fldlGTGD3stLRR1mf":data.fecha_cambio||"",
    "fld3wSu5EEE5ntabL":Array.isArray(data.comunas)?data.comunas.join(", "):(data.comunas||""),
    "fldvhzzgpnvhvSxkh":data.estacionamiento||"No necesito",
    "fldiq3CMXO396yzAR":data.complementa||"",
    "fldMyDnEKCh4NhxKk":data.mascotas||"",
    "fldSE0vRduSbioRyJ":data.acepta==="on"||data.acepta===true?"Sí":"No",
    "fld0NWZKD57GSuZJo":data.fecha_envio||new Date().toISOString()
  };
  if(data.presupuesto) fields["fldexIZupMCtVLd8H"]=Number(data.presupuesto)||undefined;
  if(dorm!==undefined) fields["fldk8u4Rcr1IleswD"]=dorm;
  if(data.renta) fields["fldWBwor2EPs0yT5C"]=Number(data.renta)||undefined;
  if(personas!==undefined) fields["fldt5ujEsJle4o7EK"]=personas;
  if(data.renta_complemento) fields["fldkQIbDxE61fCo3X"]=Number(data.renta_complemento)||undefined;

  const base=process.env.AIRTABLE_BASE_ID||"appkG5ldIIHTVkXf6";
  const table=process.env.AIRTABLE_LEADS_TABLE_ID||"tblZE0MIc1SynvJlF";
  try{
    const r=await fetch("https://api.airtable.com/v0/"+base+"/"+table,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({records:[{fields}],typecast:true})});
    const text=await r.text();
    if(!r.ok) return {statusCode:502,headers:{"Content-Type":"application/json"},body:JSON.stringify({error:"Airtable "+r.status,detail:text})};
    let j={};try{j=JSON.parse(text)}catch(e){}
    return {statusCode:200,headers:{"Content-Type":"application/json"},body:JSON.stringify({ok:true,id:j.records&&j.records[0]&&j.records[0].id})};
  }catch(e){
    return {statusCode:502,headers:{"Content-Type":"application/json"},body:JSON.stringify({error:String(e.message||e)})};
  }
};