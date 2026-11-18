export const VALLEY_PLATE='/assets/hotspring/v1/panorama/valley_base.webp';
const escapeXML=value=>String(value).replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'
}[char]));
const path=(d,fill,stroke='#504338',width=1.15)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const shade='#352c24', timber='#9f8263', roof='#6d6558', light='#c5a786', canvas='#c9b59a';

function cabin(width=35,height=19,wall=timber,lid=roof){
 const r=width/2,a=-r+10;
 return path(`M${-r-6} 5h${width+11}l12 -9h-${width+4}z`,shade,'none')+
  path(`M${-r} 0v-${height}h${width}V0z`,wall)+
  path(`M${r} 0l11 -7v-${height}l-11 7z`,'#78645a')+
  path(`M${-r-2} ${-height}l10 -10h${width}l10 10z`,lid)+
  path(`M${a} 0v-11h7V0z`,shade)+
  path(`M${r-11} ${-height+4}h6v6h-6z`,'#564d35');
}
const at=(x,y,markup,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})">${markup}</g>`;
const row=(coords,shape)=>coords.map(([x,y,k])=>at(x,y,shape,k)).join('');
const person=path('M0 -9c-2 0 -2 -3 0 -3s2 3 0 3m-1 0h3l1 5 -2 1v4h-2v-4l-1 -1z','#57483d','#302a24',.55);
const tent=path('M-10 0l8 -14 16 1 -7 13z',canvas)+path('M-5 0l3 -14 7 14z','#77634b');
const wagon=path('M-12 0v-7q0 -12 12 -12t19 12v7z',canvas)+
 path('M-13 -1h33v5h-33z',timber)+
 '<circle cx="-7" cy="5" r="4" fill="#3f362e"/><circle cx="13" cy="5" r="4" fill="#3f362e"/>';
const pole=path('M-15 0l3 -21m18 0 4 21m-20 -9 18 7m-1 -7 -18 7','none','#5d4a37',2.5);
const tower=pole+path('M-13 -23v-15l23 1v14z',timber)+path('M-16 -37l14 -8 15 8z',roof);
const posts=path('M-30 0v-8m12 6v-8m15 6v-8m16 6v-8m14 6v-8m-57 4l57 -8','none','#746047',1.8);
const spriteSize={
 tent:[26,20],cottages:[95,63],inn:[54,38],shacks:[82,56],planned:[84,54],stockyard:[69,40],
 office:[44,32],jail:[39,30],drains:[83,32],hall:[60,43],trade:[45,30],people:[19,13],
 shops:[77,49],relief_cart:[26,20],grove:[59,40],scaffolding:[50,34],debris:[49,22],
 fire:[51,34],flood:[55,19],drought:[48,24],quarantine:[42,30],mine_accident:[44,26],bankruptcy:[36,25],
 wagon:[42,27],well:[28,22],tower:[36,47],school:[52,49],saloon:[56,43],clinic:[49,33],mill:[70,48],station:[60,38],bank:[57,36],mine:[76,48]};
