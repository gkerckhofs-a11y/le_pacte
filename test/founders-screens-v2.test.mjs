import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {foundersPreview,foundersCatalogFor} from '../server/founders-catalog.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativePublicView,narrativeView} from '../src/founders-live.ts';
import {prepareCosaNostra} from '../server/cosa-nostra-preparation.ts';
import {chicagoSessionPreview} from '../server/cosa-nostra-session.ts';
import {fixture as chicagoCampaign} from './helpers/chicago.mjs';
import {newCampaign,team} from './helpers/hotspring.mjs';
import {createSentOfferNotices,offerStatusText} from '../public/founders-agreements.js';
const owner={role:'organizer',id:'host'};
let state=createNarrativeSession(foundersPreview({scenarioId:'hot-spring-reserve-hybride',scenarioVersion:'2.0.0',skinId:'western',members:[1,1,1,1,1]}),{ownerId:'host',id:'1'.repeat(24),code:'SCREENV2',title:'Test écrans',now:1000});
const command=(s,actor,kind,data={})=>applyNarrativeCommand(s,actor,{kind,data,expectedRevision:s.revision},2000);
state=command(command(state,owner,'start'),owner,'beginVote');
for(const id of 'ABCDE')state=command(state,{role:'team',family:id},'vote',{kind:id==='A'?'pour':'passe_pouvoir',...(id==='A'?{amount:1}:{})});
while(state.game.vote)state=command(state,{role:'team',family:state.game.vote.turn},'vote',{kind:'maintien'});
async function screen(app,s,family='A'){
 const {document,window}=parseHTML(readFileSync(new URL('../public/founders-'+app+'.html',import.meta.url),'utf8'));
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.hasAttribute('selected'))?.value??this.options[0]?.value??'';},set(value){for(const o of this.options){if(o.value===value)o.setAttribute('selected','');else o.removeAttribute('selected');}}});
 window.Element.prototype.scrollIntoView=function(){};window.Element.prototype.showModal=function(){this.open=true;this.setAttribute('open','');};window.Element.prototype.close=function(){this.open=false;this.removeAttribute('open');};
 const errors=[],storage=new Map([['pacte-founder-family-'+s.id+'-'+family,'a'.repeat(43)],['pacte-founder-organizer-key','local-key-1234567890123456789012345']]);
 const actor=app==='city'?{role:'public'}:app==='family'?{role:'team',family}:owner;
 const toView=state=>({...narrativeView(state,actor),serverNow:2000});
 let data=toView(s);
 const timers=[];const catalog=await foundersCatalogFor({},'host');
 const context=vm.createContext({document,window,DOMParser:window.DOMParser,location:{origin:'http://localhost',pathname:'/founders-'+app+'.html',search:'?session='+s.id+'&family='+family,hash:''},history:{replaceState(){}},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},URL,URLSearchParams,Image:class{constructor(){return document.createElement('img');}},crypto:webcrypto,performance:{now:()=>0},requestAnimationFrame:fn=>fn(),setInterval:fn=>{timers.push(fn);return {unref(){}};},fetch:async(path,options)=>({ok:true,json:async()=>path==='/api/catalog'?{authMode:'local'}:path==='/api/founders/catalog'?catalog:path==='/api/founders/preview'?foundersPreview(JSON.parse(options.body)):path==='/api/founders/configurations'?{configurations:[]}:path==='/api/founders/sessions'?{sessions:[]}:data}),console:{log(){},error:e=>errors.push(e)}});
 const bundle=await build({entryPoints:['public/founders-'+app+'.js'],bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});
 vm.runInContext(bundle.outputFiles[0].text,context);
 for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));
 return {document,context,errors,update:async next=>{data=toView(next);await timers.at(-1)();}};
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

test('Projection Hotspring : une seule scène de Conseil, la carte uniquement sur demande',async()=>{
 const campaign=newCampaign();campaign.command('start');
 const {document,update}=await screen('city',campaign.state);
 const get=id=>document.getElementById(id);
 assert.equal(get('decisionImage').hidden,false);
 assert.equal(document.querySelector('#hotspringStage img'),null);
 campaign.command('next');await update(campaign.state);
 assert.equal(document.querySelectorAll('#gauges .gauge').length,5);
 assert.equal(get('stabilityTitle').textContent,'Stabilité — 5,0 / 10');
 assert.equal(get('decisionImage').closest('#dilemmaPanel'),get('dilemmaPanel'));
 assert.equal(get('cityCinema').hidden,true);
 assert.equal(get('city').childElementCount,0);
 assert.equal(get('valleyMap').childElementCount,0);
 assert.ok(get('question').textContent);
 campaign.vote('pour');await update(campaign.state);
 assert.match(get('stabilityTitle').textContent,/Stabilité — 5,4 \/ 10\+0,4/);
 assert.match(get('decisionImage').getAttribute('src'),/d01_result_for_lowlands/);
 assert.equal(document.querySelector('img[src*="result_against"]'),null);
 get('panoramaOverview').click();
 assert.ok(get('valleyMap').querySelector('svg'));
 get('valleyDialog').close();
 campaign.command('next');await update(campaign.state);
 assert.equal(get('gauges').querySelector('.gauge-delta'),null);
 assert.doesNotMatch(get('decisionImage').getAttribute('src'),/d01_result/);
});

