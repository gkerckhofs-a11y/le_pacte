import {commitmentLabel} from './founders-agreements.js';
import {renderCouncilRoles,appendFamilyRoles} from './founders-role-badges.js';
import {saveFamilyName} from './founders-name-save.js';
import {applySkin,applyTeamTheme} from './founders-skin-theme.js';
import {teamCaption,teamLabel} from './founders-identity.js';
"use strict";
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const sessionId=params.get('session'),key='pacte-founder-family-'+sessionId;
const fragment=new URLSearchParams(location.hash.slice(1));
let token=fragment.get('token')||sessionStorage.getItem(key)||'';
if(token)sessionStorage.setItem(key,token);
if(location.hash)history.replaceState(null,'',location.pathname+location.search);
let current=null,busy=false,identityDirty=false;
const nice={READY:'Préparation',COUNCIL:'Conseil',AWAITING_REVEAL:'Vote clos',REVEALED:'Révélation',FINISHED:'Terminé'};
const resources=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const set=(id,v)=>$(id).textContent=String(v??'');
function notify(message){set('notice',message);}
async function call(method='GET',payload){
 if(!sessionId||!/^[a-f0-9]{24}$/.test(sessionId)||!token)throw new Error('Lien personnel incomplet : demander un nouvel accès au porte-parole.');
 const r=await fetch('/api/founders/sessions/'+sessionId+(method==='POST'?'/commands':''),
 {method,headers:{Authorization:'Bearer '+token,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,cache:'no-store'});
 const data=await r.json();
 if(!r.ok)throw new Error(data.error||'Accès refusé');
 return data;
}
function gauge(data){
 const root=$('gauges');root.replaceChildren();
 for(const indicator of resources){
  const item=document.createElement('div');item.className='gauge';
  const top=document.createElement('div');top.className='gauge-head';
  const name=document.createElement('span');name.textContent=data.skin.labels.resources[indicator]||indicator;
  const n=document.createElement('strong');n.textContent=data.city[indicator]+'/10';top.append(name,n);
  const bar=document.createElement('div');bar.className='track';
  const inside=document.createElement('div');inside.className='bar';inside.style.width=data.city[indicator]*10+'%';
  bar.append(inside);item.append(top,bar);root.append(item);
 }
}
function offers(data){
 const root=$('offers');root.replaceChildren();
 for(const o of data.offers.slice(-30).reverse()){
  const el=document.createElement('div');el.className='card';
  const content=document.createElement('p');
  content.textContent=(o.from===data.self.id?'Vous proposez ':'Proposition reçue : ')+o.amount+' '+data.skin.labels.currency+' de '+teamLabel(data,o.from)+' à '+teamLabel(data,o.to)+' · '+o.reason+' · '+o.status+' · '+commitmentLabel(o.commitment);
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
 current=data;
 renderCouncilRoles($('councilRoles'),data);
 const self=data.self,c=data.council;
 applySkin(document.body,data.skin);applyTeamTheme(document.body,self.color,data.skin);
 set('teamIdentity',self.color.symbol+' Équipe '+self.color.label+' · Porte-parole');
 $('identityPanel').hidden=data.phase!=='READY';
 if(!identityDirty&&document.activeElement!==$('chosenName'))$('chosenName').value=self.name==='Nom à choisir'?'':self.name;
 set('familyName',self.name);appendFamilyRoles($('familyName'),data,self.id);set('phase',nice[data.phase]||data.phase);
 set('turn',data.phase==='COUNCIL'?(c.turn===self.id?'À vous !':c.turn?'À '+teamLabel(data,c.turn):c.phase==='await_moderator'?'Arbitrage':'Choix du Maire'):'—');
 set('dilemmaLabel',data.dilemma?'Chapitre '+data.dilemma.chapter:'Conseil des Fondateurs');
 set('dilemmaTitle',data.dilemma?.title||(data.phase==='FINISHED'?'Fin de la campagne':'Conseil en préparation'));
 set('dilemmaText',data.dilemma?.public_text||'');
 set('question',data.dilemma?.vote_question||'');
 const image=$('familyDilemmaImage'),src=data.dilemma?.image?.url;
 image.hidden=!(typeof src==='string'&&/^https:\/\/\S+$/.test(src));
 if(!image.hidden){image.src=src;image.alt=data.dilemma.image.alt||data.dilemma.title;}else image.removeAttribute('src');
 set('influence',self.power);set('dollars',self.dollars);
 set('influenceLabel',data.skin.labels.influence);set('dollarLabel',data.skin.labels.currency);set('offerAmountLabel',data.skin.labels.currency+' proposés');
 set('objective',self.objective);
 if(data.goalCard&&data.goalProgress){
  const card=data.goalCard,progress=data.goalProgress;
  set('goalTitle',card.title);
  const direction=card.direction==='at_least'?'au moins':'au plus';
  const indicator=data.skin.labels.resources[card.indicator]||card.indicator;
  set('goalConditions',indicator+' : '+direction+' '+card.firstTarget+' (palier 1), puis '+direction+' '+card.secondTarget+' (palier 2).');
  set('goalStatus','Indicateur actuel : '+progress.value+'/10 · Paliers atteints : '+(progress.first?'1':'0')+' / '+(progress.second?'1':'0')+
      ' · Points provisoires : '+progress.points+'/'+progress.maxPoints);
 }
 const final=$('personalResult');final.hidden=!data.finalResults;
 if(data.finalResults){
  const r=data.finalResults.ranking.find(item=>item.family===self.id);
  set('personalResultText',r.rank===1?'Votre famille remporte Le Pacte !':'Classement : '+r.rank+' / 6. Vainqueur : '+teamLabel(data,data.finalResults.ranking[0].family));
  set('personalScoreBreakdown','Objectif secret '+r.score.secret+' · '+data.skin.labels.currency+' '+r.score.wealth+
      ' · Votes '+r.score.council+' · Influence '+r.score.influence+' = '+r.score.total+' points');
 }
 set('familyStats',self.members+' membre(s) · Maire : '+teamLabel(data,data.leader)+' · Shérif : '+teamLabel(data,data.moderator));
 set('committed',self.choice?'Votre position : '+self.choice+' · Mise engagée : '+self.bid:'Aucun vote engagé pour ce dilemme.');
 set('voteHint',self.mayVote?'Votre famille doit décider maintenant.':data.phase==='COUNCIL'?'Vous pouvez négocier en attendant votre tour.':'Le Conseil attend la prochaine phase.');
 $('firstVote').hidden=!(self.mayVote&&self.choice===null);
 $('raiseVote').hidden=!(self.mayVote&&self.choice!==null);
 const lock=data.voteCommitment;
 $('voteCommitment').hidden=!lock||data.phase!=='COUNCIL';
 set('voteCommitment',lock?'Accord accepté : '+commitmentLabel(lock)+'. Ce choix est obligatoire pour ce Conseil.':'');
 for(const button of $('firstVote').querySelectorAll('[data-vote]'))button.disabled=Boolean(lock&&button.dataset.vote!==lock.choice);
 $('voteAmount').min=lock?.minInfluence||1;
 if(lock?.minInfluence&&Number($('voteAmount').value)<lock.minInfluence)$('voteAmount').value=lock.minInfluence;

 $('moderatorTie').hidden=!self.mayResolve;
 $('moderatorLeader').hidden=!self.mayChooseLeader;
 const candidate=$('leaderCandidates');candidate.replaceChildren();
 if(self.mayChooseLeader)for(const id of c.pendingLeaderChoices){
  const b=document.createElement('button');b.textContent='Désigner '+teamLabel(data,id);b.addEventListener('click',()=>command('chooseLeader',{family:id}));candidate.append(b);
 }
 $('offerForm').hidden=data.phase!=='COUNCIL';
 const target=$('targetFamily'),prev=target.value;target.replaceChildren();
 for(const f of data.families.filter(f=>f.id!==self.id)){
  const option=document.createElement('option');option.value=f.id;option.textContent=teamCaption(f);target.append(option);
 }
 if(Array.from(target.options).some(x=>x.value===prev))target.value=prev;
 const reveal=$('lastReveal');reveal.hidden=!data.reveal;
 if(data.reveal){set('resultTitle',data.reveal.winner==='pour'?'Proposition adoptée':'Proposition rejetée');set('resultNarration',data.reveal.narration);}
 gauge(data);offers(data);
}
async function refresh(){
 if(busy)return;
 try{const data=await call();if(busy||data.revision<(current?.revision??-1))return;if(data.revision!==current?.revision)render(data);notify('');}
 catch(e){notify(e.message);}
}
async function command(kind,data){
 if(!current||busy)return;
 busy=true;notify('Enregistrement…');
 try{const result=await call('POST',{kind,data,expectedRevision:current.revision});render(result);notify('Décision enregistrée.');}
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
 command('offer',{id,to:$('targetFamily').value,amount:Number($('offerAmount').value),reason:$('offerReason').value.trim(),commitment:{choice:$('offerCommitment').value,...($('offerCommitment').value==='gift'?{}:{minInfluence:['pour','contre'].includes($('offerCommitment').value)?Number($('offerMinimum').value):0})}});
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

$('offerCommitment').addEventListener('change',()=>{$('offerMinimumField').hidden=!['pour','contre'].includes($('offerCommitment').value);});
