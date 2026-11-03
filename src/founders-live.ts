import {DEFAULT_TEAM_COLORS,teamColor} from '../public/founders-identity.js';
/**
 * LE PACTE — independent narrative session domain (V2.5).
 *
 * The full scenario and secret family objectives remain SERVER-ONLY.
 * Browser projections are explicit allowlists; they never serialize this state.
 * The host must authenticate actors and execute revision checks atomically.
 */
import {
  createFoundersGame,openFoundersDilemma,castFoundersAction,
  moderatorResolveFoundersTie,moderatorChooseFoundersLeader,
  applyFoundersCityEffects,transferFoundersDollars,FOUNDERS,totalPower,expectedFoundersPowerSupply
} from './founders.ts';
import {
  DEFAULT_GOAL_CARDS,DEFAULT_SCORE_RULES,validateGoalCards,validateScoreRules,
  evaluateGoal,calculateFoundersFinal
} from './founders-scoring.ts';

const copy=x=>structuredClone(x);
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const familyId=id=>FOUNDERS.includes(id);
const str=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const maxOffers=60;
const phaseNames=['READY','COUNCIL','AWAITING_REVEAL','REVEALED','FINISHED'];
export const TEST_FAMILY_OBJECTIVES=Object.freeze([
  'Objectif de test : développer l’Économie selon les paliers de votre ambition.',
  'Objectif de test : faire monter la Sécurité (5 puis 7).',
  'Objectif de test : faire progresser la Satisfaction populaire (voir les paliers de votre ambition).',
  'Objectif de test : améliorer le Bien-être (6 puis 8).',
  'Objectif de test : développer la ville (voir les paliers de votre ambition).',
  'Objectif de test : préserver l’autonomie des fondateurs en affaiblissant la Stabilité (voir les paliers de votre ambition).'
]);

