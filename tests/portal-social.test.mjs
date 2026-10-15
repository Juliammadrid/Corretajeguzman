import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
for(const name of ['index','app','auth-check'])test(name+' has static social banner and official icons',async()=>{
 const html=await readFile(new URL('../portal/'+name+'.html',import.meta.url),'utf8');
 assert.equal((html.match(/property="og:image"/g)||[]).length,1);
 assert.match(html,/<meta property="og:image" content="https:\/\/corretajeguzman.com\/assets\/portal-compartir-20261015.jpg">/);
 assert.match(html,/<meta name="twitter:card" content="summary_large_image">/);
 assert.match(html,/<link rel="icon" type="image\/png" sizes="512x512" href="\/assets\/favicon-512.png">/);
 assert.match(html,/<link rel="apple-touch-icon" sizes="180x180" href="\/assets\/favicon-180.png">/);
 assert.match(html,/name="robots" content="noindex/);
 for(const asset of ['portal-compartir-20261015.jpg','favicon-512.png','favicon-180.png'])await access(new URL('../assets/'+asset,import.meta.url));
});
