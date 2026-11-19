import {advanceNarrativeTime} from '../src/founders-v2.ts';
import {activeFounders} from '../src/founders.ts';
import {randomBytes} from 'node:crypto';
import {tokenHash,shuffle} from './security.ts';
import {createNarrativeSession,duplicateHotspringFinal,applyNarrativeCommand,narrativeView} from '../src/founders-live.ts';

const check=(condition,message)=>{if(!condition)throw new Error(message);};
const familyIds=['A','B','C','D','E','F'];
export class LocalNarrativeSessions{
 constructor(db){
  this.db=db;
  db.exec('CREATE TABLE IF NOT EXISTS founders_configurations(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,data_json TEXT NOT NULL,updated INTEGER NOT NULL)');
  db.exec('CREATE TABLE IF NOT EXISTS founders_sessions(id TEXT PRIMARY KEY,code TEXT UNIQUE NOT NULL,owner_id TEXT NOT NULL,state_json TEXT NOT NULL,updated INTEGER NOT NULL,archived_at INTEGER); CREATE TABLE IF NOT EXISTS founders_access(session_id TEXT NOT NULL,family TEXT NOT NULL,hash TEXT NOT NULL UNIQUE,expires INTEGER NOT NULL,PRIMARY KEY(session_id,family));');
  if(!db.prepare('PRAGMA table_info(founders_sessions)').all().some(column=>column.name==='archived_at'))db.exec('ALTER TABLE founders_sessions ADD COLUMN archived_at INTEGER');
 }
 listConfigurations(ownerId){
  check(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  return this.db.prepare('SELECT id,data_json FROM founders_configurations WHERE owner_id=? ORDER BY updated DESC LIMIT 100').all(ownerId).map(row=>({id:row.id,...JSON.parse(row.data_json)}));
 }
 saveConfiguration(ownerId,data,now){
  check(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  const id=randomBytes(12).toString('hex');
  this.db.prepare('INSERT INTO founders_configurations(id,owner_id,data_json,updated) VALUES(?,?,?,?)').run(id,ownerId,JSON.stringify(data),now);
  return {id,...data};
 }
 transaction(fn){
  this.db.exec('BEGIN IMMEDIATE');
  try{const result=fn();this.db.exec('COMMIT');return result;}
  catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 get(id){
  check(typeof id==='string'&&/^[a-f0-9]{24}$/.test(id),'Partie introuvable');
  const row=this.db.prepare('SELECT state_json FROM founders_sessions WHERE id=? AND archived_at IS NULL').get(id);
  check(row,'Partie introuvable ou archivée');return JSON.parse(row.state_json);
 }
 list(ownerId){
  check(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  return this.db.prepare('SELECT id,code,state_json FROM founders_sessions WHERE owner_id=? AND archived_at IS NULL ORDER BY updated DESC LIMIT 100').all(ownerId).map(row=>{
   const s=JSON.parse(row.state_json);
   return{id:s.id,code:s.code,title:s.title,phase:s.phase,revision:s.revision,
    scenarioId:s.selection.scenarioId,scenarioVersion:s.selection.scenarioVersion,skinId:s.selection.skinId};
  });
 }
 archiveAll(ownerId,now){
  check(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  return this.db.prepare("UPDATE founders_sessions SET archived_at=? WHERE owner_id=? AND archived_at IS NULL AND json_extract(state_json,'$.createdAt')<=?").run(now,ownerId,now).changes;
 }

 create({ownerId,preview,code,title,objectives,names,colors,goalCards,scoreRules,timing,gaugeThresholds,crisisMode,presentationSeconds,now}){
  check(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  return this.transaction(()=>{
   const id=randomBytes(12).toString('hex');
   const s=createNarrativeSession(preview,{id,ownerId,code,title,objectives,names,colors,goalCards,scoreRules,timing,gaugeThresholds,crisisMode,presentationSeconds,initiativeOrder:shuffle(activeFounders(preview.game)),now});
   return this.insert(s);
  });
 }
 duplicate(id,ownerId,now){
  return this.transaction(()=>this.insert(duplicateHotspringFinal(this.get(id),{
   id:randomBytes(12).toString('hex'),code:'V'+randomBytes(4).toString('hex').toUpperCase(),ownerId,now
  })));
 }
 insert(s){
   const {id,code,ownerId,createdAt:now}=s;
   const access=activeFounders(s.game).map(family=>({family,token:randomBytes(32).toString('base64url')}));
   this.db.prepare('INSERT INTO founders_sessions(id,code,owner_id,state_json,updated) VALUES(?,?,?,?,?)')
    .run(id,code,ownerId,JSON.stringify(s),now);
   const stmt=this.db.prepare('INSERT INTO founders_access(session_id,family,hash,expires) VALUES(?,?,?,?)');
   for(const a of access)stmt.run(id,a.family,tokenHash(a.token),now+86400000);
   return {id,code,access};
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
  return this.transaction(()=>{
   const stored=this.get(id);this.verify(stored,actor,now);
   const s=advanceNarrativeTime(stored,now);
   if(s!==stored)this.db.prepare('UPDATE founders_sessions SET state_json=?,updated=? WHERE id=?').run(JSON.stringify(s),now,id);
   return {...narrativeView(s,actor),serverNow:now};
  });
 }
 command(id,actor,command,now){
  return this.transaction(()=>{
   const s=this.get(id);this.verify(s,actor,now);
   const next=applyNarrativeCommand(s,actor,command,now);
   this.db.prepare('UPDATE founders_sessions SET state_json=?,updated=? WHERE id=?').run(JSON.stringify(next),now,id);
   return {...narrativeView(next,actor),serverNow:now};
  });
 }
 rotate(id,family,ownerId,now){
  check(familyIds.includes(family),'Famille invalide');
  return this.transaction(()=>{
   const s=this.get(id);
   check(activeFounders(s.game).includes(family),'Famille inactive');
   check(s.ownerId===ownerId,'Accès organisateur refusé');
   const token=randomBytes(32).toString('base64url');
   this.db.prepare('UPDATE founders_access SET hash=?,expires=? WHERE session_id=? AND family=?')
    .run(tokenHash(token),now+86400000,id,family);
   return {family,token};
  });
 }
}
