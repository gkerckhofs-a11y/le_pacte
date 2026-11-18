import {renderPanoramaSvg} from './hotspring-panorama.js';

export const CAMPAIGN_PHASES={
 INTRO:'Ouverture du chapitre',PRESENTATION:'Lecture du dilemme',CHECKPOINT:'Bilan du chapitre',
 SUSPENDED:'Séance sauvegardée',CHARTER_SUPPORT:'Qualification des chartes',EPILOGUE:'Épilogue de la ville'
};
const node=(tag,text,className)=>{
 const n=document.createElement(tag);
 if(text)n.textContent=text;
 if(className)n.className=className;
 return n;
};
const familyName=(s,id)=>s.families.find(f=>f.id===id)?.name??id;
const sign=n=>n>0?'+'+n:n<0?'−'+Math.abs(n):'0';
const still=/^\/assets\/hotspring\/v1\/[\w/-]+\.webp$/;
const cue={
 D01:['diagonal-low','diagonal-high'],D02:['water','build'],D03:['build','survey'],D04:['smoke','wood'],
 D05:['build','depart'],D06:['lamps','dusk'],D07:['lamps','depart'],D08:['survey','dense'],
 D09:['river','survey'],D10:['dust','trail'],D11:['lamps','barrier'],D12:['trail','dust'],D13:['survey','barrier'],
 D14A:['snow','dusk'],D14B:['trail','barrier'],D15:['steam','trail'],D16:['dust','wood'],D17:['build','dense'],
 D18:['lamps','dusk'],D19:['dust','trail'],D20:['dense','lamps'],D21:['build','barrier'],D22:['water','rain'],
 D23:['build','lamps'],D24:['smoke','fire'],D25:['dusk','dense'],D26A:['rain','water'],D26B:['dust','dusk'],
 D27:['smoke','dust'],D28:['lamps','barrier'],D29:['lamps','survey'],D30:['lamps','dusk']
};
const constructions=new Set(['well','tower','school','saloon','inn','clinic','mill','station','mine','planned','bank','stockyard','office','jail','drains','hall','trade']);
const panes=new WeakMap();
const cachedImages=new Map();

function image(url){
 if(!still.test(url??''))return null;
 if(cachedImages.has(url))return cachedImages.get(url);
 const img=new Image();
 img.decoding='async';img.src=url;
 cachedImages.set(url,img);
 if(cachedImages.size>10)cachedImages.delete(cachedImages.keys().next().value);
 return img;
}

export function landscapeSummary(landscape){
 const river={claire:'claire',degradee:'dégradée',polluee:'polluée',basse:'basse',crue:'marquée par la crue'}[landscape.river];
 return 'Rivière '+river+' · Végétation '+landscape.vegetation+' · Rue '+landscape.street+' · Population '+landscape.density+' · Ville '+landscape.mood+' · '+landscape.prosperity;
}

