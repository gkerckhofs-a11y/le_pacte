// Content authoring only: previews never create a session or invoke game commands.
export async function openStudio(ctx){
 const {request,esc,field,opts,status,notify,catalog,map,powers,effects,previewMap}=ctx;
 const root=document.querySelector('#main');let listing,current=null,dirty=false,previewMode='projection',editGeneration=0,working=false;
 const friendly=path=>{
  const p=path.split('.'),names={title:'Titre',pitch:'Accroche',introduction:'Texte d’introduction',conclusion:'Texte de conclusion',means:'Moyens',influence:'Influence',stability:'Stabilité',prestige:'Prestige',council:'Conseil'};
  if(p[0]==='territoryLabels')return 'Territoire '+p[1];
  if(p[0]==='factionLabels')return 'Nom de la faction';
  if(p[0]==='factionPitches')return 'Présentation de la faction';
  if(p[0]==='factionPowerText')return 'Récit du pouvoir';
  if(p[0]==='secretObjectiveText')return 'Intitulé de l’objectif '+p[1];
  if(p[0]==='councils')return p[2]==='title'?'Titre du Conseil':p[2]==='optionAText'?'Récit de l’option A':'Récit de l’option B';
  return names[p.at(-1)]??path;
 };
 const text=(path,value,max=120)=>field(friendly(path),`<input data-path="${esc(path)}" value="${esc(value)}" maxlength="${max}" required>`);
 const area=(path,value,max=600)=>field(friendly(path),`<textarea data-path="${esc(path)}" rows="3" maxlength="${max}">${esc(value??'')}</textarea>`);
 async function load(){listing=await request('/api/studio');status(true);renderList();}
 function nav(){return '<a href="/" class="screen-link">← Revenir aux parties</a>';}
 function renderList(){
  current=null;dirty=false;root.innerHTML=`${nav()}<div class="section-heading"><div><p class="eyebrow">STUDIO · UNIVERS & SCÉNARIOS</p><h1>Une même règle.<br><em>Vos propres univers.</em></h1><p>Créez les contenus, vérifiez-les puis figez une version pour vos parties.</p></div><span class="badge">CONTENUS LOCAUX · 0.3</span></div><div class="studio-list-grid"><section class="panel"><h2>Partir d’un univers</h2><p>Les exemples servent de base. Les textes manquants doivent être complétés avant publication.</p>${catalog.map(e=>`<div class="session-item"><div><h3>${esc(e.title)}</h3><small>${esc(e.pitch)}</small></div><button data-theme="${e.themeId}">Dupliquer</button></div>`).join('')}<h3>Importer un contenu JSON</h3><input id="studio-import" type="file" accept="application/json,.json"><p class="muted">Format d’export du studio, 128 Ko maximum. L’import crée toujours un nouveau brouillon.</p></section><section><h2>Brouillons et éditions</h2>${listing.drafts.length?listing.drafts.map(d=>`<div class="panel"><span class="eyebrow">${d.status==='published'?'CONTENUS PUBLIÉS':'BROUILLON'} · RÉVISION ${d.revision}</span><h3>${esc(d.title)}</h3><div class="controls"><button data-open-draft="${d.id}">${d.status==='published'?'Consulter':'Éditer'}</button><button class="quiet" data-copy-draft="${d.id}">Dupliquer</button></div></div>`).join(''):'<p class="empty">Dupliquez un univers pour commencer.</p>'}<h2>Versions figées</h2>${listing.releases.map(r=>`<div class="panel"><p class="eyebrow">VERSION ${r.version}.0.0</p><h3>${esc(r.title)}</h3><div class="controls"><button data-release="${r.id}">Consulter</button><button class="quiet" data-new-version="${r.id}">Nouvelle version</button></div><small>Empreinte ${esc(r.checksum.slice(0,12))}…</small></div>`).join('')}</section></div>`;
 }
 async function newDraft(source){if(dirty&&!confirm('Quitter ce brouillon sans enregistrer ?'))return;current=await request('/api/studio/drafts',{method:'POST',data:source});dirty=false;renderEditor();}
 function readForm(){
  const e=structuredClone(current.edition);
  root.querySelectorAll('[data-path]').forEach(el=>{let target=e;const path=el.dataset.path.split('.');for(const k of path.slice(0,-1))target=target[k]??=(/^\d+$/.test(k)?[]:{});target[path.at(-1)]=el.value;});
  if(root.querySelector('#builtin-assets').checked)e.assets=structuredClone(listing.builtinAssets);
  else e.assets=Object.fromEntries(Object.keys(listing.builtinAssets).map(k=>[k,k==='audioOptional'?null:'TO_CREATE']));
  return e;
 }
 function renderEditor(){
  const e=current.edition,readOnly=current.status==='published'||current.isRelease;
  root.innerHTML=`${nav()}<div class="section-heading"><div><p id="studio-revision" class="eyebrow">${readOnly?'VERSION FIGÉE · LECTURE SEULE':`BROUILLON · RÉVISION ${current.revision}`}</p><h1>${esc(e.title)}</h1><p>Règles neutres V1.1 · 33 territoires · 60 connexions. Ces règles restent fixes.</p></div><button class="quiet" data-studio-action="back">Catalogue du studio</button></div><div class="studio-workspace"><section class="panel"><form id="studio-editor"><fieldset ${readOnly?'disabled':''}><legend>CONTENUS DE L’ÉDITION</legend><details open><summary>Identité, introduction et fin</summary>${text('title',e.title)}${area('pitch',e.pitch,500)}${field('Habillage intégré',`<select data-path="themeId">${opts(catalog.map(c=>[c.themeId,c.themeId]),e.themeId)}</select>`)}${area('introduction',e.introduction,2000)}${area('conclusion',e.conclusion,2000)}</details><details><summary>Vocabulaire des ressources</summary>${Object.keys(e.resourceLabels).map(k=>text(`resourceLabels.${k}`,e.resourceLabels[k],60)).join('')}</details><details><summary>Six factions, récits et couleurs</summary>${map.archetypes.map(id=>`<section class="studio-faction"><h3>${esc(id)}</h3><div class="orders-grid">${text(`factionLabels.${id}`,e.factionLabels[id],80)}${field('Couleur',`<input type="color" data-path="factionColors.${id}" value="${esc(e.factionColors[id])}">`)}</div>${area(`factionPitches.${id}`,e.factionPitches?.[id])}${area(`factionPowerText.${id}`,e.factionPowerText?.[id])}<p class="rule-fixed"><b>Règle fixe :</b> ${esc(powers[id])}</p></section>`).join('')}</details><details><summary>33 noms de territoires</summary><div class="territory-editor">${map.zones.map(z=>text(`territoryLabels.${z}`,e.territoryLabels[z],80)).join('')}</div></details><details><summary>Cinq Conseils et récits des options</summary>${e.councils.map((c,i)=>`<section class="studio-faction"><h3>Manche ${c.round}</h3>${text(`councils.${i}.title`,c.title)}${area(`councils.${i}.optionAText`,c.optionAText,500)}<p class="rule-fixed"><b>A · ${esc(c.optionAEffectId)}</b><br>${esc(effects[c.optionAEffectId])}</p>${area(`councils.${i}.optionBText`,c.optionBText,500)}<p class="rule-fixed"><b>B · ${esc(c.optionBEffectId)}</b><br>${esc(effects[c.optionBEffectId])}</p></section>`).join('')}</details><details><summary>Six intitulés d’objectifs secrets</summary>${Object.entries(listing.goalRules).map(([id,rule])=>`${text(`secretObjectiveText.${id}`,e.secretObjectiveText[id],300)}<p class="rule-fixed">${esc(rule)} Bonus : +4 Prestige.</p>`).join('')}</details><details><summary>Habillage et médias</summary><label class="checkbox-label"><input id="builtin-assets" type="checkbox" ${Object.entries(listing.builtinAssets).every(([k,v])=>e.assets?.[k]===v)?'checked':''}> Utiliser la carte SVG, le titre typographique et les palettes intégrés</label><p>Cette tranche utilise les habillages vectoriels du jeu. L’import d’illustrations et de sons personnalisés n’est pas encore pris en charge. Aucun média distant n’est chargé.</p></details></fieldset><div class="controls">${readOnly?'': '<button type="submit">Enregistrer le brouillon</button><button type="button" class="quiet" data-studio-action="check">Vérifier avant publication</button><button type="button" class="quiet" data-studio-action="publish">Publier une version figée</button>'}<button type="button" class="quiet" data-studio-action="export">Exporter JSON</button></div></form><div id="studio-errors" role="status"></div></section><aside class="studio-preview"><section class="panel"><p class="eyebrow">PRÉVISUALISATION · AUCUN EFFET SUR LES PARTIES</p>${field('Écran',`<select id="preview-mode">${opts([['projection','Projection'],['team','Équipe'],['organizer','Régie']],previewMode)}</select>`)}<div id="studio-preview-content"></div></section></aside></div>`;
  root.querySelector('#studio-editor').onsubmit=async ev=>{ev.preventDefault();if(working)return;working=true;try{await save();notify('Brouillon enregistré.');}catch(err){notify(err.message,true);}finally{working=false;}};
  root.querySelector('#studio-editor').addEventListener('input',()=>{dirty=true;editGeneration++;updatePreview();});root.querySelector('#preview-mode').onchange=ev=>{previewMode=ev.target.value;updatePreview();};updatePreview();
 }
 function updatePreview(){
  const e=readForm(),id=map.archetypes[0];let html;
  if(previewMode==='projection')html=`<p class="eyebrow">${esc(e.themeId)} · 33 ZONES</p><h2>${esc(e.title)}</h2><p>${esc(e.pitch)}</p><p class="narrative">${esc(e.introduction??'Introduction à compléter.')}</p>${previewMap(e)}`;
  else if(previewMode==='team')html=`<p class="eyebrow">ÉQUIPE 1 · APERÇU FICTIF</p><h2>${esc(e.factionLabels[id])}</h2><p>${esc(e.factionPitches?.[id]??'Récit à compléter.')}</p><p>${esc(e.factionPowerText?.[id]??'Description du pouvoir à compléter.')}</p><p class="rule-fixed">${esc(powers[id])}</p><div class="resource-grid"><div><strong>3</strong><span>${esc(e.resourceLabels.means)}</span></div><div><strong>2</strong><span>${esc(e.resourceLabels.influence)}</span></div></div><h3>${esc(e.secretObjectiveText.O1)}</h3><p>${esc(listing.goalRules.O1)}</p>`;
  else html=`<p class="eyebrow">RÉGIE · APERÇU FICTIF</p><h2>${esc(e.title)}</h2><p>Six factions · cinq manches · 150 minutes</p>${map.archetypes.map((id,i)=>`<p>${i+1} · ${esc(e.factionLabels[id])}</p>`).join('')}<h3>${esc(e.councils[0].title)}</h3><p>A : ${esc(e.councils[0].optionAText??'Récit à compléter.')}</p><p class="rule-fixed">${esc(effects[e.councils[0].optionAEffectId])}</p><p>B : ${esc(e.councils[0].optionBText??'Récit à compléter.')}</p><p class="rule-fixed">${esc(effects[e.councils[0].optionBEffectId])}</p>`;
  root.querySelector('#studio-preview-content').innerHTML=html;
 }
 async function save(){if(current.isRelease||current.status==='published')return;const generation=editGeneration;current=await request(`/api/studio/drafts/${current.id}`,{method:'PUT',data:{revision:current.revision,edition:readForm()}});dirty=generation!==editGeneration;root.querySelector('#studio-revision').textContent=`BROUILLON · RÉVISION ${current.revision}`;if(dirty)throw new Error('Le contenu a changé pendant l’enregistrement. Vos modifications restent dans le formulaire ; enregistrez à nouveau.');}
 function showErrors(errors){root.querySelector('#studio-errors').innerHTML=errors.length?`<h3>À compléter ou corriger</h3><ul>${errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`:'<p class="confirmed">Les contenus requis sont complets. Les règles et les identifiants sont valides.</p>';}
 function download(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 root.onclick=async ev=>{
  const b=ev.target.closest('button');if(!b||working||(b.type==='submit'&&b.form?.id==='studio-editor'))return;working=true;
  try{
   if(b.dataset.theme)await newDraft({themeId:b.dataset.theme});
   if(b.dataset.copyDraft)await newDraft({draftId:b.dataset.copyDraft});
   if(b.dataset.newVersion)await newDraft({releaseId:b.dataset.newVersion});
   if(b.dataset.openDraft){current=await request(`/api/studio/drafts/${b.dataset.openDraft}`);dirty=false;renderEditor();}
   if(b.dataset.release){current={...await request(`/api/studio/releases/${b.dataset.release}`),isRelease:true,status:'published'};dirty=false;renderEditor();}
   const action=b.dataset.studioAction;
   if(action==='back'){if(!dirty||confirm('Quitter sans enregistrer ?'))await load();}
   if(action==='check'){await save();const r=await request(`/api/studio/drafts/${current.id}/check`,{method:'POST',data:{}});showErrors(r.errors);notify('Vérification des contenus terminée.');}
   if(action==='publish'){
    await save();const r=await request(`/api/studio/drafts/${current.id}/check`,{method:'POST',data:{}});showErrors(r.errors);if(r.errors.length)return;
    if(!confirm(`Publier « ${current.edition.title} » ? Cette version sera immuable. Une nouvelle version sera nécessaire pour les changements ultérieurs.`))return;
    const published=await request(`/api/studio/drafts/${current.id}/publish`,{method:'POST',data:{revision:current.revision}});current={...published,isRelease:true,status:'published'};dirty=false;renderEditor();notify('Version figée publiée. Elle est disponible pour créer une partie.');
   }
   if(action==='export'){if(!current.isRelease&&current.status!=='published')await save();const collection=current.isRelease?'releases':'drafts';download(await request(`/api/studio/${collection}/${current.id}/export`),'Le_Pacte_Univers.json');}
  }catch(err){notify(err.message,true);}finally{working=false;}
 };
 root.addEventListener('change',async ev=>{if(ev.target.id!=='studio-import'||!ev.target.files?.length||working)return;working=true;try{const file=ev.target.files[0];if(file.size>131072)throw new Error('Fichier trop volumineux : maximum 128 Ko.');await newDraft({import:JSON.parse(await file.text())});}catch(err){notify(err.message,true);}finally{working=false;}});
 // Warn about browser navigation only while there are actual unsaved edits.
 window.addEventListener('beforeunload',ev=>{if(dirty){ev.preventDefault();ev.returnValue='';}});
 await load();
}
