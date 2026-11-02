export const RULESET = 'pacte-neutral-1.1';
export const ARCHETYPES = ['force','commerce','pouvoir','diplomatie','industrie','renseignement'] as const;
export type TeamId = typeof ARCHETYPES[number];
export const ZONES = [...'CPNMF'].flatMap(t => Array.from({length:6}, (_,i)=>`${t}${i+1}`)).concat(['S1','S2','S3']);
const pairs = new Set<string>();
function link(a:string,b:string) { pairs.add([a,b].sort().join(':')); }
for(let i=1;i<=6;i++) {
  const prev=i===1?6:i-1, next=i===6?1:i+1, s=Math.floor((i-1)/2)+1;
  link(`C${i}`,`P${i}`); link(`P${i}`,`N${i}`); link(`N${i}`,`M${i}`);
  for(const type of ['P','M']) { link(`${type}${i}`,`F${i}`); link(`${type}${i}`,`F${prev}`); }
  link(`M${i}`,`S${s}`); link(`F${i}`,`S${s}`);
  if(i%2===0) link(`F${i}`,`S${s===3?1:s+1}`);
}
link('S1','S2'); link('S2','S3'); link('S3','S1');
export const EDGES = [...pairs].sort().map(p=>p.split(':'));
export const NEIGHBORS = Object.fromEntries(ZONES.map(z=>[z,EDGES.flatMap(([a,b])=>a===z?[b]:b===z?[a]:[]).sort()]));
export const value = (z:string) => z[0]==='S'?2:/^[PNM]/.test(z)?1:0;
