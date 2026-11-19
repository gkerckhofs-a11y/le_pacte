import {CAMPAIGN_PHASES,setHotspringImage,renderTendencies,renderHotspringStage,campaignScoreText,hotspringWinners} from './founders-hotspring.js';
import {decorateGauge,formatGaugeNumber,renderPhaseClock,voteTotals,appendGaugeDelta} from './founders-live-ui.js';
import {renderVoteProgress} from './founders-vote-progress.js';
import {commitmentLabel} from './founders-agreements.js';
import {renderCouncilRoles,appendFamilyRoles} from './founders-role-badges.js';
import {saveFamilyName} from './founders-name-save.js';
import {applySkin,applyTeamTheme} from './founders-skin-theme.js';
import {teamCaption,teamLabel} from './founders-identity.js';
import {createHotspringRules} from './hotspring-rules.js';
"use strict";
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const sessionId=params.get('session'),expectedFamily=params.get('family'),key='pacte-founder-family-'+sessionId+(expectedFamily?'-'+expectedFamily:'');
const fragment=new URLSearchParams(location.hash.slice(1));
let token=fragment.get('token')||sessionStorage.getItem(key)||'';
if(token)sessionStorage.setItem(key,token);
if(location.hash)history.replaceState(null,'',location.pathname+location.search);
let current=null,busy=false,identityDirty=false;
const nice={...CAMPAIGN_PHASES,NEGOTIATION:'Négociation',READY:'Préparation',COUNCIL:'Conseil',AWAITING_REVEAL:'Vote clos',REVEALED:'Révélation',FINISHED:'Terminé'};
const resources=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const set=(id,v)=>$(id).textContent=String(v??'');
function notify(message){set('notice',message);}
async function call(method='GET',payload){
 if(!sessionId||!/^[a-f0-9]{24}$/.test(sessionId)||!token)throw new Error('Lien personnel incomplet : demander un nouvel accès au porte-parole.');
 const r=await fetch('/api/founders/sessions/'+sessionId+(method==='POST'?'/commands':''),
 {method,headers:{Authorization:'Bearer '+token,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,cache:'no-store'});
 const data=await r.json();
 if(!r.ok)throw new Error(data.error||'Accès refusé');
 if(expectedFamily&&data.self?.id!==expectedFamily)throw new Error('Ce lien ne correspond pas à votre famille. Demandez une nouvelle fiche à l’organisateur.');
 return data;
}
function gauge(data){
 const root=$('gauges');root.replaceChildren();
 for(const indicator of Object.keys(data.city)){
  const item=document.createElement('div');item.className='gauge';
  const top=document.createElement('div');top.className='gauge-head';
  const name=document.createElement('span');name.textContent=data.skin.labels.resources[indicator]||indicator;
  const n=document.createElement('strong');n.textContent=formatGaugeNumber(data.city[indicator],indicator==='stabilite'&&data.campaign?.version>=2)+'/10';appendGaugeDelta(n,data,indicator);top.append(name,n);
  const bar=document.createElement('div');bar.className='track';
  const inside=document.createElement('div');inside.className='bar';inside.style.width=data.city[indicator]*10+'%';
  decorateGauge(inside,name,data.city[indicator],data);bar.append(inside);item.append(top,bar);root.append(item);
 }
}
function renderAmountMenu(id,min,max,{prefix='',suffix=''}={}){
 let select=$(id);
 if(select.localName!=='select'){
  const input=select;select=document.createElement('select');select.id=id;select.required=true;
  input.replaceWith(select);
 }
 const bounds=min+':'+max;
 if(select.dataset.bounds===bounds)return;
 const previous=Number(select.value);
 const options=document.createDocumentFragment();
 for(let value=min;value<=max;value++){
  const option=document.createElement('option');option.value=String(value);option.textContent=prefix+value+suffix;options.append(option);
 }
 select.replaceChildren(options);
 select.disabled=max<min;
 if(!select.disabled)select.value=String(previous>=min&&previous<=max?previous:min);
 select.dataset.bounds=bounds;
}
const isPoliticalOffer=offer=>Boolean(offer.commitment&&offer.commitment.choice!=='gift');
function offers(data){
 const root=$('offers');root.replaceChildren();
 for(const o of data.offers.slice(-30).reverse()){
  const el=document.createElement('div');el.className='card';
  const content=document.createElement('p');
  content.textContent=(o.from===data.self.id?'Vous proposez ':'Proposition reçue : ')+o.amount+' '+data.skin.labels.currency+' de '+teamLabel(data,o.from)+' à '+teamLabel(data,o.to)+' · '+o.reason+' · '+o.status+' · '+(data.campaign?.version>=3&&!isPoliticalOffer(o)?'Transfert sans engagement politique':commitmentLabel(o.commitment));
  el.append(content);
  if(o.status==='pending'&&o.to===data.self.id){
   for(const [name,kind] of [['Accepter','acceptOffer'],['Refuser','rejectOffer']]){
    const b=document.createElement('button');b.className=kind==='rejectOffer'?'secondary':'';b.textContent=kind==='acceptOffer'&&o.commitment?.choice!=='gift'&&o.commitment?'Accepter et s’engager':name;
    b.addEventListener('click',()=>command(kind,{id:o.id}));el.append(b);
   }
  }
  if(o.status==='pending'&&o.from===data.self.id){
   const b=document.createElement('button');b.className='secondary';b.textContent='Annuler';b.addEventListener('click',()=>command('rejectOffer',{id:o.id}));el.append(b);
  }
  root.append(el);
 }
}
function render(data){
 const manual=data.campaign?.version>=3;
 const finishing=data.phase==='FINISHED'&&!document.body.classList.contains('game-finished');document.body.classList.toggle('game-finished',data.phase==='FINISHED');
 renderVoteProgress($('voteProgress'),data);
 renderPhaseClock($('phaseClock'),data);
 set('familyVoteTotals',(()=>{const t=voteTotals(data);return 'POUR '+t.yes+' · CONTRE '+t.no+' · ABSTENTIONS '+t.abstentions;})());
 current=data;
 renderCouncilRoles($('councilRoles'),data);
 const self=data.self,c=data.council;
 document.body.classList.toggle('campaign-hotspring',Boolean(data.campaign));
 applySkin(document.body,data.skin);applyTeamTheme(document.body,self.color,data.skin);
 set('teamIdentity',self.color.symbol+' Équipe '+self.color.label+' · Porte-parole');
 $('identityPanel').hidden=data.phase!=='READY';
 if(!identityDirty&&document.activeElement!==$('chosenName'))$('chosenName').value=self.name==='Nom à choisir'?'':self.name;
 set('terminalSession','Session '+data.code+' · Équipe '+self.id);set('familyName',self.name);appendFamilyRoles($('familyName'),data,self.id);set('phase',(nice[data.phase]||data.phase)+(manual&&data.clock?.paused?' · Pause':''));
 set('turn',data.phase==='COUNCIL'?(c.turn===self.id?'C’est à vous.':c.turn?'En attente — '+teamLabel(data,c.turn)+' joue actuellement.':c.phase==='await_moderator'?'Arbitrage':'Choix du Maire'):'—');
 set('dilemmaLabel',data.dilemma?'Chapitre '+data.dilemma.chapter:'Conseil des Fondateurs');
 set('dilemmaTitle',data.dilemma?.title||(data.phase==='FINISHED'?'Fin de la campagne':'Conseil en préparation'));
 set('dilemmaText',data.dilemma?.public_text||'');
 set('question',data.dilemma?.vote_question||'');
 const image=$('familyDilemmaImage'),src=data.dilemma?.image?.url;
 if(data.campaign){
  renderHotspringStage($('hotspringStage'),data,charter=>command('supportCharter',{charter}));
  renderTendencies($('hotspringTendencies'),data.phase==='REVEALED'?null:data.dilemma);
  setHotspringImage(image,data.phase==='REVEALED'?data.reveal?.visual:data.dilemma?.image);
 }else{
 image.hidden=!(typeof src==='string'&&/^https:\/\/\S+$/.test(src));
 if(!image.hidden){image.src=src;image.alt=data.dilemma.image.alt||data.dilemma.title;}else image.removeAttribute('src');
 }
 set('influence',self.power);set('dollars',self.dollars);
 set('influenceLabel',data.skin.labels.influence);set('dollarLabel',data.skin.labels.currency);set('offerAmountLabel',data.skin.labels.currency+' proposés');
 set('objective',data.privateCampaign?.trajectory??self.objective);
 $('goalProgress').hidden=Boolean(data.campaign);
 $('chapterObjectivesNote').hidden=!data.campaign;
 if(!data.campaign&&data.goalCard&&data.goalProgress){
  const card=data.goalCard,progress=data.goalProgress;
  set('goalTitle',card.title);
  const direction=card.direction==='at_least'?'au moins':'au plus';
  const indicator=data.skin.labels.resources[card.indicator]||card.indicator;
  set('goalConditions',indicator+' : '+direction+' '+card.firstTarget+' (palier 1), puis '+direction+' '+card.secondTarget+' (palier 2).');
  set('goalStatus','Indicateur actuel : '+progress.value+'/10 · Paliers atteints : '+(progress.first?'1':'0')+' / '+(progress.second?'1':'0')+
      ' · Points provisoires : '+progress.points+'/'+progress.maxPoints);
 }
 const final=$('personalResult');final.hidden=!data.finalResults;
 if(data.campaign&&data.finalResults){
  const score=data.privateCampaign.score;
  set('personalResultText',hotspringWinners(data));
  set('personalScoreBreakdown',score.total+'/'+score.maximum+' · '+campaignScoreText(score));
 }else if(data.finalResults){
  const r=data.finalResults.ranking.find(item=>item.family===self.id);
  set('personalResultText',r.rank===1?'Votre famille remporte Le Pacte !':'Classement : '+r.rank+' / '+data.families.length+'. Vainqueur : '+teamLabel(data,data.finalResults.ranking[0].family));
  set('personalScoreBreakdown','Objectif secret '+r.score.secret+' · '+data.skin.labels.currency+' '+r.score.wealth+
      ' · Votes '+r.score.council+' · Influence '+r.score.influence+' = '+r.score.total+' points');
 }
 for(const b of $('firstVote').querySelectorAll('[data-vote="pour"],[data-vote="contre"]')){
  const side=b.dataset.vote;
  if(!b.dataset.defaultLabel)b.dataset.defaultLabel=b.textContent;
  b.textContent=data.campaign&&data.dilemma?' '+side.toUpperCase()+' · '+data.dilemma.labels[side]:b.dataset.defaultLabel;
 }
 $('familyStatsBlock').hidden=Boolean(data.campaign);
 if(!data.campaign)set('familyStats',self.members+' membre(s) · Maire : '+teamLabel(data,data.leader)+' · Shérif : '+teamLabel(data,data.moderator));
 set('committed',self.choice?'Votre position : '+self.choice+' · Mise engagée : '+self.bid:'Aucun vote engagé pour ce dilemme.');
 set('voteHint',self.mayVote?'Votre famille doit décider maintenant.':data.phase==='COUNCIL'?'Vous pouvez négocier en attendant votre tour.':'Le Conseil attend la prochaine phase.');
 $('firstVote').hidden=!(self.mayVote&&self.choice===null);
 $('raiseVote').hidden=!(self.mayVote&&self.choice!==null);
 $('raiseAmount').closest('.field').hidden=!['pour','contre'].includes(self.choice);
 $('raiseVote').querySelector('[data-vote="augmenter"]').hidden=!['pour','contre'].includes(self.choice);
 const lock=data.voteCommitment;
 $('voteCommitment').hidden=!lock||!(data.phase==='COUNCIL'||manual&&data.phase==='NEGOTIATION');
 set('voteCommitment',lock?'Accord accepté : '+commitmentLabel(lock)+'. Ce choix est obligatoire pour ce Conseil.':'');
 if(manual){
  renderAmountMenu('voteAmount',lock?.minInfluence||1,self.power);
  renderAmountMenu('raiseAmount',1,self.power,{prefix:'+'});
 }else{
  $('voteAmount').max=self.power;$('raiseAmount').max=self.power;
  $('voteAmount').min=lock?.minInfluence||1;
  if(lock?.minInfluence&&Number($('voteAmount').value)<lock.minInfluence)$('voteAmount').value=lock.minInfluence;
 }
 for(const button of $('firstVote').querySelectorAll('[data-vote]')){
  const choice=button.dataset.vote;
  button.disabled=Boolean(lock&&choice!==lock.choice)||Boolean(manual&&$('voteAmount').disabled&&['pour','contre'].includes(choice));
 }
 $('raiseVote').querySelector('[data-vote="augmenter"]').disabled=Boolean(manual&&$('raiseAmount').disabled);

 $('moderatorTie').hidden=!self.mayResolve;
 $('moderatorLeader').hidden=!self.mayChooseLeader;
 const candidate=$('leaderCandidates');candidate.replaceChildren();
 if(self.mayChooseLeader)for(const id of c.pendingLeaderChoices){
  const b=document.createElement('button');b.textContent='Désigner '+teamLabel(data,id);b.addEventListener('click',()=>command('chooseLeader',{family:id}));candidate.append(b);
 }
 $('offerForm').hidden=!['NEGOTIATION','COUNCIL'].includes(data.phase);
 const freeOnly=data.experienceVersion===2&&!manual;
 $('offerCommitmentFields').hidden=freeOnly;
 $('offerBindingHelp').hidden=freeOnly;
 $('offerReason').required=data.experienceVersion!==2;
 const offerChoice=$('offerCommitment'),passChoice=offerChoice.querySelector('[value="passe_pouvoir"]');
 passChoice.hidden=passChoice.disabled=manual;
 if(freeOnly)offerChoice.value='gift';
 if(manual){
  offerChoice.querySelector('[value="gift"]').textContent='Don / transfert libre';
  $('offerBindingHelp').textContent='Un accord de vote accepté transfère les dollars et oblige la famille à voter dans le camp convenu avec au moins 1 Influence. Un don est sans engagement politique.';
  $('offerMinimumField').hidden=true;
  renderAmountMenu('offerAmount',1,self.dollars,{suffix:' $'});
 }
 $('sendOffer').disabled=Boolean(manual&&self.dollars===0);
 $('offerBalanceHint').hidden=!manual||self.dollars>0;
 const campaignRules=$('rulesHotspring');
 campaignRules.hidden=!data.campaign;
 if(data.campaign&&!campaignRules.firstElementChild)campaignRules.append(createHotspringRules({manual}));
 $('rulesIntroduction').hidden=Boolean(data.campaign);
 $('rulesLegacy').hidden=data.experienceVersion===2;$('rulesV2').hidden=data.experienceVersion!==2||Boolean(data.campaign);
 const target=$('targetFamily'),prev=target.value;target.replaceChildren();
 for(const f of data.families.filter(f=>f.id!==self.id)){
  const option=document.createElement('option');option.value=f.id;option.textContent=teamCaption(f);target.append(option);
 }
 if(Array.from(target.options).some(x=>x.value===prev))target.value=prev;
 const reveal=$('lastReveal');reveal.hidden=!data.reveal;
 if(data.reveal){set('resultTitle',data.campaign?data.reveal.chronicle.title:data.reveal.winner==='pour'?'Proposition adoptée':'Proposition rejetée');set('resultNarration',data.reveal.narration);}
 gauge(data);offers(data);renderOfferDialog(data);
 if(data.phase==='FINISHED'){const board=$('boardPanel');board.prepend($('familyEpilogue'));board.prepend($('personalResult'));if(finishing){selectTab(0);$('personalResult').scrollIntoView({block:'start'});}}
 $('familyEpilogue').hidden=!data.narrativeEnding||Boolean(data.campaign);$('familyEpilogue').replaceChildren();
 if(data.narrativeEnding&&!data.campaign){const h=document.createElement('h2');h.textContent=data.narrativeEnding.title;$('familyEpilogue').append(h);for(const t of data.narrativeEnding.paragraphs){const p=document.createElement('p');p.textContent=t;$('familyEpilogue').append(p);}}
}
function renderOfferDialog(data){
 const dialog=$('offerDialog');const offer=data.offers.find(o=>o.to===data.self.id&&o.status==='pending');
 if(!offer||data.clock?.paused){if(dialog.open)dialog.close();return;}
 if(dialog.dataset.offer===offer.id&&dialog.open)return;
 dialog.dataset.offer=offer.id;
 const manual=data.campaign?.version>=3,binding=isPoliticalOffer(offer);
 const side=binding?offer.commitment.choice.toUpperCase():'';
 const sender=data.families.find(f=>f.id===offer.from)?.name??offer.from;
 set('receivedOffer',manual?'La famille « '+sender+' » vous propose '+offer.amount+' $'+(binding?' en échange d’un vote '+side:'')+'.':teamLabel(data,offer.from)+' vous propose '+offer.amount+' '+data.skin.labels.currency+'.');
 set('receivedMessage',offer.reason);
 set('receivedCommitment',manual?(binding?'En acceptant, vous devrez voter '+side+' et engager au moins '+offer.commitment.minInfluence+' Influence.':'Transfert sans engagement politique.'):
  data.experienceVersion===2?'L’acceptation ne vous engage pas à voter.':commitmentLabel(offer.commitment));
 set('offerAccept',manual&&binding?'Accepter et s’engager':'Accepter');
 if(!dialog.open)dialog.showModal();
}
$('offerAccept').addEventListener('click',()=>command('acceptOffer',{id:$('offerDialog').dataset.offer}));
$('offerReject').addEventListener('click',()=>command('rejectOffer',{id:$('offerDialog').dataset.offer}));
async function refresh(){
 if(busy)return;
 try{const data=await call();if(busy||data.revision<(current?.revision??-1))return;if(data.revision!==current?.revision)render(data);else renderPhaseClock($('phaseClock'),data);notify('');}
 catch(e){notify(e.message);}
}
async function command(kind,data){
 if(!current||busy)return;
 busy=true;notify('Enregistrement…');
 try{const result=await call('POST',{kind,data,expectedRevision:current.revision});render(result);notify(kind==='acceptOffer'?'Proposition acceptée : transfert effectué.':kind==='rejectOffer'?'Proposition refusée : aucun transfert.':'Décision enregistrée.');}
 catch(e){notify(e.message);try{const latest=await call();render(latest);}catch{ /* Keep original failure visible. */ }}
 finally{busy=false;}
}
document.querySelectorAll('[data-vote]').forEach(button=>{
 button.addEventListener('click',()=>{
  const kind=button.dataset.vote;
  const data={kind};
  if(kind==='pour'||kind==='contre')data.amount=Number($('voteAmount').value);
  if(kind==='augmenter')data.amount=Number($('raiseAmount').value);
  command('vote',data);
 });
});
document.querySelectorAll('[data-tie]').forEach(button=>button.addEventListener('click',()=>command('resolveTie',{winner:button.dataset.tie})));
$('offerForm').addEventListener('submit',e=>{
 e.preventDefault();
 const id=crypto.randomUUID();
 const choice=$('offerCommitment').value;
 const minInfluence=current?.campaign?.version>=3?1:Number($('offerMinimum').value);
 command('offer',{id,to:$('targetFamily').value,amount:Number($('offerAmount').value),reason:$('offerReason').value.trim(),commitment:{choice,...(choice==='gift'?{}:{minInfluence:['pour','contre'].includes(choice)?minInfluence:0})}});
});
$('chosenName').addEventListener('input',()=>{identityDirty=true;set('identityNotice','');});
$('identityForm').addEventListener('submit',async event=>{
 event.preventDefault();
 if(busy)return;
 if(!current){set('identityNotice','Connexion en cours. Attendez le chargement de votre équipe.');return;}
 const name=$('chosenName').value.trim();
 if(!name){set('identityNotice','Saisissez un nom de famille.');return;}
 busy=true;$('saveIdentity').disabled=true;set('identityNotice','Enregistrement du nom…');
 try{
  const result=await saveFamilyName(current,name,call);
  identityDirty=false;render(result);set('identityNotice','Nom enregistré : '+result.self.name+'.');
 }catch(error){set('identityNotice',error.message);}
 finally{busy=false;$('saveIdentity').disabled=false;}
});
const tabs=[$('boardTab'),$('rulesTab')];
function selectTab(index){
 tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;$(tab.getAttribute('aria-controls')).hidden=i!==index;});
}
tabs.forEach((tab,i)=>{
 tab.addEventListener('click',()=>selectTab(i));
 tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-i;selectTab(next);tabs[next].focus();}});
});
refresh();setInterval(refresh,2500);

$('offerCommitment').addEventListener('change',()=>{$('offerMinimumField').hidden=current?.campaign?.version>=3||!['pour','contre'].includes($('offerCommitment').value);});
