import {activeFounders} from './founders.ts';
import {hotspringScores,autonomyIndex} from './hotspring-scoring.ts';
import {hotspringLandscape} from './hotspring-landscape.ts';
import art from '../content/hotspring-art-index-v1.json' with {type:'json'};

export const HOTSPRING_ID='les-colons-de-hotspring';
export const isHotspring=s=>s.scenario?.scenario?.id===HOTSPRING_ID&&s.campaign?.version===1;
const cityLabels={economie:'Économie',ecologie:'Écologie',securite:'Sécurité',demographie:'Démographie'};
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const copy=structuredClone;
const sceneKey=(id,side)=>side?id+'_'+side:id;

export function hotspringArt(id,side){
 return copy(art[sceneKey(id,side)]??null);
}

export function validateHotspring(payload){
 const c=payload.campaign;
 if(!c)return [];
 const ds=payload.dilemmas;
 if(payload.scenario?.id!==HOTSPRING_ID||c.version!==1||ds.length!==32)return ['Version des Colons de Hotspring invalide'];
 if(!c.rules||!c.intros||!c.checkpoints||!c.families||!c.epilogue||
   Object.keys(c.families).length!==5||!Array.isArray(c.charters)||c.charters.map(x=>x?.id).join('')!=='ABCDEF')
  return ['Configuration de la campagne Hotspring invalide'];
 const ids=Array.from({length:30},(_,i)=>'D'+String(i+1).padStart(2,'0')).flatMap(id=>
  ['D14','D26'].includes(id)?[id+'A',id+'B']:[id]);
 if(ids.some((id,i)=>ds[i]?.id!==id||id!=='D30'&&['pour','contre'].some(side=>
  !Array.isArray(c.rules[id]?.tendencies?.[side])||!Array.isArray(c.rules[id]?.markers?.[side]))))
  return ['Embranchements de Hotspring invalides'];
 return [];
}

export function createHotspringState(city,crisisMode='standard',presentationSeconds=35){
 check(['standard','extended'].includes(crisisMode),'Rythme des crises invalide');
 check(Number.isInteger(presentationSeconds)&&presentationSeconds>=5&&presentationSeconds<=7200,'Lecture : de 5 à 7200 secondes');
 return {version:1,chapter:1,trust:0,markers:[],initialCity:copy(city),checkpoints:[],completedChapters:[],
  playedCrises:[],crisesThisSitting:0,crisisMode,presentationSeconds,interlude:null,suspension:null,
  publicRanking:null,qualification:null,finalists:null,charter:null,interludeHistory:[]};
}

