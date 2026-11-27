import catalog from '../content/hotspring-cinema-v1.json' with {type:'json'};
import demonstrations from '../content/hotspring-cinema-simulations-v1.json' with {type:'json'};
import {HOTSPRING_INDICATORS} from './hotspring-scoring.ts';
import {averageIndicators} from './founders-scoring.ts';

const viewsByStage=Map.groupBy(catalog.views,view=>view.stage);
const label={economie:'Économie',ecologie:'Écologie',securite:'Sécurité',bien_etre:'Bien-être',demographie:'Démographie'};
const facts={
 VILLE_BASSE:'fondation dans les terres basses',VILLE_HAUTE:'fondation sur la terrasse',
 ECOLE:'école financée',ECOLE_REPORTEE:'école reportée',SCIERIE_INTENSIVE:'scierie à vapeur',COUPE_REGULEE:'coupe de bois limitée',
 COMPTOIR_COMMUN:'comptoir commun',MONOPOLE_LOCAL:'monopole local',HOSTILITE_OUVERTE:'hostilité ouverte',
 ACCORD_RIVIERE:'accord de la rivière',ACCORD_ROMPU:'accord rompu',EXPANSION_RIVIERE:'expansion vers la rivière',
 CHEMIN_DE_FER:'gare accordée',SANS_GARE:'gare refusée',GRANDE_MINE:'grande concession minière',PETITES_MINES:'petites exploitations',
 SECURITE_MINIERE:'mine fermée pour inspection',QUARTIER_PLANIFIE:'quartier planifié',QUARTIER_PROVISOIRE:'quartier provisoire',
 QUARTIER_BRULE:'quartier résidentiel incendié',QUARTIERS_SAUVES:'quartiers résidentiels sauvés',INCENDIE_CONTENU:'incendie contenu',
 DISPENSAIRE:'dispensaire financé',SANS_MEDECIN:'dispensaire refusé',EAU_COMMUNALE:'eau communale',EAU_PRIVEE:'exploitation privée de l’eau',
 CENTRE_PRIVE:'lots centraux privés',RESERVES_PUBLIQUES:'lots publics réservés',GRAND_SALOON:'grand saloon',POSSE:'posse',
 DETTE_OUVRIERE:'endettement ouvrier',ASSAINISSEMENT:'assainissement financé',REGLEMENT_INCENDIE:'règlement coupe-feu',
 CONSTRUCTION_SERREE:'constructions serrées',DECHETS_LIBRES:'rejets non réglementés',BANQUE_CREDIT:'banque ouverte',
 INDUSTRIE_SUSPENDUE:'activité industrielle suspendue',CONSEIL_ELU:'conseil élu',CONSEIL_FONDATEURS:'conseil des fondateurs'
};
const art=({id,url,alt,title})=>({id,url,alt,title});
const explain=marker=>facts[marker]??marker;
export const cinemaChapterTitle=stage=>catalog.stages[stage];

function disqualifier(view,context){
 if(view.anyMarkers?.length&&!view.anyMarkers.some(m=>context.markers.has(m)))return 'Au moins un service collectif doit avoir été financé.';
 for(const m of view.requiredMarkers)if(!context.markers.has(m))return 'Décision requise : '+explain(m)+'.';
 for(const m of view.incompatibleMarkers)if(context.markers.has(m))return 'Incompatible avec la décision « '+explain(m)+' ».';
 for(const id of view.playedCrises)if(!context.crises.has(id))return 'La crise représentée doit avoir été vécue.';
 for(const [key,[lo,hi]] of Object.entries(view.limits)){
  if(!Number.isFinite(context.city[key]))return 'La version de cette partie ne mesure pas la jauge '+label[key]+'.';
  if(context.city[key]<lo||context.city[key]>hi)return label[key]+' doit être comprise entre '+lo+' et '+hi+' sur 10.';
 }
 return null;
}

function viewDistance(view,city,charter){
 // Five independently compared axes; equal averages cannot cancel opposing extremes.
 const keys=HOTSPRING_INDICATORS.filter(k=>Number.isFinite(city[k]));
 const distances=keys.map(k=>(city[k]-view.profile[k])**2);
 let distance=distances.length?averageIndicators(distances):0;
 if(Number.isFinite(city.stabilite))distance+=.2*(city.stabilite-averageIndicators(Object.values(view.profile)))**2;
 // A ratified charter breaks very close artistic matches; it can never unlock a view.
 if(charter&&view.preferredCharters.includes(charter))distance-=.12;
 return distance;
}

function cityProfile(city,markers){
 // The four editorial profiles describe atmosphere. Specific constructions always have separate gates.
 const classes=catalog.cityProfiles.filter(type=>Object.entries(type.limits).every(([key,[lo,hi]])=>
  !Number.isFinite(city[key])||(city[key]>=lo&&city[key]<=hi))).map(type=>{
  const votes=type.markers.filter(m=>markers.has(m)).length;
  return {type,distance:viewDistance({...type,preferredCharters:[]},city,null)-.4*Math.min(3,votes)};
 });
 classes.sort((a,b)=>a.distance-b.distance||a.type.id.localeCompare(b.type.id));
 return classes[0].type;
}

