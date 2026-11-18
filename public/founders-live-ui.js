import {CAMPAIGN_PHASES} from './founders-hotspring.js';
const levels=['Critique','Faible','Stable','Bon','Excellent'];
const colors=['#d74747','#e78b36','#d6b83d','#76b45e','#26905f'];
export function gaugeState(value,thresholds=[2,4,6,8]){const level=thresholds.filter(t=>value>t).length;return {label:levels[level],color:colors[level]};}
const gaugeNumber=new Intl.NumberFormat('fr-BE',{maximumFractionDigits:1});
const stabilityNumber=new Intl.NumberFormat('fr-BE',{minimumFractionDigits:1,maximumFractionDigits:1});
export const formatGaugeNumber=(value,decimal=false)=>(decimal?stabilityNumber:gaugeNumber).format(value);
export function decorateGauge(bar,label,value,s,{compact=false}={}){
 const state=gaugeState(value,s.gaugeThresholds);bar.style.background=state.color;
 if(compact)label.title=state.label;
 else label.textContent+=' · '+state.label;
}
const clocks=new Map();
export function renderPhaseClock(root,s){
 if(!root){return;}root.hidden=s.experienceVersion!==2;
 if(s.experienceVersion!==2)return;
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

export function gaugeDelta(s,key){
 const before=s.reveal?.cityBefore?.[key],after=s.reveal?.cityAfter?.[key];
 if(!Number.isFinite(before)||!Number.isFinite(after))return null;
 const value=Math.round((after-before)*10)/10;
 const format=number=>formatGaugeNumber(number,key==='stabilite'&&s.campaign?.version===2);
 const description=key==='stabilite'&&s.campaign?.version===2?'Moyenne calculée, ':'Effet du dilemme : ';
 return {value,text:value>0?'+'+format(value):value<0?'−'+format(Math.abs(value)):format(0),kind:value>0?'positive':value<0?'negative':'neutral',description:description+format(before)+' → '+format(after)+'/10'};
}
export function appendGaugeDelta(root,s,key){
 const delta=gaugeDelta(s,key);if(!delta)return;
 const badge=document.createElement('span');badge.className='gauge-delta gauge-delta-'+delta.kind;badge.textContent=delta.text;badge.title=delta.description;badge.setAttribute('aria-label',delta.description);root.append(badge);
}
