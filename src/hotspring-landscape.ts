import art from '../content/hotspring-art-index-v1.json' with {type:'json'};
import {HOTSPRING_DETAIL_RULES, hotspringRiverSites, visibleDilemma} from './hotspring-detail-rules.ts';

export const CAMP_ORIGIN = [58, 66.5] as const;

// Ground contact points on the valley plate, as percentages of its width and height.
const lowlandOffsets={
 plankLot:[6.5,-4.5],porchLot:[10,11],homestead:[-6,9.5],surveyed:[3,0],homes:[0,1.8],shops:[4,5],well:[-4.8,2],school:[1,8],saloon:[7,7],clinic:[-12,7],
 territory:[-11,-1],trade:[-6,-3],rail:[7,-6],housing:[15,11],
 bank:[5,2.5],stockyard:[-11,-6.5],store:[-3,2],marshal:[-9,3],jail:[-11,7],sanitation:[4,15],
 tax:[8,1],council:[-1,-3],camp:[7,4.5],refuge:[13,14],waterReserve:[2,13],depot:[11,-3]
};
// The terrace has a shallow, sloping rim. Its plots follow the ridge and leave the footpath clear.
const terracePlots={
 plankLot:[69.5,31],porchLot:[82,41.6],homestead:[74.1,40.6],surveyed:[78,36.4],homes:[68,37.9],shops:[77.8,40.4],well:[72,36.1],school:[84.5,39.8],
 saloon:[77.2,35.5],clinic:[63.5,35.6],territory:[66.9,31.3],trade:[64,35],rail:[80,29],
 housing:[92,38.5],bank:[81.1,36],stockyard:[51,60],store:[72.3,33.1],marshal:[67.2,38.4],
 jail:[64.7,38.2],sanitation:[90,42.2],tax:[86.8,35.3],council:[77.7,32],camp:[85.5,35.6],
 refuge:[96,40],waterReserve:[90.3,33.4],depot:[84.5,32.7]
};
const districts={
 CENTRE_BRULE:['shops','bank','saloon','store','tax'],
 QUARTIER_BRULE:['housing','homes','homestead','plankLot','porchLot'],
 QUARTIERS_INONDES:['housing','well','stockyard','saloon'],
 FRET_SACRIFIE:['rail','depot','stockyard']
};