export function crisisCandidates(s){
 const c=s.campaign,m=new Set(c.markers),h=id=>m.has(id),n=(...ids)=>ids.filter(h).length;
 const fireBefore=2*n('CONSTRUCTION_SERREE')+n('GRAND_SALOON','SCIERIE_INTENSIVE','QUARTIER_PROVISOIRE');
 const fire=fireBefore-2*n('REGLEMENT_INCENDIE')-n('EAU_COMMUNALE');
 const health=2*n('DECHETS_LIBRES')+n('VILLE_BASSE','EAU_PRIVEE','QUARTIER_PROVISOIRE','ABATTOIR_CENTRAL','GRANDE_MINE')-
  2*n('ASSAINISSEMENT')-n('DISPENSAIRE','EAU_COMMUNALE','QUARTIER_PLANIFIE');
 const low=h('VILLE_BASSE');
 const water=low
  ?1+n('QUARTIER_PROVISOIRE','CENTRE_PRIVE','ABATTOIR_CENTRAL')-n('ASSAINISSEMENT','QUARTIER_PLANIFIE','MARSHAL','ALLIANCE_VALLEE')
  :1+n('EAU_PRIVEE','GRANDE_MINE','ABATTOIR_CENTRAL')-n('EAU_COMMUNALE','ALLIANCE_VALLEE','CHEMIN_DE_FER');
 const mine=2+n('SCRIP','SANS_MEDECIN','FINANCEMENT_PONCTUEL');
 const bank=2+n('CENTRE_PRIVE','SPECULATION_ACTIVE','DETTE_OUVRIERE','GRANDE_MINE','CHEMIN_DE_FER','FINANCEMENT_PONCTUEL','SECURITE_MINIERE','REPRISE_IMMEDIATE')+
  2*n('CENTRE_BRULE');
 const report=[
  {id:'D24',risk:fire,available:fire>=2,contained:fireBefore>=2&&h('REGLEMENT_INCENDIE')&&h('EAU_COMMUNALE'),reason:'Densité des bâtiments, bois et moyens de lutte contre le feu.'},
  {id:'D25',risk:health,available:health>=2,reason:'Rejets, eau, logement et services sanitaires.'},
  {id:low?'D26A':'D26B',risk:water,available:water>=2,reason:low?'Ville basse : exposition des terrains et moyens d’évacuation.':'Ville haute : demandes en eau et ravitaillement.'},
  {id:'D27',risk:mine,available:h('GRANDE_MINE'),reason:h('GRANDE_MINE')?'Grande mine, conditions de travail et moyens de secours.':'Grande mine absente.'},
  {id:'D28',risk:bank,available:h('BANQUE_CREDIT'),reason:h('BANQUE_CREDIT')?'Banque ouverte : hypothèques, dépendances et pertes récentes.':'Banque absente.'}
 ];
 return report.map(entry=>({...entry,played:c.playedCrises.includes(entry.id),
  available:entry.available&&!entry.contained&&!c.playedCrises.includes(entry.id)}));
}

export function availableCharters(s){
 const m=new Set(s.campaign.markers),n=(...ids)=>ids.filter(id=>m.has(id)).length;
 return s.scenario.campaign.charters.filter(({id})=>{
  switch(id){
   case 'D':return n('MARSHAL','ASSAINISSEMENT','IMPOT_LOCAL','REGLEMENT_INCENDIE','QUARTIER_PLANIFIE','CONSEIL_ELU')>=3;
   case 'E':return m.has('ACCORD_RESPECTE')&&n('COMPTOIR_COMMUN','ALLIANCE_VALLEE')>0&&s.campaign.trust>0&&!n('HOSTILITE_OUVERTE','ACCORD_ROMPU');
   case 'F':return m.has('EAU_COMMUNALE')&&s.game.city.ecologie>=6&&n('COUPE_REGULEE','ABATTOIR_ELOIGNE','ASSAINISSEMENT','QUARTIER_PLANIFIE','REGLEMENT_INCENDIE')>=2;
   default:return true;
  }
 });
}

export function hotspringSupports(s,family,choice){
 check(s.phase==='CHARTER_SUPPORT','Qualification des chartes fermée');
 const q=s.campaign.qualification;
 check(activeFounders(s.game).includes(family)&&!Object.hasOwn(q.supports,family),'Cette famille a déjà soutenu une charte');
 check(q.candidates.includes(choice),'Charte indisponible dans ce tour');
 q.supports[family]=choice;
 if(Object.keys(q.supports).length<activeFounders(s.game).length)return false;
 const points=id=>Object.values(q.supports).filter(x=>x===id).length;
 const entries=q.candidates.map(id=>({id,points:points(id)})).sort((a,b)=>b.points-a.points);
 q.rounds.push({number:q.round,totals:Object.fromEntries(entries.map(e=>[e.id,e.points])),supports:copy(q.supports)});
 const slots=2-q.qualified.length,cutoff=entries[slots-1].points;
 q.qualified.push(...entries.filter(e=>e.points>cutoff).map(e=>e.id));
 const tied=entries.filter(e=>e.points===cutoff).map(e=>e.id);
 if(tied.length===2-q.qualified.length){
  q.qualified.push(...tied);
  s.campaign.finalists=[...q.qualified];
  return true;
 }
 // The legacy engine carries no public prestige ledger. Equal prestige leaves a runoff.
 q.candidates=tied;q.supports={};q.round++;
 return false;
}

