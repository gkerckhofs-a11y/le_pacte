import {SKIN_DESIGNS,applySkin,applyTeamTheme} from './founders-skin-theme.js';
import {TEAM_COLORS} from './founders-identity.js';
import {mountCity,updateCity} from './founders-city-scene.js';
const $=id=>document.getElementById(id);
const keys=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const city=Object.fromEntries(keys.map(k=>[k,5]));
let skins=[],selected=null,mounted=null;
function render(){
 if(!selected)return;
 const design=applySkin(document.body,selected);
 $('skinMood').textContent=design.subtitle;$('sceneTitle').textContent=design.sceneTitle;
 if(mounted!==selected.id){mountCity($('city'),selected.id);mounted=selected.id;}
 const states=updateCity($('city'),city,selected.id,selected.labels.resources);
 $('sceneDescription').textContent=Object.values(states).map(s=>s.description).join(' ');
 for(const key of keys){$('label-'+key).textContent=selected.labels.resources[key]+' · '+city[key]+'/10';$('range-'+key).value=city[key];}
 const color=TEAM_COLORS.find(c=>c.id===$('sampleColor').value);
 applyTeamTheme($('teamSample'),color,selected);
 $('sampleIdentity').textContent=color.symbol+' Équipe '+color.label;
 $('sampleFamily').textContent={western:'Famille Blackwood',mafia:'Famille Ashford',medieval:'Maison Ronceval',corporate:'Délégation Horizon',futuriste:'Collectif Nova'}[selected.id];
 $('sampleInfluence').textContent=selected.labels.influence;$('sampleCurrency').textContent=selected.labels.currency;
 history.replaceState(null,'','?skin='+selected.id+'&color='+color.id);
}
async function init(){
 const response=await fetch('/founders-skins.json');if(!response.ok)throw new Error('Catalogue des habillages indisponible');
 skins=(await response.json()).skins.filter(s=>Object.hasOwn(SKIN_DESIGNS,s.id));
 const query=new URLSearchParams(location.search);
 for(const color of TEAM_COLORS){const option=document.createElement('option');option.value=color.id;option.textContent=color.symbol+' '+color.label;$('sampleColor').append(option);}
 if(TEAM_COLORS.some(c=>c.id===query.get('color')))$('sampleColor').value=query.get('color');
 selected=skins.find(s=>s.id===query.get('skin'))??skins[0];
 for(const skin of skins){
  const label=document.createElement('label');label.className='skin-option';
  const radio=document.createElement('input');radio.type='radio';radio.name='skin';radio.value=skin.id;radio.checked=skin.id===selected.id;radio.setAttribute('aria-label',SKIN_DESIGNS[skin.id].title);
  const dots=document.createElement('span');dots.className='skin-swatches';dots.setAttribute('aria-hidden','true');
  for(const hex of [skin.theme.background,SKIN_DESIGNS[skin.id].accent,skin.theme.foreground]){const dot=document.createElement('i');dot.style.background=hex;dots.append(dot);}
  const name=document.createElement('strong');name.textContent=SKIN_DESIGNS[skin.id].title;
  const mood=document.createElement('small');mood.textContent=SKIN_DESIGNS[skin.id].subtitle;
  label.append(radio,dots,name,mood);radio.addEventListener('change',()=>{selected=skin;render();});$('skinPicker').append(label);
 }
 for(const key of keys){
  const field=document.createElement('div');field.className='field';
  const label=document.createElement('label');label.id='label-'+key;label.htmlFor='range-'+key;
  const input=document.createElement('input');input.id='range-'+key;input.type='range';input.min='0';input.max='10';input.value='5';
  input.addEventListener('input',()=>{city[key]=Number(input.value);render();});field.append(label,input);$('skinControls').append(field);
 }
 $('sampleColor').addEventListener('change',render);
 for(const button of document.querySelectorAll('[data-stage]'))button.addEventListener('click',()=>{for(const key of keys)city[key]=Number(button.dataset.stage);render();});
 render();
}
init().catch(e=>{$('skinNotice').textContent=e.message;});
