"""Build shared, irregular borders. No game rules or graph mutations.
Optional verification: pip install shapely; node exports the canonical graph to JSON.
"""
import math, random, hashlib, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CX,CY,SX,SY=720,555,625,450
R=.29; H=9; A=21
cache={}
def polar(a,r):
 a=math.radians(a);return (r*math.cos(a),r*math.sin(a))
def warp(p):
 x,y=p;r=math.hypot(x,y);a=math.atan2(y,x)
 # Monotone angular deformation, radial coastline variation, then two shears.
 # These transforms break the radial silhouette without changing contact topology.
 a+=.13*math.sin(a+.6)+.085*math.sin(2*a-.4)
 r*=1+.105*math.sin(3*a+.8)+.045*math.sin(5*a-.2)
 x,y=r*math.cos(a),r*math.sin(a)
 x+=.20*math.sin(2.3*y)+.06*y*y
 y+=.13*math.sin(2.7*x)-.04*x
 return (CX+555*x+12*math.sin(7*y-2*x),CY+395*y+10*math.sin(6*x+2*y))
def edge(key,raw):
 if key in cache:return cache[key]
 rng=random.Random(int(hashlib.sha256(key.encode()).hexdigest()[:12],16));ps=[warp(p) for p in raw];out=[];phase=rng.uniform(0,2*math.pi);length=sum(math.dist(ps[j],ps[j+1]) for j in range(len(ps)-1));amp=min(13,length/15)
 for i,(x,y) in enumerate(ps):
  if 0<i<len(ps)-1:
   dx,dy=ps[i+1][0]-ps[i-1][0],ps[i+1][1]-ps[i-1][1];d=math.hypot(dx,dy);t=i/(len(ps)-1);v=(rng.uniform(-2.7,2.7)+amp*math.sin(2*math.pi*t+phase)+amp*.45*math.sin(4*math.pi*t+phase))*math.sin(math.pi*t);x-=dy/d*v;y+=dx/d*v
  out.append([round(x,3),round(y,3)])
 cache[key]=out;return out
def arc(key,a,b,r,n=16):return edge(key,[polar(a+(b-a)*i/n,r(i/n) if callable(r) else r) for i in range(n+1)])
def radial(key,a,lo,hi):return edge(key,[polar(a,lo+(hi-lo)*i/12) for i in range(13)])
def join(*parts):
 out=[]
 for part in parts:
  for p in part:
   if not out or p!=out[-1]:out.append(p)
 if out[-1]==out[0]:out.pop()
 return out
def rev(x):return list(reversed(x))
angles={i:-90+(i-1)*60 for i in range(1,7)}
# Each shared edge is generated once and reused in reverse by its neighbor.
for i,a in angles.items():
 arc(f'im{i}',a-A,a+A,R)
 arc(f'fa{i}',a+30-H,a+30,R,8);arc(f'fb{i}',a+30,a+30+H,R,8)
 for s,theta in [('l',a-A),('r',a+A)]:
  radial(f'{s}lo{i}',theta,R,.62);radial(f'{s}hi{i}',theta,.62,1)
 arc(f'ni{i}',a-A,a+A,lambda t:.62+.012*math.sin(2*math.pi*t)-.10*math.sin(math.pi*t)**.85,24)
 arc(f'no{i}',a-A,a+A,lambda t:.62+.012*math.sin(2*math.pi*t)+.10*math.sin(math.pi*t)**.85,24)
 arc(f'ol{i}',a-A,a-10,1,8);arc(f'oc{i}',a-10,a+10,1,12);arc(f'or{i}',a+10,a+A,1,8)
 arc(f'cap{i}',a-10,a+10,lambda t:.865+.135*abs(2*t-1)**1.45,20)
 arc(f'of{i}',a+30-H,a+30+H,1,12)
