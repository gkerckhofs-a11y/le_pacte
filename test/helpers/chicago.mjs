import {readFileSync} from 'node:fs';
const names = ['Moretti', 'Bellini', 'Caruso', 'Vitale', 'Falcone'];
const gauges = ['PRO', 'POL', 'EMP', 'UNI', 'DIS'];

export function fixture() {
 if (process.env.COSA_NOSTRA_TEST_CAMPAIGN) {
  return JSON.parse(readFileSync(process.env.COSA_NOSTRA_TEST_CAMPAIGN));
 }
 const dilemmas = names.flatMap((_, index) => Array.from({length: 6}, (_, position) => ({
  id: `0${index + 1}.0${position + 1}`, chapter: index + 1, number: position + 1,
  type: position < 3 ? 'Pivot' : 'Crise', title: 'Titre', intro: 'Lecture', tension: 'Tension',
  visual_direction: {opening_scene: 'Ouverture'},
  options: ['POUR','CONTRE'].map(choice => ({
   choice, public_description:'Description publique', public_compromise:'Compromis public',
   public_trends:[{gauge:'PRO',name:'PRO',direction:'↑'}], title: 'Issue ' + choice, after: 'Résolution', effects: {PRO: 5}, city_visual_result: 'Décor',
   secret_success: choice === 'POUR' && position < 3 ? `pivot-${index}-${position}` : null
  }))
 })));
 const gaugeMapping = Object.fromEntries(names.map((family, index) => [family, gauges[index]]));
 return {metadata: {
  universe: 'Cosa Nostra — Le Trône de Chicago', version: 'V3 synthétique', vote_format:'POUR_CONTRE', choice_count:2,
  teams: 5, chapters: 5, dilemmas: 30, gauges: Object.fromEntries(gauges.map(code => [code, code])),
  winner_epilogues: Object.fromEntries(names.map(family => [family, 'Épilogue de ' + family])),
  gauge_mapping: gaugeMapping,
  family_objectives: names.map((family, index) => ({
   family, specialty: 'Spécialité', small: {points: 2, condition: 'Petit'},
   medium: {points: 3, condition: 'Intermédiaire'}, major: {points: 5, condition: 'Majeur'},
   major_slots: dilemmas.slice(index * 6, index * 6 + 3).map(d => [d.id, 'POUR', d.options[0].secret_success])
  }))
 }, dilemmas};
}