function texture(url,kind){
 const [width,height]=spriteSize[kind];
 return `<image href="${escapeXML(url)}" x="${-width/2}" y="${-height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMax meet"/>`;
}
function camp(wagonGraphic,tentGraphic=tent){
 return row([[-30,2,.7],[-10,-12,.65],[12,-14,.65],[27,0,.68],[4,17,.7]],wagonGraphic)+row([[-16,12,.65],[16,8,.7]],tentGraphic);
}
const building={
 cottages:row([[-21,-7,.67],[7,-14,.68],[28,-5,.56],[-2,10,.82]],cabin(27,14)),
 well:path('M-9 0l6 -6 14 1 -4 5z',timber)+path('M0 -5v-13l7 -2m-7 4 6 3','none','#635b50',2.5),
 tower,
 school:cabin(37,20,'#b39c7b')+path('M-6 -29v-10h9v10z',light)+path('M-9 -39l8 -7 8 7z',roof),
 saloon:cabin(41,22)+path('M-22 -8v-25h39v25z','#9c7154')+
  path('M-24 -29h44v-4h-44zm7 8v-4h8v4zm12 0v-4h10v4zm1 13v-7h9v7z',shade),
 inn:cabin(39,17,'#b59b78')+at(25,1,cabin(17,10),.68),
 clinic:cabin(32,21,'#c5b294')+path('M-7 -15h7m-3.5 -3.5v7','#6e5146','#62493f',1.6),
 mill:cabin(48,18)+path('M20 -17v-26h5v24z','#715349')+
  row([[29,5,1],[18,7,1]],path('M-10 0h28v4h-28z',timber)),
 logging:row([[-13,0,.8],[0,-6,.6],[12,4,.7]],path('M-10 0h20v4h-20z',timber)),
 shops:row([[-14,-4,.86],[19,0,.8]],cabin(26,18,'#a68163')),
 vacant:posts,
 fence:posts,
 trade:cabin(25,12)+at(16,4,posts,.65),
 office:cabin(30,20,'#aa927b')+path('M-19 -28h38v4h-38z','#7c6651'),
 bell:path('M-7 0v-17h12V0M-3 -14v5h4v-5z','none','#554736',1.75),
 station:cabin(44,18,'#a88d6b')+path('M-25 1h53l8 5H-31z',timber),
 mine:cabin(46,16,'#6d594b')+at(20,-9,pole,.95)+path('M-28 -3v-14h16v14z',shade)+path('M-29 3l26 8','none','#75634c',2),
 workshop:cabin(23,12,'#8e7661'),
 shacks:row([[-25,2,.65],[0,-3,.71],[20,-12,.49],[12,11,.7]],cabin(22,12,'#927357')),
 planned:row([[-29,-5,.7],[0,-5,.7],[-27,12,.72],[5,12,.72]],cabin(28,13,'#bda47d')),
 bank:cabin(38,22,'#b7a287')+path('M-23 -25h46l-7 -7h-32zm7 4v16m29 -16v16',light,'#7a6755',1.5),
 stockyard:posts+at(7,12,posts,.78)+at(22,-2,cabin(20,12),.75),
 jail:cabin(23,20,'#958677')+path('M1 -17v9m3 -9v9m3 -9v9','none',shade,1.4),
 drains:path('M-35 9l31 -8 2 -15L30 -26m-29 19 23 3','none','#76685a',4),
 waste:row([[-18,3],[2,-4],[12,7]],path('M-6 2l3 -5 5 3 4 2z','#514637','none')),
 boards:at(8,0,posts,.36),
 hall:cabin(45,26,'#bc9f7c')+path('M-21 -26l22 -13 23 13z','#a0886d'),
 refuge:row([[0,0],[16,-2,.8],[-16,4,.8]],tent),
 protected:at(0,0,posts,1.5)
};
// These contours follow the painted waterline and the floodplain on the valley plate.
const riverBed='M-14 488C16 470 25 436 50 415S105 394 130 364 184 342 220 321 246 300 283 289 336 268 372 256 439 242 418 229 373 218 364 208Q354 201 386 198L402 188Q325 191 315 202C314 211 351 216 371 229S345 245 315 263 250 275 219 291 172 321 139 324 66 346 45 356 6 367-14 374Z';
const overflow='M-14 490C20 477 34 444 59 424S113 400 144 371 192 353 225 333 256 314 280 318 315 306 331 294Q350 276 383 263C411 250 448 246 423 228S374 214 371 208Q361 204 404 192L386 198Q354 201 364 208C373 218 398 216 418 229S408 245 372 256 318 269 283 289 243 300 220 321 168 333 130 364 76 393 50 415 15 471-14 488Z';
const waterPigments={
 degradee:['#978959',.23],
 polluee:['#625b3b',.40],
 basse:['#a48966',.32],
 crue:['#98795c',.39]
};
const terrainRoutes={
 road:{
  low:'M306 390C342 379 389 367 426 362S508 358 554 359 623 358 641 343',
  high:'M613 195C646 201 663 207 699 207S787 207 838 203 925 188 966 186'
 },
 rail:{
  low:'M310 348C379 336 442 334 503 337S601 348 638 342',
  high:'M573 163C654 159 702 164 751 164S851 159 894 159 943 154 984 149'
 },
 corridor:'M62 456C81 425 125 416 155 383S199 359 225 337 286 315 326 300',
 trail:'M144 392C190 357 234 346 281 335S344 309 385 301 424 302 450 306',
 ridgeTrail:'M523 184Q547 177 580 176T675 168Q733 161 768 144'
};
const terrainStages={
 drains:{
  building:path('M-32 6l24 -7 9 -8 18 -8','none','#ac8e67',5)+path('M-19 2l4 8m6 -11 4 8','none','#625544',1.5),
  damaged:path('M-34 7l19 -5m13 -1 11 -13 19 -8','none','#6d5e4f',5)+path('M-14 3l3 -5 7 1 5 5z','#b2a084')
 }
};
const stateScreen={
 building:path('M-22 0v-14l22 -12 21 11v15m-43 -14h43m-20 -10V0','none','#c6a883',2.3),
 damaged:path('M-24 1l43 -3 7 6 -42 3z','#484038','none')+
  path('M-17 0l-3 -17 7 5 4 -11 6 17 7 -6 15 11','none','#312e29',2.7),
 abandoned:path('M-9 0l8 -12m-9 0L0 0M9 -17l8 7m0 -7l-8 7','none','#43392f',2.2),
 inspection:at(0,5,posts,.6)
};