export function createNarrativeSession(preview,{id,ownerId,code,title,objectives=TEST_FAMILY_OBJECTIVES,names=FOUNDERS.map(()=> 'Nom à choisir'),colors=DEFAULT_TEAM_COLORS,goalCards=DEFAULT_GOAL_CARDS,scoreRules=DEFAULT_SCORE_RULES,initiativeOrder=FOUNDERS,now=Date.now()}) {
 check(preview?.kind==='founders-session-preview-v2.3'&&preview.previewOnly===true,'Configuration narrative invalide');
 check(typeof id==='string'&&/^[a-f0-9]{24}$/.test(id),'Identifiant de session invalide');
 check(str(ownerId,128),'Organisateur requis');
 check(typeof code==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,11}$/.test(code),'Code de session invalide');
 check(str(title,100),'Titre de partie invalide');
 check(Array.isArray(objectives)&&objectives.length===6&&objectives.every(x=>str(x,500)),'Six objectifs de famille requis');
 check(Array.isArray(names)&&names.length===6&&names.every(x=>str(x,60)),'Six noms de famille requis');
 check(Array.isArray(colors)&&colors.length===6&&new Set(colors).size===6&&colors.every(c=>teamColor(c)),'Six couleurs distinctes de la palette requises');
 const goalErrors=validateGoalCards(goalCards);check(!goalErrors.length,goalErrors.join(' ; '));
 const scoreErrors=validateScoreRules(scoreRules);check(!scoreErrors.length,scoreErrors.join(' ; '));
 check(Array.isArray(initiativeOrder)&&initiativeOrder.length===6&&new Set(initiativeOrder).size===6&&initiativeOrder.every(id=>FOUNDERS.includes(id)),'Tirage des familles invalide');
 check(Number.isSafeInteger(now)&&now>=0,'Horodatage invalide');
 check(preview.scenario?.dilemmas?.some(d=>d.id===preview.scenario?.scenario?.entry_dilemma),'Dilemme de départ introuvable');
 check(preview.game?.ruleset==='founders-v2-prototype','Moteur de votes incompatible');
 const session={
  kind:'founders-live-session-v2.5',id,ownerId,code,title,
  selection:copy(preview.selection),scenario:copy(preview.scenario),skin:copy(preview.skin),
  source:copy(preview.source),game:copy(preview.game),
  names:Object.fromEntries(FOUNDERS.map((id,i)=>[id,names[i]])),
  colors:Object.fromEntries(FOUNDERS.map((id,i)=>[id,colors[i]])),
  goals:Object.fromEntries(FOUNDERS.map((id,i)=>[id,objectives[i]])),
  goalCards:copy(goalCards),scoreRules:copy(scoreRules),initiativeOrder:copy(initiativeOrder),finalResults:null,
  phase:'READY',currentDilemmaId:preview.scenario.scenario.entry_dilemma,
  lastReveal:null,revealedHistory:[],offers:{},revision:0,createdAt:now,updatedAt:now
 };
 check(Buffer.byteLength(JSON.stringify(session),'utf8')<=720000,'Partie trop volumineuse pour le stockage');
 return session;
}
const dilemma=s=>{
 const d=s.scenario.dilemmas.find(item=>item.id===s.currentDilemmaId);
 check(d,'Dilemme absent du scénario figé');return d;
};
const validateActor=(s,actor)=>{
 check(actor&&['organizer','team'].includes(actor.role),'Identité requise');
 if(actor.role==='organizer')check(actor.id===s.ownerId,'Accès régie refusé');
 else check(familyId(actor.family),'Famille inconnue');
};
const activeOffers=s=>Object.values(s.offers).filter(o=>o.status==='pending').length;
export function applyNarrativeCommand(input,actor,command,now){
 check(input?.kind==='founders-live-session-v2.5','Partie narrative invalide');
 validateActor(input,actor);
 check(command&&Number.isSafeInteger(command.expectedRevision)&&command.expectedRevision===input.revision,'Révision périmée : actualiser la partie');
 check(Number.isSafeInteger(now)&&now>=0,'Horodatage invalide');
 check(command&&typeof command.kind==='string','Commande invalide');
 const s=copy(input),data=command.data??{},kind=command.kind;
 const org=()=>check(actor.role==='organizer','Régie uniquement');
 const team=()=>check(actor.role==='team','Porte-parole uniquement');
 switch(kind){
  case 'setIdentity': {
   check(s.phase==='READY','Identité figée après le lancement');
   const fid=actor.role==='team'?actor.family:data.family;
   check(familyId(fid),'Famille inconnue');
   if(actor.role==='team')check(data.family===undefined||data.family===fid,'Votre famille uniquement');
   check(str(data.name,60),'Nom de famille requis (60 caractères maximum)');
   check(teamColor(data.color),'Couleur inconnue');
   const currentColors=s.colors??Object.fromEntries(FOUNDERS.map((id,i)=>[id,DEFAULT_TEAM_COLORS[i]]));
   check(!FOUNDERS.some(id=>id!==fid&&currentColors[id]===data.color),'Cette couleur appartient déjà à une autre équipe');
   s.names[fid]=data.name.trim();s.colors={...currentColors,[fid]:data.color};break;
  }

  case 'start':
   org();check(s.phase==='READY','La partie est déjà lancée');
   s.game=openFoundersDilemma(s.game,s.currentDilemmaId);s.phase='COUNCIL';break;
  case 'vote':
   team();check(s.phase==='COUNCIL','Conseil fermé');
   s.game=castFoundersAction(s.game,actor.family,data);
   if(!s.game.vote)s.phase='AWAITING_REVEAL';
   break;
  case 'resolveTie':
   team();check(s.phase==='COUNCIL'&&s.game.vote?.phase==='await_moderator','Aucune égalité à départager');
   s.game=moderatorResolveFoundersTie(s.game,actor.family,data.winner);
   if(!s.game.vote)s.phase='AWAITING_REVEAL';
   break;
  case 'chooseLeader':
   team();check(s.phase==='COUNCIL'&&s.game.vote?.phase==='await_leader','Aucun Maire à départager');
   s.game=moderatorChooseFoundersLeader(s.game,actor.family,data.family);
   if(!s.game.vote)s.phase='AWAITING_REVEAL';
   break;
  case 'reveal': {
   org();check(s.phase==='AWAITING_REVEAL','Aucun résultat à révéler');
   const result=s.game.history.at(-1);check(result?.id===s.currentDilemmaId,'Résultat du vote introuvable');
   const d=dilemma(s),outcome=d.outcomes[result.winner],cityBefore=copy(s.game.city);
   check(outcome&&Array.isArray(outcome.effects),'Issue narrative invalide');
   s.game=applyFoundersCityEffects(s.game,outcome.effects.map(e=>({
    resource:e.indicator,kind:e.operation,...(e.operation==='delta'?{amount:e.value}:{})
   })));
   // Offers are scoped to the council; unaccepted negotiations expire after resolution.
   for(const offer of Object.values(s.offers))if(offer.status==='pending')offer.status='expired';
   s.lastReveal={id:d.id,title:d.title,winner:result.winner,yes:result.yes,no:result.no,
    narration:outcome.narration,effects:copy(outcome.effects),cityBefore,cityAfter:copy(s.game.city),nextId:outcome.next_id};
   if(outcome.chronicle)s.lastReveal.chronicle=copy(outcome.chronicle);
   s.revealedHistory.push({...copy(s.lastReveal),city:copy(s.game.city)});
   s.phase='REVEALED';break;
  }
  case 'next': {
   org();check(s.phase==='REVEALED','Révéler le résultat avant de poursuivre');
   if(s.lastReveal.nextId===null){s.phase='FINISHED';s.finalResults=calculateFoundersFinal(s);break;}
   check(s.revealedHistory.length<=s.scenario.dilemmas.length*3,'Nombre maximal de dilemmes atteint');
   s.currentDilemmaId=s.lastReveal.nextId;s.lastReveal=null;
   s.game=openFoundersDilemma(s.game,s.currentDilemmaId);s.phase='COUNCIL';
   break;
  }
  case 'offer': {
   team();check(s.phase==='COUNCIL','Négociations fermées');
   check(activeOffers(s)<maxOffers,'Trop d’offres en attente');
   check(familyId(data.to)&&data.to!==actor.family,'Destinataire invalide');
   check(Number.isSafeInteger(data.amount)&&data.amount>=1&&data.amount<=s.game.families[actor.family].dollars,'Dollars insuffisants');
   check(str(data.reason,300),'Motif de proposition requis');
   check(typeof data.id==='string'&&/^[A-Za-z0-9_-]{8,80}$/.test(data.id)&&!has(s.offers,data.id),'Identifiant d’offre déjà utilisé');
   s.offers[data.id]={id:data.id,from:actor.family,to:data.to,amount:data.amount,reason:data.reason,status:'pending'};
   break;
  }
  case 'acceptOffer': {
   team();check(s.phase==='COUNCIL','Négociations fermées');
   const offer=has(s.offers,data.id)?s.offers[data.id]:null;
   check(offer&&offer.status==='pending'&&offer.to===actor.family,'Offre non destinée à votre famille');
   s.game=transferFoundersDollars(s.game,offer.from,offer.to,offer.amount,offer.reason);
   offer.status='accepted';break;
  }
  case 'rejectOffer': {
   team();check(s.phase==='COUNCIL','Négociations fermées');
   const offer=has(s.offers,data.id)?s.offers[data.id]:null;
   check(offer&&offer.status==='pending'&&(offer.to===actor.family||offer.from===actor.family),'Offre inaccessible');
   offer.status='rejected';break;
  }
  default:throw new Error('Commande narrative inconnue');
 }
 s.revision++;s.updatedAt=now;
 check(totalPower(s.game)===expectedFoundersPowerSupply(s.game),'Conservation de l’Influence violée');
 return s;
}
function publicDilemma(s){
 if(s.phase==='READY'||s.phase==='FINISHED')return null;
 const d=dilemma(s);
 return {id:d.id,chapter:d.chapter,title:d.title,public_text:d.public_text,
  vote_question:d.vote_question,labels:copy(d.labels),image:copy(d.image)};
}
export function narrativePublicView(s){
 check(s?.kind==='founders-live-session-v2.5','Partie inconnue');
 const v=s.game.vote,resolved=(s.phase==='REVEALED'||s.phase==='FINISHED')?s.game.history.at(-1):null;
 // No secrets, unrevealed outcomes, future branches, or source Sheets IDs.
 return {
  kind:s.kind,id:s.id,code:s.code,title:s.title,phase:s.phase,revision:s.revision,
  story:{id:s.scenario.scenario.id,title:s.scenario.scenario.title,location:s.scenario.scenario.location,year:s.scenario.scenario.year},
  skin:{id:s.skin.id,title:s.skin.title,labels:copy(s.skin.labels),theme:copy(s.skin.theme),publicScene:copy(s.skin.publicScene)},
  city:copy(s.game.city),families:FOUNDERS.map((id,i)=>({id,name:s.names[id],color:copy(teamColor(s.colors?.[id]??DEFAULT_TEAM_COLORS[i])),members:s.game.families[id].members})),
  leader:s.game.leader,moderator:s.game.moderator,
  dilemma:publicDilemma(s),
  council:v?{phase:v.phase,turn:v.turn,bids:copy(v.bids),choices:copy(v.choices),
    pendingLeaderChoices:v.pendingLeaderChoices?copy(v.pendingLeaderChoices):[]}:
    {phase:resolved?'revealed':s.phase==='AWAITING_REVEAL'?'closed':'inactive',turn:null,bids:resolved?copy(resolved.bids):{},choices:resolved?copy(resolved.choices):{},pendingLeaderChoices:[]},
  reveal:s.phase==='REVEALED'||s.phase==='FINISHED'?copy(s.lastReveal):null,
  // Enrich only already revealed chapters. Never send the other outcome.
  // Resolve illustrations from the frozen scenario, including older sessions
  // whose stored history predates the illustrated chronicle.
  history:s.revealedHistory.map(h=>{
   const d=s.scenario.dilemmas.find(d=>d.id===h.id);
   const c=h.chronicle??d?.outcomes?.[h.winner]?.chronicle;
   return {...copy(h),...(c?{chronicle:copy(c)}:{}),image:c?.image?copy(c.image):d?copy(d.image):null,
    decisionLabel:d?.labels?.[h.winner]??h.winner};
  }),
  finalTieOrder:copy(s.initiativeOrder??FOUNDERS),
  finalResults:s.phase==='FINISHED'?copy(s.finalResults):null
 };
}
export function narrativeFamilyView(s,family){
 check(familyId(family),'Famille inconnue');
 const view=narrativePublicView(s),v=s.game.vote;
 const card=s.goalCards?.[family]??DEFAULT_GOAL_CARDS[family];
 const progress=evaluateGoal(card,s.game.city,s.scoreRules??DEFAULT_SCORE_RULES);
 const offers=Object.values(s.offers).filter(o=>o.from===family||o.to===family).map(copy);
 return {...view,self:{id:family,name:s.names[family],color:copy(view.families.find(f=>f.id===family).color),objective:s.goals[family],
  members:s.game.families[family].members,power:s.game.families[family].power,dollars:s.game.families[family].dollars,
  choice:v?.choices[family]??null,bid:v?.bids[family]??0,
  mayVote:s.phase==='COUNCIL'&&v?.phase==='voting'&&v?.turn===family,
  mayResolve:s.phase==='COUNCIL'&&v?.phase==='await_moderator'&&s.game.moderator===family,
  mayChooseLeader:s.phase==='COUNCIL'&&v?.phase==='await_leader'&&s.game.moderator===family},
  goalCard:copy(card),goalProgress:progress,offers};
}
export function narrativeOrganizerView(s){
 return {...narrativePublicView(s),familyGoals:copy(s.goals),familyResources:copy(s.game.families),
  source:copy(s.source),selection:copy(s.selection),offers:copy(s.offers),
  goalCards:copy(s.goalCards??DEFAULT_GOAL_CARDS),scoreRules:copy(s.scoreRules??DEFAULT_SCORE_RULES),initiativeOrder:copy(s.initiativeOrder??FOUNDERS),
  game:copy(s.game),scenario:copy(s.scenario)};
}
export function narrativeView(s,actor){
 if(actor.role==='public')return narrativePublicView(s);
 validateActor(s,actor);
 return actor.role==='organizer'?narrativeOrganizerView(s):narrativeFamilyView(s,actor.family);
}
