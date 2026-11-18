import {CAMPAIGN_PHASES,landscapeSummary,renderHotspringPanorama,setHotspringImage,renderTendencies,renderHotspringStage,hotspringWinners,renderCampaignRanking} from './founders-hotspring.js';
import {decorateGauge,renderPhaseClock,voteTotals,appendGaugeDelta} from './founders-live-ui.js';
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
let showIllustration=false;

const pretty={...CAMPAIGN_PHASES,NEGOTIATION:'Négociations',READY:'Préparation',COUNCIL:'Conseil en cours',AWAITING_REVEAL:'Vote clos',REVEALED:'Conséquences révélées',FINISHED:'Fin de partie'};
function text(id,value){$(id).textContent=String(value??'');}
function status(id,value){
 text(id,value);
 $(id).hidden=!value;
}
function syncProjectionVisual(){
 const image=$('decisionImage');
 const available=image.hasAttribute('src');
 const showing=available&&showIllustration;
 image.hidden=!showing;
 $('city').hidden=showing;
 $('visualSwitch').hidden=!available;
 text('visualSwitch',showing?'Voir le panorama':'Voir l’illustration');
}
function drawIllustration(s,sceneOnly){
 const image=$('decisionImage');
 const previous=image.getAttribute('src');
 const art=s.reveal?.visual??s.campaign?.intro?.visual??(!sceneOnly&&!s.reveal?s.dilemma?.image:null);
 if(s.campaign)setHotspringImage(image,art);
 else if(typeof art?.url==='string'&&/^https:\/\/\S+$/.test(art.url)){
  if(previous!==art.url)image.src=art.url;
  image.alt=art.alt||s.dilemma.title;
 }else image.removeAttribute('src');
 const source=image.getAttribute('src');
 if(source!==previous||s.phase==='REVEALED'&&latestView?.phase!==s.phase)showIllustration=Boolean(source)&&!s.reveal;
 syncProjectionVisual();
}
function drawGauges(s){
 const root=$('gauges');root.replaceChildren();
 for(const key of Object.keys(s.city)){
  const g=document.createElement('div');g.className='gauge';
  const row=document.createElement('div');row.className='gauge-head';
  const label=document.createElement('span');label.textContent=s.skin.labels.resources[key]||key;
  const score=document.createElement('strong'),before=s.reveal?.cityBefore?.[key];
  score.textContent=s.city[key]+'/10';appendGaugeDelta(score,s,key);
  row.append(label,score);g.append(row);
  const track=document.createElement('div');track.className='track';
  const bar=document.createElement('div');bar.className='bar';
  bar.style.width=((Number.isFinite(before)?before:s.city[key])*10)+'%';
  decorateGauge(bar,label,s.city[key],s);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{bar.style.width=(s.city[key]*10)+'%';}));
  track.append(bar);g.append(track);root.append(g);
 }

}
function render(s){
 document.body.classList.toggle('game-finished',Boolean(s.finalResults));
 $('dilemmaPanel').hidden=Boolean(s.finalResults);
 const stageReading=Boolean(s.campaign)&&['CHECKPOINT','SUSPENDED','CHARTER_SUPPORT','EPILOGUE'].includes(s.phase);
 document.body.classList.toggle('projection-stage-reading',stageReading);
 document.body.classList.toggle('projection-qualification',s.phase==='CHARTER_SUPPORT');
 renderPhaseClock($('phaseClock'),s);
 $('phase').hidden=!$('phaseClock').hidden;
 const totals=voteTotals(s);
 applySkin(document.body,s.skin);document.body.classList.toggle('campaign-hotspring',Boolean(s.campaign));text('universeTitle',s.campaign?s.story.title:'Le Pacte · '+s.skin.title);
 text('pageTitle',s.story.location+' · '+s.story.year);text('phase',pretty[s.phase]||s.phase);
 text('chapter',s.dilemma?(s.dilemma.sequence?'Conseil '+s.dilemma.sequence:'Chapitre '+s.dilemma.chapter):'Le Conseil des Fondateurs');
 const sceneOnly=s.campaign&&['INTRO','CHECKPOINT','SUSPENDED','CHARTER_SUPPORT','EPILOGUE','FINISHED'].includes(s.phase);
 $('dilemmaTitle').hidden=Boolean(sceneOnly);$('dilemmaText').hidden=Boolean(sceneOnly||s.reveal);
 text('dilemmaTitle',s.dilemma?.title||(s.phase==='FINISHED'?'La ville entre dans l’histoire':'Bienvenue au Conseil'));
 text('dilemmaText',s.dilemma?.public_text||(s.phase==='FINISHED'?'Les délibérations sont terminées.':'Le Conseil attend le signal de la régie.'));
 text('question',sceneOnly?'':s.dilemma?.vote_question||'');
 drawGauges(s);
 $('chronicleOpen').hidden=!(s.history?.length);
 if($('chronicleDialog').open)renderChronicle($('cityChronicle'),s);
 if(s.campaign){
  renderHotspringPanorama($('city'),s);
  renderHotspringStage($('hotspringStage'),s,undefined,{showIntroImage:false});
  renderTendencies($('hotspringTendencies'),sceneOnly||s.reveal?null:s.dilemma);
  status('cityEvolution',landscapeSummary(s.campaign.landscape)+(s.campaign.relation?' · '+s.campaign.relation:''));
 }else{
 if(mountedSkin!==s.skin.id){mountCity($('city'),s.skin.id);mountedSkin=s.skin.id;previousCityStates=null;}
 const cityStates=updateCity($('city'),s.city,s.skin.id,s.skin.labels.resources);
 const changes=Object.entries(cityStates).filter(([key,state])=>previousCityStates&&state.level!==previousCityStates[key].level).map(([,state])=>state.description);
 status('cityEvolution',changes.join(' '));
 previousCityStates=cityStates;
 }
 drawIllustration(s,sceneOnly);
 const out=$('outcome');out.hidden=!s.reveal;
 if(s.reveal){text('outcomeTitle',s.campaign?s.reveal.chronicle.title:s.reveal.winner==='pour'?'PROPOSITION ADOPTÉE':'PROPOSITION REJETÉE');text('outcomeText',s.reveal.narration);}
 text('voteForTotal',totals.yes);text('voteAgainstTotal',totals.no);text('voteAbstentions',totals.abstentions);
 text('voteSummary',s.phase==='AWAITING_REVEAL'?'Résultat sous scellés · révélation par la régie':'Influence engagée');
 const arbitrating=s.phase==='COUNCIL'&&['await_moderator','await_leader'].includes(s.council.phase);
 const activeFamily=s.phase==='COUNCIL'?(arbitrating?s.moderator:s.council.turn):null;
 status('councilPrompt',arbitrating?voteProgress(s)?.title:'');
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
 $('finalResults').hidden=!s.finalResults;
 $('narrativeEnding').hidden=!s.narrativeEnding;
 const epilogue=$('endingText');epilogue.replaceChildren();
 if(s.narrativeEnding){
  const title=document.createElement('h3');title.textContent=s.narrativeEnding.title;epilogue.append(title);
  for(const paragraph of s.narrativeEnding.paragraphs){const p=document.createElement('p');p.textContent=paragraph;epilogue.append(p);}
 }
 $('legacyScoreExplanation').hidden=Boolean(s.campaign);
 if(s.campaign&&s.finalResults){
  text('winnerTitle',hotspringWinners(s));
  const root=$('finalRanking');root.replaceChildren();
  const revealText=document.createElement('p');revealText.textContent=s.finalResults.text;root.append(revealText);
  const archive=s.campaign.archive;
  if(archive?.governance){
   const record=document.createElement('p');record.textContent=archive.governance;
   root.append(record);
  }
  renderCampaignRanking(root,s.finalResults.rows,true,{compact:true});
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
$('visualSwitch').addEventListener('click',()=>{
 showIllustration=!showIllustration;
 syncProjectionVisual();
});
$('decisionImage').addEventListener('error',()=>{
 $('decisionImage').removeAttribute('src');
 syncProjectionVisual();
});
$('chronicleOpen').addEventListener('click',()=>{
 $('chronicleDialog').showModal();
 // Render the current chronicle even when opening it between two state revisions.
 if(latestView)renderChronicle($('cityChronicle'),latestView);
});
setupProjectionFullscreen($('projectionFullscreen'),$('notice'));
tick();setInterval(tick,2500);