test('Projection en plein écran : le visuel du dilemme garde sa place',async()=>{
 const g=newCampaign({scenarioVersion:'1.2.0'});
 g.command('start');g.command('next');g.command('next');
 const {document}=await screen('city',g.state);
 const get=id=>document.getElementById(id);
 const artwork=get('dilemmaArtwork'),source=get('decisionImage').getAttribute('src');
 const changeFullscreen=active=>{
  Object.defineProperty(document,'fullscreenElement',{configurable:true,value:active?document.documentElement:null});
  document.dispatchEvent(new document.defaultView.Event('fullscreenchange'));
 };
 assert.equal(artwork.parentElement,get('dilemmaPanel'));
 changeFullscreen(true);
 assert.equal(artwork.parentElement,get('dilemmaPanel'));
 assert.equal(artwork.hidden,false);
 assert.equal(get('decisionImage').getAttribute('src'),source);
 assert.equal(get('voteForTotal').querySelector('.projection-unit').textContent.trim(),'Influence');
 assert.equal(get('influenceAvailable').querySelector('.projection-unit').textContent.trim(),'Influence');
 changeFullscreen(false);
 assert.equal(artwork.parentElement,get('dilemmaPanel'));
});

test('Hotspring : six valeurs au Terminal et simulation plafonnée en Régie',async()=>{
 const g=newCampaign({ownerId:owner.id});
 // Commandes de cette fixture exécutées avec le même rôle que le navigateur.
 g.command('start',{},owner);
 g.command('next',{},owner);
 g.command('pause',{},owner);
 g.command('correctCity',{indicator:'economie',value:10},owner);
 const regie=await screen('regie',g.state);
 assert.match(regie.document.getElementById('stabilityFormula').textContent,/lecture seule.*\(10 \+ 5 \+ 5 \+ 5 \+ 5\) ÷ 5 = 6,0/);
 assert.match(regie.document.getElementById('cityEffectAudit').textContent,/Économie \+1 prévu · 10 → 10 \(0 après plafonnement\)/);
 assert.equal(regie.document.querySelectorAll('#correctIndicator option').length,5);
 assert.equal(regie.document.querySelector('#correctIndicator option[value=stabilite]'),null);
 const family=await screen('family',g.state);
 const text=family.document.getElementById('gauges').textContent;
 assert.match(text,/Bien-être.*Stabilité.*6,0\/10/);
 assert.equal(family.document.querySelectorAll('#gauges .gauge').length,6);
 assert.doesNotMatch(family.document.body.textContent,/après plafonnement/);
});

test('Hotspring : le Terminal affiche le seuil privé et les règles de la fiche QR',async()=>{
 const game=newCampaign();
 game.command('start');
 const {document}=await screen('family',game.state,'B');
 const get=id=>document.getElementById(id);
 assert.match(get('objective').textContent,/Bien-être.*au moins 6\/10.*2 points.*0 point/);
 assert.equal(get('goalProgress').hidden,true);
 assert.equal(get('familyStatsBlock').hidden,true);
 assert.equal(get('councilRoles').querySelectorAll('.council-office').length,2);
 assert.doesNotMatch(get('boardPanel').textContent,/Des fondations communes|Les points sont affichés au bilan|matériel remplaçable/);
 get('rulesTab').click();
 assert.equal(get('rulesPanel').hidden,false);
 assert.equal(get('rulesV2').hidden,true);
 assert.equal(get('rulesLegacy').hidden,true);
 const rules=get('rulesHotspring');
 assert.equal(rules.hidden,false);
 assert.deepEqual([...rules.querySelectorAll('h3')].map(h=>h.textContent),[
  'Votre but','Un dilemme en 5 étapes','L’Influence','L’abstention','Les dollars','Le Maire','Le Shérif','Rappel express'
 ]);
 assert.match(rules.textContent,/Maximum : 18 points/);
 assert.match(rules.textContent,/deux familles terminent deuxièmes/);
 const legacy=await screen('family',state);
 assert.equal(legacy.document.getElementById('rulesHotspring').hidden,true);
 assert.equal(legacy.document.getElementById('rulesV2').hidden,false);
 assert.equal(legacy.document.getElementById('goalProgress').hidden,false);
});

