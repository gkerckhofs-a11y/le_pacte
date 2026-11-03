import {createHash} from 'node:crypto';
import {validateFoundersStory} from '../src/founders-library.ts';
const fail=(ok,message)=>{if(!ok)throw new Error(message);};
const semver=/^[1-9]\d*\.\d+\.\d+$/;
/**
 * SQLite source of truth for published narrative snapshots.
 * The associated Google Sheet is not publicly exposed or polled.
 */
export class LocalFoundersReleases{
 constructor(db){
  this.db=db;
  db.exec('CREATE TABLE IF NOT EXISTS founders_releases(owner_id TEXT NOT NULL,scenario_id TEXT NOT NULL,version TEXT NOT NULL,source_json TEXT NOT NULL,payload_json TEXT NOT NULL,checksum TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(owner_id,scenario_id,version))');
 }
 list(ownerId){
  fail(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  return this.db.prepare('SELECT source_json,payload_json,version,checksum,created FROM founders_releases WHERE owner_id=? ORDER BY created ASC,scenario_id ASC,version ASC').all(ownerId).map(row=>({
    source:JSON.parse(row.source_json),payload:JSON.parse(row.payload_json),
    version:row.version,checksum:row.checksum,created:row.created
  }));
 }
 publish({ownerId,source,payload,version,checksum,now}){
  fail(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  fail(semver.test(version),'Version invalide');
  fail(validateFoundersStory(payload).length===0,'Scénario invalide');
  fail(typeof source.spreadsheetId==='string'&&/^[a-zA-Z0-9_-]{15,160}$/.test(source.spreadsheetId),'Google Sheets invalide');
  const payloadJson=JSON.stringify(payload),sourceJson=JSON.stringify(source);
  fail(Buffer.byteLength(payloadJson,'utf8')<=850000,'Scénario trop volumineux');
  fail(createHash('sha256').update(payloadJson).digest('hex')===checksum,'Checksum incohérent');
  const id=payload.scenario.id;
  // UNIQUE constraint is a durable, atomic safeguard against duplicate releases.
  try{
   this.db.prepare('INSERT INTO founders_releases(owner_id,scenario_id,version,source_json,payload_json,checksum,created) VALUES(?,?,?,?,?,?,?)')
    .run(ownerId,id,version,sourceJson,payloadJson,checksum,now);
  }catch(e){
   if(String(e).includes('UNIQUE'))throw new Error('Version déjà publiée : '+id+'@'+version);
   throw e;
  }
  return {scenarioId:id,version,checksum,created:now,dilemmas:payload.dilemmas.length};
 }
}
