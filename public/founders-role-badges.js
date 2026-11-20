import {teamLabel} from './founders-identity.js';
export function familyRoles(state,id){
 return [state.leader===id?'mayor':null,state.moderator===id?'sheriff':null].filter(Boolean);
}
const labels={mayor:'Maire',sheriff:'Shérif'};
const chicagoLabels={mayor:'L’Homme du Maire',sheriff:'L’Homme du Commissaire'};
export const roleLabel=(state,role)=>(state?.chicago?chicagoLabels:labels)[role];
const paths={mayor:'M7 17 6 5Q12 2 18 5L17 17ZM3 17Q12 20 21 17L21 20Q12 23 3 20Z',sheriff:'M12 2 15 7 21 7 18 12 21 17 15 17 12 22 9 17 3 17 6 12 3 7 9 7Z'};
export function roleBadge(role,state){
 const badge=document.createElement('span');badge.className='council-role-badge';badge.title=roleLabel(state,role);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',paths[role]);svg.append(path);
 const label=document.createElement('span');label.textContent=roleLabel(state,role);badge.append(svg,label);return badge;
}
export function appendFamilyRoles(root,state,id){for(const role of familyRoles(state,id))root.append(roleBadge(role,state));}
export function renderCouncilRoles(root,state){
 root.replaceChildren();
 for(const [role,id] of [['mayor',state.leader],['sheriff',state.moderator]]){
  const item=document.createElement('div');item.className='council-office';item.append(roleBadge(role,state));
  const name=document.createElement('strong');name.textContent=teamLabel(state,id);item.append(name);root.append(item);
 }
}
