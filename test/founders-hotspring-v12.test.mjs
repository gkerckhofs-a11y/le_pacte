import assert from 'node:assert/strict';
import {test} from 'node:test';
import {foundersPreview} from '../server/founders-catalog.ts';
import {acceptedVoteCommitment,narrativeFamilyView,narrativePublicView} from '../src/founders-live.ts';
import {calculateHotspringStability,hotspringStabilityLabel,HOTSPRING_INDICATORS,hotspringOutcome} from '../src/founders-hotspring.ts';
import {advanceNarrativeTime} from '../src/founders-v2.ts';
import {hotspringScores} from '../src/hotspring-scoring.ts';
import {hotspringSelection,newCampaign,team} from './helpers/hotspring.mjs';

const campaign=()=>newCampaign({scenarioVersion:'1.2.0'});
const setupNegotiation=()=>{
 const g=campaign();
 for(const action of ['start','next','next'])g.command(action);
 return g;
};

test('V1.2 : catalogue, jauges initiales et 64 résultats hérités de la V1.1',()=>{
 const latest=foundersPreview(hotspringSelection),previous=foundersPreview({...hotspringSelection,scenarioVersion:'1.1.0'});
 assert.equal(latest.selection.scenarioVersion,'1.2.0');
 assert.equal(latest.scenario.campaign.version,3);
 assert.equal(Object.keys(latest.game.city).length,5);
 assert.ok(HOTSPRING_INDICATORS.every(key=>latest.game.city[key]===5));
 assert.equal(calculateHotspringStability(latest.game.city),5);
 assert.equal(latest.scenario.dilemmas.length*2,64);
 assert.deepEqual(latest.scenario.dilemmas,previous.scenario.dilemmas);
 assert.deepEqual(latest.scenario.campaign.charters,previous.scenario.campaign.charters);
 assert.deepEqual(latest.scenario.campaign.families,previous.scenario.campaign.families);
 const current=campaign().state,old=newCampaign().state;
 for(const [index,d] of latest.scenario.dilemmas.entries())for(const side of ['pour','contre']){
  const before=structuredClone(old),after=structuredClone(current);
  before.campaign.finalists=after.campaign.finalists=['A','B'];
  assert.deepEqual(hotspringOutcome(after,d,side),hotspringOutcome(before,previous.scenario.dilemmas[index],side));
 }
});

test('V1.2 : deux places, égalités inclusives et classement des fortunes',()=>{
 const s=campaign().state;
 const keys=HOTSPRING_INDICATORS;
 const winners=values=>{
  Object.assign(s.game.city,Object.fromEntries(keys.map((key,i)=>[key,values[i]])));
  return hotspringScores(s).rows.filter(row=>row.trajectory===2).map(row=>row.family).sort();
 };
 // Keys in city order are Economy (A), Ecology (E), Safety (C), Welfare (B), Demography (D).
 assert.deepEqual(winners([8,7,6,5,4]),['A','E']);
 assert.deepEqual(winners([8,7,7,5,4]),['A','C','E']);
 assert.deepEqual(winners([8,8,8,5,4]),['A','C','E']);
 assert.deepEqual(winners([8,8,7,5,4]),['A','E']);
 assert.deepEqual(winners([5,5,5,5,5]),['A','B','C','D','E']);
 s.game.city.stabilite=10;
 assert.deepEqual(winners([8,7,6,5,4]),['A','E']);
 delete s.game.city.stabilite;
 Object.assign(s.campaign.initialCity,Object.fromEntries(keys.map(k=>[k,10])));
 assert.deepEqual(winners([1,1,1,2,3]),['B','D']);
 assert.match(narrativeFamilyView(s,'B').privateCampaign.trajectory,/Bien-être.*deux plus élevées.*2 points|Bien-être.*2 points.*deux plus élevées/);
 assert.match(narrativeFamilyView(s,'D').privateCampaign.trajectory,/Démographie/);
 assert.doesNotMatch(narrativeFamilyView(s,'B').privateCampaign.trajectory,/Démographie/);
 assert.equal(narrativePublicView(s).privateCampaign,undefined);
 s.campaign.completedChapters=[1,2,3,4,5];s.campaign.charter='A';
 const finalScores=balances=>{
  for(const [i,{id}] of narrativePublicView(s).families.entries())s.game.families[id].dollars=balances[i];
  const rows=hotspringScores(s,{final:true}).rows;
  assert.ok(rows.every(row=>row.maximum===18));
  return rows.sort((a,b)=>a.family.localeCompare(b.family)).map(({wealthRank,wealth})=>[wealthRank,wealth]);
 };
 assert.deepEqual(finalScores([14,11,10,7,4]),[[1,3],[2,2],[3,1],[4,0],[5,0]]);
 assert.deepEqual(finalScores([14,10,7,10,4]),[[1,3],[2,2],[4,0],[2,2],[5,0]]);
});

