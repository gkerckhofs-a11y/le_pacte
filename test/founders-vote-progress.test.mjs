import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFoundersGame,openFoundersDilemma,castFoundersAction} from '../src/founders.ts';
import {voteProgress} from '../public/founders-vote-progress.js';
const view=g=>({phase:g.vote?'COUNCIL':'AWAITING_REVEAL',leader:g.leader,moderator:g.moderator,council:g.vote??{},families:['A','B','C','D','E','F'].map(id=>({id,name:id}))});
test('Progress reflects an actual second passage and updates the closing family when leadership moves',()=>{
 let g=openFoundersDilemma(createFoundersGame(),'D01');
 assert.match(voteProgress(view(g)).title,/Premier passage.*A/);
 assert.match(voteProgress(view(g)).hint,/après F/);
 g=castFoundersAction(g,'A',{kind:'pour',amount:2});g=castFoundersAction(g,'B',{kind:'contre',amount:3});
 for(const id of ['C','D','E','F'])g=castFoundersAction(g,id,{kind:'passe_pouvoir'});
 let p=voteProgress(view(g));assert.match(p.title,/Nouveau passage.*A.*surenchérir/);assert.match(p.hint,/Dernière action.*après A/);
 const ended=castFoundersAction(g,'A',{kind:'maintien'});assert.equal(voteProgress(view(ended)),null);
 g=castFoundersAction(g,'A',{kind:'augmenter',amount:2});p=voteProgress(view(g));assert.match(p.title,/Nouveau passage.*B/);assert.match(p.hint,/après F/);
 g=castFoundersAction(g,'B',{kind:'maintien'});p=voteProgress(view(g));assert.match(p.title,/C.*maintenir son abstention/);assert.doesNotMatch(p.title,/surenchérir/);
});
test('Arbitration and inactive phases display accurate instructions',()=>{
 const state={phase:'COUNCIL',moderator:'F',families:[{id:'F',name:'Pumpkins'},{id:'B',name:'Redcreek'}],council:{phase:'await_moderator'}};
 assert.match(voteProgress(state).hint,/Pumpkins/);
 assert.match(voteProgress({...state,council:{phase:'await_leader',pendingLeaderChoices:['B','F']}}).hint,/Redcreek, Pumpkins/);
 assert.equal(voteProgress({...state,phase:'REVEALED'}),null);assert.equal(voteProgress({...state,phase:'READY'}),null);
});
