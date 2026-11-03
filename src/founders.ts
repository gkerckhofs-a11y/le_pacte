/**
 * LE PACTE — isolated Founders voting-domain prototype.
 * No imports from the territorial engine; no persistence, HTTP or authorization here.
 * All functions are pure and validate their inputs.
 * Test-only ruleset: 6 families, one political vote per family, variable team size.
 */
export const FOUNDERS = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F']);
const fail = (m) => {throw new Error(m);};
const requireThat = (ok,m) => { if (!ok) fail(m); };
const clone = (x) => structuredClone(x);
const validFamily = (id) => FOUNDERS.includes(id);
const at = (id) => FOUNDERS.indexOf(id);
const prev = (id) => FOUNDERS[(at(id)+FOUNDERS.length-1)%FOUNDERS.length];
const next = (id) => FOUNDERS[(at(id)+1)%FOUNDERS.length];
const integer = (n,min,max=Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(n)&&n>=min&&n<=max;
const selections = new Set(['pour','contre','passe_pouvoir','passe_moderateur']);

export const FOUNDERS_DEFAULT_CALIBRATION=Object.freeze({
 initialPower:8,initialDollars:10,initialPool:3,
 city:{economie:5,securite:5,satisfaction:5,bien_etre:5,developpement:5,stabilite:5}
});
export function validateFoundersCalibration(settings){
 const errors=[],allowed=['initialPower','initialDollars','initialPool','city'];
 if(!settings||typeof settings!=='object'||Array.isArray(settings))return ['Calibrage invalide'];
 if(Object.keys(settings).some(k=>!allowed.includes(k)))errors.push('Champ de calibrage non autorisé');
 if(!integer(settings.initialPower,1,30))errors.push('Influence initiale : 1 à 30');
 if(!integer(settings.initialDollars,0,100))errors.push('Dollars initiaux : 0 à 100');
 if(!integer(settings.initialPool,0,100))errors.push('Réserve commune : 0 à 100');
 const names=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
 if(!settings.city||typeof settings.city!=='object'||Array.isArray(settings.city)||
    Object.keys(settings.city).some(k=>!names.includes(k)))errors.push('Jauges initiales invalides');
 else for(const name of names)if(!integer(settings.city[name],0,10))errors.push('Jauge '+name+' : 0 à 10');
 return errors;
}
export function createFoundersGame({members=[5,5,5,5,5,5],leader='A',moderator='F',calibration=FOUNDERS_DEFAULT_CALIBRATION}={}) {
 requireThat(Array.isArray(members)&&members.length===6&&members.every(n=>integer(n,1,300)), 'Six effectifs positifs obligatoires');
 requireThat(validFamily(leader)&&validFamily(moderator),'Meneur ou modérateur inconnu');
 const errors=validateFoundersCalibration(calibration);
 requireThat(!errors.length,errors.join(' ; '));
 const powerSupply=6*calibration.initialPower+calibration.initialPool;
 return {
  ruleset:'founders-v2-prototype',
  families:Object.fromEntries(FOUNDERS.map((id,i)=>[id,{members:members[i],power:calibration.initialPower,dollars:calibration.initialDollars}])),
  pool:calibration.initialPool,powerSupply,leader,moderator,vote:null,
  history:[],transactions:[],city:clone(calibration.city)
 };
}
export function totalPower(s) {return s.pool+FOUNDERS.reduce((n,id)=>n+s.families[id].power,0)+(s.vote?FOUNDERS.reduce((n,id)=>n+(s.vote.bids[id]||0),0):0);}
/** V2.6 sessions created before configurable supplies used exactly 51 Influence. */
export function expectedFoundersPowerSupply(s){return Number.isSafeInteger(s.powerSupply)?s.powerSupply:51;}
export function totalDollars(s) {return FOUNDERS.reduce((n,id)=>n+s.families[id].dollars,0);}
export function openFoundersDilemma(input,id) {
 requireThat(input.vote===null&&typeof id==='string'&&/^[A-Z0-9_-]{1,40}$/.test(id),'Dilemme invalide ou vote actif');
 const s=clone(input);
 s.vote={id,phase:'voting',turn:s.leader,choices:{},bids:{},moderatorClaimed:false,steps:[],resolution:null};
 return s;
}
export function transferFoundersDollars(input,from,to,amount,reason) {
 requireThat(validFamily(from)&&validFamily(to)&&from!==to,'Familles invalides');
 requireThat(integer(amount,1)&&amount<=input.families[from].dollars,'Fonds insuffisants');
 requireThat(typeof reason==='string'&&reason.trim().length>=1&&reason.length<=300,'Objet de transaction obligatoire');
 // Caller must only invoke this AFTER bilateral confirmation in authenticated app layer.
 const s=clone(input);s.families[from].dollars-=amount;s.families[to].dollars+=amount;
 s.transactions.push({from,to,amount,reason,voteId:s.vote?.id??null});return s;
}
function complete(s,winner,leaderChoice=null) {
 const v=s.vote;
 requireThat(v.phase==='await_moderator'||v.phase==='voting'||v.phase==='await_leader','Vote non résoluble');
 requireThat(['pour','contre'].includes(winner),'Décision invalide');
 const passes=FOUNDERS.filter(id=>v.choices[id]==='passe_pouvoir');
 const candidates=FOUNDERS.filter(id=>v.choices[id]===winner);
 let newLeader=s.leader;
 if(candidates.length===0) newLeader=s.moderator; // all passed: moderator bears responsibility
 else if(v.choices[newLeader]!==winner) {
  const biggest=Math.max(...candidates.map(id=>v.bids[id]));
  const tied=candidates.filter(id=>v.bids[id]===biggest);
  if(tied.length>1 && !leaderChoice){v.phase='await_leader';v.pendingWinner=winner;v.pendingLeaderChoices=tied;return s;}
  requireThat(tied.includes(leaderChoice)||tied.length===1,'Meneur final invalide');
  newLeader=tied.length===1?tied[0]:leaderChoice;
 }
 const oldPool=s.pool;const each=passes.length?Math.floor(oldPool/passes.length):0;
 s.pool-=each*passes.length;
 for(const id of passes)s.families[id].power+=each;
 for(const id of FOUNDERS){
  const choice=v.choices[id];const wager=v.bids[id]||0;
  if(choice===winner)s.pool+=wager;
  else if(choice==='pour'||choice==='contre')s.families[id].power+=wager;
 }
 s.leader=newLeader;
 const yes=FOUNDERS.reduce((n,id)=>n+(v.choices[id]==='pour'?(v.bids[id]||0):0),0);
 const no=FOUNDERS.reduce((n,id)=>n+(v.choices[id]==='contre'?(v.bids[id]||0):0),0);
 const result={id:v.id,winner,yes,no,poolBefore:oldPool,poolAfter:s.pool,recapturedPerPassingTeam:each,
  leader:s.leader,moderator:s.moderator,choices:clone(v.choices),bids:clone(v.bids),steps:clone(v.steps)};
 s.history.push(result);s.vote=null;
 requireThat(totalPower(s)===expectedFoundersPowerSupply(s),'Invariant Influence violé');
 return s;
}
export function castFoundersAction(input,id,action) {
 const s=clone(input),v=s.vote;
 requireThat(v&&v.phase==='voting'&&v.turn===id,'Ce porte-parole n’a pas la main');
 requireThat(action&&typeof action==='object'&&typeof action.kind==='string','Action invalide');
 const prior=v.choices[id];const kind=action.kind;
 if(prior===undefined){
  requireThat(selections.has(kind),'Premier vote invalide');
  if(kind==='pour'||kind==='contre'){
   requireThat(integer(action.amount,1)&&action.amount<=s.families[id].power,'Mise invalide');
   s.families[id].power-=action.amount;v.bids[id]=action.amount;v.choices[id]=kind;
  } else {
   requireThat(action.amount===undefined||action.amount===0,'Abstention sans mise');
   if(kind==='passe_moderateur'){
    requireThat(!v.moderatorClaimed,'Modérateur déjà revendiqué pendant ce vote');
    v.moderatorClaimed=true;s.moderator=id;
   }
   v.choices[id]=kind;s.families[id].dollars+=1;
  }
 } else if(kind==='maintien'){
  requireThat(action.amount===undefined||action.amount===0,'Maintien sans mise');
 } else if(kind==='augmenter'){
  requireThat(prior==='pour'||prior==='contre','Une abstention ne peut pas changer de position');
  requireThat(integer(action.amount,1)&&action.amount<=s.families[id].power,'Surenchère invalide');
  s.families[id].power-=action.amount;v.bids[id]+=action.amount;
 } else fail('Un vote est définitif : seule une surenchère dans le même camp est admise');
 const current=v.bids[id]||0;
 if(current>0&&FOUNDERS.every(other=>other===id||current>(v.bids[other]||0)))s.leader=id;
 v.steps.push({family:id,kind,amount:action.amount||0,leaderAfter:s.leader});
 if(id===prev(s.leader)) {
  const yes=FOUNDERS.reduce((n,f)=>n+(v.choices[f]==='pour'?(v.bids[f]||0):0),0);
  const no=FOUNDERS.reduce((n,f)=>n+(v.choices[f]==='contre'?(v.bids[f]||0):0),0);
  if(yes===no) {v.phase='await_moderator';v.turn=null;return s;}
  return complete(s,yes>no?'pour':'contre');
 }
 v.turn=next(id);
 requireThat(totalPower(s)===expectedFoundersPowerSupply(s),'Invariant Influence violé');
 return s;
}
export function moderatorResolveFoundersTie(input,id,winner) {
 requireThat(input.vote?.phase==='await_moderator'&&id===input.moderator,'Seul le Modérateur peut départager');
 return complete(clone(input),winner);
}
export function moderatorChooseFoundersLeader(input,id,leader) {
 requireThat(input.vote?.phase==='await_leader'&&id===input.moderator,'Seul le Modérateur choisit le nouveau Meneur');
 requireThat(input.vote.pendingLeaderChoices.includes(leader),'Cette famille ne peut pas être Meneur');
 return complete(clone(input),input.vote.pendingWinner,leader);
}
export function applyFoundersCityEffects(input,effects) {
 requireThat(!input.vote&&Array.isArray(effects),'Effets uniquement après le vote');
 const s=clone(input);
 for(const e of effects){
  requireThat(e&&Object.hasOwn(s.city,e.resource),'Ressource de la ville inconnue');
  const current=s.city[e.resource];
  if(e.kind==='delta'){
   requireThat(integer(e.amount,-10,10),'Delta entier requis');
   s.city[e.resource]=Math.max(0,Math.min(10,current+e.amount));
  } else if(e.kind==='toward_center'){
   requireThat(e.resource==='stabilite','Centrage réservé à la Stabilité');
   s.city.stabilite=current===5?5:current+(current<5?1:-1);
  } else if(e.kind==='away_from_center'){
   requireThat(e.resource==='stabilite','Déséquilibre réservé à la Stabilité');
   s.city.stabilite=Math.max(0,Math.min(10,current+(current<=5?-1:1)));
  } else fail('Type d’effet inconnu');
 }
 return s;
}