let panoramaId=0;
function groundContact(width,paint){
 return `<ellipse cx="${width*.09}" cy="1.6" rx="${width*.47}" ry="${Math.min(7,width*.11)}"
 fill="url(#${paint}-contact)" transform="rotate(7)"/>`;
}

function renderTerrain(layer,high){
 const {kind,state}=layer;
 const route=terrainRoutes[kind==='roadwide'?'road':kind];
 if(!route)return null;
 const d=typeof route==='string'?route:route[high?'high':'low'];
 const stroke=(color,width,opacity,extra='')=>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" ${extra}/>`;
 const softStroke=(color,width,opacity)=>
  stroke(color,width+2.4,opacity*.24,'stroke-linecap="round"')+
  stroke(color,width,opacity*.76,'stroke-linecap="round"');
 if(kind==='rail'){
  const gauge=high?1:1.45;
  const breaks=state==='damaged'?' stroke-dasharray="37 14 25 21"':'';
  const bed=softStroke('#8e7459',high?6:8,.42);
  if(state==='building')return bed+stroke('#5e5042',gauge,.63,'stroke-dasharray="52 220"');
  return bed+stroke('#695747',gauge*4.2,.69,'stroke-dasharray="1.1 3.8"')+
   stroke('#504538',.9,.72,`transform="translate(0 ${gauge})"${breaks}`)+
   stroke('#504538',.9,.72,`transform="translate(0 ${-gauge})"${breaks}`);
 }
 const road=kind==='road'||kind==='roadwide';
 const width=road?(kind==='roadwide'?10:7)*(high?.74:1):kind==='trail'?4.6:3.2;
 const opacity=state==='building'?.20:road?.42:.31;
 const soil=softStroke(road?'#b49b7a':'#a58d6b',width,opacity);
 if(!road||state==='building')return soil;
 const ruts=state==='damaged'?' stroke-dasharray="16 7 24 10"':'';
 return soil+stroke('#826b53',.9,.33,`transform="translate(0 ${width*.21})"${ruts}`)+
  stroke('#826b53',.9,.29,`transform="translate(0 ${-width*.21})"${ruts}`);
}