function trustDelta(id,side,m){
 const forVote=side==='pour',agreement=m.has('ACCORD_RIVIERE');
 switch(id){
  case 'D09':return forVote?2:-2;
  case 'D10':return forVote?(agreement?-2:-1):(agreement?1:0);
  case 'D11':return forVote?2:-1;
  case 'D12':return forVote?-1:0;
  case 'D13':return forVote?3:-3;
  case 'D14A':return forVote?2:-2;
  case 'D14B':return forVote?2:-3;
  case 'D19':return forVote?(agreement||m.has('COMPTOIR_COMMUN')?-1:0):(agreement?1:0);
  default:return 0;
 }
}

export function hotspringOutcome(s,d,side){
 const c=s.campaign;
 if(d.id==='D30'){
  const charter=s.scenario.campaign.charters.find(x=>x.id===c.finalists[side==='pour'?0:1]);
  c.charter=charter.id;
  c.markers.push(charter.marker);
  return {narration:charter.narration,effects:copy(charter.effects),next_id:null,
   chronicle:{title:charter.title,summary:charter.narration},visual:hotspringArt('charter_'+charter.id.toLowerCase())};
 }
 const m=new Set(c.markers),h=id=>m.has(id),n=(...ids)=>ids.filter(h).length,yes=side==='pour';
 const rule=s.scenario.campaign.rules[d.id],outcome=copy(d.outcomes[side]);
 const values=Object.fromEntries(outcome.effects.map(e=>[e.indicator,e.value]));
 switch(d.id){
  case 'D05':
  case 'D07':if(yes)values.economie=h('CENTRE_PRIVE')?-2:-1;break;
  case 'D16':if(yes)values.economie=h('CHEMIN_DE_FER')?3:2;break;
  case 'D17':if(!yes)values.economie=h('CENTRE_PRIVE')?-2:-1;break;
  case 'D19':if(yes&&h('CHEMIN_DE_FER')&&h('PASSAGE_DIRECT'))values.economie++;break;
  case 'D21':if(yes&&h('POSTE_TERRITORIAL'))values.securite++;break;
  case 'D22':
   if(yes)values.economie=h('CENTRE_PRIVE')?-3:n('RESERVES_PUBLIQUES','QUARTIER_PLANIFIE')?-1:-2;
   break;
  case 'D24':
   if(n('REGLEMENT_INCENDIE','EAU_COMMUNALE'))values[yes?'demographie':'economie']++;
   break;
  case 'D25':
   if(yes&&h('DISPENSAIRE')&&h('ASSAINISSEMENT')){values.economie=-1;values.demographie=0;}
   if(!yes&&n('EAU_COMMUNALE','QUARTIER_PLANIFIE'))values.demographie++;
   break;
  case 'D26A':
   values.demographie=Math.min(0,values.demographie+
    Math.min(2,n('ASSAINISSEMENT','QUARTIER_PLANIFIE','MARSHAL','ALLIANCE_VALLEE'))-
    Math.min(2,n('QUARTIER_PROVISOIRE','CENTRE_PRIVE','ABATTOIR_CENTRAL')));
   break;
  case 'D26B':
   if(h('EAU_COMMUNALE')&&h('ALLIANCE_VALLEE'))values.demographie++;
   if(!yes&&h('EAU_PRIVEE'))values.securite--;
   break;
  case 'D27':if(yes&&h('SCRIP'))values.economie=-3;break;
  case 'D28':if(yes)values.economie=h('IMPOT_LOCAL')?-1:h('FINANCEMENT_PONCTUEL')?-3:-2;break;
 }
 for(const marker of rule.markers[side])m.add(marker);
 c.markers=[...m];
 c.trust+=trustDelta(d.id,side,m);
 if(/^D2[4-8]/.test(d.id)){
  c.playedCrises.push(d.id);
  c.crisesThisSitting++;
 }
 outcome.effects=Object.entries(values).filter(([,value])=>value!==0).map(([indicator,value])=>({indicator,operation:'delta',value}));
 outcome.next_id=null;
 outcome.visual=hotspringArt(d.id,side);
 return outcome;
}

