import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {foundersPreview,foundersCatalogFor} from '../server/founders-catalog.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativeView} from '../src/founders-live.ts';
import {prepareCosaNostra} from '../server/cosa-nostra-preparation.ts';
import {chicagoSessionPreview} from '../server/cosa-nostra-session.ts';
import {fixture as chicagoCampaign} from './helpers/chicago.mjs';
import {newCampaign,team} from './helpers/hotspring.mjs';
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

test('Projection Hotspring : le visuel du dilemme et le panorama coexistent',async()=>{
 const campaign=newCampaign();
 campaign.command('start');
 const intro=await screen('city',campaign.state);
 assert.equal(intro.document.getElementById('decisionImage').hidden,false);
 assert.equal(intro.document.querySelector('#hotspringStage img'),null);
 campaign.command('next');
 const {document}=await screen('city',campaign.state);
 const artwork=document.getElementById('decisionImage'),city=document.getElementById('city');
 assert.equal(document.querySelectorAll('#gauges .gauge').length,6);
 assert.match(document.getElementById('gauges').textContent,/Bien-être.*Stabilité/);
 assert.match(document.getElementById('gauges').textContent,/5,0\/10Moyenne générale de Hotspring/);
 assert.equal(document.getElementById('cityEvolution').hidden,true);
 assert.equal(artwork.hidden,false);
 assert.equal(city.hidden,false);
 assert.equal(artwork.closest('#dilemmaPanel').id,'dilemmaPanel');
 assert.equal(document.getElementById('dilemmaArtwork').hidden,false);
 assert.ok(document.getElementById('question').textContent);
 campaign.vote('pour');
 const reveal=await screen('city',campaign.state);
 assert.match(reveal.document.getElementById('gauges').textContent,/Stabilité5,0 → 5,4\/10\+0,4/);
 assert.equal(reveal.document.getElementById('city').hidden,false);
 assert.match(reveal.document.getElementById('decisionImage').getAttribute('src'),/d01_result_for_lowlands/);
 assert.equal(reveal.document.getElementById('decisionImage').hidden,false);
 artwork.dispatchEvent(new document.defaultView.Event('error'));
 assert.equal(document.getElementById('dilemmaArtwork').hidden,true);
 assert.equal(city.hidden,false);
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
 assert.equal(get('phaseClock').hidden,true);
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
 assert.match(get('receivedOffer').textContent,/Mercer » vous propose 4 \$ en échange d’un vote POUR/);
 assert.equal(get('offerAccept').textContent,'Accepter et s’engager');
 g.command('acceptOffer',{id:'affaire02'},team('B'));
 g.command('beginVote');g.command('vote',{kind:'pour',amount:2},team('A'));
 await update(g.state);
 assert.deepEqual(options('offerAmount'),['1 $','2 $','3 $','4 $']);
 assert.deepEqual(options('voteAmount'),['3','4']);
 assert.equal(get('firstVote').querySelector('[data-vote="contre"]').disabled,true);
 assert.equal(get('firstVote').querySelector('[data-vote="passe_pouvoir"]').disabled,true);
 assert.match(get('voteProgress').textContent,/vous engage à voter POUR avec au moins 3 Influence/);
 g.command('vote',{kind:'pour',amount:3},team('B'));
 for(const id of ['C','D','E'])g.command('vote',{kind:'passe_pouvoir'},team(id));
 g.command('vote',{kind:'maintien'},team('A'));
 await update(g.state);
 assert.equal(get('raiseVote').hidden,false);
 assert.deepEqual(options('raiseAmount'),['+1']);
 assert.equal(get('raiseVote').querySelector('[data-vote="maintien"]').disabled,false);
});

test('Hotspring V1.2 : Stabilité sous le panorama et ouverture manuelle depuis la régie',async()=>{
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
 assert.equal(get('panoramaStability').previousElementSibling.firstElementChild.id,'city');
 assert.equal(get('panoramaStability').hidden,false);
 assert.equal(get('stabilityTitle').textContent,'Stabilité — 5,0 / 10');
 assert.equal(get('stabilityState').textContent,'Ville stable');
 assert.equal(document.querySelectorAll('#gauges .gauge').length,5);
 assert.doesNotMatch(get('gauges').textContent,/Stabilité|Moyenne générale/);
 assert.match(get('councilPrompt').textContent,/À la parole · Les Doyle/);
 assert.equal(get('influenceAvailable').textContent,'3 Influence');
 assert.equal(get('influencePart').textContent,'3 Influence');
});

