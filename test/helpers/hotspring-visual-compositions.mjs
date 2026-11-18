import {hotspringLandscape} from '../../src/hotspring-landscape.ts';
import {HOTSPRING_DETAIL_RULES} from '../../src/hotspring-detail-rules.ts';
import {newCampaign,simulateCampaign,trajectories} from './hotspring.mjs';

const buildings = {
 road:['surveyed','RESERVES_PUBLIQUES','Rue principale'],
 homes:['homes',null,'Habitations'],
 shops:['shops','CENTRE_PRIVE','Commerces'],
 well:['well','EAU_COMMUNALE','Puits communal'],
 tower:['well','EAU_PRIVEE','Tour d’eau'],
 school:['school','ECOLE','École'],
 saloon:['saloon','GRAND_SALOON','Saloon'],
 inn:['saloon','AUBERGE_REGLEMENTEE','Auberge'],
 clinic:['clinic','DISPENSAIRE','Dispensaire'],
 mill:['sawmill','SCIERIE_INTENSIVE','Scierie'],
 office:['territory','POSTE_TERRITORIAL','Relais territorial'],
 trade:['trade','COMPTOIR_COMMUN','Comptoir de la vallée'],
 station:['depot','CHEMIN_DE_FER','Gare'],
 rail:['rail','CHEMIN_DE_FER','Voie ferrée'],
 mine:['mine','GRANDE_MINE','Mine'],
 housing:['housing','QUARTIER_PLANIFIE','Quartier ouvrier'],
 bank:['bank','BANQUE_CREDIT','Banque'],
 stockyard:['stockyard','ABATTOIR_CENTRAL','Parcs à bétail'],
 marshal:['marshal','MARSHAL','Bureau du marshal'],
 jail:['jail','MARSHAL','Prison locale'],
 drains:['sanitation','ASSAINISSEMENT','Travaux sanitaires'],
 council:['council','CONSEIL_ELU','Salle du conseil']
};
const buildingStates = {absent:'site libre',building:'chantier',complete:'terminé',damaged:'endommagé'};
const base = newCampaign().state;

function landscape(markers=[],{dilemma,city={},high=false}={}){
 const water=markers.includes('EAU_PRIVEE')?'EAU_PRIVEE':'EAU_COMMUNALE';
 const lots=markers.includes('CENTRE_PRIVE')?'CENTRE_PRIVE':'RESERVES_PUBLIQUES';
 const state={...base,phase:dilemma?'PRESENTATION':'CHECKPOINT',currentDilemmaId:dilemma??'D03',
  game:{...base.game,city:{...base.game.city,...city}},campaign:{...base.campaign,
   markers:[...new Set([high?'VILLE_HAUTE':'VILLE_BASSE',water,lots,...markers])]}};
 return hotspringLandscape(state);
}

function buildingComposition(id,key,state){
 const [anchor,marker,name]=buildings[key];
 const map=landscape(marker?[marker]:[]);
 const layer=map.layers.find(l=>l.id===anchor);
 if(!layer)throw new Error('Ancrage absent pour '+id);
 const scene={...map,layers:map.layers.map(l=>l.id===anchor?{...l,state}:l)};
 return {scene,point:[layer.x,layer.y],zoom:key==='rail'||key==='road'?2.9:3.7,
  rendered:{type:'building',anchor,state},alt:name+' · '+buildingStates[state]};
}

function variantComposition(row){
 const rule=HOTSPRING_DETAIL_RULES.find(r=>r.dilemma===row.dilemma&&r.marker===row.condition);
 if(!rule)throw new Error('Recette de variante absente pour '+row.id);
 const markers=rule.marker==='ALLIANCE_VALLEE'?
  ['ALLIANCE_VALLEE','ACCORD_RIVIERE','COMPTOIR_COMMUN']: [rule.marker];
 if(rule.marker==='CENTRE_BRULE')markers.push('BANQUE_CREDIT','CICATRICES_INCENDIE');
 if(rule.marker==='SECURITE_MINIERE')markers.push('GRANDE_MINE','RAPPORT_ACCIDENT');
 const scene=landscape(markers,{dilemma:rule.dilemma,high:rule.dilemma==='D26B'});
 const feature=scene.details.find(d=>d.kind===rule.kind&&d.anchor===rule.anchor);
 if(!feature)throw new Error('Variante invisible dans '+row.id);
 return {scene,point:[feature.x,feature.y],zoom:rule.kind==='boundary'?3:3.5,
  rendered:{type:'detail',kind:rule.kind,anchor:rule.anchor},alt:feature.label};
}

