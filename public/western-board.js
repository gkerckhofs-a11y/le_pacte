// Presentation only: every route is supplied by the authoritative game graph.
import {westernPositions,westernRegions} from './western-territories.js';
export {westernPositions,westernRegions};
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function labelLines(name){const words=String(name).split(/\s+/),lines=[''];for(const word of words){const n=lines.length-1;if(lines[n]&&(lines[n]+' '+word).length>20)lines.push(word);else lines[n]+=(lines[n]?' ':'')+word;}return lines;}
// Original vector miniatures, drawn at map scale with a consistent light source.
function landmark(z){
 const shape=(d,fill,stroke='#49382b',width=1.2)=>`<path d="${d}" style="fill:${fill};stroke:${stroke};stroke-width:${width};stroke-linejoin:round;stroke-linecap:round"/>`;
 const line=(d,color='#76553b',width=1)=>shape(d,'none',color,width);
 const shadow='<ellipse cx="1" cy="25" rx="39" ry="9" style="fill:#342717;fill-opacity:.22;stroke:none"/>';
 const window=(x,y)=>`<path d="M${x} ${y}v7l5 1.6v-7Z" style="fill:#354647;stroke:#e1c59a;stroke-width:1"/>`;
 if(z[0]==='C')return shadow+
  shape('M-32-10L7-27 35-11 8 6Z','#cfb080')+
  shape('M-35-4L8 10V30L-35 15Z','#b18a56')+shape('M8 10L36-6V14L8 30Z','#826442')+
  line('M-31-2V16M-25 0V18M-19 2V20M-13 4V22M-7 6V24M-1 8V26M5 10V28M14 8V25M20 4V21M26 0V18M32-3V15','#604831',1.1)+
  shape('M-21 11L-11 14V25L-21 22Z','#473a2b')+line('M-16 13V23','#be9a68')+
  shape('M-34-21L-20-17V-1L-34-5Z','#cca06b')+shape('M-20-17L-12-22V-7L-20-1Z','#88653e')+
  shape('M-38-23L-27-33-8-24-20-15Z','#714a36')+line('M-27-33L-20-15','#af8060')+window(-30,-17)+
  shape('M19-22L31-18V-3L19-7Z','#cca06b')+shape('M31-18L38-22V-8L31-3Z','#88653e')+
  shape('M15-24L26-33 42-25 31-16Z','#714a36')+window(23,-18)+
  line('M5-9V-39','#5a4230',1.6)+shape('M6-39L21-35 6-29Z','var(--owner)','#49382b',.8);
 if(z==='S1')return shadow+
  shape('M-30-3L12 10V31L-30 17Z','#cba776')+shape('M12 10L37-3V17L12 31Z','#9c774e')+
  shape('M-35-6L-13-26 41-6 13 12Z','#76503d')+line('M-13-26L13 12M-24-16L26 2M-29-10L18 8','#ad7d58')+
  line('M-28 3L10 15M-28 9L10 21M-28 15L10 27M16 14L34 4M16 20L34 10','#a17b50',.8)+
  shape('M-13 8L3 13V28L-13 23Z','#6c5035')+line('M-5 11V25M-12 10L2 26M2 15L-12 21','#d9b481')+window(-25,5)+window(21,8)+
  shape('M-42 15L-31 11-23 16-34 21Z','#d4ad73')+shape('M-42 15L-34 21V31L-42 25Z','#b78b55')+shape('M-34 21L-23 16V26L-34 31Z','#896540')+line('M-40 18L-35 23M-33 24L-25 20','#6e5237');
 if(z==='S2')return shadow+
  shape('M2 24L8 9 22-7 39 2 46 25Z','#ad9671','#76654b')+
  shape('M18 22V11Q27-4 36 11V25Z','#302e26')+line('M17 24V10Q27-6 37 11V26','#765437',4)+
  line('M-16 24L-9-31M11 27L7-31M-15 16L10 19M-13 1L9 4M-11-15L8-12M-14 15L8-12M-10-15L10 19','#755034',3)+
  shape('M-14-33L5-38 15-29-8-23Z','#8a5a3b')+shape('M-14-33L-8-23V-13L-14-21Z','#bd915e')+shape('M-8-23L15-29V-18L-8-13Z','#a07548')+
  '<circle cx="-2" cy="-7" r="5" style="fill:#65503a;stroke:#332e25;stroke-width:1.5"/>'+line('M-2-12V-2M-7-7H3M-2-2V23','#c3a779',1)+
  shape('M-39 14L-20 12-13 19-33 23Z','#535a52')+shape('M-39 14L-33 23-32 29-38 24Z','#777d70')+shape('M-33 23L-13 19-15 26-32 29Z','#4c524b')+
  '<circle cx="-32" cy="29" r="3" style="fill:#352e25;stroke:#b49b72;stroke-width:1"/><circle cx="-18" cy="27" r="3" style="fill:#352e25;stroke:#b49b72;stroke-width:1"/>';
 return shadow+
  shape('M-29-13L12-1V30L-29 17Z','#e6d3a7')+shape('M12-1L36-13V16L12 30Z','#b69c71')+
  shape('M-33-15L-11-31 40-16 13 1Z','#765348')+
  shape('M-29-14V-25L-9-20 12-15V-1Z','#ddc399')+line('M-29-25L12-13M-26-17L9-6','#846c4a',1.2)+
  line('M-27-4L10 7M-27 4L10 15M-27 12L10 23M17 2L33-6M17 10L33 2','#bca477',.8)+
  window(-23,-9)+window(-8,-5)+window(20,-3)+window(28,-7)+
  shape('M-13 10L-3 13V26L-13 23Z','#53645a')+window(-24,6)+
  shape('M-34 5L8 18 16 14-26 1Z','#a77c51')+line('M-32 6V23M-15 11V28M5 17V34','#e6d6af',2)+
  shape('M-35 24L7 37 16 32-26 20Z','#bfa071')+
  shape('M-3-35L5-32V-23L-3-25Z','#e5cea0')+shape('M-7-36L0-43 10-35 4-30Z','#785245')+line('M0-42V-47','#6c513b',1);
}
export function westernBoard(map,edition,owners,{selected=null,contested=[]}={}){
 const neighbors=new Set(selected?map.neighbors[selected]:[]);
 const edges=map.edges.map(([a,b])=>{const [x,y]=westernPositions[a],[u,v]=westernPositions[b];return `<path data-edge="${a}:${b}" class="frontier-route${selected&&(a===selected||b===selected)?' linked':''}" d="M${x} ${y}L${u} ${v}"/>`;}).join('');
 const surfaces=map.zones.map(z=>{const owner=owners[z],color=owner?edition.factionColors[owner]:'#465365';return `<path class="zone frontier-zone territory-surface${selected===z?' selected':''}${neighbors.has(z)?' neighbor':''}${contested.includes(z)?' contested':''}" data-zone="${z}" tabindex="0" role="button" aria-pressed="${selected===z}" aria-label="${escape(z+' '+edition.territoryLabels[z]+', '+(owner?edition.factionLabels[owner]:'neutre'))}" style="--owner:${color};--territory-fill:${owner?color:'#e8d6ac'}" d="M${westernRegions[z].map(p=>p.join(' ')).join('L')}Z"><title>${escape(edition.territoryLabels[z])}</title></path>`;}).join('');
 const nodes=map.zones.map(z=>{const [x,y]=westernPositions[z],owner=owners[z],color=owner?edition.factionColors[owner]:'#465365',number=owner?map.archetypes.indexOf(owner)+1:0;const lines=labelLines(edition.territoryLabels[z]);const special=/^[CS]/.test(z);return `<g class="zone frontier-zone frontier-caption" transform="translate(${x},${y})" aria-hidden="true" style="--owner:${color}">${special?`<g class="landmark building-art" transform="translate(0,-27) scale(.9)">${landmark(z)}</g>`:''}<text class="place-name" text-anchor="middle">${lines.map((line,i)=>`<tspan x="0" y="${10+i*18}">${escape(line)}</tspan>`).join('')}</text><g class="place-code" transform="translate(${special?-52:0},${special?-24:-21})"><rect x="-17" y="-10" width="34" height="21" rx="3"/><text text-anchor="middle" y="5">${z}</text></g>${number?`<g class="ownership" transform="translate(${special?49:32},${special?-25:-19})"><circle r="12"/><text text-anchor="middle" y="5">${number}</text></g>`:''}</g>`;}).join('');
 return `<svg id="board" class="western-map territorial-map" viewBox="0 0 1440 1080" role="group" aria-label="Carte Far West : 33 territoires et ${map.edges.length} connexions"><image href="/assets/western/frontier-terrain-v1.webp" width="1440" height="1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true"/><rect class="map-wash" width="1440" height="1080"/><rect class="atlas-frame" x="24" y="24" width="1392" height="1032" rx="8"/><g class="atlas-heading" aria-hidden="true"><rect class="atlas-cartouche" x="48" y="44" width="320" height="120" rx="3"/><text x="65" y="77">LES TERRITOIRES</text><text x="65" y="108">DE LA FRONTIÈRE</text><path d="M65 124h185"/><text class="atlas-subtitle" x="65" y="146">LE PACTE · FAR WEST</text></g>${surfaces}<g class="route-casings" aria-hidden="true">${map.edges.map(([a,b])=>`<path d="M${westernPositions[a].join(' ')}L${westernPositions[b].join(' ')}"/>`).join('')}</g><g class="frontier-routes" aria-hidden="true">${edges}</g>${nodes}<g class="compass" transform="translate(1310,970)" aria-hidden="true"><path d="M0-40L9-9 35 0 9 9 0 35-9 9-35 0-9-9Z"/><path d="M0-40V35M-35 0H35"/><text y="-50" text-anchor="middle">N</text></g></svg>`;
}
