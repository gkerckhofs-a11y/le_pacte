import {randomBytes,createHash} from 'node:crypto';
import {studioCopy,validateStudioEdition} from '../src/studio.ts';
import type {GameStore} from './store.ts';
const check=(ok:unknown,message:string)=>{if(!ok)throw new Error(message);};
/** One local organizer owns the studio. Its HTTP routes require the same server
 * verified organizer credential as the regie. Future cloud roles remain separate. */
export class EditionStudio {
 store:GameStore;
 constructor(store:GameStore){this.store=store;store.db.exec(`
  CREATE TABLE IF NOT EXISTS edition_drafts(id TEXT PRIMARY KEY,family_id TEXT NOT NULL,status TEXT NOT NULL,revision INTEGER NOT NULL,content TEXT NOT NULL,release_id TEXT,created INTEGER NOT NULL,updated INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS edition_releases(id TEXT PRIMARY KEY,family_id TEXT NOT NULL,version INTEGER NOT NULL,content TEXT NOT NULL,checksum TEXT NOT NULL,created INTEGER NOT NULL,UNIQUE(family_id,version));`);}
 list(){return {drafts:this.store.db.prepare('SELECT id,family_id,status,revision,content,release_id,updated FROM edition_drafts ORDER BY updated DESC').all().map((r:any)=>({id:r.id,familyId:r.family_id,status:r.status,revision:r.revision,title:JSON.parse(r.content).title,releaseId:r.release_id,updated:r.updated})),releases:this.store.db.prepare('SELECT id,family_id,version,content,checksum,created FROM edition_releases ORDER BY created DESC').all().map((r:any)=>({id:r.id,familyId:r.family_id,version:r.version,title:JSON.parse(r.content).title,checksum:r.checksum,created:r.created}))};}
 draft(id:string){const r:any=this.store.db.prepare('SELECT * FROM edition_drafts WHERE id=?').get(id);check(r,'Brouillon introuvable');return{id:r.id,familyId:r.family_id,status:r.status,revision:r.revision,edition:JSON.parse(r.content),releaseId:r.release_id,updated:r.updated};}
 release(id:string){const r:any=this.store.db.prepare('SELECT * FROM edition_releases WHERE id=?').get(id);check(r,'Version publiée introuvable');return{id:r.id,familyId:r.family_id,version:r.version,edition:JSON.parse(r.content),checksum:r.checksum,created:r.created};}
 create(input:any,templates:any[],now:number){
  check(input&&typeof input==='object','Source requise');
  check([input.themeId,input.draftId,input.releaseId,input.import].filter(v=>v!==undefined).length===1,'Choisir une seule source');
  return this.store.transaction(()=>{
   let e:any,family:string|undefined;
   if(input.themeId!==undefined)e=templates.find(t=>t.themeId===input.themeId);
   if(input.draftId!==undefined)e=this.draft(input.draftId).edition;
   if(input.releaseId!==undefined){const release=this.release(input.releaseId);e=release.edition;if(input.newUniverse!==true)family=release.familyId;}
   if(input.import!==undefined){check(input.import?.schemaVersion==='1.0'&&input.import?.kind==='pacte-content','Format d’import incompatible');e=input.import.edition;}
   check(e,'Source d’univers inconnue');e=studioCopy(e);
   const id=randomBytes(12).toString('hex');family??=id;
   e.publicationStatus='DRAFT';e.editionVersion='draft';e.scenarioId=family;
   this.store.db.prepare('INSERT INTO edition_drafts(id,family_id,status,revision,content,created,updated) VALUES(?,?,?,0,?,?,?)').run(id,family,'draft',JSON.stringify(e),now,now);
   return this.draft(id);
  });
 }
 save(id:string,revision:number,content:any,now:number){
  return this.store.transaction(()=>{
   const d=this.draft(id);check(d.status==='draft','Version publiée immuable : créer une nouvelle version');check(Number.isSafeInteger(revision)&&revision===d.revision,'Conflit de révision : rechargez le brouillon avant de modifier');
   const e=studioCopy(content);check(e.rulesetId===d.edition.rulesetId&&e.mapId===d.edition.mapId,'Règles ou carte immuables');
   e.publicationStatus='DRAFT';e.editionVersion='draft';e.scenarioId=d.familyId;
   this.store.db.prepare('UPDATE edition_drafts SET content=?,revision=revision+1,updated=? WHERE id=? AND revision=?').run(JSON.stringify(e),now,id,revision);return this.draft(id);
  });
 }
 check(id:string){const d=this.draft(id);return{revision:d.revision,errors:validateStudioEdition(d.edition,true)};}
 publish(id:string,revision:number,now:number){
  return this.store.transaction(()=>{
   const d=this.draft(id);check(Number.isSafeInteger(revision)&&d.revision===revision,'Conflit de révision : vérifier la version à publier');check(d.status==='draft','Version déjà publiée');
   const errors=validateStudioEdition(d.edition,true);check(errors.length===0,errors.join(' · '));
   const row:any=this.store.db.prepare('SELECT MAX(version) AS version FROM edition_releases WHERE family_id=?').get(d.familyId);const version=(row.version??0)+1,releaseId=`${d.familyId}-v${version}`;
   const e={...structuredClone(d.edition),publicationStatus:'PUBLISHED_CONTENT',editionVersion:`${version}.0.0`,scenarioId:d.familyId};const content=JSON.stringify(e),checksum=createHash('sha256').update(content).digest('hex');
   this.store.db.prepare('INSERT INTO edition_releases(id,family_id,version,content,checksum,created) VALUES(?,?,?,?,?,?)').run(releaseId,d.familyId,version,content,checksum,now);
   this.store.db.prepare('UPDATE edition_drafts SET status=?,revision=revision+1,content=?,release_id=?,updated=? WHERE id=?').run('published',content,releaseId,now,id);
   return this.release(releaseId);
  });
 }
 export(source:'drafts'|'releases',id:string){const item=source==='drafts'?this.draft(id):this.release(id);return{schemaVersion:'1.0',kind:'pacte-content',edition:structuredClone(item.edition)};}
}
