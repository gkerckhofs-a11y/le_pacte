/** Offline comparison: synthetic policies, never a prediction of human wins. */
import {readFileSync} from 'node:fs';
import {simulateFoundersPolicies} from '../src/founders-policy-lab.ts';
import {DEFAULT_GOAL_CARDS,analyzeFoundersGoalReachability} from '../src/founders-scoring.ts';
const story=JSON.parse(readFileSync(new URL('../content/fondateurs-sheet-sample-v1.json',import.meta.url)));
const seeds=[44009,77123,180031,900001,314159]; // held out from exploratory seeds
const presets={v27:{A:[6,8],B:[5,7],C:[4,6],D:[6,8],E:[8,10],F:[4,3]},
 candidate:{A:[6,7],B:[5,7],C:[4,7],D:[6,8],E:[7,9],F:[4,2]}};
const report={scenario:story.scenario.id,seeds,runsPerSeed:120,
 calibration:'Default: influence 8, dollars 10, pool 3, all city gauges 5',
 caution:'Artificial policies only. Thresholds do not affect these agents’ choices; they only change final scoring. No human equity guarantee.',presets:{}};
for(const [name,targets] of Object.entries(presets)){
 const cards=structuredClone(DEFAULT_GOAL_CARDS);
 for(const [id,pair] of Object.entries(targets))[cards[id].firstTarget,cards[id].secondTarget]=pair;
 const modes={};
 for(const mode of ['prudent','ambitieux','mixte']){
  const families=Object.fromEntries('ABCDEF'.split('').map(id=>[id,{wins:0,meanPoints:0,meanGoalPoints:0}]));
  let completed=0,failed=0;
  for(const seed of seeds){
   const r=simulateFoundersPolicies(story,{cards,mode,seed,runs:120});completed+=r.completed;failed+=r.failed;
   for(const id of 'ABCDEF'){
    families[id].wins+=r.families[id].wins;
    families[id].meanPoints+=r.families[id].meanPoints/seeds.length;
    families[id].meanGoalPoints+=r.families[id].meanGoalPoints/seeds.length;
   }
  }
  for(const row of Object.values(families))for(const k of ['meanPoints','meanGoalPoints'])row[k]=Math.round(row[k]*100)/100;
  modes[mode]={completed,failed,families};
 }
 report.presets[name]={targets,reachability:analyzeFoundersGoalReachability(story,cards),modes};
}
console.log(JSON.stringify(report,null,2));
