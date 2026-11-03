// Fixed palette: colors are public team identifiers, unrelated to secret ambitions.
export const TEAM_COLORS=Object.freeze([
 {id:'bleu',label:'Bleue',symbol:'◆',hex:'#82baff',dark:'#142b43'},
 {id:'rouge',label:'Rouge',symbol:'●',hex:'#ff9792',dark:'#3b2026'},
 {id:'vert',label:'Verte',symbol:'▲',hex:'#92d6b1',dark:'#19382d'},
 {id:'jaune',label:'Jaune',symbol:'☀',hex:'#f2ce76',dark:'#3b321e'},
 {id:'violet',label:'Violette',symbol:'✦',hex:'#c4abff',dark:'#2e2443'},
 {id:'orange',label:'Orange',symbol:'■',hex:'#ffb679',dark:'#3c291c'}
].map(Object.freeze));
export const DEFAULT_TEAM_COLORS=Object.freeze(TEAM_COLORS.map(c=>c.id));
export function teamColor(id){return TEAM_COLORS.find(c=>c.id===id);}
export function teamCaption(f){return (f.color?f.color.symbol+' Équipe '+f.color.label+' · ':'')+f.name;}
export function teamLabel(data,id){const f=data.families.find(f=>f.id===id);return f?teamCaption(f):id;}
export const TEAM_INKS=Object.freeze({bleu:'#185f9d',rouge:'#a42829',vert:'#246044',jaune:'#755300',violet:'#644295',orange:'#8e481a'});
export function colorize(element,f){if(f?.color){element.style.setProperty('--team',document.body.dataset.skin==='corporate'?TEAM_INKS[f.color.id]:f.color.hex);element.classList.add('team-marker');}}

export const DEFAULT_TEAM_NAMES=Object.freeze({bleu:'Blueberry',rouge:'Redcreek',vert:'Greenrock',jaune:'Yellowstone',violet:'Purplerain',orange:'Pumpkins'});
