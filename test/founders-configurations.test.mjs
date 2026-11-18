import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
import {DEFAULT_GOAL_CARDS,DEFAULT_SCORE_RULES} from '../src/founders-scoring.ts';
import {DEFAULT_TEAM_COLORS,DEFAULT_TEAM_NAMES} from '../public/founders-identity.js';
import {checkedConfiguration} from '../server/founders-configurations.ts';
import {foundersPreview} from '../server/founders-catalog.ts';
const make=n=>({scenarioId:'hot-spring-reserve-hybride',scenarioVersion:'1.3.0',skinId:'western',members:Array(n).fill(1),names:DEFAULT_TEAM_COLORS.slice(0,n).map(c=>DEFAULT_TEAM_NAMES[c]),colors:DEFAULT_TEAM_COLORS.slice(0,n),goalCards:DEFAULT_GOAL_CARDS,scoreRules:DEFAULT_SCORE_RULES});
for(const count of [5,6])test(`HTTP ${count} familles : modèle enregistré, rechargé et rejoué, QR privés révocables`,async t=>{
 const store=new GameStore(':memory:'),key='organizer-test-configurations-key-12345',server=createGameServer(store,key,()=>1000,{publicOrigin:'https://le-pacte-ludificateur.web.app'});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const origin='http://127.0.0.1:'+server.address().port;
 const req=async(path,token,data)=>{const response=await fetch(origin+path,{method:data?'POST':'GET',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});return {status:response.status,data:await response.json()};};
 assert.equal((await req('/api/founders/configurations')).status,403);
 const saved=await req('/api/founders/configurations',key,{name:'Test '+count,config:make(count)});
 assert.equal(saved.status,201,JSON.stringify(saved.data));
 assert.equal(saved.data.config.members.length,count);assert.equal(saved.data.config.names.length,count);assert.equal(saved.data.config.objectives.length,count);
 assert.deepEqual(store.narrative.listConfigurations('other'),[]);
 const loaded=(await req('/api/founders/configurations',key)).data.configurations[0];
 const created=await req('/api/founders/sessions',key,{...loaded.config,code:'REPLAY'+count,title:loaded.name});
 assert.equal(created.status,201,JSON.stringify(created.data));assert.equal(created.data.access.length,count);
 for(const access of created.data.access){
  const payload={session:created.data.id,token:access.token,origin:'https://evil.example'};
  assert.equal((await req('/api/founders/access-qr',access.token,payload)).status,403);
  const qr=await req('/api/founders/access-qr',key,payload);
  assert.equal(qr.status,200,JSON.stringify(qr.data));assert.equal(qr.data.family,access.family);
  assert.equal(qr.data.link,`https://le-pacte-ludificateur.web.app/founders-family.html?session=${created.data.id}&family=${access.family}#token=${access.token}`);
  assert.match(qr.data.svg,/^<svg/);
 }
 const old=created.data.access[0];
 await req('/api/founders/sessions/'+created.data.id+'/access/'+old.family,key,{});
 assert.equal((await req('/api/founders/access-qr',key,{session:created.data.id,token:old.token})).status,403);
 for(const file of ['founders-workspace.js','founders-print.js','founders-vote-progress.js','pacte-entry.js','territorial.html'])assert.equal((await fetch(origin+'/'+file)).status,200,file);
});
test('Modèles : secrets et champs inconnus ne sont pas sauvegardés',()=>{
 const config=make(5),preview=foundersPreview(config);
 const checked=checkedConfiguration(preview,{name:'Test',config:{...config,token:'CREDENTIAL_SENTINEL_9182',access:[{token:'CREDENTIAL_SENTINEL_9182'}]}},'host',1000);
 assert.equal(JSON.stringify(checked).includes('CREDENTIAL_SENTINEL_9182'),false);
 assert.equal(checked.config.names.length,5);
});
