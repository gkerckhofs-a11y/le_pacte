import {mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {Resvg} from '@resvg/resvg-js';
import {simulateCampaign,trajectories} from '../test/helpers/hotspring.mjs';
import {visualComposition} from '../test/helpers/hotspring-visual-compositions.mjs';
import {hotspringLandscape} from '../src/hotspring-landscape.ts';
import {renderPanoramaSvg,VALLEY_PLATE} from '../public/hotspring-panorama.js';

const docs='docs/hotspring';
const folder=join(docs,'captures');
const magick=(args,options)=>execFileSync('magick',args,options);
const plate=magick(['public'+VALLEY_PLATE,'-quality','90','jpeg:-']);
const background='data:image/jpeg;base64,'+plate.toString('base64');
const knownSprites=new Map();
mkdirSync(folder,{recursive:true});

function capture(landscape,width,point=[50,50],zoom=1){
 const sprites=Object.fromEntries(Object.entries(landscape.sprites).map(([kind,url])=>{
  if(!knownSprites.has(url)){
   const png=magick(['public'+url,'png:-']);
   knownSprites.set(url,'data:image/png;base64,'+png.toString('base64'));
  }
  return [kind,knownSprites.get(url)];
 }));
 const w=Math.round(1000/zoom),h=w*9/16;
 const left=Math.max(0,Math.min(1000-w,point[0]*10-w/2));
 const top=Math.max(0,Math.min(562.5-h,point[1]*5.625-h*.66));
 const svg=renderPanoramaSvg(landscape,{background,sprites}).replace('viewBox="0 0 1000 562.5"',
  'viewBox="'+[left,top,w,h].join(' ')+'"');
 const raster=new Resvg(svg,{fitTo:{mode:'width',value:width}}).render();
 if(raster.width!==width||raster.height!==width*9/16)throw Error('Dimensions inattendues pour le panorama.');
 return raster.asPng();
}

function captureCampaign(){
 const {snapshots}=simulateCampaign(trajectories.institutions);
 const low=simulateCampaign(trajectories.commerce).snapshots;
 const captures=[
  ['00-prologue',snapshots[0],1920,'Prologue de 1872'],
  ['01-fondation',snapshots[1],1920,'Fondation de Hotspring'],
  ['02-premiers-batiments',snapshots[2],1920,'Premières institutions'],
  ['03-corridor-et-comptoir',snapshots[3],1920,'Corridor et comptoir de la vallée'],
  ['04-rail-et-quartiers',snapshots[4],1920,'Rail et quartiers'],
  ['05-crises-et-services',low[5],1920,'Traces des crises et services'],
  ['06-charte-et-epilogue',snapshots.at(-1),3840,'Panorama de l’épilogue']
 ];
 for(const [name,s,w] of captures){
  const png=capture(hotspringLandscape(s),w);
  const webp=magick(['png:-','-strip','-define','webp:target-size=166000','-define','webp:pass=6','-quality','68','webp:-'],{input:png});
  writeFileSync(join(folder,name+'.webp'),webp);
  console.log(name,w+'×'+w*9/16,(webp.length/1024).toFixed(1)+' Kio',s.game.city);
 }
 return captures.map(([name,,,alt])=>({file:'captures/'+name+'.webp',alt}));
}

const writeJSON=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n');
const readJSON=path=>JSON.parse(readFileSync(path,'utf8'));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function buildMontage(rows,temp,section){
 const columns=3,limit=12;
 for(let start=0;start<rows.length;start+=limit){
  const group=rows.slice(start,start+limit);
  const file='captures/atlas-'+section+'-'+String(start/limit+1).padStart(2,'0')+'.webp';
  const images=[];
  for(const [i,row] of group.entries()){
   const {scene,point,zoom,alt,rendered}=visualComposition(row);
   const png=join(temp,'tile-'+i+'.png');
   writeFileSync(png,capture(scene,336,point,zoom));
   images.push(png);
   row.status='validé';
   row.alt=alt;
   row.renderer='Panorama de Hotspring · composition en jeu';
   row.provenance='Composition des tracés et des illustrations intégrés à Hotspring.';
   row.rights='Les calques peints conservent les crédits et les droits indiqués à leurs entrées.';
   row.composition={...rendered,preview:{file,column:i%columns,row:Math.floor(i/columns),
    columns,rows:Math.ceil(group.length/columns)}};
   delete row.plannedPath;
  }
  magick(['montage',...images,'-tile',columns+'x','-geometry','336x189+0+0','-background','#383026',
   '-strip','-quality','70',join(docs,file)]);
 }
}

function renderCard(item){
 const name=escape(item.alt),state=escape(item.status);
 let preview='';
 if(item.file){
  const file=escape('../../public'+item.file);
  preview='<a href="'+file+'"><img src="'+file+'" alt="'+name+'" loading="lazy"></a>';
 }else if(item.composition){
  const p=item.composition.preview;
  const url=escape(p.file);
  const x=p.column/(p.columns-1)*100;
  const y=p.rows>1?p.row/(p.rows-1)*100:0;
  preview='<a href="'+url+'" class="preview" title="Ouvrir la planche" role="img" aria-label="'+name+'" '+
    'style="background-image:url('+url+');background-size:'+p.columns*100+'% '+p.rows*100+'%;background-position:'+x+'% '+y+'%"></a>';
 }
 const result=item.result?' · '+escape(item.result):'';
 return '<article class="card" id="'+escape(item.id)+'">'+preview+
  '<h3>'+name+'</h3><p>'+escape(item.condition)+result+'</p>'+
  '<small>'+escape(item.id)+' · '+state+(item.composition?' · recomposition en jeu':'')+'</small></article>';
}

function buildGallery(assets,captures){
 const pictures=captures.map(({file,alt})=>'<figure><a href="'+file+'"><img src="'+file+'" alt="'+escape(alt)+
  '" loading="lazy"></a><figcaption>'+escape(alt)+'</figcaption></figure>').join('\n');
 const sections=[
  ['ouverture','Ouvertures des chapitres'],['en-tête','En-têtes des dilemmes'],['résultat','Résultats des votes'],
  ['charte','Chartes'],['panorama','Panoramas'],['calque','Calques et états de la ville'],['variante','Variantes conditionnelles']
 ].map(([kind,title])=>'<section><h2>'+title+'</h2><div class="grid">\n'+assets.filter(a=>a.kind===kind).map(renderCard).join('\n')+
  '\n</div></section>').join('\n');
 return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Les Colons de Hotspring · Galerie de contrôle</title>
<style>
body{font:16px/1.5 system-ui,sans-serif;background:#25201b;color:#f1e6d1;margin:0}
main{max-width:1440px;margin:auto;padding:clamp(16px,3vw,48px)}
h1,h2,h3{font-family:Georgia,serif;line-height:1.2}
h1{font-size:clamp(2rem,4.5vw,4rem);margin:.5em 0}
h2{margin-top:2em}
a{color:#f0c589}
a:focus-visible{outline:3px solid #e6bd80;outline-offset:3px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:15px}
.card,figure{margin:0;padding:12px;background:#362e26;border:1px solid #695846;border-radius:6px}
.card h3{font-size:1.02rem;margin:.7em 0 .35em}
.card p{margin:.35em 0}
.card small{display:block;color:#d1b99b;overflow-wrap:anywhere}
img,.preview{display:block;width:100%;aspect-ratio:16/9;object-fit:contain;background-color:#302922}
figcaption{padding-top:6px}
</style>
</head>
<body><main>
<h1>Les Colons de Hotspring</h1>
<p>Galerie de contrôle. Les compositions sont des rendus du panorama de jeu avec des états de vérification. Les planches s’ouvrent en grand en sélectionnant une image.</p>
<p><a href="manifeste-assets.json">Manifeste</a> · <a href="prompts-utilises.json">Prompts et provenance</a> · <a href="visuels-temporaires.md">Suivi de validation</a></p>
<section><h2>Croissance de Hotspring</h2><div class="grid">
${pictures}
</div></section>
${sections}
</main></body></html>
`;
}

const captures=captureCampaign();
if(process.argv.includes('--states')){
 const index=readJSON(join(docs,'manifeste-assets.json'));
 const temp=mkdtempSync(join(tmpdir(),'hotspring-atlas-'));
 const assets=[];
 try{
  for(const part of index.parts){
   const source=join(docs,part.path);
   const rows=readJSON(source);
   buildMontage(rows.filter(row=>!row.file),temp,part.path.match(/^manifeste-(.+)\.json$/)[1]);
   writeFileSync(source,'[\n'+rows.map(row=>'  '+JSON.stringify(row)).join(',\n')+'\n]\n');
   part.count=rows.length;
   assets.push(...rows);
  }
 }finally{rmSync(temp,{recursive:true,force:true});}
 writeJSON(join(docs,'manifeste-assets.json'),index);
 writeFileSync(join(docs,'galerie.html'),buildGallery(assets,captures));
 const pending=assets.filter(a=>a.status==='temporaire');
 const list=pending.map(a=>'- `'+a.id+'` · '+a.condition).join('\n');
 writeFileSync(join(docs,'visuels-temporaires.md'),
  '# Suivi des visuels de Hotspring\n\n'+
  (pending.length?pending.length+' entrées temporaires.\n\n'+list:'Le manifeste référence un fichier intégré ou une composition vérifiable pour chaque entrée.')+'\n\n'+
  'La galerie associe chaque composition à un rendu du moteur. La projection en salle reste l’étape de validation de la lisibilité à distance.\n');
 console.log(assets.filter(a=>a.file).length,'fichiers dans le jeu,',assets.filter(a=>a.composition).length,
  'compositions vérifiées,',pending.length,'temporaires');
}
