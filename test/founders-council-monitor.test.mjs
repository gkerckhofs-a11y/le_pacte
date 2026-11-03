import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFoundersGame,openFoundersDilemma,castFoundersAction,moderatorResolveFoundersTie} from '../src/founders.ts';
import {councilMonitor} from '../public/founders-council-monitor.js';
import {setupProjectionFullscreen} from '../public/founders-fullscreen.js';
const view=(game,phase)=>({game,phase,leader:game.leader,moderator:game.moderator,familyResources:game.families,families:Object.keys(game.families).map(id=>({id,name:id}))});
test('Monitor follows bids, sheriff claim, arbitration, settlement and next council without stale bids',()=>{
 let g=openFoundersDilemma(createFoundersGame(),'D01');
 g=castFoundersAction(g,'A',{kind:'pour',amount:2});
 g=castFoundersAction(g,'B',{kind:'contre',amount:2});
 g=castFoundersAction(g,'C',{kind:'passe_moderateur'});
 let m=councilMonitor(view(g,'COUNCIL'));assert.equal(m.actor,'D');assert.equal(m.yes,2);assert.equal(m.no,2);assert.equal(m.rows[0].power,6);assert.match(m.rows[2].roles,/Shérif/);
 for(const id of ['D','E','F'])g=castFoundersAction(g,id,{kind:'passe_pouvoir'});
 m=councilMonitor(view(g,'COUNCIL'));assert.equal(m.actor,'C');assert.match(m.action,/départager/);
 g=moderatorResolveFoundersTie(g,'C','pour');
 m=councilMonitor(view(g,'AWAITING_REVEAL'));assert.equal(m.closed,true);assert.equal(m.yes,2);assert.equal(m.rows[1].bid,2);assert.equal(m.rows[1].power,8);assert.match(m.balance,/POUR/);assert.equal(m.steps.length,6);
 g=openFoundersDilemma(g,'D02');m=councilMonitor(view(g,'COUNCIL'));assert.equal(m.yes,0);assert.equal(m.steps.length,0);assert.equal(m.actor,g.leader);
});
test('Monitor identifies mayor arbitration candidates',()=>{
 const g=openFoundersDilemma(createFoundersGame(),'D01');g.vote.phase='await_leader';g.vote.pendingLeaderChoices=['B','C'];g.vote.turn=null;
 const m=councilMonitor(view(g,'COUNCIL'));assert.equal(m.actor,'F');assert.match(m.action,/B, C/);
});
test('Fullscreen handles entry, Escape, rejection and unsupported browsers',async()=>{
 const events={},clicks={},button={setAttribute(k,v){this[k]=v;},addEventListener(k,v){clicks[k]=v;}},notice={};
 const doc={fullscreenEnabled:true,fullscreenElement:null,documentElement:{async requestFullscreen(){doc.fullscreenElement=this;}},async exitFullscreen(){this.fullscreenElement=null;},addEventListener(k,v){events[k]=v;}};
 setupProjectionFullscreen(button,notice,doc);await clicks.click();assert.equal(button['aria-pressed'],'true');
 doc.fullscreenElement=null;events.fullscreenchange();assert.equal(button.textContent,'Plein écran');
 doc.documentElement.requestFullscreen=async()=>{throw Error('Denied');};await clicks.click();assert.match(notice.textContent,/refusé/);
 setupProjectionFullscreen(button,notice,{documentElement:{}});assert.equal(button.disabled,true);
});
