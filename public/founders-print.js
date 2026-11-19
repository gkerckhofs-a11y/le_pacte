import {teamCaption} from './founders-identity.js';
import {createHotspringRules} from './hotspring-rules.js';
const $=id=>document.getElementById(id);
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
export function mountPrintKit({session,view,request,renew}){
 const credentials=new Map();let preparing=false,prepared=null;
 try{const saved=JSON.parse(sessionStorage.getItem('pacte-narrative-access-'+session));for(const a of saved?.access??[])credentials.set(a.family,a.token);}catch{}
 const fingerprint=s=>JSON.stringify([s.id,s.code,s.title,s.families.map(f=>[f.id,f.name,f.color.id])]);
 function invalidate(){prepared=null;$('printReadyQR').disabled=true;}
 const remember=(family,token)=>{
  credentials.set(family,token);invalidate();
  try{sessionStorage.setItem('pacte-narrative-access-'+session,JSON.stringify({access:[...credentials].map(([family,token])=>({family,token}))}));}catch{}
 };
 function shell(){invalidate();const root=$('printSheets');root.replaceChildren();root.hidden=false;return root;}
 function sync(s){
  if(prepared&&fingerprint(s)!==prepared.fingerprint){invalidate();$('printSheets').replaceChildren();$('printStatus').textContent='Les équipes ont changé. Préparez les fiches de nouveau.';}
 }
 function card(root,family,title){
  const c=node('article',undefined,'print-card');c.style.borderColor=family.color.hex;
  c.append(node('p',view().title+' · '+view().code,'print-kicker'),node('h2',teamCaption(family)));
  if(title)c.append(node('h3',title));
  root.append(c);return c;
 }
 function print(){if(!$('printSheets').childElementCount)return;document.body.classList.add('printing-kit');window.print();}
 window.addEventListener('afterprint',()=>document.body.classList.remove('printing-kit'));
 $('printFamilyCards').addEventListener('click',()=>{
  const s=view();if(!s)return;const root=shell();
  for(const f of s.families){
   const c=card(root,f,'Ambition secrète · confidentiel');
   if(s.privateFamilies?.[f.id]){
    const family=s.privateFamilies[f.id];
    c.append(node('p',family.role),node('p',family.briefing),node('p',family.trajectory));
    const list=node('ol');for(const goal of family.objectives)list.append(node('li',goal));
    c.append(list,node('p','Jusqu’à 18 points : 10 de chapitre, 2 de trajectoire, 3 d’héritage et 3 pour la fortune finale.'));
    continue;
   }
   const goal=s.goalCards[f.id];
   c.append(node('h3',goal.title),node('p',s.familyGoals[f.id]));
   if(goal.description!==s.familyGoals[f.id])c.append(node('p',goal.description));
   const label=s.skin.labels.resources[goal.indicator]||goal.indicator;
   const direction=goal.direction==='at_most'?'au plus':'au moins';
   c.append(node('p',label+' : '+direction+' '+goal.firstTarget+'/10 → '+s.scoreRules.secretFirst+' points ; '+direction+' '+goal.secondTarget+'/10 → '+s.scoreRules.secretSecond+' points. Les deux paliers se cumulent.'));
  }print();
 });
 $('printRoleCards').addEventListener('click',()=>{
  const s=view();if(!s)return;const root=shell();
  const count=Number($('diplomatCopies').value);
  if(!Number.isInteger(count)||count<1||count>30){$('printStatus').textContent='Choisissez de 1 à 30 cartes Diplomate par famille.';return;}
  for(const f of s.families){
   card(root,f,'Porte-parole').append(node('p','Vous détenez l’unique accès web de votre famille. Consultez votre ambition secrète, écoutez vos partenaires et saisissez les décisions de votre famille lorsque vient son tour.'));
   for(let i=0;i<count;i++)card(root,f,'Diplomate').append(node('p','Négociez avec les autres familles. Rapportez leurs propositions à votre famille et préparez vos alliances. Vous jouez sans accès web ; les accords payés sont confirmés par les porte-paroles.'));
  }print();
 });
 function checked(data,f,token,s){
  if(data.session!==session||data.family!==f.id||data.name!==f.name||data.code!==s.code)throw new Error('Identité du terminal incohérente pour '+teamCaption(f));
  const url=new URL(data.link);
  if(url.origin!==location.origin||url.pathname!=='/founders-family.html'||url.searchParams.get('session')!==session||url.searchParams.get('family')!==f.id||new URLSearchParams(url.hash.slice(1)).get('token')!==token)throw new Error('Lien QR incohérent');
  return data;
 }
 const verify=(s,f,token)=>request('/api/founders/access-qr',{session,family:f.id,token,origin:location.origin}).then(data=>checked(data,f,token,s));
 async function prepareQR(){
  if(preparing)return;const s=view();if(!s)return;preparing=true;
  const root=shell(),stamp=fingerprint(s),cards=[];$('prepareQR').disabled=true;
  $('printStatus').textContent='Vérification de chaque terminal et préparation des fiches…';
  try{
   for(const f of s.families){
    let token=credentials.get(f.id),data;
    if(token){try{data=await verify(s,f,token);}catch(error){if(!error.accessInvalid)throw error;}}
    if(!data){
     const replacement=await request('/api/founders/sessions/'+session+'/access/'+f.id,{});
     if(replacement.family!==f.id)throw new Error('Renouvellement incohérent');
     token=replacement.token;remember(f.id,token);data=await verify(s,f,token);
    }
    cards.push({f,token,data});
   }
   if(fingerprint(view())!==stamp)throw new Error('Les noms des équipes ont changé. Recommencez la préparation.');
   if(new Set(cards.map(c=>c.token)).size!==s.families.length)throw new Error('Les accès des familles ne sont pas uniques');
   // All-or-nothing: never print a partial kit or silently skip a failed family.
   for(const {f,data} of cards){
    const c=card(root,f,s.campaign?null:'Accès privé · terminal officiel');c.dataset.family=f.id;
    const image=node('div',undefined,'print-qr'),svg=new DOMParser().parseFromString(data.svg,'image/svg+xml').documentElement;
    if(svg.localName!=='svg'||svg.querySelector('parsererror'))throw new Error('Image QR invalide');
    image.append(document.importNode(svg,true));
    if(s.campaign){
     c.classList.add('print-hotspring');
     const access=node('header',undefined,'print-hotspring-access'),identity=node('div');
     c.querySelector('.print-kicker').textContent=s.story.title;
     identity.append(...c.children,node('p','Porte-parole, scannez le QR. Gardez cette page ouverte pendant la partie.','print-scan'),node('p','Ce QR est réservé à votre équipe.','print-scan'));
     access.append(identity,image);
     c.append(access,createHotspringRules({print:true,manual:s.campaign.version>=3}));
    }else{
     c.append(image,node('p','Session '+s.code+' · Équipe '+f.id,'print-reference'));
     const instructions=node('ol');for(const t of ['Scannez le QR code.','Vérifiez le nom de votre famille et le code de session affichés.','Gardez cette page ouverte pendant toute la partie.','Un seul terminal officiel est utilisé pour votre famille.'])instructions.append(node('li',t));c.append(instructions);
     c.append(node('h3','Votre application'));
     for(const [title,body] of [['Accueil','« Ma table » : votre situation et vos ressources.'],['Vote','« Votre décision politique » : POUR, CONTRE ou ABSTENTION, puis ajout d’Influence ou passage.'],['Négociation et finances','« Vos négociations » : envoyez une proposition, acceptez ou refusez une somme ; vos fonds sont dans « Vos ressources ».'],['Objectifs','Votre ambition secrète et ses paliers se trouvent sur « Ma table ».']])c.append(node('p',title+' — '+body));
     c.append(node('p','Le porte-parole utilise l’interface officielle. Les autres membres de l’équipe peuvent librement négocier avec les autres familles.'));
    }
    const link=node('a',s.campaign?'Ouvrir le terminal':'Ouvrir le terminal de '+f.name,s.campaign?'print-preview-link':null);
    link.href=data.link;c.append(link);
    if(!s.campaign)c.append(node('p','Confidentiel. Accès valable 24 h après sa création. Régénérer un accès invalide le QR précédent.','small'));
   }
   prepared={fingerprint:stamp,cards};$('printReadyQR').disabled=false;
   $('printStatus').textContent=cards.length+'/'+s.families.length+' fiches vérifiées. Les accès absents ou expirés ont été remplacés ; distribuez ces nouvelles fiches.';
  }catch(error){root.replaceChildren();invalidate();$('printStatus').textContent='Impression bloquée : '+error.message;}
  finally{preparing=false;$('prepareQR').disabled=false;}
 }
 $('prepareQR').addEventListener('click',prepareQR);
 async function printVerified(){
  if(!prepared||preparing)return;preparing=true;$('printReadyQR').disabled=true;
  try{
   const kit=prepared,s=view();if(fingerprint(s)!==kit.fingerprint)throw new Error('Les équipes ont changé');
   for(const {f,token} of kit.cards)await verify(s,f,token);
   if(prepared!==kit||fingerprint(view())!==kit.fingerprint)throw new Error('Les fiches ont changé');
   $('printReadyQR').disabled=false;print();
  }catch(error){invalidate();$('printStatus').textContent='Impression bloquée : '+error.message+'. Préparez de nouveau les fiches.';}
  finally{preparing=false;}
 }
 $('printReadyQR').addEventListener('click',printVerified);
 return {remember,sync,prepare:prepareQR,print:printVerified};
}