export function hotspringLandscape(s){
 const marks=new Set(s.campaign.markers),h=mark=>marks.has(mark);
 const high=h('VILLE_HAUTE'),low=h('VILLE_BASSE'),founded=high||low;
 const dilemma=visibleDilemma(s.phase,s.currentDilemmaId);
 const ending=Boolean(s.campaign.charter&&['EPILOGUE','FINISHED'].includes(s.phase));
 const [townX,townY]=high?[76,35.5]:[44,64];
 const scars=Object.entries(districts).filter(([key])=>h(key)).flatMap(([,ids])=>ids);
 const layers=[];
 function add(id,kind,label,{fixed,state='complete',scale=1}={}){
  const [dx,dy]=lowlandOffsets[id]??[0,0];
  const [x,y]=fixed??(high?terracePlots[id]:[townX+dx,townY+dy]);
  const onTerrace=high&&!fixed&&id!=='stockyard';
  layers.push({id,kind,label,x,y,state:scars.includes(id)?'damaged':state,scale:scale*(onTerrace?.94:1)});
 }
 const surveyed=h('CENTRE_PRIVE')||h('RESERVES_PUBLIQUES');
 const water=h('EAU_COMMUNALE')||h('EAU_PRIVEE');
 const timberReady=h('SCIERIE_INTENSIVE')||h('COUPE_REGULEE')&&(h('ECOLE')||h('ECOLE_REPORTEE'));
 if(s.phase!=='READY'&&!surveyed){
  if(!founded)add('camp','camp','Chariots et tentes des fondateurs',{fixed:CAMP_ORIGIN});
  else add('camp',water?'wagon':'wagons','Derniers chariots des fondateurs',{scale:.85});
 }
 if(founded){
  add('homestead','homestead','Premier foyer des colons, avec une famille devant sa maison');
  add('plankLot',water?'plankCottage':'tent',water?'Maison en planches':'Tente des bûcherons');
  add('homes',surveyed?'cottages':'tent',surveyed?'Maisons des premières familles':'Tente des premières familles',{scale:surveyed?.86:1.12});
  add('porchLot',timberReady?'porchHouse':'tent',timberReady?'Maison en bois à perron':'Tente au bord du village');
 }
 if(surveyed){
  add('surveyed',h('REGLEMENT_INCENDIE')?'roadwide':'road','Main Street');
  add('shops',h('CENTRE_PRIVE')?'shops':'vacant',h('CENTRE_PRIVE')?'Commerces des lots privés':'Lots réservés à la ville');
  if(h('SCIERIE_INTENSIVE')||h('COUPE_REGULEE'))
   add('sawmill',h('SCIERIE_INTENSIVE')?'mill':'logging',h('SCIERIE_INTENSIVE')?'Scierie à vapeur':'Zone de coupe limitée',
    {fixed:[23.5,35.4],scale:.68});
 }
 if(water)
  add('well',h('EAU_COMMUNALE')?'well':'tower',h('EAU_COMMUNALE')?'Puits communal':'Tour d’eau de la concession',{scale:.85});
 if(h('ECOLE'))add('school','school','École publique');
 if(h('GRAND_SALOON'))add('saloon','saloon','Saloon et chambres');
 if(h('AUBERGE_REGLEMENTEE'))add('saloon','inn','Auberge réglementée');
 if(h('DISPENSAIRE'))add('clinic','clinic','Dispensaire');
 if(h('ACCORD_RIVIERE')||h('EXPANSION_RIVIERE'))
  add('corridor',h('ACCORD_ROMPU')||h('EXPANSION_RIVIERE')?'fence':'corridor',
   h('ACCORD_ROMPU')?'Piquets de l’accord rompu':h('EXPANSION_RIVIERE')?'Parcelles sur la rive':'Corridor riverain',
   {fixed:hotspringRiverSites.corridor});
 if(h('PASSAGE_DIRECT')||h('DETOUR_TROUPEAUX'))
  add('crossing',h('PASSAGE_DIRECT')?'trail':'ridgeTrail',h('PASSAGE_DIRECT')?'Passage direct des troupeaux':'Détour des troupeaux',
   {fixed:h('PASSAGE_DIRECT')?hotspringRiverSites.crossing:[61,31.2]});
 if(h('COMPTOIR_COMMUN'))add('trade','trade','Comptoir de la vallée',{fixed:[43.5,52.1],scale:.85});
 if(h('MONOPOLE_LOCAL'))add('trade','shops','Comptoir local',{scale:.7});
 if(h('POSTE_TERRITORIAL'))add('territory','office','Poste territorial');
 if(h('AUTONOMIE_LOCALE'))add('territory','bell','Bureau de piste des fondateurs',{scale:.6});
 if(h('CHEMIN_DE_FER')){
  add('rail','rail','Rails du chemin de fer');
  add('depot','station','Gare et quai de fret');
 }
 if(h('GRANDE_MINE')||h('PETITES_MINES'))
  add('mine',h('GRANDE_MINE')?'mine':'workshop',h('SECURITE_MINIERE')?'Mine fermée pour inspection':
   h('GRANDE_MINE')?'Grande mine':'Petites exploitations',{fixed:[81,24],scale:h('GRANDE_MINE')?.8:.6,
    state:h('SECURITE_MINIERE')?'inspection':'complete'});
 if(h('QUARTIER_PLANIFIE')||h('QUARTIER_PROVISOIRE'))
  add('housing',h('QUARTIER_PLANIFIE')?'planned':'shacks',h('QUARTIER_PLANIFIE')?'Quartier planifié':'Quartier provisoire');
 if(h('BANQUE_CREDIT'))
  add('bank','bank',h('BANQUE_FERMEE')?'Banque fermée':h('BANQUE_SOUS_CONTROLE')?'Banque sous contrôle municipal':'Banque de Hotspring',
   {state:h('BANQUE_FERMEE')?'abandoned':'complete'});
 if(h('ABATTOIR_CENTRAL')||h('ABATTOIR_ELOIGNE'))
  add('stockyard','stockyard',h('ABATTOIR_CENTRAL')?'Parcs centraux':'Parcs éloignés',
   {fixed:h('ABATTOIR_ELOIGNE')?[95.5,31.2]:null,scale:h('ABATTOIR_ELOIGNE')?.68:.85});
 if(h('MAGASIN_COMPAGNIE'))add('store','shops','Magasin de la compagnie');
 if(h('MARSHAL')){
  add('marshal','office','Bureau du marshal');
  add('jail','jail','Prison locale',{scale:.65});
 }
 if(h('POSSE'))add('marshal','bell','Cloche et point de rassemblement');
 if(h('ASSAINISSEMENT'))add('sanitation','drains','Fossés et infrastructures sanitaires');
 if(h('DECHETS_LIBRES'))add('sanitation','waste','Dépôts de déchets et fossés souillés');
 if(h('BUDGET_PUBLIC'))add('tax','office','Bureau fiscal');
 if(h('DONATEURS_DOMINANTS'))add('tax','boards','Affichage des collectes et donateurs');
 if(h('CONSEIL_ELU')||h('CONSEIL_FONDATEURS'))
  add('council',h('CONSEIL_ELU')?'hall':'office',h('CONSEIL_ELU')?'Salle du conseil élu':'Conseil des Fondateurs');
 if(h('QUARANTAINE_21_JOURS'))add('refuge','refuge','Ancien site de quarantaine',{scale:.85});
 if(h('RATIONNEMENT_HABITANTS'))add('waterReserve','tower','Réserve d’eau de crise',{scale:.65});
 if(h('PACTE_VALLEE_FINAL')||h('CHARTE_RESSOURCES'))
  add('fields','protected','Bornes de protection de la vallée',{fixed:[17.8,67]});
 const city=s.game.city;
 const river=dilemma==='D26A'?'crue':dilemma==='D26B'||h('PENURIE_EAU')||h('RATIONNEMENT_HABITANTS')?'basse':
  city.ecologie<=2?'polluee':city.ecologie<=4?'degradee':'claire';
 const vegetation=city.ecologie<=2?'fortement dégradée':city.ecologie<=4||h('SCIERIE_INTENSIVE')?'réduite':'abondante';
 const density=!founded||city.demographie<=4?'faible':city.demographie<=7?'moyenne':'forte';
 const street=h('HOSTILITE_OUVERTE')&&city.securite<=3?'barricadée':city.demographie>=8?'surpeuplée':city.demographie>=5?'active':'vide';
 const mood=city.securite<=3?'dangereuse':city.economie>=7?'animée':'calme';
 const prosperity=city.economie>=8?'prospérité':city.economie<=2?'abandon':city.economie<=4?'précarité':'activité régulière';
 const scarList=[
  h('CICATRICES_INCENDIE')?'Incendie':null,h('MARQUES_DE_CRUE')?'Crue':null,
  h('EAU_AU_PLUS_OFFRANT')||h('RATIONNEMENT_HABITANTS')?'Sécheresse':null,
  h('EPIDEMIE_CONTENUE')||h('EPIDEMIE_DIFFUSE')?'Épidémie':null,
  h('RAPPORT_ACCIDENT')?'Accident minier':null,h('SAISIES')?'Saisies bancaires':null
 ].filter(Boolean);
 const footprintsById=new Map(layers.map(layer=>[layer.id,[layer.x,layer.y]]));
 const details=[];
 for(const recipe of HOTSPRING_DETAIL_RULES){
  if(recipe.dilemma!==dilemma||!h(recipe.marker))continue;
  const point=footprintsById.get(recipe.anchor)??('fixed' in recipe?recipe.fixed:null);
  if(point)details.push({kind:recipe.kind,label:recipe.label,anchor:recipe.anchor,x:point[0],y:point[1],
   ...(recipe.dilemma==='D22'?{clean:h('ASSAINISSEMENT')}: {})});
 }
 const usedKinds=new Set(layers.map(l=>l.kind));
 if(usedKinds.has('wagons'))usedKinds.add('wagon');
 if(usedKinds.has('camp')||ending){usedKinds.add('wagon');usedKinds.add('tent');}
 if(founded){
  usedKinds.add('people');
  usedKinds.add('scaffolding');
  usedKinds.add('debris');
 }
 if(vegetation!=='fortement dégradée')usedKinds.add('grove');
 for(const detail of details){
  if(detail.kind==='relief'||detail.kind==='freight')usedKinds.add('relief_cart');
  if(detail.kind==='embers')usedKinds.add('fire');
 }
 const disasters={'Incendie':'fire','Crue':'flood','Sécheresse':'drought','Épidémie':'quarantine',
  'Accident minier':'mine_accident','Saisies bancaires':'bankruptcy'};
 for(const kind of scarList)usedKinds.add(disasters[kind]);
 const sprites=Object.fromEntries([...usedKinds].filter(kind=>art['sprite_'+kind]).map(kind=>[kind,art['sprite_'+kind].url]));
 const charter={A:'commerce',B:'services',C:'ateliers',D:'inspection',E:'liaison',F:'réserves'}[s.campaign.charter]??null;
 return {location:founded?(high?'terrasse':'terres basses'):null,townX,townY,layers:layers.sort((a,b)=>a.y-b.y),
  river,vegetation,density,street,mood,prosperity,scars:scarList,charter,sprites,details,
  ...(ending?{epilogue:{origin:CAMP_ORIGIN}}:{})};
}
