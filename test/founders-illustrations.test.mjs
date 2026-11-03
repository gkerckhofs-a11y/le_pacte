import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateFoundersStory} from '../src/founders-library.ts';
import {foundersPreview} from '../server/founders-catalog.ts';
const root=new URL('../',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
test('Illustrated hybrid release: 20 unique dilemma scenes and 40 distinct resolutions, files present',()=>{
 const story=read('content/founders-hybrid-demo-v1-3.json');
 const manifest=read('content/founders-illustrations-v1.json');
 assert.deepEqual(validateFoundersStory(story),[]);
 assert.equal(Object.keys(manifest).length,50);
 const images=story.dilemmas.flatMap(d=>[d.image,...Object.values(d.outcomes).map(o=>o.chronicle.image)]);
 assert.equal(images.length,60);assert.equal(new Set(images.map(i=>i.url)).size,60);
 for(const im of images){const path='public/'+new URL(im.url).pathname.slice(1);assert.ok(existsSync(new URL(path,root)),path);assert.ok(im.alt.trim());}
 const hashes=new Set();
 for(const entry of Object.values(manifest)){
  const data=readFileSync(new URL(entry.path,root));
  assert.equal(data.subarray(0,4).toString(),'RIFF');assert.equal(data.subarray(8,12).toString(),'WEBP');
  const hash=createHash('sha256').update(data).digest('hex');assert.equal(hash,entry.sha256);hashes.add(hash);
 }
 assert.equal(hashes.size,50);
});
test('Artwork does not change calibrated effects or past releases',()=>{
 const bare=read('content/founders-hybrid-demo-v1-2.json');
 const illustrated=read('content/founders-hybrid-demo-v1-3.json');
 for(const [i,d] of illustrated.dilemmas.entries()){
  d.image=bare.dilemmas[i].image;
  for(const o of Object.values(d.outcomes))delete o.chronicle.image;
 }
 assert.deepEqual(illustrated,bare);
 const previous=foundersPreview({scenarioId:'hot-spring-reserve-hybride',scenarioVersion:'1.2.0',skinId:'western'});
 assert.equal(previous.scenario.dilemmas[0].outcomes.pour.chronicle.image,undefined);
 const latest=foundersPreview({scenarioId:'hot-spring-reserve-hybride',skinId:'western'});
 assert.equal(latest.selection.scenarioVersion,'1.3.0');
 assert.match(latest.scenario.dilemmas[0].outcomes.pour.chronicle.image.url,/d01-pour.webp$/);
});
