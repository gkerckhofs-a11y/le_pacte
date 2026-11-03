import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
const KEY='pacte-v27-operator-0000000000000000000000';
const calibration={initialPower:12,initialDollars:18,initialPool:5,
 city:{economie:6,securite:6,satisfaction:5,bien_etre:4,developpement:4,stabilite:5}};
test('API régie V2.7 : calibrage, simulation de politiques et confidentialité',async t=>{
 const store=new GameStore(':memory:'),server=createGameServer(store,KEY);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const url='http://127.0.0.1:'+server.address().port;
 const call=async(path,body,token=KEY)=>{
  const r=await fetch(url+path,{method:'POST',
   headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},
   body:JSON.stringify(body)});
  return {status:r.status,data:await r.json()};
 };
 const catalog=await fetch(url+'/api/founders/catalog',{headers:{Authorization:'Bearer '+KEY}});
 const list=await catalog.json();
 assert.equal(list.calibrationPreset.initialPower,8);
 assert.equal(list.calibrationPreset.city.stabilite,5);
 const selection={scenarioId:'fondateurs-hot-spring-demo',skinId:'western',calibration};
 const p=await call('/api/founders/preview',selection);
 assert.equal(p.status,200,JSON.stringify(p.data));
 assert.equal(p.data.game.powerSupply,77);
 assert.equal(p.data.game.families.B.dollars,18);
 assert.equal(p.data.game.city.developpement,4);
 const reachability=await call('/api/founders/scoring/analyze',selection);
 assert.equal(reachability.status,200);
 assert.equal(reachability.data.endings,256);
 assert.equal(reachability.data.initialCity.economie,6);
 const simulated=await call('/api/founders/scoring/simulate',{
  ...selection,runs:12,seed:717,mode:'mixte'
 });
 assert.equal(simulated.status,200,JSON.stringify(simulated.data));
 assert.equal(simulated.data.completed,12,JSON.stringify(simulated.data.failures));
 assert.equal(Object.values(simulated.data.families).reduce((n,f)=>n+f.wins,0),12);
 assert.equal(simulated.data.meanCouncils,8);
 assert.equal(JSON.stringify(simulated.data).includes('https://docs.google.com/spreadsheets'),false);
 assert.equal((await call('/api/founders/scoring/simulate',{...selection,runs:12},null)).status,403);
 const bad=await call('/api/founders/scoring/simulate',{...selection,runs:121});
 assert.equal(bad.status,400);
 const created=await call('/api/founders/sessions',{
  ...selection,code:'CAL27',title:'Partie calibrée',members:[5,7,6,8,9,4]
 });
 assert.equal(created.status,201,JSON.stringify(created.data));
 const id=created.data.id,token=created.data.access.find(x=>x.family==='C').token;
 const familyResponse=await fetch(url+'/api/founders/sessions/'+id,{headers:{Authorization:'Bearer '+token}});
 const family=await familyResponse.json();
 assert.equal(family.self.power,12);
 assert.equal(family.self.dollars,18);
 assert.equal(family.city.economie,6);
 assert.equal(family.familyResources,undefined);
 const publicResponse=await fetch(url+'/api/founders/sessions/'+id);
 const pub=await publicResponse.json();
 assert.equal(pub.self,undefined);
 assert.equal(pub.familyGoals,undefined);
 assert.equal(pub.city.developpement,4);
});
