const $=id=>document.getElementById(id);
export function rememberAccess(result){
 // Raw credentials stay in this tab session, never in saved configurations.
 try{sessionStorage.setItem('pacte-narrative-access-'+result.id,JSON.stringify({created:Date.now(),access:result.access}));}catch{}
}
export function mountWorkspace({api,getCatalog,collect,apply}){
 let configs=[];
 async function refresh(){
  const results=await Promise.allSettled([api('/api/founders/configurations'),api('/api/founders/sessions')]);
  if(results[0].status==='fulfilled'){
   configs=results[0].value.configurations;
   const select=$('savedConfig');select.replaceChildren();
   for(const c of configs){const o=document.createElement('option');o.value=c.id;o.textContent=c.name+' · '+c.config.scenarioVersion;select.append(o);}
   $('savedConfigurations').hidden=false;$('useConfiguration').disabled=!configs.length;
   if(!configs.length){const o=document.createElement('option');o.textContent='Aucune configuration enregistrée';select.append(o);}
  }else $('configurationMessage').textContent=results[0].reason.message;
  if(results[1].status==='fulfilled'){
   const root=$('recentGamesList');root.replaceChildren();$('recentGames').hidden=false;
   const phases={READY:'Prête',COUNCIL:'Conseil en cours',AWAITING_REVEAL:'À révéler',REVEALED:'Résultat affiché',FINISHED:'Terminée'};
   for(const s of results[1].value.sessions.slice(0,6)){
    const a=document.createElement('a');a.href='/founders-regie.html?session='+encodeURIComponent(s.id);
    a.textContent=s.title+' · '+s.code+' · '+(phases[s.phase]??s.phase)+' →';root.append(a);
   }
   if(!root.children.length)root.textContent='Votre première partie apparaîtra ici.';
  }
 }
 $('useConfiguration').addEventListener('click',()=>{
  const c=configs.find(c=>c.id===$('savedConfig').value);if(!c)return;
  const story=getCatalog().scenarios.find(s=>s.id===c.config.scenarioId);
  if(!story?.releases.includes(c.config.scenarioVersion)){$('configurationMessage').textContent='Cette version du scénario n’est plus disponible. Choisissez une version publiée.';return;}
  apply(c.config);$('gameTitle').value=c.name;$('configurationName').value=c.name;
 });
 $('saveConfiguration').addEventListener('click',async()=>{
  const button=$('saveConfiguration');button.disabled=true;
  try{
   const saved=await api('/api/founders/configurations','POST',{name:$('configurationName').value,config:collect()});
   await refresh();$('savedConfig').value=saved.id;
   $('configurationMessage').textContent='Configuration enregistrée dans votre compte. Retrouvez-la dans « Mes configurations » pour créer une nouvelle partie.';
  }catch(e){$('configurationMessage').textContent=e.message;}
  finally{button.disabled=false;}
 });
 return {refresh};
}
