import {createHash} from 'node:crypto';
import {DEFAULT_GOAL_CARDS,DEFAULT_SCORE_RULES} from '../src/founders-scoring.ts';
import {FOUNDERS_DEFAULT_CALIBRATION} from '../src/founders.ts';
import {parseFoundersSheets} from '../src/founders-sheet-import.ts';
import skins from '../content/founders-skins-v1.json' with {type:'json'};
import illustrations from '../content/founders-dilemma-illustrations-v1.json' with {type:'json'};
import chronicles from '../content/founders-chronicles-v1.json' with {type:'json'};
import story from '../content/fondateurs-sheet-sample-v1.json' with {type:'json'};
import {createFoundersLibrary,registerFoundersSkin,publishFoundersScenario,listFoundersLibrary,prepareFoundersSession,validateFoundersStory} from '../src/founders-library.ts';

// Bundled sample is deliberately NOT linked to a private user's Sheets ID.
// Imports from actual Sheets will be stored in a separate authenticated, durable studio.
let library=createFoundersLibrary();
for(const skin of skins.skins)library=registerFoundersSkin(library,skin);
library=publishFoundersScenario(library,{
 payload:story,version:'1.0.0',
 source:{type:'bundled_fixture',label:'Exemple narratif intégré (sans synchronisation Google Sheets)'}
});
const illustratedStory=structuredClone(story);
for(const d of illustratedStory.dilemmas)d.image=structuredClone(illustrations[d.id]);
library=publishFoundersScenario(library,{payload:illustratedStory,version:'1.1.0',
 source:{type:'bundled_fixture',label:'Hot Spring illustré — dix scènes avant décision'}});
const chronicledStory=structuredClone(illustratedStory);
for(const d of chronicledStory.dilemmas)for(const side of ['pour','contre']){
 const c=chronicles[d.id][side];
 d.outcomes[side].narration=c.narration;
 d.outcomes[side].chronicle={title:c.title,summary:c.summary};
}
library=publishFoundersScenario(library,{payload:chronicledStory,version:'1.2.0',
 source:{type:'bundled_fixture',label:'Hot Spring — chroniques des vingt issues (règles inchangées)'}});
export const foundersLibrary=library;
export const foundersCatalog=()=>listFoundersLibrary(foundersLibrary);
export const foundersPreview=selection=>prepareFoundersSession(foundersLibrary,selection);
export const foundersStoryCheck=payload=>({valid:validateFoundersStory(payload).length===0,errors:validateFoundersStory(payload)});

/**
 * Assemble the built-in fixture and the private durable published versions.
 * Persistent releases take priority over the illustrative bundled fixture.
 * The private Google Sheets ID stays in the protected source record, not in
 * the catalogue summary.
 */
export async function founderLibraryFor(store,ownerId){
 let result=structuredClone(foundersLibrary);
 if(!store.founders)return result; // isolated public/legacy HTTP fixtures
 const releases=await store.founders.list(ownerId);
 for(const release of releases){
  const id=release.payload.scenario.id;
  if(Object.hasOwn(result.scenarios,id)&&
      result.scenarios[id].releases[release.version]?.source.type==='bundled_fixture')
   delete result.scenarios[id].releases[release.version];
  result=publishFoundersScenario(result,release);
 }
 return result;
}
export async function foundersCatalogFor(store,ownerId){
 return {...listFoundersLibrary(await founderLibraryFor(store,ownerId)),
   goalCardPresets:structuredClone(DEFAULT_GOAL_CARDS),scoreRulesPreset:structuredClone(DEFAULT_SCORE_RULES),
   calibrationPreset:structuredClone(FOUNDERS_DEFAULT_CALIBRATION)};
}
export async function foundersPreviewFor(store,ownerId,selection){
 return prepareFoundersSession(await founderLibraryFor(store,ownerId),selection);
}
export function prepareFoundersSheetsImport(input){
 const source=input?.source;
 if(!source||source.type!=='google_sheets'||typeof source.spreadsheetId!=='string'||
    !/^[A-Za-z0-9_-]{15,160}$/.test(source.spreadsheetId)||
    typeof source.label!=='string'||source.label.trim().length<1||source.label.length>160)
   throw new Error('Référence du Google Sheets invalide');
 const parsed=parseFoundersSheets(input.tabs);
 const checksum=parsed.valid?createHash('sha256').update(JSON.stringify(parsed.story)).digest('hex'):null;
 return {...parsed,checksum};
}
