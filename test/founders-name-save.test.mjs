import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveFamilyName} from '../public/founders-name-save.js';
const snapshot={phase:'READY',revision:2,self:{id:'A',name:'Nom à choisir',color:{id:'bleu'}}};
test('Une autre équipe enregistre : le nom est renvoyé une seule fois avec la nouvelle révision',async()=>{
 const calls=[];
 const result=await saveFamilyName(snapshot,'Famille du Canyon',async(method,body)=>{
  calls.push({method,body});
  if(calls.length===1)throw new Error('Révision périmée : actualiser la partie');
  if(method==='GET')return {...snapshot,revision:3};
  return {...snapshot,revision:4,self:{...snapshot.self,name:body.data.name}};
 });
 assert.equal(result.self.name,'Famille du Canyon');assert.equal(calls.length,3);
 assert.equal(calls[2].body.expectedRevision,3);assert.deepEqual(calls[2].body.data,{name:'Famille du Canyon',color:'bleu'});
});
test('Un autre écran de la même équipe a changé le nom : aucune écriture automatique',async()=>{
 let writes=0;
 await assert.rejects(saveFamilyName(snapshot,'Mon nom',async(method)=>{
  if(method==='POST'){writes++;throw new Error('Révision périmée');}
  return {...snapshot,revision:3,self:{...snapshot.self,name:'Autre nom'}};
 }),/autre écran/);assert.equal(writes,1);
});
test('Refus, démarrage et nouvelle concurrence ne sont pas réessayés en boucle',async()=>{
 let n=0;await assert.rejects(saveFamilyName(snapshot,'Mon nom',async()=>{n++;throw new Error('Accès expiré');}),/expiré/);assert.equal(n,1);
 await assert.rejects(saveFamilyName(snapshot,'Mon nom',async method=>{if(method==='POST')throw new Error('Révision périmée');return {...snapshot,phase:'COUNCIL'};}),/démarré/);
 let writes=0;await assert.rejects(saveFamilyName(snapshot,'Mon nom',async method=>{if(method==='POST'){writes++;throw new Error('Révision périmée');}return {...snapshot,revision:3};}),/périmée/);assert.equal(writes,2);
});
