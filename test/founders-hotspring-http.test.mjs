import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHotspringTestGame,hotspringClient,hotspringTestKey,playHotspringTo,serveHotspringTest} from './helpers/hotspring-http.mjs';

test('Hotspring HTTP : reprise SQLite en cours de scrutin puis campagne complète à cinq terminaux',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'hotspring-db-'));
 const file=join(dir,'campaign.sqlite');
 let now=Date.UTC(2026,10,18,10);
 let server=await serveHotspringTest({file,clock:()=>now});
 t.after(async()=>{await server.close();rmSync(dir,{recursive:true,force:true});});

 const rules=await fetch(server.origin+'/hotspring-rules.js');
 assert.equal(rules.status,200);
 assert.match(rules.headers.get('content-type'),/^text\/javascript/);
 assert.match(await rules.text(),/Un dilemme en 5 étapes/);

 const original=await server.request('/api/founders/sessions',{token:hotspringTestKey,status:201,body:{
  scenarioId:'fondateurs-hot-spring-demo',skinId:'western',code:'ORIGINAL',title:'Parcours original',members:[1,1,1,1,1,1]}});
 const initialOriginal=await hotspringClient(server,original).projection();
 const session=await createHotspringTestGame(server,{scenarioVersion:'1.1.0'});
 assert.equal(session.access.length,5);
 let client=hotspringClient(server,session);
 const ready=await client.projection();
 assert.equal(ready.phase,'READY');
 assert.equal(ready.story.schemaVersion,'1.1.0');
 assert.deepEqual(ready.city,{economie:5,ecologie:5,securite:5,bien_etre:5,demographie:5,stabilite:5});

 for(const {family,token} of session.access){
  const sheet=await server.request('/api/founders/access-qr',{token:hotspringTestKey,body:{
   session:session.id,family,token,origin:server.origin}});
  const link=new URL(sheet.link);
  assert.equal(link.searchParams.get('session'),session.id);
  assert.equal(link.searchParams.get('family'),family);
  const view=await client.family(family);
  assert.equal(view.self.id,family);
  assert.ok(view.privateCampaign.briefing);
  assert.equal(view.campaignAdmin,undefined);
 }
 await client.command(ready,'start');
 const intro=await client.projection();
 assert.match(intro.campaign.intro.text,/semaines de piste/);
 await client.command(intro,'next');
 await client.command(await client.projection(),'next');
 const negotiation=await client.projection();
 await client.command(negotiation,'offer',{id:'pret-hotspring',to:'B',amount:1,reason:'Ravitaillement du convoi'},'A');
 await client.command(await client.projection(),'acceptOffer',{id:'pret-hotspring'},'B');
 await client.command(await client.projection(),'beginVote');

 const council=await client.projection();
 await client.command(council,'vote',{kind:'pour',amount:2},council.council.turn);
 const voted=await client.projection(),budget=(await client.family('B')).self.dollars;
 assert.equal(voted.council.bids[council.council.turn],2);
 const remaining=voted.clock.deadline-now;
 await client.command(voted,'endSitting');

 await server.close();
 now+=600_000;
 server=await serveHotspringTest({file,port:server.port,clock:()=>now});
 client=hotspringClient(server,session);
 const suspended=await client.projection();
 assert.equal(suspended.phase,'SUSPENDED');
 await client.command(suspended,'resumeSitting');

 const resumed=await client.projection();
 assert.equal(resumed.phase,'COUNCIL');
 assert.deepEqual(resumed.council,voted.council);
 assert.deepEqual(resumed.city,voted.city);
 assert.equal(resumed.clock.deadline-now,remaining);
 assert.equal((await client.family('B')).self.dollars,budget);

 const ending=await playHotspringTo(client,'EPILOGUE');
 assert.equal(ending.finalResults,null);
 assert.equal(ending.reveal,null);
 assert.equal(ending.campaign.archive,null);
 assert.ok(ending.campaign.epilogueRecap.length>=2);
 assert.ok(ending.history.some(d=>d.id==='D29'));
 assert.equal(ending.history.at(-1).id,'D30');
 assert.ok(!JSON.stringify(ending).includes((await client.family('B')).privateCampaign.briefing));
 await client.command(ending,'showResults');

 const final=await client.projection();
 assert.equal(final.phase,'FINISHED');
 assert.equal(final.finalResults.rows.length,5);
 assert.ok(final.finalResults.rows.every(r=>r.maximum===18&&r.wealth>=0&&r.wealth<=3));
 assert.deepEqual((await client.family('B')).privateCampaign.score,final.finalResults.rows.find(r=>r.family==='B'));
 assert.equal(final.campaign.archive.charter,'A');
 assert.deepEqual((await client.projection()).campaign.landscape,final.campaign.landscape);
 const savedOriginal=await hotspringClient(server,original).projection();
 assert.equal(savedOriginal.phase,initialOriginal.phase);
 assert.equal(savedOriginal.revision,initialOriginal.revision);
 assert.equal(savedOriginal.families.length,6);
});

test('Hotspring HTTP V1.2 : accord préservé à la reprise et requêtes incompatibles rejetées',async t=>{
 const server=await serveHotspringTest();
 t.after(()=>server.close());
 const created=await createHotspringTestGame(server,{code:'HOT12'});
 const client=hotspringClient(server,created);
 const send=async(kind,data={},family)=>client.command(await client.projection(),kind,data,family);
 assert.equal((await client.projection()).story.schemaVersion,'1.2.0');
 assert.equal((await client.projection()).city.stabilite,5);
 await send('start');await send('next');await send('next');
 await send('offer',{id:'accord03',to:'B',amount:4,commitment:{choice:'pour',minInfluence:3}},'A');
 await send('acceptOffer',{id:'accord03'},'B');
 assert.deepEqual((await client.family('B')).voteCommitment,{choice:'pour',minInfluence:3});
 assert.equal((await client.family('B')).self.dollars,14);
 assert.equal((await client.projection()).offers,undefined);
 await send('endSitting');await send('resumeSitting');
 assert.equal((await client.projection()).clock.deadline,null);
 await send('beginVote');await send('vote',{kind:'pour',amount:1},'A');
 const before=await client.family('B');
 await assert.rejects(send('vote',{kind:'contre',amount:3},'B'),/position de vote/);
 await assert.rejects(send('vote',{kind:'passe_pouvoir'},'B'),/position de vote/);
 await assert.rejects(send('vote',{kind:'pour',amount:2},'B'),/mise minimale de 3/);
 assert.equal((await client.family('B')).revision,before.revision);
 await send('vote',{kind:'pour',amount:3},'B');
 assert.equal((await client.family('B')).self.power,before.self.power-3);
});
