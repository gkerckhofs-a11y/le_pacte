import {openFoundersDilemma,applyFoundersCityEffects,activeFounders} from './founders.ts';
import {calculateFoundersFinal} from './founders-scoring.ts';
import {isHybrid,chooseNarrativeNext,narrativeReserve,narrativeEpilogue} from './founders-progression.ts';
import {isHotspring,isManualHotspring,hotspringOutcome,campaignNext,campaignCheckpoint,startCharter,campaignEpilogue,campaignResults,hotspringCityIndicators} from './founders-hotspring.ts';
import {hotspringScores} from './hotspring-scoring.ts';
export const CITY_V2={economie:5,ecologie:5,securite:5,demographie:5};
export const LABELS_V2={economie:'Économie',ecologie:'Écologie',securite:'Sécurité',demographie:'Démographie'};
export const TIMING_V2={negotiationSeconds:480,voteSeconds:180,resolutionSeconds:20,autoAdvance:true};
const check=(ok,m)=>{if(!ok)throw new Error(m);};
export const isV2=s=>s.experienceVersion===2;
export function validateTiming(t){
 check(t&&typeof t==='object'&&!Array.isArray(t)&&Object.keys(t).every(k=>Object.hasOwn(TIMING_V2,k)),'Paramétrage des chronos invalide');
 for(const k of ['negotiationSeconds','voteSeconds','resolutionSeconds'])check(Number.isSafeInteger(t[k])&&t[k]>=5&&t[k]<=7200,'Durée : de 5 à 7200 secondes');
 check(typeof t.autoAdvance==='boolean','Transition automatique invalide');return structuredClone(t);
}
export function validateThresholds(t){check(Array.isArray(t)&&t.length===4&&t.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=9&&(!i||n>t[i-1])),'Quatre seuils croissants entre 0 et 9 requis');return [...t];}
export const GOALS_V2=Object.fromEntries([
 ['A','Les négociants','Faire prospérer les affaires.','economie','at_least',6,8],
 ['B','Les protecteurs','Protéger les habitants.','securite','at_least',6,8],
 ['C','Les nouveaux arrivants','Faire venir des familles à Hot Spring.','demographie','at_least',6,8],
 ['D','Les gardiens de la vallée','Préserver les terres et les ressources.','ecologie','at_least',6,8],
 ['E','Les industriels','Développer les exploitations, même au prix de l’environnement.','ecologie','at_most',4,2],
 ['F','Les familles établies','Limiter l’arrivée de nouveaux habitants.','demographie','at_most',4,2]
].map(([id,title,description,indicator,direction,firstTarget,secondTarget])=>[id,{id:'F_'+id,title,description,indicator,direction,firstTarget,secondTarget}]));
export function setPhaseClock(s,now){
 if(!isV2(s))return;
 if(isHotspring(s))s.campaign.justResumed=false;
 const reading=['INTRO','PRESENTATION'].includes(s.phase);
 const seconds=isManualHotspring(s)?null:reading?s.campaign.presentationSeconds:s.phase==='NEGOTIATION'?s.timing.negotiationSeconds:s.phase==='COUNCIL'?s.timing.voteSeconds:s.phase==='REVEALED'?s.timing.resolutionSeconds:null;
 s.clock={phase:s.phase,deadline:seconds===null?null:now+seconds*1000,remainingMs:seconds===null?null:seconds*1000,paused:false};
}
export function beginNegotiation(s,now){s.phase='NEGOTIATION';setPhaseClock(s,now);}
export function beginVote(s,now){s.game=openFoundersDilemma(s.game,s.currentDilemmaId);s.phase='COUNCIL';setPhaseClock(s,now);}
export function revealResolution(s,now){
 const result=s.game.history.at(-1);check(result?.id===s.currentDilemmaId,'Résultat du vote introuvable');
 const campaign=isHotspring(s),cityIndicators=campaign?hotspringCityIndicators:structuredClone;
 const d=s.scenario.dilemmas.find(d=>d.id===s.currentDilemmaId),cityBefore=cityIndicators(s.game.city);
 const outcome=campaign?hotspringOutcome(s,d,result.winner):d.outcomes[result.winner];
 s.game=applyFoundersCityEffects(s.game,outcome.effects.map(e=>({resource:e.indicator,kind:e.operation,...(e.operation==='delta'?{amount:e.value}:{})})));
 for(const o of Object.values(s.offers))if(o.status==='pending')o.status='expired';
 s.lastReveal={id:d.id,title:d.title,winner:result.winner,yes:result.yes,no:result.no,narration:outcome.narration,effects:structuredClone(outcome.effects),cityBefore,cityAfter:cityIndicators(s.game.city),nextId:outcome.next_id,...(outcome.chronicle?{chronicle:structuredClone(outcome.chronicle)}:{})};
 if(campaign)Object.assign(s.lastReveal,{chapter:d.chapter,visual:outcome.visual});
 s.revealedHistory.push({...structuredClone(s.lastReveal),city:cityIndicators(s.game.city)});s.phase='REVEALED';setPhaseClock(s,now);
}
export function finishV2(s,now){
 // Interrupting a council refunds all its bids; no unfinished decision affects city or score.
 if(s.game.vote){for(const id of activeFounders(s.game))s.game.families[id].power+=s.game.vote.bids[id]??0;s.game.vote=null;}
 for(const o of Object.values(s.offers))if(o.status==='pending')o.status='expired';
 if(isHotspring(s)){
  s.campaign.suspension=null;
  s.phase='EPILOGUE';s.narrativeEnding=campaignEpilogue(s);setPhaseClock(s,now);return;
 }
 s.phase='FINISHED';s.finalResults=calculateFoundersFinal(s);s.narrativeEnding=epilogueV2(s);setPhaseClock(s,now);
}
export function nextV2(s,now,requested){
 if(isHotspring(s)){continueHotspring(s,now,requested);return;}
 const next=isHybrid(s.scenario)?chooseNarrativeNext(s,requested):s.lastReveal.nextId;
 if(next===null){finishV2(s,now);return;}
 check(s.revealedHistory.length<=s.scenario.dilemmas.length*3,'Nombre maximal de dilemmes atteint');
 s.currentDilemmaId=next;s.lastReveal=null;beginNegotiation(s,now);
}