export function renderHotspringPanorama(root,s){
 const map=s.campaign.landscape;
 let state=panes.get(root);
 if(!state){root.replaceChildren();root.classList.add('hotspring-panorama');state={};panes.set(root,state);}
 const key=JSON.stringify(map);
 const reveal=s.phase==='REVEALED'?s.reveal:null;
 const ending=s.phase==='EPILOGUE'&&Boolean(map.epilogue);
 const effectKey=reveal?reveal.id+'_'+reveal.winner:s.phase==='INTRO'||ending?s.phase:null;
 if(state.key===key&&state.effectKey===effectKey)return;
 const previous=root.querySelector('.hotspring-map:not(.hotspring-before)');
 const prior=state.map;
 root.innerHTML=renderPanoramaSvg(map,{campMemory:ending});
 state.key=key;state.effectKey=effectKey;state.map=map;
 const current=root.querySelector('.hotspring-map');
 if(s.phase==='INTRO'&&s.campaign.chapter===1)current.classList.add('hotspring-prologue');
 if(ending){
  current.classList.add('hotspring-epilogue');
  current.style.transformOrigin=map.epilogue.origin.map(value=>value+'%').join(' ');
  for(const [i,entry] of (s.campaign.epilogueRecap??[]).entries()){
   const figure=node('figure',null,'hotspring-epilogue-scene');
   const picture=node('img');
   setHotspringImage(picture,entry.visual);
   figure.style.setProperty('--scene-delay',(2.5+1.65*i)+'s');
   figure.append(picture,node('figcaption',entry.title));
   root.append(figure);
  }
 }
 if(!reveal)return;
 const chosen=(cue[reveal.id]??['build','survey'])[reveal.winner==='pour'?0:1];
 current.classList.add('hotspring-after','scene-'+chosen);
 if(previous){
  previous.classList.remove('hotspring-after');
  previous.classList.add('hotspring-before');
  previous.setAttribute('aria-hidden','true');
  root.prepend(previous);
 }
 if(prior){
  const priorIds=new Set(prior.layers.map(l=>l.id));
  const newBuildings=map.layers.filter(l=>l.state==='complete'&&constructions.has(l.kind)&&!priorIds.has(l.id));
  if(newBuildings.length){
   const ids=new Set(newBuildings.map(l=>l.id));
   const construction=document.createElement('div');
   construction.className='hotspring-construction';
   construction.setAttribute('aria-hidden','true');
   construction.innerHTML=renderPanoramaSvg({...map,layers:map.layers.map(l=>ids.has(l.id)?{...l,state:'building'}:l)});
   root.append(construction);
  }
 }
 root.append(node('i',null,'hotspring-effect scene-'+chosen));
 const asset=reveal.visual;
 if(asset?.url){
  const stillImage=image(asset.url);
  if(stillImage){
   const show=()=>{
    if(state.effectKey!==effectKey||root.querySelector('.hotspring-result-still'))return;
    const img=stillImage.cloneNode();
    img.alt=asset.alt;img.className='hotspring-result-still';
    root.append(img);
   };
   if(stillImage.complete&&stillImage.naturalWidth)show();
   else stillImage.addEventListener('load',show,{once:true});
  }
 }
}

export function setHotspringImage(root,visual){
 const url=visual?.url;
 const missing=!still.test(url??'');
 root.hidden=missing;
 if(missing){root.removeAttribute('src');return;}
 image(url);
 root.alt=visual.alt;
 if(root.getAttribute('src')!==url)root.src=url;
}

export function renderTendencies(root,dilemma){
 root.replaceChildren();
 root.hidden=!dilemma?.tendencies;
 if(root.hidden)return;
 for(const side of ['pour','contre']){
  const box=node('section',null,'hotspring-tendency');
  box.append(node('h3',(side==='pour'?'POUR':'CONTRE')+' · '+dilemma.labels[side]));
  for(const line of dilemma.tendencies[side])box.append(node('p',line));
  root.append(box);
 }
}

