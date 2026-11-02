import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,browserSessionPersistence,GoogleAuthProvider,signInWithPopup,signOut,connectAuthEmulator} from 'firebase/auth';
let auth:ReturnType<typeof getAuth>;
export async function configure(config:any,emulatorUrl?:string){
 if(!config?.projectId||!config?.apiKey)throw new Error('Configuration Firebase Auth manquante');
 auth=getAuth(initializeApp(config,'pacte-organizer'));
 if(emulatorUrl){if(!['localhost','127.0.0.1'].includes(location.hostname)||!config.projectId.startsWith('demo-'))throw new Error('Émulateur Auth refusé hors environnement local de démonstration');connectAuthEmulator(auth,emulatorUrl,{disableWarnings:true});}
 await setPersistence(auth,browserSessionPersistence);await auth.authStateReady();
}
export async function currentToken(){await auth.authStateReady();return auth.currentUser?await auth.currentUser.getIdToken():'';}
export async function login(){const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider);return currentToken();}
export async function logout(){await signOut(auth);}
