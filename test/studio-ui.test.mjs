// Content-view smoke tests, not a browser renderer.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openStudio} from '../public/studio.js';
import {catalog,map,GameStore} from '../server/store.ts';
import {BUILTIN_ASSETS,GOAL_RULES} from '../src/studio.ts';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function fixture(t){
 const store=new GameStore(':memory:');t.after(()=>store.close());const els=new Map();
 function el(id){if(els.has(id))return els.get(id);const e={id,_html:'',checked:false,value:'',addEventListener(){},set innerHTML(v){this._html=v;if(id==='main')for(const m of v.matchAll(/id="([^"]+)"([^>]*)/g)){const child=el(m[1]);child.checked=/checked/.test(m[2]);}},get innerHTML(){return this._html;},querySelector:q=>els.get(q.slice(1)),querySelectorAll:()=>[]};els.set(id,e);return e;}
 const root=el('main');globalThis.document={querySelector:()=>root};globalThis.window={addEventListener(){}};
 t.after(()=>{delete globalThis.document;delete globalThis.window;});
 const request=async(path,options={})=>{if(path==='/api/studio')return{...store.studio.list(),builtinAssets:BUILTIN_ASSETS,goalRules:GOAL_RULES};if(path==='/api/studio/drafts')return store.studio.create(options.data,catalog,1000);throw new Error('Unexpected request '+path);};
 await openStudio({request,esc,field:(name,html)=>`<label>${esc(name)}${html}</label>`,opts:(a)=>a.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join(''),status(){},notify(){},catalog,map,powers:{},effects:{},previewMap:()=>'<svg></svg>'});return{root,els,store};
}
test('UI Studio : catalogue propose cinq duplications et un import JSON',async t=>{const f=await fixture(t);assert.equal((f.root.innerHTML.match(/data-theme="/g)??[]).length,5);assert.match(f.root.innerHTML,/id="studio-import"/);assert.match(f.root.innerHTML,/aucun|Dupliquez/i);});
test('UI Studio : éditeur des 33 territoires, six factions et prévisualisation sans session',async t=>{const f=await fixture(t);await f.root.onclick({target:{closest:()=>({dataset:{theme:'western'},type:'submit',form:null})}});assert.equal((f.root.innerHTML.match(/data-path="territoryLabels\./g)??[]).length,33);assert.equal((f.root.innerHTML.match(/data-path="factionLabels\./g)??[]).length,6);assert.equal((f.root.innerHTML.match(/data-path="councils\.\d\.optionAText/g)??[]).length,5);assert.match(f.root.innerHTML,/Publier une version figée/);assert.ok(f.els.get('studio-preview-content').innerHTML.includes('<svg>'));assert.equal(f.store.list().length,0);});
