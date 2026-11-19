import {isV2,GOALS_V2,TIMING_V2,validateTiming,validateThresholds,setPhaseClock,beginNegotiation,beginVote,revealResolution,nextV2,finishV2,continueHotspring,suspendHotspring,resumeHotspring,revealHotspringResults} from './founders-v2.ts';
import {isHotspring,isManualHotspring,createHotspringState,campaignDilemma,campaignFamily,campaignOrganizer,campaignPresentation,hotspringSupports,crisisCandidates,hotspringCityIndicators,hotspringOutcome,HOTSPRING_INDICATORS} from './founders-hotspring.ts';
import {DEFAULT_TEAM_COLORS,DEFAULT_TEAM_NAMES,teamColor} from '../public/founders-identity.js';
import {isHybrid,narrativeReserve,chooseNarrativeNext,narrativeEpilogue} from './founders-progression.ts';
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
  applyFoundersCityEffects,transferFoundersDollars,activeFounders,totalPower,expectedFoundersPowerSupply,foundersReserveAllocation
} from './founders.ts';
import {
  DEFAULT_GOAL_CARDS,DEFAULT_SCORE_RULES,validateGoalCards,validateScoreRules,
  evaluateGoal,calculateFoundersFinal
} from './founders-scoring.ts';

const copy=x=>structuredClone(x);
const check=(ok,message)=>{if(!ok)throw new Error(message);};
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

