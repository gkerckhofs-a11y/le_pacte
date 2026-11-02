import type {Actor,Command} from '../src/session.ts';
// Presentation DTOs remain versioned by the session engine. Both synchronous
// SQLite and asynchronous Firestore adapters implement the same HTTP boundary.
export interface StorePort {
 studio:any;
 list(ownerId?:string):any;
 create(code:string,title:string,themeId:string,now:number,releaseId?:string,ownerId?:string):any;
 get(id:string,ownerId?:string):any;
 rotate(id:string,team:any,now:number,ownerId?:string):any;
 authenticateTeam(id:string,token:string,now:number,markSeen?:boolean):any;
 assertOwner?(id:string,ownerId:string):any;
 view(id:string,actor:Actor|{role:'public'},now:number):any;
 validate(id:string,actor:Actor,orders:any,now:number):any;
 command(id:string,actor:Actor,command:Command,now:number):any;
}
export type Operator={uid:string;organizer:boolean;editor:boolean};
