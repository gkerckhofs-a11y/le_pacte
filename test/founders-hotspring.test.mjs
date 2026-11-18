import assert from 'node:assert/strict';
import {test} from 'node:test';
import {activeFounders} from '../src/founders.ts';
import {narrativePublicView,narrativeFamilyView,narrativeOrganizerView,duplicateHotspringFinal} from '../src/founders-live.ts';
import {advanceNarrativeTime} from '../src/founders-v2.ts';
import {availableCharters,calculateHotspringStability,crisisCandidates,hotspringOutcome,HOTSPRING_INDICATORS} from '../src/founders-hotspring.ts';
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
 assert.deepEqual(g.state.game.city,{economie:6,ecologie:5,securite:5,demographie:6,bien_etre:5});
 assert.deepEqual(g.state.campaign.markers,['VILLE_BASSE']);
 assert.equal(g.state.lastReveal.yes,3);
});

test('Hotspring : le Bien-être évolue par les votes et la Stabilité suit la moyenne exacte',()=>{
 const g=newCampaign();
 const first=narrativePublicView(g.state);
 assert.deepEqual(first.city,{economie:5,ecologie:5,securite:5,demographie:5,bien_etre:5,stabilite:5});
 assert.deepEqual(Object.values(g.state.scenario.campaign.families).map(f=>f.trajectory),['economie','bien_etre','securite','demographie','ecologie']);
 assert.match(narrativeFamilyView(g.state,'B').privateCampaign.trajectory,/Bien-être/);
 assert.match(narrativeFamilyView(g.state,'D').privateCampaign.trajectory,/Démographie/);
 g.command('start');g.vote('pour');g.command('next');
 assert.match(narrativePublicView(g.state).dilemma.tendencies.contre.join(' '),/Bien-être ↑/);
 g.vote('contre');
 const result=narrativePublicView(g.state);
 assert.deepEqual(result.city,{economie:5,ecologie:6,securite:5,demographie:6,bien_etre:6,stabilite:5.6});
 assert.equal(result.reveal.cityBefore.stabilite,5.4);
 assert.equal(result.reveal.cityAfter.stabilite,5.6);
 assert.ok(!Object.hasOwn(g.state.game.city,'stabilite'));
 g.command('next');g.vote('contre');g.command('next');
 const atCheckpoint=narrativePublicView(g.state).campaign.checkpoint;
 assert.equal(atCheckpoint.changes.stabilite,0.6);
 assert.equal(atCheckpoint.city.stabilite,5.6);
 assert.equal(narrativeFamilyView(g.state,'B').privateCampaign.score.trajectory,2);
 const calibration=foundersPreview(hotspringSelection).settings.calibration;
 calibration.city.bien_etre=8;
 assert.throws(()=>foundersPreview({...hotspringSelection,calibration}),/démarrent à 5/);
 calibration.city.stabilite=2;
 assert.throws(()=>foundersPreview({...hotspringSelection,calibration}),/Jauges initiales invalides/);
});

test('Hotspring : corrections privées, plafonnement et moyenne recalculée après relecture',()=>{
 const g=newCampaign();
 g.command('start');g.command('next');g.vote('contre');g.command('next');
 assert.throws(()=>g.command('correctCity',{indicator:'economie',value:9}),/pause/);
 g.command('pause');
 assert.throws(()=>g.command('correctCity',{indicator:'economie',value:9},team('A')),/Régie/);
 for(const indicator of ['stabilite','satisfaction','developpement'])assert.throws(()=>g.command('correctCity',{indicator,value:6}),/fondamentale/);
 assert.throws(()=>g.command('correctCity',{indicator:'economie',value:9.5}),/entier/);
 g.command('correctCity',{indicator:'economie',value:9});
 g.command('correctCity',{indicator:'bien_etre',value:0});
 assert.deepEqual(g.state.corrections.slice(-2).map(({indicator,before,after})=>[indicator,before,after]),[['economie',5,9],['bien_etre',5,0]]);
 const planned=narrativeOrganizerView(g.state).effectsPreview.find(o=>o.side==='pour');
 assert.equal(planned.effects.find(e=>e.indicator==='economie').value,2);
 assert.equal(planned.cityBefore.stabilite,5);
 assert.equal(planned.cityAfter.stabilite,5.4);
 assert.equal(narrativePublicView(g.state).effectsPreview,undefined);
 assert.equal(narrativeFamilyView(g.state,'A').effectsPreview,undefined);
 g.command('resume');g.vote('pour');
 const restored=JSON.parse(JSON.stringify(g.state));
 restored.lastReveal.cityAfter.stabilite=10;
 restored.revealedHistory.at(-1).city.stabilite=10;
 const live=narrativePublicView(restored);
 assert.deepEqual(live.reveal.cityAfter,planned.cityAfter);
 assert.deepEqual(live.history.at(-1).city,planned.cityAfter);
 assert.equal(live.city.bien_etre,0);
 assert.equal(live.city.economie,10);
 assert.equal(live.city.stabilite,5.4);
});

