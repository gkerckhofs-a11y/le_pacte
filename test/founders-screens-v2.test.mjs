import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {foundersPreview,foundersCatalogFor} from '../server/founders-catalog.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativeView} from '../src/founders-live.ts';
import {newCampaign} from './helpers/hotspring.mjs';
const owner={role:'organizer',id:'host'};
let state=createNarrativeSession(foundersPreview({scenarioId:'hot-spring-reserve-hybride',scenarioVersion:'2.0.0',skinId:'western',members:[1,1,1,1,1]}),{ownerId:'host',id:'1'.repeat(24),code:'SCREENV2',title:'Test écrans',now:1000});
const command=(s,actor,kind,data={})=>applyNarrativeCommand(s,actor,{kind,data,expectedRevision:s.revision},2000);
state=command(command(state,owner,'start'),owner,'beginVote');
for(const id of 'ABCDE')state=command(state,{role:'team',family:id},'vote',{kind:id==='A'?'pour':'passe_pouvoir',...(id==='A'?{amount:1}:{})});
while(state.game.vote)state=command(state,{role:'team',family:state.game.vote.turn},'vote',{kind:'maintien'});
async function screen(app,s){
 const {document,window}=parseHTML(readFileSync(new URL('../public/founders-'+app+'.html',import.meta.url),'utf8'));
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.hasAttribute('selected'))?.value??this.options[0]?.value??'';},set(value){for(const o of this.options){if(o.value===value)o.setAttribute('selected','');else o.removeAttribute('selected');}}});
 window.Element.prototype.scrollIntoView=function(){};window.Element.prototype.showModal=function(){this.open=true;this.setAttribute('open','');};window.Element.prototype.close=function(){this.open=false;this.removeAttribute('open');};
 const errors=[],storage=new Map([['pacte-founder-family-'+s.id+'-A','a'.repeat(43)],['pacte-founder-organizer-key','local-key-1234567890123456789012345']]);
 const actor=app==='city'?{role:'public'}:app==='family'?{role:'team',family:'A'}:owner;
 const data={...narrativeView(s,actor),serverNow:2000};
 const timers=[];const catalog=await foundersCatalogFor({},'host');
 const context=vm.createContext({document,window,DOMParser:window.DOMParser,location:{origin:'http://localhost',pathname:'/founders-'+app+'.html',search:'?session='+s.id+'&family=A',hash:''},history:{replaceState(){}},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},URL,URLSearchParams,Image:class{constructor(){return document.createElement('img');}},crypto:webcrypto,performance:{now:()=>0},requestAnimationFrame:fn=>fn(),setInterval:fn=>{timers.push(fn);return {unref(){}};},fetch:async(path,options)=>({ok:true,json:async()=>path==='/api/catalog'?{authMode:'local'}:path==='/api/founders/catalog'?catalog:path==='/api/founders/preview'?foundersPreview(JSON.parse(options.body)):path==='/api/founders/configurations'?{configurations:[]}:path==='/api/founders/sessions'?{sessions:[]}:data}),console:{log(){},error:e=>errors.push(e)}});
 const bundle=await build({entryPoints:['public/founders-'+app+'.js'],bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});
 vm.runInContext(bundle.outputFiles[0].text,context);
 for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));
 return {document,context,errors};
}
for(const app of ['city','family','regie'])test(`Écran ${app} : quatre jauges, delta visible et épilogue au premier plan`,async()=>{
 const live=await screen(app,state);assert.equal(live.document.querySelectorAll('#gauges .gauge').length,4,live.document.getElementById('notice')?.textContent??'');
 assert.equal(live.document.querySelectorAll('#gauges .gauge-delta-positive').length,2);assert.equal(live.document.querySelectorAll('#gauges .gauge-delta-negative').length,2);
 const end=command(state,owner,'finish',{confirm:true}),finished=await screen(app,end);
 assert.equal(finished.errors.length,0);
 if(app==='city'){
  assert.ok(finished.document.body.classList.contains('game-finished'));
  assert.equal(finished.document.querySelector('.projection-grid > section:not([hidden])').id,'finalResults');
 }
 if(app==='family'){assert.equal(finished.document.getElementById('boardPanel').firstElementChild.id,'personalResult');assert.equal(finished.document.getElementById('familyEpilogue').hidden,false);}
});

