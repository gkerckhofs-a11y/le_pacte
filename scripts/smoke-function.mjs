import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
if(!process.env.FIRESTORE_EMULATOR_HOST||!process.env.FIREBASE_AUTH_EMULATOR_HOST)throw new Error('Emulator-only smoke test');
const app=initializeApp({projectId:'demo-le-pacte'},'function-smoke');
try{
 const nativeFetch=globalThis.fetch;const fetch=(url,options={})=>nativeFetch(url,{...options,signal:AbortSignal.timeout(15000)});
 const root='http://127.0.0.1:5001/demo-le-pacte/europe-west1/api';
 const catalog=await (await fetch(root+'/api/catalog')).json();assert.equal(catalog.authMode,'firebase');assert.equal(catalog.firebaseConfig.projectId,'demo-le-pacte');
 const uid='smoke-'+randomBytes(6).toString('hex'),email=uid+'@example.test',password='Function-smoke-password';const auth=getAuth(app);await auth.createUser({uid,email,password,emailVerified:true});await auth.setCustomUserClaims(uid,{pacteOrganizer:true,pacteEditor:true});
 const signed=await (await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})})).json();assert.ok(signed.idToken);
 const created=await fetch(root+'/api/sessions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+signed.idToken},body:JSON.stringify({code:'S'+randomBytes(3).toString('hex').toUpperCase(),title:'Cloud Functions smoke',themeId:'western'})});const result=await created.json();assert.equal(created.status,201,JSON.stringify(result));
 const view=await (await fetch(root+'/api/sessions/'+result.id)).json();assert.equal(view.game.self,undefined);assert.equal(view.game.goals,undefined);assert.equal(view.game.teams[0].means,undefined);
 console.log('Functions emulator: authenticated JSON POST and public projection verified');
}finally{await deleteApp(app);}
