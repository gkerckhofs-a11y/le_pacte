import {gaugeLevelLabel,renderChicagoGaugeLevels} from './founders-live-ui.js';
import {renderSuccession,showChicagoRanking,chicagoPhase} from './chicago-succession.js';
import {CAMPAIGN_PHASES,renderHotspringPanorama,setHotspringOverview,setHotspringImage,renderTendencies,renderHotspringStage,hotspringWinners,renderCampaignRanking} from './founders-hotspring.js';
import {decorateGauge,formatGaugeNumber,renderPhaseClock,voteTotals,appendGaugeDelta,gaugeDelta,renderChicagoChoices} from './founders-live-ui.js';
import {voteProgress} from './founders-vote-progress.js';
import {appendFamilyRoles} from './founders-role-badges.js';
import {setupProjectionFullscreen} from './founders-fullscreen.js';
import {applySkin,applyTeamTheme} from './founders-skin-theme.js';
import {mountCity,updateCity} from './founders-city-scene.js';
import {teamCaption,teamLabel,colorize} from './founders-identity.js';
import {renderChronicle} from './founders-chronicle.js';
"use strict";
const $=id=>document.getElementById(id),param=new URLSearchParams(location.search);
const sessionId=param.get('session');
let latestView=null,previousCityStates=null,mountedSkin=null;

