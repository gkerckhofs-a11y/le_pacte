import {newCampaign,simulateCampaign,trajectories} from './hotspring.mjs';

export const cinemaRoutes={
 industrie:{label:'Ville industrielle et polluée',policy:trajectories.commerce},
 vallee:{label:'Communauté paisible de la vallée',policy:trajectories.vallee},
 affluence:{
  label:'Ville très peuplée et fragile',
  policy:{reject:['D02','D03','D05','D07','D08','D10','D11','D12','D13','D16','D17','D19','D20','D21','D22','D23','D27','D29'],charter:'A'}
 },
 institutions:{
  label:'Ville sécurisée et organisée',
  policy:{reject:['D01','D02','D03','D07','D10','D12','D13','D18','D19','D24','D27'],charter:'D'}
 },
 crises:{
  label:'Ville appauvrie après les crises',crisisMode:'extended',
  policy:{approve:['D01','D03','D05','D06','D07','D08','D12','D13','D15','D16','D17','D18','D20','D23','D26A','D27','D29'],charter:'C'}
 }
};

export function playCinemaRoute(route){
 const options={scenarioVersion:'1.2.0',crisisMode:route.crisisMode??'standard'};
 return simulateCampaign(route.policy,options);
}

export function earlyCinemaEnding(){
 const g=newCampaign({scenarioVersion:'1.2.0'});
 g.command('start');
 for(const id of ['D01','D02','D03']){
  if(g.state.currentDilemmaId!==id)throw Error('Dilemme de fondation inattendu');
  g.vote('contre');g.command('next');
 }
 if(g.state.phase!=='CHECKPOINT')throw Error('Le chapitre I devait être terminé');
 g.command('next');g.vote('contre'); // Le D04 a été joué au chapitre II.
 g.command('finish',{confirm:true});
 return g.state;
}
