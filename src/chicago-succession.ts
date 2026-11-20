import {activeFounders} from './founders.ts';
import {hasChicagoSuccession} from './founders-chicago.ts';

function requireRule(condition, message) {
 if (!condition) throw new Error(message);
}
const clone = structuredClone;
export const openCouncil = s => ['NEGOTIATION','COUNCIL'].includes(s.phase);

export function checkpointChicago(s) {
 if (!hasChicagoSuccession(s)) return;
 const {families, pool, powerSupply, leader, moderator, transactions} = s.game;
 s.chicagoCheckpoint = {families:clone(families), pool, powerSupply, leader, moderator,
  transactionsLength:transactions.length, correctionsLength:s.corrections?.length ?? 0};
}

export function chicagoScores(s) {
 const ids = activeFounders(s.game);
 const resolved = s.revealedHistory.map((record, i) => {
  const vote = s.game.history[i];
  requireRule(record.id === vote?.id && record.winner === vote.winner, 'Historique de Conseil incohérent.');
  return {record,vote,sourceId:s.scenario.dilemmas.find(d => d.id === record.id).sourceId};
 });
 const audit = ids.map(family => {
  const ambition = s.scenario.chicago.ambitions[family];
  const gauge = ambition.indicator;
  const supports = resolved.filter(({record,vote}) => record.cityAfter[gauge] > record.cityBefore[gauge] &&
   vote.choices[family] === vote.winner && vote.bids[family] > 0).map(e => e.sourceId);
  const pivots = resolved.flatMap(({sourceId,vote}) => {
   const slot = ambition.major_slots.find(([id]) => id === sourceId);
   return slot ? [{id:sourceId,favorable:slot[1] === vote.winner.toUpperCase()}] : [];
  });
  return {family,gauge,supports,pivots,value:s.game.city[gauge]};
 });
 const common = Math.min(...audit.map(row => row.pivots.length));
 return audit.map(row => {
  const favorable = row.pivots.slice(0, common).filter(p => p.favorable).length;
  const major = common > 0 && favorable >= Math.ceil(2 * common / 3) ? 5 : 0;
  const small = row.supports.length >= 2 ? 2 : 0, medium = row.value >= 60 ? 3 : 0;
  return {...row,common,required:Math.ceil(2 * common / 3),favorable,small,medium,major,secret:small+medium+major};
 });
}

function stage(s, name, now) {
 s.succession.stage = name;
 s.succession.audit.push({stage:name,at:now});
}
export function freezeChicago(s, now) {
 requireRule(hasChicagoSuccession(s) && !s.succession && !s.game.vote,'Gel de la Commission indisponible.');
 const last = s.game.history.at(-1);
 s.succession = {audit:[],rounds:[], frozen:{at:now,city:clone(s.game.city),resources:clone(s.game.families),
  resolved:s.game.history.map(v => v.id),roles:last ? {mayor:last.leader,commissioner:last.moderator} : {},
  scores:chicagoScores(s)},request:s.chicagoRequest ?? {mode:'fin du parcours',at:now}};
 delete s.chicagoRequest;
 delete s.chicagoCheckpoint;
 s.phase = 'SUCCESSION';
 s.lastReveal = null;
 s.clock = {phase:s.phase,paused:false,deadline:null,remainingMs:null};
 stage(s,'negotiations',now);
}

function requestFinale(s, data, now) {
 requireRule(data.confirm === true && !s.succession && s.phase !== 'FINISHED','Confirmation de la succession requise.');
 if (openCouncil(s)) {
  requireRule(['finish','interrupt'].includes(data.mode),'Choisissez de terminer ou d’interrompre le Conseil.');
  if (data.mode === 'finish') {
   requireRule(!s.chicagoRequest,'La finale est déjà demandée.');
   s.chicagoRequest = {mode:'finish',council:s.currentDilemmaId,at:now};
   return;
  }
  const b = s.chicagoCheckpoint;
  requireRule(b, 'Instantané du Conseil introuvable.');
  const {transactionsLength,correctionsLength,...resources} = b;
  const offers = Object.values(s.offers).filter(o => o.councilNumber === s.game.history.length);
  s.chicagoRequest = {mode:'interrupt',council:s.currentDilemmaId,at:now,
   offers:offers.map(o => ({id:o.id,status:o.status})),bids:clone(s.game.vote?.bids ?? {}),
   transactions:clone(s.game.transactions.slice(transactionsLength)),
   corrections:clone(s.corrections?.slice(correctionsLength) ?? [])};
  Object.assign(s.game,clone(resources),{vote:null});
  s.game.transactions.length = transactionsLength;
  if (s.corrections) s.corrections.length = correctionsLength;
  for (const offer of offers) offer.status = 'cancelled';
 } else {
  requireRule(['READY','REVEALED'].includes(s.phase), 'Finale indisponible.');
  s.chicagoRequest = {mode:'immediate',at:now};
 }
 freezeChicago(s,now);
}

