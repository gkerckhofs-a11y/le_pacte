import {foundersPreview} from '../../server/founders-catalog.ts';
import {createNarrativeSession,applyNarrativeCommand} from '../../src/founders-live.ts';

const id='a'.repeat(24);
const organizer={role:'organizer',id:'organizer'};
export const hotspringSelection={scenarioId:'les-colons-de-hotspring',skinId:'western'};
export const team=family=>({role:'team',family});
export function newCampaign(options={}){
 const preview=foundersPreview(hotspringSelection);
 let current=createNarrativeSession(preview,{id,ownerId:organizer.id,code:'HOT01',title:'Hotspring',now:1000,...options});
 const command=(kind,data={},actor=organizer,now=current.updatedAt+100)=>{
  current=applyNarrativeCommand(current,actor,{kind,data,expectedRevision:current.revision},now);
  return current;
 };
 const untilCouncil=()=>{
  while(['INTRO','PRESENTATION','NEGOTIATION'].includes(current.phase))command(current.phase==='NEGOTIATION'?'beginVote':'next');
  return current;
 };
 const vote=(winner)=>{
  untilCouncil();
  for(let i=0;i<30&&current.phase==='COUNCIL';i++){
   const {game}=current,v=game.vote;
   if(v.phase==='await_moderator')command('resolveTie',{winner},team(game.moderator));
   else if(v.phase==='await_leader')command('chooseLeader',{family:v.pendingLeaderChoices[0]},team(game.moderator));
   else {
    const data=Object.hasOwn(v.choices,v.turn)?{kind:'maintien'}:
     game.families[v.turn].power>0?{kind:winner,amount:1}:{kind:'passe_pouvoir'};
    command('vote',data,team(v.turn));
   }
  }
  if(current.phase!=='REVEALED')throw Error('Aucun résultat de vote');
  return current;
 };
 return {get state(){return current;},replaceState:s=>{current=s;},command,vote,untilCouncil};
}

export const trajectories={
 commerce:{reject:['D22','D23','D24','D25','D26A','D27','D29'],charter:'A'},
 civique:{reject:['D02','D03','D06','D10','D17','D19','D20'],charter:'B'},
 institutions:{reject:['D01','D02','D03','D06','D10','D17','D19'],charter:'D'},
 autonomie:{approve:['D03','D18'],charter:'C'},
 vallee:{reject:['D01','D02','D03','D04','D06','D10','D12','D15','D16','D17','D18','D19'],charter:'E'}
};

export function simulateCampaign(policy,options={}){
 const game=newCampaign(options),snapshots=[];
 game.command('start');
 snapshots.push(game.state);
 for(let i=0;i<90&&game.state.phase!=='FINISHED';i++){
  const s=game.state,id=s.currentDilemmaId;
  if(s.phase==='CHECKPOINT'){snapshots.push(s);game.command('next');}
  else if(s.phase==='REVEALED')game.command('next');
  else if(s.phase==='EPILOGUE'){snapshots.push(s);game.command('showResults');}
  else if(s.phase==='CHARTER_SUPPORT'){
   const q=s.campaign.qualification,ids=q.candidates;
   if(!ids.includes(policy.charter))throw Error('Charte attendue indisponible : '+policy.charter+' ; '+ids.join(','));
   const other=ids.find(id=>id!==policy.charter);
   for(const [i,f] of Object.keys(s.game.families).entries()){
    game.command('supportCharter',{charter:i<3?policy.charter:other},team(f));
   }
  }else game.vote(id==='D30'?
   (s.campaign.finalists[0]===policy.charter?'pour':'contre'):
   (policy.approve?policy.approve.includes(id):!policy.reject?.includes(id))?'pour':'contre');
 }
 if(game.state.phase!=='FINISHED')throw Error('Fin de la campagne non atteinte');
 return {state:game.state,snapshots};
}
