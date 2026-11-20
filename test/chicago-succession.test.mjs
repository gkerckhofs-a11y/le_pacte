import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareCosaNostra} from '../server/cosa-nostra-preparation.ts';
import {chicagoSessionPreview} from '../server/cosa-nostra-session.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativeView} from '../src/founders-live.ts';
import {chicagoScores} from '../src/chicago-succession.ts';
import {fixture} from './helpers/chicago.mjs';

const organizer={role:'organizer',id:'regie'},ids=['A','B','C','D','E'];
function game(){
 const {preview,names}=chicagoSessionPreview(prepareCosaNostra(fixture()),[5,5,5,5,5]);
 let state=createNarrativeSession(preview,{names,id:'ab'.repeat(12),ownerId:'regie',code:'CNTEST',title:'Chicago',initiativeOrder:[...ids].reverse()});
 return {get s(){return state;},view:(id)=>narrativeView(state,id?{role:'team',family:id}:{role:'public'}),
  cmd(kind,data={},id=null,revision=state.revision){
   state=applyNarrativeCommand(state,id?{role:'team',family:id}:organizer,{kind,data,expectedRevision:revision},state.updatedAt+1);
  }};
}
function finishCouncil(g) {
 g.cmd('beginVote');
 while(g.s.game.vote){
  const v=g.s.game.vote,who=v.turn;
  if(v.phase==='await_moderator')g.cmd('resolveTie',{winner:'pour'},g.s.game.moderator);
  else if(v.phase==='await_leader')g.cmd('chooseLeader',{family:v.pendingLeaderChoices[0]},g.s.game.moderator);
  else g.cmd('vote',Object.hasOwn(v.choices,who)?{kind:'maintien'}:g.s.game.families[who].power?{kind:'pour',amount:1}:{kind:'passe_pouvoir'},who);
 }
}
function ballot(g,choices){
 const round=g.view().succession.round,revision=g.s.revision;
 for(const [i,id] of ids.entries())g.cmd('castChicagoBallot',{round,candidate:choices[i]},id,revision);
 g.cmd('closeChicagoBallot');
}
test('Interruption du Conseil en pause : restaure les ressources, accords et titulaires du début du Conseil',()=>{
 const g=game();g.cmd('start');finishCouncil(g);g.cmd('next');
 const before=structuredClone(g.s.game);
 g.cmd('offer',{id:'offre-0001',to:'B',amount:2,commitment:{choice:'gift'}},'A');
 g.cmd('acceptOffer',{id:'offre-0001'},'B');
 g.cmd('beginVote');const who=g.s.game.vote.turn;
 g.cmd('vote',{kind:'passe_moderateur'},who);
 g.cmd('pause');g.cmd('requestChicagoFinale',{mode:'interrupt',confirm:true});
 assert.deepEqual(g.s.game,before);assert.equal(g.s.offers['offre-0001'].status,'cancelled');
 assert.equal(g.s.succession.request.transactions.length,1);assert.equal(g.view().history.length,1);
 assert.throws(()=>g.cmd('resume'),/figés/);assert.throws(()=>g.cmd('requestChicagoFinale',{confirm:true}));
});
test('Termine le Conseil en cours et conserve sa résolution une seule fois',()=>{
 const g=game();g.cmd('start');g.cmd('requestChicagoFinale',{mode:'finish',confirm:true});
 assert.equal(g.view().succession.stage,'requested');finishCouncil(g);
 assert.equal(g.view().phase,'SUCCESSION');assert.equal(g.s.revealedHistory.length,1);
 assert.equal(g.s.succession.frozen.roles.mayor,g.s.game.history[0].leader);
 assert.throws(()=>g.cmd('next'));
});
test('Cinq bulletins immuables, concurrence, confidentialité et proclamation',()=>{
 const g=game();assert.throws(()=>g.cmd('requestChicagoFinale',{confirm:true},'A'));
 g.cmd('requestChicagoFinale',{confirm:true});g.cmd('openChicagoBallot');
 const rev=g.s.revision;
 assert.throws(()=>g.cmd('castChicagoBallot',{round:1,candidate:'A'},'A'));
 assert.throws(()=>g.cmd('closeChicagoBallot'));
 g.cmd('castChicagoBallot',{round:1,candidate:'B'},'A');
 assert.equal(g.view('A').succession.hasVoted,true);
 assert.equal(g.view('B').succession.hasVoted,false);
 assert.deepEqual(g.view().succession,{stage:'ballot',round:1,received:1});
 assert.throws(()=>g.cmd('castChicagoBallot',{round:1,candidate:'C'},'A',rev));
 for(const id of ids.slice(1))g.cmd('castChicagoBallot',{round:1,candidate:'A'},id,rev);
 g.cmd('closeChicagoBallot');assert.equal(g.view().finalResults,null);
 assert.equal(g.view().succession.stage,'sealed');g.cmd('revealChicago');
 const winner=g.view().finalResults.rows[0];assert.equal(winner.family,'A');assert.equal(winner.total,8);
 assert.equal(g.view().narrativeEnding.paragraphs[0],fixture().metadata.winner_epilogues.Moretti);
 assert.throws(()=>g.cmd('revealChicago'));
});
test('Cinq ex æquo, voix en cercle, aucun titulaire : deux tours au plus et priorité initiale',()=>{
 const g=game();g.cmd('requestChicagoFinale',{confirm:true});g.cmd('openChicagoBallot');
 ballot(g,['B','C','D','E','A']);assert.equal(g.view().succession.round,2);
 ballot(g,['B','C','D','E','A']);assert.equal(g.view().succession.round,3);
 assert.deepEqual(g.view('E').succession.candidates,['D']);
 ballot(g,['D','E','D','E','D']);g.cmd('revealChicago');assert.equal(g.view().finalResults.winner,'D');
});
for(const n of [0,3,7,15,25])test('Finale après '+n+' Conseils : opportunités communes et barème borné',()=>{
 const g=game();
 if(n)g.cmd('start');
 for(let i=0;i<n;i++){finishCouncil(g);if(i+1<n)g.cmd('next');}
 const scores=chicagoScores(g.s),common=Math.min(...scores.map(r=>r.pivots.length));
 for(const r of scores){
  assert.equal(r.common,common);assert.equal(r.favorable,r.pivots.slice(0,common).filter(p=>p.favorable).length);
  assert.equal(r.major,common&&r.favorable>=Math.ceil(2*common/3)?5:0);assert.ok(r.secret<=10);
 }
 g.cmd('requestChicagoFinale',{confirm:true});assert.deepEqual(g.s.succession.frozen.scores,scores);
});
for(const [mayor,commissioner,eligible] of [['C','D','C'],['A','D','D']]){
 test('Arbitrage entre A et B par le titulaire neutre '+eligible,()=>{
  const g=game();g.cmd('requestChicagoFinale',{confirm:true});
  // A frozen role pair isolates the exceptional tie path from ordinary auctions.
  g.s.succession.frozen.roles={mayor,commissioner};
  g.cmd('openChicagoBallot');ballot(g,['B','A','A','B','C']);
  assert.equal(g.view().succession.stage,'arbitration');
  assert.equal(g.view('A').succession.arbitrate,undefined);
  assert.throws(()=>g.cmd('arbitrateChicago',{candidate:'B'},'A'));
  assert.throws(()=>g.cmd('arbitrateChicago',{candidate:'E'},eligible));
  g.cmd('arbitrateChicago',{candidate:'B'},eligible);g.cmd('revealChicago');
  assert.equal(g.view().finalResults.rows[0].family,'B');
 });
}
test('Plafond de 18 points pour dix points d’ambition et quatre voix',()=>{
 const g=game();g.cmd('requestChicagoFinale',{confirm:true});
 Object.assign(g.s.succession.frozen.scores[0],{small:2,medium:3,major:5,secret:10});
 g.cmd('openChicagoBallot');ballot(g,['B','A','A','A','A']);g.cmd('revealChicago');
 assert.equal(g.view().finalResults.rows[0].total,18);
});