test('Hotspring : l’épilogue annonce le classement avant le détail des objectifs',async()=>{
 const game=newCampaign({scenarioVersion:'1.2.0',ownerId:owner.id});
 game.command('start',{},owner);
 game.command('pause',{},owner);
 game.command('correctResource',{family:'B',resource:'dollars',value:15},owner);
 game.command('resume',{},owner);
 game.command('finish',{confirm:true},owner);
 const projection=await screen('city',game.state);
 const get=id=>projection.document.getElementById(id);
 assert.equal(get('dilemmaPanel').hidden,true);
 assert.equal(get('finalResults').hidden,false);
 assert.match(get('winnerTitle').textContent,/Les Doyle/);
 assert.equal(get('finalRanking').querySelectorAll('ol > li').length,5);
 assert.equal(get('finalRanking').querySelector('details'),null);
 assert.match(get('finalRanking').textContent,/Les Doyle · 5 \/ 5/);
 assert.equal(get('narrativeEnding').hidden,false);
 assert.ok(get('endingText').textContent.includes('Qu’avez-vous fait de Hotspring'));
 const regie=(await screen('regie',game.state)).document;
 assert.equal(regie.querySelector('#sessionControls #showResults').hidden,false);
 assert.match(regie.getElementById('hotspringStage').textContent,/Les Doyle · 5 \/ 5/);
 game.command('showResults',{},owner);
 await projection.update(game.state);
 assert.equal(get('finalRanking').querySelectorAll('ol > li > details').length,5);
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
 const {document}=await screen('family',s);assert.equal(document.getElementById('offerDialog').open,true);assert.match(document.getElementById('receivedOffer').textContent,/3/);assert.match(document.getElementById('receivedCommitment').textContent,/ne vous engage pas/);assert.equal(document.getElementById('offerAccept').textContent,'Accepter');
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
 scene.options.find(o=>o.choice==='POUR').effects={PRO:10};
 const {preview,names}=chicagoSessionPreview(prepareCosaNostra(campaign),[5,5,5,5,5]);
 let s=createNarrativeSession(preview,{ownerId:owner.id,id:'c'.repeat(24),code:'CADRAGE',title:'Chicago',names,now:1000});
 // Existing sessions have the original skin labels and must also display the new wording.
 for(const code of Object.keys(s.game.city))s.game.city[code]=54;
 s=command(s,owner,'start');
 if(!choice)return s;
 s=command(command(s,owner,'next'),owner,'beginVote');
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
  assert.equal(document.getElementById('gaugeHeading').textContent,'État de la Cosa Nostra');
  const gauges=document.getElementById('gauges');
  assert.equal(gauges.querySelectorAll('.gauge').length,5);
  assert.equal(gauges.querySelector('.chicago-stability h3').textContent,'Stabilité de la Cosa Nostra');
  assert.equal(gauges.querySelector('.chicago-stability-value').textContent,'54 / 100');
  assert.equal(gauges.querySelector('.chicago-stability-state').textContent,'Équilibre fragile');
  assert.doesNotMatch(document.body.textContent,/état de Chicago|stabilité de Chicago|moyenne générale de Chicago/i);
  assert.equal(gauges.querySelector('.chicago-consequences'),null);
  if(app!=='regie')assert.doesNotMatch(gauges.querySelector('.gauge').textContent,/\d/);
 }
});

test('Projection Cosa Nostra : la scène entière, les commandes dans Options et les effets de chaque issue',async()=>{
 const intro=(await screen('city',chicagoProjectionState())).document;
 assert.match(intro.getElementById('cineImage').getAttribute('src'),/0101-intro/);
 for(const side of ['pour','contre']){
  const {document}=await screen('city',chicagoProjectionState(side));
  const get=id=>document.getElementById(id);
  assert.match(get('cineImage').getAttribute('src'),new RegExp('0101-'+side));
  assert.equal(get('cineHero').querySelector('figure').children.length,2);
  assert.equal(get('projectionFullscreen').parentElement,get('cineMenuButtons'));
  assert.equal(get('chronicleOpen').closest('details'),get('cineMenu'));
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
