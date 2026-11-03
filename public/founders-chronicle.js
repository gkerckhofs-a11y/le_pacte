// The latest public resolution survives a new council and a page reload.
// This module consumes revealed history only; it never predicts an outcome.
export function latestChronicle(view){
 const entries=view.history??[];
 const h=entries.at(-1);
 if(!h)return null;
 const after=h.cityAfter??h.city;
 const changes=(h.effects??[]).map(e=>{
  const before=h.cityBefore?.[e.indicator],value=after?.[e.indicator];
  const known=Number.isFinite(before)&&Number.isFinite(value);
  return {indicator:e.indicator,before:known?before:null,after:Number.isFinite(value)?value:null,
   delta:known?value-before:null,operation:e.operation,planned:e.operation==='delta'?e.value:null};
 });
 return {number:entries.length,id:h.id,title:h.chronicle?.title??h.title,dilemmaTitle:h.title,
  summary:h.chronicle?.summary??h.narration,narration:h.narration,
  winner:h.winner,decisionLabel:h.decisionLabel??h.winner,yes:h.yes,no:h.no,
  image:h.image??(view.dilemma?.id===h.id?view.dilemma.image:null),changes};
}
export function chronicleChangeText(change,label){
 const {before,after,delta,operation,planned}=change;
 if(delta===null)return label+' : '+(after===null?'valeur non archivée':after+'/10')+' · évolution non archivée';
 let text=label+' : '+before+' → '+after+'/10 ('+(delta>0?'+':'')+delta+')';
 if(operation==='toward_center')text+=' · retour vers le centre';
 if(operation==='away_from_center')text+=' · éloignement du centre';
 if(operation==='delta'&&delta!==planned)text+=' · effet prévu '+(planned>0?'+':'')+planned+', limité par la borne '+(planned>0?'10':'0');
 if(operation==='toward_center'&&delta===0)text+=' · déjà au centre';
 if(operation==='away_from_center'&&delta===0)text+=' · borne atteinte';
 return text;
}
export function renderChronicle(root,view){
 const latest=latestChronicle(view);
 if(root.chronicleLatestId!==latest?.id){root.chronicleLatestId=latest?.id;root.chronicleSelection=null;root.chronicleExpanded=null;}
 const selected=view.history?.findIndex(h=>h.id===root.chronicleSelection)??-1;
 const chapter=selected<0?latest:latestChronicle({...view,history:view.history.slice(0,selected+1)});
 root.hidden=!chapter;root.replaceChildren();
 if(!chapter)return;
 const expanded=root.chronicleExpanded??(view.phase==='REVEALED'||view.phase==='FINISHED');
 root.classList.toggle('chronicle-compact',!expanded);
 const el=(tag,className,text)=>{
  const node=root.ownerDocument.createElement(tag);node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
 };
 const image=chapter.image;
 if(typeof image?.url==='string'&&/^https:\/\/\S+$/.test(image.url)){
  const img=el('img','chronicle-image');img.src=image.url;
  img.alt=image.alt||'Illustration du dilemme résolu : '+chapter.title;
  // Reuse the dilemma artwork until an outcome-specific illustration is authored.
  img.addEventListener('error',()=>{img.hidden=true;},{once:true});root.append(img);
 }
 const body=el('div','chronicle-body');
 body.append(el('div','eyeline','Chronique de la ville · Décision '+chapter.number),
  el('h2','',chapter.title),
  el('p','chronicle-decision',(chapter.winner==='pour'?'Adopté : ':'Alternative retenue : ')+chapter.decisionLabel),
  el('p','small muted','Vote révélé · '+chapter.yes+' Influence POUR / '+chapter.no+' CONTRE'),
  el('p','chronicle-narration',expanded?chapter.narration:chapter.summary));
 const list=el('ul','chronicle-changes');
 for(const c of chapter.changes)list.append(el('li','',chronicleChangeText(c,view.skin.labels.resources[c.indicator]??c.indicator)));
 if(!chapter.changes.length)list.append(el('li','','Aucune variation de jauge pour cette décision.'));
 body.append(list);
 if(expanded)body.append(el('p','small muted','Les autres indicateurs restent inchangés.'));
 const toggle=el('button','btn secondary',expanded?'Réduire la chronique':'Lire le chapitre complet');
 toggle.type='button';toggle.setAttribute('aria-expanded',String(expanded));
 toggle.addEventListener('click',()=>{root.chronicleExpanded=!expanded;renderChronicle(root,view);});body.append(toggle);
 const nav=el('nav','chronicle-history');nav.setAttribute('aria-label','Historique des chroniques révélées');
 for(const [i,h] of view.history.entries()){
  const button=el('button','btn secondary','Chapitre '+(i+1));button.type='button';
  button.title=h.chronicle?.title??h.title;button.setAttribute('aria-pressed',String(h.id===chapter.id));
  button.addEventListener('click',()=>{root.chronicleSelection=h.id;root.chronicleExpanded=true;renderChronicle(root,view);});nav.append(button);
 }
 body.append(nav);
 root.append(body);
}
