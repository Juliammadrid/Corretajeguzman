import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const footer=fs.readFileSync(path.join(root,'shared/footer.html'),'utf8').trim();
const style='<link rel="stylesheet" href="/shared/footer.css?v=20261007" data-gz-footer>';
export function withFooter(html){
 if(!/<body\b/i.test(html)||!/<\/body>/i.test(html))return html;
 html=html.replace(/<link\b[^>]*\bdata-gz-footer\b[^>]*>\s*/g,'');
 html=html.replace('</head>',style+'\n</head>');
 if(/<footer\b/i.test(html)){
  let first=true;
  html=html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi,()=>{if(!first)return '';first=false;return footer;});
 }else html=html.replace('</body>',footer+'\n</body>');
 return html;
}
export function buildFooter(){
 const files=fs.readdirSync(root).filter(f=>f.endsWith('.html')&&!f.startsWith('_')&&!f.startsWith('google'));
 const walk=dir=>{if(!fs.existsSync(path.join(root,dir)))return;for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.html'))files.push(f);}};
 for(const dir of ['proyectos','simulador-capacidad','nosotros'])walk(dir);
 for(const file of files){const f=path.join(root,file);fs.writeFileSync(f,withFooter(fs.readFileSync(f,'utf8')));}
 // Edge-rendered catalogs and property details use these transports, including future records.
 for(const [src,dest] of [['Ficha Propiedad - Corretaje Guzman v2.html','property'],['Arriendos - Corretaje Guzman.html','rent'],['Ventas - Corretaje Guzman.html','sale']])fs.copyFileSync(path.join(root,src),path.join(root,'seo-templates',dest+'.txt'));
 console.log('Shared footer included in',files.length,'pages and 3 dynamic templates.');
 return files;
}