export function renderHotspringStage(root,s,support){
 root.replaceChildren();
 const {intro,recap,checkpoint,qualification,relation,familyPitches}=s.campaign;
 root.hidden=!intro&&!checkpoint&&!qualification&&!s.narrativeEnding&&!familyPitches&&!recap.length;
 if(familyPitches){
  const section=node('details');section.append(node('summary','Les familles de Hotspring'));
  for(const [i,family] of s.families.entries()){
   section.append(node('h3',family.name),node('p',familyPitches[i].role,'small'),node('p',familyPitches[i].text));
  }
  root.append(section);
 }
 if(intro){
  root.append(node('h2',intro.title));
  const cover=document.createElement('img');setHotspringImage(cover,intro.visual);root.append(cover);
  root.append(node('p',intro.text,'hotspring-text'));
  if(recap.length&&s.campaign.chapter>1){
   root.append(node('h3','Précédemment à Hotspring…'));
   for(const decision of recap.slice(-3))root.append(node('p',decision.title));
  }
 }
 if(!intro&&!checkpoint&&recap.length){
  const earlier=node('details');earlier.append(node('summary','Précédemment à Hotspring…'));
  for(const decision of recap.slice(-3))earlier.append(node('p',decision.title+' '+decision.summary));
  root.append(earlier);
 }
 if(checkpoint){
  root.append(node('h2',checkpoint.title),node('p',checkpoint.text,'hotspring-text'));
  if(checkpoint.interlude)root.append(node('p',checkpoint.interlude));
  if(relation)root.append(node('p',relation));
  for(const event of checkpoint.events)root.append(node('p',event));
  if(Object.keys(checkpoint.changes).length){
   const changes=Object.entries(checkpoint.changes).map(([k,v])=>s.skin.labels.resources[k]+' '+sign(v)).join(' · ');
   root.append(node('p',changes));
  }
  if(checkpoint.decisions.length){
   const list=node('ul');
   for(const decision of checkpoint.decisions)list.append(node('li',decision.title));
   root.append(list);
  }
  if(checkpoint.ranking){
   root.append(node('h3','Classement provisoire'));
   renderCampaignRanking(root,checkpoint.ranking);
  }
  if(s.phase==='CHECKPOINT')root.append(node('p','L’histoire de Hotspring se poursuit…'));
 }
 if(qualification){
  root.append(node('h2','Soutenez une charte'),node('p','Tour '+qualification.round+' · Une voix par famille, sans dépense d’Influence.'));
  if(qualification.qualified.length)root.append(node('p','Déjà qualifiée : '+qualification.qualified.join(', ')));
  const list=node('div',null,'hotspring-charters');
  for(const charter of qualification.candidates){
   const c=node('article',null,'card');
   c.append(node('h3',charter.id+' · '+charter.title),node('p',charter.quote));
   for(const line of charter.tendencies)c.append(node('p',line,'small'));
   const voters=Object.keys(qualification.supports).filter(id=>qualification.supports[id]===charter.id);
   c.append(node('p',voters.length+' soutien(s)'+(voters.length?' · '+voters.map(id=>familyName(s,id)).join(', '):'')));
   if(support){
    const button=node('button','Soutenir cette charte');button.type='button';button.disabled=!s.privateCampaign?.maySupport;
    button.addEventListener('click',()=>support(charter.id));c.append(button);
   }
   list.append(c);
  }
  root.append(list);
 }
 if(s.narrativeEnding){
  root.append(node('h2',s.narrativeEnding.title));
  for(const paragraph of s.narrativeEnding.paragraphs)root.append(node('p',paragraph));
 }
}

export function renderCampaignRanking(root,rows,final=false,{compact=false}={}){
 const list=node('ol',null,'hotspring-ranking');
 for(const r of rows){
  const item=node('li');
  item.value=rows.findIndex(p=>p.total===r.total)+1;
  item.append(node('strong',r.name+' · '+r.total+' / '+r.maximum));
  if(final){
   const goals=node('details');
   goals.append(node('summary',compact?'Objectifs et détail des points':'Objectifs de la famille'));
   const overview=compact?goals:item;
   overview.append(node('p',r.briefing),node('p',campaignScoreText(r),'small'));
   const breakdown=node('ul');
   for(const [i,objective] of r.objectives.entries()){
    const result=r.chapterPoints.find(chapter=>chapter.chapter===i+1);
    const points=result?result.points+'/'+result.maximum:'chapitre en réserve';
    breakdown.append(node('li',objective+' '+points));
   }
   goals.append(breakdown);item.append(goals);
  }
  list.append(item);
 }
 root.append(list);
}

export function campaignScoreText(r){
 return [...r.chapterPoints.map(c=>'Chap. '+c.chapter+' '+c.points+'/2'),'Trajectoire '+r.trajectory+'/2',
  ...(r.maximum===15?['Gouvernance '+r.governance+'/1','Charte '+r.charter+'/2']:[])].join(' · ');
}

