import {execFileSync} from 'node:child_process';
import {GoogleAuth} from 'google-auth-library';
import {readFileSync} from 'node:fs';

const project='le-pacte-ludificateur';
const site='games-of-influence';
const domain=site+'.web.app';
const args=['-y','firebase-tools@15.36.0'];
const projectOptions=['--project',project,'--non-interactive'];
const inventory=JSON.parse(execFileSync('npx',[...args,'hosting:sites:list',...projectOptions,'--json'],{encoding:'utf8'}));
if(!Array.isArray(inventory.result?.sites))throw new Error('Liste des sites Firebase illisible.');
if(!inventory.result.sites.some(entry=>entry.name.split('/').at(-1)===site)){
 execFileSync('npx',[...args,'hosting:sites:create',site,...projectOptions],{stdio:'inherit'});
}

const {apiKey}=JSON.parse(readFileSync(new URL('../firebase/web-config.json',import.meta.url),'utf8'));
const publicConfig='https://identitytoolkit.googleapis.com/v1/projects?key='+encodeURIComponent(apiKey);
async function domainAuthorized(){
 try{
  const response=await fetch(publicConfig,{signal:AbortSignal.timeout(15000)});
  return response.ok&&(await response.json()).authorizedDomains?.includes(domain);
 }catch{return false;}
}
if(await domainAuthorized()){
 console.log('Connexion Google : domaine déjà autorisé.');
}else{
 const config='https://identitytoolkit.googleapis.com/admin/v2/projects/'+project+'/config';
 const headers={'x-goog-user-project':project};
 try{
  const auth=new GoogleAuth({scopes:['https://www.googleapis.com/auth/cloud-platform']});
  const client=await auth.getClient();
  const current=await client.request({url:config,headers,params:{fields:'authorizedDomains'}});
  const existing=current.data?.authorizedDomains;
  if(!Array.isArray(existing))throw new Error('Configuration Auth illisible.');
  if(!existing.includes(domain)){
   await client.request({url:config,method:'PATCH',headers,params:{update_mask:'authorizedDomains'},data:{authorizedDomains:[...existing,domain]}});
  }
  console.log('Connexion Google : domaine ajouté à la configuration Auth.');
 }catch(error){
  console.warn('::warning::Le domaine '+domain+' doit être ajouté dans Firebase Authentication (HTTP '+(error.response?.status??'indisponible')+').');
 }
}