export function createNarrativeSession(preview,{id,ownerId,code,title,objectives=TEST_FAMILY_OBJECTIVES,names,colors=DEFAULT_TEAM_COLORS,goalCards=DEFAULT_GOAL_CARDS,scoreRules=DEFAULT_SCORE_RULES,initiativeOrder,timing=TIMING_V2,gaugeThresholds=[2,4,6,8],crisisMode,presentationSeconds,now=Date.now()}) {
 check(preview?.kind==='founders-session-preview-v2.3'&&preview.previewOnly===true,'Configuration narrative invalide');
 check(typeof id==='string'&&/^[a-f0-9]{24}$/.test(id),'Identifiant de session invalide');
 check(str(ownerId,128),'Organisateur requis');
 check(typeof code==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,11}$/.test(code),'Code de session invalide');
 check(str(title,100),'Titre de partie invalide');
 const ids=activeFounders(preview.game),v2=preview.game.auctionMode==='continuous';
 const families=preview.scenario.campaign?.families;
 if(families){
  check(ids.length===5,'Cinq familles requises pour Hotspring');
  names??=Object.values(families).map(f=>f.name);
  objectives=Object.values(families).map(f=>f.briefing);
  goalCards=GOALS_V2;scoreRules=DEFAULT_SCORE_RULES;
 }
 if(v2){
  if(goalCards===DEFAULT_GOAL_CARDS)goalCards=GOALS_V2;
  if(objectives===TEST_FAMILY_OBJECTIVES)objectives=ids.map(id=>goalCards[id].description);
  check(ids.every(id=>Object.hasOwn(preview.game.city,goalCards[id]?.indicator)),'Les ambitions doivent utiliser les quatre jauges de la V2');
 }
 objectives=objectives===TEST_FAMILY_OBJECTIVES?objectives.slice(0,ids.length):objectives;
 colors=colors===DEFAULT_TEAM_COLORS?colors.slice(0,ids.length):colors;
 initiativeOrder??=ids;
 check(Array.isArray(objectives)&&objectives.length===ids.length&&objectives.every(x=>str(x,500)),'Un objectif par famille active requis');
 check(Array.isArray(colors)&&colors.length===ids.length&&new Set(colors).size===ids.length&&colors.every(c=>teamColor(c)),'Des couleurs distinctes de la palette sont requises pour les familles actives');
 if(names===undefined)names=colors.map(c=>DEFAULT_TEAM_NAMES[c]);
 check(Array.isArray(names)&&names.length===ids.length&&names.every(x=>str(x,60)),'Un nom par famille active requis');
 const goalErrors=validateGoalCards(goalCards);check(!goalErrors.length,goalErrors.join(' ; '));
 const scoreErrors=validateScoreRules(scoreRules);check(!scoreErrors.length,scoreErrors.join(' ; '));
 check(Array.isArray(initiativeOrder)&&initiativeOrder.length===ids.length&&new Set(initiativeOrder).size===ids.length&&initiativeOrder.every(id=>ids.includes(id)),'Tirage des familles invalide');
 check(Number.isSafeInteger(now)&&now>=0,'Horodatage invalide');
 check(preview.scenario?.dilemmas?.some(d=>d.id===preview.scenario?.scenario?.entry_dilemma),'Dilemme de départ introuvable');
 check(preview.game?.ruleset==='founders-v2-prototype','Moteur de votes incompatible');
 const session={
  kind:'founders-live-session-v2.5',id,ownerId,code,title,
  selection:copy(preview.selection),scenario:copy(preview.scenario),skin:copy(preview.skin),
  source:copy(preview.source),game:copy(preview.game),
  names:Object.fromEntries(ids.map((id,i)=>[id,names[i]])),
  colors:Object.fromEntries(ids.map((id,i)=>[id,colors[i]])),
  goals:Object.fromEntries(ids.map((id,i)=>[id,objectives[i]])),
  goalCards:copy(goalCards),scoreRules:copy(scoreRules),initiativeOrder:copy(initiativeOrder),finalResults:null,
  ...(v2?{experienceVersion:2,timing:validateTiming(preview.scenario.campaign?.version===3?{...timing,autoAdvance:false}:timing),
   gaugeThresholds:validateThresholds(gaugeThresholds),clock:{phase:'READY',deadline:null,remainingMs:null,paused:false}}:{}),
  ...(families?{campaign:createHotspringState(preview.game.city,crisisMode,presentationSeconds,preview.scenario.campaign.version)}:{}),
  phase:'READY',currentDilemmaId:preview.scenario.scenario.entry_dilemma,
  lastReveal:null,revealedHistory:[],offers:{},revision:0,createdAt:now,updatedAt:now
 };
 check(Buffer.byteLength(JSON.stringify(session),'utf8')<=720000,'Partie trop volumineuse pour le stockage');
 return session;
}
export function duplicateHotspringFinal(input,{id,code,ownerId,now}){
 check(input.ownerId===ownerId,'Accès régie refusé');
 check(isHotspring(input)&&input.phase==='FINISHED'&&input.campaign.charterSeed,'Archive Hotspring finale requise');
 const s=copy(input),c=s.campaign,seed=c.charterSeed;
 Object.assign(s,{id,code,title:('Variante — '+s.title).slice(0,100),phase:'CHECKPOINT',
  currentDilemmaId:'D29',game:seed.game,revealedHistory:seed.history,offers:seed.offers,lastReveal:seed.reveal,
  finalResults:null,narrativeEnding:null,revision:0,createdAt:now,updatedAt:now});
 Object.assign(c,{markers:seed.markers,charter:null,qualification:null,finalists:null,archivedAt:null,charterSeed:null});
 c.parentArchive=input.id;
 c.publicRanking=c.checkpoints.at(-1)?.scores.rows.map(r=>({family:r.family,name:r.name,total:r.total,maximum:r.maximum}))??null;
 setPhaseClock(s,now);
 return s;
}

const dilemma=s=>{
 const d=s.scenario.dilemmas.find(item=>item.id===s.currentDilemmaId);
 check(d,'Dilemme absent du scénario figé');return d;
};
const validateActor=(s,actor)=>{
 check(actor&&['organizer','team'].includes(actor.role),'Identité requise');
 if(actor.role==='organizer')check(actor.id===s.ownerId,'Accès régie refusé');
 else check(activeFounders(s.game).includes(actor.family),'Famille inconnue');
};
const activeOffers=s=>Object.values(s.offers).filter(o=>o.status==='pending').length;
export function acceptedVoteCommitment(s,family){
 const offers=Object.values(s.offers).filter(o=>o.status==='accepted'&&o.to===family&&o.councilNumber===s.game.history.length&&o.commitment?.choice&&o.commitment.choice!=='gift');
 if(!offers.length)return null;
 return {choice:offers[0].commitment.choice,minInfluence:Math.max(...offers.map(o=>o.commitment.minInfluence))};
}
function validateOfferCommitment(s,to,commitment){
 check(commitment&&typeof commitment==='object'&&!Array.isArray(commitment),'Choisissez un engagement précis ou un transfert sans contrepartie');
 if(commitment.choice==='gift'){
  check(Object.keys(commitment).every(k=>k==='choice'),'Transfert sans contrepartie invalide');return;
 }
 const manual=isManualHotspring(s);
 check((manual?['pour','contre']:['pour','contre','passe_pouvoir']).includes(commitment.choice),'Engagement de vote invalide');
 check(Object.keys(commitment).every(k=>['choice','minInfluence'].includes(k)),'Champ d’engagement invalide');
 const minimum=commitment.minInfluence;
 check(Number.isSafeInteger(minimum)&&(commitment.choice==='passe_pouvoir'?minimum===0:minimum>=1&&minimum<=s.game.families[to].power),'Influence insuffisante pour cet engagement');
 check((manual&&s.phase==='NEGOTIATION')||
  (s.game.vote?.phase==='voting'&&!Object.hasOwn(s.game.vote.choices,to)),'Cette famille a déjà voté ou le vote est clos');
 const prior=acceptedVoteCommitment(s,to);
 check(!prior||prior.choice===commitment.choice,'Cette famille a déjà accepté un engagement incompatible');
}

