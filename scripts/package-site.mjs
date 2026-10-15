// Preserve the complete public site while keeping functions, dependencies and
// development files outside the directory uploaded as static files.
import {readdir,mkdir,cp,rm,readFile,access} from 'node:fs/promises';
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
