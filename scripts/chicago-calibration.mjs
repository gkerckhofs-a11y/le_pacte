// Run with the organizer's private V3 JSON. Only aggregate outputs are printed.
import {readFileSync} from 'node:fs';
import {prepareCosaNostra} from '../server/cosa-nostra-preparation.ts';
import {chicagoSessionPreview} from '../server/cosa-nostra-session.ts';
import {createNarrativeSession} from '../src/founders-live.ts';
import {beginNegotiation,beginVote,revealResolution} from '../src/founders-v2.ts';
import {castFoundersAction,moderatorChooseFoundersLeader,moderatorResolveFoundersTie} from '../src/founders.ts';
import {freezeChicago,chicagoCommand} from '../src/chicago-succession.ts';

const prepared=prepareCosaNostra(JSON.parse(readFileSync(process.argv[2],'utf8')));
const {preview,names}=chicagoSessionPreview(prepared,[5,5,5,5,5]);
const ids=['A','B','C','D','E'],staff={role:'organizer'},stops=[0,3,7,15,25];
let seed=20261120;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const pick=xs=>xs[Math.floor(random()*xs.length)];
function permutation(xs){
 const array=[...xs];
 for(let i=array.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[array[i],array[j]]=[array[j],array[i]];}
 return array;
}
function preferred(s,scene,id){
 const ambition=s.scenario.chicago.ambitions[id];
 const slot=ambition.major_slots.find(([pivot])=>pivot===scene.sourceId);
 if(slot)return slot[1].toLowerCase();
 const delta=side=>scene.outcomes[side].effects.find(e=>e.indicator===ambition.indicator)?.value??0;
 if(delta('pour')===delta('contre'))return pick(['pour','contre']);
 return delta('pour')>delta('contre')?'pour':'contre';
}
function evaluate(s,bloc,policy){
 const final=structuredClone(s);
 freezeChicago(final,0);
 const f=final.succession;
 chicagoCommand(final,staff,'openChicagoBallot',{},1);
 for(let turn=0;turn<5&&f.stage!=='sealed';turn++){
  if(f.stage==='arbitration'){
   const {holder,candidates}=f.arbitration;
   chicagoCommand(final,{role:'team',family:holder},'arbitrateChicago',{candidate:pick(candidates)},2);
  }else{
   const r=f.rounds.at(-1);
   for(const id of ids){
    const choices=r.candidates.filter(c=>c!==id);
    const candidate=policy==='coalition'&&bloc.includes(id)&&choices.includes(bloc[0])?bloc[0]:pick(choices);
    chicagoCommand(final,{role:'team',family:id},'castChicagoBallot',{round:r.number,candidate},2);
   }
   chicagoCommand(final,staff,'closeChicagoBallot',{},2);
  }
 }
 if(!f.winner)throw new Error('Succession sans vainqueur');
 return {winner:f.winner,scores:f.frozen.scores};
}
function play(s,scene,bloc,policy){
 s.currentDilemmaId=scene.id;
 beginNegotiation(s,0);beginVote(s,0);
 const leaderChoice=preferred(s,scene,bloc[0]);
 while(s.game.vote){
  const v=s.game.vote;
  if(v.phase==='await_moderator'){
   const side=preferred(s,scene,s.game.moderator);
   s.game=moderatorResolveFoundersTie(s.game,s.game.moderator,side);
  }else if(v.phase==='await_leader')s.game=moderatorChooseFoundersLeader(s.game,s.game.moderator,pick(v.pendingLeaderChoices));
  else{
   const who=v.turn, power=s.game.families[who].power;
   let action={kind:'maintien'};
   if(!Object.hasOwn(v.choices,who)){
    const side=policy==='coalition'&&bloc.includes(who)?leaderChoice:preferred(s,scene,who);
    action=!power||random()<0.17?{kind:'passe_pouvoir'}:{kind:side,amount:1};
   }
   s.game=castFoundersAction(s.game,who,action);
  }
 }
 revealResolution(s,0);
}
const runs=Number(process.argv[3]??100),report=[];
for(const policy of ['individuelle','coalition']){
 const totals=Object.fromEntries(stops.map(n=>[n,{wins:[0,0,0,0,0],small:[0,0,0,0,0],medium:[0,0,0,0,0],major:[0,0,0,0,0],common:null}]));
 for(let i=0;i<runs;i++){
  const order=permutation(ids),first=i%5,bloc=[ids[first],ids[(first+1)%5],ids[(first+2)%5]];
  const s=createNarrativeSession(preview,{id:'cd'.repeat(12),ownerId:'simulation',code:'CN_SIM',title:'Simulation',names,initiativeOrder:order});
  for(let n=0;n<=25;n++){
   if(stops.includes(n)){
    const {winner,scores}=evaluate(s,bloc,policy),row=totals[n];
    row.wins[ids.indexOf(winner)]++;row.common=scores[0].common;
    for(const [j,score] of scores.entries())for(const k of ['small','medium','major'])row[k][j]+=Number(score[k]>0);
   }
   if(n<25)play(s,s.scenario.dilemmas[n],bloc,policy);
  }
 }
 report.push({policy,runs,families:names,stops:totals});
}
console.log(JSON.stringify(report,null,2));
