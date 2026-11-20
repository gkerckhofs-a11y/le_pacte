import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {prepareCosaNostra} from '../server/cosa-nostra-preparation.ts';
import {createGameServer} from '../server/http.ts';
import {GameStore} from '../server/store.ts';
import {castFoundersAction, createFoundersGame, openFoundersDilemma} from '../src/founders.ts';

const route = '/api/founders/cosa-nostra/preparation';
const organizer = 'organizer-a-test-token-00000000000';
const otherOrganizer = 'organizer-b-test-token-00000000000';
const familyToken = 'team-test-token-000000000000000000';
const names = ['Moretti', 'Bellini', 'Caruso', 'Vitale', 'Falcone'];
const gauges = ['PRO', 'POL', 'EMP', 'UNI', 'DIS'];

function fixture() {
 if (process.env.COSA_NOSTRA_TEST_CAMPAIGN) {
  return JSON.parse(readFileSync(process.env.COSA_NOSTRA_TEST_CAMPAIGN));
 }
 const dilemmas = names.flatMap((_, index) => Array.from({length: 6}, (_, position) => ({
  id: `0${index + 1}.0${position + 1}`, chapter: index + 1, number: position + 1,
  type: position < 3 ? 'Pivot' : 'Crise', title: 'Titre', intro: 'Lecture', tension: 'Tension',
  visual_direction: {opening_scene: 'Ouverture'},
  options: ['A', 'B', 'C'].map(choice => ({
   choice, title: 'Issue', after: 'Résolution', effects: {PRO: 5}, city_visual_result: 'Décor',
   secret_success: choice === 'C' && position < 3 ? `pivot-${index}-${position}` : null
  }))
 })));
 const gaugeMapping = Object.fromEntries(names.map((family, index) => [family, gauges[index]]));
 return {metadata: {
  universe: 'Cosa Nostra — Le Trône de Chicago', version: 'V2 (jeu de données de test)',
  teams: 5, chapters: 5, dilemmas: 30, gauges: Object.fromEntries(gauges.map(code => [code, code])),
  winner_epilogues: Object.fromEntries(names.map(family => [family, 'Épilogue de ' + family])),
  gauge_mapping: gaugeMapping,
  family_objectives: names.map((family, index) => ({
   family, specialty: 'Spécialité', small: {points: 2, condition: 'Petit'},
   medium: {points: 3, condition: 'Intermédiaire'}, major: {points: 5, condition: 'Majeur'},
   major_slots: dilemmas.slice(index * 6, index * 6 + 3).map(d => [d.id, 'C', d.options[2].secret_success])
  }))
 }, dilemmas};
}

test('Cosa Nostra V2 conserve les 30 scènes et valide la réserve, les effets et les pivots', () => {
 const campaign = fixture();
 const prepared = prepareCosaNostra(campaign);
 assert.deepEqual(prepared.campaign, campaign);
 assert.equal(prepared.crisisIds.length, 10);
 assert.equal(prepareCosaNostra(campaign, []).checksum, prepared.checksum);
 const chapterCrises = campaign.dilemmas.filter(d => d.chapter === 1 && d.type === 'Crise');
 assert.throws(() => prepareCosaNostra(campaign, chapterCrises.map(d => d.id)), /deux crises/);
 assert.throws(() => prepareCosaNostra(campaign, [prepared.crisisIds[0], prepared.crisisIds[0]]), /doublon/);

 const invalid = structuredClone(campaign);
 const [id, choice] = invalid.metadata.family_objectives[0].major_slots[0];
 invalid.dilemmas.find(d => d.id === id).options.find(o => o.choice === choice).secret_success = 'autre-marqueur';
 assert.throws(() => prepareCosaNostra(invalid), /référence de pivot/);
 invalid.dilemmas[0].options.pop();
 assert.throws(() => prepareCosaNostra(invalid), /Trois issues/);
});