export function applyNarrativeCommand(input,actor,command,now){
 check(input?.kind==='founders-live-session-v2.5','Partie narrative invalide');
 validateActor(input,actor);
 check(command&&Number.isSafeInteger(command.expectedRevision)&&command.expectedRevision===input.revision,'Révision périmée : actualiser la partie');
 check(Number.isSafeInteger(now)&&now>=0,'Horodatage invalide');
 check(command&&typeof command.kind==='string','Commande invalide');
 const s=copy(input),data=command.data??{},kind=command.kind;
 const manual=isManualHotspring(s);
 check(!s.clock?.paused||['pause','resume','configureTiming','adjustTime','correctResource','correctCity','finish','endSitting'].includes(kind),'Partie en pause');
 check(s.phase!=='SUSPENDED'||['resumeSitting','finish'].includes(kind),'Séance sauvegardée');
 const org=()=>check(actor.role==='organizer','Régie uniquement');
 const team=()=>check(actor.role==='team','Porte-parole uniquement');
 switch(kind){
  case 'setIdentity': {
   check(s.phase==='READY','Identité figée après le lancement');
   const fid=actor.role==='team'?actor.family:data.family;
   check(activeFounders(s.game).includes(fid),'Famille inconnue');
   if(actor.role==='team')check(data.family===undefined||data.family===fid,'Votre famille uniquement');
   check(str(data.name,60),'Nom de famille requis (60 caractères maximum)');
   check(teamColor(data.color),'Couleur inconnue');
   const currentColors=s.colors??Object.fromEntries(activeFounders(s.game).map((id,i)=>[id,DEFAULT_TEAM_COLORS[i]]));
   check(!activeFounders(s.game).some(id=>id!==fid&&currentColors[id]===data.color),'Cette couleur appartient déjà à une autre équipe');
   s.names[fid]=data.name.trim();s.colors={...currentColors,[fid]:data.color};break;
  }

  case 'start':
   org();check(s.phase==='READY','La partie est déjà lancée');
   if(isHotspring(s)){s.phase='INTRO';setPhaseClock(s,now);}
   else if(isV2(s))beginNegotiation(s,now);else {s.game=openFoundersDilemma(s.game,s.currentDilemmaId);s.phase='COUNCIL';}break;
  case 'vote':
   team();check(s.phase==='COUNCIL','Conseil fermé');
   {
    const commitment=acceptedVoteCommitment(s,actor.family),prior=s.game.vote?.choices[actor.family];
    if(commitment){
     check(prior===undefined?data.kind===commitment.choice:prior===commitment.choice,'Accord accepté : votre position de vote est engagée');
     if(prior===undefined&&commitment.minInfluence>0)check(Number.isSafeInteger(data.amount)&&data.amount>=commitment.minInfluence,'Accord accepté : mise minimale de '+commitment.minInfluence+' Influence');
    }
    s.game=castFoundersAction(s.game,actor.family,data);
   }
   if(!s.game.vote){if(isV2(s))revealResolution(s,now);else s.phase='AWAITING_REVEAL';}
   break;
  case 'resolveTie':
   team();check(s.phase==='COUNCIL'&&s.game.vote?.phase==='await_moderator','Aucune égalité à départager');
   s.game=moderatorResolveFoundersTie(s.game,actor.family,data.winner);
   if(!s.game.vote){if(isV2(s))revealResolution(s,now);else s.phase='AWAITING_REVEAL';}
   break;
  case 'chooseLeader':
   team();check(s.phase==='COUNCIL'&&s.game.vote?.phase==='await_leader','Aucun Maire à départager');
   s.game=moderatorChooseFoundersLeader(s.game,actor.family,data.family);
   if(!s.game.vote){if(isV2(s))revealResolution(s,now);else s.phase='AWAITING_REVEAL';}
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
   org();
   if(isHotspring(s)){continueHotspring(s,now,data.dilemmaId);break;}
   if(isV2(s)){check(s.phase==='REVEALED','Résolution requise');nextV2(s,now,data.dilemmaId);break;}
  check(s.phase==='REVEALED','Révéler le résultat avant de poursuivre');
   const next=isHybrid(s.scenario)?chooseNarrativeNext(s,data.dilemmaId):s.lastReveal.nextId;
   if(next===null){s.phase='FINISHED';s.finalResults=calculateFoundersFinal(s);s.narrativeEnding=narrativeEpilogue(s);break;}
   check(s.revealedHistory.length<=s.scenario.dilemmas.length*3,'Nombre maximal de dilemmes atteint');
   s.currentDilemmaId=next;s.lastReveal=null;
   s.game=openFoundersDilemma(s.game,s.currentDilemmaId);s.phase='COUNCIL';
   break;
  }
  case 'offer': {
   team();check(['NEGOTIATION','COUNCIL'].includes(s.phase),'Négociations fermées');
   check(activeOffers(s)<maxOffers,'Trop d’offres en attente');
   check(activeFounders(s.game).includes(data.to)&&data.to!==actor.family,'Destinataire invalide');
   check(Number.isSafeInteger(data.amount)&&data.amount>=1&&data.amount<=s.game.families[actor.family].dollars,'Dollars insuffisants');
   if(isV2(s)){check(data.reason===undefined||typeof data.reason==='string'&&data.reason.length<=300,'Message : 300 caractères maximum');data.reason=data.reason?.trim()||'Proposition financière';if(!manual)data.commitment={choice:'gift'};}
   check(str(data.reason,300),'Motif de proposition requis');
   validateOfferCommitment(s,data.to,data.commitment);
   check(typeof data.id==='string'&&/^[A-Za-z0-9_-]{8,80}$/.test(data.id)&&!has(s.offers,data.id),'Identifiant d’offre déjà utilisé');
   s.offers[data.id]={id:data.id,from:actor.family,to:data.to,amount:data.amount,reason:data.reason,commitment:copy(data.commitment),councilNumber:s.game.history.length,status:'pending'};
   break;
  }
  case 'acceptOffer': {
   team();check(['NEGOTIATION','COUNCIL'].includes(s.phase),'Négociations fermées');
   const offer=has(s.offers,data.id)?s.offers[data.id]:null;
   check(offer&&offer.status==='pending'&&offer.to===actor.family,'Offre non destinée à votre famille');
   if(offer.commitment){
    check(offer.councilNumber===s.game.history.length,'Cette offre concerne un autre Conseil');
    validateOfferCommitment(s,offer.to,offer.commitment);
   }
   s.game=transferFoundersDollars(s.game,offer.from,offer.to,offer.amount,offer.reason);
   offer.status='accepted';break;
  }
  case 'rejectOffer': {
   team();check(['NEGOTIATION','COUNCIL'].includes(s.phase),'Négociations fermées');
   const offer=has(s.offers,data.id)?s.offers[data.id]:null;
   check(offer&&offer.status==='pending'&&(offer.to===actor.family||offer.from===actor.family),'Offre inaccessible');
   offer.status='rejected';break;
  }
  case 'beginVote':
   org();check(isV2(s)&&s.phase==='NEGOTIATION','Aucune négociation à clore');beginVote(s,now);break;
  case 'configureTiming':
   org();check(isV2(s)&&!manual&&s.phase!=='FINISHED','Chronos indisponibles');s.timing=validateTiming(data.timing);s.gaugeThresholds=validateThresholds(data.gaugeThresholds??s.gaugeThresholds);
   if(isHotspring(s)&&data.presentationSeconds!==undefined){
    check(Number.isInteger(data.presentationSeconds)&&data.presentationSeconds>=5&&data.presentationSeconds<=7200,'Lecture : de 5 à 7200 secondes');
    s.campaign.presentationSeconds=data.presentationSeconds;
   }
   break;
  case 'pause':
   org();check(isV2(s)&&s.phase!=='FINISHED'&&!s.clock.paused,'Pause indisponible');
   s.clock.remainingMs=s.clock.deadline===null?null:Math.max(0,s.clock.deadline-now);s.clock.deadline=null;s.clock.paused=true;break;
  case 'resume':
   org();check(isV2(s)&&s.clock.paused,'La partie n’est pas en pause');s.clock.paused=false;s.clock.deadline=s.clock.remainingMs===null?null:now+s.clock.remainingMs;break;
  case 'adjustTime':
   org();check(isV2(s)&&!manual&&Number.isInteger(data.seconds)&&Math.abs(data.seconds)<=3600&&s.clock.remainingMs!==null,'Ajustement de chrono invalide');
   if(s.clock.paused)s.clock.remainingMs=Math.max(0,s.clock.remainingMs+data.seconds*1000);
   else {s.clock.deadline=Math.max(now,s.clock.deadline+data.seconds*1000);s.clock.remainingMs=Math.max(0,s.clock.deadline-now);}break;
  case 'correctResource': {
   org();check(isV2(s)&&!['EPILOGUE','FINISHED'].includes(s.phase)&&s.clock.paused,'Corrigez les ressources pendant une pause, avant l’épilogue');
   check(activeFounders(s.game).includes(data.family)&&['power','dollars'].includes(data.resource)&&Number.isSafeInteger(data.value)&&data.value>=0&&data.value<=100000,'Correction invalide');
   const f=s.game.families[data.family];
   if(manual&&data.resource==='power'&&!Object.hasOwn(s.game.vote?.choices??{},data.family)){
    const commitment=acceptedVoteCommitment(s,data.family);
    check(!commitment||data.value>=commitment.minInfluence,'Cette correction empêcherait le vote promis');
   }
   if(data.resource==='power')s.game.powerSupply+=data.value-f.power;
   (s.corrections??=[]).push({family:data.family,resource:data.resource,before:f[data.resource],after:data.value,at:now});
   f[data.resource]=data.value;break;
  }
  case 'correctCity': {
   org();
   check(isHotspring(s)&&s.campaign.version>=2&&!['FINISHED','EPILOGUE'].includes(s.phase)&&s.clock.paused,'Mettre la campagne en pause avant de corriger une jauge');
   const {indicator,value}=data;
   check(HOTSPRING_INDICATORS.includes(indicator)&&Number.isInteger(value)&&value>=0&&value<=10,'Choisir une jauge fondamentale et un entier entre 0 et 10');
   (s.corrections??=[]).push({kind:'city',indicator,before:s.game.city[indicator],after:value,at:now});
   s.game.city[indicator]=value;
   break;
  }
  case 'finish':
   org();check(isV2(s)&&!['FINISHED','EPILOGUE'].includes(s.phase)&&data.confirm===true,'Confirmation de fin de partie requise');
   if(isHotspring(s)&&s.phase==='CHECKPOINT'&&s.campaign.chapter>=5)continueHotspring(s,now);
   else finishV2(s,now);
   break;
  case 'endSitting':
   org();check(isHotspring(s),'Campagne Hotspring requise');suspendHotspring(s,now);break;
  case 'resumeSitting':
   org();check(isHotspring(s)&&s.phase==='SUSPENDED','Aucune séance à reprendre');resumeHotspring(s,now);break;
  case 'resumeCrises': {
   org();check(isHotspring(s)&&s.phase==='CHECKPOINT'&&s.campaign.chapter===5,'Checkpoint des crises requis');
   const candidates=crisisCandidates(s).filter(c=>c.available).sort((a,b)=>b.risk-a.risk||a.id.localeCompare(b.id));
   check(candidates.length,'Aucune crise en attente');
   s.campaign.crisesThisSitting=0;s.campaign.publicRanking=null;s.campaign.interlude=null;
   s.currentDilemmaId=candidates[0].id;s.lastReveal=null;s.phase='PRESENTATION';setPhaseClock(s,now);break;
  }
  case 'supportCharter':
   team();check(isHotspring(s),'Campagne Hotspring requise');
   if(hotspringSupports(s,actor.family,data.charter))beginNegotiation(s,now);
   break;
  case 'showResults':
   org();check(isHotspring(s)&&s.phase==='EPILOGUE','Épilogue requis');revealHotspringResults(s,now);break;
  default:throw new Error('Commande narrative inconnue');
 }
 s.revision++;s.updatedAt=now;
 check(totalPower(s.game)===expectedFoundersPowerSupply(s.game),'Conservation de l’Influence violée');
 return s;
}
function publicDilemma(s){
 if(s.phase==='READY'||s.phase==='FINISHED')return null;
 const d=dilemma(s);
 const campaign=isHotspring(s)?campaignDilemma(s,d):null;
 if(isHotspring(s)&&!campaign)return null;
 return {id:d.id,chapter:d.chapter,title:d.title,public_text:d.public_text,
  ...(isHybrid(s.scenario)?{sequence:s.revealedHistory.length+(s.phase==='REVEALED'?0:1)}:{}),
  vote_question:d.vote_question,labels:copy(d.labels),image:copy(d.image),...campaign};
}
function publicInfluenceReserve(s,resolved){
 const result=s.phase==='REVEALED'?resolved:null;
 if(!result&&!['NEGOTIATION','COUNCIL'].includes(s.phase))return null;
 const allocation=foundersReserveAllocation(s.game,result?{pool:result.poolBefore,choices:result.choices}:undefined);
 return {
  available:s.game.pool,
  participants:allocation.families.length,
  perFamily:result?.recapturedPerPassingTeam??allocation.perFamily,
  settled:Boolean(result)
 };
}
export function narrativePublicView(s){
 check(s?.kind==='founders-live-session-v2.5','Partie inconnue');
 const v=s.game.vote,resolved=(s.phase==='REVEALED'||s.phase==='FINISHED')?s.game.history.at(-1):null;
 const snapshot=record=>{
  const view=copy(record);
  if(isHotspring(s)&&s.campaign.version>=2&&view){
   for(const key of ['city','cityBefore','cityAfter'])if(view[key])view[key]=hotspringCityIndicators(view[key]);
  }
  return view;
 };
 // No secrets, unrevealed outcomes, future branches, or source Sheets IDs.
 return {
  kind:s.kind,id:s.id,code:s.code,title:s.title,phase:s.phase,revision:s.revision,
  ...(isV2(s)?{experienceVersion:2,timing:copy(s.timing),clock:copy(s.clock),gaugeThresholds:copy(s.gaugeThresholds)}:{}),
  ...(isHotspring(s)?{campaign:campaignPresentation(s),influenceReserve:publicInfluenceReserve(s,resolved)}:{}),
  story:{id:s.scenario.scenario.id,title:s.scenario.scenario.title,location:s.scenario.scenario.location,year:s.scenario.scenario.year,schemaVersion:s.scenario.schema_version},
  skin:{id:s.skin.id,title:s.skin.title,labels:copy(s.skin.labels),theme:copy(s.skin.theme),publicScene:copy(s.skin.publicScene)},
  city:isHotspring(s)?hotspringCityIndicators(s.game.city):copy(s.game.city),families:activeFounders(s.game).map((id,i)=>({id,name:s.names[id],color:copy(teamColor(s.colors?.[id]??DEFAULT_TEAM_COLORS[i])),members:s.game.families[id].members})),
  leader:s.game.leader,moderator:s.game.moderator,
  dilemma:publicDilemma(s),
  council:v?{phase:v.phase,turn:v.turn,bids:copy(v.bids),choices:copy(v.choices),
    pendingLeaderChoices:v.pendingLeaderChoices?copy(v.pendingLeaderChoices):[]}:
    {phase:resolved?'revealed':s.phase==='AWAITING_REVEAL'?'closed':'inactive',turn:null,bids:resolved?copy(resolved.bids):{},choices:resolved?copy(resolved.choices):{},pendingLeaderChoices:[]},
  reveal:s.phase==='REVEALED'||s.phase==='FINISHED'?snapshot(s.lastReveal):null,
  narrativeEnding:['EPILOGUE','FINISHED'].includes(s.phase)?snapshot(s.narrativeEnding??null):null,
  // Enrich only already revealed chapters. Never send the other outcome.
  // Resolve illustrations from the frozen scenario, including older sessions
  // whose stored history predates the illustrated chronicle.
  history:s.revealedHistory.map(h=>{
   const d=s.scenario.dilemmas.find(d=>d.id===h.id);
   const c=h.chronicle??d?.outcomes?.[h.winner]?.chronicle;
   return {...snapshot(h),...(c?{chronicle:copy(c)}:{}),image:h.visual??(c?.image?copy(c.image):d?copy(d.image):null),
    decisionLabel:h.id==='D30'&&isHotspring(s)?c.title:d?.labels?.[h.winner]??h.winner};
  }),
  finalTieOrder:copy(s.initiativeOrder??activeFounders(s.game)),
  finalResults:s.phase==='FINISHED'?copy(s.finalResults):null
 };
}
export function narrativeFamilyView(s,family){
 check(activeFounders(s.game).includes(family),'Famille inconnue');
 const view=narrativePublicView(s),v=s.game.vote;
 const card=s.goalCards?.[family]??DEFAULT_GOAL_CARDS[family];
 const progress=evaluateGoal(card,s.game.city,s.scoreRules??DEFAULT_SCORE_RULES);
 const offers=Object.values(s.offers).filter(o=>o.from===family||o.to===family).map(copy);
 return {...view,self:{id:family,name:s.names[family],color:copy(view.families.find(f=>f.id===family).color),objective:s.goals[family],
  members:s.game.families[family].members,power:s.game.families[family].power,dollars:s.game.families[family].dollars,
  choice:v?.choices[family]??null,bid:v?.bids[family]??0,
  mayVote:!s.clock?.paused&&s.phase==='COUNCIL'&&v?.phase==='voting'&&v?.turn===family,
  mayResolve:!s.clock?.paused&&s.phase==='COUNCIL'&&v?.phase==='await_moderator'&&s.game.moderator===family,
  mayChooseLeader:!s.clock?.paused&&s.phase==='COUNCIL'&&v?.phase==='await_leader'&&s.game.moderator===family},
  ...(isHotspring(s)?{privateCampaign:campaignFamily(s,family)}:{goalCard:copy(card),goalProgress:progress}),
  offers,voteCommitment:acceptedVoteCommitment(s,family)};
}
export function narrativeOrganizerView(s){
 return {...narrativePublicView(s),familyGoals:copy(s.goals),familyResources:copy(s.game.families),
  ...(isHotspring(s)?{campaignAdmin:campaignOrganizer(s),privateFamilies:Object.fromEntries(activeFounders(s.game).map(id=>[id,campaignFamily(s,id)]))}:{}),
  effectsPreview:hotspringEffectsPreview(s),
  progression:s.phase==='REVEALED'?narrativeReserve(s):null,
  source:copy(s.source),selection:copy(s.selection),offers:copy(s.offers),
  goalCards:copy(s.goalCards??DEFAULT_GOAL_CARDS),scoreRules:copy(s.scoreRules??DEFAULT_SCORE_RULES),initiativeOrder:copy(s.initiativeOrder??activeFounders(s.game)),
  game:copy(s.game),scenario:copy(s.scenario)};
}
function hotspringEffectsPreview(s){
 if(!isHotspring(s)||s.campaign.version<2||!['PRESENTATION','NEGOTIATION','COUNCIL'].includes(s.phase))return null;
 const dilemma=s.scenario.dilemmas.find(d=>d.id===s.currentDilemmaId);
 const cityBefore=hotspringCityIndicators(s.game.city);
 return ['pour','contre'].map(side=>{
  const effects=hotspringOutcome(copy(s),dilemma,side).effects;
  const projectedGame=applyFoundersCityEffects({...s.game,vote:null},effects.map(e=>({resource:e.indicator,kind:e.operation,amount:e.value})));
  return {side,effects,cityBefore,cityAfter:hotspringCityIndicators(projectedGame.city)};
 });
}
export function narrativeView(s,actor){
 if(actor.role==='public')return narrativePublicView(s);
 validateActor(s,actor);
 return actor.role==='organizer'?narrativeOrganizerView(s):narrativeFamilyView(s,actor.family);
}
