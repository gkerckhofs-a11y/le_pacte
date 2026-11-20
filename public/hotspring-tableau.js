import {townPlots} from './hotspring-tableau-plots.js';

const locationKey=scene=>scene.location==='terrasse'?'terrasse':'plaine';
const asset=(site,key)=>'/assets/hotspring/v1/tableaux/'+site+'_'+key+'.webp';
const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const full='0 0 1000 562.5';

// Use durable town parcels, including damaged or closed premises. A crisis should not pull the camera back in.
export function townViewBox(scene){
 if(scene.epilogue||scene.charter)return full;
 const sites=new Set(scene.layers.filter(l=>l.state!=='absent').map(l=>l.id));
 let width=620;
 if(sites.has('well'))width+=92;
 if(sites.has('surveyed'))width+=125;
 if(sites.has('sawmill'))width+=32;
 for(const id of ['school','saloon','clinic','trade','territory','depot','mine','housing','bank','stockyard','marshal','sanitation','council']){
  if(sites.has(id))width+=13;
 }
 width=Math.min(1000,width);
 const height=width*9/16;
 const left=Math.max(0,Math.min(1000-width,512-width/2));
 const centerY=sites.has('surveyed')?321:282;
 const top=Math.max(0,Math.min(562.5-height,centerY-height/2));
 return [left,top,width,height].join(' ');
}

// Edit the camp plate first, then compose the independently voted parcels back to front.
export function townExposure(scene){
 const lots=new Map(scene.layers.filter(l=>l.state!=='absent').map(l=>[l.id,l]));
 const layers=[];
 const add=(id,key)=>{
  const lot=lots.get(id);
  if(lot&&key)layers.push({id,key,state:lot.state,label:lot.label});
 };
 layers.push({id:'settlement',key:lots.has('surveyed')?'rue':'camp',state:'complete',
  label:lots.has('surveyed')?'Rue principale en terre, maisons sur les deux côtés':'Premier foyer en rondins et campement des familles'});
 // These edits replace pixels in the base photograph, including the former tent or smoke.
 // Apply them before painting the independent plots behind the row so their scenery survives.
 if(lots.get('homestead')?.state==='damaged'){
  add('homestead','foyer_brule');
  add('homes','quartier_brule');
 }else{
  add('plankLot',lots.get('plankLot')?.kind==='plankCottage'?'maison_planches':null);
  add('homes',lots.get('homes')?.kind==='cottages'?'maisons_familles':null);
  add('porchLot',lots.get('porchLot')?.kind==='porchHouse'?'maison_perron':null);
 }
 add('council',lots.get('council')?.kind==='hall'?'conseil':null);
 add('mine',lots.get('mine')?.kind==='mine'?'mine':null);
 add('depot','gare');
 add('stockyard','betail');
 add('housing',lots.get('housing')?.kind==='shacks'?'faubourg':'quartier');
 add('trade','comptoir');
 add('school','ecole');
 add('saloon',lots.get('saloon')?.kind==='inn'?'auberge':'saloon');
 add('sawmill',lots.get('sawmill')?.kind==='mill'?'scierie':null);
 add('well',lots.get('well')?.kind==='tower'?'tour':'puits');
 add('bank','banque');
 add('clinic','dispensaire');
 add('shops',lots.get('shops')?.kind==='shops'?'boutiques':null);
 if(lots.has('surveyed')&&scene.density==='forte'&&scene.street!=='barricadée'&&scene.street!=='vide')
  layers.push({id:'residents',key:'passants',state:'complete',label:'Des habitants circulent dans la rue'});
 return layers;
}

const upcoming={
 D02:['maison_planches','tour','puits'],D03:['rue','maisons_familles','boutiques'],D04:['maison_perron','scierie'],
 D05:['maison_perron','ecole'],D06:['saloon','auberge'],D07:['dispensaire'],D11:['comptoir'],
 D15:['gare'],D16:['mine'],D17:['quartier','faubourg'],D18:['banque'],D19:['betail'],
 D24:['foyer_brule','quartier_brule'],D29:['conseil']
};
export function nextTownImages(scene,dilemma){
 if(!scene.location)return [asset('terrasse','camp'),asset('plaine','camp')];
 return (upcoming[dilemma]??[]).map(key=>asset(locationKey(scene),key));
}

export function renderTownPainting(scene,{campMemory=false,imageUrl=url=>url}={}){
 const site=locationKey(scene),plots=townPlots[site];
 const layers=townExposure(scene);
 const description=(site==='terrasse'?'Hotspring sur le plateau. ':'Hotspring dans les terres basses. ')+layers.map(l=>l.label).join('. ');
 function region(key){
  const [x,y,width,height]=plots[key];
  return `<image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="none" href="${escapeText(imageUrl(asset(site,key)))}"/>`;
 }
 const painted=layers.map(({id,key,state,label})=>{
  return `<g data-layer="${id}" data-paint="${key}" data-state="${escapeText(state)}"><title>${escapeText(label)}</title>${region(key)}</g>`;
 }).join('');
 const memory=campMemory?`<g class="hotspring-camp-memory" aria-hidden="true">${region('camp')}</g>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" class="hotspring-map hotspring-town" width="1000" height="562.5" viewBox="${townViewBox(scene)}" role="img" aria-label="${escapeText(description)}" data-site="${site}"><g transform="scale(${1000/1672} ${562.5/941})">${painted}${memory}</g></svg>`;
}
