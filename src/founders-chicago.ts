import {averageIndicators} from './founders-scoring.ts';

export const CHICAGO_SCENARIO_ID = 'cosa-nostra-chicago';
export const isChicago = session => session.scenario?.scenario?.id === CHICAGO_SCENARIO_ID;

export function chicagoAmbition(session, family) {
 const ambition = session.scenario.chicago.ambitions[family];
 return {
  specialty: ambition.specialty,
  indicator: ambition.indicator,
  goals: [ambition.small, hasChicagoSuccession(session)?{
   ...ambition.medium,
   condition:'Votre jauge prioritaire (« '+session.skin.labels.resources[ambition.indicator]+' ») figure parmi les deux plus élevées de Chicago, ex æquo compris.'
  }:ambition.medium, ambition.major].map(({points, condition}) => ({points, condition})),
  pivots: ambition.pivots.map(({id, title, proposal}) => ({id, title, proposal}))
 };
}

export const hasChicagoSuccession = s => isChicago(s) && s.scenario.chicago?.version === 3;

export const chicagoCityIndicators = city => ({...city,stabilite:averageIndicators(Object.values(city))});
