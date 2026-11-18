import {gaugeState} from './founders-live-ui.js';
import {mountPaintedWestern,updatePaintedWestern} from './founders-painted-western.js';
import {UNIVERSE_DETAILS,universeSceneMarkup} from './founders-skin-scenes.js';
const METRICS=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const DETAILS={
 economie:['Les étals sont fermés ; les échanges se font rares.','Quelques marchands approvisionnent la rue principale.','Le marché se remplit de marchandises et de chariots.'],
 securite:['Le bureau du shérif est délaissé ; une potence témoigne d’une justice expéditive.','Le bureau du shérif est entretenu et une patrouille veille.','Le bureau du shérif est entretenu et la patrouille se renforce.'],
 satisfaction:['Des habitants se rassemblent avec des pancartes pour être entendus.','Les habitants se croisent et discutent dans la rue.','La terrasse et la place accueillent une fête des habitants.'],
 bien_etre:['Le dispensaire est peu équipé et le point d’eau attend des réparations.','Le dispensaire reçoit les habitants ; le puits est en service.','Le dispensaire est agrandi ; le puits et un jardin améliorent le quotidien.'],
 developpement:['La parcelle de la gare attend ses premiers travaux.','La gare est en chantier ; les charpentiers ont dressé une ossature.','La gare est achevée et le télégraphe relie la ville à l’extérieur.'],
 stabilite:['Des assemblées locales autonomes occupent la place du Conseil.','Les familles se réunissent autour d’un Conseil commun.','La mairie et les affichages municipaux structurent la vie publique.']
};
const LABELS={economie:'Économie',securite:'Sécurité',satisfaction:'Satisfaction',bien_etre:'Bien-être',developpement:'Développement',stabilite:'Stabilité'};
export function cityVisualState(city,skinId='western',labels=LABELS){
 if(Object.hasOwn(city,'ecologie'))return Object.fromEntries(Object.entries(city).map(([key,value])=>[key,{value,level:value<=3?0:value<=6?1:2,label:labels[key]??key,description:gaugeState(value).label}]));
 return Object.fromEntries(METRICS.map(key=>{
  const value=city[key];if(!Number.isInteger(value)||value<0||value>10)throw new Error('Jauge de ville invalide : '+key);
  const level=value<=3?0:value<=6?1:2;
  return [key,{level,value,label:labels[key]??LABELS[key],description:(UNIVERSE_DETAILS[skinId]??DETAILS)[key][level]}];
 }));
}
export function mountCity(root,skinId='western'){
 if(skinId==='western'){mountPaintedWestern(root);return;}
 root.dataset.renderer='vector';root.removeAttribute('aria-busy');delete root.dataset.paintedRequest;delete root.dataset.paintedApplied;root.innerHTML=universeSceneMarkup(skinId);
}
export function updateCity(root,city,skinId='western',labels){
 const states=cityVisualState(city,skinId,labels);
 if(Object.hasOwn(city,'ecologie')){
  if(root.dataset.renderer!=='city-v2'){
   root.replaceChildren();root.dataset.renderer='city-v2';root.removeAttribute('aria-busy');
   const image=document.createElement('img');image.src='/assets/western/painted/reference.jpg';image.alt='Hot Spring, ville des familles fondatrices';image.style.cssText='width:100%;display:block';root.append(image);
   const summary=document.createElement('div');summary.className='city-v2-summary';root.append(summary);
  }
  const summary=root.querySelector('.city-v2-summary');summary.replaceChildren();
  const words={economie:['Les commerces ferment.','Les échanges se maintiennent.','Les affaires prospèrent.'],ecologie:['La vallée est polluée et les ressources s’épuisent.','La vallée garde un équilibre fragile.','Les terres et les eaux sont préservées.'],securite:['Les rues sont dangereuses.','Les patrouilles maintiennent un ordre relatif.','Les habitants circulent en confiance.'],demographie:['Des maisons se vident et les habitants partent.','La population se maintient.','De nouvelles familles arrivent et les rues s’animent.']};
  for(const [key,state] of Object.entries(states)){state.description=words[key][state.level];const card=document.createElement('article'),h=document.createElement('strong'),p=document.createElement('p');h.textContent=state.label+' · '+state.value+'/10';p.textContent=state.description;card.append(h,p);summary.append(card);}
  return states;
 }
 if(root.dataset.renderer==='city-v2')mountCity(root,skinId);
 if(root.dataset.renderer==='painted-western'){
  root.querySelector('#townDesc').textContent=Object.values(states).map(s=>s.label+' : '+s.value+'/10. '+s.description).join(' ');
  updatePaintedWestern(root,states);return states;
 }
 for(const node of root.querySelectorAll('[data-city-metric]'))node.hidden=Number(node.dataset.cityLevel)!==states[node.dataset.cityMetric].level;
 // SVG does not consistently honor HTMLElement.hidden, so set its display too.
 for(const node of root.querySelectorAll('[data-city-metric]'))node.style.display=Number(node.dataset.cityLevel)===states[node.dataset.cityMetric].level?'':'none';
 root.querySelector('#townDesc').textContent=Object.values(states).map(s=>s.label+' : '+s.value+'/10. '+s.description).join(' ');
 return states;
}
