import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const source=readFileSync('functions/lib/index.js','utf8');
assert.ok(!source.includes("from 'node:sqlite'")&&!source.includes('from "node:sqlite"'),'Cloud bundle must not load local SQLite');
assert.ok(source.includes('verifyOperator'),'Cloud operator verification required');
assert.ok(readFileSync('dist/public/firebase-auth.js','utf8').length>1000,'Browser Auth bundle missing');
console.log('Cloud and browser bundles verified');
