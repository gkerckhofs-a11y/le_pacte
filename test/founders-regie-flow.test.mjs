import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startCouncil,councilGuidance,organizerError,validNarrativeSession} from '../public/founders-regie-flow.js';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
const ready={phase:'READY',revision:3,families:[],council:{}};
test('Lancer : utilise la révision relue, puis ne relance pas un Conseil déjà ouvert',async()=>{
 const calls=[];
 const result=await startCouncil(async(path,method,body)=>{calls.push({path,method,body});return path?{...ready,phase:'COUNCIL',revision:4}:ready;});
 assert.equal(result.started,true);assert.equal(calls[1].body.expectedRevision,3);
 let n=0;const again=await startCouncil(async()=>{n++;return {...ready,phase:'COUNCIL'};});
 assert.equal(again.started,false);assert.equal(n,1);
});
test('Changement de nom simultané : une seule nouvelle tentative ; démarrage concurrent respecté',async()=>{
 let reads=0,writes=0;
 const result=await startCouncil(async(path,method,body)=>{
  if(!path)return {...ready,revision:3+reads++};
  writes++;if(writes===1)throw new Error('Révision périmée : actualiser la partie');
  assert.equal(body.expectedRevision,4);return {...ready,phase:'COUNCIL',revision:5};
 });
 assert.equal(result.started,true);assert.equal(writes,2);
 reads=0;writes=0;
 const concurrent=await startCouncil(async path=>{if(!path)return {...ready,phase:reads++?'COUNCIL':'READY'};writes++;throw new Error('Révision périmée');});
 assert.equal(concurrent.started,false);assert.equal(writes,1);
});
test('Aucune répétition sur refus ou erreur réseau, ni boucle de conflits',async()=>{
 for(const message of ['Accès régie refusé','Failed to fetch']){
  let writes=0;await assert.rejects(startCouncil(async path=>{if(!path)return ready;writes++;throw new Error(message);}),new RegExp(message));assert.equal(writes,1);
 }
 let writes=0;await assert.rejects(startCouncil(async path=>{if(!path)return ready;writes++;throw new Error('Révision périmée');}),/périmée/);assert.equal(writes,2);
});
test('La consigne suit la phase : lancer, attendre les équipes, révéler, poursuivre et terminer',()=>{
 assert.equal(councilGuidance(ready).step,2);assert.match(councilGuidance(ready).hint,/Lancer la partie/);
 assert.match(councilGuidance({...ready,phase:'COUNCIL',families:[{id:'A',name:'Famille Canyon'}],council:{turn:'A'}}).hint,/Famille Canyon/);
 assert.match(councilGuidance({...ready,phase:'COUNCIL',council:{phase:'await_moderator'}}).hint,/Shérif/);
 assert.match(councilGuidance({...ready,phase:'AWAITING_REVEAL'}).hint,/Révéler la décision/);
 assert.match(councilGuidance({...ready,phase:'REVEALED',reveal:{nextId:'D02'}}).hint,/Dilemme suivant/);
 assert.match(councilGuidance({...ready,phase:'REVEALED',reveal:{nextId:null}}).hint,/Terminer la partie/);
 assert.match(councilGuidance({...ready,phase:'FINISHED'}).hint,/classement final/);
});
test('Connexion : lien validé et erreurs Google expliquées',()=>{
 assert.equal(validNarrativeSession(null),false);assert.equal(validNarrativeSession('123456789012123456789012'),true);
 assert.match(organizerError({code:'auth/popup-blocked'}),/fenêtre Google a été bloquée/);
 assert.match(organizerError({message:'Accès régie refusé'}),/compte organisateur qui a créé/);
});
test('HTTP : lancer malgré un nom enregistré simultanément ouvre D01 et donne la main au Maire',async t=>{
 const store=new GameStore(':memory:'),key='regie-flow-test-organizer-key-000000000',server=createGameServer(store,key);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const origin='http://127.0.0.1:'+server.address().port;
 const request=async(path,token,body)=>{
  const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const data=await r.json();if(!r.ok)throw new Error(data.error);return data;
 };
 const created=await request('/api/founders/sessions',key,{scenarioId:'fondateurs-hot-spring-demo',skinId:'western',code:'LAUNCH01',title:'Régie test'});
 const path='/api/founders/sessions/'+created.id,team=created.access.find(a=>a.family==='B');let conflict=true;
 const api=async(suffix,method,body)=>{
  if(suffix==='/commands'&&conflict){conflict=false;await request(path+'/commands',team.token,{kind:'setIdentity',expectedRevision:body.expectedRevision,data:{name:'Famille du Plateau',color:'rouge'}});}
  return request(path+suffix,key,body);
 };
 const launched=await startCouncil(api);assert.equal(launched.started,true);assert.equal(launched.view.phase,'COUNCIL');assert.equal(launched.view.revision,2);
 const pub=await request(path);assert.equal(pub.dilemma.id,'D01');assert.equal(pub.council.turn,pub.leader);
 const mayor=created.access.find(a=>a.family===pub.leader);assert.equal((await request(path,mayor.token)).self.mayVote,true);
 assert.equal((await startCouncil(api)).started,false);
 assert.equal((await fetch(origin+'/founders-regie-flow.js')).status,200);
});

test('Régie hybride : une branche FIN ne termine pas la partie avant la finale admissible',()=>{
 const base={phase:'REVEALED',reveal:{nextId:null},progression:{terminal:false,blocked:null,candidates:[{id:'D04'}]}};
 assert.match(councilGuidance(base).hint,/chapitre admissible/);
 assert.match(councilGuidance({...base,progression:{terminal:true}}).hint,/Terminer la partie/);
 assert.match(councilGuidance({...base,progression:{blocked:'Aucun dilemme admissible'}}).hint,/Aucun dilemme/);
});
