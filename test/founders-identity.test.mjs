import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foundersPreview} from '../server/founders-catalog.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativePublicView,narrativeFamilyView} from '../src/founders-live.ts';
import {cityVisualState} from '../public/founders-city-scene.js';
import {TEAM_COLORS,DEFAULT_TEAM_COLORS} from '../public/founders-identity.js';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
const mk=(options={})=>createNarrativeSession(foundersPreview({scenarioId:'fondateurs-hot-spring-demo',skinId:'western'}),{
 id:'123456789012123456789012',ownerId:'local-organizer',code:'COLORS',title:'Identités',now:100,...options
});
const act=(s,actor,kind,data)=>applyNarrativeCommand(s,actor,{kind,data,expectedRevision:s.revision},101+s.revision);
const org={role:'organizer',id:'local-organizer'},team=family=>({role:'team',family});
test('Palette : une permutation est conservée et les couleurs identiques ou libres sont refusées',()=>{
 const colors=[...DEFAULT_TEAM_COLORS].reverse(),s=mk({colors});
 colors[0]='invalide';
 assert.equal(narrativeFamilyView(s,'A').self.color.id,'orange');
 assert.equal(narrativePublicView(s).families[0].color.symbol,'■');
 assert.throws(()=>mk({colors:Array(6).fill('bleu')}),/distinctes/);
 assert.throws(()=>mk({colors:['#123456',...DEFAULT_TEAM_COLORS.slice(1)]}),/palette/);
 assert.throws(()=>mk({colors:null}),/couleurs/);
});
test('Le porte-parole nomme sa seule famille en préparation ; identité figée et secrets préservés',()=>{
 let s=mk();
 s=act(s,team('A'),'setIdentity',{name:'Famille Blackwood',color:'bleu'});
 assert.equal(narrativePublicView(s).families[0].name,'Famille Blackwood');
 assert.equal(narrativeFamilyView(s,'B').self.name,'Nom à choisir');
 assert.equal(narrativePublicView(s).goalCards,undefined);
 assert.throws(()=>act(s,team('A'),'setIdentity',{family:'B',name:'Usurpation',color:'rouge'}),/Votre famille/);
 assert.throws(()=>act(s,team('A'),'setIdentity',{name:'Autre couleur',color:'rouge'}),/déjà/);
 assert.throws(()=>act(s,team('A'),'setIdentity',{name:' ',color:'bleu'}),/Nom de famille/);
 s=act(JSON.parse(JSON.stringify(s)),org,'start',{});
 assert.equal(s.names.A,'Famille Blackwood');
 assert.throws(()=>act(s,team('A'),'setIdentity',{name:'Trop tard',color:'bleu'}),/figée/);
 const legacy=mk();delete legacy.colors;
 assert.deepEqual(narrativePublicView(legacy).families.map(f=>f.color.id),DEFAULT_TEAM_COLORS);
});
test('Ville : six dimensions indépendantes, limites 3/4 et 6/7, autonomie sans destruction',()=>{
 const city=Object.fromEntries(['economie','securite','satisfaction','bien_etre','developpement','stabilite'].map(k=>[k,5]));
 for(const [value,level] of [[0,0],[3,0],[4,1],[6,1],[7,2],[10,2]]){
  const states=cityVisualState({...city,bien_etre:value});
  assert.equal(states.bien_etre.level,level);
  assert.equal(states.economie.level,1);assert.equal(states.stabilite.level,1);
 }
 assert.match(cityVisualState({...city,stabilite:2}).stabilite.description,/autonomes/);
 assert.throws(()=>cityVisualState({...city,securite:11}),/invalide/);
});
test('HTTP : couleurs persistées et choix de nom autorisé uniquement avec la clé de sa famille',async t=>{
 const store=new GameStore(':memory:'),key='local-identity-test-organizer-key',server=createGameServer(store,key);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const request=async(path,token,body)=>{
  const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  return {status:r.status,body:await r.json()};
 };
 const colors=[...DEFAULT_TEAM_COLORS].reverse();
 const created=await request('/api/founders/sessions',key,{scenarioId:'fondateurs-hot-spring-demo',skinId:'western',code:'IDENTITY',title:'Test',colors});
 assert.equal(created.status,201,JSON.stringify(created.body));
 const path='/api/founders/sessions/'+created.body.id;
 const token=created.body.access.find(a=>a.family==='A').token;
 const command={kind:'setIdentity',expectedRevision:0,data:{name:'Famille Stone',color:'orange'}};
 assert.equal((await request(path+'/commands',null,command)).status,403);
 const renamed=await request(path+'/commands',token,command);
 assert.equal(renamed.status,200,JSON.stringify(renamed.body));
 assert.equal(renamed.body.self.name,'Famille Stone');
 const pub=await request(path);
 assert.equal(pub.body.families[0].name,'Famille Stone');
 assert.equal(pub.body.families[0].color.id,'orange');assert.equal(pub.body.self,undefined);
 assert.equal((await request(path+'/commands',token,command)).status,400);
 for(const asset of ['founders-identity.js','founders-city-scene.js'])assert.equal((await fetch(base+'/'+asset)).status,200);
});