export function continueHotspring(s,now,requested){
 const c=s.campaign;
 if(s.phase==='INTRO'){s.phase='PRESENTATION';setPhaseClock(s,now);return;}
 if(s.phase==='PRESENTATION'){beginNegotiation(s,now);return;}
 if(s.phase==='CHECKPOINT'){
  c.publicRanking=null;c.interlude=null;
  if(c.chapter===6)startCharter(s);
  else {
   c.chapter++;
   s.currentDilemmaId=['D01','D04','D09','D15','D21','D29'][c.chapter-1];
   s.lastReveal=null;s.phase='INTRO';
  }
  setPhaseClock(s,now);return;
 }
 check(s.phase==='REVEALED','Révélation ou checkpoint requis');
 const next=campaignNext(s,requested);
 if(next.end){finishV2(s,now);return;}
 if(next.checkpoint){
  campaignCheckpoint(s,now,()=>{
   s.game=applyFoundersCityEffects(s.game,[{resource:c.version>=2?'bien_etre':'demographie',kind:'delta',amount:1}]);
  });
  s.phase='CHECKPOINT';
 }else {
  s.currentDilemmaId=next.id;s.lastReveal=null;s.phase='PRESENTATION';
 }
 setPhaseClock(s,now);
}

export function suspendHotspring(s,now){
 check(!['READY','FINISHED','EPILOGUE','SUSPENDED'].includes(s.phase),'Fin de séance indisponible');
 const c=s.campaign;
 const clock=structuredClone(s.clock);
 if(clock.deadline!==null)clock.remainingMs=Math.max(0,clock.deadline-now);
 clock.deadline=null;
 c.suspension={phase:s.phase,clock};
 c.publicRanking=hotspringScores(s).rows.map(r=>({family:r.family,name:r.name,total:r.total,maximum:r.maximum}));
 s.phase='SUSPENDED';setPhaseClock(s,now);
}