function renderLayer(layer,textureFor,high,paint){
 const route=renderTerrain(layer,high);
 const attrs=`data-layer="${escapeXML(layer.id)}" data-kind="${escapeXML(layer.kind)}" data-state="${escapeXML(layer.state)}"`;
 const title=`<title>${escapeXML(layer.label)}</title>`;
 if(route)return `<g ${attrs}>${title}${route}</g>`;
 const painted=textureFor(layer.kind);
 const graphic=layer.kind==='camp'?groundedCamp(textureFor,paint):
  painted??building[layer.kind]??'';
 const terrain=terrainStages[layer.kind]?.[layer.state];
 const inProgress=layer.state==='building',damaged=layer.state==='damaged';
 const remainder=painted&&(inProgress||damaged)?
  partialStructure(painted,layer.kind,damaged?.28:.36):graphic;
 const opacity=damaged?.72:layer.state==='abandoned'?.57:inProgress&&!painted?.35:1;
 const props=inProgress?textureFor('scaffolding'):damaged?textureFor('debris'):null;
 const scale=(spriteSize[layer.kind]?.[0]??38)/45;
 const embellishment=props?at(damaged?8:0,damaged?4:0,props,Math.min(1.5,Math.max(.56,scale))):
  stateScreen[layer.state]??'';
 const footprint=layer.kind==='drains'?0:spriteSize[layer.kind]?.[0];
 const contact=footprint?groundContact(footprint,paint):'';
 const body=terrain??`${contact}<g opacity="${opacity}">${remainder}</g>${embellishment}`;
 return `<g ${attrs} transform="translate(${layer.x*10} ${layer.y*5.625}) scale(${layer.scale})">${title}${body}</g>`;
}

function groundedCamp(textureFor,paint){
 return camp(groundContact(32,paint)+(textureFor('wagon')??wagon),
  groundContact(22,paint)+(textureFor('tent')??tent));
}

function renderWater(scene){
 const tint=(d,color,opacity)=>`<path d="${d}" fill="${color}" fill-opacity="${opacity}"
  stroke="${color}" stroke-width="5" stroke-linejoin="round" stroke-opacity="${opacity*.17}"/>`;
 const pigment=waterPigments[scene.river];
 const tinted=pigment?tint(riverBed,...pigment):'';
 const bank=scene.river==='crue'||scene.scars.includes('Crue')?
  tint(overflow,'#8c735a',scene.river==='crue'?.48:.18):'';
 return `<g data-river="${escapeXML(scene.river)}">${tinted}${bank}</g>`;
}