test('Hotspring V1.2 : négociation, menus bornés et mise à jour du terminal',async()=>{
 const g=newCampaign({scenarioVersion:'1.2.0'});
 for(const action of ['start','next','next','pause'])g.command(action);
 g.command('correctResource',{family:'B',resource:'power',value:4});
 g.command('correctResource',{family:'B',resource:'dollars',value:6});
 g.command('resume');
 const {document,update}=await screen('family',g.state,'B');
 const get=id=>document.getElementById(id),options=id=>[...get(id).options].map(o=>o.textContent);
 assert.match(get('objective').textContent,/Bien-être.*2 points.*deux plus élevées/);
 const chapter=get('familyChapter'),votePanel=get('familyVotePanel');
 assert.equal(chapter.nextElementSibling,votePanel);
 assert.equal(get('firstVote').hidden,true);
 assert.equal(get('phaseClock').hidden,true);
 assert.equal(get('negotiationPanel').hidden,false);
 assert.equal(get('offerCommitmentFields').hidden,false);
 assert.equal(get('voteAmount').localName,'select');
 assert.deepEqual(options('voteAmount'),['1','2','3','4']);
 assert.deepEqual(options('offerAmount'),['1 $','2 $','3 $','4 $','5 $','6 $']);
 g.command('offer',{id:'affaire01',to:'A',amount:6,commitment:{choice:'gift'}},team('B'));
 await update(g.state);assert.equal(options('offerAmount').length,6);
 g.command('acceptOffer',{id:'affaire01'},team('A'));
 await update(g.state);
 assert.deepEqual(options('offerAmount'),[]);
 assert.equal(get('sendOffer').disabled,true);
 assert.equal(get('offerBalanceHint').hidden,false);
 g.command('offer',{id:'affaire02',to:'B',amount:4,commitment:{choice:'pour',minInfluence:3}},team('A'));
 await update(g.state);
 assert.match(get('receivedOffer').textContent,/4 \$ de la part de .*Les Mercer/);
 assert.match(get('receivedCommitment').textContent,/POUR.*Les terres basses.*3 Influence/);
 assert.match(get('receivedBalance').textContent,/0 \$ à 4 \$/);
 assert.equal(get('offerAccept').textContent,'Accepter l’accord');
 g.command('acceptOffer',{id:'affaire02'},team('B'));
 g.command('beginVote');
 await update(g.state);
 assert.equal(votePanel.nextElementSibling,chapter);
 assert.equal(get('negotiationPanel').hidden,true);
 assert.equal(get('firstVote').hidden,true);
 g.command('vote',{kind:'pour',amount:2},team('A'));
 await update(g.state);
 assert.ok(votePanel.contains(get('firstVote')));
 assert.equal(get('firstVote').hidden,false);
 assert.deepEqual(options('offerAmount'),['1 $','2 $','3 $','4 $']);
 assert.deepEqual(options('voteAmount'),['3','4']);
 assert.equal(get('firstVote').querySelector('[data-vote="contre"]').disabled,true);
 assert.equal(get('firstVote').querySelector('[data-vote="passe_pouvoir"]').disabled,true);
 assert.match(get('voteProgress').textContent,/vous engage à voter POUR avec au moins 3 Influence/);
 g.command('vote',{kind:'pour',amount:3},team('B'));
 g.command('vote',{kind:'contre',amount:1},team('C'));
 for(const id of ['D','E'])g.command('vote',{kind:'passe_pouvoir'},team(id));
 g.command('vote',{kind:'maintien'},team('A'));
 await update(g.state);
 assert.equal(get('raiseVote').hidden,false);
 assert.deepEqual(options('raiseAmount'),['+1']);
 assert.equal(get('raiseVote').querySelector('[data-vote="maintien"]').disabled,false);
 assert.ok(votePanel.contains(get('raiseVote')));
 assert.equal(votePanel.nextElementSibling,chapter);
 g.vote('pour');
 await update(g.state);
 assert.equal(chapter.nextElementSibling,votePanel);
 assert.equal(get('raiseVote').hidden,true);
});

test('Hotspring V1.2 : Stabilité auprès de la réserve et ouverture manuelle depuis la régie',async()=>{
 const g=newCampaign({scenarioVersion:'1.2.0',ownerId:owner.id});
 for(const action of ['start','next','next'])g.command(action,{},owner);
 const regie=(await screen('regie',g.state)).document;
 const controls=regie.querySelector('.regie-animation');
 assert.equal(controls.nextElementSibling.id,'councilMonitor');
 assert.ok(controls.querySelector('#playControls #beginVote'));
 for(const id of ['pauseGame','endSitting','finishGame'])assert.equal(controls.querySelector('#sessionControls #'+id).hidden,false);
 assert.equal(regie.getElementById('timingForm').hidden,true);
 assert.equal(regie.getElementById('beginVote').hidden,false);
 assert.equal(regie.getElementById('beginVote').textContent,'Ouvrir le vote');
 assert.doesNotMatch(regie.getElementById('stageHint').textContent,/chrono/);
 assert.match(regie.querySelector('#councilMonitor .council-prompt').textContent,/Ouvrez le vote/);
 g.command('beginVote',{},owner);g.command('vote',{kind:'passe_pouvoir'},team('A'));
 const {document}=await screen('city',g.state);
 const get=id=>document.getElementById(id);
 assert.equal(get('phaseClock').hidden,true);
 assert.equal(get('panoramaStability').parentElement.id,'townCouncilFinance');
 assert.equal(get('panoramaStability').hidden,false);
 assert.equal(get('stabilityTitle').textContent,'Stabilité — 5,0 / 10');
 assert.equal(get('stabilityState').textContent,'Ville stable');
 assert.equal(document.querySelectorAll('#gauges .gauge').length,5);
 assert.doesNotMatch(get('gauges').textContent,/Stabilité|Moyenne générale/);
 assert.match(get('councilPrompt').textContent,/À la parole · Les Doyle/);
 assert.equal(get('influenceAvailable').textContent,'3 Influence');
 assert.equal(get('influencePart').textContent,'3 Influence');
});

