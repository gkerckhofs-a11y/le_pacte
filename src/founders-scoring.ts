/**
 * Le Pacte des Fondateurs V2.6 — prototype de calcul de victoire.
 * Les scores sont propres à la version de partie et calculés sans effets de bord.
 * Les six objectifs valent au maximum 8 points, plus dollars (3), Conseil (3),
 * et Influence disponible (2). Aucun barème n'est considéré équilibré sans test humain.
 */
import {FOUNDERS} from './founders.ts';

const METRICS=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const DIRECTIONS=['at_least','at_most'];
const copy=x=>structuredClone(x);
const check=(ok,m)=>{if(!ok)throw new Error(m);};
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const text=(v,max=180)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const defaults=[
 ['A','Guilde des négociants','Développer les affaires et enrichir Hot Spring.','economie','at_least',6,8],
 ['B','Gardes et justice','Faire de Hot Spring une place sûre pour les voyageurs.','securite','at_least',5,7],
 ['C','Voix du peuple','Gagner la confiance des habitants.','satisfaction','at_least',4,6],
 ['D','Médecins et bâtisseurs','Améliorer les conditions de vie des pionniers.','bien_etre','at_least',6,8],
 ['E','La ville de demain','Faire progresser les équipements et institutions.','developpement','at_least',8,10],
 ['F','Les indépendants','Empêcher la ville de se soumettre à un pouvoir trop centralisé.','stabilite','at_most',4,3]
];
export const DEFAULT_GOAL_CARDS=Object.freeze(Object.fromEntries(defaults.map(
 ([id,title,description,indicator,direction,firstTarget,secondTarget])=>[id,{
  id:'F_'+id,title,description,indicator,direction,firstTarget,secondTarget
 }]
)));
export const DEFAULT_SCORE_RULES=Object.freeze({
 version:'founders-score-v2.6',secretFirst:3,secretSecond:5,
 wealthTiers:[[10,1],[13,2],[16,3]],
 councilVotesPerPoint:2,councilPointsMax:3,
 influenceTiers:[[6,1],[10,2]]
});
export function validateGoalCard(c){
 const e=[];
 if(!c||typeof c!=='object'||Array.isArray(c))return ['Objectif invalide'];
 const keys=['id','title','description','indicator','direction','firstTarget','secondTarget'];
 if(Object.keys(c).some(k=>!keys.includes(k)))e.push('Champ d’objectif inconnu');
 if(typeof c.id!=='string'||!/^F_[A-F]$/.test(c.id))e.push('ID objectif invalide');
 if(!text(c.title,120)||!text(c.description,500))e.push('Titre ou description invalide');
 if(!METRICS.includes(c.indicator))e.push('Indicateur inconnu');
 if(!DIRECTIONS.includes(c.direction))e.push('Sens de l’objectif inconnu');
 if(!integer(c.firstTarget,0,10)||!integer(c.secondTarget,0,10))e.push('Paliers hors limites');
 else if(c.direction==='at_least'&&c.secondTarget<=c.firstTarget)e.push('Second palier strictement supérieur requis');
 else if(c.direction==='at_most'&&c.secondTarget>=c.firstTarget)e.push('Second palier strictement inférieur requis');
 return e;
}
export function validateGoalCards(cards){
 const errors=[];
 if(!cards||typeof cards!=='object'||Array.isArray(cards))return ['Six cartes d’objectifs requises'];
 for(const id of FOUNDERS){
  if(!Object.hasOwn(cards,id)){errors.push('Carte manquante : '+id);continue;}
  for(const e of validateGoalCard(cards[id]))errors.push(id+' : '+e);
  if(cards[id]?.id!=='F_'+id)errors.push('Identifiant de carte incompatible : '+id);
 }
 for(const key of Object.keys(cards))if(!FOUNDERS.includes(key))errors.push('Famille inconnue : '+key);
 return errors;
}
export function validateScoreRules(rule){
 const errors=[];
 if(!rule||typeof rule!=='object'||Array.isArray(rule))return ['Barème invalide'];
 const allowed=['version','secretFirst','secretSecond','wealthTiers','councilVotesPerPoint','councilPointsMax','influenceTiers'];
 if(Object.keys(rule).some(k=>!allowed.includes(k)))errors.push('Champ de barème inconnu');
 if(rule.version!=='founders-score-v2.6')errors.push('Version du barème incompatible');
 if(!integer(rule.secretFirst,0,12)||!integer(rule.secretSecond,0,12)||rule.secretFirst+rule.secretSecond<1)errors.push('Points secrets invalides');
 if(!integer(rule.councilVotesPerPoint,1,20)||!integer(rule.councilPointsMax,0,10))errors.push('Points de Conseil invalides');
 const validateTiers=(tiers,maxCount,label)=>{
  if(!Array.isArray(tiers)||tiers.length!==maxCount){errors.push('Paliers '+label+' invalides');return;}
  let lastThreshold=-1,lastPoints=-1;
  for(const tier of tiers){
   if(!Array.isArray(tier)||tier.length!==2||!integer(tier[0],0,500)||!integer(tier[1],0,10)||tier[0]<=lastThreshold||tier[1]<=lastPoints)errors.push('Paliers '+label+' non croissants');
   else {lastThreshold=tier[0];lastPoints=tier[1];}
  }
 };
 validateTiers(rule.wealthTiers,3,'dollars');
 validateTiers(rule.influenceTiers,2,'Influence');
 return [...new Set(errors)];
}