export function renderPanoramaSvg(scene,{background=VALLEY_PLATE,sprites=scene.sprites??{},campMemory=false}={}){
 const paint='hotspring-paint-'+(++panoramaId);
 const high=scene.location==='terrasse';
 const hasScars=scene.scars.length>0;
 const stumps=[[208,198,.52],[256,201,.48],[265,194,.48],[224,204,.56],[197,204,.56],
  [228,194,.46],[285,198,.50],[240,210,.55],[189,209,.60],[269,205,.55]];
 const visibleStumps=scene.vegetation==='abondante'?[]:scene.vegetation==='réduite'?stumps.slice(0,4):stumps;
 const wood=row(visibleStumps,path('M-6 0l1 -6 7 -3 4 2 -1 6z','#786b53','#51483a',.7));
 const textureFor=kind=>sprites[kind]&&spriteSize[kind]?texture(sprites[kind],kind):null;
 const trees=textureFor('grove');
 const groves=trees&&scene.vegetation!=='fortement dégradée'
  ?row(scene.vegetation==='abondante'?[[276,315,.68],[364,248,.53],[417,212,.40]]:[[276,315,.55]],trees):'';
 const layers=scene.layers.filter(layer=>layer.state!=='absent');
 const isRoute=layer=>(layer.kind==='roadwide'||layer.kind in terrainRoutes);
 const trails=layers.filter(isRoute).map(layer=>renderLayer(layer,textureFor,high,paint)).join('');
 const buildings=layers.filter(layer=>!isRoute(layer)).map(layer=>renderLayer(layer,textureFor,high,paint)).join('');
 const count=scene.location&&scene.street!=='vide'?({faible:2,moyenne:6,forte:12}[scene.density]??0):0;
 const peopleTexture=textureFor('people');
 const group=peopleTexture?groundContact(17,paint)+peopleTexture:null;
 const people=group
  ?Array.from({length:Math.ceil(count/3)},(_,i)=>at(scene.townX*10-43+i*23,scene.townY*5.625+22+(i%3)*7,group)).join('')
  :Array.from({length:count},(_,i)=>at(scene.townX*10-57+i*11,scene.townY*5.625+20+(i%3)*6,person,.64+(i%3)*.13)).join('');
 const nearby=scene.location&&scene.density==='faible'?
  at(scene.townX*10-19,scene.townY*5.625+12,group??person,.68):'';
 const scars=placedScars(scene,textureFor);
 const frontage=scene.street==='barricadée'?posts:
  scene.mood==='dangereuse'?path('M-22 1h44m-31 0v-9m9 9v-8m10 8v-9','none','#50453d',2):
  scene.mood==='animée'?boardsForCharter():'';
 const street=at(scene.townX*10,scene.townY*5.625+20,frontage,1.5);
 const shutters=scene.prosperity==='abandon'?
  at(scene.townX*10+16,scene.townY*5.625+24,posts,.8):
  scene.prosperity==='précarité'?at(scene.townX*10+26,scene.townY*5.625+21,tent,.45):'';
 const showsCharter={
  commerce:at(scene.townX*10+34,scene.townY*5.625+8,boardsForCharter(),1.45),
  services:at(scene.townX*10-10,scene.townY*5.625+17,row([[0,0],[6,1],[14,0]],person),1),
  ateliers:at(scene.townX*10+27,scene.townY*5.625+12,boardsForCharter(),.8),
  inspection:at(scene.townX*10-12,scene.townY*5.625+18,posts,.8),
  liaison:at(245,315,posts,.65),
  réserves:at(228,325,posts,.8)
 };
 const tone=scene.prosperity==='abandon'?'#7e786d':scene.prosperity==='prospérité'?'#d1a564':null;
 const filters=tone?`<ellipse cx="${scene.townX*10}" cy="${scene.townY*5.625}" rx="125" ry="75" fill="${tone}" opacity=".13"/>`:'';
 const ending=scene.epilogue?'<rect width="1000" height="563" fill="#cc8853" opacity=".10"/>':'';
 const memory=campMemory&&scene.epilogue?`<g class="hotspring-camp-memory" aria-hidden="true">
  ${at(scene.epilogue.origin[0]*10,scene.epilogue.origin[1]*5.625,groundedCamp(textureFor,paint))}
 </g>`:'';
 const labels=(scene.details??[]).map(detail=>detail.label);
 const description='Vallée de Hotspring'+(scene.location?' — ville sur '+scene.location:'')+
  (hasScars?'. Cicatrices : '+scene.scars.join(', '):'')+(labels.length?'. '+labels.join('. '):'');
 return `<svg class="hotspring-map" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 562.5" role="img" aria-label="${escapeXML(description)}">
 <defs>
  <radialGradient id="${paint}-contact">
   <stop offset="0" stop-color="#332a1f" stop-opacity=".64"/>
   <stop offset=".6" stop-color="#332a1f" stop-opacity=".25"/>
   <stop offset="1" stop-color="#332a1f" stop-opacity="0"/>
  </radialGradient>
 </defs>
 <image href="${escapeXML(background)}" width="1000" height="562.5" preserveAspectRatio="none"/>
 ${renderWater(scene)}${filters}${trails}
 <g data-vegetation="${escapeXML(scene.vegetation)}">${groves}${wood}</g>${buildings}
 <g class="street-detail" data-street="${escapeXML(scene.street)}" data-density="${escapeXML(scene.density)}"
  data-mood="${escapeXML(scene.mood)}" data-prosperity="${escapeXML(scene.prosperity)}">
  ${scars}${street}${shutters}${nearby}${people}${showsCharter[scene.charter]??''}
 </g>
 ${(scene.details??[]).map(detail=>renderDetail(detail,textureFor)).join('')}${ending}${memory}</svg>`;
}