test('V1.2 : engagement contraignant dès la négociation et validation serveur à chaque vote',()=>{
 const g=setupNegotiation();
 const offer=(id,from,to,choice,minInfluence)=>g.command('offer',{id,to,amount:2,commitment:{choice,...(choice==='gift'?{}:{minInfluence})}},team(from));
 const accept=(id,to)=>g.command('acceptOffer',{id},team(to));
 offer('contrat01','A','B','pour',3);
 offer('contrat02','C','B','contre',1);
 assert.equal(g.state.game.families.A.dollars,10);
 accept('contrat01','B');
 assert.equal(g.state.game.families.A.dollars,8);
 assert.equal(g.state.game.families.B.dollars,12);
 assert.throws(()=>accept('contrat02','B'),/incompatible/);
 assert.equal(g.state.game.families.C.dollars,10);
 const limits=narrativeFamilyView(g.state,'E').voteOfferLimits;
 assert.deepEqual(limits,{B:{contre:'Cette famille a déjà accepté un engagement incompatible'}});
 assert.equal(narrativePublicView(g.state).voteOfferLimits,undefined);
 assert.throws(()=>offer('contrat03','E','B','contre',1),/incompatible/);
 offer('contrat04','C','B','pour',4);accept('contrat04','B');
 assert.deepEqual(acceptedVoteCommitment(g.state,'B'),{choice:'pour',minInfluence:4});
 offer('contrat05','A','D','contre',1);accept('contrat05','D');
 offer('libredon6','E','C','gift');accept('libredon6','C');
 assert.equal(acceptedVoteCommitment(g.state,'C'),null);
 assert.equal(narrativePublicView(g.state).offers,undefined);
 g.command('pause');
 assert.throws(()=>g.command('correctResource',{family:'B',resource:'power',value:3}),/empêcherait/);
 g.command('resume');
 g.command('beginVote');
 assert.throws(()=>g.command('vote',{kind:'pour',amount:99},team('A')),/Mise invalide/);
 g.command('vote',{kind:'pour',amount:2},team('A'));
 for(const action of [{kind:'contre',amount:4},{kind:'passe_pouvoir'},{kind:'passe_moderateur'}]){
  assert.throws(()=>g.command('vote',action,team('B')),/position de vote/);
 }
 assert.throws(()=>g.command('vote',{kind:'pour',amount:3},team('B')),/mise minimale de 4/);
 g.command('vote',{kind:'pour',amount:4},team('B'));
 g.command('vote',{kind:'passe_pouvoir'},team('C'));
 assert.throws(()=>g.command('vote',{kind:'pour',amount:1},team('D')),/position de vote/);
 g.command('vote',{kind:'contre',amount:1},team('D'));
 assert.throws(()=>offer('contrat07','E','B','pour',1),/pendant la négociation/);
});

