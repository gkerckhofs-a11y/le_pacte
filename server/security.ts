import {randomInt,createHash} from 'node:crypto';
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export function shuffle<T>(items:T[]):T[]{const out=[...items];for(let i=out.length-1;i>0;i--){const j=randomInt(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
