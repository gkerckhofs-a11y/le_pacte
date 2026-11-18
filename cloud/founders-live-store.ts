import {advanceNarrativeTime} from '../src/founders-v2.ts';
import {activeFounders} from '../src/founders.ts';
import {randomBytes} from 'node:crypto';
import {tokenHash,shuffle} from '../server/security.ts';
import {createNarrativeSession,duplicateHotspringFinal,applyNarrativeCommand,narrativeView} from '../src/founders-live.ts';
import {Pipelines} from '@google-cloud/firestore';

const check=(ok,m)=>{if(!ok)throw new Error(m);};
const clockDue=s=>s.experienceVersion===2&&s.timing.autoAdvance&&!s.clock.paused&&['INTRO','PRESENTATION','NEGOTIATION','REVEALED'].includes(s.phase)?s.clock.deadline:null;
const familyIds=['A','B','C','D','E','F'];
export class FirestoreNarrativeSessions{
 constructor(db){this.db=db;}
  async listConfigurations(ownerId) {
    const q = await this.db.pipeline().collection("pacteNarrativeConfigurations").where(Pipelines.field("ownerId").equal(ownerId)).sort(Pipelines.descending("updated")).limit(100).execute();
    return q.results.map((d) => ({ id: d.data().id, ...JSON.parse(d.data().dataJson) }));
  }
  async saveConfiguration(ownerId, data2, now) {
    const id = randomBytes(12).toString("hex");
    await this.db.doc("pacteNarrativeConfigurations/" + id).create({ id, ownerId, updated: now, dataJson: JSON.stringify(data2) });
    return { id, ...data2 };
  }
 ref(id){
  check(typeof id==='string'&&/^[a-f0-9]{24}$/.test(id),'Partie introuvable');
  return this.db.doc('pacteNarrativeSessions/'+id);
 }
 accessRef(id,family){
  check(familyIds.includes(family),'Famille inconnue');
  return this.ref(id).collection('access').doc(family);
 }
 async list(ownerId){
  check(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  const q=await this.db.pipeline().collection('pacteNarrativeSessions')
   .where(Pipelines.field('ownerId').equal(ownerId))
   .sort(Pipelines.descending('updated')).limit(100).execute();
  return q.results.filter(d=>!d.data().archivedAt).map(d=>{
   const s=JSON.parse(d.data().stateJson);
   return{id:s.id,code:s.code,title:s.title,phase:s.phase,revision:s.revision,
    scenarioId:s.selection.scenarioId,scenarioVersion:s.selection.scenarioVersion,skinId:s.selection.skinId};
  });
 }
 async create({ownerId,preview,code,title,objectives,names,colors,goalCards,scoreRules,timing,gaugeThresholds,crisisMode,presentationSeconds,now}){
  check(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  const id=randomBytes(12).toString('hex');
  const s=createNarrativeSession(preview,{id,ownerId,code,title,objectives,names,colors,goalCards,scoreRules,timing,gaugeThresholds,crisisMode,presentationSeconds,initiativeOrder:shuffle(activeFounders(preview.game)),now});
  return this.insert(s);
 }
 async duplicate(id,ownerId,now){
  const result=await this.ref(id).get();
  check(result.exists,'Partie introuvable');
  const s=duplicateHotspringFinal(JSON.parse(result.data().stateJson),{id:randomBytes(12).toString('hex'),
   code:'V'+randomBytes(4).toString('hex').toUpperCase(),ownerId,now});
  return this.insert(s);
 }
 async insert(s){
  const {id,code,ownerId,createdAt:now}=s;
  const access=activeFounders(s.game).map(family=>({family,token:randomBytes(32).toString('base64url')}));
  const ref=this.ref(id),codeRef=this.db.doc('pacteNarrativeCodes/'+code);
  await this.db.runTransaction(async tx=>{
   const existing=await tx.get(codeRef);
   check(!existing.exists,'Code de partie déjà utilisé');
   tx.create(codeRef,{sessionId:id,ownerId});
   tx.create(ref,{ownerId,code,created:now,updated:now,revision:0,clockDue:null,stateJson:JSON.stringify(s)});
   for(const item of access){
    const hash=tokenHash(item.token),expires=now+86400000;
    tx.create(this.accessRef(id,item.family),{hash,expires});
    tx.create(ref.collection('keys').doc(hash),{family:item.family,expires});
   }
  });
  return{id,code,access};
 }
 async authenticate(id,token,now){
  check(typeof token==='string'&&/^[a-zA-Z0-9_-]{43}$/.test(token),'Accès famille invalide');
  const hash=tokenHash(token),ref=this.ref(id);
  return this.db.runTransaction(async tx=>{
   const key=await tx.get(ref.collection('keys').doc(hash));
   check(key.exists&&key.data().expires>now,'Accès famille expiré ou révoqué');
   const family=key.data().family;
   check(familyIds.includes(family),'Famille inconnue');
   const access=await tx.get(this.accessRef(id,family));
   check(access.exists&&access.data().hash===hash&&access.data().expires>now,'Accès famille expiré ou révoqué');
   return {role:'team',family,accessHash:hash};
  });
 }
 async verify(tx,s,actor,now){
  if(actor.role==='organizer'){check(actor.id===s.ownerId,'Accès organisateur refusé');return;}
  if(actor.role==='team'){
   check(familyIds.includes(actor.family),'Famille inconnue');
   const access=await tx.get(this.accessRef(s.id,actor.family));
   check(access.exists&&actor.accessHash===access.data().hash&&access.data().expires>now,'Accès famille expiré ou révoqué');
   return;
  }
  check(actor.role==='public','Acteur invalide');
 }
 async view(id,actor,now){
  const ref=this.ref(id);
  return this.db.runTransaction(async tx=>{
   const row=await tx.get(ref);check(row.exists&&!row.data().archivedAt,'Partie introuvable ou archivée');
   const stored=JSON.parse(row.data().stateJson);
   await this.verify(tx,stored,actor,now);
   const s=advanceNarrativeTime(stored,now);
   if(s!==stored)tx.update(ref,{stateJson:JSON.stringify(s),updated:now,revision:s.revision,clockDue:clockDue(s)});
   return {...narrativeView(s,actor),serverNow:now};
  });
 }
 async command(id,actor,command,now){
  const ref=this.ref(id);
  return this.db.runTransaction(async tx=>{
   const row=await tx.get(ref);check(row.exists&&!row.data().archivedAt,'Partie introuvable ou archivée');
   const s=JSON.parse(row.data().stateJson);
   await this.verify(tx,s,actor,now);
   const next=applyNarrativeCommand(s,actor,command,now);
   tx.update(ref,{stateJson:JSON.stringify(next),updated:now,revision:next.revision,clockDue:clockDue(next)});
   return {...narrativeView(next,actor),serverNow:now};
  });
 }
 async advanceDue(now){
  const p=Pipelines;const due=await this.db.pipeline().collection('pacteNarrativeSessions').where(p.and(p.field('clockDue').greaterThanOrEqual(0),p.field('clockDue').lessThanOrEqual(now))).sort(p.ascending('clockDue')).limit(100).execute();
  for(const d of due.results)await this.view(d.id,{role:'public'},now);
 }
 async rotate(id,family,ownerId,now){
  check(familyIds.includes(family),'Famille inconnue');
  const token=randomBytes(32).toString('base64url'),hash=tokenHash(token),ref=this.ref(id);
  await this.db.runTransaction(async tx=>{
   const row=await tx.get(ref);check(row.exists&&!row.data().archivedAt&&row.data().ownerId===ownerId,'Accès organisateur refusé');
   const access=await tx.get(this.accessRef(id,family));check(access.exists,'Famille inconnue');
   const oldHash=access.data().hash;
   tx.delete(ref.collection('keys').doc(oldHash));
   tx.set(this.accessRef(id,family),{hash,expires:now+86400000});
   tx.create(ref.collection('keys').doc(hash),{family,expires:now+86400000});
  });
  return{family,token};
 }
}
