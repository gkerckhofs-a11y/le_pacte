import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {cinemaRoutes,playCinemaRoute} from '../test/helpers/hotspring-cinema-routes.mjs';

export function recordCinemaSimulations(){
 return Object.entries(cinemaRoutes).map(([id,route])=>{
  const {snapshots}=playCinemaRoute(route);
  const knownMarkers=new Set(),knownCrises=new Set();
  const chapters=snapshots.filter(s=>['CHECKPOINT','EPILOGUE'].includes(s.phase)).map(s=>{
   const markers=s.campaign.markers.filter(m=>!knownMarkers.has(m));
   const playedCrises=s.campaign.playedCrises.filter(m=>!knownCrises.has(m));
   for(const marker of markers)knownMarkers.add(marker);
   for(const crisis of playedCrises)knownCrises.add(crisis);
   return {stage:s.phase==='EPILOGUE'?7:s.campaign.chapter,city:s.game.city,markers,playedCrises,charter:s.campaign.charter};
  });
  return {id,title:route.label,chapters};
 });
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const path=new URL('../content/hotspring-cinema-simulations-v1.json',import.meta.url);
 writeFileSync(path,JSON.stringify(recordCinemaSimulations(),null,2)+'\n');
}
