import {ARCHETYPES, ZONES, NEIGHBORS, RULESET, value} from './map.ts';
import type {TeamId} from './map.ts';
export type Order = {kind:'conquer';target:string;reinforce:number} | {kind:'support';target:string;beneficiary:TeamId;mode:'attack'|'defense'} | {kind:'fortify';target:string} | {kind:'invest';resource:'means'|'influence'} | {kind:'stabilize'} | {kind:'pass'};
export type Vote = {choice:'A'|'B'|null;spend:number};
export type Team = {means:number;influence:number;prestige:number;goal:string;priority:number;decisive:number;winningCouncils:number;enemyConquests:number};
export type State = {ruleset:string;round:number;stability:number;teams:Record<TeamId,Team>;owners:Record<string,TeamId|null>;startOwners:Record<string,TeamId|null>;orders:Partial<Record<TeamId,Order[]>>;votes:Partial<Record<TeamId,Vote>>;alliances:[TeamId,TeamId][];commerceUsed:TeamId[];intel:Partial<Record<TeamId,TeamId>>;law:string|null;nextLaw:string|null;resolved:boolean;finished:boolean;results:RoundResult[]};
export type Battle = {target:string;before:TeamId|null;after:TeamId|null;resistance:number;attacks:{team:TeamId;power:number}[]};
export type RoundResult = {round:number;battles:Battle[];decisive:TeamId[];council:'A'|'B'|null;law:string|null;territorial:Record<TeamId,number>;stability:number};
const clone = <T>(s:T):T => structuredClone(s);
const assert = (b:unknown,m:string):void => { if(!b) throw new Error(m); };
const team = (id:unknown):id is TeamId => ARCHETYPES.includes(id as TeamId);
const integer=(n:unknown,min:number,max:number)=>Number.isInteger(n)&&Number(n)>=min&&Number(n)<=max;
const cap=(t:Team)=>{t.means=Math.min(8,t.means);t.influence=Math.min(5,t.influence);};
const owned=(s:State,id:TeamId,owners=s.owners)=>ZONES.filter(z=>owners[z]===id);
const adjacent=(s:State,id:TeamId,z:string)=>owned(s,id,s.startOwners).some(a=>NEIGHBORS[a].includes(z));
const lawFor = (round:number,choice:'A'|'B'|null) => choice?[
 ['M1_LOGISTICS','M1_LOCAL_DEFENSE'],['M2_NEUTRAL_EXPANSION','M2_SITE_DEFENSE'],['M3_SUPPORT_BOOST','M3_RESERVE'],['M4_SITE_OFFENSE','M4_SITE_FORTRESS'],['M5_REPAIR','M5_MOBILIZATION']
][round-1][choice==='A'?0:1]:null;
export function createGame(goals:string[],priorities:number[]):State {
 assert(goals.length===6&&new Set(goals).size===6&&goals.every(g=>/^O[1-6]$/.test(g)),'Six objectifs uniques requis');
 assert(priorities.length===6&&new Set(priorities).size===6&&priorities.every(p=>integer(p,1,6)),'Six priorités uniques requises');
 const owners=Object.fromEntries(ZONES.map(z=>[z,/^[CP]/.test(z)?ARCHETYPES[Number(z.slice(1))-1]:null]));
 return {ruleset:RULESET,round:0,stability:4,teams:Object.fromEntries(ARCHETYPES.map((id,i)=>[id,{means:3,influence:2,prestige:0,goal:goals[i],priority:priorities[i],decisive:0,winningCouncils:0,enemyConquests:0}])) as State['teams'],owners,startOwners:clone(owners),orders:{},votes:{},alliances:[],commerceUsed:[],intel:{},law:null,nextLaw:null,resolved:true,finished:false,results:[]};
}
export function beginRound(input:State):State {
 assert(input.resolved&&!input.finished&&input.round<5,'Manche précédente non résolue ou partie terminée');
 const s=clone(input);s.round++;s.stability=Math.max(0,s.stability-1);s.law=s.nextLaw;s.nextLaw=null;s.startOwners=clone(s.owners);s.orders={};s.votes={};s.alliances=[];s.commerceUsed=[];s.intel={};s.resolved=false;
 for(const id of ARCHETYPES) {const t=s.teams[id];t.means+=1+Math.min(2,owned(s,id).filter(z=>/^[PNM]/.test(z)).length)+(['M1_LOGISTICS','M3_RESERVE'].includes(s.law??'')?1:0);t.influence++;cap(t);}
 return s;
}
export function validateOrders(s:State,id:TeamId,orders:Order[]):number {
 assert(team(id)&&s.round>0&&!s.resolved&&!s.finished,'Manche inactive');assert(Array.isArray(orders)&&orders.length<=2,'Deux ordres maximum');
 let cost=0;const targets=new Set<string>();
 for(const o of orders) {
  assert(o&&typeof o==='object','Ordre invalide');
  if('target' in o) {assert(ZONES.includes(o.target)&&!o.target.startsWith('C'),'Cible invalide ou capitale');const k=o.kind+o.target;assert(!targets.has(k),'Cible répétée pour cet ordre');targets.add(k);}
  switch(o.kind) {
   case 'conquer':assert(s.startOwners[o.target]!==id&&adjacent(s,id,o.target),'Conquête non adjacente ou déjà possédée');assert(integer(o.reinforce,0,2),'Renfort invalide');cost+=1+o.reinforce;break;
   case 'support':assert(team(o.beneficiary)&&o.beneficiary!==id&&['attack','defense'].includes(o.mode)&&adjacent(s,id,o.target),'Soutien invalide');break;
   case 'fortify':assert(s.startOwners[o.target]===id,'Fortification hors de votre territoire');break;
   case 'invest':assert(['means','influence'].includes(o.resource),'Ressource invalide');break;
   case 'stabilize':cost++;break;
   case 'pass':break;
   default:throw new Error('Ordre inconnu');
  }
 }
 assert(cost<=s.teams[id].means,'Moyens insuffisants : les investissements sont différés');return cost;
}
export function lockOrders(input:State,id:TeamId,orders:Order[]):State {
 assert(!input.orders[id],'Ordres déjà verrouillés');const cost=validateOrders(input,id,orders);const s=clone(input);s.teams[id].means-=cost;s.orders[id]=clone(orders);return s;
}
export function castCouncil(input:State,id:TeamId,v:Vote):State {
 assert(team(id)&&!input.resolved&&input.round>0&&!input.votes[id],'Vote fermé ou déjà enregistré');
 assert(v&&[null,'A','B'].includes(v.choice)&&integer(v.spend,0,2)&&v.spend<=input.teams[id].influence&&(v.choice!==null||v.spend===0),'Vote invalide');
 const s=clone(input);s.teams[id].influence-=v.spend;s.votes[id]=clone(v);return s;
}
export const voices=(id:TeamId,spend:number)=>Math.min(3,1+(id==='pouvoir'?1:0)+spend);
export function resolveRound(input:State):State {
 if(input.resolved) return clone(input);
 assert(input.round>=1&&input.round<=5&&!input.finished,'Manche invalide');
 const s=clone(input);
 const attacks:{team:TeamId;target:string;power:number}[]=[];
 const supports:{team:TeamId;target:string;beneficiary:TeamId;mode:string;power:number}[]=[];
 const forts=new Set<string>();
 for(const id of ARCHETYPES) {
  let firstAttack=true,firstSupport=true;
  for(const o of s.orders[id]??[]) {
   if(o.kind==='conquer') {
    const force=id==='force'&&firstAttack&&(s.startOwners[o.target]!==null||o.target.startsWith('S'))?1:0;firstAttack=false;
    const law=(s.law==='M2_NEUTRAL_EXPANSION'&&s.startOwners[o.target]===null&&!o.target.startsWith('S'))||(s.law==='M4_SITE_OFFENSE'&&o.target.startsWith('S'))?1:0;
    attacks.push({team:id,target:o.target,power:2+o.reinforce+force+law});
   }
   if(o.kind==='support') {const allied=s.alliances.some(p=>p.includes(id)&&p.includes(o.beneficiary));supports.push({team:id,target:o.target,beneficiary:o.beneficiary,mode:o.mode,power:(allied?2:1)+(id==='diplomatie'&&firstSupport?1:0)+(s.law==='M3_SUPPORT_BOOST'?1:0)});firstSupport=false;}
   if(o.kind==='fortify')forts.add(o.target);
  }
 }
 const battle=(z:string,excluded=-1):Battle=>{
  const before=s.startOwners[z];
  const effective=supports.filter((o,i)=>i!==excluded&&o.target===z);
  let resistance=z.startsWith('S')?5:before===null?1:3;
  resistance+=(forts.has(z)?2:0)+(z.startsWith('S')&&['M2_SITE_DEFENSE','M4_SITE_FORTRESS'].includes(s.law??'')?1:0)+(!z.startsWith('S')&&before!==null&&s.law==='M1_LOCAL_DEFENSE'?1:0);
  resistance+=effective.filter(o=>o.mode==='defense'&&o.beneficiary===before).reduce((n,o)=>n+o.power,0);
  const contenders=attacks.filter(a=>a.target===z).map(a=>({team:a.team,power:a.power+effective.filter(o=>o.mode==='attack'&&o.beneficiary===a.team).reduce((n,o)=>n+o.power,0)})).sort((a,b)=>b.power-a.power||ARCHETYPES.indexOf(a.team)-ARCHETYPES.indexOf(b.team));
  const best=contenders[0];const after=best&&best.power>resistance&&(!contenders[1]||best.power>contenders[1].power)?best.team:before;
  return {target:z,before,after,resistance,attacks:contenders};
 };
 const battles=[...new Set(attacks.map(a=>a.target))].sort().map(z=>battle(z));
 const decisive=new Set<TeamId>();
 for(const b of battles) {
  s.owners[b.target]=b.after;
  if(b.after!==b.before&&b.after!==null&&b.before!==null)s.teams[b.after].enemyConquests++;
  // A defensive support preserving the original owner may also be decisive.
  if(b.before!==null||b.target.startsWith('S'))supports.forEach((o,i)=>{if(o.target===b.target&&battle(b.target,i).after!==b.after)decisive.add(o.team);});
 }
 for(const id of ARCHETYPES) {
  let firstMeans=true;
  for(const o of s.orders[id]??[]) {
   if(o.kind==='invest'){if(o.resource==='means'){s.teams[id].means+=id==='industrie'&&firstMeans?3:2;firstMeans=false;}else s.teams[id].influence++;cap(s.teams[id]);}
   if(o.kind==='stabilize')s.stability=Math.min(6,s.stability+1);
  }
  if(decisive.has(id)){s.teams[id].prestige++;s.teams[id].decisive++;}
 }
 const totals={A:0,B:0};for(const id of ARCHETYPES){const v=s.votes[id];if(v?.choice)totals[v.choice]+=voices(id,v.spend);}
 const council=totals.A===totals.B?null:totals.A>totals.B?'A':'B';const law=lawFor(s.round,council);
 for(const id of ARCHETYPES){const v=s.votes[id];if(council&&v?.choice===council&&v.spend>=1)s.teams[id].winningCouncils++;}
 if(s.round<5)s.nextLaw=law;
 else if(law==='M5_REPAIR')s.stability=Math.min(6,s.stability+2);
 else if(law==='M5_MOBILIZATION')for(const id of ARCHETYPES){s.teams[id].influence++;cap(s.teams[id]);}
 const territorial=Object.fromEntries(ARCHETYPES.map(id=>[id,s.stability>0?Math.min(4,owned(s,id).reduce((n,z)=>n+value(z),0)):0])) as Record<TeamId,number>;
 for(const id of ARCHETYPES)s.teams[id].prestige+=territorial[id];
 s.results.push({round:s.round,battles,decisive:ARCHETYPES.filter(id=>decisive.has(id)),council,law,territorial,stability:s.stability});s.resolved=true;s.alliances=[];return s;
}
export function goalMet(s:State,id:TeamId):boolean {
 const t=s.teams[id],zones=owned(s,id);
 switch(t.goal){case 'O1':return zones.some(z=>z.startsWith('S'));case 'O2':return zones.filter(z=>/^[PNM]/.test(z)).length>=3;case 'O3':return zones.filter(z=>z.startsWith('F')).length>=2;case 'O4':return t.decisive>=2;case 'O5':return t.winningCouncils>=3;case 'O6':return t.enemyConquests>=3;default:return false;}
}
export function finishGame(input:State,votes:Partial<Record<TeamId,{candidate:TeamId;spend:number}>>):{state:State;ranking:TeamId[];summit:TeamId|null} {
 assert(input.round===5&&input.resolved&&!input.finished,'Cinq manches résolues requises');const s=clone(input),totals=Object.fromEntries(ARCHETYPES.map(id=>[id,0])) as Record<TeamId,number>;
 assert(Object.keys(votes).every(team),'Équipe invalide');
 for(const id of ARCHETYPES){const v=votes[id];if(v){assert(team(v.candidate)&&integer(v.spend,0,2)&&v.spend<=s.teams[id].influence,'Vote Sommet invalide');s.teams[id].influence-=v.spend;totals[v.candidate]+=voices(id,v.spend);}if(goalMet(s,id))s.teams[id].prestige+=4;}
 const max=Math.max(...Object.values(totals)),leaders=ARCHETYPES.filter(id=>totals[id]===max);const summit=max>0&&leaders.length===1?leaders[0]:null;if(summit)s.teams[summit].prestige+=2;
 const tuple=(id:TeamId)=>{const t=s.teams[id],zs=owned(s,id);return[t.prestige,zs.filter(z=>z.startsWith('S')).length,t.decisive,zs.filter(z=>/^[PNM]/.test(z)).length,t.influence,t.means,-t.priority];};
 const ranking=[...ARCHETYPES].sort((a,b)=>{const aa=tuple(a),bb=tuple(b);for(let i=0;i<aa.length;i++)if(aa[i]!==bb[i])return bb[i]-aa[i];return 0;});s.finished=true;return {state:s,ranking,summit};
}
export function publicView(s:State) {return {ruleset:s.ruleset,round:s.round,stability:s.stability,owners:clone(s.owners),alliances:clone(s.alliances),locked:ARCHETYPES.filter(id=>s.orders[id]).length,teams:ARCHETYPES.map(id=>({id,prestige:s.teams[id].prestige,priority:s.teams[id].priority})),results:clone(s.results),...(s.finished?{goals:ARCHETYPES.map(id=>({id,goal:s.teams[id].goal,met:goalMet(s,id)}))}:{})};}
export function teamView(s:State,id:TeamId) {assert(team(id),'Équipe inconnue');return {...publicView(s),self:{...clone(s.teams[id]),orders:clone(s.orders[id]??null),vote:clone(s.votes[id]??null),intel:s.intel[id]?{team:s.intel[id],goal:s.teams[s.intel[id]!].goal}:null}};}
