import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFoundersGame,openFoundersDilemma,castFoundersAction,moderatorResolveFoundersTie,moderatorChooseFoundersLeader,transferFoundersDollars,totalDollars,totalPower,applyFoundersCityEffects} from '../src/founders.ts';
const play=(s,actions)=>actions.reduce((acc,[family,kind,amount])=>castFoundersAction(acc,family,{kind,amount}),s);
const initial=()=>createFoundersGame();
const scenario=members=>{
 let s=createFoundersGame({members});
 s=transferFoundersDollars(s,'A','B',3,'Soutien POUR le rail');
 s=play(openFoundersDilemma(s,'D1'),[['A','pour',2],['B','pour',1],['C','contre',2],['D','contre',4],['E','passe_pouvoir'],['F','passe_pouvoir'],['A','maintien'],['B','maintien'],['C','maintien']]);
 assert.equal(s.history[0].winner,'contre');assert.equal(s.pool,7);assert.equal(s.leader,'D');
 s=transferFoundersDollars(s,'E','A',2,'Arbitrage du Modérateur pour');
 s=play(openFoundersDilemma(s,'D2'),[['D','contre',4],['E','pour',2],['F','pour',3],['A','passe_moderateur'],['B','pour',1],['C','contre',2]]);
 assert.equal(s.vote.phase,'await_moderator');s=moderatorResolveFoundersTie(s,'A','pour');
 assert.equal(s.pool,13);assert.equal(s.leader,'F');assert.equal(s.moderator,'A');
 s=transferFoundersDollars(s,'F','E',2,'Soutien POUR le puits');
 s=play(openFoundersDilemma(s,'D3'),[['F','pour',2],['A','contre',1],['B','passe_pouvoir'],['C','contre',3],['D','passe_pouvoir'],['E','pour',2],['F','augmenter',2],['A','augmenter',2],['B','maintien'],['C','augmenter',1],['D','maintien'],['E','augmenter',2]]);
 assert.equal(s.history[2].winner,'pour');return s;
};
test('Six familles, effectifs variables et interface politique unique par famille',()=>{
 const s=createFoundersGame({members:[5,7,4,12,9,8]});
 assert.deepEqual(Object.values(s.families).map(f=>f.members),[5,7,4,12,9,8]);
 assert.equal(totalPower(s),51);assert.equal(totalDollars(s),60);
 assert.throws(()=>createFoundersGame({members:[5,5,5]}));
});
test('Trois votes simulés : invariants Influence et dollars, égalité et surenchères',()=>{
 const s=scenario([5,5,5,5,5,5]);
 assert.deepEqual(Object.values(s.families).map(f=>f.power),[8,13,6,10,3,2]);
 assert.deepEqual(Object.values(s.families).map(f=>f.dollars),[10,14,10,11,11,9]);
 assert.equal(s.pool,9);assert.equal(totalPower(s),51);assert.equal(totalDollars(s),65);
 assert.deepEqual(s.history.map(x=>[x.yes,x.no]),[[3,6],[6,6],[8,7]]);
 const s2=scenario([12,8,5,6,15,7]);
 assert.deepEqual(s2.history,s.history);
});
test('Aucune surenchère ne peut changer un vote ni créer du Pouvoir',()=>{
 let s=openFoundersDilemma(initial(),'D1');
 assert.throws(()=>castFoundersAction(s,'B',{kind:'pour',amount:1}));
 assert.throws(()=>castFoundersAction(s,'A',{kind:'pour',amount:9}));
 s=castFoundersAction(s,'A',{kind:'passe_pouvoir'});
 s=play(s,[['B','contre',2],['C','pour',1],['D','pour',4],['E','passe_pouvoir'],['F','passe_moderateur']]);
 assert.throws(()=>castFoundersAction(s,'A',{kind:'augmenter',amount:1}));
 assert.equal(totalPower(s),51);
});
test('Transaction bilatérale : les fonds restent constants et ne deviennent pas du Pouvoir',()=>{
 const s=initial();assert.throws(()=>transferFoundersDollars(s,'A','B',11,'Trop cher'));
 const b=transferFoundersDollars(s,'A','B',4,'Contre vote');assert.equal(b.families.A.dollars,6);
 assert.equal(b.families.B.dollars,14);assert.equal(totalDollars(b),60);assert.equal(totalPower(b),51);
 assert.equal(s.families.A.dollars,10);
});
test('Six abstentions : le Modérateur tranche et devient Meneur',()=>{
 const s=play(openFoundersDilemma(initial(),'D1'),[['A','passe_pouvoir'],['B','passe_pouvoir'],['C','passe_pouvoir'],['D','passe_pouvoir'],['E','passe_pouvoir'],['F','passe_pouvoir']]);
 assert.equal(s.vote.phase,'await_moderator');const r=moderatorResolveFoundersTie(s,'F','contre');
 assert.equal(r.leader,'F');assert.equal(r.pool,3);assert.equal(totalDollars(r),66);assert.equal(totalPower(r),51);
});
test('Le Modérateur choisit parmi les Meneurs gagnants ex aequo',()=>{
 let s=openFoundersDilemma(initial(),'D1');
 s=play(s,[['A','pour',3],['B','contre',4],['C','pour',3],['D','passe_pouvoir'],['E','passe_pouvoir'],['F','passe_pouvoir'],['A','maintien']]);
 assert.equal(s.vote.phase,'await_leader');
 assert.deepEqual(s.vote.pendingLeaderChoices,['A','C']);
 assert.throws(()=>moderatorChooseFoundersLeader(s,'A','A'));
 assert.throws(()=>moderatorChooseFoundersLeader(s,'F','B'));
 s=moderatorChooseFoundersLeader(s,'F','C');
 assert.equal(s.leader,'C');assert.equal(s.history[0].winner,'pour');
 assert.equal(totalPower(s),51);
});
test('La Stabilité converge vers 5 et peut aussi se déséquilibrer',()=>{
 let s=initial();s.city.stabilite=6;
 s=applyFoundersCityEffects(s,[{resource:'stabilite',kind:'toward_center'}]);assert.equal(s.city.stabilite,5);
 s=applyFoundersCityEffects(s,[{resource:'stabilite',kind:'away_from_center'}]);assert.equal(s.city.stabilite,4);
 s=applyFoundersCityEffects(s,[{resource:'economie',kind:'delta',amount:-9}]);assert.equal(s.city.economie,0);
});
