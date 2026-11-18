import assert from 'node:assert/strict';
import {test} from 'node:test';
import {activeFounders} from '../src/founders.ts';
import {narrativePublicView,narrativeFamilyView,narrativeOrganizerView} from '../src/founders-live.ts';
import {advanceNarrativeTime} from '../src/founders-v2.ts';
import {availableCharters,crisisCandidates,hotspringOutcome} from '../src/founders-hotspring.ts';
import {autonomyIndex,chapterObjective,hotspringScores} from '../src/hotspring-scoring.ts';
import {hotspringSelection,newCampaign,simulateCampaign,team,trajectories} from './helpers/hotspring.mjs';
import {foundersPreview} from '../server/founders-catalog.ts';

test('Hotspring : cinq ambitions confidentielles, lecture et tendances avant le scrutin',()=>{
 assert.throws(()=>foundersPreview({...hotspringSelection,members:[1,1,1,1,1,1]}),/cinq familles/);
 const g=newCampaign();
 assert.equal(activeFounders(g.state.game).length,5);
 assert.deepEqual(Object.values(g.state.names),['Les Mercer','Les Doyle','Les Vance','Les Caldwell','Les Whitmore']);
 for(const f of Object.values(g.state.game.families)){assert.equal(f.power,8);assert.equal(f.dollars,10);}
 g.command('start');
 assert.match(narrativePublicView(g.state).campaign.intro.text,/cinq convois/);
 assert.equal(narrativePublicView(g.state).dilemma,null);
 let clock=advanceNarrativeTime(g.state,g.state.clock.deadline);
 assert.equal(clock.phase,'PRESENTATION');g.replaceState(clock);
 const publicView=narrativePublicView(g.state);
 assert.match(publicView.dilemma.tendencies.pour.join(' '),/Économie ↑/);
 assert.doesNotMatch(JSON.stringify(publicView),/VILLE_BASSE|objectives|trust|La ville basse est choisie|Le premier puits/);
 for(const id of activeFounders(g.state.game)){
  const own=narrativeFamilyView(g.state,id),other=Object.values(g.state.goals).filter(x=>x!==own.self.objective);
  assert.ok(own.privateCampaign.role);
  assert.equal(own.privateCampaign.objectives.length,5);
  assert.equal(own.privateCampaign.score,null);
  for(const secret of other)assert.ok(!JSON.stringify(own).includes(secret));
 }
});

test('Hotspring : surenchère, abstention sautée, sauvegarde du scrutin et des offres',()=>{
 const g=newCampaign();g.command('start');g.untilCouncil();
 g.command('vote',{kind:'pour',amount:2},team('A'));
 g.command('vote',{kind:'passe_pouvoir'},team('B'));
 g.command('vote',{kind:'contre',amount:1},team('C'));
 g.command('offer',{id:'d01-offer',to:'D',amount:2,reason:'Aide'},team('A'));
 const vote=structuredClone(g.state.game.vote),timeLeft=g.state.clock.deadline-g.state.updatedAt-100;
 assert.equal(narrativePublicView(g.state).council.bids.A,2);
 g.command('endSitting');
 assert.equal(g.state.phase,'SUSPENDED');
 assert.equal(narrativePublicView(g.state).campaign.checkpoint.ranking[0].maximum,2);
 assert.equal(narrativeOrganizerView(g.state).offers['d01-offer'].status,'pending');
 assert.throws(()=>g.command('vote',{kind:'pour',amount:1},team('D')),/Séance sauvegardée/);
 g.replaceState(JSON.parse(JSON.stringify(g.state)));
 const resumed=g.command('resumeSitting',{},undefined,g.state.updatedAt+90000000);
 assert.deepEqual(resumed.game.vote,vote);assert.equal(resumed.clock.deadline-resumed.updatedAt,timeLeft);
 g.command('acceptOffer',{id:'d01-offer'},team('D'));
 assert.equal(g.state.game.families.A.dollars,8);
 assert.equal(g.state.game.families.D.dollars,12);
 g.command('vote',{kind:'passe_pouvoir'},team('D'));
 g.command('vote',{kind:'passe_pouvoir'},team('E'));
 assert.equal(g.state.game.vote.turn,'A');
 g.command('vote',{kind:'augmenter',amount:1},team('A'));
 assert.equal(g.state.game.vote.turn,'C');
 g.command('vote',{kind:'maintien'},team('C'));
 g.command('vote',{kind:'maintien'},team('A'));
 assert.equal(g.state.phase,'REVEALED');
 assert.deepEqual(g.state.game.city,{economie:6,ecologie:5,securite:5,demographie:6});
 assert.deepEqual(g.state.campaign.markers,['VILLE_BASSE']);
 assert.equal(g.state.lastReveal.yes,3);
});

