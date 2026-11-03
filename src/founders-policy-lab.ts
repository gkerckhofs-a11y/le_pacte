/**
 * Le Pacte V2.7 — deterministic policy laboratory.
 * NOT a forecast or a measured success probability. These are synthetic
 * strategies implemented as hypotheses, without modeling actual group
 * deliberations. Uses the real Founders vote/transfer/score engines.
 */
import {
 FOUNDERS,FOUNDERS_DEFAULT_CALIBRATION,validateFoundersCalibration,
 createFoundersGame,openFoundersDilemma,castFoundersAction,
 moderatorResolveFoundersTie,moderatorChooseFoundersLeader,
 transferFoundersDollars,applyFoundersCityEffects,totalPower,totalDollars
} from './founders.ts';
import {
 DEFAULT_GOAL_CARDS,DEFAULT_SCORE_RULES,validateGoalCards,validateScoreRules,
 calculateFoundersFinal
} from './founders-scoring.ts';

import {isHybrid,chooseNarrativeNext} from './founders-progression.ts';

const check=(ok,message)=>{if(!ok)throw new Error(message);};
const integer=(n,low,high)=>Number.isSafeInteger(n)&&n>=low&&n<=high;
const MODES=['prudent','ambitieux','mixte'];
const METRICS=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const average=(sum,n)=>n?Math.round(sum/n*100)/100:0;
const makeRandom=seed=>{
 let x=seed>>>0;
 return ()=>{
  // LCG with explicit 32-bit wrap for reproducibility in Node/browser.
  x=(Math.imul(1664525,x)+1013904223)>>>0;
  return x/4294967296;
 };
};
const pick=(random,items)=>items[Math.floor(random()*items.length)];
const shuffle=(random,items)=>{
 const arr=[...items];
 for(let i=arr.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
 return arr;
};
const makeCity=(base,effects)=>{
 const city={...base};
 for(const e of effects){
  if(e.operation==='delta')city[e.indicator]=Math.max(0,Math.min(10,city[e.indicator]+e.value));
  else if(e.operation==='toward_center')city.stabilite+=Math.sign(5-city.stabilite);
  else if(e.operation==='away_from_center')city.stabilite+=city.stabilite<=5?-1:1;
  city.stabilite=Math.max(0,Math.min(10,city.stabilite));
 }
 return city;
};
const preferred=(random,card,city,dilemma)=>{
 const yes=makeCity(city,dilemma.outcomes.pour.effects)[card.indicator];
 const no=makeCity(city,dilemma.outcomes.contre.effects)[card.indicator];
 const direction=card.direction==='at_least'?1:-1;
 const delta=(yes-no)*direction;
 return {choice:delta>0?'pour':delta<0?'contre':random()<.5?'pour':'contre',strength:Math.abs(delta)};
};
const chooseMode=(random,mode)=>mode==='mixte'?pick(random,['prudent','ambitieux','mixte']):mode;
const firstAction=(random,policy,power,want,pledge)=>{
 if(power<1)return {kind:'passe_pouvoir'};
 if(pledge)return {kind:pledge,amount:Math.min(power,policy==='ambitieux'?2:1)};
 // Prudent negotiators are more likely to abstain; ambitious ones spend power.
 const passProbability=policy==='prudent'?.55:policy==='ambitieux'?.1:.3;
 const pressure=want.strength===0?.15:want.strength>=2?-.12:0;
 if(random()<Math.max(0,Math.min(.92,passProbability+pressure))||
    power<=2&&policy!=='ambitieux'&&random()<.5)return {kind:'passe_pouvoir'};
 const aim=policy==='ambitieux'?Math.min(power,1+Math.floor(random()*4)):
     policy==='prudent'?1:Math.min(power,1+Math.floor(random()*2));
 return {kind:want.choice,amount:aim};
};
const replayMode=(random,policy,power,choice,want)=>{
 if(choice?.startsWith('passe'))return {kind:'maintien'};
 if(power<=0)return {kind:'maintien'};
 const pressure=policy==='ambitieux'?.38:policy==='prudent'?.08:.20;
 if(random()<pressure&&choice===want.choice)return {kind:'augmenter',amount:1};
 return {kind:'maintien'};
};
function oneRun(story,goals,rule,calibration,seed,mode,maxDilemmas) {
 const random=makeRandom(seed);
 const order=shuffle(random,FOUNDERS);
 const policies=Object.fromEntries(FOUNDERS.map(id=>[id,chooseMode(random,mode)]));
 let game=createFoundersGame({calibration});
 let id=story.scenario.entry_dilemma;
 const index=new Map(story.dilemmas.map(d=>[d.id,d]));
 const trace=[],outcomes={pour:0,contre:0};
 let offersAccepted=0,powerActions=0,councils=0;
 for(let chapter=0;id!==null;chapter++){
  check(chapter<maxDilemmas,'Trop de dilemmes ou boucle narrative');
  const dilemma=index.get(id);check(dilemma,'Branchement introuvable : '+id);
  game=openFoundersDilemma(game,id);
  const intentions=Object.fromEntries(FOUNDERS.map(fid=>[fid,preferred(random,goals[fid],game.city,dilemma)]));
  const pledged={};
  const proposed=mode==='prudent'?0:mode==='ambitieux'?2:1;
  for(let n=0;n<proposed;n++){
   if(random()<.55){
    const donors=FOUNDERS.filter(fid=>game.families[fid].dollars>=1&&game.families[fid].power>=1);
    const donor=donors.length?pick(random,donors):null;
    const targets=FOUNDERS.filter(fid=>fid!==donor&&game.families[fid].power>=1&&!pledged[fid]);
    if(donor&&targets.length){
     const receiver=pick(random,targets);
     const amount=Math.min(game.families[donor].dollars,1+Math.floor(random()*3));
     if(amount>0){
      game=transferFoundersDollars(game,donor,receiver,amount,'Accord hypothétique sur le vote '+id);
      pledged[receiver]=intentions[donor].choice;offersAccepted++;
     }
    }
   }
  }
  let actions=0;
  while(game.vote!==null){
   check(++actions<=80,'Vote bloqué ou nombre de surenchères dépassé');
   if(game.vote.phase==='await_moderator'){
    const mod=game.moderator;
    const winner=intentions[mod].choice;
    game=moderatorResolveFoundersTie(game,mod,winner);
    continue;
   }
   if(game.vote.phase==='await_leader'){
    const candidates=game.vote.pendingLeaderChoices;
    game=moderatorChooseFoundersLeader(game,game.moderator,pick(random,candidates));
    continue;
   }
   const fid=game.vote.turn;
   check(FOUNDERS.includes(fid),'Tour de vote invalide');
   const past=game.vote.choices[fid];
   const action=past===undefined?
     firstAction(random,policies[fid],game.families[fid].power,intentions[fid],pledged[fid]):
     replayMode(random,policies[fid],game.families[fid].power,past,intentions[fid]);
   game=castFoundersAction(game,fid,action);
   powerActions++;
  }
  const resolved=game.history.at(-1),outcome=dilemma.outcomes[resolved.winner];
  check(outcome,'Issue inconnue');
  outcomes[resolved.winner]++;
  game=applyFoundersCityEffects(game,outcome.effects.map(effect=>({
   resource:effect.indicator,kind:effect.operation,
   ...(effect.operation==='delta'?{amount:effect.value}:{})
  })));
  check(totalPower(game)===game.powerSupply,'Conservation du Pouvoir violée');
  trace.push({id,winner:resolved.winner,city:{...game.city},
   reserve:game.pool,collectiveDollars:totalDollars(game),voteActions:actions});
  id=isHybrid(story)?chooseNarrativeNext({id:'policy-'+seed,scenario:story,game,revealedHistory:trace}):outcome.next_id;councils++;
 }
 check(councils>=1,'Aucun dilemme joué');
 const finished={
  kind:'founders-live-session-v2.5',phase:'FINISHED',
  game,goalCards:goals,scoreRules:rule,initiativeOrder:order,
  names:Object.fromEntries(FOUNDERS.map(f=>[f,'Famille '+f]))
 };
 return {final:calculateFoundersFinal(finished),trace,
  stats:{offersAccepted,powerActions,councils,
   outcomes,dollarsTotal:totalDollars(game),influenceTotal:totalPower(game)}};
}
export function simulateFoundersPolicies(story,{
 cards=DEFAULT_GOAL_CARDS,rule=DEFAULT_SCORE_RULES,
 calibration=FOUNDERS_DEFAULT_CALIBRATION,
 runs=36,seed=20261103,mode='mixte',maxDilemmas=30,includeSamples=false
}={}){
 check(story?.scenario?.entry_dilemma&&Array.isArray(story.dilemmas)&&story.dilemmas.length>=1,'Scénario invalide');
 check(!validateGoalCards(cards).length,'Objectifs invalides');
 check(!validateScoreRules(rule).length,'Barème invalide');
 check(!validateFoundersCalibration(calibration).length,'Calibrage initial invalide');
 check(integer(runs,1,120),'Nombre de répétitions : 1 à 120');
 check(integer(seed,0,4294967295),'Graine numérique non valide');
 check(MODES.includes(mode),'Politique inconnue');
 check(integer(maxDilemmas,1,50),'Limite de dilemmes invalide');
 const familyTotals=Object.fromEntries(FOUNDERS.map(id=>[id,{wins:0,points:0,goal:0,money:0,power:0}]));
 const cityTotal=Object.fromEntries(METRICS.map(id=>[id,0]));
 const examples=[],samples=[];
 let completed=0,failed=0,offers=0,voteActions=0,dilemmas=0;
 const failures={};
 for(let i=0;i<runs;i++){
  try{
   const x=oneRun(story,cards,rule,calibration,(seed+i*1013904223)>>>0,mode,maxDilemmas);
   if(includeSamples)samples.push({city:x.final.city,ranking:x.final.ranking,trace:x.trace});
   completed++;offers+=x.stats.offersAccepted;voteActions+=x.stats.powerActions;dilemmas+=x.stats.councils;
   for(const metric of METRICS)cityTotal[metric]+=x.final.city[metric];
   for(const row of x.final.ranking){
    const v=familyTotals[row.family];v.points+=row.score.total;v.goal+=row.score.secret;
    v.money+=row.dollars;v.power+=row.influenceRemaining;
    if(row.family===x.final.winner)v.wins++;
   }
   if(examples.length<3)examples.push({winner:x.final.winner,
    score:x.final.ranking[0].score.total,dilemmas:x.stats.councils,
    offersAccepted:x.stats.offersAccepted});
  }catch(err){
   failed++;
   const key=err instanceof Error?err.message:'Erreur de simulation inconnue';
   failures[key]=(failures[key]??0)+1;
  }
 }
 return {
  mode,seed,attempts:runs,completed,failed,failures,
  families:Object.fromEntries(FOUNDERS.map(id=>{
   const f=familyTotals[id];
   return [id,{wins:f.wins,winShare:completed?f.wins/completed:null,
     meanPoints:average(f.points,completed),meanGoalPoints:average(f.goal,completed),
     meanFinalDollars:average(f.money,completed),meanFinalInfluence:average(f.power,completed)}];
  })),
  meanCity:Object.fromEntries(METRICS.map(k=>[k,average(cityTotal[k],completed)])),
  meanCouncils:average(dilemmas,completed),
  meanVoteActionsPerCouncil:dilemmas?average(voteActions,dilemmas):null,
  meanOffersAcceptedPerGame:average(offers,completed),
  examples,
  ...(includeSamples?{samples}:{}),
  caution:'Comportements artificiels paramétrés : ce tableau ne représente ni des données humaines ni une probabilité réelle de gagner.'
 };
}
