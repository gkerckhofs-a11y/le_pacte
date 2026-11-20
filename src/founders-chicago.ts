export const CHICAGO_SCENARIO_ID = 'cosa-nostra-chicago';
export const isChicago = session => session.scenario?.scenario?.id === CHICAGO_SCENARIO_ID;

export function chicagoAmbition(session, family) {
 const ambition = session.scenario.chicago.ambitions[family];
 return {
  specialty: ambition.specialty,
  indicator: ambition.indicator,
  goals: [ambition.small, ambition.medium, ambition.major].map(({points, condition}) => ({points, condition})),
  pivots: ambition.pivots.map(({id, title, proposal}) => ({id, title, proposal}))
 };
}
