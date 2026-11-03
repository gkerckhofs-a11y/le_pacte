import {councilGuidance,startCouncil,organizerError,validNarrativeSession} from './founders-regie-flow.js';
import {applySkin,applyTeamTheme} from './founders-skin-theme.js';
import {teamCaption,teamLabel,colorize} from './founders-identity.js';
"use strict";
const $=id=>document.getElementById(id),p=new URLSearchParams(location.search);
const sid=p.get('session');let authSDK=null,cloud=false,token='',current=null,busy=false,initialized=false,authenticating=false,waitingForLogin=false;
const labels={READY:'Prêt',COUNCIL:'Conseil en cours',AWAITING_REVEAL:'En attente de la révélation',REVEALED:'Résultat annoncé',FINISHED:'Partie terminée'};
const gaugeIds=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const set=(id,v)=>$(id).textContent=String(v??'');
const secure=()=>validNarrativeSession(sid);
function step(number){for(let i=1;i<=3;i++)if(i===number)$('step'+i).setAttribute('aria-current','step');else $('step'+i).removeAttribute('aria-current');}
function account(){const user=authSDK?.currentAccount?.();return user?.email||user?.displayName||'Compte organisateur connecté';}
async function init(){
 initialized=false;waitingForLogin=false;$('login').disabled=true;$('retryInit').hidden=true;set('phase','Connexion en cours…');set('loginMessage','');
 try{
  if(sid&&!secure())throw new Error('Ce lien de régie est incomplet ou invalide. Retrouvez la partie depuis sa configuration.');
  const r=await fetch('/api/catalog',{cache:'no-store'});
  if(!r.ok)throw new Error('Le serveur ne répond pas. Vérifiez votre connexion et réessayez.');
  const c=await r.json();cloud=c.authMode==='firebase';
  $('localLogin').hidden=cloud;
  if(cloud){
   authSDK=await import('/firebase-auth.js');
   await authSDK.configure(c.firebaseConfig,c.authEmulatorUrl);
   set('loginHelp','Utilisez le compte Google organisateur qui a créé la partie. Les liens des équipes ne permettent pas de lancer le jeu.');
   set('login','Se connecter avec Google');
  }else{
   token=sessionStorage.getItem('pacte-founder-organizer-key')||'';$('localKey').value=token;
   set('loginHelp','Saisissez la clé organisateur de votre répétition locale.');set('login','Ouvrir la régie');
  }
  initialized=true;$('login').disabled=false;
  await refresh();
 }catch(error){set('phase','Connexion indisponible');set('loginMessage',organizerError(error));$('retryInit').hidden=false;}
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
 const data=await r.json();if(!r.ok){const error=new Error(data.error||'Requête refusée');error.status=r.status;throw error;}
 return data;
}
async function listSessions(){
 const bearer=await organizerToken(),r=await fetch('/api/founders/sessions',{headers:{Authorization:'Bearer '+bearer},cache:'no-store'});
 const data=await r.json();if(!r.ok){const error=new Error(data.error||'Impossible de retrouver vos parties.');error.status=r.status;throw error;}
 const root=$('sessionsList');root.replaceChildren();$('sessionPicker').hidden=false;
 for(const session of data.sessions){
  if(!validNarrativeSession(session.id))continue;
  const row=document.createElement('div');row.className='card row between';
  const title=document.createElement('strong');title.textContent=session.code+' · '+session.title+' · '+(labels[session.phase]||session.phase);
  const link=document.createElement('a');link.textContent='Ouvrir la régie →';link.href='/founders-regie.html?session='+session.id;row.append(title,link);root.append(row);
 }
 if(!data.sessions.length)root.textContent='Aucune partie trouvée pour ce compte. Changez de compte Google ou créez une partie.';
}
function connected(){
 $('loginPanel').hidden=true;$('accountPanel').hidden=false;$('chooseSession').hidden=false;$('changeAccount').hidden=!cloud;
 set('signedInAs',cloud?'Connecté : '+account():'Régie locale connectée');
}
function connectionFailure(error){
 set('loginMessage',organizerError(error));$('loginPanel').hidden=false;
 if(!current)set('phase','Connexion requise');
 if(error.status===403||/organisateur Google|Clé régie requise/.test(error.message)){
  waitingForLogin=true;
  $('regieContent').hidden=true;$('accountPanel').hidden=true;step(1);
  const user=authSDK?.currentAccount?.();
  if(user){set('login','Changer de compte Google');set('loginMessage','Compte connecté : '+account()+'. '+organizerError(error));}
 }
}
async function refresh(){
 if(busy||!initialized||authenticating||waitingForLogin)return;
 try{
  if(!secure()){
   if(!$('sessionPicker').hidden)return;
   await listSessions();connected();set('phase','Choisir une partie');step(2);return;
  }
  const s=await api('');
  if(busy||authenticating||waitingForLogin||s.revision<(current?.revision??-1))return;
  if(current?.revision!==s.revision)render(s);
  connected();$('regieContent').hidden=false;
 }catch(error){connectionFailure(error);}
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
 current=s;
 const guidance=councilGuidance(s);step(guidance.step);set('stageTitle',guidance.title);set('stageHint',guidance.hint);
 $('preparation').hidden=s.phase!=='READY';
 const named=s.families.filter(f=>f.name&&f.name!=='Nom à choisir').length;set('teamReadyCount',named+'/6 équipes ont choisi leur nom');
 $('preparePublicLink').href='/founders-city.html?session='+s.id;
 set('phase',labels[s.phase]||s.phase);set('sessionCode',s.code+' · '+s.selection.scenarioVersion+' · skin '+s.selection.skinId);
 set('sessionTitle',s.title);set('revision','Révision '+s.revision);
 set('dilemmaInfo',s.dilemma?'Délibération : '+s.dilemma.title+(s.dilemma.vote_question?' — '+s.dilemma.vote_question:''):'');
 set('tiePriority','Tirage de départage final : '+s.finalTieOrder.map(id=>teamLabel(s,id)).join(' → '));
 $('start').hidden=s.phase!=='READY';
 $('reveal').hidden=s.phase!=='AWAITING_REVEAL';
 $('next').hidden=s.phase!=='REVEALED';
 $('next').textContent=s.reveal?.nextId===null?'Terminer la partie':'Dilemme suivant';
 $('lastReveal').hidden=!s.reveal;
 if(s.reveal){set('outcomeHeading',s.reveal.winner==='pour'?'POUR l’emporte':'CONTRE l’emporte');set('outcomeDetail',s.reveal.narration);}
 $('publicLink').href='/founders-city.html?session='+s.id;
 gauge(s);
 set('votePhase',s.council.turn?'Au tour de '+teamLabel(s,s.council.turn):
  s.council.phase==='await_moderator'?'Le Shérif arbitre':
  s.council.phase==='await_leader'?'Le Shérif désigne un Maire':
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
  const button=document.createElement('button');button.className='secondary';button.textContent='Renouveler le lien privé';
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
 busy=true;set('actionMessage','Enregistrement…');$('actions').querySelectorAll('button').forEach(b=>b.disabled=true);
 try{
  const s=await api('/commands','POST',{kind,data,expectedRevision:current.revision});
  render(s);set('actionMessage',kind==='reveal'?'Décision révélée sur la projection.':s.phase==='FINISHED'?'Partie terminée : classement affiché.':'Le prochain dilemme est ouvert.');
 }catch(e){set('actionMessage',e.message);try{render(await api(''));}catch{}}
 finally{busy=false;$('actions').querySelectorAll('button').forEach(b=>b.disabled=false);}
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
$('start').addEventListener('click',async()=>{
 if(!current||busy)return;
 busy=true;$('start').disabled=true;set('actionMessage','Ouverture du premier dilemme…');
 try{
  const result=await startCouncil(api);render(result.view);
  set('actionMessage',result.started?'Partie lancée. Le premier dilemme est affiché ; le Maire peut voter sur son écran d’équipe.':'La partie a déjà démarré. La régie affiche son état actuel.');
 }catch(error){set('actionMessage',organizerError(error));try{render(await api(''));}catch{}}
 finally{busy=false;$('start').disabled=false;}
});
$('reveal').addEventListener('click',()=>command('reveal'));
$('next').addEventListener('click',()=>command('next'));
$('copyAccess').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText($('newAccessLink').value);set('notice','Lien copié.');}
 catch{set('notice','Sélectionnez et copiez le lien dans le champ.');}
});
async function login(){
 if(!initialized||authenticating)return;
 authenticating=true;waitingForLogin=false;current=null;$('regieContent').hidden=true;$('sessionPicker').hidden=true;$('accountPanel').hidden=true;$('login').disabled=true;$('changeAccount').disabled=true;set('loginMessage','Ouverture de la connexion…');
 try{
  if(cloud)await authSDK.login();
  else sessionStorage.setItem('pacte-founder-organizer-key',$('localKey').value.trim());
  authenticating=false;await refresh();
 }catch(error){waitingForLogin=true;set('loginMessage',organizerError(error));$('loginPanel').hidden=false;}
 finally{authenticating=false;$('login').disabled=false;$('changeAccount').disabled=false;}
}
$('login').addEventListener('click',login);
$('changeAccount').addEventListener('click',login);
$('retryInit').addEventListener('click',init);
$('chooseSession').addEventListener('click',async()=>{try{await listSessions();}catch(error){set('notice',organizerError(error));}});
init();setInterval(refresh,2500);