test('Le moteur binaire peut choisir une issue C seulement via une correspondance éditoriale explicite', () => {
 const campaign = fixture();
 const pivot = campaign.dilemmas.find(d => d.type === 'Pivot' && d.options.some(o => o.choice === 'C' && o.secret_success));
 const mapping = {pour: 'C', contre: 'A'};
 const initial = createFoundersGame({members: [1, 1, 1, 1, 1]});
 const engineId = 'CN_' + pivot.id.replace('.', '_');
 assert.throws(() => openFoundersDilemma(initial, pivot.id), /Dilemme invalide/);
 const game = openFoundersDilemma(initial, engineId);
 assert.throws(() => castFoundersAction(game, game.vote.turn, {kind: 'C', amount: 1}), /Premier vote invalide/);

 for (const side of ['pour', 'contre']) {
  let resolved = game;
  for (let turn = 0; turn < 10 && resolved.vote; turn++) {
   const who = resolved.vote.turn;
   const kind = Object.hasOwn(resolved.vote.choices, who) ? 'maintien' : side;
   resolved = castFoundersAction(resolved, who, {kind, amount: 1});
  }
  assert.equal(resolved.vote, null);
  assert.equal(resolved.history.at(-1).id, engineId);
  const option = pivot.options.find(o => o.choice === mapping[resolved.history.at(-1).winner]);
  assert.equal(option.choice, side === 'pour' ? 'C' : 'A');
  assert.equal(Boolean(option.secret_success), side === 'pour');
 }
});

test('La régie est reliée à l’accueil et sa préparation est authentifiée, isolée et révisée', async t => {
 const store = new GameStore(':memory:');
 const accounts = new Map([[organizer, 'organizer-a'], [otherOrganizer, 'organizer-b']]);
 const server = createGameServer(store, organizer, Date.now, {
  verifyOperator: async token => accounts.has(token) ? {uid: accounts.get(token), organizer: true, editor: false} : null
 });
 server.listen(0, '127.0.0.1');
 await once(server, 'listening');
 t.after(() => {server.closeAllConnections(); server.close(); store.close();});
 const base = 'http://127.0.0.1:' + server.address().port;
 const call = (token, body) => fetch(base + route, {
  method: body ? 'PUT' : 'GET',
  headers: {...(token ? {authorization: 'Bearer ' + token} : {}), ...(body ? {'content-type': 'application/json'} : {})},
  body: body ? JSON.stringify(body) : undefined
 });

 const home = await fetch(base + '/');
 assert.match(await home.text(), /href="\/cosa-nostra"/);
 const page = await fetch(base + '/cosa-nostra');
 assert.equal(page.status, 200);
 assert.match(await page.text(), /Régie de préparation/);
 assert.equal((await fetch(base + '/cosa-nostra.js')).status, 200);
 assert.equal((await call()).status, 403);
 assert.equal((await call(familyToken, {revision: 0, campaign: fixture()})).status, 403);
 assert.deepEqual(await (await call(organizer)).json(), {preparation: null});

 const campaign = fixture();
 const imported = await call(organizer, {revision: 0, campaign});
 assert.equal(imported.status, 200);
 const {preparation} = await imported.json();
 assert.equal(preparation.revision, 1);
 assert.deepEqual(preparation.campaign, campaign);
 assert.deepEqual(await (await call(otherOrganizer)).json(), {preparation: null});

 const updates = await Promise.all([
  call(organizer, {revision: 1, crisisIds: []}),
  call(organizer, {revision: 1, crisisIds: []})
 ]);
 assert.deepEqual(updates.map(response => response.status).sort(), [200, 409]);
 const {preparation: saved} = await (await call(organizer)).json();
 assert.equal(saved.revision, 2);
 assert.deepEqual(saved.crisisIds, []);
 assert.equal(saved.checksum, preparation.checksum);
 assert.deepEqual(saved.campaign, campaign);
});
