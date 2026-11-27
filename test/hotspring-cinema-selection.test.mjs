import test from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../content/hotspring-cinema-v1.json' with {type:'json'};
import recordedRoutes from '../content/hotspring-cinema-simulations-v1.json' with {type:'json'};
import {recordCinemaSimulations} from '../scripts/record-hotspring-cinema-simulations.mjs';
import {selectCinemaView} from '../src/hotspring-cinema.ts';
import {hotspringCityIndicators} from '../src/founders-hotspring.ts';
import {narrativeFamilyView,narrativeOrganizerView,narrativePublicView} from '../src/founders-live.ts';
import {newCampaign} from './helpers/hotspring.mjs';

const city=(...v)=>hotspringCityIndicators(Object.fromEntries(['economie','ecologie','securite','bien_etre','demographie'].map((k,i)=>[k,v[i]])));
const sample=(stage,id,extra={})=>{
 const asset=manifest.views.find(x=>x.id===id);
 return {stage,city:hotspringCityIndicators(asset.profile),markers:[...asset.requiredMarkers],playedCrises:[...asset.playedCrises],...extra};
};

test('Hotspring cinéma : chaque stade a un unique secours sans précondition ni équipement optionnel',()=>{
 assert.equal(new Set(manifest.views.map(v=>v.id)).size,manifest.views.length);
 for(let stage=0;stage<=7;stage++){
  const fallback=manifest.views.filter(v=>v.stage===stage&&v.fallback);
  assert.equal(fallback.length,1);
  const x=fallback[0];
  assert.deepEqual([...x.requiredMarkers,...x.incompatibleMarkers,...x.playedCrises],[]);
  assert.equal(x.site,'hors champ');assert.deepEqual(x.limits,{});
  for(const building of x.visibleConstructions)assert.match(building,/^(abris|charpente|maisons( et commerces en bois| en bois| ordinaires)?|ateliers ordinaires|bâtiments ordinaires)$/);
  assert.deepEqual(selectCinemaView({stage,city:{},markers:[]}).fallback.id,x.id);
 }
});

test('Hotspring cinéma : les 24 cadres de profil correspondent à leur âge et restent sélectionnables',()=>{
 for(let stage=1;stage<=6;stage++){
  for(const type of manifest.cityProfiles){
   const id='c'+stage+'-'+type.id.toLowerCase(),state=sample(stage,id);
   const answer=selectCinemaView(state,id,true);
   assert.equal(answer.profile.id,type.id);
   assert.equal(answer.view.id,id);
   assert.equal(answer.profiles.find(v=>v.id===id).eligible,true);
   assert.deepEqual(answer,selectCinemaView(structuredClone(state),id,true));
  }
 }
});

test('Hotspring cinéma : aucun score de proximité ni identifiant sauvegardé ne lève un refus de construction ou de site',()=>{
 for(const [id,conflict] of [['c1-plaine','VILLE_HAUTE'],['c1-terrasse','VILLE_BASSE'],['c2-ecole','ECOLE_REPORTEE'],['c4-dispensaire','SANS_MEDECIN'],['c2-scie','COUPE_REGULEE'],['c4-rail','SANS_GARE'],['c4-mine','PETITES_MINES'],['c4-jardins','QUARTIER_PROVISOIRE'],['c4-ouvriers','QUARTIER_PLANIFIE'],['c3-corridor','ACCORD_ROMPU'],['c6-elu','CONSEIL_FONDATEURS']]){
  const stage=Number(id[1]),state=sample(stage,id),saved=id;
  for(const markers of [[],[...state.markers,conflict]]){
   const result=selectCinemaView({...state,markers},saved,true);
   assert.notEqual(result.view.id,id,conflict);
   assert.equal(result.profiles.find(v=>v.id===id).eligible,false,conflict);
  }
  assert.notEqual(selectCinemaView({...state,stage:stage+1},saved).view.id,id);
 }
});

test('Hotspring cinéma : seuls un incendie vécu et le quartier touché permettent la vue résidentielle sinistrée',()=>{
 const state=sample(5,'c5-incendie');
 for(const overrides of [{playedCrises:[]},{markers:['CENTRE_BRULE','QUARTIERS_SAUVES']},{markers:['CICATRICES_INCENDIE','INCENDIE_CONTENU']}]){
  const res=selectCinemaView({...state,...overrides},'c5-incendie',true);
  assert.equal(res.profiles.find(v=>v.id==='c5-incendie').eligible,false);
 }
 const compatible=selectCinemaView(state,'c5-incendie',true);
 assert.equal(compatible.view.id,'c5-incendie');
});

test('Hotspring cinéma : à Stabilité identique, la fortune, la sécurité et le milieu changent la finale',()=>{
 const dangerous=city(9,3,2,6,6),peaceful=city(3,8,7,5,3);
 assert.equal(dangerous.stabilite,peaceful.stabilite);
 assert.equal(selectCinemaView({stage:7,city:dangerous,markers:[],charter:'F'}).view.id,'fin-tensions');
 assert.equal(selectCinemaView({stage:7,city:peaceful,markers:[],charter:'A'}).view.id,'fin-ressources');
 const thriving=selectCinemaView({stage:7,city:city(1,8,10,10,10),markers:['ECOLE'],charter:'D'});
 assert.equal(thriving.view.id,'fin-civique');
 assert.notEqual(selectCinemaView({stage:7,city:city(1,8,10,10,10),markers:[],charter:'D'}).view.id,'fin-civique');
});

