import {renderChicagoAmbition,renderKeyDecisionBanner} from './chicago-objectives.js';
import {renderChicagoGauges} from './founders-live-ui.js';
import {renderSuccession,chicagoImage,chicagoPhase} from './chicago-succession.js';
import {CAMPAIGN_PHASES,setHotspringImage,renderTendencies,renderHotspringStage,campaignScoreText,hotspringWinners} from './founders-hotspring.js';
import {decorateGauge,formatGaugeNumber,renderPhaseClock,voteTotals,appendGaugeDelta,renderChicagoChoices} from './founders-live-ui.js';
import {renderVoteProgress} from './founders-vote-progress.js';
import {commitmentLabel,offerStatusText,createSentOfferNotices} from './founders-agreements.js';
import {renderCouncilRoles,appendFamilyRoles,roleLabel} from './founders-role-badges.js';
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
 if(data.skin.labels.indicatorGroup)$('gaugeHeading').textContent=data.skin.labels.indicatorGroup;
 if(renderChicagoGauges(root,data))return;
 for(const indicator of Object.keys(data.city)){
  const item=document.createElement('div');item.className='gauge';
  const top=document.createElement('div');top.className='gauge-head';
  const name=document.createElement('span');name.textContent=data.skin.labels.resources[indicator]||indicator;
  const n=document.createElement('strong');n.textContent=formatGaugeNumber(data.city[indicator],indicator==='stabilite'&&(data.campaign?.version>=2||data.manualCouncil))+'/'+(data.gaugeMaximum??10);appendGaugeDelta(n,data,indicator);top.append(name,n);
  const bar=document.createElement('div');bar.className='track';
  const inside=document.createElement('div');inside.className='bar';inside.style.width=data.city[indicator]*100/(data.gaugeMaximum??10)+'%';
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
let sentNotices,displayedOffer;
function renderSentNotice(data){
 sentNotices??=createSentOfferNotices(sessionStorage,'pacte-offres-'+sessionId+'-'+data.self.id);
 const unread=sentNotices.unread(data),offer=unread[0];
 $('sentOfferNotice').hidden=!offer;
 if(!offer){displayedOffer=null;return;}
 const dismissLabel=unread.length>1?'Suivante ('+(unread.length-1)+')':'Fermer';
 set('dismissSentOffer',dismissLabel);
 if(displayedOffer?.id===offer.id&&displayedOffer.status===offer.status)return;
 displayedOffer=offer;
 set('sentOfferTitle',offerStatusText(offer));
 const amount=offer.amount+' $',family=teamLabel(data,offer.to);
 set('sentOfferText',offer.status==='pending'?'Offre de '+amount+' à '+family+'. Aucun dollar débité.':
  offer.status==='accepted'?'Versement de '+amount+' à '+family+'.':'Offre de '+amount+' à '+family+(offer.status==='cancelled'?'. Conseil annulé.':'. Aucun dollar versé.'));
}
$('dismissSentOffer').addEventListener('click',()=>{
 if(displayedOffer){sentNotices.dismiss(displayedOffer);renderSentNotice(current);}
});
function updateOfferValidity(){
 const target=$('targetFamily').value,choice=$('offerCommitment').value;
 const reason=current.voteOfferLimits?.[target]?.[choice],noFunds=current.self.dollars<1;
 $('offerLimitHint').hidden=!reason;
 if(reason)set('offerLimitHint','Accord '+choice.toUpperCase()+' impossible avec '+teamLabel(current,target)+'. '+reason+'.'+
  (noFunds?'':' Vous pouvez choisir « Don / transfert libre ».'));
 $('sendOffer').disabled=Boolean(reason)||noFunds;
 $('offerBalanceHint').hidden=!noFunds;
}
const isPoliticalOffer=offer=>Boolean(offer.commitment&&offer.commitment.choice!=='gift');
function offers(data){
 const root=$('offers');root.replaceChildren();
 const shown=$('negotiationPanel').hidden?data.offers.filter(o=>o.status==='pending'&&o.from===data.self.id):data.offers;
 $('offerHistory').hidden=!shown.length||Boolean(data.clock?.paused)||!['NEGOTIATION','COUNCIL'].includes(data.phase);
 if($('offerHistory').hidden)return;
 for(const o of shown.slice(-30).reverse()){
  const el=document.createElement('div');el.className='card';
  const outgoing=o.from===data.self.id;
  const title=document.createElement('strong');
  title.textContent=(outgoing?'Proposition à ':'Proposition de ')+teamLabel(data,outgoing?o.to:o.from)+' · '+o.amount+' $';
  const content=document.createElement('p');
  content.textContent=(isPoliticalOffer(o)?commitmentLabel(o.commitment):'Don libre')+' · '+offerStatusText(o);
  el.append(title,content);
  if(o.reason&&o.reason!=='Proposition financière'){
   const note=document.createElement('p');note.textContent=o.reason;el.append(note);
  }
  if(o.status==='pending'&&o.to===data.self.id){
   const b=document.createElement('button');b.textContent='Examiner la proposition';
   b.addEventListener('click',()=>renderOfferDialog(current,o.id));el.append(b);
  }
  if(o.status==='pending'&&o.from===data.self.id){
   const b=document.createElement('button');b.className='secondary';b.textContent='Annuler';b.addEventListener('click',()=>command('rejectOffer',{id:o.id}));el.append(b);
  }
  root.append(el);
 }
}
function render(data){
 document.body.classList.toggle('chicago-v3',Boolean(data.succession));
 const manual=data.manualCouncil||data.campaign?.version>=3||data.chicago;
 const finishing=data.phase==='FINISHED'&&!document.body.classList.contains('game-finished');document.body.classList.toggle('game-finished',data.phase==='FINISHED');
 renderVoteProgress($('voteProgress'),data);
 renderPhaseClock($('phaseClock'),data);
 set('familyVoteTotals',(()=>{const t=voteTotals(data);return 'POUR '+t.yes+' · CONTRE '+t.no+' · ABSTENTIONS '+t.abstentions;})());
 if(current?.phase!==data.phase){$('offerFeedback').hidden=true;$('offerSendError').hidden=true;}
 current=data;
 renderSuccession($('chicagoSuccession'),data,'team',command);
 $('chicagoEquity').hidden=$('chicagoPriority').hidden=!data.succession;
 $('chicagoLegacyRules').hidden=Boolean(data.manualCouncil);
 if(data.succession)set('chicagoPriority','Ordre tiré au lancement · '+data.finalTieOrder.map(id=>teamLabel(data,id)).join(' → '));
 renderCouncilRoles($('councilRoles'),data);
 const self=data.self,c=data.council;
 document.body.classList.toggle('campaign-hotspring',Boolean(data.campaign));
 applySkin(document.body,data.skin);applyTeamTheme(document.body,self.color,data.skin);
 set('teamIdentity',self.color.symbol+' Équipe '+self.color.label+' · Porte-parole');
 $('identityPanel').hidden=data.phase!=='READY';
 if(!identityDirty&&document.activeElement!==$('chosenName'))$('chosenName').value=self.name==='Nom à choisir'?'':self.name;
 set('terminalSession','Session '+data.code+' · Équipe '+self.id);set('familyName',self.name);appendFamilyRoles($('familyName'),data,self.id);set('phase',(chicagoPhase(data)||nice[data.phase]||data.phase)+(manual&&data.clock?.paused?' · Pause':''));
 set('turn',data.phase==='COUNCIL'?(c.turn===self.id?'C’est à vous.':c.turn?'En attente — '+teamLabel(data,c.turn)+' joue actuellement.':c.phase==='await_moderator'?'Arbitrage':data.chicago?'Choix · '+roleLabel(data,'mayor'):'Choix du Maire'):'—');
 set('dilemmaLabel',data.dilemma?'Chapitre '+data.dilemma.chapter:data.chicago?'La Commission':'Conseil des Fondateurs');
 set('dilemmaTitle',data.dilemma?.title||(data.phase==='FINISHED'?'Fin de la campagne':'Conseil en préparation'));
 set('dilemmaText',data.dilemma?.public_text||'');
 set('question',data.dilemma?.vote_question||'');
 const keyDecision=data.chicagoAmbition?.pivots.find(decision=>decision.current);
 renderKeyDecisionBanner($('keyDecisionBanner'),keyDecision);
 renderChicagoChoices($('chicagoChoices'),data,keyDecision?.choice);
 const image=$('familyDilemmaImage'),src=data.dilemma?.image?.url;
 if(data.succession){chicagoImage(image,data.reveal?.visual??data.dilemma?.image);}
 else if(data.campaign){
  renderHotspringStage($('hotspringStage'),data,charter=>command('supportCharter',{charter}));
  renderTendencies($('hotspringTendencies'),data.phase==='REVEALED'?null:data.dilemma);
  setHotspringImage(image,data.phase==='REVEALED'?data.reveal?.visual:data.dilemma?.image);
 }else{
 image.hidden=!(typeof src==='string'&&/^https:\/\/\S+$/.test(src));
 if(!image.hidden){image.src=src;image.alt=data.dilemma.image.alt||data.dilemma.title;}else image.removeAttribute('src');
 }
 set('influence',self.power);set('dollars',self.dollars);
 set('influenceLabel',data.skin.labels.influence);set('dollarLabel',data.skin.labels.currency);set('offerAmountLabel',data.skin.labels.currency+' proposés');
 const hasPrivateBrief=Boolean(data.chicagoAmbition?.progress);
 $('objective').hidden=hasPrivateBrief;
 $('ambitionLink').hidden=!hasPrivateBrief;
 set('objectiveHeading',hasPrivateBrief?'Votre ambition':'Objectif secret');
 set('objective',hasPrivateBrief?'':data.chicagoAmbition?.specialty??data.privateCampaign?.trajectory??self.objective);
 renderChicagoAmbition($('chicagoAmbition'),data.chicagoAmbition);
 $('goalProgress').hidden=Boolean(data.campaign||data.chicago);
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
 if(data.succession&&data.finalResults){
  const row=data.finalResults.rows.find(r=>r.family===self.id);
  set('personalResultText',data.narrativeEnding.title);
  set('personalScoreBreakdown','Ambitions '+row.secret+' pts · Fortune '+(row.wealth??0)+' pts · '+row.support+' soutien(s) × 2 = '+row.total+' points au total.');
 }else if(data.campaign&&data.finalResults){
  const score=data.privateCampaign.score;
  set('personalResultText',hotspringWinners(data));
  set('personalScoreBreakdown',score.total+'/'+score.maximum+' · '+campaignScoreText(score));
 }else if(data.finalResults){
  const r=data.finalResults.ranking.find(item=>item.family===self.id);
  set('personalResultText',r.rank===1?'Votre famille remporte la partie !':'Classement : '+r.rank+' / '+data.families.length+'. Vainqueur : '+teamLabel(data,data.finalResults.ranking[0].family));
  set('personalScoreBreakdown','Objectif secret '+r.score.secret+' · '+data.skin.labels.currency+' '+r.score.wealth+
      ' · Votes '+r.score.council+' · Influence '+r.score.influence+' = '+r.score.total+' points');
 }
 for(const b of $('firstVote').querySelectorAll('[data-vote="pour"],[data-vote="contre"]')){
  const side=b.dataset.vote;
  if(!b.dataset.defaultLabel)b.dataset.defaultLabel=b.textContent;
  b.textContent=(data.campaign||data.chicago)&&data.dilemma?' '+side.toUpperCase()+' · '+data.dilemma.labels[side]:b.dataset.defaultLabel;
 }
 $('familyStatsBlock').hidden=Boolean(data.campaign);
 if(!data.campaign)set('familyStats',self.members+' membre(s) · '+roleLabel(data,'mayor')+' : '+teamLabel(data,data.leader)+' · '+roleLabel(data,'sheriff')+' : '+teamLabel(data,data.moderator));
 if(data.chicago){
  $('firstVote').querySelector('[data-vote="passe_moderateur"]').textContent='ABSTENTION · '+roleLabel(data,'sheriff');
  $('moderatorTie').querySelector('p').textContent=roleLabel(data,'sheriff')+' départage le Conseil.';
  $('moderatorLeader').querySelector('p').textContent='Choisissez la famille qui reprend le rôle « '+roleLabel(data,'mayor')+' ».';
 }
 set('committed',self.choice?'Votre position : '+self.choice+' · Mise engagée : '+self.bid:'Aucun vote engagé pour ce dilemme.');
 set('voteHint',self.mayVote?'Votre famille doit décider maintenant.':data.phase==='COUNCIL'?'Vous serez prévenus quand ce sera à vous de voter.':'Le Conseil attend la prochaine phase.');
 const chapter=$('familyChapter'),votePanel=$('familyVotePanel');
 if(data.phase==='COUNCIL'){
  if(votePanel.nextElementSibling!==chapter)chapter.before(votePanel);
 }else if(chapter.nextElementSibling!==votePanel){
  chapter.after(votePanel);
 }
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
 $('negotiationPanel').hidden=data.clock?.paused||(data.experienceVersion===2?data.phase!=='NEGOTIATION':data.phase!=='COUNCIL');
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
 const campaignRules=$('rulesHotspring');
 campaignRules.hidden=!(data.campaign||data.manualCouncil);
 if(!campaignRules.hidden&&!campaignRules.firstElementChild)campaignRules.append(createHotspringRules({manual,chicago:Boolean(data.chicago)}));
 $('rulesIntroduction').hidden=!campaignRules.hidden;
 $('rulesLegacy').hidden=data.experienceVersion===2;$('rulesV2').hidden=data.experienceVersion!==2||Boolean(data.campaign||data.chicago);
 $('rulesChicago').hidden=!data.chicago;
 const target=$('targetFamily'),recipients=data.families.filter(f=>f.id!==self.id);
 if(target.options.length!==recipients.length||recipients.some((f,i)=>target.options[i].value!==f.id||target.options[i].textContent!==teamCaption(f))){
  const prev=target.value;
  target.replaceChildren();
  for(const f of recipients){
   const option=document.createElement('option');option.value=f.id;option.textContent=teamCaption(f);target.append(option);
  }
  if(recipients.some(f=>f.id===prev))target.value=prev;
 }
 updateOfferValidity();renderSentNotice(data);
 const reveal=$('lastReveal');reveal.hidden=!data.reveal;
 if(data.reveal){set('resultTitle',(data.campaign||data.chicago)?data.reveal.chronicle.title:data.reveal.winner==='pour'?'Proposition adoptée':'Proposition rejetée');set('resultNarration',data.reveal.narration);}
 gauge(data);offers(data);renderOfferDialog(data);
 if(data.phase==='FINISHED'){const board=$('boardPanel');board.prepend($('familyEpilogue'));board.prepend($('personalResult'));if(finishing){selectTab(0);$(data.chicago?'familyEpilogue':'personalResult').scrollIntoView({block:'start'});}}
 $('familyEpilogue').hidden=!data.narrativeEnding||Boolean(data.campaign);$('familyEpilogue').replaceChildren();
 if(data.narrativeEnding&&!data.campaign){const h=document.createElement('h2');h.textContent=data.narrativeEnding.title;$('familyEpilogue').append(h);for(const t of data.narrativeEnding.paragraphs){const p=document.createElement('p');p.textContent=t;$('familyEpilogue').append(p);}}
}
function renderOfferDialog(data,requestedId){
 const dialog=$('offerDialog');
 const canRespond=['NEGOTIATION','COUNCIL'].includes(data.phase)&&!data.clock?.paused;
 const incoming=canRespond?data.offers.filter(o=>o.to===data.self.id&&o.status==='pending'):[];
 $('incomingOffers').hidden=incoming.length===0;
 if(!incoming.length){
  if(dialog.open)dialog.close();
  delete dialog.dataset.offer;
  return;
 }
 const offer=incoming.find(o=>o.id===(requestedId||dialog.dataset.offer))??incoming[0];
 const sender=teamLabel(data,offer.from);
 set('incomingSummary',incoming.length===1?'Proposition de '+sender+' · '+offer.amount+' $':incoming.length+' propositions attendent votre réponse.');
 const changed=dialog.dataset.offer!==offer.id;
 dialog.dataset.offer=offer.id;
 const binding=isPoliticalOffer(offer),choice=offer.commitment?.choice;
 set('offerHeading',binding?'Accord de vote proposé':'Don proposé à votre famille');
 set('receivedOffer',offer.amount+' $ de la part de '+sender+'.');
 const proposal=data.dilemma?.labels?.[choice];
 const terms=choice==='passe_pouvoir'?'Vous devrez vous abstenir pour récupérer de l’Influence.':
  binding?'Vous devrez voter '+choice.toUpperCase()+(proposal?' — « '+proposal+' »':'')+' et engager au moins '+offer.commitment.minInfluence+' Influence.':
  'Ce don ne vous engage pas à voter. Votre famille garde le choix de son camp.';
 set('receivedCommitment',terms);
 const closed=binding&&data.phase==='COUNCIL'&&(data.self.choice!==null||data.council.phase!=='voting');
 const conflicts=binding&&data.voteCommitment&&data.voteCommitment.choice!==choice;
 $('offerAccept').disabled=Boolean(closed||conflicts);
 set('receivedBalance',closed?'Vous avez déjà pris position ou le scrutin est clos. Vous pouvez écarter cette proposition.':
  conflicts?'Vous avez déjà accepté un accord pour un autre camp. Vous pouvez refuser cette proposition.':
  'Si vous acceptez, votre solde passera de '+data.self.dollars+' $ à '+(data.self.dollars+offer.amount)+' $. En cas de refus, chacun garde son argent.');
 $('receivedMessage').hidden=!offer.reason||offer.reason==='Proposition financière';
 set('receivedMessage','Message de la famille : '+(offer.reason||''));
 set('offerAccept',binding?'Accepter l’accord':'Accepter le don');
 set('offerReject',binding?'Refuser l’accord':'Refuser le don');
 if(changed||requestedId){
  $('offerError').hidden=true;
  if(!dialog.open)dialog.showModal();
  else if(changed)$('offerHeading').focus();
 }
}
$('reviewOffer').addEventListener('click',()=>renderOfferDialog(current,$('offerDialog').dataset.offer));
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
 const answering=kind==='acceptOffer'||kind==='rejectOffer';
 const offer=answering?current.offers.find(o=>o.id===data.id):null;
 try{
  const result=await call('POST',{kind,data,expectedRevision:current.revision});
  render(result);
  if(offer||kind==='offer'){
   const message=kind==='offer'?'Proposition envoyée à '+teamLabel(result,data.to)+' · '+data.amount+' $.':
    kind==='acceptOffer'?'Vous avez reçu '+offer.amount+' $ de '+teamLabel(result,offer.from)+'. Votre solde est de '+result.self.dollars+' $.':
    offer.from===result.self.id?'Proposition annulée. Aucun dollar versé.':'Proposition refusée. Aucun dollar transféré.';
   set('offerFeedback',message);$('offerFeedback').hidden=false;notify('');
  }else notify('Décision enregistrée.');
 }catch(e){
  notify(e.message);
  try{const latest=await call();render(latest);}catch{ /* Keep the command error visible. */ }
  if(kind==='offer'){
   const message='Envoi non confirmé. '+e.message;
   set('offerSendError',message);$('offerSendError').hidden=false;
   if($('negotiationPanel').hidden){set('offerFeedback',message);$('offerFeedback').hidden=false;}
  }
  if(answering&&$('offerDialog').open&&$('offerDialog').dataset.offer===data.id){
   set('offerError',e.message);$('offerError').hidden=false;
  }
 }
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
 if(!current||$('sendOffer').disabled)return;
 $('offerSendError').hidden=true;
 const id=crypto.randomUUID?.()??Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
 const choice=$('offerCommitment').value;
 const minInfluence=current?.campaign?.version>=3||current?.chicago?1:Number($('offerMinimum').value);
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

$('offerForm').addEventListener('change',()=>{if(current){$('offerSendError').hidden=true;updateOfferValidity();}});
$('offerCommitment').addEventListener('change',()=>{$('offerMinimumField').hidden=current?.campaign?.version>=3||current?.chicago||!['pour','contre'].includes($('offerCommitment').value);});
