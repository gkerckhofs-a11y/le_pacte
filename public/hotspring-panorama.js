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
const building={
 road:path('M-70 24Q-26 1 75 -19', 'none','#ac8e67',7),
 roadwide:path('M-78 25Q-27 1 76 -19', 'none','#bc9e76',13),
 camp:row([[-30,2,.7],[-10,-12,.65],[12,-14,.65],[27,0,.68],[4,17,.7]],wagon)+row([[-16,12,.65],[16,8,.7]],tent),
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
 corridor:path('M-31 15Q-22 -4 17 -15L13 -21Q-21 -17 -38 10z','#a1946d','none'),
 fence:posts,
 trail:path('M-39 11Q-20 6 -15 -2T27 -15','none','#9f805c',4),
 trade:cabin(25,12)+at(16,4,posts,.65),
 office:cabin(30,20,'#aa927b')+path('M-19 -28h38v4h-38z','#7c6651'),
 bell:path('M-7 0v-17h12V0M-3 -14v5h4v-5z','none','#554736',1.75),
 rail:path('M-77 19l154 -39 m-155 44l155 -40','none','#5b5147',1.9)+
  Array.from({length:18},(_,i)=>path(`M${-77+i*8} ${17-i*2}l2 8`,'none','#685848',1.45)).join(''),
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
const river='M-6 486 C 72 451 155 357 257 310 S 390 260 382 228 S 350 216 393 201 S 422 185 451 180';
const pigments={claire:null,degradee:'#918346',polluee:'#6b5e38',basse:'#b89b65',crue:'#7d6144'};
const stateScreen={
 building:path('M-22 0v-14l22 -12 21 11v15m-43 -14h43m-20 -10V0','none','#c6a883',2.3),
 damaged:path('M-24 1l43 -3 7 6 -42 3z','#484038','none')+
  path('M-17 0l-3 -17 7 5 4 -11 6 17 7 -6 15 11','none','#312e29',2.7),
 abandoned:path('M-9 0l8 -12m-9 0L0 0M9 -17l8 7m0 -7l-8 7','none','#43392f',2.2),
 inspection:at(0,5,posts,.6)
};
export function renderPanoramaSvg(scene,{background=VALLEY_PLATE}={}){
 const hasScars=scene.scars.length>0;
 const pigment=pigments[scene.river];
 const riverLayer=pigment?path(river,'none',pigment,scene.river==='crue'?30:14):'';
 const wood=scene.vegetation!=='abondante'?row([[325,211],[369,173],[297,232],[435,161]],
  path('M-6 0l1 -6 7 -3 4 2 -1 6z','#786b53','#51483a',.7)):'';
 const buildings=scene.layers.map(layer=>{
  const graphic=building[layer.kind]??'';
  const extra=stateScreen[layer.state]??'';
  const main=layer.state==='building'?'':graphic;
  const opacity=layer.state==='damaged'?.43:layer.state==='abandoned'?.57:1;
  return `<g data-layer="${escapeXML(layer.id)}" transform="translate(${layer.x*10} ${layer.y*5.625}) scale(${layer.scale})"><title>${escapeXML(layer.label)}</title><g opacity="${opacity}">${main}</g>${extra}</g>`;
 }).join('');
 const count=!scene.location?0:{faible:2,moyenne:6,forte:12}[scene.density]??0;
 const people=Array.from({length:count},(_,i)=>at(scene.townX*10-57+i*11,scene.townY*5.625+20+(i%3)*6,person,.64+(i%3)*.13)).join('');
 const street=scene.street==='barricadée'?at(scene.townX*10,scene.townY*5.625+20,posts,1.6):'';
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
 return `<svg class="hotspring-map" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 562.5" role="img" aria-label="${escapeXML('Vallée de Hotspring'+(scene.location?' — ville sur '+scene.location:'')+(hasScars?'. Cicatrices : '+scene.scars.join(', '):''))}">
 <image href="${escapeXML(background)}" width="1000" height="562.5" preserveAspectRatio="none"/>
 <g opacity=".47">${riverLayer}</g>${filters}<g>${wood}</g>${buildings}
 <g class="street-detail">${street}${people}${showsCharter[scene.charter]??''}</g></svg>`;
}

function boardsForCharter(){return path('M-8 2v-9h14v4H-8m14 5v-9','none','#b29a75',1.5);}
