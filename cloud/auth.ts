import type {Operator} from '../server/ports.ts';
export function operatorVerifier(auth:any){return async(token:string):Promise<Operator|null>=>{
 try{const c=await auth.verifyIdToken(token,true);if(c.email_verified!==true)return null;return{uid:c.uid,email:typeof c.email==='string'?c.email.trim().toLowerCase():undefined,organizer:c.pacteOrganizer===true,editor:c.pacteEditor===true};}catch{return null;}
};}
