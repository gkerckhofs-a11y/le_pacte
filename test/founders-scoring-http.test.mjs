import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
const TOKEN='v26-organizer-token-00000000000000000000';
const OWN='local-organizer';
test('HTTP : objectifs et barème sur mesure, secrets privés puis classement final public',async t=>{
 const store=new GameStore(':memory:'),server=createGameServer(store,TOKEN);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));store.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const request=async(path,method='GET',data,token=TOKEN)=>{
  const r=await fetch(base+path,{method,headers:{
   ...(token?{Authorization:'Bearer '+token}:{}),...(data?{'Content-Type':'application/json'}:{})},
   body:data?JSON.stringify(data):undefined});
  return {status:r.status,body:await r.json()};
 };
 const catalog=await request('/api/founders/catalog');
 assert.equal(catalog.status,200);
 assert.equal(Object.keys(catalog.body.goalCardPresets).length,6);
 assert.equal(catalog.body.scoreRulesPreset.secretFirst,3);
 const cards=structuredClone(catalog.body.goalCardPresets);
 cards.A.firstTarget=5;cards.A.secondTarget=8;
 const opts={scenarioId:'fondateurs-hot-spring-demo',skinId:'western',
  code:'SCORE26',title:'Test de classement',members:[5,7,6,9,8,10],goalCards:cards,
  scoreRules:{...catalog.body.scoreRulesPreset,secretFirst:4,secretSecond:4}};
 const bad=structuredClone(opts);
 bad.code='BAD26';bad.goalCards.B.secondTarget=bad.goalCards.B.firstTarget;
 const denied=await request('/api/founders/sessions','POST',bad);
 assert.equal(denied.status,400);
 assert.equal(store.narrative.list(OWN).length,0);
 const created=await request('/api/founders/sessions','POST',opts);
 assert.equal(created.status,201,JSON.stringify(created.body));
 const id=created.body.id;
 const keys=Object.fromEntries(created.body.access.map(a=>[a.family,a.token]));
 const readPublic=()=>request('/api/founders/sessions/'+id,'GET',undefined,null);
 const begin=await readPublic();
 assert.equal(begin.body.finalResults,null);
 assert.equal(JSON.stringify(begin.body).includes('Guilde des négociants'),false);
 const readFamily=await request('/api/founders/sessions/'+id,'GET',undefined,keys.A);
 assert.equal(readFamily.body.goalCard.id,'F_A');
 assert.equal(readFamily.body.goalProgress.maxPoints,8);
 assert.equal(JSON.stringify(readFamily.body).includes('"F_B"'),false);
 const actors=Object.fromEntries([...('ABCDEF')].map(f=>[f,store.narrative.authenticate(id,keys[f],Date.now())]));
 let now=Date.now();
 const act=(actor,kind,data={})=>{
  const current=store.narrative.get(id);
  return store.narrative.command(id,actor,{kind,data,expectedRevision:current.revision},++now);
 };
 const organizer={role:'organizer',id:OWN};
 act(organizer,'start');
 for(let round=0;round<8;round++){
  for(const f of 'ABCDEF')act(actors[f],'vote',f==='A'?{kind:'pour',amount:1}:{kind:'passe_pouvoir'});
  assert.equal(store.narrative.get(id).phase,'AWAITING_REVEAL');
  act(organizer,'reveal');
  act(organizer,'next');
 }
 const result=await readPublic();
 assert.equal(result.status,200);
 assert.equal(result.body.phase,'FINISHED');
 assert.equal(result.body.finalResults.ranking.length,6);
 assert.equal(result.body.finalResults.ranking.filter(r=>r.rank===1).length,1);
 assert.equal(result.body.finalResults.winner,result.body.finalResults.ranking[0].family);
 assert.equal(result.body.finalResults.version,'founders-score-v2.6');
 assert.equal(result.body.source,undefined);
 assert.equal(result.body.finalResults.ranking[0].score.total<=16,true);
 const family=await request('/api/founders/sessions/'+id,'GET',undefined,keys.A);
 assert.equal(family.body.finalResults.winner,result.body.finalResults.winner);
});
