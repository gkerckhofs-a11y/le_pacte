import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foundersPreview} from '../server/founders-catalog.ts';
import {validateFoundersStory} from '../src/founders-library.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativePublicView} from '../src/founders-live.ts';
import {latestChronicle,chronicleChangeText} from '../public/founders-chronicle.js';
const org={role:'organizer',id:'qa'};
const fixture=(version='1.2.0')=>createNarrativeSession(foundersPreview({scenarioId:'fondateurs-hot-spring-demo',skinId:'western',scenarioVersion:version}),{id:'123456789012123456789012',ownerId:'qa',code:'QA01',title:'QA'});
function run(s,actor,kind,data={}){return applyNarrativeCommand(s,actor,{kind,data,expectedRevision:s.revision},s.updatedAt+1);}
function vote(s){while(s.game.vote?.phase==='voting'){const f=s.game.vote.turn;s=run(s,{role:'team',family:f},'vote',{kind:'pour',amount:1});}return s;}
test('Chronicle: remains sealed, then persists through next council, JSON reload and final result',()=>{
 let s=fixture();s.game.city.economie=10;
 const d=s.scenario.dilemmas[0];
 d.outcomes.pour.chronicle.image={url:'https://example.org/adopted.jpg',alt:'Le contrat signé',credit:null,license:null};
 d.outcomes.contre.chronicle={title:'SECRET_REJECTED',summary:'SECRET_ALTERNATIVE',image:{url:'https://example.org/rejected-secret.jpg',alt:'Secret',credit:null,license:null}};
 assert.equal(latestChronicle(narrativePublicView(s)),null);
 s=run(s,org,'start');s=vote(s);
 assert.equal(s.phase,'AWAITING_REVEAL');
 assert.equal(JSON.stringify(narrativePublicView(s)).includes('Le prix du rail'),false);
 s=run(s,org,'reveal');let pub=narrativePublicView(s),chapter=latestChronicle(pub);
 assert.equal(chapter.title,'Le prix du rail');assert.equal(chapter.image.url,'https://example.org/adopted.jpg');
 assert.equal(chapter.changes.find(c=>c.indicator==='economie').delta,0);
 assert.equal(chapter.changes.find(c=>c.indicator==='developpement').delta,2);
 assert.equal(JSON.stringify(pub).includes('SECRET'),false);assert.equal(JSON.stringify(pub).includes('rejected-secret'),false);
 pub.history[0].chronicle.title='mutation';assert.equal(s.lastReveal.chronicle.title,'Le prix du rail');
 s=run(s,org,'next');s=JSON.parse(JSON.stringify(s));pub=narrativePublicView(s);
 assert.equal(pub.reveal,null);assert.equal(pub.dilemma.id,'D02');
 assert.equal(latestChronicle(pub).id,'D01');assert.equal(latestChronicle(pub).image.url,'https://example.org/adopted.jpg');
 while(s.phase!=='FINISHED'){
  if(s.phase==='COUNCIL')s=vote(s);
  else if(s.phase==='AWAITING_REVEAL')s=run(s,org,'reveal');
  else s=run(s,org,'next');
 }
 pub=narrativePublicView(s);assert.equal(pub.history.length,8);assert.equal(latestChronicle(pub).id,'D10');
 assert.ok(pub.history.every(h=>h.cityBefore&&h.cityAfter));
});
test('Chronicle: legacy session uses frozen dilemma artwork, preserves historical narration and does not invent missing values',()=>{
 let s=fixture('1.1.0');s=run(s,org,'start');s=vote(s);s=run(s,org,'reveal');s=run(s,org,'next');
 let chapter=latestChronicle(narrativePublicView(s));
 assert.match(chapter.image.url,/d01.jpg$/);assert.equal(chapter.narration,s.revealedHistory[0].narration);
 delete s.revealedHistory[0].cityBefore;chapter=latestChronicle(narrativePublicView(s));
 assert.equal(chapter.changes[0].delta,null);
 assert.match(chronicleChangeText(chapter.changes[0],'Économie'),/non archivée/);
});
test('Chronicle: cap and center explanations use actual archived changes',()=>{
 assert.match(chronicleChangeText({before:10,after:10,delta:0,operation:'delta',planned:2},'Économie'),/prévu \+2, limité par la borne 10/);
 assert.match(chronicleChangeText({before:5,after:5,delta:0,operation:'toward_center',planned:null},'Stabilité'),/déjà au centre/);
 assert.match(chronicleChangeText({before:4,after:3,delta:-1,operation:'away_from_center',planned:null},'Stabilité'),/4 → 3\/10 \(-1\)/);
});
test('Chronicle: authored titles and summaries cover all 20 outcomes, effects remain identical to 1.1',()=>{
 const before=foundersPreview({scenarioId:'fondateurs-hot-spring-demo',skinId:'western',scenarioVersion:'1.1.0'}).scenario;
 const after=foundersPreview({scenarioId:'fondateurs-hot-spring-demo',skinId:'western',scenarioVersion:'1.2.0'}).scenario;
 assert.deepEqual(validateFoundersStory(after),[]);
 for(let i=0;i<10;i++)for(const side of ['pour','contre']){
  const a=after.dilemmas[i].outcomes[side],b=before.dilemmas[i].outcomes[side];
  assert.ok(a.chronicle.title);assert.ok(a.chronicle.summary);assert.ok(a.narration.length>100);
  assert.deepEqual(a.effects,b.effects);assert.equal(a.next_id,b.next_id);
 }
 const broken=structuredClone(after);broken.dilemmas[0].outcomes.pour.chronicle.image={url:'javascript:alert(1)',alt:'X',credit:null,license:null};
 assert.ok(validateFoundersStory(broken).some(x=>x.includes('chronicle.image')));
});
