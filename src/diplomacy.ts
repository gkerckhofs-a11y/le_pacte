import {ARCHETYPES} from './map.ts';
import type {TeamId} from './map.ts';
import type {State} from './engine.ts';
export type Transfer = {means:number;influence:number};
export type Trade = {id:string;round:number;from:TeamId;to:TeamId;give:Transfer;receive:Transfer};
// Pure domain functions. The authoritative service must enforce phase, identities,
// offer signatures, expiration, and atomic persistence of the returned state.
function active(s:State){if(s.round<1||s.resolved||s.finished)throw new Error('Manche inactive');}
function validTeam(id:TeamId){if(!ARCHETYPES.includes(id))throw new Error('Équipe inconnue');}
export function executeTrade(input:State,offer:Trade):State {
 active(input);validTeam(offer.from);validTeam(offer.to);
 if(offer.from===offer.to||offer.round!==input.round||!offer.id)throw new Error('Échange invalide');
 for(const t of [offer.give,offer.receive])for(const k of ['means','influence'] as const)if(!Number.isSafeInteger(t[k])||t[k]<0)throw new Error('Transfert entier positif requis');
 const s=structuredClone(input),a=s.teams[offer.from],b=s.teams[offer.to];
 for(const k of ['means','influence'] as const){
  if(a[k]<offer.give[k]||b[k]<offer.receive[k])throw new Error('Stock insuffisant');
  const aa=a[k]-offer.give[k]+offer.receive[k],bb=b[k]-offer.receive[k]+offer.give[k],max=k==='means'?8:5;
  if(aa>max||bb>max)throw new Error('Plafond dépassé');a[k]=aa;b[k]=bb;
 }
 if(offer.give.means+offer.give.influence>0&&offer.receive.means+offer.receive.influence>0&&[offer.from,offer.to].includes('commerce')&&!s.commerceUsed.includes('commerce')){s.teams.commerce.means=Math.min(8,s.teams.commerce.means+1);s.commerceUsed.push('commerce');}
 return s;
}
export function signAlliance(input:State,a:TeamId,b:TeamId):State {
 active(input);validTeam(a);validTeam(b);
 if(a===b||input.orders[a]||input.orders[b]||input.alliances.some(p=>p.includes(a)||p.includes(b)))throw new Error('Alliance impossible');
 const s=structuredClone(input);s.alliances.push([a,b].sort((x,y)=>ARCHETYPES.indexOf(x)-ARCHETYPES.indexOf(y)) as [TeamId,TeamId]);return s;
}
export function endAlliance(input:State,id:TeamId):State {
 active(input);validTeam(id);const pair=input.alliances.find(p=>p.includes(id));
 if(pair?.some(t=>input.orders[t]))throw new Error('Alliance figée au verrouillage');
 const s=structuredClone(input);s.alliances=s.alliances.filter(p=>!p.includes(id));return s;
}
export function inspectGoal(input:State,target:TeamId):State {
 active(input);validTeam(target);if(target==='renseignement'||input.intel.renseignement)throw new Error('Renseignement déjà utilisé ou cible invalide');
 const s=structuredClone(input);s.intel.renseignement=target;return s;
}
