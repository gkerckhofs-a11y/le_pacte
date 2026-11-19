import {rememberAccess,organizerWorkspace} from './founders-workspace.js';
import {TEAM_COLORS,DEFAULT_TEAM_COLORS} from './founders-identity.js';
import {HOTSPRING, isCurrentHotspring, narrativeRegie} from './founders-univers.js';

const $=id=>document.getElementById(id);
const defaults=['Les Mercer','Les Doyle','Les Vance','Les Caldwell','Les Whitmore'];
let configurations=[],retainedSettings={};
const resources=['initialPower','initialDollars','initialPool'];
const status=(text,error=false)=>{$('status').textContent=text;$('status').dataset.error=String(error);};
const element=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
function labelled(text,control,id){
 control.id=id;
 const label=element('label',text);
 label.htmlFor=id;label.append(control);return label;
}
const families=defaults.map((initial,i)=>{
 const row=element('div');row.className='family-row';
 const name=element('input'),color=element('select'),size=element('input');
 name.value=initial;name.maxLength=60;name.required=true;
 for(const choice of TEAM_COLORS){const option=element('option',choice.symbol+' '+choice.label);option.value=choice.id;color.append(option);}
 color.value=DEFAULT_TEAM_COLORS[i];
 size.type='number';size.min='1';size.max='300';size.value='5';size.required=true;
 row.append(labelled('Famille '+(i+1),name,'family-name-'+i),labelled('Couleur',color,'family-color-'+i),labelled('Effectif',size,'family-size-'+i));
 $('familySettings').append(row);
 return {name,color,size};
});
const request=organizerWorkspace({onOpen:loadConfigurations,status,localAction:'Ouvrir la préparation'});
const api=(path,method,body)=>request('/api/founders/'+path,method,body);
function selection(){
 if(!$('gameForm').reportValidity())return null;
 const names=families.map(f=>f.name.value.trim()),colors=families.map(f=>f.color.value),members=families.map(f=>Number(f.size.value));
 if(!names.every(Boolean)||new Set(colors).size!==families.length)throw new Error('Renseignez chaque nom et choisissez cinq couleurs distinctes.');
 const calibration={...Object.fromEntries(resources.map(key=>[key,Number($(key).value)])),
  city:{economie:5,ecologie:5,securite:5,demographie:5,bien_etre:5}};
 return {...retainedSettings,...HOTSPRING,names,colors,members,calibration,crisisMode:$('crisisMode').value};
}
async function loadConfigurations(){
 const data=await api('configurations');
 configurations=data.configurations.filter(c=>isCurrentHotspring(c.config));
 const select=$('savedConfig');
 select.replaceChildren();
 for(const c of configurations){const option=element('option',c.name);option.value=c.id;select.append(option);}
 if(!configurations.length)select.append(element('option','Aucun modèle Hotspring'));
 $('useConfiguration').disabled=!configurations.length;
 $('loginPanel').hidden=true;$('gameForm').hidden=$('savedConfigurations').hidden=false;
}
$('useConfiguration').addEventListener('click',()=>{
 const preset=configurations.find(c=>c.id===$('savedConfig').value);
 if(!preset)return;
 const {names,colors,members,crisisMode,calibration,timing,gaugeThresholds,presentationSeconds}=preset.config;
 retainedSettings={timing,gaugeThresholds,presentationSeconds};
 for(const key of resources)$(key).value=calibration[key];
 families.forEach((f,i)=>{f.name.value=names[i];f.color.value=colors[i];f.size.value=members[i];});
 $('crisisMode').value=crisisMode??'standard';
 $('configurationName').value=preset.name;
 status('Modèle chargé.');
});
$('saveConfiguration').addEventListener('click',async()=>{
 const button=$('saveConfiguration');
 button.disabled=true;
 try{
  const config=selection();if(!config)return;
  const name=$('configurationName').value.trim();if(!name)throw new Error('Donnez un nom au modèle.');
  const saved=await api('configurations','POST',{name,config});
  await loadConfigurations();$('savedConfig').value=saved.id;
  status('Configuration enregistrée.');
 }catch(e){status(e.message,true);}
 finally{button.disabled=false;}
});
$('gameForm').addEventListener('submit',async event=>{
 event.preventDefault();
 const button=$('createNarrative');button.disabled=true;
 try{
  const config=selection();if(!config)return;
  const code='HS'+crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase();
  status('Création de la partie…');
  const result=await api('sessions','POST',{...config,title:$('gameTitle').value.trim(),code});
  rememberAccess(result);
  location.assign(narrativeRegie(result.id,true));
 }catch(e){status(e.message,true);}
 finally{button.disabled=false;}
});
