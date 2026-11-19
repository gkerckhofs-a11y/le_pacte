import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML,DOMParser} from 'linkedom';
import {Resvg} from '@resvg/resvg-js';
import {PNG} from 'pngjs';
import jsQR from 'jsqr';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
import {mountPrintKit} from '../public/founders-print.js';
const decode=svg=>{
 const png=PNG.sync.read(new Resvg(svg,{fitTo:{mode:'width',value:660}}).render().asPng());
 const result=jsQR(new Uint8ClampedArray(png.data),png.width,png.height);assert.ok(result,'QR lisible par le décodeur indépendant');return result.data;
};
for(const [count,version] of [[5,'2.0.0'],[6,'2.0.0'],[5,'1.1.0'],[5,'1.2.0']])test(`Fiches ${count} · ${version} : décodage du SVG imprimé, session, famille, révocation, rechargement et blocage complet`,async t=>{
 let now=1000;const store=new GameStore(':memory:'),key='organizer-qr-verification-1234567890',server=createGameServer(store,key,()=>now);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const origin='http://127.0.0.1:'+server.address().port;
 const request=async(path,data)=>{
  const r=await fetch(origin+path,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+key,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
  const result=await r.json();if(!r.ok){const e=new Error(result.error);e.accessInvalid=r.status===403&&/expiré|révoqué/.test(e.message);throw e;}return result;
 };
 const campaign=version!=='2.0.0',manual=version==='1.2.0';
 const scenarioId=campaign?'les-colons-de-hotspring':'hot-spring-reserve-hybride';
 const created=await request('/api/founders/sessions',{scenarioId,scenarioVersion:version,skinId:'western',code:'QRTEST'+count,title:'Équipes & vérification',members:Array(count).fill(1),names:['Caldwell','Doyle','Mercer','L’eau & les terres','Les Établis','Sixième'].slice(0,count)});
 let view=await request('/api/founders/sessions/'+created.id);
 const storage=new Map();let prints=0,offline=false,wrong=false;
 const mount=()=>{
  const {document}=parseHTML(readFileSync(new URL('../public/founders-regie.html',import.meta.url),'utf8'));
  Object.assign(globalThis,{document,DOMParser,location:{origin},window:{addEventListener(){},print(){prints++;}},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});
  const kit=mountPrintKit({session:created.id,view:()=>view,request:async(path,data)=>{if(offline)throw new Error('Hors ligne');const result=await request(path,data);return wrong&&path.endsWith('access-qr')?{...result,family:'F'}:result;}});
  return {document,kit};
 };
 let {document,kit}=mount();
 kit.sync(view);
 await kit.prepare();assert.equal(document.querySelectorAll('.print-qr svg').length,count);assert.equal(document.getElementById('printReadyQR').disabled,false);
 assert.equal(document.querySelectorAll('.print-card').length,count);
 const tokens=[];
 for(const card of document.querySelectorAll('.print-card[data-family]')){
  const f=card.dataset.family,svg=card.querySelector('svg').outerHTML,link=decode(svg);assert.equal(card.querySelector('a').href,link);
  const url=new URL(link);assert.equal(url.searchParams.get('session'),created.id);assert.equal(url.searchParams.get('family'),f);
  const token=new URLSearchParams(url.hash.slice(1)).get('token');tokens.push(token);
  const terminal=await fetch(origin+'/api/founders/sessions/'+created.id,{headers:{Authorization:'Bearer '+token}}).then(r=>r.json());
  if(campaign){
   assert.equal(terminal.privateCampaign.objectives.length,5);assert.ok(card.textContent.includes(link));
   const reminder=card.querySelector('.print-reminder');
   assert.ok(reminder);
   assert.equal(card.querySelector('.print-qr').closest('.print-hotspring-access').nextElementSibling,reminder);
   if(manual){
    assert.match(reminder.textContent,/En acceptant un accord de vote/);
    assert.match(reminder.textContent,/deux jauges les plus élevées/);
   }
   assert.equal(reminder.querySelector('ol').children.length,5);
   assert.deepEqual([...reminder.querySelectorAll('h4')].map(h=>h.textContent),[
    'Votre but','Un dilemme en 5 étapes','L’Influence','L’abstention','Les dollars','Le Maire','Le Shérif','Rappel express'
   ]);
   assert.match(reminder.textContent,/Vos objectifs sont secrets\. Gardez-les confidentiels/);
   assert.match(reminder.textContent,/Maximum : 18 points/);
   assert.match(reminder.textContent,/deux familles terminent deuxièmes\. Elles gagnent chacune 2 points, et la famille suivante est classée quatrième\./);
   assert.match(reminder.textContent,/Préservez votre fortune/);
  }else{
   assert.equal(card.querySelector('.print-reminder'),null);
  }
  assert.equal(terminal.self.id,f);assert.equal(terminal.code,created.code);assert.ok(card.textContent.includes(terminal.self.name));assert.ok(card.textContent.includes('Gardez cette page ouverte'));
 }
 assert.equal(new Set(tokens).size,count);
 await kit.print();assert.equal(prints,1);
 // Another organizer tab renews an access after preparation: print must fail.
 await request('/api/founders/sessions/'+created.id+'/access/A',{});await kit.print();assert.equal(prints,1);assert.equal(document.getElementById('printReadyQR').disabled,true);
 // Reopening the regie recovers valid cached accesses, replacing the revoked one only.
 ({document,kit}=mount());await kit.prepare();const fresh=JSON.parse([...storage.values()][0]).access;assert.equal(fresh.find(a=>a.family==='B').token,tokens[1]);assert.notEqual(fresh.find(a=>a.family==='A').token,tokens[0]);
 // Identity changes invalidate the entire prepared kit.
 view={...view,families:view.families.map(f=>f.id==='B'?{...f,name:'Nouveau nom'}:f)};kit.sync(view);assert.equal(document.querySelectorAll('.print-card').length,0);assert.equal(document.getElementById('printReadyQR').disabled,true);
 view=await request('/api/founders/sessions/'+created.id);
 offline=true;await kit.prepare();assert.equal(document.querySelectorAll('.print-card').length,0);assert.equal(document.getElementById('printReadyQR').disabled,true);offline=false;
 wrong=true;await kit.prepare();assert.equal(document.querySelectorAll('.print-card').length,0);wrong=false;
 // Full expiry replaces every old link, with no silent partial kit.
 now+=86400001;await kit.prepare();assert.equal(document.querySelectorAll('.print-qr svg').length,count);await kit.print();assert.equal(prints,2);
 for(const token of tokens){const r=await fetch(origin+'/api/founders/sessions/'+created.id,{headers:{Authorization:'Bearer '+token}});assert.equal(r.status,403);}
 const css=readFileSync(new URL('../public/founders-live.css',import.meta.url),'utf8');assert.match(css,/@page\{size:A4 portrait/);assert.match(css,/body.printing-kit>\*:not\(#printSheets\)\{display:none!important/);assert.match(css,/break-after:page/);
});
