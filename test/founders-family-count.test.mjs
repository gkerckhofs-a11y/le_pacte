import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {activeFounders,createFoundersGame,totalPower,totalDollars,openFoundersDilemma,castFoundersAction,moderatorResolveFoundersTie} from '../src/founders.ts';
import {foundersPreview} from '../server/founders-catalog.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativePublicView,narrativeFamilyView} from '../src/founders-live.ts';
import {LocalNarrativeSessions} from '../server/founders-live-store.ts';
import {simulateFoundersPolicies} from '../src/founders-policy-lab.ts';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {voteProgress} from '../public/founders-vote-progress.js';
const owner={role:'organizer',id:'host'};
const command=(s,actor,kind,data={})=>applyNarrativeCommand(s,actor,{kind,data,expectedRevision:s.revision},1000+s.revision);
const preview=n=>foundersPreview({scenarioId:'fondateurs-hot-spring-demo',skinId:'western',members:Array(n).fill(1)});
for(const count of [5,6]){
 test(`${count} familles : finale complète, ressources conservées et classement sans famille absente`,()=>{
  let s=createNarrativeSession(preview(count),{id:'123456789012123456789012',ownerId:'host',code:'TEST'+count,title:'Test'});
  const ids=activeFounders(s.game);
  assert.equal(s.game.moderator,ids.at(-1));
  assert.equal(totalPower(s.game),count*8+3);
  assert.equal(narrativePublicView(s).families.length,count);
  for(let i=0;i<20&&s.phase!=='FINISHED';i++){
   s=command(s,owner,s.phase==='READY'?'start':'next');
   if(s.phase==='FINISHED')break;
   for(let turn=0;turn<count;turn++){
    const id=s.game.vote.turn;
    assert.ok(ids.includes(id));
    s=command(s,{role:'team',family:id},'vote',{kind:'passe_pouvoir'});
   }
   assert.equal(s.game.vote.phase,'await_moderator');
   s=command(s,{role:'team',family:s.game.moderator},'resolveTie',{winner:'pour'});
   assert.equal(totalPower(s.game),count*8+3);
   s=command(s,owner,'reveal');
  }
  assert.equal(s.phase,'FINISHED');assert.equal(s.finalResults.ranking.length,count);
  assert.deepEqual(s.finalResults.ranking.map(r=>r.family).sort(),ids);
 });
 test(`${count} familles : surenchère, nouveau passage et clôture après la bonne famille`,()=>{
  let g=openFoundersDilemma(createFoundersGame({members:Array(count).fill(1)}),'D01');
  g=castFoundersAction(g,'A',{kind:'pour',amount:2});
  g=castFoundersAction(g,'B',{kind:'contre',amount:3});
  for(const id of activeFounders(g).slice(2))g=castFoundersAction(g,id,{kind:'pour',amount:1});
  assert.equal(g.vote.turn,'A');assert.equal(g.leader,'B');
  const p=voteProgress({phase:'COUNCIL',families:activeFounders(g).map(id=>({id,name:id})),leader:g.leader,council:g.vote});
  assert.match(p.title,/Nouveau passage/);assert.match(p.hint,/après A/);
  g=castFoundersAction(g,'A',{kind:'maintien'});
  assert.equal(g.vote,null);assert.equal(totalPower(g),count*8+3);assert.equal(totalDollars(g),count*10);
 });
 test(`${count} familles : seuls les accès des participants sont créés et renouvelables`,()=>{
  const db=new DatabaseSync(':memory:');
  try{
   const store=new LocalNarrativeSessions(db),p=preview(count);
   const created=store.create({ownerId:'host',preview:p,code:'ACCESS'+count,title:'Test',now:1000});
   assert.equal(created.access.length,count);
   const current=store.view(created.id,owner,1001);
   assert.equal(current.initiativeOrder.length,count);
   if(count===5){
    assert.throws(()=>store.rotate(created.id,'F','host',1002),/inactive/);
    assert.throws(()=>narrativeFamilyView(store.get(created.id),'F'),/inconnue/);
    assert.throws(()=>command(store.get(created.id),{role:'team',family:'F'},'setIdentity',{name:'Absent',color:'orange'}),/inconnue/);
    let s=command(store.get(created.id),owner,'start');
    assert.throws(()=>command(s,{role:'team',family:'A'},'offer',{id:'absent_01',to:'F',amount:1,reason:'Test',commitment:{choice:'gift'}}),/Destinataire/);
   }
  }finally{db.close();}
 });
}
test('Refuse les effectifs non pris en charge et les rôles attribués à une famille absente',()=>{
 for(const count of [0,4,7])assert.throws(()=>createFoundersGame({members:Array(count).fill(1)}),/Cinq ou six/);
 assert.throws(()=>createFoundersGame({members:[1,1,1,1,1],moderator:'F'}),/inconnu/);
 assert.throws(()=>createFoundersGame({members:[1,1,1,1,0]}),/effectifs/);
});

test('Laboratoire à cinq familles : simulation complète sans sixième famille artificielle',()=>{
 const p=foundersPreview({scenarioId:'hot-spring-reserve-hybride',skinId:'western',members:[1,1,1,1,1]});
 const result=simulateFoundersPolicies(p.scenario,{members:p.settings.members,runs:12});
 assert.equal(result.completed,12);assert.equal(result.failed,0);
 assert.deepEqual(Object.keys(result.families),['A','B','C','D','E']);
});
test('Sélecteur : 6 → 5 → 6 masque et désactive la famille absente, garde les valeurs saisies',()=>{
 const source=readFileSync(new URL('../public/founders-setup.js',import.meta.url),'utf8');
 const fields=new Map();
 const get=id=>{if(!fields.has(id))fields.set(id,{value:'',hidden:false,disabled:false,parentElement:{},inputs:[{},{}]});return fields.get(id);};
 get('familyCount').value='6';for(const [i,id] of [...'ABCDEF'].entries())get('memberCount-'+id).value=String(i+1);
 get('familySettings').querySelector=selector=>{const id=selector.match(/"([A-F])"/)[1],node=get('section-'+id);node.querySelectorAll=()=>node.inputs;return node;};
 const context=vm.createContext({$:get});
 const start=source.indexOf('function syncFamilyCount(){'),end=source.indexOf("$('familyCount').addEventListener",start);
 vm.runInContext("const FAMILY_IDS=[...'ABCDEF'];const activeFamilyIds=()=>FAMILY_IDS.slice(0,Number($('familyCount').value));let selectedPreview={};"+source.slice(start,end),context);
 get('familyCount').value='5';vm.runInContext('syncFamilyCount()',context);
 assert.equal(get('members').value,'1,2,3,4,5');assert.equal(get('memberCount-F').disabled,true);assert.equal(get('section-F').hidden,true);
 assert.ok(get('section-F').inputs.every(x=>x.disabled));
 get('familyCount').value='6';vm.runInContext('syncFamilyCount()',context);
 assert.equal(get('members').value,'1,2,3,4,5,6');assert.equal(get('memberCount-F').disabled,false);assert.equal(get('section-F').hidden,false);
 assert.ok(get('section-F').inputs.every(x=>!x.disabled));assert.equal(get('createNarrative').disabled,false);
});
