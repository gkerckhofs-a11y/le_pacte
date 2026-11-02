import {readFileSync} from 'node:fs';
import {createSession,applyCommand,sessionView} from '../src/session.ts';
const edition=JSON.parse(readFileSync(new URL('../content/editions.json',import.meta.url))).editions[0];
const organizer={role:'organizer',id:'demo-organizer'};
let s=createSession('DEMO',organizer.id,edition,['O1','O2','O3','O4','O5','O6'],[1,2,3,4,5,6]);
let sequence=0;
function send(actor,kind,data={},now=0){s=applyCommand(s,actor,{id:`demo-${++sequence}`,sessionId:s.id,expectedPhase:s.phase,expectedRound:s.game.round,kind,data},now);}
while(s.phase!=='ARCHIVED'){
 if(s.phase==='ORDERS')for(const team of Object.keys(s.game.teams))send({role:'team',team},'orders',[{kind:'invest',resource:'means'},{kind:'stabilize'}]);
 if(s.phase==='COUNCIL')for(const team of Object.keys(s.game.teams))send({role:'team',team},'council',{choice:'A',spend:0});
 send(organizer,'advance',{},s.deadline??0);
}
console.log(JSON.stringify(sessionView(s,{role:'public'}),null,2));
