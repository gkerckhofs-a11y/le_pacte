export function setupProjectionFullscreen(button,notice,doc=document){
 const root=doc.documentElement;
 const supported=typeof root.requestFullscreen==='function'&&doc.fullscreenEnabled!==false;
 if(!supported){button.disabled=true;button.textContent='Plein écran indisponible';button.title='Utilisez le mode plein écran du navigateur si disponible.';return;}
 const sync=()=>{const active=Boolean(doc.fullscreenElement);button.textContent=active?'Quitter le plein écran':'Plein écran';button.setAttribute('aria-pressed',String(active));};
 doc.addEventListener('fullscreenchange',sync);
 button.addEventListener('click',async()=>{
  try{if(doc.fullscreenElement)await doc.exitFullscreen();else await root.requestFullscreen();sync();}
  catch{notice.textContent='Le navigateur a refusé le plein écran. Réessayez avec ce bouton ou utilisez le plein écran du navigateur.';}
 });sync();
}
