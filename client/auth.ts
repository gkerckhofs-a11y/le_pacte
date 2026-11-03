import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,browserSessionPersistence,GoogleAuthProvider,signInWithPopup,signOut,connectAuthEmulator} from 'firebase/auth';
let auth:ReturnType<typeof getAuth>;
export async function configure(config:any,emulatorUrl?:string){
 if(!config?.projectId||!config?.apiKey)throw new Error('Configuration Firebase Auth manquante');
 auth=getAuth(initializeApp(config,'pacte-organizer'));
 if(emulatorUrl){if(!['localhost','127.0.0.1'].includes(location.hostname)||!config.projectId.startsWith('demo-'))throw new Error('Émulateur Auth refusé hors environnement local de démonstration');connectAuthEmulator(auth,emulatorUrl,{disableWarnings:true});}
 await setPersistence(auth,browserSessionPersistence);await auth.authStateReady();
}
export function currentAccount(){const user=auth?.currentUser;return user?{email:user.email,displayName:user.displayName}:null;}
export async function currentToken(){await auth.authStateReady();return auth.currentUser?await auth.currentUser.getIdToken():'';}
export async function login(){const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider);return currentToken();}
/**
 * The spreadsheet OAuth token stays only in the organizer's browser memory.
 * It is never sent to Le Pacte. The backend receives only read cell values.
 * This is separate from the Firebase ID token used for operator authorization.
 */
export async function authorizeSheetsRead(){
 const provider=new GoogleAuthProvider();
 provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
 provider.setCustomParameters({prompt:'select_account'});
 const result=await signInWithPopup(auth,provider);
 const accessToken=GoogleAuthProvider.credentialFromResult(result)?.accessToken;
 if(!accessToken)throw new Error('Autorisation Google Sheets indisponible');
 return accessToken;
}
export async function logout(){await signOut(auth);}