function crisisReport(s){
 return crisisCandidates(s).filter(r=>r.available).sort((a,b)=>b.risk-a.risk||a.id.localeCompare(b.id));
}

export function campaignNext(s,requested){
 const c=s.campaign,id=s.currentDilemmaId,m=new Set(c.markers);
 if(id==='D30')return {end:true};
 if(['D03','D08','D14A','D14B','D20','D29'].includes(id))return {checkpoint:true};
 if(id==='D12'&&!m.has('ACCORD_RIVIERE')||id==='D13')
  return {id:c.trust>=3||m.has('ACCORD_RESPECTE')?'D14A':'D14B'};
 if(id==='D19'&&!['CHEMIN_DE_FER','GRANDE_MINE'].some(k=>m.has(k)))return {checkpoint:true};

 if(/^D2[3-8]/.test(id)){
  const report=crisisCandidates(s);
  if(report[0].contained&&!report[0].played){
   c.playedCrises.push('D24');
   c.markers.push('INCENDIE_CONTENU','CICATRICES_INCENDIE');
   c.interludeHistory.push('L’eau communale et le règlement coupe-feu ont permis de contenir un incendie.');
  }
  const available=crisisReport(s);
  if(requested!==undefined)check(c.crisisMode==='extended'&&available.some(r=>r.id===requested),'Crise indisponible');
  if(available.length&&(c.crisisMode==='extended'||c.crisesThisSitting<2))return {id:requested??available[0].id};
  if(!c.playedCrises.length)c.interlude='Une année difficile, sans catastrophe majeure.';
  return {checkpoint:true};
 }
 return {id:s.scenario.dilemmas.find(d=>d.id===id).outcomes.pour.next_id};
}

export function campaignCheckpoint(s,now,chapterBonus){
 const c=s.campaign,chapter=c.chapter;
 if(chapter===5&&c.markers.includes('IMPOT_LOCAL')&&!c.markers.includes('SERVICES_MAINTENUS')){
  const count=['ECOLE','DISPENSAIRE','MARSHAL','ASSAINISSEMENT','EAU_COMMUNALE','POSTE_TERRITORIAL','REGLEMENT_INCENDIE'].filter(m=>c.markers.includes(m)).length;
  if(count>=2){
   chapterBonus();
   c.markers.push('SERVICES_MAINTENUS');
   c.interludeHistory.push('Les services publics restent ouverts grâce au budget local. Démographie +1.');
  }
 }
 if(chapter<=5&&!c.completedChapters.includes(chapter))c.completedChapters.push(chapter);
 const definition=s.scenario.campaign.checkpoints[chapter];
 const name=chapter===5?'Hotspring — Veille du conseil':chapter===6?'Hotspring — Gouvernement choisi':'Hotspring — '+definition.title;
 const before=c.checkpoints.findLast(p=>p.chapter<chapter)?.city??c.initialCity;
 const checkpoint={chapter,name,at:now,city:copy(s.game.city),markers:[...c.markers],trust:c.trust,
  scores:hotspringScores(s),decisions:s.revealedHistory.filter(h=>h.chapter===chapter).map(h=>h.id),
  changes:Object.fromEntries(Object.entries(s.game.city).map(([k,value])=>[k,value-before[k]]))};
 c.checkpoints.push(checkpoint);
 c.publicRanking=checkpoint.scores.rows.map(r=>({family:r.family,name:r.name,total:r.total,maximum:r.maximum}));
 return checkpoint;
}