test('Hotspring : le bilan collectif précède la révélation manuelle du classement',async()=>{
 const game=newCampaign({scenarioVersion:'1.2.0',ownerId:owner.id});
 game.command('start',{},owner);
 game.command('pause',{},owner);
 game.command('correctResource',{family:'B',resource:'dollars',value:15},owner);
 game.command('resume',{},owner);
 game.command('finish',{confirm:true},owner);
 const projection=await screen('city',game.state);
 const get=id=>projection.document.getElementById(id);
 assert.equal(get('dilemmaPanel').hidden,true);
 assert.equal(get('finalResults').hidden,true);
 assert.equal(get('cityCinema').hidden,false);
 assert.equal(get('cinemaTitle').textContent,'Qu’avez-vous fait de Hotspring ?');
 assert.equal(get('finalRanking').childElementCount,0);
 assert.doesNotMatch(get('cityCinema').textContent,/Les Doyle|objectifs secrets/);
 assert.ok(projection.document.body.classList.contains('hotspring-ending-screen'));
 const regie=(await screen('regie',game.state)).document;
 assert.equal(regie.querySelector('#sessionControls #showResults').hidden,false);
 assert.match(regie.getElementById('hotspringStage').textContent,/Les Doyle · 5 \/ 5/);
 game.command('showResults',{},owner);
 await projection.update(game.state);
 assert.equal(get('finalResults').hidden,false);
 assert.match(get('winnerTitle').textContent,/Les Doyle/);
 assert.ok(projection.document.body.classList.contains('hotspring-ranking-screen'));
 assert.equal(get('finalRanking').querySelector('[data-rank="1"] strong').textContent,'5 points');
 assert.equal(get('finalRanking').querySelectorAll('li').length,5);
 assert.equal(get('endingText').querySelectorAll('ol > li > details').length,5);
 assert.equal(get('narrativeEnding').hasAttribute('open'),false);
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

test('Préparation : cinq familles Hotspring et aucun catalogue de prototypes',async()=>{
 const {document}=await screen('setup',state);
 const get=id=>document.getElementById(id);
 get('localKey').value='local-v2-key-123456789012345678901234';get('connect').click();
 for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));
 assert.equal(get('gameForm').hidden,false,get('status').textContent);
 assert.equal(document.querySelectorAll('#familySettings .family-row').length,5);
 assert.equal(get('family-name-0').value,'Les Mercer');
 assert.equal(get('scenarioVersion'),null);
 assert.equal(get('familyCount'),null);
});
test('Famille : une proposition reçue ouvre immédiatement une fenêtre avec acceptation et refus',async()=>{
 let s=command(state,owner,'next');s=command(s,{role:'team',family:'B'},'offer',{id:'popup_001',to:'A',amount:3,reason:'Votez avec nous'});
 const {document,update}=await screen('family',s),get=id=>document.getElementById(id);
 assert.equal(get('offerDialog').open,true);
 assert.match(get('receivedOffer').textContent,/3 \$/);
 assert.match(get('receivedCommitment').textContent,/ne vous engage pas/);
 assert.equal(get('offerAccept').textContent,'Accepter le don');
 assert.equal(get('receivedMessage').textContent,'Message de la famille : Votez avec nous');
 const other=await screen('family',s,'C');
 assert.equal(other.document.getElementById('incomingOffers').hidden,true);
 assert.ok(!other.document.getElementById('offerDialog').open);
 get('offerDialog').close();
 s=command(s,owner,'beginVote');await update(s);
 assert.equal(get('negotiationPanel').hidden,true);
 assert.equal(get('incomingOffers').hidden,false);
 assert.equal(get('offerDialog').open,false);
 get('reviewOffer').click();assert.equal(get('offerDialog').open,true);
 s=command(s,team('A'),'acceptOffer',{id:'popup_001'});await update(s);
 assert.equal(get('dollars').textContent,'13');
 assert.equal(get('incomingOffers').hidden,true);assert.equal(get('offerDialog').open,false);
});