test('V1.2 : offres sans réservation et contrôle des fonds à l’acceptation',()=>{
 const g=setupNegotiation();
 const gift=(id,to,amount)=>g.command('offer',{id,to,amount,commitment:{choice:'gift'}},team('A'));
 assert.throws(()=>gift('insuffis', 'B',11),/Dollars insuffisants/);
 gift('transfert1','B',7);gift('transfert2','C',6);
 assert.equal(g.state.game.families.A.dollars,10);
 g.command('acceptOffer',{id:'transfert1'},team('B'));
 assert.throws(()=>g.command('acceptOffer',{id:'transfert2'},team('C')),/Fonds insuffisants/);
 assert.equal(g.state.offers.transfert2.status,'pending');
 assert.equal(g.state.game.families.C.dollars,10);
 assert.equal(narrativeFamilyView(g.state,'A').self.dollars,3);
});

test('V1.2 : aucun chronomètre actif et réserve distribuée à la clôture des votes',()=>{
 const g=campaign();
 for(const [action,phase] of [['start','INTRO'],['next','PRESENTATION'],['next','NEGOTIATION'],['beginVote','COUNCIL']]){
  g.command(action);
  assert.equal(g.state.phase,phase);
  assert.equal(g.state.clock.deadline,null);
  assert.equal(g.state.timing.autoAdvance,false);
  const forged=structuredClone(g.state);
  forged.clock.deadline=1;forged.timing.autoAdvance=true;
  assert.equal(advanceNarrativeTime(forged,999999),forged);
 }
 assert.throws(()=>g.command('configureTiming',{timing:g.state.timing}),/Chronos indisponibles/);
 const reserve=()=>narrativePublicView(g.state).influenceReserve;
 g.command('vote',{kind:'passe_pouvoir'},team('A'));
 g.command('vote',{kind:'passe_moderateur'},team('B'));
 assert.deepEqual(reserve(),{available:3,participants:1,perFamily:3,settled:false});
 g.command('vote',{kind:'pour',amount:4},team('C'));
 g.command('vote',{kind:'passe_pouvoir'},team('D'));
 g.command('vote',{kind:'contre',amount:1},team('E'));
 assert.deepEqual(reserve(),{available:3,participants:2,perFamily:1,settled:false});
 assert.throws(()=>g.command('vote',{kind:'augmenter',amount:5},team('C')),/Surenchère invalide/);
 g.command('vote',{kind:'maintien'},team('C'));
 g.command('vote',{kind:'maintien'},team('E'));
 assert.equal(g.state.phase,'REVEALED');
 assert.equal(advanceNarrativeTime(g.state,999999),g.state);
 assert.deepEqual(reserve(),{available:5,participants:2,perFamily:1,settled:true});
 assert.equal(g.state.game.families.B.power,8);
 g.command('next');assert.equal(g.state.phase,'PRESENTATION');
 const old=newCampaign();old.command('start');
 assert.equal(advanceNarrativeTime(old.state,old.state.clock.deadline).phase,'PRESENTATION');
});

test('V1.2 : onze états de Stabilité et correction limitée aux cinq jauges',()=>{
 const labels=['Ville condamnée','Ville fantôme','Ville en perdition','Ville en crise','Équilibre précaire','Ville stable','Ville en développement','Ville prospère','Ville florissante','Grande cité de l’Ouest','Légende de la frontière'];
 for(const [value,label] of labels.entries()){
  assert.equal(hotspringStabilityLabel(value),label);
  if(value<10)assert.equal(hotspringStabilityLabel(value+0.8),label);
 }
 const g=setupNegotiation();g.command('pause');
 assert.throws(()=>g.command('correctCity',{indicator:'stabilite',value:8}),/fondamentale/);
 g.command('correctCity',{indicator:'economie',value:10});
 const view=narrativePublicView(g.state);
 assert.equal(view.city.stabilite,6);
 assert.equal(view.campaign.stabilityLabel,'Ville en développement');
});
