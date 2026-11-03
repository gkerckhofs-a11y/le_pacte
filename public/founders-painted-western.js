// Approved paintings remain whole JPEGs; SVG masks compose their local districts at runtime.
export const PAINTED_WESTERN_ROOT='/assets/western/painted/';
export const PAINTED_REFERENCE=PAINTED_WESTERN_ROOT+'reference.jpg';
export const PAINTED_ZONES=Object.freeze({
 economie:'0,588 362,588 438,552 603,552 622,775 530,850 0,941',
 securite:'433,327 581,312 694,355 704,454 757,464 757,653 606,653 600,556 433,556',
 stabilite:'695,146 1048,146 1048,478 757,478 757,455 704,455 694,355',
 developpement:'1302,143 1672,143 1672,457 1445,457 1382,420 1383,349 1302,297',
 bien_etre:'1052,320 1172,276 1279,289 1387,350 1387,410 1618,427 1630,576 1183,584 1183,505 1092,488',
 satisfaction:'758,455 1086,455 1111,480 1181,505 1181,585 1245,627 1223,669 758,669'
});
export function paintedSources(states){
 return Object.fromEntries(Object.keys(PAINTED_ZONES).map(key=>{
  const level=states[key]?.level;if(![0,1,2].includes(level))throw new Error('Niveau de quartier invalide');
  return [key,level===1?PAINTED_REFERENCE:PAINTED_WESTERN_ROOT+key+(level===0?'-low.jpg':'-high.jpg')];
 }));
}
export function mountPaintedWestern(root){
 root.dataset.renderer='painted-western';
 const masks=Object.entries(PAINTED_ZONES).map(([key,points])=>`<mask id="painted-${key}" maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941"><polygon points="${points}" fill="white" filter="url(#painted-feather)"/></mask>`).join('');
 const layers=Object.keys(PAINTED_ZONES).map(key=>`<image data-painted-zone="${key}" width="1672" height="941" preserveAspectRatio="none" mask="url(#painted-${key})"/>`).join('');
 root.innerHTML=`<svg viewBox="0 0 1672 941" role="img" aria-labelledby="townTitle townDesc"><title id="townTitle">Hot Spring · panorama peint évolutif</title><desc id="townDesc"></desc><defs><filter id="painted-feather" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.5"/></filter>${masks}</defs><image href="${PAINTED_REFERENCE}" width="1672" height="941" preserveAspectRatio="none"/>${layers}</svg><p class="painted-status small" role="status" hidden></p>`;
 delete root.dataset.paintedRequest;delete root.dataset.paintedApplied;
}
const cached=new Map();
function preload(src){
 if(!cached.has(src))cached.set(src,new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>resolve(src);image.onerror=()=>{cached.delete(src);reject(new Error('Illustration momentanément indisponible'));};image.src=src;
 }));
 return cached.get(src);
}
export function updatePaintedWestern(root,states){
 const sources=paintedSources(states),request=JSON.stringify(sources),status=root.querySelector('.painted-status');
 if(root.dataset.paintedRequest===request)return;
 root.dataset.paintedRequest=request;root.setAttribute('aria-busy','true');
 status.hidden=false;status.textContent='Chargement des quartiers illustrés…';
 Promise.all([...new Set([PAINTED_REFERENCE,...Object.values(sources)])].map(preload)).then(()=>{
  if(root.dataset.renderer!=='painted-western'||root.dataset.paintedRequest!==request)return;
  // Commit all six districts together; a late network response cannot undo a newer state.
  for(const node of root.querySelectorAll('[data-painted-zone]'))node.setAttribute('href',sources[node.dataset.paintedZone]);
  root.dataset.paintedApplied=request;root.setAttribute('aria-busy','false');status.hidden=true;
 }).catch(()=>{
  if(root.dataset.paintedRequest!==request)return;
  root.setAttribute('aria-busy','false');status.hidden=false;status.textContent=(root.dataset.paintedApplied?'Illustrations indisponibles : dernier état conservé.':'Le panorama n’a pas pu être chargé.')+' Actualisez pour réessayer.';
  delete root.dataset.paintedRequest;
 });
}
