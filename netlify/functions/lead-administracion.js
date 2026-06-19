exports.handler = async function(event){
  if(event.httpMethod!=="POST") return {statusCode:405,body:JSON.stringify({error:"Método no permitido"})};
  const token=process.env.AIRTABLE_API_KEY||process.env.AIRTABLE_TOKEN;
  if(!token) return {statusCode:500,body:JSON.stringify({error:"Falta AIRTABLE_API_KEY"})};
  let data={};
  try{data=JSON.parse(event.body||"{}");}catch(e){return {statusCode:400,body:JSON.stringify({error:"JSON inválido"})};}
  const fields={
    "fldvJeO1VJXmEfLd2":data.nombre||"",
    "fld9o47WAxg7IgZRV":data.whatsapp||"",
    "fldRX5Gsu5s7mtOXh":data.email||"",
    "fldqnhWsuPjcWia7g":data.tipo||"Otro",
    "fldpStohruGzVOMYY":data.comuna||"",
    "fld6j2F78AaFmTOkX":data.estado_arriendo||"No, está disponible",
    "fld7nkwPsacARsZeo":data.mensaje||"",
    "fldt5nzvP4ApZwGCi":data.servicio||"Administración de propiedades",
    "fld7XbwJlRoyqm1HF":data.plan||"Administración",
    "fldujEfB9AOwlJ5ls":data.acepta==="on"||data.acepta===true?"Sí":"No",
    "fldUZ0akPMHhjdWQI":data.origen||"Administración de propiedades",
    "fldqjXvHSeP1PCRRi":data.fecha_envio||new Date().toISOString(),
    "fld4zI7BVnfgQ920h":"Nuevo"
  };
  const valor=Number(String(data.valor||"").replace(/[^0-9]/g,""));
  if(valor) fields["fld9FS8klmttiH9du"]=valor;
  const base=process.env.AIRTABLE_BASE_ID||"appkG5ldIIHTVkXf6";
  const table=process.env.AIRTABLE_ADMIN_TABLE_ID||"tblqGaWqSMaE42cTL";
  const r=await fetch("https://api.airtable.com/v0/"+base+"/"+table,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({records:[{fields}],typecast:true})});
  const text=await r.text();
  if(!r.ok) return {statusCode:502,headers:{"Content-Type":"application/json"},body:JSON.stringify({error:"Airtable "+r.status,detail:text})};
  return {statusCode:200,headers:{"Content-Type":"application/json"},body:JSON.stringify({ok:true})};
};