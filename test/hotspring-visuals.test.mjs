import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,statSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {Resvg} from '@resvg/resvg-js';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
import {VALLEY_PLATE,renderPanoramaSvg} from '../public/hotspring-panorama.js';
import {renderHotspringStage,renderTendencies,renderHotspringPanorama} from '../public/founders-hotspring.js';
import {narrativePublicView} from '../src/founders-live.ts';
import {newCampaign,simulateCampaign,trajectories} from './helpers/hotspring.mjs';
import {visualComposition} from './helpers/hotspring-visual-compositions.mjs';

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
 for(const part of manifest.parts)assert.equal(part.count,JSON.parse(readFileSync(source('docs/hotspring/'+part.path))).length);
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
  }else{
   assert.equal(a.status,'validé',a.id);
   assert.ok(a.composition?.preview?.file,a.id);
   assert.ok(!a.plannedPath,a.id+' doit référencer son rendu réel');
   assert.ok(statSync(source('docs/hotspring/'+a.composition.preview.file)).size>0,a.id);
  }
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

test('Hotspring : la révélation présente le plan fixe du bon choix et conserve le panorama',()=>{
 const {document}=parseHTML('<div id="map"></div>');
 const previous=[globalThis.document,globalThis.Image];
 globalThis.document=document;
 globalThis.Image=class {
  constructor(){
   const img=document.createElement('img');
   Object.defineProperties(img,{complete:{value:true},naturalWidth:{value:1440}});
   return img;
  }
 };
 try{
  const g=newCampaign();g.command('start');
  const map=document.getElementById('map');
  renderHotspringPanorama(map,narrativePublicView(g.state));
  assert.ok(map.querySelector('.hotspring-prologue'));
  g.vote('contre');
  renderHotspringPanorama(map,narrativePublicView(g.state));
  assert.ok(map.querySelector('.hotspring-after'));
  assert.ok(map.querySelector('.hotspring-before'));
  assert.match(map.querySelector('.hotspring-result-still').src,/d01_result_against_highlands/);
  assert.ok(!map.innerHTML.includes('result_for_lowlands'));
 }finally{[globalThis.document,globalThis.Image]=previous;}
});



test('Hotspring : chaque état de la galerie correspond à un rendu effectif du panorama',()=>{
 for(const a of assets.filter(asset=>asset.composition)){
  const {scene,rendered}=visualComposition(a);
  const {preview,...recipe}=a.composition;
  assert.deepEqual(rendered,recipe,a.id);
  const svg=renderPanoramaSvg(scene);
  const {document}=parseHTML(svg);
  if(rendered.type==='building'){
   const layer=document.querySelector('[data-layer="'+rendered.anchor+'"]');
   if(rendered.state==='absent')assert.equal(layer,null,a.id);
   else{
    assert.equal(layer?.getAttribute('data-state'),rendered.state,a.id);
    if(rendered.kind)assert.equal(layer?.getAttribute('data-kind'),rendered.kind,a.id);
   }
  }else if(rendered.type==='detail'){
   const layer=document.querySelector('[data-detail="'+rendered.kind+'"][data-anchor="'+rendered.anchor+'"]');
   assert.equal(layer?.querySelector('title')?.textContent,a.alt,a.id);
  }else if(rendered.type==='scar'){
   assert.ok(document.querySelector('[data-scar="'+rendered.scar+'"] image'),a.id);
  }else if(rendered.type==='environment'){
   const value=document.querySelector('[data-'+rendered.key+']')?.getAttribute('data-'+rendered.key);
   assert.equal(value,rendered.value,a.id);
  }else{
   assert.ok(scene.epilogue&&scene.charter,a.id);
  }
  assert.ok(preview.column<preview.columns&&preview.row<preview.rows,a.id);
 }
});

