import {averageIndicators} from './founders-scoring.ts';

export const CHICAGO_SCENARIO_ID = 'cosa-nostra-chicago';
export const isChicago = session => session.scenario?.scenario?.id === CHICAGO_SCENARIO_ID;

// The five scenario gauges belong to the organisation. Campaigns saved before these labels
// were introduced receive them when their public view is built.
export function chicagoIndicatorLabels(labels){
 return {...labels,indicatorGroup:'État de la Cosa Nostra',resources:{...labels.resources,stabilite:'Stabilité de la Cosa Nostra'}};
}

const familyAmbitions = {
 Moretti:['La puissance financière','Vous voulez une Cosa Nostra riche, solvable et capable de financer son avenir sans dépendre des intérêts particuliers.'],
 Bellini:['Les relais institutionnels','Vous voulez que la Cosa Nostra dispose de relais solides dans les institutions de Chicago et puisse négocier avec ceux qui détiennent le pouvoir officiel.'],
 Caruso:['L’expansion du réseau','Vous voulez étendre l’implantation de la Cosa Nostra : davantage d’établissements, de quartiers et de circuits sous son influence.'],
 Vitale:['Solidarité du réseau','Vous voulez lier durablement les familles par des engagements communs envers ceux qui font vivre leurs affaires : travailleurs, chauffeurs et proches.'],
 Falcone:['La discipline et le secret','Vous voulez une organisation disciplinée, où l’information circule peu, les engagements sont respectés et les secrets restent à l’intérieur.']
};

export function chicagoObjectiveCopy(family) {
 const [specialty, narrative] = familyAmbitions[family];
 return {specialty, narrative,
  small:{points:2,condition:'Participez avec au moins 1 Influence à deux votes gagnants qui améliorent réellement votre jauge prioritaire.'},
  medium:{points:3,condition:'À la fin des Conseils, votre jauge prioritaire doit faire partie des deux jauges les plus élevées de la Cosa Nostra. Les égalités comptent.'},
  major:{points:5,condition:'Faites adopter les décisions suivantes. Vous marquez les 5 points si vous réussissez au moins 2 de vos 3 décisions-clés.'}
 };
}

export function chicagoAmbition(session, family, score = null) {
 const ambition = session.scenario.chicago.ambitions[family];
 if (!score) {
  return {specialty:ambition.specialty, indicator:ambition.indicator,
   goals:[ambition.small,ambition.medium,ambition.major].map(({points,condition})=>({points,condition})),
   pivots:ambition.pivots.map(({id,title,proposal})=>({id,title,proposal}))};
 }
 const copy = chicagoObjectiveCopy(ambition.family);
 const frozen = Boolean(session.succession);
 const counted = frozen ? score.pivots.slice(0, score.common) : score.pivots;
 const required = frozen ? score.required : 2;
 const successes = counted.filter(decision => decision.favorable).length;
 const active = ['PRESENTATION','NEGOTIATION','COUNCIL','AWAITING_REVEAL'].includes(session.phase);
 const pivots = ambition.major_slots.map(([id, choice]) => {
  const scene = session.scenario.dilemmas.find(d => d.sourceId === id);
  const played = score.pivots.find(decision => decision.id === id);
  return {title:scene.title, choice, proposal:scene.labels[choice.toLowerCase()],
   status:played ? (played.favorable ? 'won' : 'missed') : frozen ? 'unplayed' : 'upcoming',
   excluded:Boolean(frozen && played && !counted.includes(played)),
   current:active && scene.id === session.currentDilemmaId};
 });
 return {specialty:copy.specialty,narrative:copy.narrative,indicator:ambition.indicator,
  priority:session.skin.labels.resources[ambition.indicator],
  goals:[copy.small,copy.medium,copy.major],pivots,
  progress:{successes,required,available:frozen ? score.common : 3,achieved:required>0 && successes>=required,
   shortened:frozen && score.common<3}};
}

export const hasChicagoSuccession = s => isChicago(s) && s.scenario.chicago?.version === 3;

export const chicagoCityIndicators = city => ({...city,stabilite:averageIndicators(Object.values(city))});
