import {westernBoard} from './western-board.js';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{
 const response=await fetch('/api/catalog');if(!response.ok)throw Error('Le catalogue est indisponible.');const {map,editions}=await response.json(),edition=editions.find(e=>e.themeId==='western');if(!edition)throw Error('L’univers Far West est indisponible.');
 const owners=Object.fromEntries(map.zones.map(z=>[z,/^[CP]/.test(z)?map.archetypes[Number(z.slice(1))-1]:null]));let selected=null;
 document.querySelector('#map-holder').innerHTML=westernBoard(map,edition,owners);
 document.querySelector('#faction-key').innerHTML=map.archetypes.map((id,i)=>`<span><b style="--owner:${edition.factionColors[id]}">${i+1}</b>${escape(edition.factionLabels[id])}</span>`).join('');
 function choose(z){selected=z;document.querySelectorAll('[data-zone]').forEach(el=>{el.classList.toggle('selected',el.dataset.zone===z);el.classList.toggle('neighbor',map.neighbors[z].includes(el.dataset.zone));el.setAttribute('aria-pressed',String(el.dataset.zone===z));});document.querySelectorAll('[data-edge]').forEach(el=>el.classList.toggle('linked',el.dataset.edge.split(':').includes(z)));const owner=owners[z];document.querySelector('#territory-info').innerHTML=`<span class="eyebrow">${z} · ${z[0]==='S'?'SITE STRATÉGIQUE':z[0]==='C'?'CAPITALE IMPRENABLE':z[0]==='F'?'PASSAGE':'PROVINCE'}</span><h2>${escape(edition.territoryLabels[z])}</h2><p>${owner?escape(edition.factionLabels[owner]):'Territoire neutre'} · Pistes vers ${map.neighbors[z].map(n=>escape(n+' '+edition.territoryLabels[n])).join(' · ')}</p>`;}
 document.querySelector('#map-holder').addEventListener('click',e=>{const z=e.target.closest('[data-zone]');if(z)choose(z.dataset.zone);});
 document.querySelector('#map-holder').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const z=e.target.closest('[data-zone]');if(z){e.preventDefault();choose(z.dataset.zone);}}});
 let zoom=100;for(const [id,delta] of [['zoom-in',25],['zoom-out',-25]])document.getElementById(id).onclick=()=>{zoom=Math.max(100,Math.min(250,zoom+delta));document.querySelector('#board').style.width=zoom+'%';};
}catch(e){document.querySelector('#map-holder').textContent=e.message;}
