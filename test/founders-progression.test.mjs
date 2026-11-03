import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foundersPreview} from '../server/founders-catalog.ts';
import {validateFoundersStory} from '../src/founders-library.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativePublicView,narrativeFamilyView,narrativeOrganizerView} from '../src/founders-live.ts';
import {narrativeReserve,chooseNarrativeNext} from '../src/founders-progression.ts';
import {analyzeFoundersGoalReachability} from '../src/founders-scoring.ts';
import {simulateFoundersPolicies} from '../src/founders-policy-lab.ts';
const org={role:'organizer',id:'qa'};
const fixture=(seed=1)=>createNarrativeSession(foundersPreview({scenarioId:'hot-spring-reserve-hybride',skinId:'western'}),{id:seed.toString(16).padStart(24,'0'),ownerId:'qa',code:'HYBRID',title:'Réserve'});
const cmd=(s,actor,kind,data={})=>applyNarrativeCommand(s,actor,{kind,data,expectedRevision:s.revision},s.updatedAt+1);
function resolve(s,winner='pour'){
 const payer=Object.keys(s.game.families).sort((a,b)=>s.game.families[b].power-s.game.families[a].power)[0];let count=0;
 while(s.game.vote?.phase==='voting'){
  if(++count>50)throw Error('Vote did not finish');
  const f=s.game.vote.turn;
  const data=s.game.vote.choices[f]!==undefined?{kind:'maintien'}:f===payer?{kind:winner,amount:1}:{kind:'passe_pouvoir'};
  s=cmd(s,{role:'team',family:f},'vote',data);
 }
 if(s.game.vote?.phase==='await_moderator')s=cmd(s,{role:'team',family:s.game.moderator},'resolveTie',{winner});
 assert.equal(s.phase,'AWAITING_REVEAL');return cmd(s,org,'reveal');
}
test('Hybrid: only revealed decisions unlock arcs; low gauges make events eligible, public views never contain the reserve',()=>{
 let s=fixture();assert.deepEqual(validateFoundersStory(s.scenario),[]);
 s=cmd(s,org,'start');assert.equal(narrativePublicView(s).progression,undefined);
 s=resolve(s);let reserve=narrativeReserve(s);
 assert.ok(reserve.candidates.some(c=>c.id==='D02'));assert.ok(reserve.candidates.some(c=>c.id==='D06'));
 assert.ok(!reserve.candidates.some(c=>c.id==='D03'));assert.ok(!reserve.candidates.some(c=>c.id==='D11'));
 const before=structuredClone(s);assert.throws(()=>cmd(s,org,'next',{dilemmaId:'D03'}),/admissible/);assert.deepEqual(s,before);
 assert.throws(()=>cmd(s,{role:'team',family:'A'},'next',{dilemmaId:'D02'}),/Régie/);
 const snapshot=JSON.parse(JSON.stringify(s));assert.equal(chooseNarrativeNext(s),chooseNarrativeNext(snapshot));
 s=cmd(s,org,'next',{dilemmaId:'D02'});s=resolve(s);s=cmd(s,org,'next',{dilemmaId:'D05'});s=resolve(s,'contre');
 s.game.city.satisfaction=4;reserve=narrativeReserve(s);assert.ok(reserve.candidates.some(c=>c.id==='D11'));
 s.game.city.satisfaction=5;assert.ok(!narrativeReserve(s).candidates.some(c=>c.id==='D11'));
 assert.ok(narrativeOrganizerView(s).progression.candidates);
 for(const pub of [narrativePublicView(s),narrativeFamilyView(s,'A')]){
  assert.equal(pub.progression,undefined);assert.equal(pub.scenario,undefined);assert.equal(JSON.stringify(pub).includes('initial_dilemmas'),false);
 }
 assert.ok(!reserve.candidates.some(c=>c.id==='D02'));
});
test('Hybrid: 120 complete sessions respect 8–10 councils, play all required chapters once and produce distinct orders',()=>{
 const paths=new Set();let min=99,max=0;
 for(let seed=1;seed<=120;seed++){
  let s=cmd(fixture(seed),org,'start'),steps=0;
  while(s.phase!=='FINISHED'){
   if(++steps>25)throw Error('Progression loop');
   s=resolve(s,(seed+s.revealedHistory.length)%3===0?'contre':'pour');
   const reserve=narrativeReserve(s);assert.equal(reserve.blocked,null);
   s=cmd(JSON.parse(JSON.stringify(s)),org,'next');
  }
  const ids=s.revealedHistory.map(h=>h.id);assert.equal(new Set(ids).size,ids.length);
  assert.equal(ids[0],'D01');assert.equal(ids.at(-1),'D10');
  for(const id of ['D04','D05','D08','D09'])assert.ok(ids.includes(id));
  assert.ok(ids.length>=8&&ids.length<=10);min=Math.min(min,ids.length);max=Math.max(max,ids.length);
  assert.ok(s.narrativeEnding.paragraphs.length>=2);
  assert.deepEqual(narrativePublicView(s).narrativeEnding.city,s.game.city);
  const rail=s.revealedHistory[0].winner;
  assert.equal(ids.includes('D03'),rail==='contre');
  if(rail==='contre')assert.equal(ids.includes('D02'),false);
  paths.add(ids.join('>'));
 }
 assert.ok(paths.size>4);console.log(JSON.stringify({sessions:120,distinctOrders:paths.size,minCouncils:min,maxCouncils:max}));
});
test('Hybrid: manual finale is unavailable too early, mandatory chapters and budget cannot be bypassed',()=>{
 let s=cmd(fixture(),org,'start');s=resolve(s);
 assert.throws(()=>cmd(s,org,'next',{dilemmaId:'D10'}),/admissible/);
 const required=s.scenario.dilemmas.filter(d=>d.access.category==='required');
 s.revealedHistory=required.slice(0,-1).map(d=>({id:d.id,winner:'pour'}));
 // Invalid author configuration is reported instead of inventing a chapter.
 s.scenario.scenario.progression.min_councils=10;
 for(const d of s.scenario.dilemmas)if(d.id!=='D01'&&d.id!=='D10')d.access.conditions=[{type:'resolved',minimum:50}];
 assert.match(narrativeReserve(s).blocked,/Aucun dilemme admissible/);
 assert.throws(()=>chooseNarrativeNext(s),/Aucun dilemme/);
});
test('Hybrid: impossible schema, unknown references, unsafe conditions and too many required chapters are rejected',()=>{
 for(const mutate of [
  s=>s.scenario.progression.initial_dilemmas.push('MISSING'),
  s=>s.dilemmas[0].outcomes.pour.unlocks.push('MISSING'),
  s=>s.dilemmas[1].access.conditions=[{type:'execute',code:'alert(1)'}],
  s=>s.scenario.progression.max_councils=2,
  s=>s.scenario.progression.finale_id='D01',
  s=>s.dilemmas[0]=null
 ]){const s=fixture().scenario;mutate(s);assert.ok(validateFoundersStory(s).length);}
});
test('Hybrid: old branch-only analyzers reject the new mode rather than reporting misleading balance figures',()=>{
 const story=fixture().scenario;
 assert.throws(()=>analyzeFoundersGoalReachability(story),/hybride/);
 assert.throws(()=>simulateFoundersPolicies(story),/hybride/);
});

test('Hybrid: identical POUR decisions can lead to different chapter orders across sessions',()=>{
 const paths=new Set();
 for(let seed=200;seed<216;seed++){
  let s=cmd(fixture(seed),org,'start');
  while(s.phase!=='FINISHED'){s=resolve(s,'pour');s=cmd(s,org,'next');}
  paths.add(s.revealedHistory.map(h=>h.id).join('>'));
 }
 assert.ok(paths.size>1);
});