export function startCharter(s){
 const ids=availableCharters(s).map(c=>c.id);
 s.campaign.charterSeed={game:copy(s.game),corrections:copy(s.corrections??[]),markers:[...s.campaign.markers],
  history:copy(s.revealedHistory),offers:copy(s.offers),reveal:copy(s.lastReveal)};
 s.currentDilemmaId='D30';s.lastReveal=null;
 s.campaign.qualification={round:1,candidates:ids,available:ids,supports:{},rounds:[],qualified:[]};
 s.phase='CHARTER_SUPPORT';
}

const publicCharter=({id,title,quote,tendencies})=>({id,title,quote,tendencies});

export function campaignDilemma(s,d){
 if(!['PRESENTATION','NEGOTIATION','COUNCIL','REVEALED','CHARTER_SUPPORT'].includes(s.phase))return null;
 const c=s.campaign;
 let variant=null;
 if(d.id==='D05')variant=c.markers.includes('CENTRE_PRIVE')?'variant_D05_CENTRE_PRIVE':'variant_D05_RESERVES_PUBLIQUES';
 if(d.id==='D20'&&!c.markers.includes('GRANDE_MINE'))variant='variant_D20_CHEMIN_DE_FER';
 const scene=(variant?hotspringArt(variant):null)??hotspringArt(d.id)??{url:null,status:'temporaire',alt:d.title};
 if(d.id==='D30'&&c.finalists){
  const [a,b]=c.finalists.map(id=>publicCharter(s.scenario.campaign.charters.find(x=>x.id===id)));
  return {image:scene,tendencies:{pour:a.tendencies,contre:b.tendencies},
   labels:{pour:a.title,contre:b.title},vote_question:a.quote+'\n'+b.quote};
 }
 return {image:scene,tendencies:copy(s.scenario.campaign.rules[d.id]?.tendencies??null)};
}

function relationLabel(trust,markers){
 if(markers.includes('HOSTILITE_OUVERTE'))return 'Hostilité ouverte';
 if(markers.includes('ACCORD_ROMPU'))return 'Accord rompu';
 if(trust>=3)return 'Confiance solide';
 if(trust>=1)return 'Confiance prudente';
 return 'Confiance fragile';
}

function epilogueRecap(s){
 if(s.phase!=='EPILOGUE'||!s.campaign.charter)return [];
 const groups=[
  ['D13','D14A','D14B','D11','D09'],
  ['D16','D15','D17','D18','D19','D05'],
  ['D24','D25','D26A','D26B','D27','D28']
 ];
 return groups.flatMap(ids=>{
  const event=s.revealedHistory.findLast(h=>ids.includes(h.id)&&h.visual?.url);
  return event?[{title:event.chronicle?.title??event.title,visual:copy(event.visual)}]:[];
 });
}