test('Pendant le vote, les familles peuvent traiter les propositions en attente sans en envoyer de nouvelles',async()=>{
 const g=newCampaign({scenarioVersion:'1.2.0'});
 for(const kind of ['start','next','next'])g.command(kind);
 const gift={id:'premiere_offre',to:'B',amount:3,commitment:{choice:'gift'}};
 g.command('offer',gift,team('A'));
 g.command('offer',{...gift,id:'deuxieme_offre',amount:1},team('C'));
 g.command('beginVote');
 assert.throws(()=>g.command('offer',{...gift,id:'trop_tard'},team('A')),/pendant la négociation/);
 const sender=await screen('family',g.state,'A'),receiver=await screen('family',g.state,'B');
 const get=id=>receiver.document.getElementById(id);
 assert.equal(get('negotiationPanel').hidden,true);
 assert.match(get('incomingSummary').textContent,/2 propositions/);
 assert.equal(sender.document.getElementById('offerHistory').hidden,false);
 assert.equal(sender.document.getElementById('offers').querySelector('button').textContent,'Annuler');
 g.command('rejectOffer',{id:'premiere_offre'},team('A'));
 await receiver.update(g.state);
 assert.equal(get('offerDialog').dataset.offer,'deuxieme_offre');
 assert.match(get('receivedOffer').textContent,/1 \$ de la part de .*Les Vance/);
 g.command('acceptOffer',{id:'deuxieme_offre'},team('B'));await receiver.update(g.state);
 assert.equal(get('dollars').textContent,'11');
 assert.equal(get('incomingOffers').hidden,true);
 assert.equal(get('offerDialog').open,false);
});
test('Un émetteur voit pourquoi l’accord avec les Verts est impossible et suit la réponse à son don',async()=>{
 const g=newCampaign({scenarioVersion:'1.2.0'});
 for(const kind of ['start','next','next','pause'])g.command(kind);
 g.command('correctResource',{family:'C',resource:'power',value:0});
 g.command('resume');
 const sender=await screen('family',g.state,'A'),get=id=>sender.document.getElementById(id);
 function choose(id,value){
  get(id).value=value;get(id).dispatchEvent(new sender.document.defaultView.Event('change',{bubbles:true}));
 }
 choose('targetFamily','C');choose('offerCommitment','pour');
 assert.equal(get('sendOffer').disabled,true);
 assert.match(get('offerLimitHint').textContent,/POUR impossible.*Équipe Verte.*Influence insuffisante.*Don/);
 choose('offerCommitment','gift');
 assert.equal(get('sendOffer').disabled,false);assert.equal(get('offerLimitHint').hidden,true);
 const gift={id:'don_verts_01',amount:3,to:'C',commitment:{choice:'gift'}};
 g.command('offer',gift,team('A'));await sender.update(g.state);
 assert.equal(get('sentOfferTitle').textContent,'En attente de réponse');
 assert.match(get('sentOfferText').textContent,/Offre de 3 \$ à .*Équipe Verte/);
 assert.equal(narrativeView(g.state,{role:'public'}).voteOfferLimits,undefined);
 const bystander=await screen('family',g.state,'B');
 assert.equal(bystander.document.getElementById('sentOfferNotice').hidden,true);
 get('dismissSentOffer').click();assert.equal(get('sentOfferNotice').hidden,true);
 g.command('acceptOffer',{id:gift.id},team('C'));await sender.update(g.state);
 assert.equal(get('sentOfferNotice').hidden,false);assert.equal(get('sentOfferTitle').textContent,'Proposition acceptée');
 assert.match(get('sentOfferText').textContent,/Versement de 3 \$ à .*Équipe Verte/);
 assert.equal(get('dollars').textContent,'7');
 g.command('offer',{...gift,id:'don_verts_02'},team('A'));await sender.update(g.state);
 assert.equal(get('sentOfferTitle').textContent,'En attente de réponse');
 g.command('beginVote');g.command('rejectOffer',{id:'don_verts_02'},team('C'));await sender.update(g.state);
 assert.equal(get('sentOfferTitle').textContent,'Proposition refusée');assert.equal(get('dollars').textContent,'7');
 get('dismissSentOffer').click();assert.equal(get('sentOfferTitle').textContent,'Proposition acceptée');
 get('dismissSentOffer').click();assert.equal(get('sentOfferNotice').hidden,true);
});
test('Suivi des offres : reprise après rechargement, retrait et clôture des anciennes offres',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const offer={id:'aux-verts',from:'A',to:'C',councilNumber:1,status:'pending'};
 const data={offers:[offer],self:{id:'A'},history:[{}],phase:'NEGOTIATION'};
 let notices=createSentOfferNotices(storage,'session-bleus');
 assert.equal(notices.unread(data).length,1);notices.dismiss(offer);
 notices=createSentOfferNotices(storage,'session-bleus');
 assert.equal(notices.unread(data).length,0);
 offer.status='rejected';offer.closedBy='A';
 data.history.push({});data.phase='PRESENTATION';
 assert.equal(offerStatusText(notices.unread(data)[0]),'Proposition retirée');
 notices.dismiss(offer);
 assert.equal(createSentOfferNotices(storage,'session-bleus').unread(data).length,0);
 assert.equal(offerStatusText({...offer,closedBy:undefined}),'Proposition clôturée');
 assert.equal(offerStatusText({...offer,status:'expired'}),'Proposition expirée');
});
test('Régie de Chicago : distinguer le vote des familles, la suspension et le scrutin final',async()=>{
 const {preview,names}=chicagoSessionPreview(prepareCosaNostra(chicagoCampaign()),[5,5,5,5,5]);
 let s=createNarrativeSession(preview,{ownerId:owner.id,id:'c'.repeat(24),code:'BUREAU',title:'Chicago',rehearsal:true,names,now:1000});
 const advance=(kind,data={})=>{s=command(s,owner,kind,data);};
 advance('start');advance('next');
 const {document,update}=await screen('regie',s);
 const play=document.getElementById('playControls'),session=document.getElementById('sessionControls');
 assert.equal(play.querySelector('#beginVote').hidden,false);
 assert.equal(session.querySelector('#endSitting').hidden,false);
 assert.match(session.querySelector('#chicagoSuccession').textContent,/Interrompre ce Conseil et lancer la finale/);
 advance('beginVote');await update(s);
 assert.match(play.querySelector('#rehearsalDecision').textContent,/Valider POUR/);
 advance('endSitting');await update(s);
 assert.equal(session.querySelector('#resumeSitting').hidden,false);
 advance('resumeSitting');advance('requestChicagoFinale',{mode:'interrupt',confirm:true});advance('openChicagoBallot');await update(s);
 const lock=[...session.querySelectorAll('#chicagoSuccession button')].find(b=>b.textContent==='Verrouiller le scrutin');
 assert.ok(lock?.disabled,'Le scrutin final attend les cinq bulletins');
});

test('Le dernier bouton de progression de Hotspring quitte les commandes ordinaires',async()=>{
 const g=newCampaign({scenarioVersion:'1.2.0',ownerId:owner.id});
 g.command('start',{},owner);
 const {document,update}=await screen('regie',g.state);
 for(const [chapter,label] of [[5,'Ouvrir le chapitre final'],[6,'Qualifier les chartes']]){
  g.state.phase='CHECKPOINT';g.state.campaign.chapter=chapter;g.state.revision++;
  await update(g.state);
  assert.equal(document.querySelector('#playControls #next').hidden,true);
  const next=document.querySelector('#sessionControls #finalNext');
  assert.equal(next.hidden,false);assert.equal(next.textContent,label);
  assert.equal(document.querySelector('#finishGame').hidden,true);
 }
});

