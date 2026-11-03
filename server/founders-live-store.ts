import {randomBytes} from 'node:crypto';
import {tokenHash,shuffle} from './security.ts';
import {createNarrativeSession,applyNarrativeCommand,narrativeView} from '../src/founders-live.ts';

const check=(condition,message)=>{if(!condition)throw new Error(message);};
const familyIds=['A','B','C','D','E','F'];
export class LocalNarrativeSessions{
 constructor(db){
  this.db=db;
  db.exec('CREATE TABLE IF NOT EXISTS founders_sessions(id TEXT PRIMARY KEY,code TEXT UNIQUE NOT NULL,owner_id TEXT NOT NULL,state_json TEXT NOT NULL,updated INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS founders_access(session_id TEXT NOT NULL,family TEXT NOT NULL,hash TEXT NOT NULL UNIQUE,expires INTEGER NOT NULL,PRIMARY KEY(session_id,family));');
 }
 transaction(fn){
  this.db.exec('BEGIN IMMEDIATE');
  try{const result=fn();this.db.exec('COMMIT');return result;}
  catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 get(id){
  check(typeof id==='string'&&/^[a-f0-9]{24}$/.test(id),'Partie introuvable');
  const row=this.db.prepare('SELECT state_json FROM founders_sessions WHERE id=?').get(id);
  check(row,'Partie introuvable');return JSON.parse(row.state_json);
 }
 list(ownerId){
  check(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  return this.db.prepare('SELECT id,code,state_json FROM founders_sessions WHERE owner_id=? ORDER BY updated DESC LIMIT 100').all(ownerId).map(row=>{
   const s=JSON.parse(row.state_json);
   return{id:s.id,code:s.code,title:s.title,phase:s.phase,revision:s.revision,
    scenarioId:s.selection.scenarioId,scenarioVersion:s.selection.scenarioVersion,skinId:s.selection.skinId};
  });
 }
 create({ownerId,preview,code,title,objectives,names,colors,goalCards,scoreRules,now}){
  check(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  return this.transaction(()=>{
   const id=randomBytes(12).toString('hex');
   const s=createNarrativeSession(preview,{id,ownerId,code,title,objectives,names,colors,goalCards,scoreRules,initiativeOrder:shuffle(['A','B','C','D','E','F']),now});
   const access=familyIds.map(family=>({family,token:randomBytes(32).toString('base64url')}));
   this.db.prepare('INSERT INTO founders_sessions(id,code,owner_id,state_json,updated) VALUES(?,?,?,?,?)')
    .run(id,code,ownerId,JSON.stringify(s),now);
   const stmt=this.db.prepare('INSERT INTO founders_access(session_id,family,hash,expires) VALUES(?,?,?,?)');
   for(const a of access)stmt.run(id,a.family,tokenHash(a.token),now+86400000);
   return {id,code,access};
  });
 }
 authenticate(id,token,now){
  check(typeof token==='string'&&/^[a-zA-Z0-9_-]{43}$/.test(token),'Accès famille invalide');
  const hash=tokenHash(token),r=this.db.prepare('SELECT family,expires FROM founders_access WHERE session_id=? AND hash=?')
   .get(id,hash);
  check(r&&r.expires>now,'Accès famille expiré ou révoqué');
  return{role:'team',family:r.family,accessHash:hash};
 }
 verify(s,actor,now){
  if(actor.role==='organizer'){check(s.ownerId===actor.id,'Accès organisateur refusé');return;}
  if(actor.role==='team'){
   const r=this.db.prepare('SELECT hash,expires FROM founders_access WHERE session_id=? AND family=?')
    .get(s.id,actor.family);
   check(r&&actor.accessHash===r.hash&&r.expires>now,'Accès famille expiré ou révoqué');
   return;
  }
  check(actor.role==='public','Acteur invalide');
 }
 view(id,actor,now){
  const s=this.get(id);
  this.verify(s,actor,now);
  return narrativeView(s,actor);
 }
 command(id,actor,command,now){
  return this.transaction(()=>{
   const s=this.get(id);this.verify(s,actor,now);
   const next=applyNarrativeCommand(s,actor,command,now);
   this.db.prepare('UPDATE founders_sessions SET state_json=?,updated=? WHERE id=?').run(JSON.stringify(next),now,id);
   return narrativeView(next,actor);
  });
 }
 rotate(id,family,ownerId,now){
  check(familyIds.includes(family),'Famille invalide');
  return this.transaction(()=>{
   const s=this.get(id);
   check(s.ownerId===ownerId,'Accès organisateur refusé');
   const token=randomBytes(32).toString('base64url');
   this.db.prepare('UPDATE founders_access SET hash=?,expires=? WHERE session_id=? AND family=?')
    .run(tokenHash(token),now+86400000,id,family);
   return {family,token};
  });
 }
}
