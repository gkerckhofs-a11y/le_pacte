import {organizerWorkspace} from './founders-workspace.js';
import {isHotspring,narrativeRegie} from './founders-univers.js';

const list=document.getElementById('testsList');
const request=organizerWorkspace({
 localAction:'Ouvrir mes tests',
 status(message,error=false){
  const status=document.getElementById('status');
  status.textContent=message;
  status.dataset.error=String(error);
 },
 async onOpen(){
  const {sessions}=await request('/api/founders/sessions');
  const tests=sessions.filter(session=>session.rehearsal);
  list.replaceChildren();
  for(const session of tests){
   const item=document.createElement('li');
   const link=document.createElement('a');
   const western=isHotspring(session);
   const finished=session.phase==='FINISHED';
   link.href=narrativeRegie(session.id,western);
   link.textContent=(finished?'Voir le résultat':'Reprendre')+' · '+session.title+' · '+session.code;
   item.append(link,document.createTextNode(' ('+(western?'Hotspring':'Chicago')+')'));
   list.append(item);
  }
  if(!tests.length){
   const item=document.createElement('li');
   item.textContent='Aucun test enregistré pour ce compte.';
   list.append(item);
  }
  list.hidden=false;
  document.getElementById('loginPanel').hidden=true;
 }
});