for k in [0,120,240]:radial(f'core{k}',k,0,R)
regions={};positions={}
for i,a in angles.items():
 nxt=i%6+1
 regions[f'M{i}']=join(cache[f'llo{i}'],cache[f'ni{i}'],rev(cache[f'rlo{i}']),rev(cache[f'im{i}']))
 regions[f'N{i}']=join(cache[f'no{i}'],rev(cache[f'ni{i}']))
 regions[f'P{i}']=join(cache[f'lhi{i}'],cache[f'ol{i}'],cache[f'cap{i}'],cache[f'or{i}'],rev(cache[f'rhi{i}']),rev(cache[f'no{i}']))
 regions[f'C{i}']=join(cache[f'oc{i}'],rev(cache[f'cap{i}']))
 regions[f'F{i}']=join(cache[f'rlo{i}'],cache[f'rhi{i}'],cache[f'of{i}'],rev(cache[f'lhi{nxt}']),rev(cache[f'llo{nxt}']),rev(cache[f'fb{i}']),rev(cache[f'fa{i}']))
 for typ,r in [('C',.948),('P',.795),('N',.62),('M',.41)]:positions[f'{typ}{i}']=[round(v,2) for v in warp(polar(a,r))]
 positions[f'F{i}']=[round(v,2) for v in warp(polar(a+30,.79))]
for s,first,start,end in [(1,1,240,0),(2,3,0,120),(3,5,120,240)]:
 prev=(first-2)%6+1;second=first+1
 regions[f'S{s}']=join(cache[f'core{start}'],cache[f'fb{prev}'],cache[f'im{first}'],cache[f'fa{first}'],cache[f'fb{first}'],cache[f'im{second}'],cache[f'fa{second}'],rev(cache[f'core{end}']))
 positions[f'S{s}']=[round(v,2) for v in warp(polar(angles[first]+30,.21))]
# Optional geometry audit against the authoritative graph, without renderer assumptions.
if __name__=='__main__':
 import subprocess
 from shapely.geometry import Polygon,Point,box
 from shapely.ops import unary_union
 graph=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {EDGES} from './src/map.ts';console.log(JSON.stringify(EDGES))"],cwd=ROOT,text=True))
 polys={k:Polygon(v) for k,v in regions.items()}
 # Keep ordinary place names clear of the larger fort/site illustrations.
 buildings=[box(x-45,y-70,x+45,y+2) for z,(x,y) in positions.items() if z[0] in 'CS']
 for zone,(x,y) in list(positions.items()):
  if zone[0] in 'CS':continue
  candidates=[]
  for dx in range(-50,51,10):
   for dy in range(-40,41,10):
    px,py=x+dx,y+dy
    if not polys[zone].contains(Point(px,py)):continue
    label=box(px-85,py-7,px+85,py+18)
    overlap=sum(label.intersection(b).area for b in buildings)
    candidates.append((overlap*1000+dx*dx+dy*dy,px,py))
  _,px,py=min(candidates);positions[zone]=[round(px,2),round(py,2)]
 for k,p in polys.items():
  assert p.is_valid and p.area>500,k
  assert p.contains(Point(positions[k])),('label outside',k)
 actual=[];overlap=0
 keys=sorted(polys)
 for j,a in enumerate(keys):
  for b in keys[j+1:]:
   overlap+=polys[a].intersection(polys[b]).area
   if polys[a].boundary.intersection(polys[b].boundary).length>1:actual.append((a,b))
 assert overlap<.01,overlap
 assert set(actual)=={tuple(sorted(e)) for e in graph},('adjacency mismatch',set(actual)^{tuple(sorted(e)) for e in graph})
 union=unary_union(list(polys.values()));assert union.geom_type=='Polygon' and not union.interiors,'gap in map'
 rivers=[join(cache['llo3'],cache['lhi3'])]
 ridges=[cache['im6'],cache['im4']]
 data='// Generated by scripts/build-western-territories.py; shared boundaries match the game graph.\nexport const westernRegions='+json.dumps(regions,separators=(',',':'))+';\nexport const westernPositions='+json.dumps(positions,separators=(',',':'))+';\nexport const westernRivers='+json.dumps(rivers,separators=(',',':'))+';\nexport const westernRidges='+json.dumps(ridges,separators=(',',':'))+';\n'
 (ROOT/'public/western-territories.js').write_text(data)
 print(f'{len(polys)} valid territories; {len(actual)} exact adjacencies; no overlaps or interior gaps')
