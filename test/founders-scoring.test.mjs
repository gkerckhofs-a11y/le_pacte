import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {foundersPreview} from '../server/founders-catalog.ts';
import {
 DEFAULT_GOAL_CARDS,DEFAULT_SCORE_RULES,validateGoalCards,validateScoreRules,
 evaluateGoal,calculateFoundersFinal,analyzeFoundersGoalReachability
} from '../src/founders-scoring.ts';
import {
 createNarrativeSession,applyNarrativeCommand,
 narrativePublicView,narrativeFamilyView,narrativeOrganizerView
} from '../src/founders-live.ts';

const preview=()=>foundersPreview({scenarioId:'fondateurs-hot-spring-demo',skinId:'western',members:[5,5,5,5,5,5]});
const mk=()=>createNarrativeSession(preview(),{
 id:'123456789012123456789012',code:'V26TEST',ownerId:'local-organizer',title:'Équilibrage test',
 initiativeOrder:['F','E','D','C','B','A'],now:20000
});
const go=(s,actor,kind,data={})=>applyNarrativeCommand(s,actor,{expectedRevision:s.revision,kind,data},20000+s.revision+1);
const org={role:'organizer',id:'local-organizer'},team=id=>({role:'team',family:id});
test('Objectifs calibrables : six cartes, seuils stricts, même plafond de points',()=>{
 assert.deepEqual(validateGoalCards(DEFAULT_GOAL_CARDS),[]);
 assert.deepEqual(validateScoreRules(DEFAULT_SCORE_RULES),[]);
 const city={economie:8,securite:7,satisfaction:7,bien_etre:8,developpement:10,stabilite:2};
 for(const [id,card] of Object.entries(DEFAULT_GOAL_CARDS)){
  const points=evaluateGoal(card,city);
  assert.equal(points.points,8,id);
  assert.equal(points.maxPoints,8,id);
 }
 const wrong=structuredClone(DEFAULT_GOAL_CARDS);
 wrong.A.secondTarget=wrong.A.firstTarget;
 assert.ok(validateGoalCards(wrong).some(x=>x.includes('strictement')));
 const weird={...DEFAULT_SCORE_RULES,councilVotesPerPoint:0};
 assert.ok(validateScoreRules(weird).length>0);
 assert.throws(()=>createNarrativeSession(preview(),{
   id:'123456789012123456789012',code:'V26TEST',ownerId:'local-organizer',
   title:'Test',goalCards:wrong
 }));
});
test('Analyse intégrale de Hot Spring : 256 fins et seuils divers (hypothèses, pas probabilités)',()=>{
 const story=JSON.parse(readFileSync(new URL('../content/fondateurs-sheet-sample-v1.json',import.meta.url)));
 const stats=analyzeFoundersGoalReachability(story);
 assert.equal(stats.endings,256);
 assert.equal(stats.truncated,false);
 assert.equal(stats.invalidPaths,0);
 assert.deepEqual(Object.fromEntries(Object.entries(stats.goals).map(([id,g])=>[id,[g.first,g.second]])),{
  A:[108,84],B:[192,64],C:[140,32],D:[140,68],E:[176,80],F:[144,16]
 });
 const limited=analyzeFoundersGoalReachability(story,DEFAULT_GOAL_CARDS,{maxPaths:12});
 assert.equal(limited.endings,12);assert.equal(limited.truncated,true);
});
test('Classement : un vainqueur et priorité au but secret puis réussite politique',()=>{
 let s=mk();
 s.phase='FINISHED';s.game.city={economie:8,securite:5,satisfaction:2,bien_etre:4,developpement:5,stabilite:5};
 s.game.families.A.dollars=11;s.game.families.A.power=8;
 s.game.families.B.dollars=20;
 s.game.history=[
  {winner:'pour',choices:{A:'pour',B:'contre'},bids:{A:1,B:1}},
  {winner:'contre',choices:{A:'contre',B:'pour'},bids:{A:1,B:1}}
 ];
 const before=structuredClone(s);
 const r=calculateFoundersFinal(s);
 assert.equal(r.winner,'A');
 assert.equal(r.ranking[0].score.secret,8);
 assert.equal(r.ranking[0].score.wealth,1);
 assert.equal(r.ranking[0].score.council,1);
 assert.equal(r.ranking[0].score.influence,1);
 assert.equal(r.ranking[0].score.total,11);
 assert.equal(r.maxScore,16);
 assert.equal(new Set(r.ranking.map(x=>x.rank)).size,6);
 assert.equal(r.ranking[0].family,'A');
 assert.deepEqual(s,before);
});
test('Égalité parfaite : tirage initial unique détermine toujours un seul vainqueur',()=>{
 const s=mk();
 s.phase='FINISHED';
 const cards=structuredClone(DEFAULT_GOAL_CARDS);
 for(const id of 'ABCDEF'){
  cards[id]={...cards[id],indicator:'economie',direction:'at_least',firstTarget:7,secondTarget:9};
 }
 s.goalCards=cards;
 s.game.city.economie=5;
 const results=calculateFoundersFinal(s);
 assert.equal(results.ranking.length,6);
 assert.equal(results.winner,'F');
 assert.deepEqual(results.ranking.map(x=>x.family),['F','E','D','C','B','A']);
 assert.equal(results.ranking[0].score.total,2); // 10 dollars + 8 Influence
});
test('De l’ouverture à la finale : 8 votes successifs, révélation des objectifs seulement à la fin',()=>{
 let s=mk();
 assert.equal(narrativePublicView(s).finalResults,null);
 assert.equal(narrativeFamilyView(s,'A').goalCard.id,'F_A');
 assert.equal(narrativeFamilyView(s,'B').goalCard.id,'F_B');
 assert.equal(JSON.stringify(narrativeFamilyView(s,'A')).includes('F_B'),false);
 s=go(s,org,'start');
 for(let i=0;i<8;i++){
  for(const id of 'ABCDEF'){
   s=go(s,team(id),'vote',id==='A'?{kind:'pour',amount:1}:{kind:'passe_pouvoir'});
  }
  assert.equal(s.phase,'AWAITING_REVEAL');
  assert.equal(narrativePublicView(s).finalResults,null);
  s=go(s,org,'reveal');
  s=go(s,org,'next');
 }
 assert.equal(s.phase,'FINISHED');
 assert.equal(s.game.history.length,8);
 assert.ok(s.finalResults);
 assert.equal(s.finalResults.ranking.length,6);
 assert.equal(s.finalResults.ranking.filter(x=>x.rank===1).length,1);
 assert.equal(s.finalResults.winner,s.finalResults.ranking[0].family);
 assert.deepEqual(narrativePublicView(s).finalResults,s.finalResults);
 assert.ok(narrativeOrganizerView(s).goalCards);
 assert.equal(narrativePublicView(s).source,undefined);
 assert.throws(()=>go(s,org,'next'),/Révéler/);
});
test('Barème custom figé par session et calcul cohérent',()=>{
 const rules=structuredClone(DEFAULT_SCORE_RULES);
 rules.secretFirst=2;rules.secretSecond=8;
 rules.wealthTiers=[[12,1],[17,2],[20,3]];
 const s=createNarrativeSession(preview(),{
  id:'123456789012123456789012',code:'V26TEST',ownerId:'local-organizer',title:'Version personnalisée',
  scoreRules:rules,now:20000
 });
 assert.deepEqual(s.scoreRules,rules);
 const own=narrativeFamilyView(s,'A');
 assert.equal(own.goalProgress.maxPoints,10);
 rules.secretFirst=999;
 assert.equal(s.scoreRules.secretFirst,2);
 assert.equal(narrativePublicView(s).finalResults,null);
});


test('Recalibrage : une session archivée garde les anciennes conditions de victoire',()=>{
 const oldCards=structuredClone(DEFAULT_GOAL_CARDS);
 oldCards.A.secondTarget=8;oldCards.C.secondTarget=6;
 oldCards.E.firstTarget=8;oldCards.E.secondTarget=10;oldCards.F.secondTarget=3;
 const s=createNarrativeSession(preview(),{
  id:'123456789012123456789012',code:'OLDGOALS',ownerId:'local-organizer',
  title:'Session antérieure',goalCards:oldCards,now:20000
 });
 const restored=JSON.parse(JSON.stringify(s));
 const started=go(restored,org,'start');
 assert.deepEqual(started.goalCards,oldCards);
 assert.equal(narrativeFamilyView(started,'E').goalCard.secondTarget,10);
 const city={...started.game.city,developpement:9,stabilite:3};
 assert.equal(evaluateGoal(started.goalCards.E,city).points,3);
 assert.equal(evaluateGoal(DEFAULT_GOAL_CARDS.E,city).points,8);
 assert.equal(evaluateGoal(started.goalCards.F,city).points,8);
 assert.equal(evaluateGoal(DEFAULT_GOAL_CARDS.F,city).points,3);
});
