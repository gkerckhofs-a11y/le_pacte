import {isCurrentChicago,narrativeRegie} from './founders-univers.js';
import {organizerWorkspace,rememberAccess} from './founders-workspace.js';

const route = '/api/founders/cosa-nostra/preparation';
const chapterTitles = ['L’Héritage', 'Le Partage', 'La Guerre des ombres', 'Les Trahisons', 'La Commission'];
const $ = id => document.getElementById(id);
let preparation = null, writing = false, legacyRevision = 0;

function element(tag, text) {
 const node = document.createElement(tag);
 node.textContent = text ?? '';
 return node;
}
function status(text, error = false) {
 $('status').textContent = text;
 $('status').dataset.error = String(error);
}
const request = organizerWorkspace({
 async onOpen() {
  const [response, {sessions}] = await Promise.all([request(route),request('/api/founders/sessions')]);
  legacyRevision = response.legacyRevision ?? 0;
  render(response.preparation);
  const links = sessions.filter(isCurrentChicago).map(session => {
   const item = element('li');
   const a = element('a', session.title + ' · ' + session.code);
   a.href = narrativeRegie(session.id);
   item.append(a);
   return item;
  });
  $('sessions').replaceChildren(...(links.length ? links : [element('li', 'Aucune répétition enregistrée.')]));

  $('loginPanel').hidden = true;
  $('workspace').hidden = false;
 },
 status,
 localAction: 'Ouvrir la régie'
});

function scene(dilemma, metadata, selected) {
 const row = element('div');
 row.className = 'scene';
 if (dilemma.type === 'Crise') {
  const input = element('input');
  input.type = 'checkbox';
  input.value = dilemma.id;
  input.checked = selected.includes(dilemma.id);
  const label = element('label');
  label.append(input, dilemma.id + ' · ' + dilemma.title + ' (crise)');
  row.append(label);
 } else {
  row.append(element('h3', dilemma.id + ' · ' + dilemma.title + ' (pivot)'));
 }
 const details = element('details');
 details.append(element('summary', 'Lecture et issues'), element('p', dilemma.intro), element('p', dilemma.tension));
 const options = element('ul');
 for (const option of dilemma.options) {
  const li = element('li');
  const effects = Object.entries(option.effects).map(([code, delta]) =>
   metadata.gauges[code] + ' ' + (delta > 0 ? '+' : '') + delta);
  li.append(element('strong', option.choice + ' · ' + option.title), element('p', option.public_description),
   element('p',option.public_trends.map(t=>t.name+' '+t.direction).join(' · ')), element('p',option.public_compromise), element('p', option.after),
   element('p', effects.join(' · ') || 'Aucun effet sur les jauges'));
  options.append(li);
 }
 const briefs = element('details');
 briefs.append(element('summary', 'Briefs visuels'),
  element('p', dilemma.visual_direction.opening_scene));
 for (const option of dilemma.options) briefs.append(element('p', option.choice + ' · ' + option.city_visual_result));
 details.append(options, briefs);
 row.append(details);
 return row;
}

function selectedCrises() {
 return [...$('chapters').querySelectorAll('input:checked')].map(input => input.value);
}
function dirty() {
 return selectedCrises().join(',') !== preparation.crisisIds.join(',');
}
function updateSelection() {
 for (const chapter of $('chapters').querySelectorAll('fieldset')) {
  const full = chapter.querySelectorAll('input:checked').length >= 2;
  for (const input of chapter.querySelectorAll('input')) input.disabled = full && !input.checked;
 }
 const crisisIds = selectedCrises();
 const count = 15 + crisisIds.length;
 $('planSummary').textContent = count + ' Conseils sur 25 au maximum · 15 pivots et ' +
  crisisIds.length + (crisisIds.length === 1 ? ' crise' : ' crises');
 $('savePlan').disabled = writing || !dirty();
 $('createSession').disabled = writing || dirty();
 $('importCampaign').disabled = writing;
}