export function campaignPresentation(s){
 const c=s.campaign,content=s.scenario.campaign;
 const checkpoint=c.checkpoints.at(-1);
 const q=c.qualification;
 const summary=s.revealedHistory.slice(-4).map(h=>({id:h.id,title:h.chronicle?.title??h.title,summary:h.narration}));
 const chapterScreen=['CHECKPOINT','SUSPENDED'].includes(s.phase);
 const intro=s.phase==='INTRO'?{...copy(content.intros[c.chapter]),visual:hotspringArt('opening_'+c.chapter)}:null;
 const stopsAtCheckpoint=s.phase==='CHECKPOINT'||c.suspension?.phase==='CHECKPOINT';
 return {
  chapter:c.chapter,version:c.version,familyPitches:s.phase==='READY'?Object.values(content.families).map(f=>({role:f.publicRole,text:f.pitch})):null,relation:c.chapter>=3?relationLabel(c.trust,c.markers):null,
  landscape:hotspringLandscape(s),intro,recap:intro||c.justResumed?summary:[],epilogueRecap:epilogueRecap(s),
  checkpoint:chapterScreen?{title:stopsAtCheckpoint?checkpoint?.name:'Hotspring — Fin de séance',
   text:stopsAtCheckpoint?content.checkpoints[c.chapter].text:'L’histoire de Hotspring se poursuit…',
   decisions:stopsAtCheckpoint?s.revealedHistory.filter(h=>h.chapter===c.chapter).map(h=>({
    id:h.id,title:h.chronicle?.title??h.title,summary:h.narration})):summary,
   changes:stopsAtCheckpoint?copy(checkpoint?.changes??{}):{},interlude:c.interlude,
   events:c.chapter===5?copy(c.interludeHistory):[],
   ranking:copy(c.publicRanking)}:null,
  qualification:s.phase==='CHARTER_SUPPORT'&&q?{
   round:q.round,candidates:s.scenario.campaign.charters.filter(a=>q.candidates.includes(a.id)).map(publicCharter),
   supports:copy(q.supports),qualified:copy(q.qualified),previous:copy(q.rounds.at(-1)??null)
  }:null,
  archive:s.phase==='FINISHED'?{at:c.archivedAt,charter:c.charter,governance:c.markers.includes('CONSEIL_ELU')?'Conseil élu':c.markers.includes('CONSEIL_FONDATEURS')?'Conseil des Fondateurs':null}:null
 };
}

export function campaignFamily(s,family){
 const index=activeFounders(s.game).indexOf(family);
 const def=Object.values(s.scenario.campaign.families)[index];
 const current=['CHECKPOINT','SUSPENDED','FINISHED'].includes(s.phase);
 const labels=new Map();
 for(const d of s.scenario.dilemmas){
  for(const [side,marks] of Object.entries(s.scenario.campaign.rules[d.id]?.markers??{})){
   for(const m of marks)labels.set(m,d.labels[side]);
  }
 }
 for(const [marker,label] of Object.entries({
  CENTRE_SAUVE:'Sauver le centre',QUARTIERS_SAUVES:'Sauver les quartiers',EPIDEMIE_CONTENUE:'Contenir l’épidémie',
  EVACUATION_ORDONNEE:'Ordonner l’évacuation',SECURITE_MINIERE:'Renforcer la sécurité minière',
  SAUVETAGE_BANQUE:'Sauver la banque',RATIONNEMENT_HABITANTS:'Réserver l’eau aux habitants',
  ACCORD_RESPECTE:'Respecter l’accord de la rivière',ALLIANCE_VALLEE:'Conclure l’alliance de la vallée',
  ENQUETE_CONJOINTE:'Mener une enquête conjointe'
 }))labels.set(marker,label);
 const objectives=def.objectives.map(o=>{
  const options=o.groups.map(group=>group.map(mark=>labels.get(mark)).filter(Boolean).join(' ou '));
  return o.title+' ('+o.required+' choix) — '+options.join(', ')+'.';
 });
 const score=current?hotspringScores(s,{final:s.phase==='FINISHED'}).rows.find(r=>r.family===family):null;
 return {role:def.publicRole,briefing:def.briefing,objectives,
  trajectory:def.trajectory==='autonomy'?'Atteindre un indice d’autonomie d’au moins 2.':
   'Améliorer la jauge '+cityLabels[def.trajectory]+' par rapport à sa valeur de départ.',
  score,maySupport:!s.clock?.paused&&s.phase==='CHARTER_SUPPORT'&&!Object.hasOwn(s.campaign.qualification.supports,family)};
}

