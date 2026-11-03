import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SKIN_DESIGNS,nativeSkinScene,applySkin,applyTeamTheme} from '../public/founders-skin-theme.js';
import {TEAM_COLORS} from '../public/founders-identity.js';
import {cityVisualState} from '../public/founders-city-scene.js';
import {universeSceneMarkup} from '../public/founders-skin-scenes.js';
import {foundersPreview} from '../server/founders-catalog.ts';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
const skins=JSON.parse(readFileSync(new URL('../content/founders-skins-v1.json',import.meta.url))).skins;
const metrics=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const city=Object.fromEntries(metrics.map(k=>[k,5]));
test('Cinq univers : thème et paysage changent, moteur et récit identiques',()=>{
 const reference=foundersPreview({scenarioId:'fondateurs-hot-spring-demo',skinId:'western'});
 for(const skin of skins){
  assert.ok(nativeSkinScene(skin.id));assert.ok(SKIN_DESIGNS[skin.id]);
  const p=foundersPreview({scenarioId:'fondateurs-hot-spring-demo',skinId:skin.id});
  assert.deepEqual(p.game,reference.game);assert.deepEqual(p.scenario,reference.scenario);
  assert.equal(p.warnings.some(w=>w.includes('Décor public')),false);
  if(skin.id!=='western')assert.ok(p.warnings.some(w=>w.includes('Univers différent')));
  const states=cityVisualState({...city,stabilite:2},skin.id,skin.labels.resources);
  assert.match(states.stabilite.description,/autonom|librement/);
  assert.equal(states.economie.label,skin.labels.resources.economie);
  if(skin.id!=='western'){
   const svg=universeSceneMarkup(skin.id);
   assert.equal((svg.match(/data-city-metric=/g)||[]).length,18);
   for(const key of metrics)for(const level of [0,1,2])assert.ok(svg.includes(`data-city-metric="${key}" data-city-level="${level}"`));
   assert.doesNotMatch(svg,/SALOON|Hot Spring|SHERIFF/);
   assert.doesNotMatch(Object.values(states).map(s=>s.description).join(' '),/shérif|gare|saloon/i);
  }
 }
 assert.equal(nativeSkinScene('__proto__'),false);
 assert.match(universeSceneMarkup('custom'),/Décor spécifique à créer/);
});
const luminance=hex=>{
 const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
};
test('Couleurs d’équipe : les six variantes restent lisibles sur les deux types de surface',()=>{
 for(const skin of skins)for(const color of TEAM_COLORS){
  const values={},root={dataset:{},style:{setProperty:(k,v)=>values[k]=v}};
  applySkin(root,skin);applyTeamTheme(root,color,skin);
  assert.equal(root.dataset.skin,skin.id);
  assert.equal(values['--team'],values['--accent']);
  const foreground=skin.id==='corporate'?'#ffffff':skin.theme.background;
  const a=luminance(values['--team']),b=luminance(foreground);
  const contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  assert.ok(contrast>=4.5,skin.id+'/'+color.id+' : '+contrast);
 }
});
test('Atelier public : fichiers, JSON et scripts sont servis sans exposer de scénario ou d’accès',async t=>{
 const store=new GameStore(':memory:'),server=createGameServer(store,'skin-test-organizer-token-000000000');
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const base='http://127.0.0.1:'+server.address().port;
 for(const file of ['founders-skins.html','founders-skins.js','founders-skin-theme.js','founders-skin-scenes.js'])assert.equal((await fetch(base+'/'+file)).status,200,file);
 const r=await fetch(base+'/founders-skins.json');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/application\/json/);
 const data=await r.json();assert.deepEqual(data.skins,skins);assert.equal(data.scenarios,undefined);assert.equal(data.access,undefined);
});