const environmentalStates={
 river_clear:{key:'river',value:'claire',alt:'Cours de la rivière claire'},
 river_degraded:{key:'river',value:'degradee',city:{ecologie:4},alt:'Eau chargée de sédiments'},
 river_polluted:{key:'river',value:'polluee',city:{ecologie:2},alt:'Rivière polluée'},
 river_low:{key:'river',value:'basse',dilemma:'D26B',high:true,alt:'Lit apparent pendant la sécheresse'},
 river_flooded:{key:'river',value:'crue',dilemma:'D26A',alt:'Rivière en crue'},
 street_empty:{key:'street',value:'vide',city:{demographie:3},alt:'Rue vide'},
 street_active:{key:'street',value:'active',city:{demographie:6},alt:'Rue fréquentée'},
 street_crowded:{key:'street',value:'surpeuplée',city:{demographie:8},alt:'Rue très fréquentée'},
 street_barricaded:{key:'street',value:'barricadée',markers:['HOSTILITE_OUVERTE'],city:{securite:3},alt:'Rue fermée par des barrières'},
 vegetation_abundant:{key:'vegetation',value:'abondante',alt:'Bosquets en bordure de rivière'},
 vegetation_reduced:{key:'vegetation',value:'réduite',city:{ecologie:4},alt:'Bosquets éclaircis et premières souches'},
 vegetation_damaged:{key:'vegetation',value:'fortement dégradée',city:{ecologie:2},alt:'Rive à végétation réduite et souches apparentes'},
 mood_quiet:{key:'mood',value:'calme',alt:'Rue calme'},
 mood_busy:{key:'mood',value:'animée',city:{economie:7},alt:'Rue commerçante animée'},
 mood_dangerous:{key:'mood',value:'dangereuse',city:{securite:3},alt:'Rue protégée par des barrières'},
 population_low:{key:'density',value:'faible',city:{demographie:4},alt:'Faible population'},
 population_medium:{key:'density',value:'moyenne',city:{demographie:6},alt:'Population moyenne'},
 population_high:{key:'density',value:'forte',city:{demographie:9},alt:'Population nombreuse'},
 prosperity_prosperous:{key:'prosperity',value:'prospérité',city:{economie:8},alt:'Façades d’une ville prospère'},
 prosperity_poor:{key:'prosperity',value:'précarité',city:{economie:4},alt:'Abri provisoire dans une ville précaire'},
 prosperity_abandoned:{key:'prosperity',value:'abandon',city:{economie:2},alt:'Façades et commerces fermés'}
};
const houses={
 housing_healthy:['QUARTIER_PLANIFIE','planned','complete','Quartier aéré'],
 housing_precarious:['QUARTIER_PROVISOIRE','shacks','complete','Abris ouvriers précaires'],
 housing_damaged:['QUARTIER_BRULE','planned','damaged','Quartier endommagé']
};
const disasters={
 crisis_fire:[['CICATRICES_INCENDIE','CENTRE_PRIVE','CENTRE_BRULE'],'Incendie','shops'],
 crisis_flood:[['MARQUES_DE_CRUE','QUARTIERS_INONDES'],'Crue','well'],
 crisis_drought:[['RATIONNEMENT_HABITANTS'],'Sécheresse','well'],
 crisis_quarantine:[['EPIDEMIE_CONTENUE','QUARANTAINE_21_JOURS'],'Épidémie','refuge'],
 crisis_bankruptcy:[['BANQUE_CREDIT','BANQUE_FERMEE','SAISIES'],'Saisies bancaires','bank'],
 crisis_mine_accident:[['GRANDE_MINE','RAPPORT_ACCIDENT'],'Accident minier','mine']
};

let finalLandscape;
export function visualComposition(row){
 const building=row.id.match(/^building_(.+)_(absent|building|complete|damaged)$/);
 if(building)return buildingComposition(row.id,building[1],building[2]);
 if(row.kind==='variante')return variantComposition(row);
 if(row.id==='epilogue_final'){
  finalLandscape??=hotspringLandscape(simulateCampaign(trajectories.commerce).snapshots.at(-1));
  return {scene:finalLandscape,point:[50,50],zoom:1,rendered:{type:'ending'},alt:'Hotspring au couchant dans une trajectoire commerciale'};
 }
 const home=houses[row.id];
 if(home){
  const [marker,kind,state,alt]=home;
  const scene=landscape([marker,marker==='QUARTIER_PROVISOIRE'?'QUARTIER_PROVISOIRE':'QUARTIER_PLANIFIE']);
  const layer=scene.layers.find(l=>l.id==='housing');
  if(layer.kind!==kind||layer.state!==state)throw new Error('Quartier incohérent pour '+row.id);
  return {scene,point:[layer.x,layer.y],zoom:3.6,rendered:{type:'building',anchor:'housing',state,kind},alt};
 }
 const crisis=disasters[row.id];
 if(crisis){
  const [markers,scar,anchor]=crisis;
  const scene=landscape(markers);
  const layer=scene.layers.find(l=>l.id===anchor);
  return {scene,point:[layer.x,layer.y],zoom:3.4,rendered:{type:'scar',scar},alt:'Trace de la crise · '+scar};
 }
 const env=environmentalStates[row.id];
 if(env){
  const scene=landscape(env.markers,{dilemma:env.dilemma,city:env.city,high:env.high});
  if(scene[env.key]!==env.value)throw new Error('État du panorama incohérent pour '+row.id);
  const point=env.key==='river'?[25,56]:env.key==='vegetation'?[34,50]:[scene.townX,scene.townY+5];
  return {scene,point,zoom:2.5,rendered:{type:'environment',key:env.key,value:env.value},alt:env.alt};
 }
 throw new Error('Composition non définie pour '+row.id);
}