test('Hotspring : la variante d’eau réutilise les ancrages réellement révélés',()=>{
 const g=newCampaign(),state=g.state;
 state.phase='PRESENTATION';
 state.currentDilemmaId='D26B';
 state.campaign.markers=['VILLE_HAUTE','EAU_PRIVEE','ALLIANCE_VALLEE'];
 const before=narrativePublicView(state).campaign.landscape;
 const well=before.layers.find(layer=>layer.id==='well');
 assert.equal(before.river,'basse');
 assert.equal(well.kind,'tower');
 assert.deepEqual(before.details.map(d=>d.kind),['signpost','relief']);
 const marker=before.details[0];
 assert.deepEqual([marker.x,marker.y],[well.x,well.y]);
 assert.equal(JSON.stringify(before).includes('EAU_PRIVEE'),false);
 state.campaign.markers=['VILLE_HAUTE','EAU_COMMUNALE'];
 const after=narrativePublicView(state).campaign.landscape;
 assert.deepEqual(after.details.map(d=>d.kind),['ledger']);
 state.phase='CHECKPOINT';
 assert.deepEqual(narrativePublicView(state).campaign.landscape.details,[]);
});

test('Hotspring : l’épilogue conserve le site du premier camp et utilise les vrais résultats',()=>{
 const {snapshots,state}=simulateCampaign(trajectories.commerce);
 const opening=narrativePublicView(snapshots[0]).campaign.landscape.layers.find(l=>l.id==='camp');
 const s=narrativePublicView(snapshots.at(-1));
 assert.equal(s.phase,'EPILOGUE');
 assert.deepEqual(s.campaign.landscape.epilogue.origin,[opening.x,opening.y]);
 assert.equal(s.finalResults,null);
 assert.equal(s.campaign.epilogueRecap.length,3);
 const voted=new Set(s.history.map(d=>d.visual?.url));
 assert.ok(s.campaign.epilogueRecap.every(h=>voted.has(h.visual.url)));
 assert.equal(narrativePublicView(state).campaign.epilogueRecap.length,0);
 const {document}=parseHTML('<div id="map"></div>');
 const previous=[globalThis.document,globalThis.Image];
 globalThis.document=document;
 globalThis.Image=class {};
 try{
  const map=document.getElementById('map');
  renderHotspringPanorama(map,s);
  assert.ok(map.querySelector('.hotspring-epilogue .hotspring-camp-memory'),map.innerHTML.slice(0,250));
  assert.equal(map.querySelectorAll('.hotspring-epilogue-scene img').length,3);
  renderHotspringPanorama(map,narrativePublicView(state));
  assert.equal(map.querySelector('.hotspring-camp-memory'),null);
  assert.ok(map.querySelector('[data-layer="council"]'));
 }finally{[globalThis.document,globalThis.Image]=previous;}
});



test('Hotspring : les suites de crise laissent des traces aux installations concernées',()=>{
 const g=newCampaign(),state=g.state;
 state.phase='CHECKPOINT';
 state.campaign.markers=['VILLE_BASSE','RESERVES_PUBLIQUES','CHEMIN_DE_FER','ABATTOIR_CENTRAL','FRET_SACRIFIE','MARQUES_DE_CRUE'];
 const damaged=narrativePublicView(state).campaign.landscape.layers.filter(layer=>layer.state==='damaged');
 assert.deepEqual(damaged.map(layer=>layer.id).sort(),['depot','rail','stockyard']);
 state.campaign.markers=['VILLE_HAUTE','RESERVES_PUBLIQUES','EAU_COMMUNALE','QUARANTAINE_21_JOURS','RATIONNEMENT_HABITANTS'];
 const high=narrativePublicView(state).campaign.landscape;
 assert.equal(new Set(high.layers.map(layer=>layer.id)).size,high.layers.length);
 const refuge=high.layers.find(layer=>layer.id==='refuge'),reserve=high.layers.find(layer=>layer.id==='waterReserve');
 assert.equal(refuge.kind,'refuge');
 assert.equal(reserve.kind,'tower');
 assert.notDeepEqual([refuge.x,refuge.y],[reserve.x,reserve.y]);
});