test('Projection : seul le cadre de la famille suit la parole du Conseil',async()=>{
 const opening=command(command(state,owner,'next'),owner,'beginVote');
 const passing=command(opening,{role:'team',family:opening.game.vote.turn},'vote',{kind:'passe_pouvoir'});
 for(const current of [opening,passing]){
  const {document}=await screen('city',current);
  const speaker=current.game.vote.turn;
  const rows=document.querySelectorAll('#ballots [aria-current=true]');
  assert.equal(rows.length,1);
  assert.equal([...document.querySelectorAll('#ballots .ballot')].indexOf(rows[0]),Object.keys(current.game.families).indexOf(speaker));
  assert.equal(document.querySelector('#councilRoles, #voteProgress, #councilStatus, .city-legend'),null);
 }
});

test('Projection Hotspring : le visuel du dilemme et le panorama coexistent',async()=>{
 const campaign=newCampaign();
 campaign.command('start');
 const intro=await screen('city',campaign.state);
 assert.equal(intro.document.getElementById('decisionImage').hidden,false);
 assert.equal(intro.document.querySelector('#hotspringStage img'),null);
 campaign.command('next');
 const {document}=await screen('city',campaign.state);
 const artwork=document.getElementById('decisionImage'),city=document.getElementById('city');
 assert.equal(artwork.hidden,false);
 assert.equal(city.hidden,false);
 assert.equal(artwork.closest('#dilemmaPanel').id,'dilemmaPanel');
 assert.equal(document.getElementById('dilemmaArtwork').hidden,false);
 assert.ok(document.getElementById('question').textContent);
 campaign.vote('pour');
 const reveal=await screen('city',campaign.state);
 assert.equal(reveal.document.getElementById('city').hidden,false);
 assert.match(reveal.document.getElementById('decisionImage').getAttribute('src'),/d01_result_for_lowlands/);
 assert.equal(reveal.document.getElementById('decisionImage').hidden,false);
 artwork.dispatchEvent(new document.defaultView.Event('error'));
 assert.equal(document.getElementById('dilemmaArtwork').hidden,true);
 assert.equal(city.hidden,false);
});

test('Projection Hotspring : la réserve affiche l’estimation puis le versement',async()=>{
 const g=newCampaign();
 g.command('start');g.command('next');g.command('next');
 const negotiation=await screen('city',g.state);
 const get=(view,id)=>view.document.getElementById(id);
 assert.equal(get(negotiation,'influenceReserve').hidden,false);
 assert.equal(get(negotiation,'influenceAvailable').textContent,'3');
 assert.equal(get(negotiation,'influencePart').textContent,'—');
 g.untilCouncil();
 g.command('vote',{kind:'passe_pouvoir'}, {role:'team',family:'A'});
 const council=await screen('city',g.state);
 assert.equal(get(council,'influenceParticipants').textContent,'1');
 assert.equal(get(council,'influencePart').textContent,'3');
 assert.equal(get(council,'influencePartLabel').textContent,'Part estimée par famille');
 g.vote('pour');
 const reveal=await screen('city',g.state);
 assert.equal(get(reveal,'influencePartLabel').textContent,'Part versée par famille');
 assert.equal(get(reveal,'influencePart').textContent,'3');
});

test('Configuration : la version V2 est proposée, quatre jauges et ambitions cohérentes à cinq familles',async()=>{
 const {document}=await screen('setup',state);document.getElementById('token').value='local-v2-key-123456789012345678901234';document.getElementById('load').click();
 for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));
 assert.equal(document.getElementById('scenarioVersion').value,'2.0.0');assert.equal(document.getElementById('city_ecologie').parentElement.hidden,false);assert.equal(document.getElementById('city_satisfaction').parentElement.hidden,true);
 assert.equal(document.getElementById('goalIndicator-D').value,'ecologie');
 document.getElementById('familyCount').value='5';document.getElementById('familyCount').dispatchEvent(new document.defaultView.Event('change'));
 document.getElementById('config').dispatchEvent(new document.defaultView.Event('submit',{cancelable:true}));
 for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));
 assert.equal(document.getElementById('status').dataset.type,'success',document.getElementById('status').textContent);
 assert.equal(document.getElementById('memberCount-F').disabled,true);
});
test('Famille : une proposition reçue ouvre immédiatement une fenêtre avec acceptation et refus',async()=>{
 let s=command(state,owner,'next');s=command(s,{role:'team',family:'B'},'offer',{id:'popup_001',to:'A',amount:3,reason:'Votez avec nous'});
 const {document}=await screen('family',s);assert.equal(document.getElementById('offerDialog').open,true);assert.match(document.getElementById('receivedOffer').textContent,/3/);assert.match(document.getElementById('receivedCommitment').textContent,/ne vous engage pas/);assert.equal(document.getElementById('offerAccept').textContent,'Accepter');
});