test('Hotspring cinéma : archives anciennes, prévisualisation privée et instantanés immuables',()=>{
 const g=newCampaign({scenarioVersion:'1.0.0'}),ready=narrativePublicView(g.state);
 assert.equal(ready.campaign.cinema.stage,0);assert.equal(ready.campaign.year,1872);
 g.command('start');
 for(let i=0;i<3;i++){g.vote('contre');g.command('next');}
 const saved=g.state.campaign.checkpoints[0],stateBefore=JSON.stringify(g.state),original=narrativePublicView(g.state).campaign.cinema;
 assert.equal(saved.cinemaViewId,original.view.id);
 const debug=narrativeOrganizerView(g.state).campaignAdmin.cinema;
 assert.equal(debug.stage,2);assert.equal(debug.simulations.length,5);
 assert.ok(debug.simulations.every(r=>r.chapters.length===7));
 assert.equal(JSON.stringify(g.state),stateBefore);
 const team=narrativeFamilyView(g.state,'A');
 assert.equal(team.campaignAdmin,undefined);
 assert.equal(original.profiles,undefined);assert.equal(original.reasons,undefined);assert.equal(original.simulations,undefined);
 assert.equal(original.stabilityLabel,null);assert.equal(original.city.stabilite,undefined);assert.equal(original.city.bien_etre,undefined);
 delete saved.cinemaViewId;delete saved.playedCrises;
 assert.deepEqual(narrativePublicView(JSON.parse(JSON.stringify(g.state))).campaign.cinema,original);
 g.state.game.city.economie=10;
 assert.deepEqual(narrativePublicView(g.state).campaign.cinema,original);
});

test('Hotspring cinéma : une partie interrompue garde son stade réellement voté et son année connue',()=>{
 const g=newCampaign({scenarioVersion:'1.2.0'});g.command('start');
 assert.equal(narrativePublicView(g.state).campaign.cinema.view.id,'prologue');g.untilCouncil();
 assert.equal(narrativePublicView(g.state).campaign.cinema,null);
 g.command('finish',{confirm:true});
 const before=narrativePublicView(g.state);
 assert.equal(g.state.narrativeEnding.cinemaViewId,'prologue');
 assert.equal(before.campaign.cinema.stage,0);assert.equal(before.campaign.cinema.view.id,'prologue');assert.ok(before.campaign.cinema.early);
 assert.deepEqual(before.campaign.cinema.decisions,[]);assert.equal(before.campaign.epilogueResults,undefined);
 assert.equal(before.finalResults,null);assert.equal(before.campaign.cinema.governance,null);assert.equal(before.campaign.cinema.charter,null);
 g.command('showResults');assert.ok(narrativePublicView(g.state).finalResults.winners.length>0);
 const started=newCampaign({scenarioVersion:'1.2.0'});started.command('start');
 for(let i=0;i<3;i++){started.vote('pour');started.command('next');}
 started.command('next');assert.equal(started.state.campaign.chapter,2);
 started.command('finish',{confirm:true});
 const beforeSecondVote=narrativePublicView(started.state);
 assert.equal(beforeSecondVote.campaign.cinema.stage,1);assert.equal(beforeSecondVote.campaign.year,1872);
 assert.equal(beforeSecondVote.campaign.cinema.governance,null);
});

test('Hotspring cinéma : les décisions prises départagent les ambiances à jauges égales',()=>{
 const state={stage:2,city:city(5,5,5,6,5)};
 assert.equal(selectCinemaView({...state,markers:['EAU_PRIVEE','GRAND_SALOON']}).profile.id,'B');
 assert.equal(selectCinemaView({...state,markers:['EAU_COMMUNALE','RESERVES_PUBLIQUES','ECOLE']}).profile.id,'C');
});
test('Les simulations de la régie reproduisent les choix et jauges de cinq campagnes V1.2 réellement jouées',()=>{
 assert.deepEqual(recordedRoutes,recordCinemaSimulations());
});

test('Hotspring cinéma : un dispensaire financé peut gagner au chapitre IV face au quartier planifié',()=>{
 const state=sample(4,'c4-dispensaire');
 state.markers.push('QUARTIER_PLANIFIE');
 assert.equal(selectCinemaView(state).view.id,'c4-dispensaire');
 const district=sample(4,'c4-jardins');
 district.markers.push('DISPENSAIRE');
 assert.equal(selectCinemaView(district).view.id,'c4-jardins');
});

test('Chaque variante spécialisée peut être choisie automatiquement dans un contexte compatible',()=>{
 const nearby={
  'c1-plaine':[5,5,6,5,5],'c1-terrasse':[4,5,5,5,4],'c2-scie':[8,3,5,5,6],
  'c4-mine':[10,3,5,3,8],'c6-elu':[4,5,5,5,4],'c6-fondateurs':[5,5,6,5,5]
 };
 for(const v of manifest.views.filter(v=>!v.fallback&&!v.canonical)){
  const state=sample(v.stage,v.id);
  if(nearby[v.id])state.city=city(...nearby[v.id]);
  if(v.anyMarkers?.length)state.markers.push(v.anyMarkers[0]);
  assert.equal(selectCinemaView(state).view.id,v.id);
 }
});
