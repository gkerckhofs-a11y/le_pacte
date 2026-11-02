import data from '../content/editions.json' with {type:'json'};
import {ARCHETYPES,EDGES,NEIGHBORS,ZONES} from '../src/map.ts';
export const catalog=data.editions;
export const map={zones:ZONES,edges:EDGES,neighbors:NEIGHBORS,archetypes:ARCHETYPES};
