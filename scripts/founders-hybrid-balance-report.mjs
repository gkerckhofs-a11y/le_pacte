/** Reproducible synthetic evaluation. Held-out seeds must not tune the candidate. */
import {readFileSync,writeFileSync} from 'node:fs';
import {simulateFoundersPolicies} from '../src/founders-policy-lab.ts';
const versions=['1-1','1-2'];
const exploratory=process.argv.includes('--explore');
const seeds=exploratory?[12345,67890,54321]:[44009,77123,180031,900001,314159];
const report={kind:exploratory?'exploratory':'held-out',seeds,runsPerSeed:120,
 caution:'Synthetic agents, not human win probabilities. Same six goals and initial resources in both versions. Agents prefer immediate directional gauge gains; they do not anticipate unlocks or negotiate freely.',versions:{}};
for(const version of versions){
 const story=JSON.parse(readFileSync(new URL(`../content/founders-hybrid-demo-v${version}.json`,import.meta.url)));
 const modes={};
 for(const mode of ['prudent','ambitieux','mixte']){
  const f=Object.fromEntries('ABCDEF'.split('').map(id=>[id,{wins:0,points:0,goalPoints:0,minRelevant:50,maxRelevant:0}]));
  let completed=0,failed=0;const coverage=new Set();
  for(const seed of seeds){
   const r=simulateFoundersPolicies(story,{mode,seed,runs:120,includeSamples:true});
   completed+=r.completed;failed+=r.failed;
   for(const id of 'ABCDEF'){
    f[id].wins+=r.families[id].wins;f[id].points+=r.families[id].meanPoints*r.completed;f[id].goalPoints+=r.families[id].meanGoalPoints*r.completed;
   }
   for(const sample of r.samples)for(const row of sample.ranking){
    const relevant=sample.trace.filter(t=>{coverage.add(t.id);const d=story.dilemmas.find(d=>d.id===t.id);return Object.values(d.outcomes).some(o=>o.effects.some(e=>e.indicator===row.goal.indicator));}).length;
    f[row.family].minRelevant=Math.min(f[row.family].minRelevant,relevant);f[row.family].maxRelevant=Math.max(f[row.family].maxRelevant,relevant);
   }
  }
  for(const row of Object.values(f)){row.winPercent=+(100*row.wins/completed).toFixed(2);row.meanPoints=+(row.points/completed).toFixed(2);row.meanGoalPoints=+(row.goalPoints/completed).toFixed(2);delete row.points;delete row.goalPoints;}
  modes[mode]={completed,failed,coverage:[...coverage].sort(),families:f};
 }
 report.versions[version]=modes;
}
const path=`docs/fondateurs-hybrid-balance-${report.kind}.json`;
writeFileSync(path,JSON.stringify(report,null,2)+'\n');
for(const [v,modes]of Object.entries(report.versions))for(const [mode,r]of Object.entries(modes))console.log(v,mode,r.completed,r.failed,Object.fromEntries(Object.entries(r.families).map(([id,f])=>[id,[f.winPercent,f.meanPoints,f.minRelevant]])));
console.log(path);
