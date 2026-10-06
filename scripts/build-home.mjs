import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {element,json,esc} from '../seo-core.mjs';
import {homeProperties,summaryProperty,rentalCards,projectCards} from '../home-render.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const snapshotFile=path.join(root,'home-catalog.json');
const previous=fs.existsSync(snapshotFile)?JSON.parse(fs.readFileSync(snapshotFile,'utf8')):null;
let snapshot;
try{
 if(process.env.HOME_SNAPSHOT_ONLY==='1')throw Error('Offline preview');
 const r=await fetch('https://corretajeguzman.com/api/properties?summary=home',{signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('catalog '+r.status);
 const data=await r.json();if(data.complete===false||!Array.isArray(data.properties))throw Error('Incomplete catalog');
 snapshot={generatedAt:new Date().toISOString(),properties:homeProperties(data.properties).map(summaryProperty)};
 const dir=path.join(root,'assets/home-catalog');fs.mkdirSync(dir,{recursive:true});
 const rows=snapshot.properties.filter(p=>p.operation==='arriendo'&&p.coverPhoto);
 let next=0;
 await Promise.all(Array.from({length:4},async()=>{while(next<rows.length){const p=rows[next++];try{
  const response=await fetch(p.coverPhoto,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Photo '+response.status);
  const buffer=Buffer.from(await response.arrayBuffer());if(buffer.length>12000000)throw Error('Photo too large');
  const ext=buffer[0]===0x89&&buffer.toString('ascii',1,4)==='PNG'?'png':buffer.toString('ascii',8,12)==='WEBP'?'webp':buffer[0]===0xff&&buffer[1]===0xd8?'jpg':null;
  if(!ext)throw Error('Unsupported image');
  const name=p.id+'-'+crypto.createHash('sha256').update(buffer).digest('hex').slice(0,12)+'.'+ext;
  fs.writeFileSync(path.join(dir,name),buffer);
  p.coverPhoto='/assets/home-catalog/'+name;
 }catch{const old=previous?.properties.find(x=>x.id===p.id);if(old?.coverPhoto?.startsWith('/assets/home-catalog/'))p.coverPhoto=old.coverPhoto;else throw Error('No durable photo for '+p.id);}
 }}));
 fs.writeFileSync(snapshotFile,JSON.stringify(snapshot));
}catch(error){
 if(!previous)throw error;
 console.warn('Home: using last complete public snapshot:',error.message);snapshot=previous;
}
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['data-proyectos.js','tipologias-confirmadas.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
snapshot.projects=ctx.window.PROYECTOS.filter(p=>p.activa!==false);
fs.writeFileSync(snapshotFile,JSON.stringify(snapshot));
const file=path.join(root,'Home - Corretaje Guzman.html');let html=fs.readFileSync(file,'utf8');
const rows=homeProperties(snapshot.properties),rent=rows.filter(p=>p.operation==='arriendo'),sale=rows.filter(p=>p.operation==='venta');
for(const [id,value] of Object.entries({stTotal:rows.length,stArr:rent.length,stVen:sale.length,arrCount:rent.length+' propiedades · disponibilidad actualizándose'}))html=element(html,id,String(value));
html=html.replace(/<!--home-rentals:start-->[\s\S]*?<!--home-rentals:end-->/,'<!--home-rentals:start--><div class="agrid" id="arrGrid">'+rentalCards(rows)+'</div><!--home-rentals:end-->');
html=html.replace(/<!--home-projects:start-->[\s\S]*?<!--home-projects:end-->/,'<!--home-projects:start--><div class="pgrid" id="projGrid">'+projectCards(snapshot.projects)+'</div><!--home-projects:end-->');
html=element(html,'projSub',snapshot.projects.length+' proyectos desde UF '+new Intl.NumberFormat('es-CL').format(Math.min(...snapshot.projects.map(p=>p.desdeUF)))+', con pie financiado y subsidio a la tasa.');
html=html.replace(/<script id="home-catalog-data"[^>]*>[\s\S]*?<\/script>\s*/g,'');
html=html.replace('</head>','<script id="home-catalog-data" type="application/json">'+json(snapshot)+'</script>\n</head>');
fs.writeFileSync(file,html);
console.log('Home prerendered:',rent.length,'rentals,',sale.length,'sales; first response contains all rental cards.');