function newRound(s, candidates, now) {
 const f = s.succession;
 const round = {number:f.rounds.length+1,candidates:[...candidates],votes:{},openedAt:now,closedAt:null};
 f.rounds.push(round);
 stage(s,'ballot',now);
}
function chooseWinner(s, id, reason, now) {
 s.succession.winner = id;
 s.succession.reason = reason;
 stage(s,'sealed',now);
}
function resolveRound(s, now) {
 const f = s.succession, round = f.rounds.at(-1);
 const counts = Object.fromEntries(round.candidates.map(c => [c,Object.values(round.votes).filter(v => v === c).length]));
 round.closedAt = now;
 round.counts = counts;
 f.audit.push({stage:'verrouillage',round:round.number,at:now});
 if (round.number === 1) {
  f.ranking = f.frozen.scores.map(r => ({family:r.family,small:r.small,medium:r.medium,major:r.major,secret:r.secret,
   favorable:r.favorable,support:counts[r.family],total:r.secret+2*counts[r.family]}));
  f.ranking.sort((a,b) => b.total-a.total || b.support-a.support || b.favorable-a.favorable ||
   s.initiativeOrder.indexOf(a.family)-s.initiativeOrder.indexOf(b.family));
  const top = f.ranking[0];
  const tied = f.ranking.filter(r => r.total===top.total && r.support===top.support && r.favorable===top.favorable).map(r=>r.family);
  if (tied.length === 1) return chooseWinner(s,top.family,'Score, soutiens électoraux puis pivots comptabilisés',now);
  const roles = f.frozen.roles;
  for (const [role,id] of [['mayor',roles.mayor],['commissioner',roles.commissioner]]) {
   if (id && !tied.includes(id)) {
    f.arbitration = {role,holder:id,candidates:tied};
    stage(s,'arbitration',now);
    return;
   }
  }
  return newRound(s,tied,now);
 }
 const sorted = [...round.candidates].sort((a,b) => counts[b]-counts[a] || s.initiativeOrder.indexOf(a)-s.initiativeOrder.indexOf(b));
 if (counts[sorted[0]] > counts[sorted[1]]) return chooseWinner(s,sorted[0],'Scrutin secret de départage',now);
 if (round.number === 2 && sorted.length > 2) return newRound(s,sorted.slice(0,2),now);
 chooseWinner(s,sorted[0],'Ordre de priorité tiré au lancement',now);
}

export const finalCommands = ['requestChicagoFinale','openChicagoBallot','castChicagoBallot','closeChicagoBallot','arbitrateChicago','revealChicago'];
export function chicagoCommand(s, actor, kind, data, now) {
 requireRule(hasChicagoSuccession(s),'Succession réservée à la campagne Chicago V3.');
 const team = ['castChicagoBallot','arbitrateChicago'].includes(kind);
 requireRule(team ? actor.role === 'team' : ['organizer','facilitator'].includes(actor.role),team?'Porte-parole uniquement.':'Régie uniquement.');
 if (kind === 'requestChicagoFinale') return requestFinale(s,data,now);
 const f = s.succession;
 requireRule(s.phase === 'SUCCESSION' && f,'Succession fermée.');
 if (kind === 'openChicagoBallot') {
  requireRule(f.stage==='negotiations','Le scrutin est déjà ouvert.');
  return newRound(s,activeFounders(s.game),now);
 }
 const round = f.rounds.at(-1);
 if (kind === 'castChicagoBallot') {
  requireRule(f.stage==='ballot' && data.round===round.number,'Ce tour est clos.');
  requireRule(data.candidate!==actor.family && round.candidates.includes(data.candidate),'Choisissez une autre famille éligible.');
  requireRule(!Object.hasOwn(round.votes,actor.family),'Votre bulletin est déjà enregistré.');
  round.votes[actor.family] = data.candidate;
 } else if (kind === 'closeChicagoBallot') {
  requireRule(f.stage==='ballot' && Object.keys(round.votes).length===activeFounders(s.game).length,'Cinq bulletins sont nécessaires pour verrouiller le scrutin.');
  resolveRound(s,now);
 } else if (kind === 'arbitrateChicago') {
  requireRule(f.stage==='arbitration' && actor.family===f.arbitration.holder && f.arbitration.candidates.includes(data.candidate),'Arbitrage indisponible.');
  chooseWinner(s,data.candidate,f.arbitration.role==='mayor'?'Arbitrage de l’Homme du Maire':'Arbitrage de l’Homme du Commissaire',now);
 } else if (kind === 'revealChicago') {
  requireRule(f.stage==='sealed','Le résultat doit être verrouillé.');
  const ranking = [f.ranking.find(r=>r.family===f.winner),...f.ranking.filter(r=>r.family!==f.winner)];
  s.finalResults = {winner:f.winner,reason:f.reason,rows:ranking.map(r=>({...r,ambition:s.scenario.chicago.ambitions[r.family].specialty,
   indicator:s.skin.labels.resources[s.scenario.chicago.ambitions[r.family].indicator]}))};
  const house = s.scenario.chicago.ambitions[f.winner].family;
  s.narrativeEnding = {title:'Le nouveau Parrain · '+s.names[f.winner],paragraphs:[s.scenario.chicago.epilogues[house]]};
  stage(s,'revealed',now);
  f.archivedAt = now;
  s.phase = 'FINISHED';
  s.clock = {phase:s.phase,paused:false,deadline:null,remainingMs:null};
 }
}

export function chicagoFinalView(s, family?) {
 const f = s.succession;
 if (!f) return {stage:s.chicagoRequest?'requested':'available'};
 const result:any = {stage:f.stage};
 const round = f.rounds.at(-1);
 if (f.stage === 'ballot') {
  result.round = round.number;
  result.received = Object.keys(round.votes).length;
  if (family) {
   result.hasVoted = Object.hasOwn(round.votes,family);
   if (!result.hasVoted) result.candidates = round.candidates.filter(id => id !== family);
  }
 }
 if (f.stage==='arbitration' && f.arbitration.holder === family) result.arbitrate = f.arbitration.candidates;
 return result;
}
