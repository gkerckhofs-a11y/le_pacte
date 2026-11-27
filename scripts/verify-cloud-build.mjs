import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import cinema from '../content/hotspring-cinema-v1.json' with {type:'json'};
const source=readFileSync('functions/lib/index.js','utf8');
assert.ok(!source.includes("from 'node:sqlite'")&&!source.includes('from "node:sqlite"'),'Cloud bundle must not load local SQLite');
assert.ok(source.includes('verifyOperator'),'Cloud operator verification required');
assert.ok(readFileSync('dist/public/firebase-auth.js','utf8').length>1000,'Browser Auth bundle missing');
await import('./verify-chicago-media.mjs');
const cinemaFiles=new Set(cinema.views.map(view=>view.url));
for(const url of cinemaFiles){
 const built=readFileSync('dist/public'+url);
 assert.equal(built.toString('ascii',8,12),'WEBP',url+' doit contenir une image WebP');
 assert.ok(built.equals(readFileSync('public'+url)),url+' doit correspondre à la vue du manifeste');
}
console.log('Hotspring : '+cinemaFiles.size+' vues de cinéma vérifiées dans le site compilé');
console.log('Cloud and browser bundles verified');