function chicagoProjectionState(choice){
 const campaign=chicagoCampaign();
 const scene=campaign.dilemmas[0];
 const favor=scene.options.find(o=>o.choice==='POUR');
 favor.effects={PRO:10,POL:-3,DIS:3};
 favor.public_trends=[{gauge:'PRO',name:campaign.metadata.gauges.PRO,direction:'↑'}];
 const {preview,names}=chicagoSessionPreview(prepareCosaNostra(campaign),[5,5,5,5,5]);
 let s=createNarrativeSession(preview,{ownerId:owner.id,id:'c'.repeat(24),code:'CADRAGE',title:'Chicago',names,now:1000});
 // Existing sessions have the original skin labels and must also display the new wording.
 for(const code of Object.keys(s.game.city))s.game.city[code]=54;
 s=command(s,owner,'start');
 return choice?resolveChicagoProjectionVote(command(command(s,owner,'next'),owner,'beginVote'),choice):s;
}
function resolveChicagoProjectionVote(s,choice){
 while(s.game.vote){
  const v=s.game.vote;
  const who=v.turn;
  s=command(s,team(who),'vote',Object.hasOwn(v.choices,who)?{kind:'maintien'}:who==='A'?{kind:choice,amount:1}:{kind:'passe_pouvoir'});
 }
 return s;
}

test('Cosa Nostra : tous les écrans distinguent les cinq jauges du décor et gardent les effets secrets avant la résolution',async()=>{
 const state=chicagoProjectionState();
 for(const app of ['city','family','regie']){
  const {document,errors}=await screen(app,state);
  assert.deepEqual(errors,[]);
  if(app==='city')assert.equal(document.getElementById('gaugeHeading'),null);
  else assert.equal(document.getElementById('gaugeHeading').textContent,'État de la Cosa Nostra');
  const gauges=document.getElementById('gauges');
  assert.equal(gauges.querySelectorAll('.gauge').length,5);
  assert.equal(gauges.querySelector('.chicago-stability h3').textContent,'Stabilité de la Cosa Nostra');
  assert.equal(gauges.querySelector('.chicago-stability-value').textContent,'54 / 100');
  assert.equal(gauges.querySelector('.chicago-stability-state').textContent,'Équilibre fragile');
  assert.doesNotMatch(document.body.textContent,/état de Chicago|stabilité de Chicago|moyenne générale de Chicago/i);
  assert.equal(gauges.querySelector('.chicago-consequences'),null);
  assert.equal(gauges.querySelector('.gauge strong').textContent,'54 / 100');
  assert.equal(gauges.querySelector('.gauge-delta,.chicago-last-vote'),null);
 }
});

test('Cosa Nostra : les variations signées se lisent au résultat, les valeurs acquises persistent au Conseil suivant',async()=>{
 let s=chicagoProjectionState('pour');
 const first=structuredClone(s.lastReveal),live=await screen('city',s);
 const row=(doc,code)=>[...doc.querySelectorAll('#gauges .gauge')].find(el=>el.querySelector('span').textContent===s.skin.labels.resources[code]);
 const checkResult=doc=>{
  assert.equal(row(doc,'PRO').querySelector('.gauge-delta-positive').textContent,'+10');
  assert.equal(row(doc,'POL').querySelector('.gauge-delta-negative').textContent,'−3');
  assert.equal(row(doc,'EMP').querySelector('.gauge-delta'),null);
  assert.equal(doc.querySelector('.chicago-stability-score .gauge-delta').textContent,'+2');
 };
 checkResult(live.document);
 for(const app of ['family','regie'])checkResult((await screen(app,s)).document);
 const checkCurrent=doc=>{
  const gauges=doc.getElementById('gauges');
  assert.equal(gauges.querySelector('.gauge-delta,.chicago-consequences'),null);
  assert.doesNotMatch(gauges.textContent,/Dernier vote|→/);
  assert.equal(row(doc,'PRO').querySelector('strong').textContent,'64 / 100');
  assert.equal(row(doc,'PRO').querySelector('.bar').style.width,'64%');
  assert.equal(row(doc,'POL').querySelector('strong').textContent,'51 / 100');
  assert.equal(doc.querySelector('.chicago-stability-value').textContent,'56 / 100');
 };
 for(const [kind,phase] of [['next','PRESENTATION'],['next','NEGOTIATION'],['beginVote','COUNCIL']]){
  s=command(s,owner,kind);
  assert.equal(s.phase,phase);
  assert.equal(narrativeView(s,{role:'public'}).reveal,null);
  await live.update(s);checkCurrent(live.document);
 }
 // Reloading during the new vote must not restore the previous result badges.
 for(const app of ['city','family','regie'])checkCurrent((await screen(app,s)).document);
 s=resolveChicagoProjectionVote(s,'contre');
 const second=structuredClone(s.lastReveal);
 assert.notEqual(first.id,second.id);
 assert.deepEqual(second.cityBefore,first.cityAfter);
 await live.update(s);
 for(const code of Object.keys(first.cityAfter)){
  const delta=second.cityAfter[code]-second.cityBefore[code],gauge=row(live.document,code);
  assert.equal(gauge.querySelector('.gauge-delta')?.textContent,delta>0?'+'+delta:delta<0?'−'+Math.abs(delta):undefined);
 }
 s=command(s,owner,'next');
 await live.update(s);
 assert.equal(live.document.querySelector('#gauges .gauge-delta'),null);
 for(const [code,value] of Object.entries(second.cityAfter)){
  assert.equal(row(live.document,code).querySelector('strong').textContent,value+' / 100');
 }
});

