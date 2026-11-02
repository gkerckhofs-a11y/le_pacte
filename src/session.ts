import {createGame,beginRound,lockOrders,castCouncil,resolveRound,finishGame,publicView,teamView} from './engine.ts';
import type {State,Order,Vote} from './engine.ts';
import type {TeamId} from './map.ts';
import {ARCHETYPES} from './map.ts';
import {executeTrade,signAlliance,endAlliance,inspectGoal} from './diplomacy.ts';
import type {Trade} from './diplomacy.ts';
import {replayView} from './replay.ts';
import type {RevealControl} from './replay.ts';
import {editionSnapshot} from './editions.ts';
export type Phase = 'DRAFT'|'LOBBY'|'BRIEFING'|'TUTORIAL'|'RESET'|'SITUATION'|'DIPLOMACY'|'ORDERS'|'COUNCIL'|'RESOLVE'|'SUMMIT'|'RESULTS'|'ARCHIVED';
export type Actor = {role:'organizer';id:string}|{role:'team';team:TeamId};
export type Session = {reveal?:RevealControl;id:string;organizerId:string;edition:any;game:State;phase:Phase;deadline:number|null;pausedRemaining:number|null;revision:number;receipts:Record<string,{actor:string;payload:string}>;offers:Record<string,Trade>;allianceOffers:Record<string,{from:TeamId;to:TeamId}>;summitVotes:Partial<Record<TeamId,{candidate:TeamId;spend:number}>>;ranking:TeamId[];audit:{revision:number;actor:string;kind:string;at:number}[]};
export type Command = {id:string;sessionId:string;expectedPhase:Phase;expectedRound:number;kind:string;data:any};
const minutes:Partial<Record<Phase,number>>={BRIEFING:15,TUTORIAL:10,SITUATION:2,DIPLOMACY:8,ORDERS:4,COUNCIL:3,RESOLVE:3,SUMMIT:10,RESULTS:15};
const key=(a:Actor)=>a.role==='team'?`team:${a.team}`:`organizer:${a.id}`;
const requireTrue=(b:unknown,message:string)=>{if(!b)throw new Error(message);};
export function createSession(id:string,organizerId:string,edition:any,goals:string[],priorities:number[]):Session {
 requireTrue(id&&organizerId,'Identités obligatoires');
 return {id,organizerId,edition:editionSnapshot(edition),game:createGame(goals,priorities),phase:'DRAFT',deadline:null,pausedRemaining:null,revision:0,receipts:{},offers:{},allianceOffers:{},summitVotes:{},ranking:[],audit:[]};
}
function setPhase(s:Session,p:Phase,now:number){s.phase=p;s.deadline=minutes[p]?now+minutes[p]!*60000:null;}
function advance(s:Session,now:number){
 delete s.reveal;
 switch(s.phase){
  case 'DRAFT':setPhase(s,'LOBBY',now);break;
  case 'LOBBY':setPhase(s,'BRIEFING',now);break;
  case 'BRIEFING':setPhase(s,'TUTORIAL',now);break;
  case 'TUTORIAL':setPhase(s,'RESET',now);break;
  case 'RESET':s.game=beginRound(s.game);setPhase(s,'SITUATION',now);break;
  case 'SITUATION':setPhase(s,'DIPLOMACY',now);break;
  case 'DIPLOMACY':s.offers={};s.allianceOffers={};setPhase(s,'ORDERS',now);break;
  case 'ORDERS':setPhase(s,'COUNCIL',now);break;
  case 'COUNCIL':s.game=resolveRound(s.game);s.reveal={round:s.game.round,step:3};setPhase(s,'RESOLVE',now);break;
  case 'RESOLVE':if(s.game.round===5)setPhase(s,'SUMMIT',now);else{s.game=beginRound(s.game);setPhase(s,'SITUATION',now);}break;
  case 'SUMMIT':{const r=finishGame(s.game,s.summitVotes);s.game=r.state;s.ranking=r.ranking;setPhase(s,'RESULTS',now);break;}
  case 'RESULTS':setPhase(s,'ARCHIVED',now);break;
  default:throw new Error('Session archivée');
 }
}
/** Domain transaction. Host must authenticate actor, supply server time and
 * atomically compare-and-swap revision; never accept these values from a client.
 * This module is not an HTTP endpoint, auth system or persistence adapter. */
