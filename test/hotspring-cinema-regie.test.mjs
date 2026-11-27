import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {mountCinemaPreview} from '../public/hotspring-cinema-regie.js';
import {narrativeView} from '../src/founders-live.ts';
import {newCampaign,team} from './helpers/hotspring.mjs';

const markup=readFileSync(new URL('../public/founders-regie.html',import.meta.url),'utf8');
const view=(id,title)=>({id,title,url:'/assets/hotspring/v1/cinema/'+id+'.webp',alt:title});
const fallback=view('c4-expansion','La ville s’étend'),mine=view('c4-mine','Au pied de la mine'),rail=view('c4-rail','Le dépôt ferroviaire');
const live={chapterTitle:'La fièvre de Hotspring',view:mine,fallback,profile:{id:'B',title:'Prospère mais brutale'},reasons:['La grande concession a été accordée.'],
 city:{economie:8,ecologie:2,securite:4,demographie:6,bien_etre:3},stabilityLabel:'Équilibre fragile',
 profiles:[{...mine,eligible:true},{...rail,eligible:false,reason:'Le chemin de fer a été refusé.'}],
 simulations:[{id:'industrie',title:'Industrie et fumées',chapters:[
  {stage:4,view:rail,fallback,reasons:['Le chemin de fer a été approuvé.'],chapterTitle:'La fièvre de Hotspring'},
  {stage:7,view:view('fin-industrie','La ville industrielle'),fallback,reasons:['Économie élevée.'],chapterTitle:'Épilogue'}
 ]}]};
function setup(){
 const {document,window}=parseHTML(markup);
 // linkedom exposes selected options but not the native select.value setter.
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,
  get(){return [...this.options].find(o=>o.hasAttribute('selected'))?.value??this.options[0]?.value??'';},
  set(value){for(const option of this.options)if(option.value===value)option.setAttribute('selected','');else option.removeAttribute('selected');}
 });
 const root=document.getElementById('cinemaPreview'),render=mountCinemaPreview(root);
 const get=id=>document.getElementById(id);
 const emit=(el,event)=>el.dispatchEvent(new window.Event(event));
 const update=(cinema,phase='NEGOTIATION')=>render({phase,campaignAdmin:{cinema},code:'DEMO'});
 const open=()=>{root.open=true;emit(root,'toggle');};
 const select=(id,value)=>{get(id).value=value;emit(get(id),'change');};
 return {get,emit,update,open,select};
}
test('Aperçu régie : seuls les organisateurs disposant de la sélection voient la vue, les critères et les exclusions',()=>{
 const {update,open,get}=setup();
 update(null);assert.ok(get('cinemaPreview').hidden);
 update(live);assert.equal(get('cinemaPreview').hidden,false);
 assert.equal(get('cinemaImage').firstElementChild,null);
 open();
 assert.equal(get('cinemaImage').firstElementChild.getAttribute('src'),mine.url);
 assert.match(get('cinemaReasons').textContent,/concession/);
 assert.match(get('cinemaCandidates').textContent,/Écartée.*refusé/);
 assert.match(get('cinemaGauges').textContent,/Économie 8\/10/);
 assert.match(get('cinemaProfile').textContent,/Ambiance B · Prospère mais brutale/);
 assert.ok(get('cinemaStageField').hidden);
 update(null);assert.ok(get('cinemaPreview').hidden);
 assert.equal(get('cinemaImage').firstElementChild,null);
});
test('Les essais sont locaux, conservent le chapitre choisi à l’actualisation, puis retrouvent la partie réelle',()=>{
 const {update,open,select,get}=setup();
 const original=structuredClone(live);
 update(live);open();select('cinemaPath','industrie');
 assert.equal(get('cinemaStageField').hidden,false);
 assert.equal(get('cinemaImage').firstElementChild.getAttribute('src'),rail.url);
 select('cinemaStage','7');update(structuredClone(live));
 assert.match(get('cinemaChapter').textContent,/Épilogue/);
 assert.match(get('cinemaTitle').textContent,/industrielle/);
 assert.deepEqual(live,original);
 select('cinemaPath','live');
 assert.equal(get('cinemaImage').firstElementChild.getAttribute('src'),mine.url);
 assert.ok(get('cinemaStageField').hidden);
});
test('Une image manquante produit un signalement exploitable, préserve le secours et autorise un nouvel essai',()=>{
 const {update,open,emit,get}=setup();update(live);open();
 const frame=get('cinemaImage'),image=frame.firstElementChild;
 emit(image,'error');assert.equal(get('cinemaProblem').hidden,false);
 assert.equal(frame.firstElementChild.getAttribute('src'),fallback.url);
 emit(frame.firstElementChild,'load');assert.match(get('cinemaProblemText').textContent,/secours est affichée/);
 assert.ok(get('cinemaIssueReport').value.includes(mine.url));
 update(structuredClone(live));assert.equal(get('cinemaProblem').hidden,false);
 emit(frame.firstElementChild,'error');assert.equal(frame.firstElementChild,null);
 assert.ok(get('cinemaIssueReport').value.includes(fallback.url));
 emit(get('cinemaRetry'),'click');assert.ok(get('cinemaProblem').hidden);
 assert.equal(frame.firstElementChild.getAttribute('src'),mine.url);
});
test('Le MJ peut aussi préciser quelle scène manque quand une vue générique s’affiche correctement',()=>{
 const {update,open,emit,get}=setup();update(live);open();
 emit(get('cinemaImage').firstElementChild,'load');emit(get('cinemaReport'),'click');
 assert.equal(get('cinemaProblem').hidden,false);assert.equal(get('cinemaRetry').hidden,true);
 const report=get('cinemaIssueReport');
 assert.match(report.value,/Illustration à prévoir/);assert.match(report.value,/Partie DEMO/);
 report.value+='Le quai n’apparaît pas.';update(structuredClone(live));
 assert.match(report.value,/Le quai/);
});
test('La vraie vue régie offre cinq essais complets et prépare le prochain bilan après un chapitre joué',()=>{
 const game=newCampaign({scenarioVersion:'1.2.0'});game.command('start');
 for(let i=0;i<3;i++){game.vote('pour');game.command('next');}
 assert.equal(game.state.phase,'CHECKPOINT');
 const organizer=narrativeView(game.state,{role:'organizer',id:game.state.ownerId});
 const publicView=narrativeView(game.state,{role:'public'});
 const familyView=narrativeView(game.state,team('A'));
 const preview=organizer.campaignAdmin.cinema;
 assert.equal(publicView.campaignAdmin,undefined);assert.equal(familyView.campaignAdmin,undefined);
 assert.equal(preview.simulations.length,5);
 const {update,open,select,get}=setup();
 update(preview,'CHECKPOINT');open();
 assert.match(get('cinemaPreviewScope').textContent,/Prochain bilan/);
 assert.match(get('cinemaChapter').textContent,/Chapitre 2/);
 assert.match(get('cinemaGauges').textContent,/Stabilité/);
 for(const sim of preview.simulations){
  select('cinemaPath',sim.id);assert.equal(get('cinemaStage').options.length,7);
  select('cinemaStage','7');
  assert.equal(get('cinemaImage').firstElementChild.getAttribute('src'),sim.chapters.at(-1).view.url);
 }
 select('cinemaPath','live');
 assert.equal(get('cinemaImage').firstElementChild.getAttribute('src'),preview.view.url);
});