test('Cosa Nostra : une correction de régie entre deux votes affiche la nouvelle valeur seule',async()=>{
 let s=chicagoProjectionState('pour');
 s=command(command(command(s,owner,'next'),owner,'pause'),owner,'correctCity',{indicator:'PRO',value:88});
 const {document}=await screen('city',s);
 const gauge=[...document.querySelectorAll('#gauges .gauge')].find(el=>el.querySelector('span').textContent===s.skin.labels.resources.PRO);
 assert.equal(gauge.querySelector('strong').textContent,'88 / 100');
 assert.equal(gauge.querySelector('.gauge-delta'),null);
});

test('Projection Cosa Nostra : les commandes et les jauges à côté de la scène, le chapitre dans le dilemme',async()=>{
 const intro=(await screen('city',chicagoProjectionState())).document;
 assert.match(intro.getElementById('cineImage').getAttribute('src'),/0101-intro/);
 for(const side of ['pour','contre']){
  const {document}=await screen('city',chicagoProjectionState(side));
  const get=id=>document.getElementById(id);
  assert.match(get('cineImage').getAttribute('src'),new RegExp('0101-'+side));
  assert.equal(get('cineHero').querySelector('figure').children.length,2);
  assert.equal(get('projectionFullscreen').parentElement,get('cineControls'));
  assert.equal(get('chronicleOpen').parentElement,get('cineControls'));
  assert.equal(get('projectionFullscreen').closest('details'),null);
  assert.equal(get('cineControls').parentElement,get('cineRail'));
  assert.equal(get('cineState').parentElement,get('cineRail'));
  assert.equal(get('gaugeHeading'),null);
  assert.equal(get('cineState').getAttribute('aria-label'),'Indicateurs de la Commission');
  assert.equal(get('chapter').closest('section'),get('dilemmaPanel'));
  assert.match(get('chapter').textContent,/Chapitre 1 · L’Héritage · Résultat/);
  assert.equal(get('chronicleOpen').hidden,false);
  assert.equal(get('gauges').querySelector('.chicago-consequences').textContent,'Conséquences pour la Cosa Nostra');
  assert.equal(get('gauges').lastElementChild.className,'chicago-stability');
  if(side==='pour'){
   assert.equal(get('gauges').querySelector('.chicago-stability-value').textContent,'54 → 56 / 100');
   assert.match(get('gauges').textContent,/54 → 64 \/ 100/);
   get('chronicleOpen').click();
   assert.match(get('cityChronicle').textContent,/Conséquences pour la Cosa Nostra/);
   assert.match(get('cityChronicle').textContent,/Stabilité de la Cosa Nostra · 54 → 56 \/ 100 · Équilibre fragile/);
  }
 }
 const hotspring=(await screen('city',state)).document;
 assert.ok(hotspring.getElementById('projectionFullscreen').closest('.top'));
 assert.equal(hotspring.getElementById('cineHero').hidden,true);
});

test('Projection Cosa Nostra : les six qualificatifs changent aux bornes éditoriales',async()=>{
 const s=chicagoProjectionState(),live=await screen('city',s);
 for(const [low,high,label] of [[0,19,'Organisation en déroute'],[20,39,'Guerre ouverte'],[40,59,'Équilibre fragile'],[60,79,'Ordre établi'],[80,94,'Syndicat puissant'],[95,100,'Empire criminel']]){
  for(const n of [low,high]){
   for(const code of Object.keys(s.game.city))s.game.city[code]=n;
   if(high!==100&&n===high)s.game.city.PRO+=1; // 19,2, 39,2, etc.
   s.revision++;await live.update(s);
   assert.equal(live.document.querySelector('.chicago-stability-state').textContent,label);
  }
 }
});

