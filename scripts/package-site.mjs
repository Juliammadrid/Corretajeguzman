// Preserve the complete public site while keeping functions, dependencies and
// development files outside the directory uploaded as static files.
import {readdir,mkdir,cp,rm,readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const excluded=new Set(['dist','netlify','scripts','tests','node_modules','package.json','package-lock.json','pnpm-lock.yaml','netlify.toml']);
if(path.dirname(output)!==root||path.basename(output)!=='dist')throw Error('Unsafe output');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const item of await readdir(root,{withFileTypes:true})){
  if(item.name.startsWith('.')||excluded.has(item.name))continue;
  await cp(path.join(root,item.name),path.join(output,item.name),{recursive:true});
}
// Fail the release if a project points at a missing photo.
const ctx={window:{}};
vm.runInNewContext(await readFile(path.join(output,'data-proyectos.js'),'utf8'),ctx,{timeout:2000});
for(const project of ctx.window.PROYECTOS){
  if(!/^\/assets\/[a-zA-Z0-9_./%-]+\.(?:jpe?g|png|webp|avif)$/i.test(project.image)||project.image.includes('..'))throw Error('Invalid project image: '+project.slug);
  await access(path.join(output,project.image));
}
console.log('Complete public site and portal packaged; project images verified.');

 // Invalidate the public loader cache, including SEO-generated project pages.
 const publicPages=['Home - Corretaje Guzman.html','Arriendos - Corretaje Guzman.html','Ventas - Corretaje Guzman.html','Ficha Propiedad - Corretaje Guzman v2.html','Formulario de Arriendo - Corretaje Guzman.html','Quiero Arrendar mi Propiedad - Corretaje Guzman.html','Administracion de Propiedades - Corretaje Guzman.html','Se Corredor - Corretaje Guzman.html','Parcelas - Corretaje Guzman.html','parcela-campo-alto-roble.html','proyecto.html','proyectos-nuevos.html','cotizacion.html','simulador-capacidad/index.html','nosotros/index.html','proyectos/index.html','index.html'];
 for(const d of await readdir(path.join(output,'proyectos'),{withFileTypes:true}))if(d.isDirectory())publicPages.push('proyectos/'+d.name+'/index.html');
 for(const p of publicPages){
   const file=path.join(output,p);let h;try{h=await readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')continue;throw e;}
   if(/guzman-header\.js/i.test(h))h=h.replace(/(guzman-header\.js)(?:\?[^"'\s>]*)?/g,'$1?v=zumi-v2-katty');
   else if(!h.includes('data-zumi-v2'))h=h.replace(/<\/body>/i,'<script src="/zumi-widget.js?v=2-katty-20261126" data-zumi-v2 defer></script></body>');
   await writeFile(file,h);
 }
 for(const p of ['zumi-widget.js','assets/zumi.png','assets/zumi-body.png','assets/zumi-arm.png'])await access(path.join(output,p));
 new vm.Script(await readFile(path.join(output,'zumi-widget.js'),'utf8'),{filename:'zumi-widget.js'});
 new vm.Script(await readFile(path.join(output,'guzman-header.js'),'utf8'),{filename:'guzman-header.js'});
 console.log('Zumi v2 public integration packaged and syntax checked.');
