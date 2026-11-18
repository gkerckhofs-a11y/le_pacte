import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,statSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {Resvg} from '@resvg/resvg-js';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
import {VALLEY_PLATE,renderPanoramaSvg} from '../public/hotspring-panorama.js';
import {renderHotspringStage,renderTendencies} from '../public/founders-hotspring.js';
import {narrativePublicView} from '../src/founders-live.ts';
import {newCampaign} from './helpers/hotspring.mjs';

const source=path=>new URL('../'+path,import.meta.url);
const manifest=JSON.parse(readFileSync(source('docs/hotspring/manifeste-assets.json')));
const assets=manifest.parts.flatMap(p=>JSON.parse(readFileSync(source('docs/hotspring/'+p.path))));

test('Hotspring : manifeste complet, formats WebP et galerie de contrôle',()=>{
 assert.equal(assets.filter(a=>a.kind==='en-tête').length,32);
 assert.equal(assets.filter(a=>a.kind==='résultat').length,62);
 assert.equal(assets.filter(a=>a.kind==='charte').length,6);
 assert.equal(assets.filter(a=>a.kind==='ouverture').length,6);
 assert.equal(new Set(assets.map(a=>a.id)).size,assets.length);
 const gallery=readFileSync(source('docs/hotspring/galerie.html'),'utf8');
 for(const a of assets){
  assert.ok(a.alt&&a.provenance&&a.rights&&a.condition&&a.prompt,a.id);
  assert.ok(gallery.includes(a.id),a.id);
  if(a.kind==='résultat'||a.kind==='charte'){
   assert.equal(a.durationSeconds,7.5);
   assert.ok(a.storyboard.length>=4&&a.stillFallback,a.id);
  }
  if(a.file){
   assert.notEqual(a.status,'temporaire',a.id);
   const webp=readFileSync(source('public'+a.file));
   assert.equal(webp.length,a.bytes);
   assert.equal(webp.toString('ascii',0,4),'RIFF');
   assert.equal(webp.toString('ascii',8,12),'WEBP');
   assert.ok(webp.length<430*1024,a.id+' est trop lourd pour la projection');
  }else if(!a.id.endsWith('_absent'))assert.equal(a.status,'temporaire',a.id);
 }
});

test('Hotspring : affiche les fichiers de la campagne en HTTP et garde les briefs privés',async t=>{
 const store=new GameStore(':memory:'),server=createGameServer(store,'visuals-test-organizer-000000000000');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const origin='http://127.0.0.1:'+server.address().port;
 const paths=assets.filter(a=>a.file).map(a=>a.file);
 for(let i=0;i<paths.length;i+=8){
  await Promise.all(paths.slice(i,i+8).map(async path=>{
   const r=await fetch(origin+path);
   assert.equal(r.status,200,path);
   assert.equal(r.headers.get('content-type'),'image/webp',path);
   assert.equal(Buffer.from(await r.arrayBuffer()).length,statSync(source('public'+path)).size,path);
  }));
 }
 for(const path of ['/public/hotspring-panorama.js','/docs/hotspring/manifeste-assets.json','/assets/hotspring/v1/results/inexistant.webp']){
  const r=await fetch(origin+path);
  assert.equal(r.status,404,path);await r.text();
 }
});

test('Hotspring : les calques évoluent, ancrages invariants, rendu 1080p et 4K',()=>{
 const g=newCampaign();g.command('start');
 const prologue=narrativePublicView(g.state).campaign.landscape;
 assert.deepEqual(prologue.layers.map(l=>l.id),['camp']);
 g.vote('contre');
 const terrace=narrativePublicView(g.state).campaign.landscape;
 assert.equal(terrace.location,'terrasse');assert.notEqual(terrace.layers[0].x,prologue.layers[0].x);
 g.command('next');g.vote('contre');
 const well=narrativePublicView(g.state).campaign.landscape.layers.find(l=>l.id==='well');
 assert.equal(well.label,'Puits communal');
 g.command('next');g.vote('contre');
 const map=narrativePublicView(g.state).campaign.landscape;
 assert.deepEqual(map.layers.find(l=>l.id==='well'),well);
 assert.ok(map.layers.some(l=>l.id==='surveyed'));
 assert.ok(map.layers.some(l=>l.kind==='vacant'));
 const svg=renderPanoramaSvg(map);
 assert.ok(svg.includes(VALLEY_PLATE));
 for(const width of [1920,3840]){
  const image=new Resvg(svg,{fitTo:{mode:'width',value:width}}).render();
  assert.equal(image.width,width);assert.equal(image.height,width*9/16);
 }
});

test('Hotspring : tendances lisibles et prologue sur la projection et le terminal',()=>{
 const {document}=parseHTML('<div id="stage"></div><div id="tendencies"></div>');
 const original=globalThis.document,previousImage=globalThis.Image;
 globalThis.document=document;globalThis.Image=class { };
 try{
  const g=newCampaign();g.command('start');
  const stage=document.getElementById('stage'),tendencies=document.getElementById('tendencies');
  renderHotspringStage(stage,narrativePublicView(g.state));
  assert.match(stage.textContent,/Après des semaines de piste/);
  g.command('next');renderTendencies(tendencies,narrativePublicView(g.state).dilemma);
  assert.match(tendencies.textContent,/POUR.*Économie ↑.*CONTRE.*Sécurité ↑/);
 }finally{globalThis.document=original;globalThis.Image=previousImage;}
});
