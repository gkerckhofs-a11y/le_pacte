import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign,team} from './helpers/hotspring.mjs';
import {fixture} from './helpers/chicago.mjs';
import {prepareCosaNostra} from '../server/cosa-nostra-preparation.ts';
import {chicagoSessionPreview} from '../server/cosa-nostra-session.ts';
import {narrativeOrganizerView,narrativePublicView,narrativeFamilyView,createNarrativeSession,applyNarrativeCommand} from '../src/founders-live.ts';

const solo={scenarioVersion:'1.2.0',rehearsal:true};
test('Seule la régie d’une partie de test peut saisir les votes des familles',()=>{
 for(const rehearsal of [false,true]){
  const g=newCampaign({...solo,rehearsal});
  g.command('start');g.untilCouncil();
  const family=g.state.game.vote.turn;
  const vote={family,action:'vote',payload:{kind:'pour',amount:1}};
  for(const view of [narrativePublicView(g.state),narrativeFamilyView(g.state,family)])assert.equal(view.rehearsalTurn,undefined);
  assert.throws(()=>g.command('rehearsalAction',vote,team(family)),/réservée/);
  assert.throws(()=>g.command('rehearsalPass',{},team(family)),/réservée/);
  if(!rehearsal){
   assert.throws(()=>g.command('rehearsalAction',vote),/réservée/);
   assert.throws(()=>g.command('rehearsalPass'),/réservée/);
   continue;
  }
  assert.throws(()=>g.command('rehearsalAction',{...vote,action:'finish'}),/inconnue/);
  assert.throws(()=>g.command('rehearsalAction',{...vote,family:'F'}),/inconnue/);
  g.command('pause');assert.equal(narrativeOrganizerView(g.state).rehearsalTurn,null);
  assert.throws(()=>g.command('rehearsalPass'),/pause/);g.command('resume');
  const rev=g.state.revision;
  g.command('rehearsalAction',vote);
  assert.throws(()=>applyNarrativeCommand(g.state,{role:'organizer',id:'organizer'},{kind:'rehearsalPass',expectedRevision:rev},g.state.updatedAt+1),/périmée/);
  g.command('rehearsalPass');assert.equal(g.state.lastReveal.winner,'pour');
 }
});

test('Hotspring en solo traverse les Conseils, les chartes et l’épilogue',()=>{
 const g=newCampaign(solo);
 g.command('start');
 let supports=0;
 for(let step=0;step<350&&g.state.phase!=='FINISHED';step++){
  const s=narrativeOrganizerView(g.state),turn=s.rehearsalTurn;
  if(turn){
   const {family,kind:action}=turn;
   if(action==='vote')g.command('rehearsalPass');
   else{
    const payload=action==='supportCharter'?{charter:turn.candidates[family<'D'?0:1]}:
     action==='chooseLeader'?{family:turn.candidates[0]}:{winner:'pour'};
    if(action==='supportCharter')supports++;
    g.command('rehearsalAction',{family,action,payload});
   }
  }else g.command(s.phase==='EPILOGUE'?'showResults':s.phase==='NEGOTIATION'?'beginVote':'next');
 }
 assert.ok(supports>=5);assert.equal(g.state.phase,'FINISHED');assert.equal(g.state.finalResults.rows.length,5);
});

test('Chicago en solo joue tout le parcours puis les cinq bulletins du Parrain',()=>{
 const {preview,names}=chicagoSessionPreview(prepareCosaNostra(fixture()),[5,5,5,5,5]);
 const owner={role:'organizer',id:'org'};
 let state=createNarrativeSession(preview,{id:'ca'.repeat(12),ownerId:'org',code:'CHITEST',title:'Chicago test',names,rehearsal:true});
 const cmd=(kind,data={})=>{state=applyNarrativeCommand(state,owner,{kind,data,expectedRevision:state.revision},state.updatedAt+1);};
 cmd('start');
 for(let i=0;i<220&&state.phase!=='FINISHED';i++){
  const s=narrativeOrganizerView(state),turn=s.rehearsalTurn;
  if(turn){
   const {family,kind:action}=turn;
   if(action==='vote')cmd('rehearsalPass');
   else{
    const payload=action==='castChicagoBallot'?{round:turn.round,candidate:turn.candidates[0]}:
     action==='resolveTie'?{winner:'contre'}:action==='chooseLeader'?{family:turn.candidates[0]}:{candidate:turn.candidates[0]};
    cmd('rehearsalAction',{family,action,payload});
   }
  }else if(s.phase==='SUCCESSION'){
   cmd(({negotiations:'openChicagoBallot',ballot:'closeChicagoBallot',sealed:'revealChicago'})[s.succession.stage]);
  }else if(s.phase==='REVEALED'&&s.reveal.nextId===null)cmd('requestChicagoFinale',{mode:'immediate',confirm:true});
  else cmd(s.phase==='NEGOTIATION'?'beginVote':'next');
 }
 assert.equal(state.phase,'FINISHED');assert.equal(state.revealedHistory.length,25);
 assert.equal(state.finalResults.rows.length,5);assert.ok(state.finalResults.winner);
});
