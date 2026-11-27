// Exporte exclusivement des instantanés publics de parties de test, sans accès à Firebase.
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {hotspringArt} from '../src/founders-hotspring.ts';
import {narrativePublicView} from '../src/founders-live.ts';
import {newCampaign,team} from '../test/helpers/hotspring.mjs';
import {cinemaRoutes,earlyCinemaEnding,playCinemaRoute} from '../test/helpers/hotspring-cinema-routes.mjs';

const directory=process.argv[2];
if(!directory)throw Error('Indiquer un dossier de travail vide pour les instantanés publics.');
mkdirSync(directory,{recursive:true});
const index=[];
function record(route,stage,state,capture=false){
 const view=narrativePublicView(state);
 const session=(index.length+1).toString(16).padStart(24,'0');
 const oppositeSide=view.reveal?.winner==='pour'?'contre':'pour';
 index.push({session,route,stage,phase:view.phase,capture,chapter:view.campaign.chapter,
  url:view.campaign.cinema?.view?.url??null,
  opposite:view.reveal?hotspringArt(state.currentDilemmaId,oppositeSide)?.url:null,
  art:view.reveal?.visual?.url??view.dilemma?.image?.url??null});
 writeFileSync(join(directory,session+'.json'),JSON.stringify(view));
}
const sampleChapters={industrie:4,vallee:3,affluence:4,institutions:6,crises:5};
for(const [id,route] of Object.entries(cinemaRoutes)){
 const {state,snapshots}=playCinemaRoute(route);
 for(const s of snapshots){
  if(s.phase==='CHECKPOINT')record(id,'chapitre-'+s.campaign.chapter,s,s.campaign.chapter===sampleChapters[id]||id==='industrie'&&s.campaign.chapter===2);
  if(s.phase==='EPILOGUE')record(id,'epilogue',s,true);
 }
 record(id,'classement',state,id==='industrie');
 if(id!=='industrie')continue;
 const game=newCampaign({scenarioVersion:'1.2.0'});
 for(const source of snapshots.filter(s=>s.phase==='INTRO'||s.phase==='CHECKPOINT'&&s.campaign.chapter<6)){
  game.replaceState(source);
  while(['CHECKPOINT','INTRO'].includes(game.state.phase))game.command('next');
  if(game.state.phase!=='PRESENTATION')throw Error('Présentation de chapitre introuvable');
  record(id,'presentation-c'+game.state.campaign.chapter,game.state);
 }
 game.replaceState(snapshots.find(s=>s.phase==='CHECKPOINT'&&s.campaign.chapter===1));
 while(['CHECKPOINT','INTRO'].includes(game.state.phase))game.command('next');
 while(game.state.currentDilemmaId!=='D06'){game.vote('pour');game.command('next');}
 record(id,'saloon',game.state,true);
 game.vote('pour');record(id,'saloon-pour',game.state,true);
 game.replaceState(snapshots.find(s=>s.phase==='CHECKPOINT'&&s.campaign.chapter===4));
 game.command('next');game.command('next');
 while(game.state.currentDilemmaId!=='D23'){game.vote('pour');game.command('next');}
 const beforeVote=game.state;
 record(id,'dilemme',game.state);
 game.command('next');record(id,'negociation',game.state);
 game.command('beginVote');
 game.command('vote',{kind:'pour',amount:1},team(game.state.game.vote.turn));
 record(id,'conseil',game.state,true);
 game.vote('pour');record(id,'resultat',game.state,true);
 game.replaceState(beforeVote);game.vote('contre');record(id,'resultat-contre',game.state);
}
record('anticipation','epilogue',earlyCinemaEnding(),true);
writeFileSync(join(directory,'index.json'),JSON.stringify(index,null,2)+'\n');
