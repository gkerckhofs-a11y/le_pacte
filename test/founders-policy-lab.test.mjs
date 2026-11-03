import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFoundersGame,totalPower,FOUNDERS_DEFAULT_CALIBRATION,validateFoundersCalibration} from '../src/founders.ts';
import {foundersPreview} from '../server/founders-catalog.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativePublicView} from '../src/founders-live.ts';
import {simulateFoundersPolicies} from '../src/founders-policy-lab.ts';
import {analyzeFoundersGoalReachability} from '../src/founders-scoring.ts';

const story=JSON.parse(readFileSync(new URL('../content/fondateurs-sheet-sample-v1.json',import.meta.url),'utf8'));
const custom={
 initialPower:11,initialDollars:14,initialPool:7,
 city:{economie:4,securite:6,satisfaction:6,bien_etre:5,developpement:3,stabilite:5}
};
test('Ressources initiales configurables : invariant au-delà des 51 points par défaut',()=>{
 assert.deepEqual(validateFoundersCalibration(custom),[]);
 const s=createFoundersGame({members:[5,8,6,7,12,9],calibration:custom});
 assert.equal(s.powerSupply,73);
 assert.equal(s.pool,7);assert.equal(totalPower(s),73);
 assert.equal(s.families.C.dollars,14);assert.equal(s.families.E.power,11);
 assert.equal(s.city.developpement,3);
 const preview=foundersPreview({scenarioId:'fondateurs-hot-spring-demo',skinId:'western',calibration:custom});
 assert.equal(preview.game.powerSupply,73);
 const game=createNarrativeSession(preview,{
  id:'123456789012123456789012',ownerId:'local-organizer',code:'CALIB77',title:'Essai',
  now:2000
 });
 const started=applyNarrativeCommand(game,{role:'organizer',id:'local-organizer'},
   {kind:'start',expectedRevision:0},2001);
 const voted=applyNarrativeCommand(started,{role:'team',family:'A'},
   {kind:'vote',expectedRevision:1,data:{kind:'pour',amount:5}},2002);
 assert.equal(totalPower(voted.game),73);
 assert.equal(narrativePublicView(voted).city.developpement,3);
 assert.equal(voted.game.families.A.power,6);
 assert.equal(FOUNDERS_DEFAULT_CALIBRATION.initialPower,8);
});
test('Invalides : calibrages hors limites et indicateurs supplémentaires rejetés',()=>{
 assert.ok(validateFoundersCalibration({...custom,initialPower:0}).length>0);
 assert.ok(validateFoundersCalibration({...custom,initialDollars:101}).length>0);
 assert.ok(validateFoundersCalibration({...custom,city:{...custom.city,foo:5}}).length>0);
 assert.throws(()=>createFoundersGame({calibration:{...custom,initialPool:200}}));
 const a=analyzeFoundersGoalReachability(story,undefined,{initialCity:custom.city});
 const b=analyzeFoundersGoalReachability(story);
 assert.equal(a.endings,256);assert.equal(b.endings,256);
 assert.notDeepEqual(a.initialCity,b.initialCity);
});
test('Laboratoire déterministe : les trois comportements terminent des parties entières',()=>{
 for(const mode of ['prudent','ambitieux','mixte']){
  const s=simulateFoundersPolicies(story,{runs:18,seed:34567,mode,calibration:custom});
  assert.equal(s.attempts,18);
  assert.equal(s.completed,18,JSON.stringify(s.failures));
  assert.equal(s.failed,0);
  assert.equal(s.meanCouncils,8);
  assert.equal(Object.values(s.families).reduce((sum,f)=>sum+f.wins,0),18);
  assert.ok(Math.abs(Object.values(s.families).reduce((sum,f)=>sum+f.winShare,0)-1)<1e-12);
  assert.ok(s.meanVoteActionsPerCouncil>=3);
  assert.ok(s.meanOffersAcceptedPerGame>=0);
  assert.ok(s.examples.every(x=>x.dilemmas===8));
 }
});
test('Laboratoire reproductible, mais non probant sur le comportement humain',()=>{
 const args={runs:24,seed:91234,mode:'mixte'};
 const a=simulateFoundersPolicies(story,args);
 const b=simulateFoundersPolicies(story,args);
 assert.deepEqual(a,b);
 assert.equal(a.completed,24,JSON.stringify(a.failures));
 assert.match(a.caution,/ni des données humaines/);
 assert.equal(a.completed+a.failed,a.attempts);
 assert.throws(()=>simulateFoundersPolicies(story,{runs:121}),/répétitions/);
 assert.throws(()=>simulateFoundersPolicies(story,{mode:'magique'}),/Politique/);
});
test('Garde-fou anti-boucle : limitation déclarée sans inventer de vainqueur',()=>{
 const s=simulateFoundersPolicies(story,{runs:3,seed:123,mode:'mixte',maxDilemmas:1});
 assert.equal(s.completed,0);assert.equal(s.failed,3);
 assert.equal(Object.values(s.families).reduce((n,f)=>n+f.wins,0),0);
 assert.equal(s.families.A.winShare,null);
 assert.ok(Object.keys(s.failures).some(x=>x.includes('Trop de dilemmes')));
});
