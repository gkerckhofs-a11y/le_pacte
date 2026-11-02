import {randomBytes,createHash} from 'node:crypto';
import {studioCopy,validateStudioEdition} from '../src/studio.ts';
import {check,data,owned,rows,jsonData} from './data.ts';
export class FirestoreStudio {
 db:any;
 constructor(db:any){this.db=db;}
 draftRef(id:string){check(/^[a-f0-9]{24}$/.test(id),'Brouillon introuvable');return this.db.doc(`pacteDrafts/${id}`);}
 releaseRef(id:string){check(/^[a-f0-9]{24}-v[1-9][0-9]*$/.test(id),'Version publiée introuvable');return this.db.doc(`pacteReleases/${id}`);}
 dto(id:string,r:any){return{id,familyId:r.familyId,status:r.status,revision:r.revision,edition:JSON.parse(r.json),releaseId:r.releaseId??null,updated:r.updated};}
 releaseDto(id:string,r:any){return{id,familyId:r.familyId,version:r.version,edition:JSON.parse(r.json),checksum:r.checksum,created:r.created};}
 async draft(id:string,ownerId:string){return this.dto(id,owned(data(await this.draftRef(id).get()),ownerId));}
 async release(id:string,ownerId:string){return this.releaseDto(id,owned(data(await this.releaseRef(id).get()),ownerId));}
 async list(ownerId:string){check(ownerId,'Accès éditeur requis');const [drafts,releases]=await Promise.all([rows(this.db,'pacteDrafts',ownerId),rows(this.db,'pacteReleases',ownerId,'created')]);return{drafts:drafts.map((r:any)=>({id:r.id,familyId:r.familyId,status:r.status,revision:r.revision,title:JSON.parse(r.json).title,releaseId:r.releaseId??null,updated:r.updated})),releases:releases.map((r:any)=>({id:r.id,familyId:r.familyId,version:r.version,title:JSON.parse(r.json).title,checksum:r.checksum,created:r.created}))};}
 async create(input:any,templates:any[],now:number,ownerId:string){
  check(ownerId&&input&&typeof input==='object','Source requise');check([input.themeId,input.draftId,input.releaseId,input.import].filter(v=>v!==undefined).length===1,'Choisir une seule source');
  const id=randomBytes(12).toString('hex');
  return this.db.runTransaction(async(tx:any)=>{
   let e:any,familyId=id;
   if(input.themeId!==undefined)e=templates.find(t=>t.themeId===input.themeId);
   if(input.draftId!==undefined)e=this.dto(input.draftId,owned(data(await tx.get(this.draftRef(input.draftId))),ownerId)).edition;
   if(input.releaseId!==undefined){const r=owned(data(await tx.get(this.releaseRef(input.releaseId))),ownerId);e=JSON.parse(r.json);if(input.newUniverse!==true)familyId=r.familyId;}
   if(input.import!==undefined){check(input.import?.schemaVersion==='1.0'&&input.import?.kind==='pacte-content','Format d’import incompatible');e=input.import.edition;}
   check(e,'Source d’univers inconnue');e=studioCopy(e);e.publicationStatus='DRAFT';e.editionVersion='draft';e.scenarioId=familyId;
   const r={ownerId,familyId,status:'draft',revision:0,json:jsonData(e),releaseId:null,created:now,updated:now};
   tx.create(this.draftRef(id),r);if(familyId===id)tx.create(this.db.doc(`pacteFamilies/${familyId}`),{ownerId,nextVersion:1});return this.dto(id,r);
  });
 }
 async save(id:string,revision:number,content:any,now:number,ownerId:string){
  const e=studioCopy(content);return this.db.runTransaction(async(tx:any)=>{
   const ref=this.draftRef(id),r=owned(data(await tx.get(ref)),ownerId);check(r.status==='draft','Version publiée immuable : créer une nouvelle version');check(Number.isSafeInteger(revision)&&revision===r.revision,'Conflit de révision');
   e.publicationStatus='DRAFT';e.editionVersion='draft';e.scenarioId=r.familyId;const next={...r,revision:r.revision+1,json:jsonData(e),updated:now};tx.set(ref,next);return this.dto(id,next);
  });
 }
 async check(id:string,ownerId:string){const d=await this.draft(id,ownerId);return{revision:d.revision,errors:validateStudioEdition(d.edition,true)};}
 async publish(id:string,revision:number,now:number,ownerId:string){
  return this.db.runTransaction(async(tx:any)=>{
   const ref=this.draftRef(id),r=owned(data(await tx.get(ref)),ownerId);check(r.status==='draft','Version déjà publiée');check(Number.isSafeInteger(revision)&&r.revision===revision,'Conflit de révision');
   const e=JSON.parse(r.json),errors=validateStudioEdition(e,true);check(!errors.length,errors.join(' · '));const familyRef=this.db.doc(`pacteFamilies/${r.familyId}`),family=owned(data(await tx.get(familyRef)),ownerId),version=family.nextVersion,releaseId=`${r.familyId}-v${version}`;
   e.publicationStatus='PUBLISHED_CONTENT';e.editionVersion=`${version}.0.0`;e.scenarioId=r.familyId;const json=jsonData(e),checksum=createHash('sha256').update(json).digest('hex');
   const released={ownerId,familyId:r.familyId,version,json,checksum,created:now};tx.create(this.releaseRef(releaseId),released);tx.update(familyRef,{nextVersion:version+1});tx.set(ref,{...r,status:'published',revision:r.revision+1,json,releaseId,updated:now});return this.releaseDto(releaseId,released);
  });
 }
 async export(source:string,id:string,ownerId:string){const item=source==='drafts'?await this.draft(id,ownerId):await this.release(id,ownerId);return{schemaVersion:'1.0',kind:'pacte-content',edition:item.edition};}
}
