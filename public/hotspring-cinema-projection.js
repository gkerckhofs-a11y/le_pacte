import {renderPanoramaSvg} from './hotspring-panorama.js';
import {formatGaugeNumber} from './founders-live-ui.js';

const byId=id=>document.getElementById(id);
const gauges={economie:'Économie',ecologie:'Écologie',securite:'Sécurité',bien_etre:'Bien-être',demographie:'Démographie',stabilite:'Stabilité'};
const chapterMoods={
 A:'Hotspring en pleine expansion',
 B:'Une ville prospère sous tension',
 C:'Une communauté qui s’organise',
 D:'Une ville qui grandit dans le désordre'
};
const icons={
 economie:'<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v7c0 3 8 4 12 1V7M3 11c2 2 9 3 12 0m3-2c2 0 3 1 3 2v7c0 2-6 4-10 2"/>',
 ecologie:'<path d="m12 2 6 8h-3l5 7h-6v5h-4v-5H4l5-7H6z"/>',
 securite:'<path d="m12 2 9 4v6c0 5-6 9-9 10-3-1-9-5-9-10V6z"/><path d="m8 12 3 3 5-6"/>',
 bien_etre:'<circle cx="12" cy="8" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3M5 7a2 2 0 0 0 0 4m14-4a2 2 0 0 1 0 4"/>',
 demographie:'<path d="M2 21h20M4 21V10h7v11m0 0V4h9v17M7 13v1m0 3v1m7-11v1m3-1v1m-3 3v1m3-1v1m-3 3v1m3-1v1"/>',
 stabilite:'<path d="M12 3v18m-5 0h10M3 7l9-2 9 2M5 7l-3 8h6zm14 0-3 8h6z"/>'
};
function text(id,value){
 const node=byId(id);node.textContent=value??'';node.hidden=!value;
}
function mountControls(){
 if(byId('townCouncilFinance'))return;
 const finance=document.createElement('div');
 finance.id='townCouncilFinance';
 finance.append(byId('panoramaStability'),byId('influenceReserve'));
 document.querySelector('.projection-results').append(finance);
 const counters=byId('voteForTotal').parentElement.parentElement;
 counters.append(byId('voteAbstentions').parentElement);
 byId('cinemaTools').addEventListener('click',()=>{
  const open=byId('cinemaTools').getAttribute('aria-expanded')!=='true';
  byId('cinemaTools').setAttribute('aria-expanded',String(open));
  document.body.classList.toggle('cinema-tools-open',open);
 });
}

export function prepareTownProjection(s){
 mountControls();
 const phase=s.phase;
 let mode='council';
 if(phase==='CHECKPOINT'||(phase==='SUSPENDED'&&s.campaign.cinema))mode='chapter';
 else if(phase==='EPILOGUE')mode='ending';
 else if(phase==='FINISHED'&&s.finalResults)mode='ranking';
 else if(phase==='CHARTER_SUPPORT'||phase==='SUSPENDED')mode='interlude';
 const immersive=['chapter','ending','ranking'].includes(mode);
 for(const name of ['council','chapter','ending','ranking','interlude'])
  document.body.classList.toggle('hotspring-'+name+'-screen',name===mode);
 if(byId('cityCinema').hidden===immersive){
  document.body.classList.remove('cinema-tools-open');
  byId('cinemaTools').setAttribute('aria-expanded','false');
 }
 byId('cityCinema').hidden=!immersive;
 byId('cinemaTools').hidden=!immersive;
 return mode;
}

let lastMap,shownImage='';
export function drawValleyMap(s){
 const landscape=s.campaign?.landscape;
 if(!landscape||lastMap===landscape)return;
 byId('valleyMap').innerHTML=renderPanoramaSvg(landscape,{overview:true});
 lastMap=landscape;
}
function showArtwork(view,fallback){
 const image=byId('cinemaImage'),notice=byId('cinemaMissing');
 const valid=a=>/^\/assets\/hotspring\/v1\/[\w/-]+\.webp$/.test(a?.url??'');
 if(!valid(view))view=fallback;
 const key=(view?.url??'')+'|'+(fallback?.url??'');
 if(key===shownImage)return;
 shownImage=key;
 function attempt(art,canRetry){
  if(!valid(art)){image.removeAttribute('src');image.hidden=true;notice.hidden=false;return;}
  image.onerror=()=>{
   if(key!==shownImage)return;
   if(canRetry&&valid(fallback)&&fallback.url!==art.url)attempt(fallback,false);
   else{image.hidden=true;notice.hidden=false;}
  };
  image.hidden=false;notice.hidden=true;image.alt=art.alt||art.title;image.src=art.url;
 }
 attempt(view,true);
}

function showGauges(city,changes,maximum){
 const root=byId('cinemaGauges');root.replaceChildren();
 for(const [key,label] of Object.entries(gauges)){
  const value=city[key];
  if(!Number.isFinite(value))continue;
  const item=document.createElement('div');item.dataset.indicator=key;
  const name=document.createElement('strong');
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
  icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
  icon.innerHTML=icons[key];
  name.append(icon,document.createTextNode(label));
  const amount=document.createElement('span');
  amount.textContent=formatGaugeNumber(value,key==='stabilite')+' / '+maximum;
  if(Number.isFinite(changes?.[key])){
   const delta=changes[key],badge=document.createElement('small');
   badge.className='cinema-delta';badge.dataset.sign=delta>0?'plus':delta<0?'minus':'equal';
   badge.textContent=delta===0?'=':(delta>0?'+':'−')+formatGaugeNumber(Math.abs(delta),false);
   badge.setAttribute('aria-label','Variation depuis le bilan précédent : '+(delta>0?'plus ':'')+formatGaugeNumber(delta,false));
   amount.append(badge);
  }
  const track=document.createElement('div'),fill=document.createElement('i');
  track.className='cinema-track';fill.style.width=Math.max(0,Math.min(100,100*value/maximum))+'%';
  track.append(fill);item.append(name,amount,track);root.append(item);
 }
}

export function drawTownCinema(s,mode){
 if(!['chapter','ending','ranking'].includes(mode))return;
 const data=s.campaign.cinema;
 if(!data){showArtwork(null,null);return;}
 const ending=mode!=='chapter';
 showArtwork(data.view,data.fallback);
 let heading='Chapitre '+data.chapter+' terminé';
 if(mode==='ranking')heading='Palmarès des familles';
 else if(ending)heading=data.early&&data.chapter?'Épilogue · chapitre '+data.chapter:'Épilogue de Hotspring';
 text('cinemaChapter',heading);
 text('cinemaTitle',ending?(mode==='ranking'?'Les familles de Hotspring':'Qu’avez-vous fait de Hotspring ?'):data.chapterTitle);
 const mood=data.view?.id!==data.fallback?.id&&chapterMoods[data.profile?.id];
 text('cinemaMood',ending||!mood?data.title:mood);
 text('cinemaSummary',data.summary);
 text('cinemaDecisions',data.decisions?.join(' · '));
 text('cinemaGovernment',[data.governance,data.charter].filter(Boolean).join(' · '));
 showGauges(data.city??s.city,data.changes,s.gaugeMaximum??10);
 if(data.stabilityLabel){
  const stability=byId('cinemaGauges').querySelector('[data-indicator=stabilite]');
  if(stability){const note=document.createElement('small');note.className='cinema-stability-label';note.textContent=data.stabilityLabel;stability.append(note);}
 }
}