function renderDetail(detail,textureFor){
 const ledger=path('M-7 1l-1 -8 6 -2 4 1 6 -1 1 8 -7 1 -4 -1z','#e0c6a0','#604939',1)+
  path('M1 -8v7m-6 -4 3 -1m5 0 3 -1','none','#7d6250',.8);
 const sign=path('M0 4v-16m-8 2h16v4h-16z','#b89a74','#604939',1.3);
 const cart=textureFor('relief_cart')??at(0,0,wagon,.60);
 const smoke=`<g class="hotspring-local-smoke" opacity=".75">
  ${path('M-5 -17c-12-4-8-17 2-18 0-9 12-15 20-10 7-5 21-2 23 5 11-1 20 6 20 11-13 4-25 1-36 6-8 7-19 9-29 6z','#806c59','none')}
  ${path('M-6 -20c-6-9 10-12 18-13 7-12 21-11 31-11-5 14-21 12-25 17-8 5-19 8-24 7z','#ad9580','none')}
 </g>`;
 const clean=detail.clean;
 const ditch=path('M-35 14q14-9 27-8t28-17,24-4','none',clean?'#81958b':'#6f6951',clean?2.5:4);
 const detailGraphics={
  boundary:at(9,9,path('M-21 5v-4m17 -2v-5m21 -3v-4','none','#89745e',1.3)),
  signpost:at(12,8,sign,1.30),
  pennant:at(18,-10,path('M0 10v-22l15 3 -5 6L0 -7','none','#cdb08d',2),1.35),
  freight:at(24,3,cart,.9),
  ledger:at(16,7,ledger,1.2),
  lamplight:`<ellipse cx="12" cy="-3" rx="22" ry="11" fill="#e2b25f" opacity=".36"/>`+
   at(18,4,textureFor('people')??person,1.25),
  'stock-runoff':ditch+path('M-13 4q16-10 14-15','none',clean?'#7c8e75':'#867048',2.1),
  'mine-runoff':path('M-18 9l7 7 -22 8 -9 14 -27 10 -35 29','none',clean?'#91a19a':'#89715a',3.7),
  ditch:`${ditch}${at(4,6,posts,.33)}`,
  'chimney-smoke':smoke,
  'standing-water':`<ellipse cx="-18" cy="6" rx="17" ry="5" fill="#776e56" opacity=".75"/>${ditch}`,
  notice:at(23,3,sign,.93)+at(-22,4,path('M0 0v-11l9 2 -2 4L0 -7','none','#dfc4a2',2)),
  relief:at(11,4,cart,1.08)+at(-9,2,textureFor('people')??person,.78),
  embers:at(22,7,textureFor('fire')??stateScreen.damaged,.8),
  inspection:at(6,4,posts,.8)+at(19,0,sign,.78)
 };
 const graphic=detailGraphics[detail.kind];
 if(!graphic)return '';
 return `<g data-detail="${escapeXML(detail.kind)}" data-anchor="${escapeXML(detail.anchor)}"
 transform="translate(${detail.x*10} ${detail.y*5.625})"><title>${escapeXML(detail.label)}</title>${graphic}</g>`;
}

function boardsForCharter(){return path('M-8 2v-9h14v4H-8m14 5v-9','none','#b29a75',1.5);}

function partialStructure(graphic,kind,fraction){
 const [w,h]=spriteSize[kind],x=-w/2,y=-h*fraction;
 return `<svg x="${x}" y="${y}" width="${w}" height="${-y}" viewBox="${x} ${y} ${w} ${-y}" overflow="hidden">${graphic}</svg>`;
}

function placedScars(scene,textureFor){
 const anchor=id=>scene.layers.find(layer=>layer.id===id);
 const burned=scene.layers.find(l=>l.state==='damaged');
 const stamps={
  Incendie:['fire',burned,7,7],Crue:['flood',anchor('well'),-13,16],Sécheresse:['drought',anchor('well'),9,12],
  Épidémie:['quarantine',anchor('refuge'),-9,4],'Accident minier':['mine_accident',anchor('mine'),15,4],
  'Saisies bancaires':['bankruptcy',anchor('bank'),17,5]
 };
 return scene.scars.map(name=>{
  const stamp=stamps[name];
  if(!stamp)return '';
  const [kind,layer,dx,dy]=stamp;
  const art=textureFor(kind);
  return art?`<g data-scar="${escapeXML(name)}">${at((layer?.x??scene.townX)*10+dx,(layer?.y??scene.townY)*5.625+dy,art,.82)}</g>`:'';
 }).join('');
}
