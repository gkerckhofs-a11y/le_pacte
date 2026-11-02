import {randomBytes} from 'node:crypto';
import {Pipelines} from '@google-cloud/firestore';
import {ARCHETYPES} from '../src/map.ts';
import type {TeamId} from '../src/map.ts';
import {createSession,applyCommand,sessionView} from '../src/session.ts';
import type {Session,Actor,Command} from '../src/session.ts';
import {validateOrders} from '../src/engine.ts';
import {catalog} from '../server/catalog.ts';
import {shuffle,tokenHash} from '../server/security.ts';
import {FirestoreStudio} from './studio.ts';
import {check,data,owned,rows,jsonData} from './data.ts';
export class FirestoreStore {
 db:any;studio:FirestoreStudio;
 constructor(db:any){this.db=db;this.studio=new FirestoreStudio(db);}
 ref(id:string){check(/^[a-f0-9]{24}$/.test(id),'Session introuvable');return this.db.doc(`pacteSessions/${id}`);}
 accessRef(id:string,team:TeamId){check(ARCHETYPES.includes(team),'Équipe inconnue');return this.ref(id).collection('access').doc(team);}
 parse(r:any):Session{return JSON.parse(r.json);}
 async assertOwner(id:string,ownerId:string){owned(data(await this.ref(id).get()),ownerId);}
 async list(ownerId:string){check(ownerId,'Accès régie requis');return(await rows(this.db,'pacteSessions',ownerId)).map((r:any)=>({id:r.id,code:r.code,title:r.title,phase:r.phase,round:r.round,theme:r.theme}));}
 writeState(tx:any,ref:any,s:Session,meta:any,now:number){
  const clean={...s,receipts:{},audit:[]};tx.set(ref,{...meta,json:jsonData(clean),phase:s.phase,round:s.game.round,deadline:s.deadline,updated:now});
  tx.set(this.db.doc(`pactePublic/${s.id}`),{json:jsonData({...sessionView(s,{role:'public'}),code:meta.code,title:meta.title})});
  for(const team of ARCHETYPES)tx.set(ref.collection('views').doc(team),{json:jsonData({...sessionView(s,{role:'team',team}),code:meta.code,title:meta.title,teamId:team})});
 }
 async create(code:string,title:string,themeId:string,now:number,releaseId?:string,ownerId?:string){
  check(ownerId,'Accès régie requis');check(typeof code==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,11}$/.test(code),'Code invalide');check(typeof title==='string'&&title.trim()&&title.length<=100,'Titre requis');
  const id=randomBytes(12).toString('hex'),access=ARCHETYPES.map(team=>({team,token:randomBytes(32).toString('base64url')}));
  await this.db.runTransaction(async(tx:any)=>{
   const codeRef=this.db.doc(`pacteCodes/${code}`);check(!(await tx.get(codeRef)).exists,'Code déjà utilisé');let edition:any=catalog.find(e=>e.themeId===themeId),release:any;
   if(releaseId){release=owned(data(await tx.get(this.studio.releaseRef(releaseId))),ownerId!);edition=JSON.parse(release.json);}check(edition,'Univers inconnu');
   const s=createSession(id,ownerId!,edition,shuffle(['O1','O2','O3','O4','O5','O6']),shuffle([1,2,3,4,5,6]));
   if(release)(s as any).editionSource={releaseId,checksum:release.checksum};const ref=this.ref(id),meta={ownerId,code,title:title.trim(),theme:edition.themeId,created:now};
   tx.create(codeRef,{sessionId:id,ownerId});this.writeState(tx,ref,s,meta,now);
   for(const a of access){const hash=tokenHash(a.token),r={team:a.team,hash,expires:now+86400000,last_seen:null};tx.create(this.accessRef(id,a.team),r);tx.create(ref.collection('keys').doc(hash),{team:a.team,expires:r.expires});}
  });return{id,access};
 }
 async rotate(id:string,team:TeamId,now:number,ownerId?:string){
  const token=randomBytes(32).toString('base64url'),hash=tokenHash(token),ref=this.ref(id),accessRef=this.accessRef(id,team);
  await this.db.runTransaction(async(tx:any)=>{owned(data(await tx.get(ref)),ownerId!);const old=data(await tx.get(accessRef));tx.delete(ref.collection('keys').doc(old.hash));tx.set(accessRef,{team,hash,expires:now+86400000,last_seen:null});tx.create(ref.collection('keys').doc(hash),{team,expires:now+86400000});});return token;
 }
 async authenticateTeam(id:string,token:string,now:number,markSeen=true):Promise<Actor>{
  check(/^[A-Za-z0-9_-]{43}$/.test(token),'Accès invalide');const ref=this.ref(id),hash=tokenHash(token);
  return this.db.runTransaction(async(tx:any)=>{const snap=await tx.get(ref.collection('keys').doc(hash));check(snap.exists,'Accès invalide, expiré ou révoqué');const r=snap.data();check(r.expires>now&&ARCHETYPES.includes(r.team),'Accès invalide, expiré ou révoqué');const accessRef=this.accessRef(id,r.team),access=data(await tx.get(accessRef));check(access.hash===hash&&access.expires>now,'Accès invalide, expiré ou révoqué');if(markSeen&&now-(access.last_seen??0)>=5000)tx.update(accessRef,{last_seen:now});return{role:'team',team:r.team,accessHash:hash};});
 }
 async checkActor(tx:any,id:string,row:any,actor:Actor,now:number){
  if(actor.role==='organizer'){owned(row,actor.id);return;}
  const access=data(await tx.get(this.accessRef(id,actor.team)));check(actor.accessHash&&access.hash===actor.accessHash&&access.expires>now,'Accès invalide, expiré ou révoqué');
 }
 async get(id:string,ownerId?:string){const row=owned(data(await this.ref(id).get()),ownerId!);const s=this.parse(row);s.audit=(await rows(this.db,`pacteSessions/${id}/events`,undefined,'revision',5000)).reverse().map((r:any)=>r.event);return s;}
 async command(id:string,actor:Actor,c:Command,now:number){
  check(c&&typeof c.id==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(c.id),'Commande invalide');const ref=this.ref(id),receiptRef=ref.collection('receipts').doc(tokenHash(c.id));
  await this.db.runTransaction(async(tx:any)=>{
   const row=data(await tx.get(ref));await this.checkActor(tx,id,row,actor,now);const prior=await tx.get(receiptRef),s=this.parse(row);if(prior.exists)Object.defineProperty(s.receipts,c.id,{value:prior.data().receipt,enumerable:true});
   if(!prior.exists&&c.kind==='proposeTrade')check(Object.keys(s.offers).length<60,'Trop d’offres ouvertes');
   const next=applyCommand(s,actor,c,now);if(next.revision===s.revision)return;
   this.writeState(tx,ref,next,row,now);tx.create(receiptRef,{receipt:next.receipts[c.id]});const event=next.audit.at(-1);tx.create(ref.collection('events').doc(String(next.revision).padStart(12,'0')),{revision:next.revision,event});
  });return this.view(id,actor,now);
 }
 async validate(id:string,actor:Actor,orders:any,now:number){return this.db.runTransaction(async(tx:any)=>{const row=data(await tx.get(this.ref(id)));await this.checkActor(tx,id,row,actor,now);const s=this.parse(row);check(actor.role==='team'&&s.phase==='ORDERS'&&s.pausedRemaining===null&&s.deadline!==null&&now<s.deadline,'Ordres fermés');check(!s.game.orders[(actor as any).team],'Ordres déjà verrouillés');return{cost:validateOrders(s.game,(actor as any).team,orders)};});}
 async advanceSession(id:string,now:number){const ref=this.ref(id);await this.db.runTransaction(async(tx:any)=>{const row=data(await tx.get(ref));let s=this.parse(row),count=0;const revision=s.revision;
  while(s.deadline!==null&&s.pausedRemaining===null&&s.deadline<=now&&count++<40){const at=s.deadline;s=applyCommand(s,{role:'organizer',id:s.organizerId},{id:`timer-${s.game.round}-${s.phase}`,sessionId:id,expectedPhase:s.phase,expectedRound:s.game.round,kind:'advance',data:{}},at);const event=s.audit.at(-1);tx.create(ref.collection('events').doc(String(s.revision).padStart(12,'0')),{revision:s.revision,event});}
  if(s.revision!==revision)this.writeState(tx,ref,s,row,now);
 });}
 async view(id:string,actor:Actor|{role:'public'},now:number){
  await this.advanceSession(id,now);
  if(actor.role==='public'){return{...JSON.parse(data(await this.db.doc(`pactePublic/${id}`).get()).json),serverNow:now};}
  return this.db.runTransaction(async(tx:any)=>{const ref=this.ref(id),row=data(await tx.get(ref));await this.checkActor(tx,id,row,actor,now);
   if(actor.role==='team')return{...JSON.parse(data(await tx.get(ref.collection('views').doc(actor.team))).json),serverNow:now};
   const connections=[];for(const team of ARCHETYPES){const a=data(await tx.get(this.accessRef(id,team)));connections.push({team,last_seen:a.last_seen,expires:a.expires});}
   return{...sessionView(this.parse(row),actor),code:row.code,title:row.title,connections,serverNow:now};
  });
 }
 async advanceDue(now:number){
  const p=Pipelines;const due=await this.db.pipeline().collection('pacteSessions').where(p.and(p.field('deadline').greaterThanOrEqual(0),p.field('deadline').lessThanOrEqual(now))).sort(p.ascending('deadline')).limit(100).execute();for(const d of due.results)await this.advanceSession(d.id,now);
 }
}
