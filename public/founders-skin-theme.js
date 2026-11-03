import {TEAM_INKS} from './founders-identity.js';
// Presentation only. No rule, score, narrative or team identity depends on a skin.
export const SKIN_DESIGNS=Object.freeze({
 western:{title:'Western',subtitle:'Bois patiné · cuivre · grand ciel',sceneTitle:'La ville des pionniers',panel:'#262621',panel2:'#33332a',muted:'#bbb8aa',border:'#655d49',accent:'#e3b56d',font:'Georgia,serif',light:false},
 mafia:{title:'Prohibition',subtitle:'Art déco · laiton · nuit urbaine',sceneTitle:'Les lumières de la cité',panel:'#20252e',panel2:'#2b303a',muted:'#b8bfcd',border:'#6d624e',accent:'#e6c88c',font:'Georgia,serif',light:false},
 medieval:{title:'Médiéval',subtitle:'Pierre · enluminures · vert profond',sceneTitle:'La cité du royaume',panel:'#26332c',panel2:'#334238',muted:'#b5c4b5',border:'#62735c',accent:'#e1c58b',font:'Georgia,serif',light:false},
 futuriste:{title:'Futuriste',subtitle:'Verre · cyan · horizon orbital',sceneTitle:'La colonie des confins',panel:'#172735',panel2:'#203749',muted:'#a7c3d3',border:'#416477',accent:'#88e3ed',font:'system-ui,sans-serif',light:false},
 corporate:{title:'Corporate',subtitle:'Architecture claire · bleu encre · campus',sceneTitle:'Le campus en mouvement',panel:'#ffffff',panel2:'#eaf0f6',muted:'#4d6071',border:'#aebdcb',accent:'#1e648c',font:'system-ui,sans-serif',light:true}
});
export const nativeSkinScene=id=>Object.hasOwn(SKIN_DESIGNS,id);
export function applySkin(root,skin){
 const known=nativeSkinScene(skin?.id),design=known?SKIN_DESIGNS[skin.id]:SKIN_DESIGNS.western;
 root.dataset.skin=known?skin.id:'custom';
 const theme=skin?.theme??{background:'#1a1917',foreground:'#f2e9db'};
 const vars={'--bg':theme.background,'--paper':theme.foreground,'--panel':design.panel,'--panel2':design.panel2,'--muted':design.muted,'--border':design.border,'--gold':design.accent,'--accent':design.accent,'--heading-font':design.font};
 for(const [key,value] of Object.entries(vars))root.style.setProperty(key,value);
 root.style.colorScheme=design.light?'light':'dark';
 return design;
}
export function applyTeamTheme(root,color,skin){
 const light=skin?.id==='corporate';
 const accent=light?TEAM_INKS[color.id]:color.hex;
 root.style.setProperty('--team',accent);root.style.setProperty('--gold',accent);root.style.setProperty('--accent',accent);
 root.style.setProperty('--team-dark',light?'#eaf0f6':color.dark);
}
