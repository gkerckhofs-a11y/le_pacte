import {createHash} from 'node:crypto';

const families = ['Moretti', 'Bellini', 'Caruso', 'Vitale', 'Falcone'];
const gauges = ['PRO', 'EMP', 'POL', 'UNI', 'DIS'];
const choices = ['A', 'B', 'C'];
const chapters = [1, 2, 3, 4, 5];
const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

function requireValid(condition: unknown, message: string): asserts condition {
 if (!condition) throw new Error(message);
}

export function prepareCosaNostra(campaign, crisisIds?) {
 const {metadata, dilemmas} = campaign ?? {};
 requireValid(metadata?.universe === 'Cosa Nostra — Le Trône de Chicago' && text(metadata.version) &&
  metadata.teams === 5 && metadata.chapters === 5 && metadata.dilemmas === 30 &&
  Object.keys(metadata.gauges ?? {}).length === 5 && gauges.every(code => text(metadata.gauges[code])),
 'Métadonnées de la campagne Cosa Nostra invalides.');
 requireValid(Array.isArray(dilemmas) && dilemmas.length === 30, 'La campagne doit contenir 30 dilemmes.');
 const byId = new Map<string, any>();
 for (const dilemma of dilemmas) {
  requireValid(chapters.includes(dilemma?.chapter) && Number.isInteger(dilemma.number) &&
   dilemma.number >= 1 && dilemma.number <= 6 &&
   dilemma.id === '0' + dilemma.chapter + '.0' + dilemma.number &&
   !byId.has(dilemma.id) && ['Pivot', 'Crise'].includes(dilemma.type) &&
   [dilemma.title, dilemma.intro, dilemma.tension, dilemma.visual_direction?.opening_scene].every(text),
  'Identifiant, chapitre ou lecture de dilemme invalide.');
  requireValid(Array.isArray(dilemma.options) && dilemma.options.length === 3 &&
   choices.every(choice => dilemma.options.filter(option => option?.choice === choice).length === 1),
  'Trois issues A, B et C sont requises pour le dilemme ' + dilemma.id + '.');
  for (const option of dilemma.options) {
   const effects = option.effects;
   requireValid([option.title, option.after, option.city_visual_result].every(text) &&
    effects && typeof effects === 'object' && !Array.isArray(effects) &&
    Object.entries(effects).every(([code, delta]) => gauges.includes(code) &&
     Number.isSafeInteger(delta) && Math.abs(Number(delta)) <= 100),
   'Issue ou effet de jauge invalide dans le dilemme ' + dilemma.id + '.');
  }
  byId.set(dilemma.id, dilemma);
 }

 const objectives = metadata.family_objectives;
 requireValid(Array.isArray(objectives) && objectives.length === 5 &&
  families.every(family => objectives.filter(objective => objective?.family === family).length === 1) &&
  new Set(families.map(family => metadata.gauge_mapping?.[family])).size === 5 &&
  families.every(family => gauges.includes(metadata.gauge_mapping?.[family]) && text(metadata.winner_epilogues?.[family])),
 'Familles, jauges associées ou épilogues invalides.');
 const pivots = new Set<string>();
 for (const objective of objectives) {
  requireValid(text(objective.specialty) && text(objective.small?.condition) && objective.small.points === 2 &&
   text(objective.medium?.condition) && objective.medium.points === 3 &&
   text(objective.major?.condition) && objective.major.points === 5 &&
   Array.isArray(objective.major_slots) && objective.major_slots.length === 3,
  'Objectifs invalides pour la famille ' + objective.family + '.');
  for (const slot of objective.major_slots) {
   requireValid(Array.isArray(slot) && slot.length === 3, 'Référence de pivot invalide.');
   const [id, choice, marker] = slot;
   requireValid(!pivots.has(id) && byId.get(id)?.type === 'Pivot' &&
    byId.get(id).options.find(option => option.choice === choice)?.secret_success === marker && text(marker),
   'Marqueur ou référence de pivot invalide pour la famille ' + objective.family + '.');
   pivots.add(id);
  }
 }
 const ordered = [...dilemmas].sort((a, b) => a.chapter - b.chapter || a.number - b.number);
 const crises = ordered.filter(dilemma => dilemma.type === 'Crise');
 requireValid(chapters.every(chapter => dilemmas.filter(d => d.chapter === chapter && d.type === 'Pivot').length === 3),
  'Chaque chapitre doit contenir trois pivots.');
 const selected = crisisIds ?? chapters.flatMap(chapter => crises.filter(d => d.chapter === chapter).slice(0, 2).map(d => d.id));
 requireValid(Array.isArray(selected) && new Set(selected).size === selected.length &&
  selected.every(id => byId.get(id)?.type === 'Crise') &&
  chapters.every(chapter => selected.filter(id => byId.get(id).chapter === chapter).length <= 2),
 'Choisissez au maximum deux crises par chapitre, sans doublon.');
 return {campaign, crisisIds: crises.filter(d => selected.includes(d.id)).map(d => d.id),
  checksum: createHash('sha256').update(JSON.stringify(campaign)).digest('hex')};
}
