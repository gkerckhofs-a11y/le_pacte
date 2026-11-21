import assert from 'node:assert/strict';
import {once} from 'node:events';
import {test} from 'node:test';
import {prepareCosaNostra} from '../server/cosa-nostra-preparation.ts';
import {createGameServer} from '../server/http.ts';
import {GameStore} from '../server/store.ts';

const route = '/api/founders/cosa-nostra/preparation';
const organizer = 'organizer-a-test-token-00000000000';
const otherOrganizer = 'organizer-b-test-token-00000000000';
const familyToken = 'team-test-token-000000000000000000';
import {fixture} from './helpers/chicago.mjs';

test('Cosa Nostra V3 conserve les 30 scènes et valide la réserve, les effets et les pivots', () => {
 const campaign = fixture();
 const prepared = prepareCosaNostra(campaign);
 assert.deepEqual(prepared.campaign.dilemmas,campaign.dilemmas);
 assert.deepEqual(prepareCosaNostra(prepared.campaign),prepared);
 for(const objective of prepared.campaign.metadata.family_objectives){
  assert.match(objective.medium.condition,/deux jauges les plus élevées/);
  assert.doesNotMatch(JSON.stringify(objective),/60\s*\/\s*100|jauge familiale/i);
 }
 assert.equal(prepared.crisisIds.length, 10);
 assert.equal(prepareCosaNostra(campaign, []).checksum, prepared.checksum);
 const chapterCrises = campaign.dilemmas.filter(d => d.chapter === 1 && d.type === 'Crise');
 assert.throws(() => prepareCosaNostra(campaign, chapterCrises.map(d => d.id)), /deux crises/);
 assert.throws(() => prepareCosaNostra(campaign, [prepared.crisisIds[0], prepared.crisisIds[0]]), /doublon/);

 const invalid = structuredClone(campaign);
 const [id, choice] = invalid.metadata.family_objectives[0].major_slots[0];
 invalid.dilemmas.find(d => d.id === id).options.find(o => o.choice === choice).secret_success = 'autre-marqueur';
 assert.throws(() => prepareCosaNostra(invalid), /référence de pivot/);
 invalid.dilemmas[0].options.pop();
 assert.throws(() => prepareCosaNostra(invalid), /Deux issues/);
});

test('Refuse une ancienne campagne et les tendances incohérentes', () => {
 const campaign=fixture();
 assert.throws(()=>prepareCosaNostra({...campaign,metadata:{...campaign.metadata,vote_format:'ABC'}}),/V3 binaire/);
 const option=campaign.dilemmas[0].options[0];
 option.public_trends[0].direction=option.public_trends[0].direction==='↑'?'↓':'↑';
 assert.throws(()=>prepareCosaNostra(campaign),/tendance/);
});

test('La régie est reliée à l’accueil et sa préparation est authentifiée, isolée et révisée', async t => {
 const store = new GameStore(':memory:');
 const accounts = new Map([[organizer, 'organizer-a'], [otherOrganizer, 'organizer-b']]);
 const server = createGameServer(store, organizer, Date.now, {
  verifyOperator: async token => accounts.has(token) ? {uid: accounts.get(token), organizer: true, editor: false} : null
 });
 server.listen(0, '127.0.0.1');
 await once(server, 'listening');
 t.after(() => {server.closeAllConnections(); server.close(); store.close();});
 const base = 'http://127.0.0.1:' + server.address().port;
 const call = (token, body) => fetch(base + route, {
  method: body ? 'PUT' : 'GET',
  headers: {...(token ? {authorization: 'Bearer ' + token} : {}), ...(body ? {'content-type': 'application/json'} : {})},
  body: body ? JSON.stringify(body) : undefined
 });

 const home = await fetch(base + '/');
 assert.match(await home.text(), /href="\/cosa-nostra"/);
 const page = await fetch(base + '/cosa-nostra');
 assert.equal(page.status, 200);
 assert.match(await page.text(), /Régie de préparation/);
 assert.equal((await fetch(base + '/cosa-nostra.js')).status, 200);
 const objectiveModule=await fetch(base+'/chicago-objectives.js');
 assert.equal(objectiveModule.status,200);assert.match(objectiveModule.headers.get('content-type'),/javascript/);
 assert.equal((await call()).status, 403);
 assert.equal((await call(familyToken, {revision: 0, campaign: fixture()})).status, 403);
 assert.deepEqual(await (await call(organizer)).json(), {preparation: null});

 const campaign = fixture();
 const imported = await call(organizer, {revision: 0, campaign});
 assert.equal(imported.status, 200);
 const {preparation} = await imported.json();
 assert.equal(preparation.revision, 1);
 assert.deepEqual(preparation.campaign,prepareCosaNostra(campaign).campaign);
 assert.deepEqual(await (await call(otherOrganizer)).json(), {preparation: null});

 const updates = await Promise.all([
  call(organizer, {revision: 1, crisisIds: []}),
  call(organizer, {revision: 1, crisisIds: []})
 ]);
 assert.deepEqual(updates.map(response => response.status).sort(), [200, 409]);
 const {preparation: saved} = await (await call(organizer)).json();
 assert.equal(saved.revision, 2);
 assert.deepEqual(saved.crisisIds, []);
 assert.equal(saved.checksum, preparation.checksum);
 assert.deepEqual(saved.campaign,preparation.campaign);
});

