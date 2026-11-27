import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {GameStore} from '../server/store.ts';
import manifest from '../content/hotspring-cinema-v1.json' with {type:'json'};
import {selectCinemaView} from '../src/hotspring-cinema.ts';
import {narrativePublicView} from '../src/founders-live.ts';
import {cinemaRoutes,earlyCinemaEnding,playCinemaRoute} from './helpers/hotspring-cinema-routes.mjs';

const gauges=['economie','ecologie','securite','bien_etre','demographie'];
const expected={
 industrie:[8,0,10,0,8],
 vallee:[0,10,10,10,3],
 affluence:[8,5,1,0,10],
 institutions:[7,8,9,10,9],
 crises:[1,1,8,2,4]
};

const byId=new Map(manifest.views.map(v=>[v.id,v]));

function checkEligibility(view,state,stage){
 const recipe=byId.get(view.id);
 assert.ok(recipe,'Vue inconnue : '+view.id);
 assert.equal(recipe.stage,stage);
 const {markers,playedCrises}=state.campaign;
 for(const m of recipe.requiredMarkers)assert.ok(markers.includes(m),view.id+' nécessite '+m);
 for(const m of recipe.incompatibleMarkers)assert.ok(!markers.includes(m),view.id+' contredit '+m);
 for(const id of recipe.playedCrises)assert.ok(playedCrises.includes(id),view.id+' nécessite '+id);
}

for(const [id,route] of Object.entries(cinemaRoutes))test('Hotspring cinéma · '+route.label,()=>{
 const {state,snapshots}=playCinemaRoute(route);
 const ending=snapshots.find(s=>s.phase==='EPILOGUE');
 assert.deepEqual(gauges.map(k=>state.game.city[k]),expected[id]);
 if(id==='crises')assert.ok(state.campaign.playedCrises.length>=3);
 const checkpoints=snapshots.filter(s=>s.phase==='CHECKPOINT');
 assert.deepEqual(checkpoints.map(s=>s.campaign.chapter),[1,2,3,4,5,6]);
 let previous=checkpoints[0].campaign.initialCity;
 for(const s of checkpoints){
  const scene=narrativePublicView(s).campaign.cinema;
  assert.ok(scene.view.id&&scene.view.alt&&scene.view.url);
  assert.equal(scene.chapter,s.campaign.chapter);
  checkEligibility(scene.view,s,s.campaign.chapter);
  for(const key of gauges){
   assert.equal(scene.city[key],s.game.city[key]);
   assert.equal(scene.changes[key],s.game.city[key]-previous[key]);
  }
  assert.ok(Math.abs(scene.changes.stabilite-gauges.reduce((n,k)=>n+scene.changes[k],0)/5)<1e-8);
  assert.equal(scene.charter,null);
  assert.equal(scene.scores,undefined);
  assert.equal(scene.winners,undefined);
  previous=s.game.city;
 }
 const panorama=narrativePublicView(ending).campaign.cinema;
 assert.equal(panorama.early,false);
 checkEligibility(panorama.view,ending,7);
 assert.ok(panorama.charter);
 assert.deepEqual(narrativePublicView(state).campaign.cinema.view,panorama.view);
 assert.deepEqual(state.finalResults.winners,state.finalResults.rows.filter(r=>r.total===state.finalResults.rows[0].total).map(r=>r.family));

 const snapshot=checkpoints[4],original=narrativePublicView(snapshot).campaign.cinema;
 const dir=mkdtempSync(join(tmpdir(),'hotspring-cinema-')),path=join(dir,'sessions.db');
 let store=new GameStore(path);
 const actor={role:'organizer',id:snapshot.ownerId};
 try{
  store.narrative.insert(snapshot);
  const pause=store.narrative.command(snapshot.id,actor,{kind:'endSitting',data:{},expectedRevision:snapshot.revision},snapshot.updatedAt+10);
  assert.equal(pause.phase,'SUSPENDED');
  store.close();store=new GameStore(path);
  const loaded=store.narrative.get(snapshot.id);
  const resumed=store.narrative.command(snapshot.id,actor,{kind:'resumeSitting',data:{},expectedRevision:loaded.revision},loaded.updatedAt+86400000);
  assert.equal(resumed.phase,'CHECKPOINT');
  assert.deepEqual(resumed.campaign.cinema,original);
  assert.deepEqual(store.narrative.get(snapshot.id).campaign.checkpoints,snapshot.campaign.checkpoints);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});

test('Hotspring cinéma · interruption après la coupe du bois, avant les chartes',()=>{
 const state=earlyCinemaEnding(),s=narrativePublicView(state),scene=s.campaign.cinema;
 assert.equal(s.phase,'EPILOGUE');
 assert.equal(state.revealedHistory.at(-1).id,'D04');
 assert.equal(scene.early,true);
 assert.equal(scene.charter,null);
 assert.equal(scene.governance,null);
 assert.equal(scene.chapter,2);
 checkEligibility(scene.view,state,2);
 assert.ok(!scene.view.id.startsWith('fin-'));
});

for(const type of manifest.cityProfiles)test('Matrice des six chapitres · '+type.title,()=>{
 const paths=new Set();
 for(let stage=1;stage<=6;stage++){
  const context={stage,city:type.profile,markers:[]};
  const {view,profile}=selectCinemaView(context);
  assert.equal(profile.id,type.id);
  const entry=byId.get(view.id);
  assert.equal(entry.stage,stage);
  assert.equal(entry.cityProfile,type.id);
  assert.equal(entry.canonical,true);
  if(stage===1)assert.ok(entry.visibleConstructions.every(b=>['abris','tentes','chariots','charpente'].includes(b)));
  paths.add(view.url);
 }
 assert.equal(paths.size,6);
});
