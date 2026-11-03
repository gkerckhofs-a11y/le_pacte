import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createFoundersLibrary,registerFoundersSkin,publishFoundersScenario,
 validateFoundersStory,validateFoundersSkin,listFoundersLibrary,prepareFoundersSession
} from '../src/founders-library.ts';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const sample=()=>read('../content/fondateurs-sheet-sample-v1.json');
const skins=()=>read('../content/founders-skins-v1.json').skins;
const source=(spreadsheetId='TEST_source_123456789_ABC')=>({type:'google_sheets',spreadsheetId,label:'Master de test'});
const seed=()=>{
 let library=createFoundersLibrary();
 for(const skin of skins())library=registerFoundersSkin(library,skin);
 library=publishFoundersScenario(library,{payload:sample(),source:source(),version:'1.0.0'});
 return library;
};
test('Le fixture Sheets passe la validation référentielle et possède 10 dilemmes',()=>{
 const story=sample();
 assert.deepEqual(validateFoundersStory(story),[]);
 assert.equal(story.dilemmas.length,10);
 assert.equal(story.scenario.entry_dilemma,'D01');
 assert.equal(story.dilemmas[0].outcomes.pour.next_id,'D02');
 assert.equal(story.dilemmas[0].outcomes.contre.next_id,'D03');
});
test('Cinq skins valides, contenu visuel sans influence sur les calculs',()=>{
 const entries=skins();assert.equal(entries.length,5);
 for(const skin of entries)assert.deepEqual(validateFoundersSkin(skin),[]);
 const catalog=seed(),names=listFoundersLibrary(catalog);
 assert.equal(names.skins.length,5);
 assert.equal(names.scenarios.length,1);
 assert.equal(names.scenarios[0].dilemmas,10);
 assert.equal(names.scenarios[0].sourceType,'google_sheets');
 assert.equal(names.scenarios[0].spreadsheetId,undefined);
});
test('Plusieurs Google Sheets et versions coexistent sans écrasement',()=>{
 const first=seed(),other=sample();other.scenario.id='fondateurs-autre-ville';other.scenario.title='Les négociants de la frontière';
 let library=publishFoundersScenario(first,{payload:other,source:source('SECOND_sheet_987654321_ABC'),version:'1.0.0'});
 const updated=sample();updated.scenario.title='Hot Spring — mise à jour';
 library=publishFoundersScenario(library,{payload:updated,source:source(),version:'1.1.0'});
 assert.equal(listFoundersLibrary(library).scenarios.length,2);
 assert.equal(library.scenarios['fondateurs-hot-spring-demo'].releases['1.0.0'].payload.scenario.title,sample().scenario.title);
 assert.equal(library.scenarios['fondateurs-hot-spring-demo'].releases['1.1.0'].payload.scenario.title,'Hot Spring — mise à jour');
 assert.throws(()=>publishFoundersScenario(library,{payload:updated,source:source(),version:'1.1.0'}),/déjà publiée/);
});
test('Le choix scénario/skin est indépendant et préserve le récit',()=>{
 const library=seed();
 const s=prepareFoundersSession(library,{scenarioId:'fondateurs-hot-spring-demo',skinId:'futuriste',members:[5,6,7,8,9,10]});
 assert.equal(s.previewOnly,true);
 assert.equal(s.skin.universe,'futuriste');
 assert.equal(s.scenario.scenario.universe,'western');
 assert.equal(s.scenario.dilemmas[0].title,'Le monopole du chemin de fer');
 assert.deepEqual(s.settings.members,[5,6,7,8,9,10]);
 assert.equal(s.settings.spokespersonVotingAccessPerFamily,1);
 assert.ok(s.warnings.some(v=>v.includes('Univers différent')));
 assert.equal(s.game.families.F.members,10);
 assert.equal(s.game.families.A.power,8);
 s.skin.theme.accent='#000000';s.scenario.dilemmas[0].title='Mutation';
 assert.notEqual(library.skins.futuriste.theme.accent,'#000000');
 assert.equal(library.scenarios['fondateurs-hot-spring-demo'].releases['1.0.0'].payload.dilemmas[0].title,'Le monopole du chemin de fer');
});
test('Les données invalides sont refusées sans modifier le catalogue',()=>{
 const library=seed(),broken=sample();
 broken.dilemmas[0].outcomes.pour.next_id='D99';
 assert.ok(validateFoundersStory(broken).some(x=>x.includes('D99')));
 assert.throws(()=>publishFoundersScenario(library,{payload:broken,source:source(),version:'1.1.0'}));
 const untrusted=sample();untrusted.dilemmas[0].image.url='javascript:alert(1)';
 assert.ok(validateFoundersStory(untrusted).some(x=>x.includes('image.url')));
 const unsafe=sample();unsafe.dilemmas[0].outcomes.pour.effects[0].operation='execute';
 assert.ok(validateFoundersStory(unsafe).some(x=>x.includes('operation')));
 assert.equal(listFoundersLibrary(library).scenarios[0].releases.length,1);
 assert.throws(()=>prepareFoundersSession(library,{scenarioId:'missing',skinId:'western'}));
 assert.throws(()=>prepareFoundersSession(library,{scenarioId:'fondateurs-hot-spring-demo',skinId:'missing'}));
 assert.throws(()=>prepareFoundersSession(library,{scenarioId:'fondateurs-hot-spring-demo',skinId:'western',members:[5]}));
});
test('Archive, image et statut du scénario contrôlés au prévol',()=>{
 const library=seed(),archived=structuredClone(library);
 archived.skins.mafia.status='archived';
 assert.throws(()=>prepareFoundersSession(archived,{scenarioId:'fondateurs-hot-spring-demo',skinId:'mafia'}));
 archived.scenarios['fondateurs-hot-spring-demo'].releases['1.0.0'].payload.scenario.status='archived';
 assert.throws(()=>prepareFoundersSession(archived,{scenarioId:'fondateurs-hot-spring-demo',skinId:'western'}));
 const s=prepareFoundersSession(library,{scenarioId:'fondateurs-hot-spring-demo',skinId:'western'});
 assert.ok(s.warnings.some(x=>x.includes('Décor public')));
});

test('Les identifiants hérités et les entrées JSON malformées ne corrompent pas la bibliothèque',()=>{
 const catalog=seed();
 const story=sample();story.scenario.id='constructor';
 const updated=publishFoundersScenario(catalog,{payload:story,source:source(),version:'1.0.0'});
 assert.equal(updated.scenarios.constructor.id,'constructor');
 assert.equal(listFoundersLibrary(updated).scenarios.length,2);
 const bad=sample();bad.dilemmas.push(null);
 assert.ok(validateFoundersStory(bad).length>0);
 assert.throws(()=>publishFoundersScenario(catalog,{payload:bad,source:source(),version:'1.1.0'}));
});
