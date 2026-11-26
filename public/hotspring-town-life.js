import {townPlots} from './hotspring-tableau-plots.js';

const directory='/assets/hotspring/v1/tableaux/';

// Each rectangle is measured on its site's 1672 × 941 plate. The residents
// stand on Main Street; the new houses occupy separate lots on either side.
const townLifePlots={
 plaine:{
  vie_rue_laterale:[1040,326,222,74],
  vie_maisons_proches:[1110,644,562,297],
  vie_marche:[714,525,164,82],
  vie_rue_sous_tension:[398,570,264,132]
 },
 terrasse:{
  vie_rue_laterale:[1050,287,231,77],
  vie_maisons_proches:[1099,639,573,302],
  vie_marche:[680,493,164,82],
  vie_rue_sous_tension:[337,528,248,124]
 }
};

const labels={
 vie_rue_laterale:'Une rangée de maisons en bois, des jardins clos et des cheminées fumantes prolongent le quartier.',
 vie_maisons_proches:'Une pension à étage et de nouvelles habitations occupent le terrain au premier plan.',
 vie_marche:'Des familles se retrouvent autour d’une marchande de pommes et d’une charrette à bras sur Main Street.',
 vie_rue_sous_tension:'Des coups de feu troublent la rue. Des habitants se mettent à couvert derrière une charrette et un tonneau.'
};

export function townLifeLayers(scene,site){
 const districts=[],people=[];
 if(!scene.location||!scene.layers.some(layer=>layer.id==='surveyed'&&layer.state!=='absent')){
  return {districts,people};
 }
 function add(target,id,key){
  target.push({id,key,label:labels[key],state:'complete',box:townLifePlots[site][key],src:directory+key+'.webp'});
 }
 if(scene.density==='moyenne'||scene.density==='forte')add(districts,'sideStreetHomes','vie_rue_laterale');
 // These foreground homes stand closer to the viewer than the public buildings.
 if(scene.density==='forte')add(people,'frontStreetHomes','vie_maisons_proches');
 if(scene.mood==='dangereuse'||scene.street==='barricadée'){
  add(people,'streetConflict','vie_rue_sous_tension');
 }else if(scene.street==='active'||scene.street==='surpeuplée'){
  add(people,'streetMarket','vie_marche');
  if(scene.density==='forte')people.push({
   id:'residents',key:'passants',label:'Des habitants traversent Main Street en charrette.',state:'complete',
   box:townPlots[site].passants,src:directory+site+'_passants.webp'
  });
 }
 return {districts,people};
}
