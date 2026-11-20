import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {serveHotspringTest} from './helpers/hotspring-http.mjs';

test('Les anciennes adresses Chicago servent de vrais WebP, y compris la dernière résolution',async t=>{
 const server=await serveHotspringTest();t.after(server.close);
 for(const file of ['0101-intro.webp','0506-pour.webp','0506-contre.webp']){
  const response=await fetch(server.origin+'/assets/chicago/v3/'+file);
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/^image\/webp/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),readFileSync(new URL('../content/chicago-media/'+file,import.meta.url)));
 }
 assert.equal((await fetch(server.origin+'/assets/chicago/v3/9901-intro.webp')).status,404);
});
