import {ARCHETYPES,ZONES} from './map.ts';
import {validateEdition} from './editions.ts';
export const GOAL_RULES:Record<string,string>={O1:'Contrôler au moins 1 site S en fin de M5.',O2:'Contrôler au moins 3 provinces P/N/M en fin de M5.',O3:'Contrôler au moins 2 passages F en fin de M5.',O4:'Fournir au moins 2 soutiens décisifs sur les cinq manches.',O5:'Participer à 3 Conseils gagnants avec au moins 1 Influence dépensée à chacun.',O6:'Conquérir au moins 3 zones appartenant à une autre faction au début de leur manche.'};
export const BUILTIN_ASSETS={mapVector:'builtin:map33',backgroundIllustration:'builtin:theme',logo:'builtin:wordmark',introBackground:'builtin:theme',endBackground:'builtin:theme',audioOptional:null};
const ROOT=['themeId','rulesetId','mapId','editionVersion','publicationStatus','scenarioId','title','pitch','introduction','conclusion','resourceLabels','factionLabels','factionColors','factionPitches','factionPowerText','territoryLabels','councils','secretObjectiveText','assets'];
const plain=(x:any)=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function extraKeys(value:any,allowed:string[],label:string,errors:string[]){if(!plain(value)){errors.push(`${label} : objet requis`);return;}for(const k of Object.keys(value))if(!allowed.includes(k))errors.push(`${label}.${k} : champ non autorisé`);}
export function validateStudioEdition(e:any,publish=false):string[]{
 const errors=validateEdition(e);if(!plain(e))return errors;
 extraKeys(e,ROOT,'edition',errors);
 const text=(v:any,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 const narrative=(v:any,max:number)=>publish?text(v,max):v===undefined||(typeof v==='string'&&v.length<=max);
 for(const k of ['title','pitch','themeId','editionVersion'])if(!text(e[k],k==='pitch'?500:120))errors.push(`${k} : texte trop long ou vide`);
 if(!['western','mafia','corporate','medieval','futuriste'].includes(e.themeId))errors.push('Habillage intégré inconnu');
 for(const [k,ids,max] of [['resourceLabels',['means','influence','stability','prestige','council'],60],['factionLabels',ARCHETYPES,80],['territoryLabels',ZONES,80],['secretObjectiveText',Object.keys(GOAL_RULES),300]] as const){
  extraKeys(e[k],[...ids],k,errors);for(const id of ids)if(!text(e[k]?.[id],max))errors.push(`${k}.${id} : texte requis et limité à ${max} caractères`);
 }
 extraKeys(e.factionColors,[...ARCHETYPES],'factionColors',errors);
 for(const k of ['factionPitches','factionPowerText']){if(e[k]!==undefined)extraKeys(e[k],[...ARCHETYPES],k,errors);for(const id of ARCHETYPES){const v=e[k]?.[id];if(!narrative(v,600))errors.push(`${k}.${id} : texte requis (600 caractères maximum)`);}}
 for(const k of ['introduction','conclusion'])if(!narrative(e[k],2000))errors.push(`${k} : texte requis (2000 caractères maximum)`);
 if(Array.isArray(e.councils))for(const [i,c] of e.councils.entries()){
  if(!plain(c)){errors.push(`Conseil ${i+1} : objet requis`);continue;}
  extraKeys(c,['round','title','optionAEffectId','optionBEffectId','optionAText','optionBText'],`councils.${i}`,errors);
  if(!text(c.title,120))errors.push(`Conseil ${i+1} : titre requis`);
  for(const k of ['optionAText','optionBText'])if(!narrative(c[k],500))errors.push(`Conseil ${i+1} : ${k} requis (500 caractères maximum)`);
 }
 if(e.assets!==undefined)extraKeys(e.assets,Object.keys(BUILTIN_ASSETS),'assets',errors);
 if(publish)for(const [key,reference] of Object.entries(BUILTIN_ASSETS))if(e.assets?.[key]!==reference)errors.push(`assets.${key} : choisir l’habillage vectoriel intégré`);
 // Only data is accepted. No external URLs or executable media are imported.
 if(e.assets)for(const [key,v] of Object.entries(e.assets))if(v!==null&&v!=='TO_CREATE'&&v!==(BUILTIN_ASSETS as any)[key])errors.push(`assets.${key} : référence média non prise en charge`);
 return [...new Set(errors)];
}
export function studioCopy(input:any){const errors=validateStudioEdition(input);if(errors.length)throw new Error(errors.join(' · '));return structuredClone(input);}
