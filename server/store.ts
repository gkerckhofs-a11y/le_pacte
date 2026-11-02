import {DatabaseSync} from 'node:sqlite';
import {randomBytes,randomInt,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createSession,applyCommand,sessionView} from '../src/session.ts';
import type {Session,Actor,Command} from '../src/session.ts';
import {ARCHETYPES,EDGES,NEIGHBORS,ZONES} from '../src/map.ts';
import type {TeamId} from '../src/map.ts';
import {validateOrders} from '../src/engine.ts';
import {EditionStudio} from './studio.ts';
export const catalog=JSON.parse(readFileSync(new URL('../content/editions.json',import.meta.url),'utf8')).editions;
export const map={zones:ZONES,edges:EDGES,neighbors:NEIGHBORS,archetypes:ARCHETYPES};
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
function shuffle<T>(items:T[]):T[]{const out=[...items];for(let i=out.length-1;i>0;i--){const j=randomInt(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
const check=(b:unknown,m:string)=>{if(!b)throw new Error(m);};
export class GameStore {
 db:DatabaseSync;
 studio:EditionStudio;
 constructor(path:string){
  this.db=new DatabaseSync(path);this.db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
  this.db.exec(`CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, title TEXT NOT NULL, state TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS team_access(session_id TEXT NOT NULL, team TEXT NOT NULL, hash TEXT NOT NULL UNIQUE, expires INTEGER NOT NULL, last_seen INTEGER, PRIMARY KEY(session_id,team));`);
  this.studio=new EditionStudio(this);
 }
 close(){this.db.close();}
 transaction<T>(fn:()=>T):T {this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 get(id:string):Session{const row=this.db.prepare('SELECT state FROM sessions WHERE id=?').get(id) as {state:string}|undefined;check(row,'Session introuvable');return JSON.parse(row!.state);}
 save(s:Session){this.db.prepare('UPDATE sessions SET state=? WHERE id=?').run(JSON.stringify(s),s.id);}
 list(){return this.db.prepare('SELECT id,code,title,state FROM sessions ORDER BY rowid DESC LIMIT 100').all().map((r:any)=>{const s=JSON.parse(r.state);return{id:r.id,code:r.code,title:r.title,phase:s.phase,round:s.game.round,theme:s.edition.themeId};});}
 create(code:string,title:string,themeId:string,now:number,releaseId?:string){
  check(typeof code==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,11}$/.test(code),'Code : 3 à 12 lettres majuscules, chiffres, tirets');
  check(typeof title==='string'&&title.trim().length>0&&title.length<=100,'Titre requis (100 caractères maximum)');
  const release=releaseId?this.studio.release(releaseId):null;
  const edition=release?.edition??catalog.find((e:any)=>e.themeId===themeId);check(edition,'Univers inconnu');
  return this.transaction(()=>{
   check(!this.db.prepare('SELECT id FROM sessions WHERE code=?').get(code),'Code déjà utilisé');
   const id=randomBytes(12).toString('hex');
   const s=createSession(id,'local-organizer',edition,shuffle(['O1','O2','O3','O4','O5','O6']),shuffle([1,2,3,4,5,6]));
   if(release)(s as any).editionSource={releaseId:release.id,checksum:release.checksum};
   this.db.prepare('INSERT INTO sessions(id,code,title,state) VALUES(?,?,?,?)').run(id,code,title.trim(),JSON.stringify(s));
   const access=ARCHETYPES.map(team=>({team,token:this.rotateInternal(id,team,now)}));return{id,access};
  });
 }
 rotateInternal(id:string,team:TeamId,now:number){
  check(ARCHETYPES.includes(team),'Équipe inconnue');const token=randomBytes(32).toString('base64url');
  this.db.prepare('INSERT INTO team_access(session_id,team,hash,expires,last_seen) VALUES(?,?,?,?,NULL) ON CONFLICT(session_id,team) DO UPDATE SET hash=excluded.hash,expires=excluded.expires,last_seen=NULL').run(id,team,tokenHash(token),now+86400000);return token;
 }
 rotate(id:string,team:TeamId,now:number){return this.transaction(()=>{this.get(id);return this.rotateInternal(id,team,now);});}
 authenticateTeam(id:string,token:string,now:number,markSeen=true):Actor {
  const row=this.db.prepare('SELECT team FROM team_access WHERE session_id=? AND hash=? AND expires>?').get(id,tokenHash(token),now) as {team:TeamId}|undefined;
  check(row,'Accès invalide, expiré ou révoqué');if(markSeen)this.db.prepare('UPDATE team_access SET last_seen=? WHERE session_id=? AND team=?').run(now,id,row!.team);return{role:'team',team:row!.team};
 }
 command(id:string,actor:Actor,c:Command,now:number){return this.transaction(()=>{const s=this.get(id);const next=applyCommand(s,actor,c,now);this.save(next);return this.viewState(next,actor,now);});}
 validate(id:string,actor:Actor,orders:any,now:number){const s=this.get(id);check(actor.role==='team'&&s.phase==='ORDERS'&&s.pausedRemaining===null&&s.deadline!==null&&now<s.deadline,'Ordres fermés');check(!s.game.orders[(actor as any).team],'Ordres déjà verrouillés');return{cost:validateOrders(s.game,(actor as any).team,orders)};}
 viewState(s:Session,actor:Actor|{role:'public'},now:number){
  const row=this.db.prepare('SELECT code,title FROM sessions WHERE id=?').get(s.id) as {code:string;title:string};
  const view:any={...sessionView(s,actor),...row,serverNow:now};
  if(actor.role==='team')view.teamId=actor.team;
  if(actor.role==='organizer')view.connections=this.db.prepare('SELECT team,last_seen,expires FROM team_access WHERE session_id=?').all(s.id);
  return view;
 }
 view(id:string,actor:Actor|{role:'public'},now:number){return this.viewState(this.get(id),actor,now);}
 advanceDue(now:number){
  // Each transition is read, computed and written inside the same SQLite transaction.
  // The canonical old deadline anchors the next phase, even after process restart.
  for(const item of this.db.prepare('SELECT id FROM sessions').all())this.transaction(()=>{
   let s=this.get(item.id as string),count=0;const revision=s.revision;
   while(s.deadline!==null&&s.pausedRemaining===null&&s.deadline<=now&&count++<40){
    s=applyCommand(s,{role:'organizer',id:s.organizerId},{id:`timer-${s.game.round}-${s.phase}`,sessionId:s.id,expectedPhase:s.phase,expectedRound:s.game.round,kind:'advance',data:{}},s.deadline);
   }
   if(s.revision!==revision)this.save(s);
  });
 }
}
