import {createHash} from 'node:crypto';
import {DEFAULT_GOAL_CARDS,DEFAULT_SCORE_RULES} from '../src/founders-scoring.ts';
import {parseFoundersSheets} from '../src/founders-sheet-import.ts';
import skins from '../content/founders-skins-v1.json' with {type:'json'};
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
   goalCardPresets:structuredClone(DEFAULT_GOAL_CARDS),scoreRulesPreset:structuredClone(DEFAULT_SCORE_RULES)};
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
