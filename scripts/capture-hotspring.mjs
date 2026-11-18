import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {Resvg} from '@resvg/resvg-js';
import {simulateCampaign,trajectories} from '../test/helpers/hotspring.mjs';
import {hotspringLandscape} from '../src/hotspring-landscape.ts';
import {renderPanoramaSvg,VALLEY_PLATE} from '../public/hotspring-panorama.js';

const folder='docs/hotspring/captures';
mkdirSync(folder,{recursive:true});
const plate=execFileSync('magick',['public'+VALLEY_PLATE,'-quality','90','jpeg:-']);
const background='data:image/jpeg;base64,'+plate.toString('base64');
const {snapshots}=simulateCampaign(trajectories.institutions);
const low=simulateCampaign(trajectories.commerce).snapshots;
const captures=[
 ['00-prologue',snapshots[0],1920],
 ['01-fondation',snapshots[1],1920],
 ['02-premiers-batiments',snapshots[2],1920],
 ['03-corridor-et-comptoir',snapshots[3],1920],
 ['04-rail-et-quartiers',snapshots[4],1920],
 ['05-crises-et-services',low[5],1920],
 ['06-charte-et-epilogue',snapshots.at(-1),3840]
];
for(const [name,s,w] of captures){
 const landscape=hotspringLandscape(s);
 const sprites=Object.fromEntries(Object.entries(landscape.sprites).map(([kind,url])=>{
  const png=execFileSync('magick',['public'+url,'png:-']);
  return [kind,'data:image/png;base64,'+png.toString('base64')];
 }));
 const svg=renderPanoramaSvg(landscape,{background,sprites});
 const raster=new Resvg(svg,{fitTo:{mode:'width',value:w}}).render();
 if(raster.width!==w||raster.height!==w*9/16)throw Error('Dimensions inattendues : '+name);
 const webp=execFileSync('magick',['png:-','-strip','-define','webp:target-size=166000','-define','webp:pass=6','-quality','68','webp:-'],{input:raster.asPng()});
 writeFileSync(folder+'/'+name+'.webp',webp);
 console.log(name,raster.width+'×'+raster.height,(webp.length/1024).toFixed(1)+' Kio',s.game.city);
}
