import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foundersPreview} from '../server/founders-catalog.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativePublicView} from '../src/founders-live.ts';
const selection={scenarioId:'fondateurs-hot-spring-demo',skinId:'western'};
test('Projection: result ballots survive reveal, snapshots reflect clipped changes, future outcomes stay private',()=>{
 let s=createNarrativeSession(foundersPreview(selection),{id:'123456789012123456789012',ownerId:'qa',code:'QA01',title:'QA'});
 const org={role:'organizer',id:'qa'};
 const run=(actor,kind,data={})=>{s=applyNarrativeCommand(s,actor,{kind,data,expectedRevision:s.revision},s.updatedAt+1);};
 s.game.city.economie=10;
 run(org,'start');
 for(const f of ['A','B','C','D','E','F'])run({role:'team',family:f},'vote',{kind:['A','C','E'].includes(f)?'pour':'contre',amount:f==='A'?2:1});
 assert.equal(s.phase,'AWAITING_REVEAL');
 assert.equal(narrativePublicView(s).reveal,null);
 assert.deepEqual(narrativePublicView(s).council.choices,{});
 run(org,'reveal');
 const pub=narrativePublicView(s);
 assert.equal(pub.reveal.yes,4);assert.equal(pub.reveal.no,3);
 assert.deepEqual(pub.council.choices,{A:'pour',B:'contre',C:'pour',D:'contre',E:'pour',F:'contre'});
 assert.equal(pub.council.bids.A,2);
 assert.equal(pub.reveal.cityBefore.economie,10);assert.equal(pub.reveal.cityAfter.economie,10);
 assert.equal(pub.reveal.cityBefore.developpement,5);assert.equal(pub.reveal.cityAfter.developpement,7);
 assert.equal(pub.reveal.cityAfter.satisfaction,4);
 pub.reveal.cityBefore.economie=0;assert.equal(s.lastReveal.cityBefore.economie,10);
 assert.equal(JSON.stringify(pub).includes('outcomes'),false);
 run(org,'next');assert.equal(narrativePublicView(s).reveal,null);assert.deepEqual(narrativePublicView(s).council.choices,{});
});
test('Illustrated release has ten images; historical 1.0.0 stays unchanged',()=>{
 const latest=foundersPreview(selection),old=foundersPreview({...selection,scenarioVersion:'1.0.0'});
 assert.equal(latest.selection.scenarioVersion,'1.2.0');
 for(const d of latest.scenario.dilemmas){assert.match(d.image.url,new RegExp('/dilemmas/'+d.id.toLowerCase()+'\\.jpg$'));assert.ok(d.image.alt);}
 for(const d of old.scenario.dilemmas)assert.equal(d.image.url,null);
});
