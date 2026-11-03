import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {cityVisualState} from '../public/founders-city-scene.js';
import {PAINTED_REFERENCE,PAINTED_ZONES,paintedSources,updatePaintedWestern} from '../public/founders-painted-western.js';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
const middle=Object.fromEntries(Object.keys(PAINTED_ZONES).map(k=>[k,5]));
test('Les six quartiers évoluent indépendamment et utilisent uniquement les 13 illustrations approuvées',()=>{
 const reference=paintedSources(cityVisualState(middle));
 assert.ok(Object.values(reference).every(src=>src===PAINTED_REFERENCE));
 for(const key of Object.keys(middle))for(const [value,suffix] of [[0,'low'],[3,'low'],[4,null],[6,null],[7,'high'],[10,'high']]){
  const sources=paintedSources(cityVisualState({...middle,[key]:value}));
  assert.equal(sources[key],suffix?'/assets/western/painted/'+key+'-'+suffix+'.jpg':PAINTED_REFERENCE);
  for(const other of Object.keys(middle).filter(k=>k!==key))assert.equal(sources[other],PAINTED_REFERENCE);
 }
 const files=readdirSync(new URL('../public/assets/western/painted/',import.meta.url));
 assert.equal(files.length,13);assert.ok(files.every(f=>/^(reference|(?:economie|securite|satisfaction|bien_etre|developpement|stabilite)-(?:low|high))\.jpg$/.test(f)));
 assert.throws(()=>paintedSources({}),/invalide/);
});
test('Chargement atomique : une ancienne réponse réseau ne remplace pas un état plus récent',async()=>{
 const saved=globalThis.Image,pending=[];
 globalThis.Image=class{set src(value){this.url=value;pending.push(this);}};
 try{
  const nodes=Object.keys(middle).map(key=>({dataset:{paintedZone:key},setAttribute(name,value){this[name]=value;}}));
  const status={hidden:true,textContent:''},root={dataset:{renderer:'painted-western'},setAttribute(name,value){this[name]=value;},querySelector:()=>status,querySelectorAll:()=>nodes};
  updatePaintedWestern(root,cityVisualState({...middle,economie:2}));
  updatePaintedWestern(root,cityVisualState({...middle,economie:8}));
  pending.find(x=>x.url.endsWith('reference.jpg')).onload();
  pending.find(x=>x.url.endsWith('economie-high.jpg')).onload();
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(nodes[0].href.endsWith('economie-high.jpg'));
  pending.find(x=>x.url.endsWith('economie-low.jpg')).onload();
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(nodes[0].href.endsWith('economie-high.jpg'));
  assert.equal(root['aria-busy'],'false');assert.equal(status.hidden,true);
 }finally{globalThis.Image=saved;}
});
test('Les JPEG sont servis par le serveur local et les catastrophes restent exclues',async t=>{
 const store=new GameStore(':memory:'),server=createGameServer(store,'painted-test-organizer-key-00000000');
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const base='http://127.0.0.1:'+server.address().port;
 for(const name of readdirSync(new URL('../public/assets/western/painted/',import.meta.url))){
  const r=await fetch(base+'/assets/western/painted/'+name);assert.equal(r.status,200,name);assert.match(r.headers.get('content-type'),/image\/jpeg/);
  const bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);
  assert.deepEqual(bytes,readFileSync(new URL('../public/assets/western/painted/'+name,import.meta.url)));
 }
 assert.equal((await fetch(base+'/founders-painted-western.js')).status,200);
 for(const name of ['catastrophe-fire.jpg','catastrophe-epidemic.jpg'])assert.equal((await fetch(base+'/assets/western/painted/'+name)).status,404);
});