test('Hotspring : chaque objectif compte les groupes une fois et exige le seuil',()=>{
 const s=newCampaign().state;
 for(const f of Object.values(s.scenario.campaign.families)){
  for(const objective of f.objectives){
   assert.equal(chapterObjective(objective,new Set()),0,objective.title);
   assert.equal(chapterObjective(objective,new Set(objective.groups.slice(0,objective.required-1).flat())),0,objective.title);
   assert.equal(chapterObjective(objective,new Set(objective.groups.slice(0,objective.required).map(g=>g[0]))),2,objective.title);
  }
 }
 const doyle=s.scenario.campaign.families.doyle.objectives[2];
 assert.equal(chapterObjective(doyle,new Set(['ACCORD_RESPECTE','ALLIANCE_VALLEE','ENQUETE_CONJOINTE'])),0);
 assert.equal(autonomyIndex(new Set(['EAU_PRIVEE','CENTRE_PRIVE','CREDIT_LIMITE','IMPOT_LOCAL'])),2);
 let score=family=>hotspringScores(s).rows.find(r=>r.family===family);
 s.campaign.initialCity.economie=8;s.game.city.economie=7;
 assert.equal(score('A').trajectory,0);
 s.game.city.economie=9;assert.equal(score('A').trajectory,2);
 assert.equal(hotspringScores(s).rows[0].maximum,2);
});

test('Hotspring : variantes de l’eau, seuils et coûts différés',()=>{
 const s=newCampaign().state;
 s.campaign.markers=['VILLE_BASSE','QUARTIER_PROVISOIRE','CENTRE_PRIVE','ABATTOIR_CENTRAL'];
 assert.equal(crisisCandidates(s).find(c=>c.id==='D26A').available,true);
 let d=s.scenario.dilemmas.find(d=>d.id==='D26A');
 assert.equal(hotspringOutcome(s,d,'contre').effects.find(e=>e.indicator==='demographie').value,-5);
 s.campaign.markers=['VILLE_HAUTE','EAU_PRIVEE','ABATTOIR_CENTRAL'];
 assert.equal(crisisCandidates(s).find(c=>c.id==='D26B').available,true);
 d=s.scenario.dilemmas.find(d=>d.id==='D26B');
 assert.equal(hotspringOutcome(s,d,'contre').effects.find(e=>e.indicator==='securite').value,-2);
 d=s.scenario.dilemmas.find(d=>d.id==='D05');
 s.campaign.markers=['RESERVES_PUBLIQUES'];assert.equal(hotspringOutcome(s,d,'pour').effects.find(e=>e.indicator==='economie').value,-1);
 s.campaign.markers=['CENTRE_PRIVE'];assert.equal(hotspringOutcome(s,d,'pour').effects.find(e=>e.indicator==='economie').value,-2);
 assert.deepEqual(availableCharters(s).map(c=>c.id),['A','B','C']);
});

