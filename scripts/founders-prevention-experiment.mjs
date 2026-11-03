/** OFFLINE EXPERIMENT. No application routes, persistence, or production rule changes. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FOUNDERS,createFoundersGame,openFoundersDilemma,castFoundersAction,moderatorResolveFoundersTie,moderatorChooseFoundersLeader,applyFoundersCityEffects,totalPower,totalDollars} from '../src/founders.ts';
import {DEFAULT_GOAL_CARDS,DEFAULT_SCORE_RULES,evaluateGoal,calculateFoundersFinal} from '../src/founders-scoring.ts';
const story=JSON.parse(readFileSync(new URL('../content/fondateurs-sheet-sample-v1.json',import.meta.url)));
const index=new Map(story.dilemmas.map(d=>[d.id,d]));
const metrics=Object.keys(createFoundersGame().city);
export const EVENT_RULES={
 fire:{project:'pompiers',offerAt:2,happensAt:4,loss:{economie:-2,developpement:-2,bien_etre:-1,satisfaction:-1},protectedLoss:{economie:-1}},
 epidemic:{project:'dispensaire',offerAt:5,happensAt:7,loss:{bien_etre:-3,satisfaction:-2,economie:-1},protectedLoss:{bien_etre:-1}}
};
const random=seed=>{let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
const effects=o=>Object.entries(o).map(([resource,amount])=>({resource,kind:'delta',amount}));
const change=(game,outcome)=>applyFoundersCityEffects(game,outcome.effects.map(e=>({resource:e.indicator,kind:e.operation,...(e.operation==='delta'?{amount:e.value}:{})})));
const lossCity=(game,loss)=>applyFoundersCityEffects(game,effects(loss));
const difference=(a,b)=>metrics.reduce((n,k)=>n+a[k]-b[k],0);
const wealth=value=>DEFAULT_SCORE_RULES.wealthTiers.reduce((score,[threshold,points])=>value>=threshold?points:score,0);
const names=Object.fromEntries(FOUNDERS.map(id=>[id,'Famille '+id]));
function finance(game,event,cost,mode,p,run){
 const ids=FOUNDERS.map((_,i)=>FOUNDERS[(i+run)%6]);
 const pledges=Object.fromEntries(FOUNDERS.map(id=>[id,0]));
 if(mode==='equal'){
  for(let n=0;n<cost;n++)pledges[ids[n%6]]++;
 }else{
  const hurt=lossCity(game,event.loss).city,safe=lossCity(game,event.protectedLoss).city;
  const saved=difference(safe,hurt);
  for(const [i,id] of FOUNDERS.entries()){
   const card=DEFAULT_GOAL_CARDS[id],money=game.families[id].dollars;
   // Explicit hypothesis: profiles rotate across families, not tied to their ambitions.
   const profile=(i+run)%3,altruism=[1.2,.35,0][profile];
   const personal=evaluateGoal(card,safe).points-evaluateGoal(card,hurt).points;
   const metricSaved=Math.abs(safe[card.indicator]-hurt[card.indicator]);
   const benefit=p*(Math.max(0,personal)+.2*metricSaved+altruism*saved/2);
   const share=cost/6,max=Math.min(money,Math.ceil(share)+(profile===0?1:0));
   let best=0,bestUtility=0;
   for(let n=1;n<=max;n++){
    // A synthetic valuation, NOT observed willingness to contribute.
    const utility=benefit*Math.min(1,n/share)-(wealth(money)-wealth(money-n))-.1*n;
    if(utility>bestUtility){best=n;bestUtility=utility;}
   }
   pledges[id]=best;
  }
 }
 const pledged=Object.values(pledges).reduce((a,b)=>a+b,0);
 if(pledged<cost||FOUNDERS.some(id=>pledges[id]>game.families[id].dollars))return {built:false,paid:0,contributors:0,freeRiders:0,pledged};
 let left=cost;const paid=Object.fromEntries(FOUNDERS.map(id=>[id,0]));
 // Round-robin collection, with excess pledges returned; failures cost nothing.
 while(left)for(const id of ids)if(left&&paid[id]<pledges[id]){paid[id]++;left--;}
 for(const id of ids)game.families[id].dollars-=paid[id];
 const contributors=Object.values(paid).filter(x=>x>0).length;
 return {built:true,paid:cost,contributors,freeRiders:6-contributors,pledged};
}
export function runPreventionExperiment({seed=551001,run=0,p=.5,cost=6,mode='voluntary'}={}){
 assert.ok(['baseline','unprotected','equal','voluntary'].includes(mode));
 const eventsRandom=random(seed^0x701ea),eventDraws=[eventsRandom(),eventsRandom()];
 const order=[...FOUNDERS];const tieRandom=random(seed^0xc001);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(tieRandom()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 let game=createFoundersGame(),id=story.scenario.entry_dilemma,chapter=0,spent=0;
 const built={},stats={projects:0,failedProjects:0,freeRiders:0,contributors:0,events:0,avoided:0,loss:0,donations:0,actions:0,offers:0};
 const ledger=[];
 while(id!==null){
  assert.ok(++chapter<=12,'Narrative cycle');
  for(const [key,event] of Object.entries(EVENT_RULES))if(chapter===event.offerAt&&['equal','voluntary'].includes(mode)){
   stats.offers++;
   const x=finance(game,event,cost,mode,p,run);built[key]=x.built;
   stats.projects+=Number(x.built);stats.failedProjects+=Number(!x.built);
   stats.freeRiders+=x.freeRiders;stats.contributors+=x.contributors;spent+=x.paid;stats.donations+=x.paid;
   ledger.push({chapter,project:event.project,...x});
  }
  const d=index.get(id);assert.ok(d);
  game=openFoundersDilemma(game,id);
  const rng=random((seed+chapter*2654435761)>>>0),intentions={};
  for(const fid of FOUNDERS){
   const card=DEFAULT_GOAL_CARDS[fid],direction=card.direction==='at_least'?1:-1;
   // Vote preference follows the immediate metric effect, like the existing lab.
   const no=change({...game,vote:null},d.outcomes.contre).city[card.indicator];
   const yes=change({...game,vote:null},d.outcomes.pour).city[card.indicator];
   const delta=(yes-no)*direction;
   intentions[fid]=delta===0?(rng()<.5?'pour':'contre'):delta>0?'pour':'contre';
  }
  let actions=0;
  while(game.vote){
   assert.ok(++actions<=80,'Vote blocked');stats.actions++;
   const v=game.vote;
   if(v.phase==='await_moderator'){game=moderatorResolveFoundersTie(game,game.moderator,intentions[game.moderator]);continue;}
   if(v.phase==='await_leader'){const candidates=v.pendingLeaderChoices;game=moderatorChooseFoundersLeader(game,game.moderator,candidates[Math.floor(rng()*candidates.length)]);continue;}
   const fid=v.turn,power=game.families[fid].power;
   const action=v.choices[fid]!==undefined?{kind:'maintien'}:power===0||rng()<.32?{kind:'passe_pouvoir'}:{kind:intentions[fid],amount:Math.min(power,1+Math.floor(rng()*3))};
   game=castFoundersAction(game,fid,action);
  }
  const outcome=d.outcomes[game.history.at(-1).winner];game=change(game,outcome);
  for(const [eventIndex,[key,event]] of Object.entries(Object.entries(EVENT_RULES)))if(chapter===event.happensAt&&mode!=='baseline'&&eventDraws[Number(eventIndex)]<p){
   stats.events++;
   const before={...game.city},unprotected=lossCity(game,event.loss).city;
   game=lossCity(game,built[key]?event.protectedLoss:event.loss);
   stats.loss+=difference(before,game.city);stats.avoided+=difference(game.city,unprotected);
   ledger.push({chapter,event:key,protected:!!built[key],city:{...game.city}});
  }
  assert.equal(totalPower(game),game.powerSupply);
  const passes=game.history.reduce((n,h)=>n+Object.values(h.choices).filter(c=>c.startsWith('passe')).length,0);
  assert.equal(totalDollars(game)+spent,60+passes,'Expense ledger inconsistent');
  for(const f of Object.values(game.families))assert.ok(f.dollars>=0);
  id=outcome.next_id;
 }
 const final=calculateFoundersFinal({kind:'founders-live-session-v2.5',phase:'FINISHED',game,goalCards:DEFAULT_GOAL_CARDS,scoreRules:DEFAULT_SCORE_RULES,initiativeOrder:order,names});
 assert.equal(chapter,8);
 return {winner:final.winner,city:final.city,ranking:final.ranking,stats,ledger};
}
export function reportPreventionExperiment(runs=120,costs=[3,6,9],probabilities=[.25,.5,.75]){
 const base=Array.from({length:runs},(_,run)=>runPreventionExperiment({run,seed:551001+run*97,mode:'baseline'}));
 const aggregate=(items)=>{
  const sums={};const wins=Object.fromEntries(FOUNDERS.map(f=>[f,0]));const score=Object.fromEntries(FOUNDERS.map(f=>[f,0]));const city=Object.fromEntries(metrics.map(k=>[k,0]));
  let changed=0;
  for(const [i,r] of items.entries()){
   wins[r.winner]++;changed+=Number(r.winner!==base[i].winner);
   for(const [k,v] of Object.entries(r.stats))sums[k]=(sums[k]??0)+v;
   for(const row of r.ranking)score[row.family]+=row.score.total;
   for(const k of metrics)city[k]+=r.city[k];
  }
  const mean=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,Math.round(v/runs*1000)/1000]));
  return {runs,wins,meanScore:mean(score),meanCity:mean(city),meanStats:mean(sums),totals:sums,winnerChanges:changed};
 };
 const configurations=[];
 for(const p of probabilities)for(const cost of costs){
  const modes={};
  for(const mode of ['unprotected','equal','voluntary'])modes[mode]=aggregate(Array.from({length:runs},(_,run)=>runPreventionExperiment({run,seed:551001+run*97,p,cost,mode})));
  configurations.push({p,cost,modes});
 }
 const check=runPreventionExperiment();assert.deepEqual(check,runPreventionExperiment(),'Not reproducible');
 const impossible=runPreventionExperiment({p:0});assert.equal(impossible.stats.events,0);
 return {date:'2026-11-03',runsPerConfiguration:runs,totalRuns:runs*(1+costs.length*probabilities.length*3),seedStart:551001,seedStep:97,
  assumptions:{events:EVENT_RULES,funding:'Offers before votes 2 and 5, hazards after votes 4 and 7. Equal is a compulsory shared-payment control; voluntary uses rotating synthetic solidarity valuations. No new political council is added. Failed projects are refunded.',policies:'Immediate metric-driven votes, fixed random stream by chapter; no bribery, coalitions, learning, bluff, extra time or human enjoyment modelled.',paired:'Same seeds and hazard draws across treatments. Identical decisions are not forced when city effects change preferences. Not a controlled human trial.'},baseline:aggregate(base),configurations};
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1])console.log(JSON.stringify(reportPreventionExperiment(),null,2));
