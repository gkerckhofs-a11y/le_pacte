import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const files=Array.from({length:5},(_,c)=>Array.from({length:6},(_,s)=>
 ['intro','pour','contre'].map(phase=>`0${c+1}0${s+1}-${phase}.webp`))).flat(2);
const hashes=new Set();
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const file of files){
 const source=readFileSync('content/chicago-media/'+file);
 assert.ok(source.length>1000&&source.toString('ascii',0,4)==='RIFF'&&source.toString('ascii',8,12)==='WEBP',file+' : fichier WebP invalide');
 hashes.add(digest(source));
 for(const directory of ['functions/content/chicago-media/','dist/public/assets/chicago/v3/']){
  assert.ok(readFileSync(directory+file).equals(source),directory+file+' : absent ou différent de la source');
 }
}
assert.equal(hashes.size,90,'Les 90 illustrations doivent être distinctes');
console.log('Chicago : 90 WebP distincts vérifiés dans les fonctions et le site public');

const live=process.argv.find(argument=>argument.startsWith('--url='))?.slice(6);
if(live){
 const queue=[...files];
 await Promise.all(Array.from({length:4},async()=>{
  while(queue.length){
   const file=queue.shift();
   const url=new URL('/assets/chicago/v3/'+file,live);
   let failure;
   for(let attempt=0;attempt<3;attempt++){
    try{
     const response=await fetch(url,{signal:AbortSignal.timeout(20000),cache:'no-store'});
     assert.equal(response.status,200,file+' : statut HTTP');
     assert.match(response.headers.get('content-type')??'',/^image\/webp(?:;|$)/,file+' : type HTTP incorrect');
     assert.equal(digest(Buffer.from(await response.arrayBuffer())),digest(readFileSync('content/chicago-media/'+file)),file+' : contenu publié différent');
     failure=null;break;
    }catch(error){failure=error;}
   }
   if(failure)throw failure;
  }
 }));
 console.log('Chicago : 90/90 images publiées identiques aux sources sur '+new URL(live).origin);
}
