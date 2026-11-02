// Render smoke tests execute the browser module with a tiny DOM boundary.
// They verify generated views and escaping; they are not visual/browser QA.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createSession,applyCommand,sessionView} from '../src/session.ts';
import {catalog,map} from '../server/store.ts';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
function session(phase='ORDERS'){
 let s=createSession('012345678901234567890123','local-organizer',catalog[0],['O1','O2','O3','O4','O5','O6'],[1,2,3,4,5,6]),n=0;
 while(s.phase!==phase)s=applyCommand(s,{role:'organizer',id:'local-organizer'},{id:`ui-${++n}`,sessionId:s.id,expectedRound:s.game.round,expectedPhase:s.phase,kind:'advance',data:{}},1000);
 return s;
}
async function render(mode,s){
 const elements=new Map();let serial=0;
 function el(id){if(elements.has(id))return elements.get(id);const e={id,dataset:{},hidden:false,textContent:'',className:'',value:'',addEventListener(){},focus(){},select(){},style:{},classList:{toggle(){}},showModal(){},_html:''};Object.defineProperty(e,'innerHTML',{get:()=>e._html,set:html=>{e._html=html;if(id==='main'){for(const [k,v] of elements)if(v.dynamic)elements.delete(k);for(const match of html.matchAll(/\bid="([^"]+)"/g)){const child=el(match[1]);child.dynamic=true;}}}});elements.set(id,e);return e;}
 for(const id of ['main','help','logout','rules','connection','notice'])el(id);
 const actor=mode==='organizer'?{role:'organizer',id:'local-organizer'}:mode==='team'?{role:'team',team:'force'}:{role:'public'};
 const view={...sessionView(s,actor),serverNow:1000,title:'Test <script>evil</script>',code:'TEST01',...(mode==='team'?{teamId:'force'}:{}),...(mode==='organizer'?{connections:[]}: {})};
 const storage=new Map();
 const sandbox={document:{querySelector:s=>elements.get(s.slice(1))??null,querySelectorAll:()=>[],activeElement:null,body:{className:''}},location:{search:`?mode=${mode}&session=${s.id}`,hash:mode==='screen'?'':'#token=test-key-0000000000000000000000000000',pathname:'/',origin:'http://localhost'},history:{replaceState(){}},sessionStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},URLSearchParams,URL,JSON,Date,Math,Number,String,Array,Object,Error,AbortSignal,console,crypto:{randomUUID:()=>`test-${++serial}`},setTimeout:()=>1,clearTimeout(){},setInterval(){},confirm:()=>true,fetch:async path=>({ok:true,json:async()=>path==='/api/catalog'?{editions:catalog,map}:structuredClone(view)})};
 await vm.runInNewContext(`(async()=>{${source}\n})()`,sandbox);return {html:elements.get('main').innerHTML,elements};
}
test('UI : projection vectorielle sans formulaires privés ni objectif secret',async()=>{const {html}=await render('screen',session());assert.equal((html.match(/data-zone="/g)??[]).length,33);assert.match(html,/Test &lt;script&gt;evil&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>evil/);assert.doesNotMatch(html,/id="orders"|Votre objectif secret|RÉGIE PRIVÉE/);});
test('UI : équipe en phase Ordres reçoit deux formulaires et son objectif privé',async()=>{const {html}=await render('team',session());assert.match(html,/id="orders"/);assert.match(html,/ORDRE 01/);assert.match(html,/ORDRE 02/);assert.match(html,/Votre objectif secret/);assert.doesNotMatch(html,/RÉGIE PRIVÉE/);});
test('UI : régie affiche les contrôles et six accès',async()=>{const {html}=await render('organizer',session());assert.match(html,/RÉGIE PRIVÉE/);assert.equal((html.match(/data-access="/g)??[]).length,6);assert.match(html,/data-action="pause"/);});
test('UI : Conseil et Sommet affichent leurs formulaires distincts',async()=>{assert.match((await render('team',session('COUNCIL'))).html,/id="vote"/);assert.match((await render('team',session('SUMMIT'))).html,/id="summit"/);});
test('UI : résultats affichent le vainqueur et révèlent les six objectifs',async()=>{const s=session('RESULTS'),{html}=await render('screen',s);assert.match(html,/VAINQUEUR/);assert.match(html,/Objectifs révélés/);assert.match(html,/Classement final/);});