export function hotspringWinners(s){
 const names=s.finalResults.winners.map(id=>familyName(s,id));
 return (names.length===1?'Famille la plus influente — ':'Co-victoire — ')+names.join(', ');
}

export function renderCampaignAdmin(root,s,command,newVariant){
 root.hidden=!s.campaignAdmin;
 if(root.hidden){root.replaceChildren();return;}
 const open=[...root.querySelectorAll('details')].map(d=>d.open);
 const scene=root.querySelector('.hotspring-panorama');
 root.replaceChildren();
 const a=s.campaignAdmin;
 root.append(node('h2','Campagne · Chapitre '+s.campaign.chapter));
 const action=(label,kind)=>{
  const b=node('button',label,'secondary');b.type='button';b.addEventListener('click',()=>command(kind));return b;
 };
 const buttons=node('div',null,'row');
 if(!['READY','SUSPENDED','EPILOGUE','FINISHED'].includes(s.phase))buttons.append(action('Terminer la séance','endSitting'));
 if(s.phase==='SUSPENDED')buttons.append(action('Reprendre la séance','resumeSitting'));
 if(a.mayResumeCrises&&!s.clock.paused)buttons.append(action('Reprendre les crises en réserve','resumeCrises'));
 if(s.phase==='EPILOGUE'&&!s.clock.paused)buttons.append(action('Révéler les objectifs et le classement','showResults'));
 root.append(buttons);
 if(s.phase==='FINISHED'){
  const exported=node('button','Exporter le résultat');exported.type='button';
  exported.addEventListener('click',()=>{
   const file=new Blob([JSON.stringify({story:s.story,code:s.code,view:s.campaign.archive,city:s.city,
    landscape:s.campaign.landscape,decisions:s.history,epilogue:s.narrativeEnding,scores:s.finalResults},null,2)],{type:'application/json'});
   const url=URL.createObjectURL(file);const link=node('a');link.href=url;link.download='hotspring-'+s.code+'.json';
   link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  root.append(exported);
  if(a.mayCreateVariant){
   const clone=node('button','Créer une variante au dernier conseil','secondary');
   clone.type='button';clone.addEventListener('click',newVariant);root.append(clone);
  }
 }
 root.append(node('p','Confiance '+a.trust+' · Autonomie '+a.autonomy+' · Crises cette séance '+a.crisesThisSitting));
 const map=scene??node('div');renderHotspringPanorama(map,s);root.append(map);
 const detail=node('details');detail.open=Boolean(open[0]);
 detail.append(node('summary','Embranchements et sauvegardes'));
 for(const entry of [...a.progression,...a.crises]){
  detail.append(node('p',entry.id+' · '+(entry.played?'traitée':entry.contained?'contenue':entry.available?'disponible':'indisponible')+
   (entry.risk===undefined?'':' · risque '+entry.risk)+' · '+entry.reason));
 }
 for(const checkpoint of a.checkpoints)detail.append(node('p',checkpoint.name));
 detail.append(node('p',a.markers.join(', ')));
 if(a.crisisMode==='extended'&&s.phase==='REVEALED'&&/^D2[3-8]/.test(s.reveal?.id??'')){
  const opts=a.crises.filter(c=>c.available);
  if(opts.length){
   const label=node('label','Choisir une crise');const select=node('select');
   for(const c of opts){const o=node('option',c.id+' · '+c.reason);o.value=c.id;select.append(o);}
   const b=node('button','Présenter cette crise','secondary');b.type='button';
   b.addEventListener('click',()=>command('next',{dilemmaId:select.value}));label.append(select);detail.append(label,b);
  }
 }
 root.append(detail);
 const privateView=node('details');privateView.open=Boolean(open[1]);
 privateView.append(node('summary','Objectifs confidentiels et scores'));
 for(const r of a.scores.rows){
  privateView.append(node('h3',r.name+' · '+r.total+'/'+r.maximum),node('p',s.privateFamilies[r.family].briefing),
   node('p',campaignScoreText(r),'small'));
 }
 root.append(privateView);
}