test('Hotspring : les 64 résultats et les six chartes respectent les jauges de leur version',()=>{
 const original=newCampaign({scenarioVersion:'1.0.0'});
 const previous=original.state.scenario.campaign.families;
 assert.equal(previous.caldwell.trajectory,'autonomy');
 const g=newCampaign(),s=g.state;
 for(const [family,definition] of Object.entries(s.scenario.campaign.families))assert.deepEqual(definition.objectives,previous[family].objectives);
 const checkOutcome=(d,side,finalists)=>{
  const branch=structuredClone(s);branch.campaign.finalists=finalists;
  const {effects}=hotspringOutcome(branch,d,side);
  assert.ok(effects.length>=1&&effects.length<=4);
  assert.equal(new Set(effects.map(e=>e.indicator)).size,effects.length);
  assert.ok(effects.every(e=>HOTSPRING_INDICATORS.includes(e.indicator)&&e.operation==='delta'&&Number.isInteger(e.value)&&Math.abs(e.value)<=3));
 };
 assert.equal(s.scenario.dilemmas.length*2,64);
 for(const d of s.scenario.dilemmas)for(const side of ['pour','contre'])checkOutcome(d,side,['A','B']);
 for(const charter of s.scenario.campaign.charters)checkOutcome(s.scenario.dilemmas.at(-1),'pour',[charter.id,'A']);
 original.command('start');original.vote('pour');original.command('next');original.vote('contre');
 const historic=JSON.parse(JSON.stringify(original.state));
 assert.deepEqual(Object.keys(narrativePublicView(historic).city),['economie','ecologie','securite','demographie']);
 assert.match(narrativeFamilyView(historic,'D').privateCampaign.trajectory,/autonomie/i);
 assert.equal(calculateHotspringStability({economie:8,ecologie:4,securite:6,bien_etre:7,demographie:5}),6);
});