export function campaignOrganizer(s){
 const c=s.campaign,m=new Set(c.markers);
 return {trust:c.trust,markers:[...c.markers],autonomy:autonomyIndex(m),
  crises:c.chapter>=5?crisisCandidates(s):[],crisisMode:c.crisisMode,crisesThisSitting:c.crisesThisSitting,
  mayResumeCrises:s.phase==='CHECKPOINT'&&c.chapter===5&&crisisReport(s).length>0,
  presentationSeconds:c.presentationSeconds,mayCreateVariant:s.phase==='FINISHED'&&Boolean(c.charterSeed),
  progression:[
   {id:'D13',available:m.has('ACCORD_RIVIERE'),reason:m.has('ACCORD_RIVIERE')?'Accord de la rivière conclu.':'Accord de la rivière absent.'},
   {id:c.trust>=3||m.has('ACCORD_RESPECTE')?'D14A':'D14B',available:true,reason:'Confiance et respect de l’accord de la rivière.'},
   {id:'D20',available:m.has('GRANDE_MINE')||m.has('CHEMIN_DE_FER'),reason:m.has('GRANDE_MINE')?'Employeur retenu : grande mine.':m.has('CHEMIN_DE_FER')?'Employeur retenu : compagnie ferroviaire.':'Grande mine et gare absentes.'}
  ],
  checkpoints:c.checkpoints.map(p=>({chapter:p.chapter,name:p.name,at:p.at})),
  scores:hotspringScores(s,{final:Boolean(c.charter)})};
}

export function campaignEpilogue(s){
 const c=s.campaign,city=s.game.city,e=s.scenario.campaign.epilogue,m=new Set(c.markers);
 const a=s.scenario.campaign.charters.find(x=>x.id===c.charter);
 const gov=m.has('CONSEIL_ELU')?'Le conseil élu gouverne Hotspring.':m.has('CONSEIL_FONDATEURS')?'Le Conseil des Fondateurs reste en place.':null;
 const paragraphs=a?[a.quote,gov,a.narration].filter(Boolean):['Les décisions de cette campagne demeurent inscrites dans Hotspring.'];
 for(const [k,value] of Object.entries(city)){
  const level=value<=2?0:value<=4?1:value<=7?2:3;
  paragraphs.push(cityLabels[k]+' — '+e[k][level].label+' ('+value+'/10). '+e[k][level].text);
 }
 const memories=[['VILLE_BASSE','VILLE_HAUTE'],
  ['ACCORD_ROMPU','ACCORD_RESPECTE','CHEMIN_DE_FER','GRANDE_MINE','EAU_COMMUNALE','EAU_PRIVEE'],
  ['CENTRE_BRULE','EPIDEMIE_CONTENUE','FAILLITES_EN_CHAINE','SAUVETAGE_BANQUE','PACTE_VALLEE_FINAL','CHARTE_FRONTIERE_LIBRE']];
 for(const group of memories){
  const marker=group.find(x=>m.has(x));
  if(marker)paragraphs.push(e.memories[marker]);
 }
 const {economie,ecologie,securite,demographie}=city;
 const matches=[economie>=8&&ecologie<=3,economie<=3&&ecologie>=7,demographie>=8&&securite<=3,
  securite>=8&&m.has('CONSEIL_FONDATEURS'),demographie<=3&&economie>=7,c.trust>=3&&!m.has('PACTE_VALLEE_FINAL'),
  ecologie<=2&&m.has('EAU_PRIVEE'),securite<=2&&m.has('CHARTE_FRONTIERE_LIBRE')];
 const cross=matches.indexOf(true);
 if(cross>=0)paragraphs.push(e.cross[cross]);
 paragraphs.push(e.closing,'Qu’avez-vous fait de Hotspring ?');
 return {title:a?.title??'Épilogue de Hotspring',paragraphs,city:copy(city)};
}

export function campaignResults(s){
 const scores=hotspringScores(s,{final:true});
 return {...scores,kind:'hotspring-results-v1',text:s.scenario.campaign.epilogue.revealText,
  rows:scores.rows.map(r=>({...r,briefing:campaignFamily(s,r.family).briefing,objectives:campaignFamily(s,r.family).objectives}))};
}
