"""Encode selected masters for the web and build the versioned illustrated release.
No cropping, compositing, resizing or semantic edits: only PNG -> WebP encoding.
Run after all 50 production assets have been selected and inspected.
"""
from pathlib import Path
import json, hashlib, html
from PIL import Image
from io import BytesIO
import argparse
root=Path(__file__).resolve().parent.parent
production=json.loads((root/'content/founders-illustration-production-v1.json').read_text())
jobs=production['jobs']
parser=argparse.ArgumentParser();parser.add_argument('--masters-dir',type=Path);args=parser.parse_args()
def master(j):return args.masters_dir/(j['id']+'.png') if args.masters_dir else root/j['path']
missing=[j['path'] for j in jobs if not master(j).is_file()]
if missing:raise SystemExit('Missing masters: '+', '.join(missing))
manifest={}
for j in jobs:
 source=master(j);target=(root/j['path']).with_suffix('.webp')
 with Image.open(source) as im:
  assert im.width>=1200 and im.width>im.height,(j['id'],im.size)
  encoded=BytesIO();im.convert('RGB').save(encoded,'WEBP',quality=88,method=6)
 target.write_bytes(encoded.getvalue())
 path=target.relative_to(root).as_posix()
 manifest[j['id']]={'path':path,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'image':{
  'url':'https://le-pacte-ludificateur.web.app/'+path.removeprefix('public/'),
  'alt':j['alt'],'credit':'Illustration générée avec OpenAI, novembre 2026','license':None}}
story=json.loads((root/'content/founders-hybrid-demo-v1-2.json').read_text())
for d in story['dilemmas']:
 key=d['id'].lower()
 if key in manifest:d['image']=manifest[key]['image']
 for side in ['pour','contre']:d['outcomes'][side]['chronicle']['image']=manifest[key+'-'+side]['image']
(root/'content/founders-illustrations-v1.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(root/'content/founders-hybrid-demo-v1-3.json').write_text(json.dumps(story,ensure_ascii=False,indent=2)+'\n')
parts=['<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hot Spring — Illustrations</title><style>body{background:#211b17;color:#efe4cd;font:17px Georgia,serif;max-width:1500px;margin:40px auto;padding:20px}section{border-top:1px solid #79644c;margin-top:45px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}img{width:100%;height:auto}figure{margin:0}figcaption{padding:12px 0}a{color:#efd5a3}</style><h1>Les Chroniques de Hot Spring</h1><p>20 dilemmes · 40 résolutions. Galerie de conception : révèle toutes les issues.</p>']
for d in story['dilemmas']:
 parts.append('<section><h2>'+html.escape(d['id']+' — '+d['title'])+'</h2><div class="grid">')
 entries=[('Avant le vote',d['image'])]+[(side.upper()+' — '+d['labels'][side],d['outcomes'][side]['chronicle']['image']) for side in ['pour','contre']]
 for label,im in entries:
  src='../public/'+im['url'].split('.web.app/')[1]
  parts.append('<figure><a href="'+src+'"><img loading="lazy" src="'+src+'" alt="'+html.escape(im['alt'],quote=True)+'"></a><figcaption>'+html.escape(label)+'</figcaption></figure>')
 parts.append('</div></section>')
parts.append('</html>')
(root/'docs/hot-spring-illustrations.html').write_text('\n'.join(parts))
print('Packaged',len(manifest),'assets;',sum((root/v['path']).stat().st_size for v in manifest.values()),'bytes')
