/** Explicit post-test reset: archive only the named organizer's narrative games.
 * Run after deployment with --reset-test. Private family tokens are never printed.
 */
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {FirestoreNarrativeSessions} from '../cloud/founders-live-store.ts';
import {foundersPreview} from '../server/founders-catalog.ts';
if(!process.argv.includes('--reset-test'))throw new Error('Option --reset-test requise pour repartir de zéro');
const projectId='le-pacte-ludificateur';
const app=initializeApp({projectId,credential:applicationDefault()});
const user=await getAuth(app).getUserByEmail('gkerckhofs@gmail.com');
if(user.customClaims?.pacteOrganizer!==true)throw new Error('Compte organisateur non confirmé');
const db=getFirestore(app,'le-pacte'),sessions=new FirestoreNarrativeSessions(db),now=Date.now();
const old=await sessions.list(user.uid);
// Create the replacement first. Failed creation leaves all old games accessible.
const code='V2'+new Date(now).toISOString().replaceAll(/[^0-9]/g,'').slice(2,12);
const preview=foundersPreview({scenarioId:'hot-spring-reserve-hybride',scenarioVersion:'2.0.0',skinId:'western',members:[1,1,1,1,1]});
const fresh=await sessions.create({ownerId:user.uid,preview,code,title:'Hot Spring — Nouveau test V2',now});
const view=await sessions.view(fresh.id,{role:'organizer',id:user.uid},now);
if(view.families.length!==5||view.experienceVersion!==2||view.phase!=='READY')throw new Error('Nouvelle session non conforme');
for(const item of old)await db.runTransaction(async tx=>{
 const ref=sessions.ref(item.id),row=await tx.get(ref);
 if(row.exists&&row.data().ownerId===user.uid)tx.update(ref,{archivedAt:now,clockDue:null});
});
// Accesses will be generated/verified from the organizer's print kit, in their tab.
console.log(JSON.stringify({code:fresh.code,archived:old.length,regie:`https://le-pacte-ludificateur.web.app/founders-regie.html?session=${fresh.id}`,projection:`https://le-pacte-ludificateur.web.app/founders-city.html?session=${fresh.id}`}));
await db.terminate();
