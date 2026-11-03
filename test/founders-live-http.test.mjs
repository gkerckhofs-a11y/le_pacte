import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';

const KEY='test-founders-organizer-00000000000000';
async function fixture(t){
 const store=new GameStore(':memory:'),server=createGameServer(store,KEY);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const req=async(path,{method='GET',body,token}={})=>{
  const r=await fetch(base+path,{method,headers:{
   ...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},
   body:body?JSON.stringify(body):undefined,cache:'no-store'});
  return{status:r.status,body:await r.json()};
 };
 const create=async()=>{
  const body={scenarioId:'fondateurs-hot-spring-demo',scenarioVersion:'1.0.0',skinId:'western',
    members:[5,7,6,9,8,10],code:'FND01',title:'Hot Spring · Test collectif'};
  const r=await req('/api/founders/sessions',{method:'POST',body,token:KEY});
  assert.equal(r.status,201,JSON.stringify(r.body));
  return{...r.body,tokens:Object.fromEntries(r.body.access.map(x=>[x.family,x.token]))};
 };
 const command=async(id,token,kind,data={})=>{
  const view=await req('/api/founders/sessions/'+id,{token});
  assert.equal(view.status,200,JSON.stringify(view.body));
  return req('/api/founders/sessions/'+id+'/commands',{method:'POST',token,body:{kind,data,expectedRevision:view.body.revision}});
 };
 return {store,server,base,req,create,command};
}
test('HTTP narratif : création réservée régie, six clés, projection sans secrets',async t=>{
 const f=await fixture(t);
 const config={scenarioId:'fondateurs-hot-spring-demo',skinId:'western',code:'BAD01',title:'Hors régie'};
 assert.equal((await f.req('/api/founders/sessions',{method:'POST',body:config})).status,403);
 const s=await f.create();
 assert.equal(s.access.length,6);
 const pub=await f.req('/api/founders/sessions/'+s.id);
 assert.equal(pub.status,200);
 assert.equal(pub.body.familyGoals,undefined);
 assert.equal(pub.body.self,undefined);
 assert.equal(pub.body.scenario,undefined);
 const a=await f.req('/api/founders/sessions/'+s.id,{token:s.tokens.A});
 assert.equal(a.status,200);assert.equal(a.body.self.id,'A');
 assert.ok(a.body.self.objective.includes('Objectif de test'));
 assert.equal(a.body.familyGoals,undefined);
 const b=await f.req('/api/founders/sessions/'+s.id,{token:s.tokens.B});
 assert.notEqual(b.body.self.objective,a.body.self.objective);
 const adm=await f.req('/api/founders/sessions/'+s.id,{token:KEY});
 assert.equal(adm.status,200);assert.equal(adm.body.familyGoals.A,a.body.self.objective);
 assert.equal(adm.body.scenario.dilemmas.length,10);
 for(const page of ['founders-city.html','founders-family.html','founders-regie.html','founders-live.css']){
  const response=await fetch(f.base+'/'+page);assert.equal(response.status,200,page);
 }
});
test('HTTP narratif : Conseil multi-équipes, affichage secret avant la révélation et jauges après',async t=>{
 const f=await fixture(t),s=await f.create();
 const base='/api/founders/sessions/'+s.id;
 assert.equal((await f.command(s.id,KEY,'start')).status,200);
 for(const [id,kind,amount] of [['A','pour',1],['B','contre',1],['C','contre',1],['D','contre',1],['E','contre',1],['F','contre',1]]){
  const vote=await f.command(s.id,s.tokens[id],'vote',{kind,amount});
  assert.equal(vote.status,200,JSON.stringify(vote.body));
 }
 const before=await f.req(base);
 assert.equal(before.body.phase,'AWAITING_REVEAL');
 assert.equal(before.body.reveal,null);
 assert.equal(before.body.city.economie,5);
 assert.equal(JSON.stringify(before.body).includes('"outcomes"'),false);
 const result=await f.command(s.id,KEY,'reveal');
 assert.equal(result.status,200);
 const after=await f.req(base);
 assert.equal(after.body.city.economie,4);
 assert.equal(after.body.history[0].nextId,'D03');
 const moved=await f.command(s.id,KEY,'next');
 assert.equal(moved.status,200);
 assert.equal(moved.body.dilemma.id,'D03');
});
test('HTTP narratif : révocation de clé, interdiction du vote inter-famille et commande périmée',async t=>{
 const f=await fixture(t),s=await f.create();
 assert.equal((await f.command(s.id,KEY,'start')).status,200);
 const path='/api/founders/sessions/'+s.id;
 const a=await f.req(path,{token:s.tokens.A});
 const old=a.body.revision;
 const bad=await f.req(path+'/commands',{method:'POST',token:s.tokens.B,
   body:{kind:'vote',data:{kind:'pour',amount:1},expectedRevision:old}});
 assert.equal(bad.status,400);
 const good=await f.req(path+'/commands',{method:'POST',token:s.tokens.A,
   body:{kind:'vote',data:{kind:'pour',amount:1},expectedRevision:old}});
 assert.equal(good.status,200);
 const stale=await f.req(path+'/commands',{method:'POST',token:s.tokens.A,
   body:{kind:'vote',data:{kind:'maintien'},expectedRevision:old}});
 assert.equal(stale.status,400);
 const rotated=await f.req(path+'/access/A',{method:'POST',token:KEY,body:{}});
 assert.equal(rotated.status,200);
 assert.equal((await f.req(path,{token:s.tokens.A})).status,403);
 assert.equal((await f.req(path,{token:rotated.body.token})).status,200);
});