test('Hotspring : qualification sans mise, nouveau tour et fermeture explicite',()=>{
 const g=newCampaign();
 g.command('start');
 const s=g.state;
 s.phase='CHECKPOINT';s.campaign.chapter=6;s.campaign.completedChapters=[1,2,3,4,5];
 g.command('next');
 const start=g.state.game.families.A.power;
 for(const [i,f] of activeFounders(g.state.game).entries())g.command('supportCharter',{charter:['B','B','B','A','C'][i]},team(f));
 assert.equal(g.state.phase,'CHARTER_SUPPORT');
 assert.equal(g.state.campaign.qualification.round,2);
 assert.deepEqual(g.state.campaign.qualification.candidates,['A','C']);
 assert.deepEqual(g.state.campaign.qualification.qualified,['B']);
 for(const [i,f] of activeFounders(g.state.game).entries())g.command('supportCharter',{charter:i<3?'C':'A'},team(f));
 assert.deepEqual(g.state.campaign.finalists,['B','C']);
 assert.equal(g.state.phase,'NEGOTIATION');
 assert.equal(g.state.game.families.A.power,start);
 assert.equal(narrativePublicView(g.state).dilemma.labels.pour,'La charte civique');
 assert.doesNotMatch(JSON.stringify(narrativePublicView(g.state)),/CHARTE_CIVIQUE|objectifs secrets/);
 g.vote('pour');g.command('next');
 const pre=narrativePublicView(g.state);
 assert.equal(pre.phase,'EPILOGUE');assert.equal(pre.finalResults,null);
 assert.ok(pre.narrativeEnding.paragraphs.includes('Qu’avez-vous fait de Hotspring ?'));
 g.command('showResults');
 assert.equal(g.state.phase,'FINISHED');assert.equal(g.state.finalResults.rows[0].maximum,15);
 assert.throws(()=>g.command('start'),/déjà lancée/);
});

test('Hotspring : Terminer l’histoire produit un épilogue anticipé et rembourse une mise',()=>{
 const g=newCampaign();g.command('start');g.untilCouncil();
 g.command('vote',{kind:'pour',amount:4},team('A'));
 assert.throws(()=>g.command('finish'),/Confirmation/);
 g.command('finish',{confirm:true});
 assert.equal(g.state.game.families.A.power,8);
 assert.equal(g.state.phase,'EPILOGUE');assert.equal(g.state.campaign.charter,null);
 g.command('showResults');
 assert.equal(g.state.finalResults.rows[0].maximum,2);
 assert.equal(g.state.finalResults.winners.length,5);
});

for(const [name,policy] of Object.entries(trajectories))test('Hotspring : parcours complet '+name,()=>{
 const {state:s,snapshots}=simulateCampaign(policy);
 assert.equal(s.campaign.charter,policy.charter);
 assert.equal(s.phase,'FINISHED');
 assert.equal(s.campaign.checkpoints.length,6);
 assert.ok(s.campaign.crisesThisSitting<=2);
 assert.deepEqual(s.campaign.completedChapters,[1,2,3,4,5]);
 assert.equal(s.finalResults.rows.length,5);
 assert.ok(s.finalResults.rows.every(r=>r.total>=0&&r.total<=15&&r.maximum===15));
 assert.ok(s.game.city.demographie>=0&&s.game.city.demographie<=10);
 assert.ok(s.revealedHistory.some(h=>h.id.startsWith('D14')));
 for(const round of snapshots.filter(s=>s.phase==='CHECKPOINT')){
  const pub=narrativePublicView(round);
  assert.equal(pub.campaign.checkpoint.ranking.length,5);
  assert.ok(!JSON.stringify(pub).includes(round.goals.A));
 }
 if(name==='commerce'){assert.ok(s.game.city.ecologie<=3);assert.ok(s.campaign.markers.includes('BANQUE_CREDIT'));}
 if(name==='civique'){assert.ok(s.game.city.demographie>=8);assert.ok(s.campaign.markers.includes('ECOLE'));}
 if(name==='institutions'){assert.ok(s.game.city.securite>=8);assert.ok(s.campaign.markers.includes('CONSEIL_ELU'));}
 if(name==='autonomie'){assert.ok(autonomyIndex(new Set(s.campaign.markers))>=2);assert.ok(!s.revealedHistory.some(h=>h.id==='D20'));}
 if(name==='vallee'){assert.ok(s.campaign.trust>=3);assert.ok(s.revealedHistory.some(h=>h.id==='D14A'));assert.ok(s.campaign.markers.includes('PACTE_VALLEE_FINAL'));}
});