export function selectCinemaView({stage,city,markers,playedCrises=[],charter=null},savedId=null,debug=false){
 const views=viewsByStage.get(stage);
 const fallback=views.find(view=>view.fallback);
 const context={city,markers:new Set(markers),crises:new Set(playedCrises)};
 const type=stage?cityProfile(city,context.markers):null;
 const options=views.map(view=>{
  const reason=disqualifier(view,context)??(view.cityProfile&&view.cityProfile!==type.id?'Cette vue correspond à une autre ambiance de ville.':null);
  const specificity=(view.requiredMarkers.length||view.playedCrises.length)?0.6:0;
  return {view,reason,distance:viewDistance(view,city,charter)-specificity};
 });
 const eligible=options.filter(option=>!option.reason&&!option.view.fallback);
 eligible.sort((a,b)=>a.distance-b.distance||a.view.id.localeCompare(b.view.id,'en'));
 // Preserve a recorded composition across editorial recalibrations, while rechecking all factual constraints.
 const saved=options.find(option=>option.view.id===savedId&&!disqualifier(option.view,context));
 const selected=saved?.view??eligible[0]?.view??fallback;
 const chosenType=saved?.view.cityProfile?catalog.cityProfiles.find(p=>p.id===saved.view.cityProfile):type;
 const result={view:art(selected),fallback:art(fallback),profile:chosenType?{id:chosenType.id,title:chosenType.title}:null};
 if(debug){
  const reasons=chosenType?['Ambiance '+chosenType.id+' · '+chosenType.title+' : comparaison des jauges mesurées et des décisions du Conseil.']:[];
  const votes=chosenType?.markers.filter(m=>context.markers.has(m)).slice(0,3)??[];
  if(votes.length)reasons.push('Décisions qui rapprochent la ville de cette ambiance : '+votes.map(explain).join(', ')+'.');
  if(selected.fallback)reasons.push('Vue neutre de cette étape : elle ne suppose aucun équipement ou événement particulier.');
  if(selected.requiredMarkers.length)reasons.push('Décisions confirmées : '+selected.requiredMarkers.map(explain).join(', ')+'.');
  if(selected.playedCrises.length)reasons.push('Les traces visibles correspondent à une crise déjà vécue.');
  const indicators=Object.entries(selected.profile).filter(([k])=>Number.isFinite(city[k]))
   .sort(([a],[b])=>Math.abs(selected.profile[b]-5)-Math.abs(selected.profile[a]-5)).slice(0,2);
  if(!selected.fallback&&indicators.length)reasons.push('Profil comparé aux jauges : '+indicators.map(([k])=>label[k]+' '+city[k]+'/10').join(' · ')+'.');
  if(selected.anyMarkers?.length)reasons.push('Au moins un service collectif a été financé.');
  if(charter&&selected.preferredCharters.includes(charter))reasons.push('La charte adoptée concorde avec cette vue.');
  result.reasons=reasons;
  result.profiles=options.map(({view,reason})=>({...art(view),eligible:!reason,reason:reason??(view.fallback?'Vue de secours de la même étape.':'Vue compatible avec cette partie.')}));
 }
 return result;
}

const readings={
 economie:['Les affaires tournent au ralenti.','Les échanges prospèrent.'],
 ecologie:['La vallée porte le poids des activités de la ville.','La vallée conserve ses ressources.'],
 securite:['Le maintien de l’ordre inquiète les habitants.','Les habitants circulent en sécurité.'],
 bien_etre:['Les conditions de vie restent difficiles.','Les familles bénéficient de bonnes conditions de vie.'],
 demographie:['Peu d’habitants occupent les rues.','Les rues accueillent une population nombreuse.']
};

export function describeCinemaCity(city){
 const keys=HOTSPRING_INDICATORS.filter(k=>Number.isFinite(city[k])).sort((a,b)=>city[b]-city[a]);
 if(!keys.length)return '';
 const high=keys[0],low=keys.at(-1),sentences=[];
 if(city[high]>=7)sentences.push(readings[high][1]);
 if(city[low]<=4)sentences.push(readings[low][0]);
 return sentences.length?sentences.join(' '):'La ville tient son équilibre. Ses habitants poursuivent leurs activités au fil des décisions du Conseil.';
}

// Replay recorded public inputs from five full games. The selector and asset catalogue
// remain live so an organizer always auditions the same images as the projection.
let simulations;
export function cinemaSimulations(stabilityLabel){
 if(!simulations)simulations=demonstrations.map(route=>{
  const markers=[],playedCrises=[];
  const chapters=route.chapters.map(record=>{
   markers.push(...record.markers);playedCrises.push(...record.playedCrises);
   const {stage,charter}=record;
   const city={...record.city,stabilite:averageIndicators(HOTSPRING_INDICATORS.map(k=>record.city[k]))};
   const {view,fallback,profile,reasons}=selectCinemaView({stage,city,markers,playedCrises,charter},null,true);
   return {stage,chapter:Math.min(stage,6),chapterTitle:cinemaChapterTitle(stage),city,view,fallback,profile,reasons,
    stabilityLabel:stabilityLabel(city.stabilite)};
  });
  return {id:route.id,title:route.title,chapters};
 });
 return structuredClone(simulations);
}