export function evaluateGoal(card,city,rule=DEFAULT_SCORE_RULES){
 const errors=validateGoalCard(card);check(!errors.length,errors.join(' ; '));
 const value=city?.[card.indicator];
 check(integer(value,0,10),'Indicateur de la ville invalide');
 const test=target=>card.direction==='at_least'?value>=target:value<=target;
 const first=test(card.firstTarget),second=test(card.secondTarget);
 return {indicator:card.indicator,value,direction:card.direction,
  firstTarget:card.firstTarget,secondTarget:card.secondTarget,
  first,second,points:(first?rule.secretFirst:0)+(second?rule.secretSecond:0),
  maxPoints:rule.secretFirst+rule.secretSecond};
}
const scoreTiers=(value,tiers)=>tiers.reduce((score,[threshold,points])=>value>=threshold?points:score,0);
export function calculateFoundersFinal(s){
 check(s?.kind==='founders-live-session-v2.5'&&s.phase==='FINISHED','Partie non terminée');
 check(s.game.vote===null,'Vote encore actif');
 const cards=s.goalCards??DEFAULT_GOAL_CARDS;
 const errors=validateGoalCards(cards);check(!errors.length,errors.join(' ; '));
 const rule=s.scoreRules??DEFAULT_SCORE_RULES;
 const ruleErrors=validateScoreRules(rule);check(!ruleErrors.length,ruleErrors.join(' ; '));
 const order=s.initiativeOrder??FOUNDERS;
 check(Array.isArray(order)&&order.length===6&&new Set(order).size===6&&order.every(x=>FOUNDERS.includes(x)),'Tirage de départ invalide');
 const results=FOUNDERS.map(id=>{
  const family=s.game.families[id],goal=evaluateGoal(cards[id],s.game.city,rule);
  check(integer(family.dollars,0,100000)&&integer(family.power,0,100000),'Trésorerie invalide');
  const wins=s.game.history.filter(h=>h.winner&&h.choices?.[id]===h.winner&&(h.bids?.[id]??0)>=1).length;
  const wealth=scoreTiers(family.dollars,rule.wealthTiers);
  const influence=scoreTiers(family.power,rule.influenceTiers);
  const council=Math.min(rule.councilPointsMax,Math.floor(wins/rule.councilVotesPerPoint));
  return {
   family:id,name:s.names[id],goal:{...goal,title:cards[id].title,description:cards[id].description},
   score:{secret:goal.points,wealth,council,influence,total:goal.points+wealth+council+influence},
   votesWon:wins,dollars:family.dollars,influenceRemaining:family.power,
   initiativeRank:order.indexOf(id)+1
  };
 });
 results.sort((a,b)=>b.score.total-a.score.total||b.score.secret-a.score.secret||
  b.votesWon-a.votesWon||b.dollars-a.dollars||b.influenceRemaining-a.influenceRemaining||
  a.initiativeRank-b.initiativeRank);
 return {version:rule.version,winner:results[0].family,ranking:results.map((r,i)=>({...r,rank:i+1})),
  city:copy(s.game.city),dilemmasResolved:s.game.history.length,
  maxScore:rule.secretFirst+rule.secretSecond+rule.wealthTiers.at(-1)[1]+rule.councilPointsMax+rule.influenceTiers.at(-1)[1],
  tiebreakOrder:['total','secret','votes remportés','dollars','influence restante','tirage de départ']};
}
/**
 * Explore both choices on each narrative branch; they are NOT empirical
 * probabilities. Bounded to prevent hang on cycles or combinatorial scenarios.
 */
export function analyzeFoundersGoalReachability(story,cards=DEFAULT_GOAL_CARDS,{maxPaths=4096,maxDepth=40}={}){
 check(story?.scenario?.entry_dilemma&&Array.isArray(story.dilemmas),'Scénario invalide');
 const errors=validateGoalCards(cards);check(!errors.length,errors.join('; '));
 const map=new Map(story.dilemmas.map(d=>[d.id,d]));
 const endCities=[];let truncated=false,invalidPaths=0;
 const visit=(id,city,visited,depth)=>{
  if(endCities.length>=maxPaths){truncated=true;return;}
  if(id===null){endCities.push(city);return;}
  if(depth>=maxDepth||visited.has(id)){invalidPaths++;return;}
  const d=map.get(id);if(!d){invalidPaths++;return;}
  for(const choice of ['pour','contre']){
   const output=d.outcomes[choice],next={...city};
   for(const e of output.effects){
    if(e.operation==='delta')next[e.indicator]=Math.min(10,Math.max(0,next[e.indicator]+e.value));
    else if(e.operation==='toward_center')next.stabilite+=Math.sign(5-next.stabilite);
    else if(e.operation==='away_from_center')next.stabilite+=next.stabilite<=5?-1:1;
    if(e.indicator==='stabilite')next.stabilite=Math.min(10,Math.max(0,next.stabilite));
   }
   visit(output.next_id,next,new Set([...visited,id]),depth+1);
  }
 };
 visit(story.scenario.entry_dilemma,{economie:5,securite:5,satisfaction:5,bien_etre:5,developpement:5,stabilite:5},new Set(),0);
 const counts=Object.fromEntries(FOUNDERS.map(id=>{
  const card=cards[id],first=endCities.filter(city=>evaluateGoal(card,city).first).length;
  const second=endCities.filter(city=>evaluateGoal(card,city).second).length;
  return [id,{title:card.title,indicator:card.indicator,first,second,
   firstShare:endCities.length?first/endCities.length:null,
   secondShare:endCities.length?second/endCities.length:null}];
 }));
 return {endings:endCities.length,truncated,invalidPaths,goals:counts,
  note:'Exploration combinatoire (choix 50/50 non présumé), sans négociations ni probabilité humaine.'};
}