export function applyCommand(input:Session,actor:Actor,c:Command,now:number):Session {
 requireTrue(Number.isFinite(now)&&typeof c.id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(c.id)&&c.sessionId===input.id,'Commande invalide');
 requireTrue(actor.role==='organizer'?actor.id===input.organizerId:actor.role==='team'&&ARCHETYPES.includes(actor.team),'Accès refusé');
 const actorKey=key(actor),payload=JSON.stringify({kind:c.kind,data:c.data,phase:c.expectedPhase,round:c.expectedRound});
 const old=Object.hasOwn(input.receipts,c.id)?input.receipts[c.id]:undefined;
 if(old){requireTrue(old.actor===actorKey&&old.payload===payload,'Identifiant de commande réutilisé');return structuredClone(input);}
 requireTrue(c.expectedPhase===input.phase&&c.expectedRound===input.game.round,'Phase ou manche périmée');
 const s=structuredClone(input),d=c.data;
 const org=()=>requireTrue(actor.role==='organizer','Régie uniquement');
 const requirePhase=(p:Phase)=>requireTrue(s.phase===p&&s.pausedRemaining===null&&(s.deadline===null||now<s.deadline),'Phase fermée, suspendue ou délai dépassé');
 if(c.kind==='advance'){org();requireTrue(s.pausedRemaining===null,'Session suspendue');advance(s,now);}
 else if(c.kind==='replay'){org();requireTrue(d&&Number.isInteger(d.round)&&Number.isInteger(d.step),'Révélation invalide');replayView(s.game,d);s.reveal={round:d.round,step:d.step};}
 else if(c.kind==='pause'){org();requireTrue(s.deadline!==null&&s.pausedRemaining===null,'Aucun chronomètre actif');s.pausedRemaining=Math.max(0,s.deadline!-now);s.deadline=null;}
 else if(c.kind==='resume'){org();requireTrue(s.pausedRemaining!==null,'Session non suspendue');s.deadline=now+s.pausedRemaining!;s.pausedRemaining=null;}
 else {
  requireTrue(actor.role==='team','Commande équipe uniquement');const id=(actor as {role:'team';team:TeamId}).team;
  switch(c.kind){
   case 'orders':requirePhase('ORDERS');s.game=lockOrders(s.game,id,d as Order[]);break;
   case 'council':requirePhase('COUNCIL');s.game=castCouncil(s.game,id,d as Vote);break;
   case 'intel':requirePhase('SITUATION');requireTrue(id==='renseignement','Pouvoir réservé');s.game=inspectGoal(s.game,d.target);break;
   case 'proposeTrade':{
    requirePhase('DIPLOMACY');requireTrue(d&&ARCHETYPES.includes(d.to)&&d.to!==id,'Destinataire invalide');
    const offer={id:c.id,round:s.game.round,from:id,to:d.to,give:d.give,receive:d.receive};
    // Preflight validation without applying transfer or Commerce bonus.
    executeTrade(s.game,offer);s.offers[c.id]=structuredClone(offer);break;
   }
   case 'acceptTrade':{
    requirePhase('DIPLOMACY');const offer=Object.hasOwn(s.offers,d.offerId)?s.offers[d.offerId]:undefined;
    requireTrue(offer&&offer.to===id,'Offre absente ou destinataire incorrect');s.game=executeTrade(s.game,offer!);delete s.offers[d.offerId];break;
   }
   case 'proposeAlliance':requirePhase('DIPLOMACY');signAlliance(s.game,id,d.to);s.allianceOffers[c.id]={from:id,to:d.to};break;
   case 'acceptAlliance':{
    requirePhase('DIPLOMACY');const offer=Object.hasOwn(s.allianceOffers,d.offerId)?s.allianceOffers[d.offerId]:undefined;
    requireTrue(offer&&offer.to===id,'Proposition absente ou incorrecte');s.game=signAlliance(s.game,offer!.from,id);delete s.allianceOffers[d.offerId];break;
   }
   case 'endAlliance':requireTrue(['DIPLOMACY','ORDERS'].includes(s.phase),'Retrait fermé');requirePhase(s.phase);s.game=endAlliance(s.game,id);break;
   case 'summit':requirePhase('SUMMIT');requireTrue(!s.summitVotes[id]&&d&&ARCHETYPES.includes(d.candidate)&&Number.isInteger(d.spend)&&d.spend>=0&&d.spend<=2&&d.spend<=s.game.teams[id].influence,'Vote Sommet invalide');s.summitVotes[id]=structuredClone(d);break;
   default:throw new Error('Commande inconnue');
  }
 }
 s.revision++;Object.defineProperty(s.receipts,c.id,{value:{actor:actorKey,payload},enumerable:true,writable:true,configurable:true});s.audit.push({revision:s.revision,actor:actorKey,kind:c.kind,at:now});return s;
}
export function sessionView(s:Session,actor:Actor|{role:'public'}) {
 const common={id:s.id,reveal:replayView(s.game,s.reveal),edition:structuredClone(s.edition),phase:s.phase,deadline:s.deadline,pausedRemaining:s.pausedRemaining,game:publicView(s.game),...(s.game.finished?{ranking:structuredClone(s.ranking)}:{})};
 if(actor.role==='public')return common;
 if(actor.role==='organizer'){requireTrue(actor.id===s.organizerId,'Accès refusé');return {...structuredClone(s),reveal:replayView(s.game,s.reveal)};}
 requireTrue(ARCHETYPES.includes(actor.team),'Équipe inconnue');
 return {...common,game:teamView(s.game,actor.team),offers:Object.values(s.offers).filter(o=>o.from===actor.team||o.to===actor.team).map(o=>structuredClone(o)),allianceOffers:Object.entries(s.allianceOffers).filter(([,o])=>o.from===actor.team||o.to===actor.team).map(([id,o])=>({id,...o})),summitVote:structuredClone(s.summitVotes[actor.team]??null)};
}
