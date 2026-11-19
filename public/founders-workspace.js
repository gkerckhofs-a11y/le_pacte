import {organizerError} from './founders-regie-flow.js';

const $=id=>document.getElementById(id);
const key='pacte-founder-organizer-key';
export function rememberAccess(result){
 // Raw credentials stay in this tab session, never in saved configurations.
 try{sessionStorage.setItem('pacte-narrative-access-'+result.id,JSON.stringify({created:Date.now(),access:result.access}));}catch{}
}

export function organizerWorkspace({onOpen,status,localAction}){
 let authSDK=null;
 async function request(path,method='GET',body){
  const token=authSDK?await authSDK.currentToken():$('localKey').value.trim();
  if(!token)throw new Error('Connectez-vous à la régie.');
  const response=await fetch(path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const data=await response.json();
  if(!response.ok){const e=new Error(data.error);e.status=response.status;throw e;}
  return data;
 }
 async function connect(){
  const button=$('connect');button.disabled=true;
  try{
   if(authSDK)await authSDK.login();
   await onOpen();
   if(!authSDK)sessionStorage.setItem(key,$('localKey').value.trim());
   status('');
  }catch(e){status(organizerError(e),true);}
  finally{button.disabled=false;}
 }
 $('connect').addEventListener('click',connect);
 async function init(){
  try{
   const response=await fetch('/api/catalog',{cache:'no-store'});
   if(!response.ok)throw new Error('Connexion indisponible.');
   const settings=await response.json();
   if(settings.authMode==='firebase'){
    authSDK=await import('/firebase-auth.js');
    await authSDK.configure(settings.firebaseConfig,settings.authEmulatorUrl);
    $('connect').textContent='Se connecter avec Google';
    if(await authSDK.currentToken())await onOpen();
   }else{
    $('connect').textContent=localAction;$('localLogin').hidden=false;
    $('localKey').value=sessionStorage.getItem(key)??'';
    if($('localKey').value)await onOpen();
   }
  }catch(e){status(organizerError(e),true);}
  finally{$('connect').disabled=false;}
 }
 init();
 return request;
}