test('Décisions-clés Chicago : cinq fiches privées, proposition exacte et rappel limité au terminal concerné',async()=>{
 const campaign=chicagoCampaign(),houses=campaign.metadata.family_objectives;
 // Distinct titles make privacy assertions independent of the synthetic fixture.
 for(const [index,scene] of campaign.dilemmas.entries()){
  scene.title='Conseil confidentiel '+(index+1);
  for(const option of scene.options)option.title='Proposition '+option.choice+' du Conseil '+(index+1);
 }
 const [slot]=houses[0].major_slots;
 const key=campaign.dilemmas.find(d=>d.id===slot[0]);
 const source=key.options.find(o=>o.choice===slot[1]);
 const other=key.options.find(o=>o!==source);
 other.secret_success=source.secret_success;source.secret_success=null;slot[1]=other.choice;
 const {preview,names}=chicagoSessionPreview(prepareCosaNostra(campaign),[1,1,1,1,1]);
 let s=createNarrativeSession(preview,{ownerId:owner.id,id:'d'.repeat(24),code:'CLEFS',title:'Chicago',names,now:1000});
 const ids=Object.keys(s.scenario.chicago.ambitions);
 // A saved session may still contain wording from the original private JSON.
 Object.assign(s.scenario.chicago.ambitions.D,{specialty:'Accords sociaux',medium:{points:3,condition:'Jauge familiale à 60/100.'}});
 const start=await screen('family',s);
 assert.ok(start.document.getElementById('keyDecisionBanner').hidden);
 s=command(s,owner,'start');
 while(s.scenario.dilemmas.find(d=>d.id===s.currentDilemmaId).sourceId!==key.id){
  s=resolveChicagoProjectionVote(command(command(s,owner,'next'),owner,'beginVote'),'pour');
  s=command(s,owner,'next');
 }
 for(const [i,id] of ids.entries()){
  const {document}=await screen('family',s,id);
  const own=houses[i].major_slots.map(([sceneId])=>campaign.dilemmas.find(d=>d.id===sceneId).title);
  const section=document.getElementById('chicagoAmbition');
  assert.deepEqual([...section.querySelectorAll('li > strong')].map(e=>e.textContent),own);
  assert.equal(section.querySelectorAll('li').length,3);
  assert.match(section.textContent,/Votre priorité.*2 points.*3 points.*Vos 3 décisions-clés — 5 points/);
  assert.match(section.textContent,/0 \/ 2 décisions nécessaires/);
  assert.doesNotMatch(section.textContent,/60\s*\/\s*100|jauge familiale|pivot|occasion commune|secret_success|CN_\d|0\d\.0\d|Accords sociaux/i);
  assert.equal(document.getElementById('keyDecisionBanner').hidden,id!=='A');
  assert.equal(document.querySelectorAll('#chicagoChoices .key-position').length,id==='A'?1:0);
  if(id==='A'){
   const note=document.querySelector('#chicagoChoices .key-position');
   assert.equal(note.textContent,'Votre position-clé : '+other.choice);
   assert.ok(note.parentElement.textContent.includes(other.title));
  }
  if(names[i]==='Vitale')assert.match(section.textContent,/Solidarité du réseau/);
 }
 for(const app of ['city','regie']){
  const {document}=await screen(app,s);
  assert.equal(document.querySelector('.key-decision-banner,.key-position'),null);
  if(app==='regie')assert.equal(document.querySelectorAll('#chicagoObjectivesAudit .key-decisions li').length,15);
  else assert.equal(document.querySelector('.key-decisions'),null);
 }
 s=command(command(s,owner,'next'),owner,'beginVote');
 const a=await screen('family',s,'A');
 const chapter=a.document.getElementById('familyChapter'),votePanel=a.document.getElementById('familyVotePanel');
 assert.equal(votePanel.nextElementSibling,chapter);
 assert.equal(a.document.getElementById('firstVote').hidden,false);
 for(const button of a.document.querySelectorAll('#firstVote [data-vote]'))assert.equal(button.disabled,false);
 // A supports the opposite camp. B wins for A's preferred proposal with a larger bid.
 const ballot=(base,winner)=>{
  let state=base;
  while(state.game.vote){
   const vote=state.game.vote,who=vote.turn;
   const data=Object.hasOwn(vote.choices,who)?{kind:'maintien'}:who==='A'?{kind:source.choice.toLowerCase(),amount:1}:
    who==='B'?{kind:winner.toLowerCase(),amount:2}:{kind:'passe_pouvoir'};
   state=command(state,team(who),'vote',data);
  }
  return state;
 };
 const won=ballot(s,other.choice),lost=ballot(s,source.choice);
 await a.update(won);
 assert.equal(chapter.nextElementSibling,votePanel);
 assert.ok(a.document.getElementById('keyDecisionBanner').hidden);
 assert.match(a.document.getElementById('chicagoAmbition').textContent,/Réussie ✓.*1 \/ 2 décisions nécessaires/);
 assert.equal(narrativeView(won,team('A')).voteCommitment,null);
 const missed=await screen('family',lost);
 assert.match(missed.document.getElementById('chicagoAmbition').textContent,/Manquée.*0 \/ 2 décisions nécessaires/);
 const early=command(won,owner,'requestChicagoFinale',{confirm:true});
 await a.update(early);
 const final=a.document.getElementById('chicagoAmbition');
 assert.match(final.textContent,/Réussie ✓.*Non jouée.*Finale anticipée/);
 assert.doesNotMatch(final.textContent,/Manquée|0 \/ 0/);
});

test('Bilan Hotspring : portrait du chapitre, six jauges et secours du même stade',async()=>{
 const game=newCampaign({scenarioVersion:'1.2.0'});
 game.command('start');
 while(game.state.phase!=='CHECKPOINT'){
  if(game.state.phase==='REVEALED')game.command('next');
  else game.vote('pour');
 }
 const {document,update}=await screen('city',game.state);
 const get=id=>document.getElementById(id),cinema=narrativePublicView(game.state).campaign.cinema;
 assert.equal(get('dilemmaPanel').hidden,true);
 assert.equal(get('cityCinema').hidden,false);
 assert.equal(get('cinemaChapter').textContent,'Chapitre 1 terminé');
 assert.equal(get('cinemaTitle').textContent,cinema.chapterTitle);
 assert.equal(get('cinemaGauges').children.length,6);
 assert.equal(get('cinemaGauges').querySelectorAll('small.cinema-delta').length,6);
 assert.equal(get('finalResults').hidden,true);
 assert.equal(get('cinemaImage').getAttribute('src'),cinema.view.url);
 assert.equal(get('city').childElementCount,0);
 get('cinemaTools').click();
 assert.equal(get('cinemaTools').getAttribute('aria-expanded'),'true');
 assert.notEqual(cinema.view.url,cinema.fallback.url);
 get('cinemaImage').onerror();
 assert.equal(get('cinemaImage').getAttribute('src'),cinema.fallback.url);
 get('cinemaImage').onerror();
 assert.equal(get('cinemaMissing').hidden,false);
 game.command('next');await update(game.state);
 assert.equal(get('cityCinema').hidden,true);
 assert.equal(get('cinemaTools').hidden,true);
});