test('Hotspring : la projection estime le partage puis affiche l’Influence réellement versée',()=>{
 const g=newCampaign();
 const view=()=>narrativePublicView(g.state).influenceReserve;
 g.command('start');g.command('next');g.command('next');
 assert.equal(g.state.phase,'NEGOTIATION');
 assert.deepEqual(view(),{available:3,participants:0,perFamily:0,settled:false});
 g.command('beginVote');
 g.command('vote',{kind:'passe_pouvoir'},team('A'));
 assert.deepEqual(view(),{available:3,participants:1,perFamily:3,settled:false});
 g.command('vote',{kind:'passe_moderateur'},team('B'));
 assert.deepEqual(view(),{available:3,participants:1,perFamily:3,settled:false});
 g.command('vote',{kind:'pour',amount:4},team('C'));
 g.command('vote',{kind:'passe_pouvoir'},team('D'));
 assert.deepEqual(view(),{available:3,participants:2,perFamily:1,settled:false});
 g.command('vote',{kind:'contre',amount:1},team('E'));
 g.command('vote',{kind:'maintien'},team('C'));
 g.command('vote',{kind:'maintien'},team('E'));
 assert.equal(g.state.phase,'REVEALED');
 assert.deepEqual(view(),{available:5,participants:2,perFamily:1,settled:true});
 assert.deepEqual(['A','B','D'].map(id=>g.state.game.families[id].power),[9,8,9]);
 g.command('next');
 assert.equal(view(),null);
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

test('Hotspring : les fortunes à égalité partagent les points de leur rang',()=>{
 const g=newCampaign();
 g.command('start');
 for(const [family,dollars] of Object.entries({A:14,B:10,C:7,D:10,E:4}))g.state.game.families[family].dollars=dollars;
 assert.ok(hotspringScores(g.state).rows.every(row=>row.wealth===undefined));
 g.command('finish',{confirm:true});
 g.command('showResults');
 const {rows,winners}=g.state.finalResults;
 const ranking=Object.fromEntries(rows.map(row=>[row.family,[row.dollars,row.wealthRank,row.wealth]]));
 assert.deepEqual(ranking,{A:[14,1,3],B:[10,2,2],D:[10,2,2],C:[7,4,0],E:[4,5,0]});
 assert.deepEqual(winners,['A']);
 assert.ok(rows.every(row=>row.total===row.wealth&&row.maximum===5));
 assert.deepEqual(narrativeFamilyView(g.state,'B').privateCampaign.score,rows.find(row=>row.family==='B'));
 assert.deepEqual(narrativeOrganizerView(g.state).campaignAdmin.scores,{rows,winners});

 g.state.game.families.B.dollars=14;
 const tie=hotspringScores(g.state,{final:true});
 assert.deepEqual(tie.rows.filter(row=>row.wealthRank===1).map(row=>row.wealth),[3,3]);
 assert.deepEqual(tie.rows.filter(row=>row.wealthRank===3).map(row=>row.wealth),[1]);
});

test('Hotspring : une archive à l’ancien barème conserve son classement sur tous les écrans',()=>{
 const {state}=simulateCampaign(trajectories.institutions);
 const rows=state.finalResults.rows.map(({dollars,wealthRank,wealth,hasLegacy,...row})=>({
  ...row,total:row.total-wealth,maximum:row.maximum-3
 })).sort((a,b)=>b.total-a.total);
 const winners=rows.filter(row=>row.total===rows[0].total).map(row=>row.family);
 state.finalResults={...state.finalResults,rows,winners};
 assert.deepEqual(narrativeOrganizerView(state).campaignAdmin.scores,{rows,winners});
 assert.deepEqual(narrativeFamilyView(state,'A').privateCampaign.score,rows.find(row=>row.family==='A'));
 assert.deepEqual(narrativePublicView(state).finalResults.rows,rows);
});

test('Hotspring : variantes de l’eau, seuils et coûts différés',()=>{
 const s=newCampaign().state;
 s.campaign.markers=['VILLE_BASSE','QUARTIER_PROVISOIRE','CENTRE_PRIVE','ABATTOIR_CENTRAL'];
 assert.equal(crisisCandidates(s).find(c=>c.id==='D26A').available,true);
 let d=s.scenario.dilemmas.find(d=>d.id==='D26A');
 assert.equal(hotspringOutcome(s,d,'contre').effects.find(e=>e.indicator==='demographie').value,-3);
 s.campaign.markers=['VILLE_HAUTE','EAU_PRIVEE','ABATTOIR_CENTRAL'];
 assert.equal(crisisCandidates(s).find(c=>c.id==='D26B').available,true);
 d=s.scenario.dilemmas.find(d=>d.id==='D26B');
 const drought=hotspringOutcome(s,d,'contre').effects;
 assert.equal(drought.find(e=>e.indicator==='bien_etre').value,-3);
 assert.equal(drought.some(e=>e.indicator==='securite'),false);
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
 assert.equal(g.state.phase,'FINISHED');assert.equal(g.state.finalResults.rows[0].maximum,18);
 assert.throws(()=>g.command('start'),/déjà lancée/);
 const archived=g.state;
 const variant=duplicateHotspringFinal(archived,{id:'b'.repeat(24),code:'VAR',ownerId:'organizer',now:50000});
 assert.equal(variant.phase,'CHECKPOINT');
 assert.equal(variant.campaign.parentArchive,archived.id);
 assert.equal(variant.campaign.charter,null);
 assert.equal(variant.finalResults,null);
 assert.deepEqual(variant.game.city,archived.campaign.charterSeed.game.city);
 assert.equal(archived.campaign.charter,'B');
 assert.equal(archived.phase,'FINISHED');
 assert.throws(()=>duplicateHotspringFinal(archived,{ownerId:'another'}),/Accès régie/);
});

test('Hotspring : Terminer l’histoire produit un épilogue anticipé et rembourse une mise',()=>{
 const g=newCampaign();g.command('start');g.untilCouncil();
 g.command('vote',{kind:'pour',amount:4},team('A'));
 assert.throws(()=>g.command('finish'),/Confirmation/);
 g.command('finish',{confirm:true});
 assert.equal(g.state.game.families.A.power,8);
 assert.equal(g.state.phase,'EPILOGUE');assert.equal(g.state.campaign.charter,null);
 g.command('showResults');
 assert.equal(g.state.finalResults.rows[0].maximum,5);
 assert.ok(g.state.finalResults.rows.every(row=>row.wealthRank===1&&row.wealth===3));
 assert.equal(g.state.finalResults.winners.length,5);
});

const trajectoryFamilies={commerce:'A',civique:'B',institutions:'C',autonomie:'D',vallee:'E'};
const unsuccessfulExamples={commerce:'B',civique:'A',institutions:'A',autonomie:'C',vallee:'A'};
for(const [name,policy] of Object.entries(trajectories))test('Hotspring : parcours complet '+name,()=>{
 const {state:s,snapshots}=simulateCampaign(policy);
 assert.equal(s.campaign.charter,policy.charter);
 assert.equal(s.phase,'FINISHED');
 assert.equal(s.campaign.checkpoints.length,6);
 assert.ok(s.campaign.crisesThisSitting<=2);
 assert.deepEqual(s.campaign.completedChapters,[1,2,3,4,5]);
 assert.equal(s.finalResults.rows.length,5);
 assert.equal(s.finalResults.rows.find(r=>r.family===trajectoryFamilies[name]).trajectory,2);
 assert.equal(s.finalResults.rows.find(r=>r.family===unsuccessfulExamples[name]).trajectory,0);
 assert.ok(s.finalResults.rows.every(r=>r.total>=0&&r.total<=18&&r.maximum===18));
 assert.ok(s.finalResults.rows.every(r=>r.total===r.chapterPoints.reduce((sum,c)=>sum+c.points,0)+r.trajectory+r.charter+r.governance+r.wealth));
 assert.ok(s.game.city.demographie>=0&&s.game.city.demographie<=10);
 assert.ok(s.revealedHistory.some(h=>h.id.startsWith('D14')));
 for(const round of snapshots.filter(s=>s.phase==='CHECKPOINT')){
  const pub=narrativePublicView(round);
  assert.equal(pub.campaign.checkpoint.ranking.length,5);
  assert.ok(!JSON.stringify(pub).includes(round.goals.A));
 }
 if(name==='commerce'){assert.ok(s.game.city.ecologie<=3);assert.ok(s.campaign.markers.includes('BANQUE_CREDIT'));}
 if(name==='civique'){assert.ok(s.game.city.bien_etre>=8);assert.ok(s.campaign.markers.includes('ECOLE'));}
 if(name==='institutions'){assert.ok(s.game.city.securite>=8);assert.ok(s.campaign.markers.includes('CONSEIL_ELU'));}
 if(name==='autonomie'){assert.ok(autonomyIndex(new Set(s.campaign.markers))>=2);assert.ok(!s.revealedHistory.some(h=>h.id==='D20'));}
 if(name==='vallee'){assert.ok(s.campaign.trust>=3);assert.ok(s.revealedHistory.some(h=>h.id==='D14A'));assert.ok(s.campaign.markers.includes('PACTE_VALLEE_FINAL'));}
});

test('Hotspring : les crises en réserve se rejouent dans une nouvelle séance',()=>{
 const g=newCampaign();g.command('start');
 const s=g.state;
 s.currentDilemmaId='D23';s.phase='PRESENTATION';s.campaign.chapter=5;
 s.campaign.completedChapters=[1,2,3,4];
 s.campaign.markers=['VILLE_BASSE','CENTRE_PRIVE','CONSTRUCTION_SERREE','QUARTIER_PROVISOIRE','GRANDE_MINE','BANQUE_CREDIT','DISPENSAIRE','ECOLE','DECHETS_LIBRES'];
 g.vote('pour');
 for(let i=0;i<2;i++){
  g.command('next');
  assert.equal(g.state.phase,'PRESENTATION');
  g.vote('contre');
 }
 g.command('next');
 assert.equal(g.state.phase,'CHECKPOINT');
 assert.equal(g.state.campaign.crisesThisSitting,2);
 assert.ok(g.state.campaign.markers.includes('SERVICES_MAINTENUS'));
 const remaining=crisisCandidates(g.state).filter(c=>c.available).map(c=>c.id);
 assert.ok(remaining.length>=1);
 assert.equal(narrativeOrganizerView(g.state).campaignAdmin.mayResumeCrises,true);
 g.command('resumeCrises');
 assert.equal(g.state.phase,'PRESENTATION');
 assert.ok(remaining.includes(g.state.currentDilemmaId));
 g.vote('contre');
 assert.equal(g.state.campaign.crisesThisSitting,1);
 const applied=g.state.campaign.interludeHistory.filter(e=>e.includes('budget local'));
 assert.equal(applied.length,1);
});
