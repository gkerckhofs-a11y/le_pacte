import {chicagoObjectiveCopy} from '../src/founders-chicago.ts';
import {createHash} from 'node:crypto';

const families = ['Moretti', 'Bellini', 'Caruso', 'Vitale', 'Falcone'];
const gauges = ['PRO', 'EMP', 'POL', 'UNI', 'DIS'];
const choices = ['POUR', 'CONTRE'];
const chapters = [1, 2, 3, 4, 5];
const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

function requireValid(condition: unknown, message: string): asserts condition {
 if (!condition) throw new Error(message);
}

function withCurrentChicagoObjectives(campaign) {
 const metadata = campaign.metadata;
 return {...campaign, metadata:{...metadata, family_objectives:metadata.family_objectives.map(objective =>
  ({...objective,...chicagoObjectiveCopy(objective.family)}))}};
}

export function prepareCosaNostra(campaign, crisisIds?) {
 const {metadata, dilemmas} = campaign ?? {};
 requireValid(metadata?.universe === 'Cosa Nostra — Le Trône de Chicago' && text(metadata.version) &&
  metadata.teams === 5 && metadata.chapters === 5 && metadata.dilemmas === 30 &&
  Object.keys(metadata.gauges ?? {}).length === 5 && gauges.every(code => text(metadata.gauges[code])),
 'Métadonnées de la campagne Cosa Nostra invalides.');
 requireValid(metadata.vote_format === 'POUR_CONTRE' && metadata.choice_count === 2, 'Importez la campagne V3 binaire POUR/CONTRE.');
 requireValid(Array.isArray(dilemmas) && dilemmas.length === 30, 'La campagne doit contenir 30 dilemmes.');
 const byId = new Map<string, any>();
 for (const dilemma of dilemmas) {
  requireValid(chapters.includes(dilemma?.chapter) && Number.isInteger(dilemma.number) &&
   dilemma.number >= 1 && dilemma.number <= 6 &&
   dilemma.id === '0' + dilemma.chapter + '.0' + dilemma.number &&
   !byId.has(dilemma.id) && ['Pivot', 'Crise'].includes(dilemma.type) &&
   [dilemma.title, dilemma.intro, dilemma.tension, dilemma.visual_direction?.opening_scene].every(text),
  'Identifiant, chapitre ou lecture de dilemme invalide.');
  requireValid(Array.isArray(dilemma.options) && dilemma.options.length === 2 &&
   choices.every(choice => dilemma.options.filter(option => option?.choice === choice).length === 1),
  'Deux issues POUR et CONTRE sont requises pour le dilemme ' + dilemma.id + '.');
  for (const option of dilemma.options) {
   const effects = option.effects;
   const trends = option.public_trends;
   requireValid(text(option.public_description) && text(option.public_compromise) &&
    Array.isArray(trends) && trends.length > 0 && trends.length <= 3 &&
    new Set(trends.map(t => t?.gauge)).size === trends.length &&
    trends.every(t => gauges.includes(t?.gauge) && t.name === metadata.gauges[t.gauge] &&
     (t.direction === '↑' ? effects?.[t.gauge] > 0 : t.direction === '↓' && effects?.[t.gauge] < 0)),
   'Présentation publique ou tendance invalide dans le dilemme ' + dilemma.id + '.');
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
 const pivots = new Map<string, string>();
 const markers = new Set<string>();
 for (const objective of objectives) {
  requireValid(text(objective.specialty) && text(objective.small?.condition) && objective.small.points === 2 &&
   text(objective.medium?.condition) && objective.medium.points === 3 &&
   text(objective.major?.condition) && objective.major.points === 5 &&
   Array.isArray(objective.major_slots) && objective.major_slots.length === 3,
  'Objectifs invalides pour la famille ' + objective.family + '.');
  for (const slot of objective.major_slots) {
   requireValid(Array.isArray(slot) && slot.length === 3, 'Référence de pivot invalide.');
   const [id, choice, marker] = slot;
   requireValid(!markers.has(marker) && !pivots.has(id) && byId.get(id)?.type === 'Pivot' &&
    byId.get(id).options.find(option => option.choice === choice)?.secret_success === marker && text(marker),
   'Marqueur ou référence de pivot invalide pour la famille ' + objective.family + '.');
   pivots.set(id, choice);
   markers.add(marker);
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
 for (const scene of ordered) {
  requireValid(scene.options.every(option => option.choice === pivots.get(scene.id) || option.secret_success == null),
   'Marqueur secret en dehors du pivot ' + scene.id + '.');
 }
 const updated = withCurrentChicagoObjectives(campaign);
 return {campaign:updated, crisisIds: crises.filter(d => selected.includes(d.id)).map(d => d.id),
  checksum: createHash('sha256').update(JSON.stringify(updated)).digest('hex')};
}