test('Répétition Chicago à cinq terminaux : choix binaires, accords, jauges et confidentialité', async t => {
 const {serveHotspringTest,hotspringClient,hotspringTestKey} = await import('./helpers/hotspring-http.mjs');
 const server = await serveHotspringTest();
 t.after(server.close);
 const campaign = fixture();
 const {crisisIds} = prepareCosaNostra(campaign);
 const scenes = campaign.dilemmas.filter(d => d.type === 'Pivot' || crisisIds.includes(d.id)).sort((a,b) => a.id.localeCompare(b.id));
 const scene = scenes[0];
 const adopted=scene.options.find(o=>o.choice==='CONTRE');
 const declined=scene.options.find(o=>o.choice==='POUR');
 const put = async body => {
  const response = await fetch(server.origin + route, {
   method:'PUT',headers:{Authorization:'Bearer '+hotspringTestKey,'Content-Type':'application/json'},body:JSON.stringify(body)
  });
  assert.equal(response.status, 200);
  return (await response.json()).preparation;
 };
 const imported = await put({campaign,revision:0});
 const saved = await put({revision:imported.revision,crisisIds});
 const created = await server.request('/api/founders/cosa-nostra/sessions',{
  body:{revision:saved.revision,members:[2,3,4,5,6],code:'CN_TEST',title:'Chicago en répétition'},
  token:hotspringTestKey,status:201
 });
 assert.equal(created.access.length,5);
 const game = hotspringClient(server,created);
 let publicView = await game.projection();
 assert.equal(publicView.chicago,true);
 assert.equal(publicView.gaugeMaximum,100);
 assert.deepEqual(Object.values((await game.regie()).city),[50,50,50,50,50,50]);
 assert.deepEqual(publicView.city,(await game.regie()).city);
 assert.equal(Object.keys(publicView.cityLevels).length,5);
 assert.deepEqual(publicView.families.map(f => f.name),campaign.metadata.family_objectives.map(objective => objective.family));
 assert.deepEqual(publicView.families.map(f => f.members),[2,3,4,5,6]);
 for(const [index, {family}] of created.access.entries()){
  const view = await game.family(family);
  const expected=campaign.metadata.family_objectives[index].major_slots.map(([id,choice])=>{
   const scene=scenes.find(d=>d.id===id);
   return {title:scene.title,choice,proposal:scene.options.find(o=>o.choice===choice).title,status:'upcoming',current:false,excluded:false};
  });
  assert.deepEqual(view.chicagoAmbition.pivots,expected);
  assert.equal(view.chicagoFamilyObjectives,undefined);
  assert.doesNotMatch(JSON.stringify(view.chicagoAmbition),/60\s*\/\s*100|major_slots|secret_success|CN_\d|0\d\.0\d/);
  assert.equal(view.chicagoAmbition.pivots.length,3);
  assert.equal(view.scenario,undefined);
 }
 assert.equal(publicView.chicagoAmbition,undefined);
 assert.equal(publicView.chicagoFamilyObjectives,undefined);
 await game.command(publicView,'start');
 publicView = await game.projection();
 assert.equal(publicView.phase,'PRESENTATION');
 assert.equal(publicView.clock.deadline,null);
 assert.equal(publicView.stabilityLevel,2);
 assert.equal(publicView.stabilityScore,50);
 assert.deepEqual(publicView.dilemma.labels, {pour:declined.title,contre:adopted.title});
 assert.equal(publicView.dilemma.outcomes,undefined);
 const artUrl=publicView.dilemma.image.url;
 assert.equal((await fetch(server.origin+artUrl)).status,200);
 assert.equal((await fetch(server.origin+artUrl.replace('-intro.webp','-contre.webp'))).status,404);
 assert.equal(publicView.dilemma.publicOptions.pour.compromise,declined.public_compromise);
 assert.equal(JSON.stringify(publicView).includes(declined.after),false);
 assert.equal(publicView.dilemma.sourceChoices,undefined);
 await game.command(publicView,'next');
 publicView=await game.projection();
 assert.equal(publicView.phase,'NEGOTIATION');
 await game.command(publicView,'offer',{id:'chicago-binding-1',to:'B',amount:1,reason:'Accord test',commitment:{choice:'contre',minInfluence:1}},'A');
 await game.command(await game.projection(),'acceptOffer',{id:'chicago-binding-1'},'B');
 assert.equal((await game.family('B')).voteCommitment.choice,'contre');
 assert.equal((await game.family('A')).self.dollars,9);
 assert.equal((await game.family('B')).self.dollars,11);
 await game.command(await game.projection(),'pause');
 assert.equal((await game.projection()).clock.paused,true);
 await game.command(await game.projection(),'resume');

 for(let index=0;index<scenes.length;index++){
  await game.command(await game.projection(),'beginVote');
  let view = await game.projection();
  for(let turn=0;turn<12&&view.phase==='COUNCIL';turn++){
   const council = view.council;
   if(council.phase==='await_moderator')await game.command(view,'resolveTie',{winner:'contre'},view.moderator);
   else if(council.phase==='await_leader')await game.command(view,'chooseLeader',{family:council.pendingLeaderChoices[0]},view.moderator);
   else {
    const actor = await game.family(council.turn);
    const voted = Object.hasOwn(council.choices,council.turn);
    await game.command(view,'vote',voted?{kind:'maintien'}:
     actor.self.power?{kind:'contre',amount:1}:{kind:'passe_pouvoir'},council.turn);
   }
   view = await game.projection();
  }
  assert.equal(view.phase,'REVEALED');
  assert.equal(view.reveal.winner,'contre');
  assert.equal(view.reveal.id,'CN_'+scenes[index].id.replace('.','_'));
  const outcome=scenes[index].options.find(o=>o.choice==='CONTRE');
  assert.equal(view.reveal.narration,outcome.after);
  for(const [gauge,delta] of Object.entries(outcome.effects)){
   assert.equal(view.city[gauge],Math.max(0,Math.min(100,view.reveal.cityBefore[gauge]+delta)));
  }
  if(index===0){
   assert.equal((await fetch(server.origin+view.reveal.visual.url)).status,200);
   assert.equal((await fetch(server.origin+view.reveal.visual.url.replace('-contre.webp','-pour.webp'))).status,404);
   assert.equal(view.reveal.narration,adopted.after);
   for(const [gauge,delta] of Object.entries(adopted.effects))assert.equal(view.city[gauge],50+delta);
   assert.equal(view.reveal.sourceChoices,undefined);
  }
  assert.equal(view.dilemma,null);
  assert.ok(view.reveal.visual.url.endsWith('-contre.webp'));
  await game.command(view,'next');
  if(index+1<scenes.length)await game.command(await game.projection(),'next');
 }
 const ending = await game.projection();
 assert.equal(ending.phase,'SUCCESSION');
 assert.equal(ending.history.length,25);
 assert.ok(ending.history.every(record => /^CN_0[1-5]_0[1-6]$/.test(record.id)));
 assert.equal(ending.finalResults,null);
});