const pretty={...CAMPAIGN_PHASES,NEGOTIATION:'Négociations',READY:'Préparation',COUNCIL:'Conseil en cours',AWAITING_REVEAL:'Vote clos',REVEALED:'Conséquences révélées',FINISHED:'Fin de partie'};
function text(id,value){$(id).textContent=String(value??'');}
function status(id,value){
 text(id,value);
 $(id).hidden=!value;
}
function influenceAmount(id,value,showUnit){
 const amount=$(id);
 amount.textContent=String(value);
 if(showUnit){
  const unit=document.createElement('small');
  unit.className='projection-unit';
  unit.textContent=' Influence';
  amount.append(unit);
 }
}
function drawInfluenceReserve(reserve,manual){
 $('influenceReserve').hidden=!reserve;
 if(!reserve)return;
 text('influenceAvailableLabel',manual?'Réserve commune':'Influence en réserve');
 influenceAmount('influenceAvailable',reserve.available,manual);
 text('influenceParticipants',reserve.participants);
 text('influencePartLabel',reserve.settled?'Part versée par famille':'Part estimée par famille');
 influenceAmount('influencePart',reserve.participants?reserve.perFamily:'—',manual&&reserve.participants>0);
}
const chapterNames=['L’Héritage','Le Partage','La Guerre des ombres','Les Trahisons','La Commission'];
function drawChicagoScene(s){
 const hero=$('cineHero'),img=$('cineImage');
 if(hero.hidden){
  hero.hidden=false;
  const statePanel=$('gauges').parentElement,votePanel=$('ballots').parentElement;
  statePanel.id='cineState';votePanel.id='cineVote';
  statePanel.querySelector('h2').textContent='État de Chicago';
  statePanel.append($('panoramaStability'));
  votePanel.insertBefore($('influenceReserve'),$('ballots'));
  const grid=document.querySelector('.projection-grid');
  grid.prepend(statePanel);grid.append(votePanel);
  $('outcome').firstElementChild.textContent='Décision de la Commission';
  img.onerror=()=>{img.hidden=true;$('cineMissing').hidden=false;};
 }
 const record=s.reveal??s.dilemma;
 const chapter=s.dilemma?.chapter??Number(s.reveal?.id?.split('_')[1]);
 text('cineChapter',chapterNames[chapter-1]?'Chapitre '+chapter+' · '+chapterNames[chapter-1]:'');
 const waiting=s.phase==='READY';
 const art=s.reveal?s.reveal.visual:s.dilemma?.image;
 const src=waiting?'/assets/chicago/v3/chicago.webp':art?.url;
 text('cineMissing',s.reveal?'Illustration du résultat indisponible':record?'Illustration du dilemme indisponible':'La Commission');
 if((src??'')!==img.dataset.scene){
  img.dataset.scene=src??'';
  img.hidden=!src;$('cineMissing').hidden=Boolean(src);
  if(src){
   img.alt=art?.alt??'Chicago, 1931';
   img.onload=()=>{
    if(s.reveal&&!matchMedia('(prefers-reduced-motion: reduce)').matches)
     img.animate([{opacity:0},{opacity:1}],{duration:500});
   };
   img.style.objectPosition=art?.position??'50% 50%';
   img.src=src;
  }else img.removeAttribute('src');
 }
 if(s.reveal){
  const before=s.reveal.cityBefore??{},after=s.reveal.cityAfter??{};
  status('cineChanges',Object.entries(after).filter(([k,v])=>before[k]!==v||k==='stabilite').map(([k,v])=>
   (s.skin.labels.resources[k]??k)+' '+formatGaugeNumber(before[k])+' → '+formatGaugeNumber(v)).join(' · '));
  $('dilemmaTitle').hidden=true;
  text('chapter','Résultat · '+s.reveal.winner.toUpperCase());
 }else if(s.dilemma)text('chapter',s.dilemma.id.replace('CN_','').replace('_','.')+' · Chapitre '+chapter);
}
function drawIllustration(s,sceneOnly){
 const image=$('decisionImage');
 const previous=image.getAttribute('src');
 const art=s.reveal?.visual??s.campaign?.intro?.visual??(!sceneOnly&&!s.reveal?s.dilemma?.image:null);
 if($('dilemmaPanel').hidden)image.removeAttribute('src');

 else if(s.campaign)setHotspringImage(image,art);
 else if(typeof art?.url==='string'&&/^https:\/\/\S+$/.test(art.url)){
  if(previous!==art.url)image.src=art.url;
  image.alt=art.alt||s.dilemma.title;
 }else image.removeAttribute('src');
 image.hidden=!image.hasAttribute('src');
 $('dilemmaArtwork').hidden=image.hidden;
}
function drawGauges(s){
 const root=$('gauges');root.replaceChildren();
 if(renderChicagoGaugeLevels(root,s))return;
 const compact=Boolean(s.campaign)&&Object.hasOwn(s.city,'bien_etre');
 root.classList.toggle('projection-gauges-grid',compact);
 for(const key of Object.keys(s.city)){
  if(key==='stabilite'&&(s.manualCouncil||s.campaign?.version>=3))continue;
  const g=document.createElement('div');g.className='gauge';
  const row=document.createElement('div');row.className='gauge-head';
  const label=document.createElement('span');label.textContent=s.skin.labels.resources[key]||key;
  const score=document.createElement('strong'),before=s.reveal?.cityBefore?.[key];
  const decimal=compact&&key==='stabilite',value=formatGaugeNumber(s.city[key],decimal);
  if(decimal)label.setAttribute('aria-description','Moyenne des cinq indicateurs de Hotspring');
  score.textContent=(compact&&Number.isFinite(before)&&s.reveal?.cityAfter?.[key]===s.city[key]&&(decimal||gaugeDelta(s,key)?.value!==0)
   ?formatGaugeNumber(before,decimal)+' → '+value:value)+'/'+(s.gaugeMaximum??10);
  appendGaugeDelta(score,s,key);
  row.append(label,score);g.append(row);
  const track=document.createElement('div');track.className='track';
  const bar=document.createElement('div');bar.className='bar';
  bar.style.width=((Number.isFinite(before)?before:s.city[key])*100/(s.gaugeMaximum??10))+'%';
  decorateGauge(bar,label,s.city[key],s,{compact});
  track.append(bar);g.append(track);
  if(decimal){
   const description=document.createElement('small');description.className='stability-caption';
   description.textContent='Moyenne générale de Hotspring';g.append(description);
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>{bar.style.width=(s.city[key]*100/(s.gaugeMaximum??10))+'%';}));
  root.append(g);
 }

}
function drawPanoramaStability(s,manual){
 const value=s.stabilityScore??s.city.stabilite,track=$('stabilityTrack'),bar=$('stabilityBar'),state=$('stabilityState');
 const qualitative=!Number.isFinite(value)&&Number.isInteger(s.stabilityLevel),maximum=s.gaugeMaximum??10;
 $('panoramaStability').hidden=!manual||(!qualitative&&!Number.isFinite(value));
 if($('panoramaStability').hidden)return;
 track.hidden=qualitative;
 text('stabilityTitle',qualitative?'Stabilité':'Stabilité — '+formatGaugeNumber(value,true)+' / '+maximum);
 text('stabilityState',s.campaign?.stabilityLabel??(qualitative?gaugeLevelLabel(s.stabilityLevel):'Moyenne des cinq jauges'));
 if(s.succession&&Number.isFinite(value)){
  const labels=['Chicago au bord du chaos','Ville sous contrôle fragile','Ville sous tension','Ordre établi','Chicago prospère','Empire incontesté'];
  text('stabilityState',labels[[20,40,60,80,95].filter(t=>value>=t).length]);
 }
 if(qualitative)return;
 appendGaugeDelta($('stabilityTitle'),s,'stabilite');
 track.setAttribute('aria-valuemax',String(maximum));
 track.setAttribute('aria-valuenow',String(value));
 track.setAttribute('aria-valuetext',formatGaugeNumber(value,true)+' sur '+maximum+'. '+state.textContent);
 bar.style.width=value*100/maximum+'%';
 decorateGauge(bar,state,value,s,{compact:true});
}
function render(s){
 document.body.classList.toggle('chicago-v3',Boolean(s.succession));
 renderSuccession($('chicagoSuccession'),s,'public');
 const manual=s.manualCouncil||s.campaign?.version>=3;
 const epilogueScores=s.campaign?.epilogueResults;
 const results=s.finalResults??epilogueScores;
 document.body.classList.toggle('game-finished',Boolean(s.finalResults));
 document.body.classList.toggle('projection-manual-hotspring',s.campaign?.version>=3);
 $('dilemmaPanel').hidden=Boolean(results)||s.phase==='SUCCESSION';
 $('ballots').closest('.panel').hidden=s.phase==='SUCCESSION'||Boolean(s.succession&&s.finalResults);
 const stageReading=Boolean(s.campaign)&&['CHECKPOINT','SUSPENDED','CHARTER_SUPPORT','EPILOGUE'].includes(s.phase);
 document.body.classList.toggle('projection-stage-reading',stageReading);
 document.body.classList.toggle('projection-qualification',s.phase==='CHARTER_SUPPORT');
 document.body.classList.toggle('projection-hotspring-epilogue',s.campaign?.version>=2&&s.phase==='EPILOGUE');
 renderPhaseClock($('phaseClock'),s);
 $('phase').hidden=!$('phaseClock').hidden;
 const totals=voteTotals(s);
 applySkin(document.body,s.skin);document.body.classList.toggle('campaign-hotspring',Boolean(s.campaign));text('universeTitle',s.campaign?s.story.title:'Games of Influence · '+s.skin.title);
 text('pageTitle',s.story.location+' · '+s.story.year);text('phase',(chicagoPhase(s)||pretty[s.phase]||s.phase)+(manual&&s.clock?.paused?' · Pause':''));
 text('chapter',s.dilemma?(s.dilemma.sequence?'Conseil '+s.dilemma.sequence:'Chapitre '+s.dilemma.chapter):s.chicago?'La Commission':'Le Conseil des Fondateurs');
 const sceneOnly=s.phase==='SUSPENDED'||s.campaign&&['INTRO','CHECKPOINT','SUSPENDED','CHARTER_SUPPORT','EPILOGUE','FINISHED'].includes(s.phase);
 $('dilemmaTitle').hidden=Boolean(sceneOnly);$('dilemmaText').hidden=Boolean(sceneOnly||s.reveal);
 text('dilemmaTitle',s.dilemma?.title||(s.phase==='FINISHED'?(s.chicago?'Les Conseils de Chicago sont terminés':'La ville entre dans l’histoire'):'Bienvenue au Conseil'));
 if(s.chicago&&s.phase==='SUSPENDED')text('chapter','Séance sauvegardée');
 text('dilemmaText',s.dilemma?.public_text||(s.phase==='FINISHED'?'Les délibérations sont terminées.':'Le Conseil attend le signal de la régie.'));
 text('question',sceneOnly?'':s.dilemma?.vote_question||'');
 renderChicagoChoices($('chicagoChoices'),s);
 drawGauges(s);
 drawPanoramaStability(s,manual);
 $('chronicleOpen').hidden=!(s.history?.length);
 if($('chronicleDialog').open)renderChronicle($('cityChronicle'),s);
 $('panoramaOverview').hidden=!s.campaign?.landscape?.location;
 if(s.campaign){
  renderHotspringPanorama($('city'),s,{showResultStill:false});
  if(!results)renderHotspringStage($('hotspringStage'),s,undefined,{showIntroImage:false});
  renderTendencies($('hotspringTendencies'),sceneOnly||s.reveal?null:s.dilemma);
  status('cityEvolution','');
 }else if(s.succession){
  drawChicagoScene(s);
 }else if(s.chicago){
  if(mountedSkin!=='chicago'){
   const root=$('city');
   mountCity(root,s.skin.id);
   root.setAttribute('aria-label','Panorama de Chicago');
   for(const layer of root.querySelectorAll('[data-city-level]'))layer.style.display=layer.dataset.cityLevel==='1'?'':'none';
   const description=root.querySelector('#townDesc');
   if(description)description.textContent='Panorama de Chicago en 1931';
   mountedSkin='chicago';
  }
 }else{
 if(mountedSkin!==s.skin.id){mountCity($('city'),s.skin.id);mountedSkin=s.skin.id;previousCityStates=null;}
 const cityStates=updateCity($('city'),s.city,s.skin.id,s.skin.labels.resources);
 const changes=Object.entries(cityStates).filter(([key,state])=>previousCityStates&&state.level!==previousCityStates[key].level).map(([,state])=>state.description);
 status('cityEvolution',changes.join(' '));
 previousCityStates=cityStates;
 }
 if(!s.succession)drawIllustration(s,sceneOnly);
 drawInfluenceReserve(s.influenceReserve,manual);
 const out=$('outcome');out.hidden=!s.reveal;
 if(s.reveal){text('outcomeTitle',(s.campaign||s.chicago)?s.reveal.chronicle.title:s.reveal.winner==='pour'?'PROPOSITION ADOPTÉE':'PROPOSITION REJETÉE');text('outcomeText',s.reveal.narration);}
 influenceAmount('voteForTotal',totals.yes,manual);
 influenceAmount('voteAgainstTotal',totals.no,manual);
 text('voteAbstentions',totals.abstentions);
 status('voteSummary',s.phase==='AWAITING_REVEAL'?'Résultat sous scellés · révélation par la régie':manual?'':'Influence engagée');
 const arbitrating=s.phase==='COUNCIL'&&['await_moderator','await_leader'].includes(s.council.phase);
 const activeFamily=s.phase==='COUNCIL'?(arbitrating?s.moderator:s.council.turn):null;
 const speaker=s.families.find(f=>f.id===activeFamily);
 status('councilPrompt',arbitrating?voteProgress(s)?.title:manual&&speaker?'À la parole · '+speaker.name:'');
 const ballots=$('ballots');ballots.replaceChildren();
 for(const f of s.families){
  const row=document.createElement('div');row.className='ballot';
  if(f.id===activeFamily)row.setAttribute('aria-current','true');
  const n=document.createElement('span');n.textContent=f.color?f.color.symbol+' '+f.name:f.name;
  n.title=teamCaption(f);colorize(n,f);appendFamilyRoles(n,s,f.id);
  const v=document.createElement('strong');
  const choice=s.council.choices[f.id];
  v.textContent=choice===undefined?'—':choice==='pour'?'POUR':choice==='contre'?'CONTRE':'ABSTENTION';
  const amount=document.createElement('span');amount.textContent=s.council.bids[f.id]??0;
  row.append(n,v,amount);ballots.append(row);
 }
 $('finalResults').hidden=!results;
 $('narrativeEnding').hidden=!s.narrativeEnding;
 $('narrativeEnding').querySelector('summary').textContent=epilogueScores?'Lire le récit de l’épilogue':'Relire l’épilogue';
 const epilogue=$('endingText');epilogue.replaceChildren();
 if(s.narrativeEnding){
  const title=document.createElement('h3');title.textContent=s.narrativeEnding.title;epilogue.append(title);
  for(const paragraph of s.narrativeEnding.paragraphs){const p=document.createElement('p');p.textContent=paragraph;epilogue.append(p);}
 }
 $('legacyScoreExplanation').hidden=Boolean(s.campaign||s.chicago);
 if(s.succession&&s.finalResults){
  text('winnerTitle',s.narrativeEnding.title);showChicagoRanking($('finalRanking'),s);$('narrativeEnding').open=true;
 }else if(s.campaign&&results){
  text('winnerTitle',hotspringWinners(s,results));
  const root=$('finalRanking');root.replaceChildren();
  if(s.finalResults){
   const revealText=document.createElement('p');revealText.textContent=s.finalResults.text;root.append(revealText);
  }
  const archive=s.campaign.archive;
  if(archive?.governance){
   const record=document.createElement('p');record.textContent=archive.governance;
   root.append(record);
  }
  renderCampaignRanking(root,results.rows,Boolean(s.finalResults),{compact:true});
 }else if(s.finalResults){
  const ranking=s.finalResults.ranking;
  text('winnerTitle','Victoire de '+teamLabel(s,ranking[0].family)+' · '+ranking[0].score.total+' points');
  const root=$('finalRanking');root.replaceChildren();
  for(const p of ranking){
   const line=document.createElement('div');line.className='ballot';
   const a=document.createElement('strong');a.textContent=p.rank+'. '+teamLabel(s,p.family)+(p.rank===1?' ★':'');
   const b=document.createElement('span');b.textContent='Secret '+p.score.secret+' · '+s.skin.labels.currency+' '+p.score.wealth+' · Conseil '+p.score.council+' · Influence '+p.score.influence;
   const n=document.createElement('strong');n.textContent=p.score.total+' pts';
   line.append(a,b,n);root.append(line);
  }
 }
}
async function tick(){
 if(!sessionId||!/^[a-f0-9]{24}$/.test(sessionId)){text('notice','Lien de projection incomplet : session introuvable.');return;}
 try{
  const r=await fetch('/api/founders/sessions/'+sessionId,{cache:'no-store'});
  if(!r.ok)throw new Error('Session indisponible ('+r.status+')');
  const s=await r.json();
  if(s.revision!==latestView?.revision)render(s);else renderPhaseClock($('phaseClock'),s);
  latestView=s;
  text('connection','● Synchronisé');text('notice','');
 }catch(e){text('connection','○ Hors ligne');text('notice',e.message);}
}
$('decisionImage').addEventListener('error',()=>{
 if($('decisionImage').onerror)return;
 $('decisionImage').removeAttribute('src');
 $('decisionImage').hidden=true;
 $('dilemmaArtwork').hidden=true;
});
$('chronicleOpen').addEventListener('click',()=>{
 $('chronicleDialog').showModal();
 // Render the current chronicle even when opening it between two state revisions.
 if(latestView)renderChronicle($('cityChronicle'),latestView);
});
$('panoramaOverview').addEventListener('click',event=>{
 const button=event.currentTarget,overview=button.getAttribute('aria-pressed')!=='true';
 button.setAttribute('aria-pressed',String(overview));
 setHotspringOverview($('city'),overview);
});
setupProjectionFullscreen($('projectionFullscreen'),$('notice'));
tick();setInterval(tick,2500);
