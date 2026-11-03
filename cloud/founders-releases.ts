import {createHash} from 'node:crypto';
import {validateFoundersStory} from '../src/founders-library.ts';
import {rows} from './data.ts';
const fail=(ok,message)=>{if(!ok)throw new Error(message);};
const semver=/^[1-9]\d*\.\d+\.\d+$/;
/** Independent, private published story snapshots; never expose raw collection. */
export class FirestoreFoundersReleases{
 constructor(db){this.db=db;}
 ref(ownerId,scenarioId,version){
  const id=createHash('sha256').update(ownerId+'\0'+scenarioId+'\0'+version).digest('hex');
  return this.db.doc('pacteNarrativeReleases/'+id);
 }
 async list(ownerId){
  fail(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  const results=await rows(this.db,'pacteNarrativeReleases',ownerId,'created',100);
  return results.map(row=>({source:JSON.parse(row.sourceJson),payload:JSON.parse(row.payloadJson),
   version:row.version,checksum:row.checksum,created:row.created}));
 }
 async publish({ownerId,source,payload,version,checksum,now}){
  fail(typeof ownerId==='string'&&ownerId.length>0,'Organisateur requis');
  fail(semver.test(version),'Version invalide');
  fail(validateFoundersStory(payload).length===0,'Scénario invalide');
  fail(typeof source.spreadsheetId==='string'&&/^[a-zA-Z0-9_-]{15,160}$/.test(source.spreadsheetId),'Google Sheets invalide');
  const payloadJson=JSON.stringify(payload),sourceJson=JSON.stringify(source);
  fail(Buffer.byteLength(payloadJson,'utf8')<=850000,'Scénario trop volumineux');
  fail(createHash('sha256').update(payloadJson).digest('hex')===checksum,'Checksum incohérent');
  const scenarioId=payload.scenario.id;
  const ref=this.ref(ownerId,scenarioId,version);
  await this.db.runTransaction(async tx=>{
   const old=await tx.get(ref);
   fail(!old.exists,'Version déjà publiée : '+scenarioId+'@'+version);
   tx.create(ref,{ownerId,scenarioId,version,sourceJson,payloadJson,checksum,created:now});
  });
  return {scenarioId,version,checksum,created:now,dilemmas:payload.dilemmas.length};
 }
}
