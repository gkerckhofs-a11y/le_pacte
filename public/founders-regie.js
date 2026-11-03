import {applySkin,applyTeamTheme} from './founders-skin-theme.js';
import {teamCaption,teamLabel,colorize} from './founders-identity.js';
"use strict";
const $=id=>document.getElementById(id),p=new URLSearchParams(location.search);
const sid=p.get('session');let authSDK=null,cloud=false,token='',current=null,busy=false;
const labels={READY:'Prêt',COUNCIL:'Conseil en cours',AWAITING_REVEAL:'En attente de la révélation',REVEALED:'Résultat annoncé',FINISHED:'Partie terminée'};
const gaugeIds=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const set=(id,v)=>$(id).textContent=String(v??'');
const secure=()=>sid&&/^[a-f0-9]{24}$/.test(sid);
async function init(){
 if(!secure())throw new Error('Adresse de régie incomplète : identifiant de partie manquant.');
 const r=await fetch('/api/catalog',{cache:'no-store'});
 if(!r.ok)throw new Error('Connexion API indisponible');
 const c=await r.json();cloud=c.authMode==='firebase';
 if(cloud){
  authSDK=await import('/firebase-auth.js');
  await authSDK.configure(c.firebaseConfig,c.authEmulatorUrl);
  $('localKey').hidden=true;
 }else{
  token=sessionStorage.getItem('pacte-founder-organizer-key')||'';
  $('localKey').value=token;
 }
 await refresh();
}
async function organizerToken(){
 if(cloud){token=await authSDK.currentToken();if(!token)throw new Error('Connectez le compte organisateur Google.');}
 else token=$('localKey').value.trim();
 if(!token)throw new Error('Clé régie requise.');
 return token;
}
async function api(path,method='GET',body){
 const bearer=await organizerToken();
 const r=await fetch('/api/founders/sessions/'+sid+path,{
  method,headers:{Authorization:'Bearer '+bearer,...(body?{'Content-Type':'application/json'}:{})},
  body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const data=await r.json();if(!r.ok)throw new Error(data.error||'Requête refusée');
 return data;
}
async function refresh(){
 if(busy||!secure())return;
 try{
  const s=await api('');if(current?.revision!==s.revision)render(s);
  $('loginPanel').hidden=true;$('regieContent').hidden=false;
  set('notice','');
 }catch(e){set('loginMessage',e.message);$('loginPanel').hidden=false;}
}
function gauge(s){
 const root=$('gauges');root.replaceChildren();
 for(const k of gaugeIds){
  const el=document.createElement('div');el.className='gauge';
  const row=document.createElement('div');row.className='gauge-head';
  const label=document.createElement('span');label.textContent=s.skin.labels.resources[k]||k;
  const n=document.createElement('strong');n.textContent=s.city[k]+'/10';row.append(label,n);
  const track=document.createElement('div');track.className='track';
  const bar=document.createElement('div');bar.className='bar';bar.style.width=s.city[k]*10+'%';track.append(bar);el.append(row,track);root.append(el);
 }
}
function render(s){
 applySkin(document.body,s.skin);
 current=s;set('phase',labels[s.phase]||s.phase);set('sessionCode',s.code+' · '+s.selection.scenarioVersion+' · skin '+s.selection.skinId);
 set('sessionTitle',s.title);set('revision','Révision '+s.revision);
 set('dilemmaInfo',s.dilemma?'Délibération : '+s.dilemma.title+(s.dilemma.vote_question?' — '+s.dilemma.vote_question:''):'');
 set('tiePriority','Tirage de départage final : '+s.finalTieOrder.map(id=>teamLabel(s,id)).join(' → '));
 $('start').hidden=s.phase!=='READY';
 $('reveal').hidden=s.phase!=='AWAITING_REVEAL';
 $('next').hidden=s.phase!=='REVEALED';
 $('next').textContent=s.reveal?.nextId===null?'Terminer la campagne':'Dilemme suivant';
 $('lastReveal').hidden=!s.reveal;
 if(s.reveal){set('outcomeHeading',s.reveal.winner==='pour'?'POUR l’emporte':'CONTRE l’emporte');set('outcomeDetail',s.reveal.narration);}
 $('publicLink').href='/founders-city.html?session='+s.id;
 gauge(s);
 set('votePhase',s.council.turn?'Au tour de '+teamLabel(s,s.council.turn):
  s.council.phase==='await_moderator'?'Le Modérateur arbitre':
  s.council.phase==='await_leader'?'Le Modérateur désigne un Meneur':
  s.phase==='AWAITING_REVEAL'?'Vote clos':'');
 const votes=$('ballots');votes.replaceChildren();
 for(const f of s.families){
  const card=document.createElement('div');card.className='ballot';
  const a=document.createElement('span');a.textContent=teamCaption(f);colorize(a,f);
  const b=document.createElement('span');b.textContent=s.council.choices[f.id]||'—';
  const c=document.createElement('strong');c.textContent=s.council.bids[f.id]||0;
  card.append(a,b,c);votes.append(card);
 }
 const families=$('families');families.replaceChildren();
 for(const family of s.families){
  const el=document.createElement('div');el.className='card';
  const head=document.createElement('div');head.className='row between';
  const name=document.createElement('strong');name.textContent=teamCaption(family)+' · '+family.members+' pers.';
  const button=document.createElement('button');button.className='secondary';button.textContent='Créer un accès';
  button.addEventListener('click',()=>rotate(family.id));head.append(name,button);el.append(head);
  const details=document.createElement('div');details.className='small muted';
  const resources=s.familyResources[family.id];
  details.textContent='Influence '+resources.power+' · '+s.skin.labels.currency+' '+resources.dollars;
  el.append(details);families.append(el);
 }
 const final=$('finalPanel');final.hidden=!s.finalResults;
 if(s.finalResults){
  set('finalWinner',teamLabel(s,s.finalResults.ranking[0].family)+' remporte la partie ('+s.finalResults.ranking[0].score.total+' pts)');
  const root=$('ranking');root.replaceChildren();
  for(const r of s.finalResults.ranking){
   const el=document.createElement('div');el.className='ballot';
   const family=document.createElement('strong');family.textContent=r.rank+'. '+teamLabel(s,r.family);
   const detail=document.createElement('span');detail.textContent='Objectif '+r.score.secret+' · Richesse '+r.score.wealth+
      ' · Politique '+r.score.council+' · Influence '+r.score.influence;
   const points=document.createElement('strong');points.textContent=r.score.total;
   el.append(family,detail,points);root.append(el);
  }
 }
 const history=$('history');history.replaceChildren();
 for(const item of s.history.slice(-8).reverse()){
  const el=document.createElement('div');el.className='card';
  const title=document.createElement('strong');title.textContent=item.title+' · '+(item.winner==='pour'?'Adopté':'Refusé');
  const desc=document.createElement('p');desc.className='small';desc.textContent=item.narration;
  el.append(title,desc);history.append(el);
 }
}
async function command(kind,data={}){
 if(!current||busy)return;
 busy=true;set('notice','Enregistrement…');
 try{
  const s=await api('/commands','POST',{kind,data,expectedRevision:current.revision});
  render(s);set('notice','Commande enregistrée.');
 }catch(e){set('notice',e.message);}
 finally{busy=false;}
}
async function rotate(family){
 if(busy)return;busy=true;set('notice','Renouvellement du jeton…');
 try{
  const result=await api('/access/'+family,'POST',{});
  const url=new URL('/founders-family.html?session='+sid,location.origin);
  url.hash='token='+encodeURIComponent(result.token);
  $('newAccessLink').value=url.href;$('accessOutput').hidden=false;
  set('notice','Accès de la famille '+family+' renouvelé. Ne partagez ce lien qu’avec son porte-parole.');
 }catch(e){set('notice',e.message);}
 finally{busy=false;}
}
$('start').addEventListener('click',()=>command('start'));
$('reveal').addEventListener('click',()=>command('reveal'));
$('next').addEventListener('click',()=>command('next'));
$('copyAccess').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText($('newAccessLink').value);set('notice','Lien copié.');}
 catch{set('notice','Sélectionnez et copiez le lien dans le champ.');}
});
$('login').addEventListener('click',async()=>{
 try{
  if(cloud)await authSDK.login();
  else sessionStorage.setItem('pacte-founder-organizer-key',$('localKey').value.trim());
  await refresh();
 }catch(e){set('loginMessage',e.message);}
});
init().catch(e=>{set('loginMessage',e.message);});
setInterval(refresh,2500);
