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
