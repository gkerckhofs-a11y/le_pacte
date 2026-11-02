import type {State} from './engine.ts';
export type RevealControl={round:number;step:number};
export function replayView(game:State,control?:RevealControl){
 if(!control)return null;
 const result=game.results.find(r=>r.round===control.round);
 if(!result||!Number.isInteger(control.step)||control.step<0||control.step>3)throw new Error('Étape de révélation invalide');
 const owners=structuredClone(game.owners);
 // Undo subsequent captures, and the chosen round until its final step.
 // These are archived results; no combat or scoring function is called.
 for(const r of [...game.results].reverse())if(r.round>control.round||(r.round===control.round&&control.step<3))for(const b of r.battles)owners[b.target]=b.before;
 return{...control,owners,result:structuredClone(result)};
}