export function resumeHotspring(s,now){
 const c=s.campaign,{phase,clock}=c.suspension;
 s.phase=phase;s.clock=clock;
 if(!clock.paused&&clock.remainingMs!==null)clock.deadline=now+clock.remainingMs;
 c.suspension=null;c.crisesThisSitting=0;c.justResumed=true;
 if(phase!=='CHECKPOINT')c.publicRanking=null;
}

export function revealHotspringResults(s,now){
 s.finalResults=campaignResults(s);
 s.campaign.archivedAt=now;
 s.phase='FINISHED';setPhaseClock(s,now);
}
const endText={
 economie:['Les commerces ferment et les échanges se raréfient.','Les affaires peinent à faire vivre la ville.','Les commerces maintiennent une activité régulière.','Les affaires prospèrent et les marchands affluent.','Hot Spring est devenue un carrefour commercial florissant.'],
 ecologie:['Les terres et les eaux portent de lourdes traces d’exploitation.','Les ressources et les environs sont fragilisés.','La vallée conserve un équilibre encore fragile.','Les ressources sont préservées et les environs restent vivants.','La vallée est un refuge dont les ressources ont été soigneusement protégées.'],
 securite:['La peur et l’insécurité dominent les rues.','Les habitants restent exposés aux menaces.','Les rues connaissent un ordre relatif.','Les habitants circulent en confiance.','La protection de la ville est reconnue dans toute la région.'],
 demographie:['Les départs laissent des maisons vides et des rues silencieuses.','Des familles quittent la ville, inquiètes de son avenir.','La population se maintient et la ville garde ses repères.','De nouvelles familles s’installent et les rues s’animent.','Les nouveaux habitants arrivent chaque semaine ; Hot Spring déborde de vie.']};
export function epilogueV2(s){
 const thresholds=s.gaugeThresholds??[2,4,6,8];
 const paragraphs=['Au terme des décisions des familles fondatrices, voici la ville que vous avez construite.'];
 for(const [k,value] of Object.entries(s.game.city)){const level=thresholds.filter(t=>value>t).length;paragraphs.push(LABELS_V2[k]+' — '+value+'/10. '+endText[k][level]);}
 const fragments=narrativeEpilogue(s)?.paragraphs??[];paragraphs.push(...fragments);
 const decisions=s.revealedHistory.map(h=>({id:h.id,title:h.title,winner:h.winner}));
 if(decisions.length)paragraphs.push('Les actes du Conseil : '+decisions.map(d=>d.title+' ('+(d.winner==='pour'?'adopté':'refusé')+')').join(' ; ')+'.');
 return {title:'Épilogue de '+s.scenario.scenario.location,paragraphs,decisions,city:structuredClone(s.game.city)};
}
/** Called transactionally on reads, including projection polling; the server clock owns transitions. */
export function advanceNarrativeTime(input,now){
 if(!isV2(input)||isManualHotspring(input)||input.clock?.paused||!input.timing.autoAdvance||!input.clock?.deadline||now<input.clock.deadline)return input;
 const s=structuredClone(input);
 if(isHotspring(s)&&['INTRO','PRESENTATION'].includes(s.phase))continueHotspring(s,now);
 else if(s.phase==='NEGOTIATION')beginVote(s,now);
 else if(s.phase==='REVEALED'){
  if(narrativeReserve(s)?.blocked)return input;
  nextV2(s,now);
 }else return input; // Vote timeout announces time up; never invent a political choice or arbitration.
 s.revision++;s.updatedAt=now;return s;
}
