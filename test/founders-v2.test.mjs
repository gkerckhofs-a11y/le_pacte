import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foundersPreview} from '../server/founders-catalog.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativePublicView,narrativeFamilyView} from '../src/founders-live.ts';
import {advanceNarrativeTime,GOALS_V2} from '../src/founders-v2.ts';
import {totalPower,totalDollars} from '../src/founders.ts';
const owner={role:'organizer',id:'host'},team=id=>({role:'team',family:id});
const make=(n=5)=>createNarrativeSession(foundersPreview({scenarioId:'hot-spring-reserve-hybride',scenarioVersion:'2.0.0',skinId:'western',members:Array(n).fill(1)}),{id:'0'.repeat(24),code:'V2TEST',title:'Test V2',ownerId:'host',now:1000});
const cmd=(s,actor,kind,data={},now=2000)=>applyNarrativeCommand(s,actor,{kind,data,expectedRevision:s.revision},now);
const start=(n=5)=>cmd(cmd(make(n),owner,'start'),owner,'beginVote');
for(const n of [5,6])test(`V2 ${n} : abstention sautée, camp verrouillé, surenchères et résolution automatique`,()=>{
 let s=start(n);const dollars=totalDollars(s.game),supply=totalPower(s.game);
 const vote=(id,kind,amount)=>s=cmd(s,team(id),'vote',{kind,...(amount===undefined?{}:{amount})});
 vote('A','pour',1);vote('B','contre',1);vote('C','passe_pouvoir');vote('D','pour',1);vote('E','passe_moderateur');if(n===6)vote('F','contre',1);
 assert.equal(s.game.vote.turn,'A');
 assert.throws(()=>cmd(s,team('A'),'vote',{kind:'contre',amount:1}),/définitif/);
 vote('A','maintien');vote('B','augmenter',2);assert.equal(s.game.vote.turn,'D');vote('D','maintien');assert.equal(s.game.vote.turn,n===6?'F':'A');if(n===6)vote('F','maintien');vote('A','augmenter',3);
 assert.equal(s.game.vote.turn,'B');vote('B','maintien');vote('D','maintien');if(n===6)vote('F','maintien');vote('A','maintien');
 assert.equal(s.phase,'REVEALED');assert.equal(s.game.vote,null);assert.equal(s.revealedHistory.length,1);assert.equal(s.lastReveal.yes,5);assert.equal(s.lastReveal.no,n===6?4:3);
 assert.deepEqual(s.game.city,{economie:7,ecologie:4,securite:4,demographie:7});
 assert.equal(totalPower(s.game),supply);assert.equal(totalDollars(s.game),dollars+2);
 const publicData=narrativePublicView(s);assert.ok(publicData.reveal);assert.equal(publicData.goalCards,undefined);
 assert.throws(()=>cmd(s,owner,'reveal'),/révéler/);
});
test('V2 : tout le monde s’abstient, puis le Shérif tranche et révèle automatiquement',()=>{
 let s=start();for(const id of 'ABCDE')s=cmd(s,team(id),'vote',{kind:'passe_pouvoir'});
 assert.equal(s.game.vote.phase,'await_moderator');s=cmd(s,team('E'),'resolveTie',{winner:'contre'});assert.equal(s.phase,'REVEALED');assert.equal(s.lastReveal.no,0);
});
test('V2 : proposition libre, message facultatif, solde revérifié et aucune double acceptation',()=>{
 let s=cmd(make(),owner,'start');
 s=cmd(s,team('A'),'offer',{id:'money_001',to:'B',amount:7,commitment:{choice:'pour',minInfluence:8}});
 s=cmd(s,team('A'),'offer',{id:'money_002',to:'C',amount:7});
 s=cmd(s,team('B'),'acceptOffer',{id:'money_001'});assert.equal(s.game.families.A.dollars,3);assert.equal(s.game.families.B.dollars,17);
 assert.throws(()=>cmd(s,team('C'),'acceptOffer',{id:'money_002'}),/Fonds/);
 assert.throws(()=>cmd(s,team('B'),'acceptOffer',{id:'money_001'}),/Offre/);
 assert.equal(narrativeFamilyView(s,'B').voteCommitment,null);
 s=cmd(s,team('C'),'rejectOffer',{id:'money_002'});assert.equal(s.offers.money_002.status,'rejected');
 s=cmd(s,owner,'beginVote');s=cmd(s,team('A'),'vote',{kind:'passe_pouvoir'});s=cmd(s,team('B'),'vote',{kind:'contre',amount:1});assert.equal(s.game.vote.choices.B,'contre');
});
test('V2 : horloge serveur, pause réelle, reprise, temps ajouté et transitions idempotentes',()=>{
 let s=cmd(make(),owner,'configureTiming',{timing:{negotiationSeconds:8,voteSeconds:10,resolutionSeconds:5,autoAdvance:true}});
 s=cmd(s,owner,'start',{},3000);assert.equal(s.clock.deadline,11000);
 s=cmd(s,owner,'pause',{},5000);assert.equal(s.clock.remainingMs,6000);assert.strictEqual(advanceNarrativeTime(s,99999),s);
 assert.throws(()=>cmd(s,team('A'),'offer',{id:'paused_01',to:'B',amount:1}),/pause/);
 s=cmd(s,owner,'adjustTime',{seconds:2},6000);s=cmd(s,owner,'resume',{},9000);assert.equal(s.clock.deadline,17000);
 assert.strictEqual(advanceNarrativeTime(s,16999),s);s=advanceNarrativeTime(s,17000);assert.equal(s.phase,'COUNCIL');assert.equal(s.clock.deadline,27000);assert.strictEqual(advanceNarrativeTime(s,27001),s);
 s=cmd(s,owner,'pause');assert.equal(narrativeFamilyView(s,'A').self.mayVote,false);
});
test('V2 : fin immédiate rembourse les mises, clôt les offres et produit un épilogue cohérent',()=>{
 let s=start();s=cmd(s,team('A'),'vote',{kind:'pour',amount:3});const supply=totalPower(s.game);
 assert.throws(()=>cmd(s,team('B'),'finish',{confirm:true}),/Régie/);assert.throws(()=>cmd(s,owner,'finish'),/Confirmation/);
 s=cmd(s,owner,'finish',{confirm:true});assert.equal(s.phase,'FINISHED');assert.equal(s.game.families.A.power,8);assert.equal(s.game.vote,null);assert.equal(totalPower(s.game),supply);assert.equal(s.finalResults.ranking.length,5);assert.match(s.narrativeEnding.title,/Épilogue/);assert.ok(s.narrativeEnding.paragraphs.some(p=>p.includes('Démographie')));
 assert.equal(s.finalResults.dilemmasResolved,0);assert.throws(()=>cmd(s,owner,'finish',{confirm:true}),/Confirmation/);
});
test('V2 : parcours complet automatique et snapshots après rechargement',()=>{
 let s=cmd(make(6),owner,'start');let count=0;
 while(s.phase!=='FINISHED'){
  if(s.phase==='NEGOTIATION')s=advanceNarrativeTime(s,s.clock.deadline);
  else if(s.phase==='COUNCIL'){
   const v=s.game.vote;s=v.phase==='await_moderator'?cmd(s,team(s.game.moderator),'resolveTie',{winner:'pour'}):v.phase==='await_leader'?cmd(s,team(s.game.moderator),'chooseLeader',{family:v.pendingLeaderChoices[0]}):cmd(s,team(v.turn),'vote',{kind:'passe_pouvoir'});
  }else {assert.equal(s.phase,'REVEALED');s=advanceNarrativeTime(s,s.clock.deadline);}
  s=JSON.parse(JSON.stringify(s));assert.ok(++count<200);
 }
 assert.equal(s.finalResults.ranking.length,6);assert.equal(s.revealedHistory.length,10);assert.equal(totalPower(s.game),51);assert.ok(s.narrativeEnding.decisions.length===10);
 for(const card of Object.values(GOALS_V2))assert.ok(Object.hasOwn(s.game.city,card.indicator));
});
