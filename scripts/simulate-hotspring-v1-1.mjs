import {calculateHotspringStability,HOTSPRING_INDICATORS} from '../src/founders-hotspring.ts';
import {simulateCampaign,trajectories} from '../test/helpers/hotspring.mjs';

const runs=Number(process.argv[2]??120);
if(!Number.isInteger(runs)||runs<1)throw new Error('Indiquer un nombre entier positif de campagnes');
const scenarioVersion=process.argv[3]??'1.1.0';
if(!['1.1.0','1.2.0'].includes(scenarioVersion))throw new Error('Choisir la version 1.1.0 ou 1.2.0');
const owners={economie:'A',ecologie:'E',securite:'C',bien_etre:'B',demographie:'D'};
const seed=0x48535052;
let randomState=seed;
function random(){
 randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;
 return randomState/2**32;
}
const ids=Array.from({length:29},(_,i)=>'D'+String(i+1).padStart(2,'0')).flatMap(id=>
 ['D14','D26'].includes(id)?[id+'A',id+'B']:[id]);
const keys=[...HOTSPRING_INDICATORS,'stabilite'];
const readCity=city=>({...city,stabilite:calculateHotspringStability(city)});
const canonical=Object.fromEntries(Object.entries(trajectories).map(([name,policy])=>{
 const {state}=simulateCampaign(policy,{scenarioVersion});
 return [name,{city:readCity(state.game.city),charter:state.campaign.charter,
  successfulFamilies:state.finalResults.rows.filter(row=>row.trajectory===2).map(row=>row.family).sort()}];
}));
const cities=[],reached=[],pointsByRun=[];
for(let index=0;index<runs;index++){
 const {state}=simulateCampaign({approve:ids.filter(()=>random()<0.5),
  chooseCharter:eligible=>eligible[Math.floor(random()*eligible.length)]},{scenarioVersion});
 cities.push(readCity(state.game.city));
 pointsByRun.push(state.finalResults.rows.filter(row=>row.trajectory===2).map(row=>row.family));
 reached.push(readCity(state.campaign.initialCity),...state.revealedHistory.map(record=>readCity(record.cityAfter)));
}
const indicators=Object.fromEntries(keys.map(key=>{
 const finals=cities.map(city=>city[key]),all=reached.map(city=>city[key]);
 const above=finals.filter(v=>v>5).length,below=finals.filter(v=>v<5).length;
 return [key,{min:Math.min(...all),max:Math.max(...all),finalMin:Math.min(...finals),finalMax:Math.max(...finals),
  mean:finals.reduce((a,b)=>a+b,0)/runs,above,below,equal:runs-above-below,
  ...(key==='stabilite'?{}:{technicalSuccess:pointsByRun.filter(ids=>ids.includes(owners[key])).length/runs})}];
}));
const qualifiedPerCampaign=Object.fromEntries([2,3,4,5].map(count=>[count,pointsByRun.filter(families=>families.length===count).length]));
console.log(JSON.stringify({scenarioVersion,seed,runs,canonical,indicators,...(scenarioVersion==='1.2.0'?{qualifiedPerCampaign}:{})},null,2));
