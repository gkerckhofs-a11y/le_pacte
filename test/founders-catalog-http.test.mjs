import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../server/http.ts';
const KEY='v23_test_organizer_012345678901234567890123456789';
const setup=async()=>{
 const server=createGameServer({},KEY);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin='http://127.0.0.1:'+server.address().port;
 return {server,origin};
};
test('API V2.3 : endpoints protégés, aperçu non persistant et page de régie',async t=>{
 const {server,origin}=await setup();t.after(()=>new Promise(r=>server.close(r)));
 const html=await fetch(origin+'/founders-setup.html');
 assert.equal(html.status,200);
 assert.match(await html.text(),/Les Colons de Hotspring · Nouvelle partie/);
 const js=await fetch(origin+'/founders-setup.js');
 assert.equal(js.status,200);
 const anonymous=await fetch(origin+'/api/founders/catalog');
 assert.equal(anonymous.status,403);
 const auth={Authorization:'Bearer '+KEY};
 const catalog=await fetch(origin+'/api/founders/catalog',{headers:auth});
 assert.equal(catalog.status,200);
 const items=await catalog.json();
 assert.equal(items.scenarios.length,3);assert.equal(items.skins.length,5);
 assert.ok(items.scenarios.some(s=>s.id==='hot-spring-reserve-hybride'));
 const body=JSON.stringify({scenarioId:items.scenarios[0].id,skinId:'western',members:[5,5,5,5,5,9]});
 const preview=await fetch(origin+'/api/founders/preview',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body});
 assert.equal(preview.status,200);
 const result=await preview.json();
 assert.equal(result.previewOnly,true);assert.equal(result.settings.members[5],9);
 const rejected=await fetch(origin+'/api/founders/preview',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({scenarioId:'unknown',skinId:'western'})});
 assert.equal(rejected.status,400);
});

test('Les routes Hotspring et les brouillons privés utilisent le nouvel espace',async t=>{
 const {GameStore}=await import('../server/store.ts');
 const store=new GameStore(':memory:');
 const first='test.organizer.'+'A'.repeat(24),second='test.organizer.'+'B'.repeat(24);
 const accounts=new Map([[first,{uid:'organizer-a',organizer:true}],[second,{uid:'organizer-b',organizer:true}]]);
 const server=createGameServer(store,KEY,()=>Date.now(),{verifyOperator:async token=>accounts.get(token)??null});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));store.close();});
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [path,text] of [['/','Cosa Nostra'],['/hotspring','Atelier de dilemmes'],['/hotspring/nouvelle-partie','Les cinq familles'],['/hotspring/atelier','Conséquences du POUR']]){
  const r=await fetch(origin+path);assert.equal(r.status,200);assert.ok((await r.text()).includes(text),path);
 }
 const base='/api/founders/hotspring/drafts';
 const request=(path,method='GET',token=first,data)=>fetch(origin+path,{method,headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
 const create=await request(base,'POST',first,{title:'Un pont sur la rivière',question:'Construire le pont ?',pour:'Le chantier commence.'});
 assert.equal(create.status,201);
 const {id}=await create.json();
 assert.equal((await request(base+'/'+id,'PUT',second,{title:'Autre compte'})).status,404);
 assert.deepEqual(await (await request(base,'GET',second)).json(),{drafts:[]});
 const edited=await request(base+'/'+id,'PUT',first,{title:'Le pont de Hotspring',contre:'Le bac continue.'});
 assert.equal(edited.status,200);
 assert.equal((await (await request(base)).json()).drafts[0].title,'Le pont de Hotspring');
});
