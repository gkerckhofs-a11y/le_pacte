import {teamCaption} from './founders-identity.js';
const $=id=>document.getElementById(id);
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
export function mountPrintKit({session,view,request,renew}){
 const credentials=new Map();
 try{const saved=JSON.parse(sessionStorage.getItem('pacte-narrative-access-'+session));if(saved&&Date.now()-saved.created<86400000)for(const a of saved.access)credentials.set(a.family,a.token);}catch{}
 const remember=(family,token)=>{
  credentials.set(family,token);
  try{sessionStorage.setItem('pacte-narrative-access-'+session,JSON.stringify({created:Date.now(),access:[...credentials].map(([family,token])=>({family,token}))}));}catch{}
 };
 function shell(){$('printReadyQR').disabled=true;const root=$('printSheets');root.replaceChildren();return root;}
 function card(root,family,title){
  const c=node('article',undefined,'print-card');c.style.borderColor=family.color.hex;
  c.append(node('p',view().title+' · '+view().code,'print-kicker'),node('h2',teamCaption(family)),node('h3',title));root.append(c);return c;
 }
 function print(){document.body.classList.add('printing-kit');window.print();}
 window.addEventListener('afterprint',()=>document.body.classList.remove('printing-kit'));
 $('printFamilyCards').addEventListener('click',()=>{
  const s=view();if(!s)return;const root=shell();
  for(const f of s.families){
   const goal=s.goalCards[f.id],c=card(root,f,'Ambition secrète · confidentiel');
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
 async function prepareQR(){
  const s=view();if(!s)return;const root=shell();let available=0;
  $('printStatus').textContent='Vérification des accès privés…';
  for(const f of s.families){
   const token=credentials.get(f.id);if(!token)continue;
   try{
    const data=await request('/api/founders/access-qr',{session,token,origin:location.origin});
    if(data.family!==f.id)throw new Error('Famille incohérente');
    const c=card(root,f,'Accès privé · porte-parole');
    const image=node('div',undefined,'print-qr');
    // SVG is produced exclusively by the trusted same-origin QR encoder.
    const svg=new DOMParser().parseFromString(data.svg,'image/svg+xml').documentElement;
    image.append(document.importNode(svg,true));c.append(image);
    const link=node('a','Ouvrir le tableau de bord de l’équipe');link.href=data.link;c.append(link);
    c.append(node('p','Un seul accès par famille. Ne pas projeter ni partager avec les autres équipes. Valable 24 h après sa création ; un renouvellement invalide le précédent.','small'));
    available++;
   }catch{credentials.delete(f.id);}
  }
  $('printSheets').hidden=false;$('printReadyQR').disabled=!available;
  $('printStatus').textContent=available+'/'+s.families.length+' QR prêts. Pour les accès absents ou expirés, utilisez « Renouveler le lien privé » dans les équipes ci-dessous, puis préparez les QR de nouveau.';
 }
 $('prepareQR').addEventListener('click',prepareQR);
 $('printReadyQR').addEventListener('click',print);
 return {remember};
}