function render(saved) {
 preparation = saved;
 $('campaignPanel').hidden = !saved;
 if (!saved) return;
 const {metadata, dilemmas} = saved.campaign;
 $('members').replaceChildren(...metadata.family_objectives.map(({family}) => {
  const label = element('label', 'Effectif · ' + family);
  const count = element('input');
  Object.assign(count, {type:'number',min:'1',max:'300',value:'5',required:true});
  label.append(count);
  return label;
 }));
 $('sourceVersion').textContent = metadata.version;
 $('importCampaign').textContent = 'Remplacer la campagne';
 $('chapters').replaceChildren(...chapterTitles.map((title, index) => {
  const chapter = element('fieldset');
  chapter.append(element('legend', 'Chapitre ' + (index + 1) + ' · ' + title));
  const scenes = dilemmas.filter(dilemma => dilemma.chapter === index + 1).sort((a, b) => a.number - b.number);
  for (const dilemma of scenes) {
   chapter.append(scene(dilemma, metadata, saved.crisisIds));
  }
  return chapter;
 }));
 $('families').replaceChildren(...metadata.family_objectives.map(objective => {
  const details = element('details');
  const gauge = metadata.gauges[metadata.gauge_mapping[objective.family]];
  details.append(element('summary', objective.family + ' · ' + gauge), element('p', objective.specialty));
  for (const goal of [objective.small, objective.medium, objective.major]) {
   details.append(element('p', goal.points + ' points · ' + goal.condition));
  }
  details.append(element('p', 'Pivots favorables · ' +
   objective.major_slots.map(([id, choice]) => id + ' → ' + choice).join(' · ')));
  const epilogue = element('details');
  epilogue.append(element('summary', 'Épilogue de la famille'), element('p', metadata.winner_epilogues[objective.family]));
  details.append(epilogue);
  return details;
 }));
 updateSelection();
}

$('chapters').addEventListener('change', updateSelection);
$('importForm').addEventListener('submit', async event => {
 event.preventDefault();
 const file = $('campaignFile').files[0];
 if (!file) return;
 if (preparation && !confirm('Remplacer la campagne ? Le parcours reviendra à la sélection initiale.')) return;
 if (writing) return;
 writing = true;
 if (preparation) updateSelection();
 else $('importCampaign').disabled = true;
 try {
  if (file.size > 195_000) throw new Error('Le fichier de campagne est trop volumineux.');
  let campaign;
  try { campaign = JSON.parse(await file.text()); }
  catch { throw new Error('Le fichier doit contenir un JSON valide.'); }
  const response = await request(route, 'PUT', {revision: preparation?.revision ?? legacyRevision, campaign});
  legacyRevision = response.legacyRevision ?? 0;
  render(response.preparation);
  $('importForm').reset();
  status('Campagne importée. Le parcours initial retient les deux premières crises de chaque chapitre.');
 } catch (error) {
  status(error.message, true);
 } finally {
  writing = false;
  if (preparation) updateSelection();
  else $('importCampaign').disabled = false;
 }
});

$('planForm').addEventListener('submit', async event => {
 event.preventDefault();
 if (writing) return;
 writing = true;
 updateSelection();
 try {
  const crisisIds = selectedCrises();
  const response = await request(route, 'PUT', {revision: preparation.revision, crisisIds});
  preparation = response.preparation;
  status('Parcours enregistré.');
 } catch (error) {
  status(error.message, true);
 } finally {
  writing = false;
  updateSelection();
 }
});

$('sessionForm').addEventListener('submit', async event => {
 event.preventDefault();
 if (writing || dirty()) return;
 writing = true;
 updateSelection();
 try {
  const members = [...$('members').querySelectorAll('input')].map(field => Number(field.value));
  const code = 'CN' + Array.from(crypto.getRandomValues(new Uint8Array(5)),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
  const result = await request('/api/founders/cosa-nostra/sessions', 'POST', {
   members, code, title:$('sessionTitle').value.trim(), revision:preparation.revision
  });
  rememberAccess(result);
  location.assign(narrativeRegie(result.id));
 } catch (error) {
  status(error.message, true);
 } finally {
  writing = false;
  updateSelection();
 }
});
