// Presentation only: every route is supplied by the authoritative game graph.
export const westernPositions={
 C1:[690,105],P1:[690,225],N1:[690,345],M1:[690,465],
 C2:[1270,235],P2:[1130,315],N2:[1020,405],M2:[955,505],
 C3:[1270,815],P3:[1125,785],N3:[1030,695],M3:[945,615],
 C4:[690,965],P4:[690,845],N4:[690,725],M4:[690,605],
 C5:[175,815],P5:[325,785],N5:[420,685],M5:[505,625],
 C6:[175,235],P6:[320,315],N6:[420,405],M6:[505,465],
 F1:[930,225],F2:[1185,545],F3:[930,915],F4:[450,915],F5:[245,545],F6:[450,225],
 S1:[835,385],S2:[835,755],S3:[535,535]
};
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function labelLines(name){const words=String(name).split(/\s+/),lines=[''];for(const word of words){const n=lines.length-1;if(lines[n]&&(lines[n]+' '+word).length>20)lines.push(word);else lines[n]+=(lines[n]?' ':'')+word;}return lines;}
function landmark(z){
 if(z[0]==='C')return '<path d="M-16 12V-6h5v-9h7v9h8v-9h7v9h5v18H5V2H-5v10Z"/>';
 if(z==='S2')return '<path d="M-16 13L-10-14H10L16 13M-13 3H13M-12-7H12M-7 13V2h14v11M-10-14L10 3M10-14L-10 3"/>';
 if(z==='S3')return '<path d="M-18-5L0-16 18-5ZM-14 0v12M-5 0v12M5 0v12M14 0v12M-18 16h36M-18-1h36"/>';
 if(z==='S1')return '<path d="M-18 0L0-14 18 0M-15-2v16h30V-2M-5 14V3H5v11M-11 3h3M8 3h3"/>';
 if(z[0]==='F')return '<path d="M0-17v34M-16-11h28l5 5-5 5h-28ZM15 3h-27l-5 5 5 5h27Z"/>';
 if(z[0]==='N')return '<path d="M-17 13L-5-9 7 13ZM-2 13L9-15 21 13M-8-3l3 4 4-3M5-5l4 4 4-4"/>';
 if(z[0]==='M')return '<path d="M-17 14L0-15 17 14ZM0-15v29M-7 14L0 1 7 14"/>';
 return '<path d="M-17-2L0-15 17-2M-13-5v19h26V-5M-5 14V3H5v11M-9-1h3M6-1h3"/>';
}
export function westernBoard(map,edition,owners,{selected=null,contested=[]}={}){
 const neighbors=new Set(selected?map.neighbors[selected]:[]);
 const edges=map.edges.map(([a,b])=>{const [x,y]=westernPositions[a],[u,v]=westernPositions[b];return `<path data-edge="${a}:${b}" class="frontier-route${selected&&(a===selected||b===selected)?' linked':''}" d="M${x} ${y}L${u} ${v}"/>`;}).join('');
 const nodes=map.zones.map(z=>{const [x,y]=westernPositions[z],owner=owners[z],color=owner?edition.factionColors[owner]:'#465365',number=owner?map.archetypes.indexOf(owner)+1:0;const lines=labelLines(edition.territoryLabels[z]);const side=['M6','N6'].includes(z)?-139:['M3','M4','M5'].includes(z)?141:0;const labelY=z==='M3'?22:34;
 return `<g class="zone frontier-zone${selected===z?' selected':''}${neighbors.has(z)?' neighbor':''}${contested.includes(z)?' contested':''}" transform="translate(${x},${y})" data-zone="${z}" tabindex="0" role="button" aria-pressed="${selected===z}" aria-label="${escape(z+' '+edition.territoryLabels[z]+', '+(owner?edition.factionLabels[owner]:'neutre'))}" style="--owner:${color}"><title>${escape(edition.territoryLabels[z])}</title><circle class="marker" r="${z[0]==='S'?30:26}"/><g class="landmark" aria-hidden="true">${landmark(z)}</g><rect class="place-label" x="${side-91}" y="${labelY}" width="182" height="${lines.length*18+9}" rx="4"/><text class="place-name" text-anchor="middle">${lines.map((line,i)=>`<tspan x="${side}" y="${labelY+17+i*18}">${escape(line)}</tspan>`).join('')}</text><g class="place-code" transform="${z==='M5'?'translate(-40,0)':'translate(-32,-29)'}" aria-hidden="true"><rect x="-17" y="-10" width="34" height="21" rx="3"/><text text-anchor="middle" y="5">${z}</text></g>${number?`<g class="ownership" transform="translate(30,-21)" aria-hidden="true"><circle r="13"/><text text-anchor="middle" y="5">${number}</text></g>`:''}</g>`;
 }).join('');
 return `<svg id="board" class="western-map" viewBox="0 0 1440 1080" role="group" aria-label="Carte Far West : 33 territoires et ${map.edges.length} connexions"><image href="/assets/western/frontier-terrain-v1.webp" width="1440" height="1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true"/><rect class="map-wash" width="1440" height="1080"/><rect class="atlas-frame" x="24" y="24" width="1392" height="1032" rx="8"/><g class="atlas-heading" aria-hidden="true"><rect class="atlas-cartouche" x="48" y="44" width="320" height="120" rx="3"/><text x="65" y="77">LES TERRITOIRES</text><text x="65" y="108">DE LA FRONTIÈRE</text><path d="M65 124h185"/><text class="atlas-subtitle" x="65" y="146">LE PACTE · FAR WEST</text></g><g class="route-casings" aria-hidden="true">${map.edges.map(([a,b])=>`<path d="M${westernPositions[a].join(' ')}L${westernPositions[b].join(' ')}"/>`).join('')}</g><g class="frontier-routes" aria-hidden="true">${edges}</g>${nodes}<g class="compass" transform="translate(1310,970)" aria-hidden="true"><path d="M0-40L9-9 35 0 9 9 0 35-9 9-35 0-9-9Z"/><path d="M0-40V35M-35 0H35"/><text y="-50" text-anchor="middle">N</text></g></svg>`;
}
