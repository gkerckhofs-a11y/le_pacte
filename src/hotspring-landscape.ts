import art from '../content/hotspring-art-index-v1.json' with {type:'json'};

// Coordinates are percentage points on the fixed valley plate, ordered from the ridge to the foreground.
const footprints={
 surveyed:[3,0],homes:[0,4],shops:[4,5],well:[-5,5],school:[1,8],saloon:[7,7],clinic:[-7,9],
 sawmill:[-19,-21],territory:[-8,-2],trade:[-15,-13],rail:[10,-3],mine:[28,-30],housing:[12,11],
 bank:[2,3],stockyard:[-10,10],store:[-3,2],marshal:[-8,2],jail:[-7,5],sanitation:[5,14],
 tax:[8,1],council:[-2,-2],camp:[-3,5],fields:[-18,-6],corridor:[-14,-17],crossing:[-15,-22],
 refuge:[10,8],depot:[9,-1]
};
const districts={
 CENTRE_BRULE:['shops','bank','saloon','store','tax'],
 QUARTIER_BRULE:['housing','homes'],
 QUARTIERS_INONDES:['housing','well','stockyard','saloon']
};

export function hotspringLandscape(s){
 const marks=new Set(s.campaign.markers),h=mark=>marks.has(mark);
 const high=h('VILLE_HAUTE'),low=h('VILLE_BASSE'),founded=high||low;
 const [townX,townY]=high?[73,39]:[44,64];
 const scars=Object.entries(districts).filter(([key])=>h(key)).flatMap(([,ids])=>ids);
 const layers=[];
 function add(id,kind,label,{fixed,state='complete',scale=1}={}){
  const [dx,dy]=footprints[id];
  const x=fixed?.[0]??townX+dx*(high?0.82:1),y=fixed?.[1]??townY+dy*(high?0.68:1);
  layers.push({id,kind,label,x,y,state:scars.includes(id)?'damaged':state,scale:scale*(high&&!fixed?0.90:1)});
 }
 const surveyed=h('CENTRE_PRIVE')||h('RESERVES_PUBLIQUES');
 if(s.phase!=='READY'&&!surveyed)add('camp','camp','Chariots et tentes des fondateurs',{fixed:founded?null:[58,52]});
 if(s.revealedHistory.some(d=>d.id==='D02')&&!surveyed)add('homes','cottages','Premiers abris',{scale:.75,state:'building'});
 if(surveyed){
  add('surveyed',h('REGLEMENT_INCENDIE')?'roadwide':'road','Main Street');
  add('homes','cottages','Habitation des familles');
  add('shops',h('CENTRE_PRIVE')?'shops':'vacant',h('CENTRE_PRIVE')?'Commerces des lots privés':'Lots réservés à la ville');
  if(h('SCIERIE_INTENSIVE')||h('COUPE_REGULEE'))
   add('sawmill',h('SCIERIE_INTENSIVE')?'mill':'logging',h('SCIERIE_INTENSIVE')?'Scierie à vapeur':'Zone de coupe limitée',{fixed:[30,36]});
 }
 if(h('EAU_COMMUNALE')||h('EAU_PRIVEE'))
  add('well',h('EAU_COMMUNALE')?'well':'tower',h('EAU_COMMUNALE')?'Puits communal':'Tour d’eau de la concession',{scale:.85});
 if(h('ECOLE'))add('school','school','École publique');
 if(h('GRAND_SALOON'))add('saloon','saloon','Saloon et chambres');
 if(h('AUBERGE_REGLEMENTEE'))add('saloon','inn','Auberge réglementée');
 if(h('DISPENSAIRE'))add('clinic','clinic','Dispensaire');
 if(h('ACCORD_RIVIERE')||h('EXPANSION_RIVIERE'))
  add('corridor',h('ACCORD_ROMPU')||h('EXPANSION_RIVIERE')?'fence':'corridor',
   h('ACCORD_ROMPU')?'Piquets de l’accord rompu':h('EXPANSION_RIVIERE')?'Parcelles sur la rive':'Corridor riverain',{fixed:[24,52]});
 if(h('PASSAGE_DIRECT')||h('DETOUR_TROUPEAUX'))
  add('crossing','trail',h('PASSAGE_DIRECT')?'Passage direct des troupeaux':'Détour des troupeaux',{fixed:h('PASSAGE_DIRECT')?[33,52]:[43,34]});
 if(h('COMPTOIR_COMMUN'))add('trade','trade','Comptoir de la vallée',{fixed:[35,46]});
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
   {fixed:h('ABATTOIR_ELOIGNE')?[87,54]:null,scale:.85});
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
 if(h('RATIONNEMENT_HABITANTS'))add('refuge','tower','Réserve d’eau de crise',{scale:.65});
 if(h('PACTE_VALLEE_FINAL')||h('CHARTE_RESSOURCES'))
  add('fields','protected','Bornes de protection de la vallée',{fixed:[20,59]});
 const city=s.game.city;
 const river=s.phase==='REVEALED'&&s.lastReveal?.id==='D26A'?'crue':h('PENURIE_EAU')||h('RATIONNEMENT_HABITANTS')?'basse':city.ecologie<=2?'polluee':city.ecologie<=4?'degradee':'claire';
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
 const usedKinds=new Set(layers.map(l=>l.kind));
 if(usedKinds.has('camp')){usedKinds.add('wagon');usedKinds.add('tent');}
 if(founded)usedKinds.add('people');
 const disasters={'Incendie':'fire','Crue':'flood','Sécheresse':'drought','Épidémie':'quarantine',
  'Accident minier':'mine_accident','Saisies bancaires':'bankruptcy'};
 for(const kind of scarList)usedKinds.add(disasters[kind]);
 const sprites=Object.fromEntries([...usedKinds].filter(kind=>art['sprite_'+kind]).map(kind=>[kind,art['sprite_'+kind].url]));
 const charter={A:'commerce',B:'services',C:'ateliers',D:'inspection',E:'liaison',F:'réserves'}[s.campaign.charter]??null;
 return {location:founded?(high?'terrasse':'terres basses'):null,townX,townY,layers:layers.sort((a,b)=>a.y-b.y),
  river,vegetation,density,street,mood,prosperity,scars:scarList,charter,sprites};
}
