import {ARCHETYPES,ZONES,RULESET} from './map.ts';
export function validateEdition(e:any):string[] {
 const errors:string[]=[];
 if(!e||typeof e!=='object')return ['Édition invalide'];
 if(e.rulesetId!==RULESET)errors.push('Ruleset incompatible');
 if(e.mapId!=='pacte-map-33-v1')errors.push('Carte incompatible');
 const text=(v:unknown)=>typeof v==='string'&&v.trim().length>0;
 for(const k of ['title','pitch','editionVersion','themeId'])if(!text(e[k]))errors.push(k);
 for(const k of ['means','influence','stability','prestige','council'])if(!text(e.resourceLabels?.[k]))errors.push(`resourceLabels.${k}`);
 for(const id of ARCHETYPES){if(!text(e.factionLabels?.[id]))errors.push(`factionLabels.${id}`);if(!/^#[0-9a-f]{6}$/i.test(e.factionColors?.[id]??''))errors.push(`factionColors.${id}`);}
 for(const id of ZONES)if(!text(e.territoryLabels?.[id]))errors.push(`territoryLabels.${id}`);
 if(Object.keys(e.territoryLabels??{}).some(z=>!ZONES.includes(z)))errors.push('Territoire inconnu');
 const effects=[['M1_LOGISTICS','M1_LOCAL_DEFENSE'],['M2_NEUTRAL_EXPANSION','M2_SITE_DEFENSE'],['M3_SUPPORT_BOOST','M3_RESERVE'],['M4_SITE_OFFENSE','M4_SITE_FORTRESS'],['M5_REPAIR','M5_MOBILIZATION']];
 if(!Array.isArray(e.councils)||e.councils.length!==5)errors.push('Cinq Conseils requis');
 for(let i=0;i<5;i++){const c=e.councils?.[i];if(c?.round!==i+1||!text(c?.title)||c?.optionAEffectId!==effects[i][0]||c?.optionBEffectId!==effects[i][1])errors.push(`Conseil ${i+1} incompatible`);}
 for(let i=1;i<=6;i++)if(!text(e.secretObjectiveText?.[`O${i}`]))errors.push(`Objectif O${i}`);
 return errors;
}
export function editionSnapshot(e:any) {const errors=validateEdition(e);if(errors.length)throw new Error(errors.join(', '));return structuredClone(e);}
