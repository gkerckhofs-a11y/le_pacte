import {CAMPAIGN_PHASES} from './founders-hotspring.js';
const levels=['Critique','Faible','Stable','Bon','Excellent'];
const colors=['#d74747','#e78b36','#d6b83d','#76b45e','#26905f'];
export function gaugeState(value,thresholds=[2,4,6,8]){const level=thresholds.filter(t=>value>t).length;return {label:levels[level],color:colors[level]};}
const gaugeNumber=new Intl.NumberFormat('fr-BE',{maximumFractionDigits:1});
const stabilityNumber=new Intl.NumberFormat('fr-BE',{minimumFractionDigits:1,maximumFractionDigits:1});
export const formatGaugeNumber=(value,decimal=false)=>(decimal?stabilityNumber:gaugeNumber).format(value);
export const gaugeLevelLabel=level=>levels[level]??'';
const chicagoStabilityStates=['Organisation en déroute','Guerre ouverte','Équilibre fragile','Ordre établi','Syndicat puissant','Empire criminel'];
export function chicagoStabilityState(value){
 return chicagoStabilityStates[[20,40,60,80,95].filter(threshold=>value>=threshold).length];
}
export function chicagoScore(value,before){
 return (Number.isFinite(before)?formatGaugeNumber(before)+' → ':'')+formatGaugeNumber(value)+' / 100';
}
export function renderChicagoGauges(root,s){
 if(!s.succession)return false;
 const el=(tag,cls,content)=>{
  const element=document.createElement(tag);element.className=cls;element.textContent=content;return element;
 };
 const resources=s.skin.labels.resources;
 // Historical deltas describe the last published vote, even after the next dilemma opens.
 const reveal=s.phase==='REVEALED'?s.reveal:null;
 const lastVote=reveal??s.history?.at(-1);
 const votedValues=lastVote?.cityAfter??lastVote?.city;
 const current=s.city;
 if(lastVote&&!reveal)root.append(el('p','chicago-last-vote','Dernier vote · '+lastVote.title));
 if(reveal)root.append(el('h3','chicago-consequences','Conséquences pour la Cosa Nostra'));
 for(const code of Object.keys(resources).filter(key=>key!=='stabilite')){
  const value=current[code]??votedValues?.[code],before=reveal?.cityBefore?.[code];
  const line=el('div','gauge',''),head=el('div','gauge-head','');
  const label=el('span','',resources[code]);
  const numeric=Number.isFinite(value);
  head.append(label,el('strong','',numeric?chicagoScore(value,before!==value&&votedValues?.[code]===value?before:undefined):gaugeLevelLabel(s.cityLevels?.[code])));
  if(lastVote)appendGaugeDelta(head,s,code,lastVote,{hideZero:true});
  line.append(head);
  if(numeric){
   const track=el('div','track',''),bar=el('div','bar','');
   bar.style.width=value+'%';decorateGauge(bar,label,value,s,{compact:true});
   track.setAttribute('aria-hidden','true');track.append(bar);line.append(track);
  }
  if(!numeric && Number.isInteger(s.cityLevels?.[code])){
   const level=s.cityLevels[code],track=el('div','gauge-steps','');
   track.setAttribute('aria-hidden','true');
   track.style.setProperty('--level-color',colors[level]);
   for(let index=0;index<levels.length;index++){
    track.append(el('span',index<=level?'filled':'',''));
   }
   line.append(track);
  }
  root.append(line);
 }
 const value=current.stabilite??s.stabilityScore??votedValues?.stabilite;
 if(Number.isFinite(value)){
  const box=el('section','chicago-stability','');
  const label=resources.stabilite;
  box.setAttribute('aria-label',label);
  const score=el('div','chicago-stability-score','');
  score.append(el('strong','chicago-stability-value',chicagoScore(value,votedValues?.stabilite===value?reveal?.cityBefore?.stabilite:undefined)));
  if(lastVote)appendGaugeDelta(score,s,'stabilite',lastVote,{hideZero:true});
  box.append(el('h3','',label),score,el('span','chicago-stability-state',chicagoStabilityState(value)));
  root.append(box);
 }
 return true;
}
export function decorateGauge(bar,label,value,s,{compact=false}={}){
 const state=gaugeState(value*10/(s.gaugeMaximum??10),s.gaugeThresholds);bar.style.background=state.color;
 if(compact)label.title=state.label;
 else label.textContent+=' · '+state.label;
}
const clocks=new Map();
export function renderPhaseClock(root,s){
 if(!root)return;
 root.hidden=s.experienceVersion!==2||s.manualCouncil||s.campaign?.version>=3;
 if(root.hidden){clocks.delete(root);return;}
 clocks.set(root,{s,started:performance.now()});drawClock(root,clocks.get(root));
}
function drawClock(root,{s,started}){
 const elapsed=performance.now()-started,clock=s.clock;
 const remaining=clock.paused?clock.remainingMs:clock.deadline===null?null:clock.deadline-(s.serverNow??s.updatedAt??Date.now())-elapsed;
 const labels={...CAMPAIGN_PHASES,READY:'Préparation',NEGOTIATION:'Négociations en cours',COUNCIL:'Vote',REVEALED:'Résolution',FINISHED:'Partie terminée'};
 const seconds=remaining===null?null:Math.max(0,Math.ceil(remaining/1000));
 root.textContent=(labels[s.phase]??s.phase)+(clock.paused?' — PAUSE':seconds===null?'':' — '+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'))+(seconds===0?' — TEMPS ÉCOULÉ':'');
 root.classList.toggle('time-up',seconds===0);root.classList.toggle('clock-paused',clock.paused);
}
const ticker=setInterval(()=>{for(const [root,data] of clocks)drawClock(root,data);},250);ticker.unref?.();
export function voteTotals(s){
 const c=s.council,ids=s.families.map(f=>f.id),sum=side=>ids.reduce((n,id)=>n+(c.choices[id]===side?(c.bids[id]??0):0),0);
 return {yes:s.reveal?.yes??sum('pour'),no:s.reveal?.no??sum('contre'),abstentions:ids.filter(id=>['passe_pouvoir','passe_moderateur'].includes(c.choices[id])).length};
}

export function gaugeDelta(s,key,record=s.reveal){
 const before=record?.cityBefore?.[key],after=(record?.cityAfter??record?.city)?.[key];
 if(!Number.isFinite(before)||!Number.isFinite(after))return null;
 const value=Math.round((after-before)*10)/10;
 const format=number=>formatGaugeNumber(number,key==='stabilite'&&s.campaign?.version>=2);
 const description=key==='stabilite'&&s.campaign?.version>=2?'Moyenne calculée, ':'Effet du dilemme : ';
 return {value,text:value>0?'+'+format(value):value<0?'−'+format(Math.abs(value)):format(0),kind:value>0?'positive':value<0?'negative':'neutral',description:description+format(before)+' → '+format(after)+'/'+(s.gaugeMaximum??10)};
}
export function appendGaugeDelta(root,s,key,record=s.reveal,{hideZero=false}={}){
 const delta=gaugeDelta(s,key,record);if(!delta||(hideZero&&delta.value===0))return;
 const badge=document.createElement('span');badge.className='gauge-delta gauge-delta-'+delta.kind;badge.textContent=delta.text;badge.title=delta.description;badge.setAttribute('aria-label',delta.description);root.append(badge);
}

export function renderChicagoChoices(root,s,keyChoice=null){
 root.hidden=!s.chicago||!s.dilemma||Boolean(s.reveal);
 root.replaceChildren();
 if(root.hidden)return;
 for(const side of ['pour','contre']){
  const choice=document.createElement('li');
  choice.textContent=side.toUpperCase()+' · '+s.dilemma.labels[side];
  const option=s.dilemma.publicOptions?.[side];
  if(option){
   const heading=document.createElement('strong');heading.textContent=choice.textContent;choice.replaceChildren(heading);
   for(const line of [option.description,option.trends.map(t=>t.name+' '+t.direction).join(' · '),option.compromise]){
    const paragraph=document.createElement('p');paragraph.textContent=line;choice.append(paragraph);
   }
  }
  if(keyChoice===side.toUpperCase()){
   const hint=document.createElement('strong');hint.className='key-position';hint.textContent='Votre position-clé : '+keyChoice;choice.append(hint);
  }
  root.append(choice);
 }
}
