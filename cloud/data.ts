import {Pipelines} from '@google-cloud/firestore';
export const check=(ok:unknown,message:string)=>{if(!ok)throw new Error(message);};
export function jsonData(value:any){const json=JSON.stringify(value);check(Buffer.byteLength(json,'utf8')<=850000,'Données trop volumineuses pour la session');return json;}
export function data(snapshot:any){check(snapshot.exists,'Ressource introuvable');return snapshot.data();}
export function owned(row:any,ownerId:string){check(ownerId&&row.ownerId===ownerId,'Accès refusé à cette ressource');return row;}
export async function rows(db:any,path:string,ownerId?:string,sort='updated',limit=100){
 let p=db.pipeline().collection(path);if(ownerId!==undefined)p=p.where(Pipelines.field('ownerId').equal(ownerId));
 const result=await p.sort(Pipelines.descending(sort)).limit(limit).execute();return result.results.map((d:any)=>({id:d.id,...d.data()}));
}
