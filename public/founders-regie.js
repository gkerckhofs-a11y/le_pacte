import {isHotspring,isCurrentHotspring,narrativeRegie} from './founders-univers.js';
import {rememberAccess} from './founders-workspace.js';
import {CAMPAIGN_PHASES,renderHotspringStage,renderTendencies,renderCampaignAdmin,renderCampaignActions,hotspringWinners,renderCampaignRanking} from './founders-hotspring.js';
import {decorateGauge,formatGaugeNumber,renderPhaseClock,voteTotals,appendGaugeDelta} from './founders-live-ui.js';
import {mountPrintKit} from './founders-print.js';
import {renderCouncilMonitor} from './founders-council-monitor.js';
import {councilGuidance,startCouncil,organizerError,validNarrativeSession} from './founders-regie-flow.js';
import {applySkin,applyTeamTheme} from './founders-skin-theme.js';
import {teamCaption,teamLabel,colorize} from './founders-identity.js';
"use strict";
const $=id=>document.getElementById(id),p=new URLSearchParams(location.search);
const hotspringHome=location.pathname==='/hotspring'||(location.pathname==='/regie'&&!p.has('session'));
const sid=p.get('session');let authSDK=null,cloud=false,token='',current=null,busy=false,initialized=false,authenticating=false,waitingForLogin=false;
const labels={...CAMPAIGN_PHASES,NEGOTIATION:'Négociations',READY:'Prêt',COUNCIL:'Conseil en cours',AWAITING_REVEAL:'En attente de la révélation',REVEALED:'Résultat annoncé',FINISHED:'Partie terminée'};
const gaugeIds=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const set=(id,v)=>$(id).textContent=String(v??'');
const secure=()=>validNarrativeSession(sid);
function labelWorld(){
 document.title='Les Colons de Hotspring · Régie';
 set('regieTitle','Régie · Les Colons de Hotspring');
}
if(hotspringHome)labelWorld();
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
   set('loginHelp','Connectez-vous avec le compte Google qui a préparé la partie ou celui que l’organisateur a invité.');
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
 const sessions=hotspringHome?data.sessions.filter(isCurrentHotspring):data.sessions;
 $('worldLinks').hidden=!hotspringHome;
 set('sessionListTitle',hotspringHome?'Mes parties Hotspring':'Mes parties');
 for(const session of sessions){
  if(!validNarrativeSession(session.id))continue;
  const row=document.createElement('div');row.className='card row between';
  const title=document.createElement('strong');title.textContent=session.code+' · '+session.title+' · '+(labels[session.phase]||session.phase);
  const link=document.createElement('a');link.textContent='Ouvrir la régie →';link.href=narrativeRegie(session.id,isHotspring(session));row.append(title,link);root.append(row);
 }
 $('archiveSessions').hidden=hotspringHome||!root.children.length;
 if(!root.children.length)root.textContent='Aucune partie en cours ou à reprendre. Créez une partie pour commencer.';
}
function connected(){
 const invited=current?.sessionRole==='facilitator';
 $('loginPanel').hidden=true;$('accountPanel').hidden=false;$('chooseSession').hidden=invited;$('changeAccount').hidden=!cloud;
 $('createAnotherSession').hidden=invited;
 set('signedInAs',cloud?(invited?'Animateur invité · ':'Connecté · ')+account():'Régie locale connectée');
}
function connectionFailure(error){
 set('monitorConnection','○ Actualisation interrompue : les informations affichées peuvent être anciennes.');
 set('loginMessage',organizerError(error));$('loginPanel').hidden=false;
 if(!current)set('phase','Connexion requise');
 if(error.status===403||/organisateur Google|Clé régie requise/.test(error.message)){
  waitingForLogin=true;current=null;
  set('phase','Connexion requise');$('phaseClock').hidden=true;
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
  if(current?.revision!==s.revision||current?.facilitatorEmail!==s.facilitatorEmail||current?.sessionRole!==s.sessionRole)render(s);else renderPhaseClock($('phaseClock'),s);
  connected();$('regieContent').hidden=false;set('monitorConnection','● Synchronisé · actualisation automatique');
 }catch(error){connectionFailure(error);}
}
function gauge(s){
 const root=$('gauges');root.replaceChildren();
 for(const k of Object.keys(s.city)){
  const el=document.createElement('div');el.className='gauge';
  const row=document.createElement('div');row.className='gauge-head';
  const label=document.createElement('span');label.textContent=s.skin.labels.resources[k]||k;
  const n=document.createElement('strong');n.textContent=formatGaugeNumber(s.city[k],k==='stabilite'&&s.campaign?.version>=2)+'/'+(s.gaugeMaximum??10);appendGaugeDelta(n,s,k);row.append(label,n);
  const track=document.createElement('div');track.className='track';
  const bar=document.createElement('div');bar.className='bar';bar.style.width=s.city[k]*100/(s.gaugeMaximum??10)+'%';decorateGauge(bar,label,s.city[k],s);track.append(bar);el.append(row,track);root.append(el);
 }
 renderCityAudit(s);
}
function renderCityAudit(s){
 const expanded=s.campaign?.version>=2,formula=$('stabilityFormula'),correction=$('cityCorrection'),audit=$('cityEffectAudit');
 formula.hidden=correction.hidden=!expanded;
 audit.replaceChildren();audit.hidden=true;
 if(!expanded)return;
 const indicators=Object.keys(s.city).filter(key=>key!=='stabilite');
 formula.textContent='Stabilité en lecture seule · ('+indicators.map(key=>s.city[key]).join(' + ')+') ÷ 5 = '+formatGaugeNumber(s.city.stabilite,true);
 const select=$('correctIndicator');
 if(!select.options.length)for(const key of indicators){
  const option=document.createElement('option');option.value=key;option.textContent=s.skin.labels.resources[key];select.append(option);
 }
 for(const field of $('cityCorrectionForm').querySelectorAll('select,input,button'))field.disabled=!s.clock.paused||['FINISHED','EPILOGUE','SUSPENDED'].includes(s.phase);
 const records=s.reveal?[{...s.reveal,side:s.reveal.winner}]:s.effectsPreview;
 if(!records?.length)return;
 audit.hidden=false;
 const heading=document.createElement('h3');heading.textContent=s.reveal?'Effets appliqués':'Effets prévus avant le vote';audit.append(heading);
 const sign=n=>n>0?'+'+n:n<0?'−'+Math.abs(n):'0';
 for(const record of records){
  const title=document.createElement('strong');title.textContent=record.side==='pour'?'POUR':'CONTRE';audit.append(title);
  const list=document.createElement('ul');
  for(const effect of record.effects){
   const key=effect.indicator,before=record.cityBefore[key],after=record.cityAfter[key],row=document.createElement('li');
   row.textContent=s.skin.labels.resources[key]+' '+sign(effect.value)+' prévu · '+before+' → '+after+' ('+sign(after-before)+(s.reveal?' appliqué':' après plafonnement')+')';
   list.append(row);
  }
  const stability=document.createElement('li');
  stability.textContent='Stabilité calculée · '+formatGaugeNumber(record.cityBefore.stabilite,true)+' → '+formatGaugeNumber(record.cityAfter.stabilite,true);
  list.append(stability);audit.append(list);
 }
}
function renderFacilitator(s){
 const canInvite=cloud&&s.sessionRole==='organizer';
 $('facilitatorPanel').hidden=!canInvite;
 if(!canInvite)return;
 if(!current||current.facilitatorEmail!==s.facilitatorEmail)$('facilitatorEmail').value=s.facilitatorEmail??'';
 $('revokeFacilitator').hidden=$('facilitatorShare').hidden=!s.facilitatorEmail;
 $('facilitatorLink').value=s.facilitatorEmail?new URL(narrativeRegie(s.id,Boolean(s.campaign)),location.origin).href:'';
}
function render(s){
 applySkin(document.body,s.skin);
 if(s.campaign)labelWorld();
 if(s.chicago){
  document.title='Cosa Nostra · Régie';
  set('regieTitle','Régie · Cosa Nostra');
  $('createAnotherSession').href='/cosa-nostra';
 }
 renderFacilitator(s);
 current=s;
 document.body.classList.toggle('campaign-hotspring',Boolean(s.campaign));
 renderCampaignActions($('campaignActions'),s,command);
 renderCampaignAdmin($('hotspringAdmin'),s,s.sessionRole==='facilitator'?null:newVariant);
 if(s.campaign){renderHotspringStage($('hotspringStage'),s);renderTendencies($('hotspringTendencies'),s.phase==='REVEALED'?null:s.dilemma);}
 printKit.sync(s);renderPhaseClock($('phaseClock'),s);renderV2Controls(s);
 renderCouncilMonitor($('councilMonitor'),s);
 const guidance=councilGuidance(s);step(guidance.step);set('stageTitle',guidance.title);set('stageHint',guidance.hint);
 $('preparation').hidden=s.phase!=='READY';
 const named=s.families.filter(f=>f.name&&f.name!=='Nom à choisir').length;set('teamReadyCount',named+'/'+s.families.length+' équipes ont un nom');
 $('preparePublicLink').href='/founders-city.html?session='+s.id;
 set('phase',labels[s.phase]||s.phase);set('sessionCode',s.code+' · '+s.selection.scenarioVersion+' · skin '+s.selection.skinId);
 set('sessionTitle',s.title);set('revision','Révision '+s.revision);
 set('dilemmaInfo',s.dilemma?'Délibération : '+s.dilemma.title+(s.dilemma.vote_question?' — '+s.dilemma.vote_question:''):'');
 set('tiePriority','Tirage de départage final : '+s.finalTieOrder.map(id=>teamLabel(s,id)).join(' → '));
 $('start').hidden=s.phase!=='READY';
 $('reveal').hidden=s.phase!=='AWAITING_REVEAL';
 $('next').hidden=s.phase!=='REVEALED';
 $('next').textContent=(s.progression?s.progression.terminal:s.reveal?.nextId===null)?'Terminer la partie':'Dilemme suivant';
 if(s.chicago&&s.reveal?.nextId===null)$('next').textContent='Clôturer la répétition';
 if(s.campaign){
  $('next').hidden=!['INTRO','PRESENTATION','REVEALED','CHECKPOINT'].includes(s.phase);
  $('next').textContent=({INTRO:'Présenter le dilemme',PRESENTATION:'Ouvrir la négociation',REVEALED:s.reveal?.id==='D30'?'Lire l’épilogue':'Poursuivre',CHECKPOINT:s.campaign.chapter===6?'Qualifier les chartes':'Reprendre — chapitre suivant'})[s.phase]??'Poursuivre';
 }
 $('tiePriority').closest('details').hidden=Boolean(s.campaign||s.chicago);
 renderActionAvailability(s);
 $('reservePanel').hidden=!s.progression||s.progression.terminal;
 const choice=$('nextDilemma'),previousChoice=choice.value;choice.replaceChildren();
 const auto=document.createElement('option');auto.value='';auto.textContent='Laisser le moteur choisir';choice.append(auto);
 for(const c of s.progression?.candidates??[]){
  const option=document.createElement('option');option.value=c.id;option.textContent=c.title+' · '+({required:'obligatoire',optional:'optionnel',finale:'finale'}[c.category]??c.category);choice.append(option);
 }
 choice.value=[...choice.options].some(o=>o.value===previousChoice)?previousChoice:'';
 set('reserveStatus',s.progression?s.progression.blocked??s.progression.resolved+' Conseils résolus · objectif '+s.progression.min+' à '+s.progression.max+', finale comprise.':'');
 $('lastReveal').hidden=!s.reveal;
 if(s.reveal){set('outcomeHeading',s.reveal.winner==='pour'?'POUR l’emporte':'CONTRE l’emporte');set('outcomeDetail',s.reveal.narration);}
 $('publicLink').href='/founders-city.html?session='+s.id;
 gauge(s);
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
 if(s.campaign&&s.finalResults){
  set('finalWinner',hotspringWinners(s));
  set('finalScoreRule',s.finalResults.rows[0].maximum+' points possibles par famille.');
  const root=$('ranking');root.replaceChildren();
  renderCampaignRanking(root,s.finalResults.rows,true);
 }else if(s.finalResults){
  set('finalScoreRule','Barème de test V2.6 · une seule famille déclarée vainqueure.');
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
 for(const item of [...s.history].reverse()){
  const el=document.createElement('div');el.className='card';
  const title=document.createElement('strong');title.textContent=item.title+' · '+(s.chicago?item.decisionLabel:item.winner==='pour'?'Adopté':'Refusé');
  const desc=document.createElement('p');desc.className='small';desc.textContent=item.narration;
  el.append(title,desc);history.append(el);
 }
}
async function command(kind,data={}){
 if(!current||busy)return;
 busy=true;set('actionMessage','Enregistrement…');renderActionAvailability(current);
 try{
  const s=await api('/commands','POST',{kind,data,expectedRevision:current.revision});
  render(s);set('actionMessage',kind==='reveal'?'Décision révélée sur la projection.':s.phase==='FINISHED'?(s.chicago?'Répétition terminée.':'Partie terminée : classement affiché.'):s.campaign?(labels[s.phase]??s.phase)+'.':'Le prochain dilemme est ouvert.');
 }catch(e){set('actionMessage',e.message);try{render(await api(''));}catch{}}
 finally{busy=false;renderActionAvailability(current);}
}
function renderActionAvailability(s){
 for(const button of $('actions').querySelectorAll('button')){
  const advance=['start','next','reveal','beginVote'].includes(button.id);
  button.disabled=busy||Boolean(advance&&s?.clock?.paused)||Boolean(button.id==='next'&&s?.progression?.blocked);
 }
}
async function newVariant(){
 if(busy)return;
 busy=true;
 try{
  const result=await api('/variant','POST',{});
  rememberAccess(result);
  location.assign(narrativeRegie(result.id,true));
 }catch(e){set('actionMessage',e.message);}
 finally{busy=false;}
}
async function rotate(family){
 if(busy)return;busy=true;set('notice','Renouvellement du jeton…');
 try{
  const result=await api('/access/'+family,'POST',{});
  const url=new URL('/founders-family.html?session='+sid+'&family='+family,location.origin);
  url.hash='token='+encodeURIComponent(result.token);
  printKit.remember(family,result.token);
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
  set('actionMessage',result.started?(result.view.chicago?'Répétition lancée. Le premier Conseil est ouvert aux négociations.':'Partie lancée. Le premier dilemme est affiché ; le Maire peut voter sur son écran d’équipe.'):'La partie a déjà démarré. La régie affiche son état actuel.');
 }catch(error){set('actionMessage',organizerError(error));try{render(await api(''));}catch{}}
 finally{busy=false;renderActionAvailability(current);}
});
$('reveal').addEventListener('click',()=>command('reveal'));
$('next').addEventListener('click',()=>command('next',current?.progression&&$('nextDilemma').value?{dilemmaId:$('nextDilemma').value}:{}));
$('copyAccess').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText($('newAccessLink').value);set('notice','Lien copié.');}
 catch{set('notice','Sélectionnez et copiez le lien dans le champ.');}
});
async function saveFacilitator(email){
 if(busy||current?.sessionRole!=='organizer')return;
 busy=true;$('saveFacilitator').disabled=$('revokeFacilitator').disabled=true;
 try{
  const {facilitatorEmail}=await api('/facilitator','PUT',{email});
  render(await api(''));
  set('facilitatorMessage',facilitatorEmail?'Accès accordé à '+facilitatorEmail+'. Tu peux lui transmettre le lien.':'L’accès de l’animateur a été retiré.');
 }catch(error){set('facilitatorMessage',organizerError(error));}
 finally{busy=false;$('saveFacilitator').disabled=$('revokeFacilitator').disabled=false;}
}
$('facilitatorForm').addEventListener('submit',event=>{
 event.preventDefault();saveFacilitator($('facilitatorEmail').value);
});
$('revokeFacilitator').addEventListener('click',()=>saveFacilitator(null));
$('copyFacilitatorLink').addEventListener('click',async()=>{
 const input=$('facilitatorLink');
 try{await navigator.clipboard.writeText(input.value);set('facilitatorMessage','Lien de la régie copié.');}
 catch{input.focus();input.select();set('facilitatorMessage','Copiez le lien sélectionné.');}
});
async function login(){
 if(!initialized||authenticating)return;
 authenticating=true;waitingForLogin=false;current=null;set('facilitatorMessage','');$('regieContent').hidden=true;$('sessionPicker').hidden=true;$('accountPanel').hidden=true;$('login').disabled=true;$('changeAccount').disabled=true;set('loginMessage','Ouverture de la connexion…');
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
$('chooseSession').addEventListener('click',()=>location.assign(current?.chicago?'/cosa-nostra':current?.campaign||hotspringHome?'/hotspring':'/founders-regie.html'));
$('archiveSessions').addEventListener('click',()=>$('archiveDialog').showModal());
$('cancelArchive').addEventListener('click',()=>$('archiveDialog').close());
$('confirmArchive').addEventListener('click',async()=>{
 const button=$('confirmArchive');
 button.disabled=true;
 $('archiveDialog').close();
 $('archiveSessions').disabled=true;
 set('archiveMessage','Archivage des parties en cours…');
 try{
  const bearer=await organizerToken();
  const r=await fetch('/api/founders/sessions/archive',{method:'POST',headers:{Authorization:'Bearer '+bearer}});
  const data=await r.json();
  if(!r.ok)throw new Error(data.error||'Archivage indisponible.');
  await listSessions();
  const n=data.archived;
  set('archiveMessage',n===0?'Aucune partie à archiver.':n===1?'Une partie archivée.':n+' parties archivées.');
 }catch(error){set('archiveMessage',organizerError(error));}
 finally{button.disabled=false;$('archiveSessions').disabled=false;}
});
init();setInterval(refresh,2500);

const printKit=mountPrintKit({session:sid,view:()=>current,request:async(path,body)=>{
 const bearer=await organizerToken();const r=await fetch(path,{method:'POST',headers:{Authorization:'Bearer '+bearer,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data=await r.json();if(!r.ok){const error=new Error(data.error||'QR indisponible');error.accessInvalid=r.status===403&&/expiré|révoqué|famille invalide/.test(error.message);throw error;}return data;
}});

function renderV2Controls(s){
 const manual=s.campaign?.version>=3;
 $('v2Controls').hidden=s.experienceVersion!==2;
 $('beginVote').hidden=s.phase!=='NEGOTIATION';
 set('beginVote',manual?'Ouvrir le vote':'Ouvrir le vote maintenant');
 set('v2ControlsTitle',manual?'Réglages':'Chronos et réglages');
 $('timingForm').hidden=manual||Boolean(s.chicago);
 const ended=['EPILOGUE','FINISHED'].includes(s.phase),suspended=s.phase==='SUSPENDED',v2=s.experienceVersion===2;
 for(const id of ['addTime','removeTime'])$(id).hidden=!v2||manual||s.clock?.remainingMs==null||ended||suspended;
 $('pauseGame').hidden=!v2||ended||suspended||Boolean(s.clock?.paused);
 $('resumeGame').hidden=!v2||suspended||!s.clock?.paused;
 $('finishGame').hidden=!v2||ended||s.chicago;
 $('finishDescription').textContent=s.campaign&&s.phase==='CHECKPOINT'&&s.campaign.chapter>=5?
  'La régie ouvrira la prochaine étape du final. Les familles décideront du gouvernement et de la charte.':
  s.campaign?'La régie ouvrira l’épilogue et affichera les scores issus des décisions déjà prises.':
  'Cette action clôture la partie et affiche le résultat. Les mises d’un vote en cours sont rendues.';
 $('finishGame').textContent=s.campaign?'Terminer l’histoire':'Terminer la partie';
 $('presentationTiming').hidden=!s.campaign;$('presentationSeconds').disabled=!s.campaign;
 if(!document.activeElement?.closest('#timingForm'))$('presentationSeconds').value=s.campaignAdmin?.presentationSeconds??'';
 const fields={negotiationSeconds:s.timing?.negotiationSeconds,voteSeconds:s.timing?.voteSeconds,resolutionSeconds:s.timing?.resolutionSeconds};
 if(!document.activeElement?.closest('#timingForm')){for(const [id,value] of Object.entries(fields))$(id).value=value??'';$('autoAdvance').checked=s.timing?.autoAdvance??false;$('gaugeThresholds').value=(s.gaugeThresholds??[2,4,6,8]).join(',');}
 if(!document.activeElement?.closest('#correctionForm')){
  const selected=$('correctFamily').value;$('correctFamily').replaceChildren();for(const f of s.families){const o=document.createElement('option');o.value=f.id;o.textContent=teamCaption(f);$('correctFamily').append(o);}$('correctFamily').value=selected||s.families[0].id;
 }
 for(const field of $('correctionForm').querySelectorAll('input,select,button'))field.disabled=ended||suspended||!s.clock?.paused;
 const pending=Object.values(s.offers).filter(o=>o.status==='pending');
 set('pendingOffers',pending.length?'Offres en attente : '+pending.map(o=>teamLabel(s,o.from)+' → '+teamLabel(s,o.to)+' : '+o.amount+' '+s.skin.labels.currency).join(' ; '):'Aucune proposition financière en attente.');
}
$('beginVote').addEventListener('click',()=>command('beginVote'));
$('pauseGame').addEventListener('click',()=>command('pause'));
$('resumeGame').addEventListener('click',()=>command('resume'));
$('addTime').addEventListener('click',()=>command('adjustTime',{seconds:60}));
$('removeTime').addEventListener('click',()=>command('adjustTime',{seconds:-60}));
$('timingForm').addEventListener('submit',event=>{event.preventDefault();command('configureTiming',{timing:{negotiationSeconds:Number($('negotiationSeconds').value),voteSeconds:Number($('voteSeconds').value),resolutionSeconds:Number($('resolutionSeconds').value),autoAdvance:$('autoAdvance').checked},gaugeThresholds:$('gaugeThresholds').value.split(',').map(Number),...(current?.campaign?{presentationSeconds:Number($('presentationSeconds').value)}:{})});});
$('correctionForm').addEventListener('submit',event=>{event.preventDefault();command('correctResource',{family:$('correctFamily').value,resource:$('correctResource').value,value:Number($('correctValue').value)});});
$('cityCorrectionForm').addEventListener('submit',event=>{event.preventDefault();command('correctCity',{indicator:$('correctIndicator').value,value:Number($('correctIndicatorValue').value)});});
$('finishGame').addEventListener('click',()=>$('finishDialog').showModal());
$('cancelFinish').addEventListener('click',()=>$('finishDialog').close());
$('confirmFinish').addEventListener('click',async()=>{await command('finish',{confirm:true});if(current&&['EPILOGUE','FINISHED','INTRO','CHARTER_SUPPORT'].includes(current.phase))$('finishDialog').close();});
