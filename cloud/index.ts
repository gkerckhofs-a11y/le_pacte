import {initializeApp,getApps} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {onRequest} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import webConfig from '../firebase/web-config.json' with {type:'json'};
import {FirestoreStore} from './store.ts';
import {operatorVerifier} from './auth.ts';
import {createGameServer} from '../server/http.ts';
const app=getApps()[0]??initializeApp();
const store=new FirestoreStore(getFirestore(app,'le-pacte'));
// This transport has no listening socket in Cloud Functions. Its request handler
// is reused so local and cloud HTTP routes enforce the same command semantics.
const transport=createGameServer(store,'cloud-local-secret-is-disabled-000000000',()=>Date.now(),{
 apiOnly:true,clientAuth:process.env.FUNCTIONS_EMULATOR==='true'?{...webConfig,projectId:app.options.projectId,authDomain:'localhost'}:webConfig,...(process.env.FUNCTIONS_EMULATOR==='true'?{authEmulatorUrl:'http://127.0.0.1:9099'}:{}),verifyOperator:operatorVerifier(getAuth(app)),publicOrigin:process.env.PACTE_PUBLIC_ORIGIN??'https://le-pacte-ludificateur.web.app'
});
export const api=onRequest({region:'europe-west1',maxInstances:2,concurrency:20,timeoutSeconds:60,invoker:'public'},async(req,res)=>{await (transport.listeners('request')[0] as any)(req,res);});
export const tick=onSchedule({schedule:'every 1 minutes',region:'europe-west1',maxInstances:1,timeoutSeconds:60},async()=>{await store.advanceDue(Date.now());});
