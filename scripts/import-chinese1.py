"""Build the Chinese 1 study archive from captured MDL records and verified files.
Run from website: python3 scripts/import-chinese1.py [capture-directory]
Source strings are data. Never execute source markup or scripts.
"""
from pathlib import Path
import json,sys,re,shutil,os,collections,zipfile
ROOT=Path(__file__).resolve().parents[1]
SRC=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT.parent/'mdl/chinese1'
OUT=ROOT/'library/chinese1';OUT.mkdir(parents=True,exist_ok=True)
def load(p,default=None):return json.loads(p.read_text()) if p.exists() else default
raw={p.stem:load(p)['data'] for p in (SRC/'raw').glob('*.json')}
media=load(SRC/'media-manifest.json',[])
media_map={r['source']:'/library/chinese1/media/'+r['file'] for r in media if r['status']=='downloaded'}
def copy(src,dst):
 dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists():
  if dst.stat().st_size==src.stat().st_size:return
  dst.unlink()
 try:os.link(src,dst)
 except OSError:shutil.copy2(src,dst)
for r in media:
 if r['status']=='downloaded':copy(SRC/'media'/r['file'],OUT/'media'/r['file'])
def langs(value):return {r.get('key','').upper():r.get('value','') for r in value or [] if isinstance(r,dict) and r.get('value')}
def clean(obj):
 if isinstance(obj,list):
  if obj and all(isinstance(x,dict) and 'key' in x and 'value' in x for x in obj):return langs(obj)
  return [clean(x) for x in obj]
 if isinstance(obj,dict):return {k:clean(v) for k,v in obj.items() if k not in ['_id','__v','create','style','template']}
 return obj
nodes={}
def lesson_for(code):
 seen=set()
 while code and code not in seen:
  seen.add(code)
  m=re.fullmatch(r'HP02-(\d+)(?:-\d+)*',code)
  if m:return int(m[1]) if 1<=int(m[1])<=10 else 0
  code=raw.get(code,{}).get('mainCodeItem')
 return 0
for code,d in sorted(raw.items()):
 nodes[code]={'code':code,'lesson':lesson_for(code),'parent':d.get('mainCodeItem'),'children':d.get('subContent',[]),'kind':d['type'],'templates':clean(d['templates']),'answers':clean(d.get('correctAnswers'))}
lessons=[]
for item in raw['HP01-1']['templates'][0]['content']['item']:
 code=item['navigate']['action']; num=int(code.split('-')[1]); node=nodes[code];title=langs(item['title']);
 lessons.append({'id':num,'code':code,'title':title,'art':item['icon']['enable']['data'],'chapters':sum(len(n.get('item',[])) for n in node['templates'][0]['content']['nav']),'pages':sum(n['lesson']==num and bool(n['templates']) for n in nodes.values())})
vocab=[]
for code,n in nodes.items():
 if not code.startswith('CTA04-'):continue
 for t in n['templates']:
  c=t['content'];title=c.get('title',{}); hanzi=title.get('CN','').strip();py=title.get('PIN IN','').strip();meaning=title.get('EN','').strip()
  if not hanzi or not meaning:continue
  items=c.get('item',[]);image=next((media_map.get(i.get('data')) for i in items if i.get('type')==1),None)
  audio=next((media_map.get(i.get('data')) for i in items if i.get('type')==2),None)
  vocab.append({'id':'c1-'+code,'code':code,'lesson':n['lesson'],'hanzi':hanzi,'pinyin':py,'meaning':meaning,'image':image,'audio':audio,'source':'MFU MDL Chinese 1','note':'Original source wording and pinyin.'})
classroom=load(SRC/'classroom-manifest.json',{'resources':[]})
for r in classroom['resources']:
 if r['status']=='downloaded':
  copy(SRC/'classroom'/r['file'],OUT/'classroom'/r['file']);r['url']='/library/chinese1/classroom/'+r['file']
errors=load(SRC/'capture-status.json',{}).get('errors',[])
referenced=load(SRC/'asset-references.json',[])
stats={'nodes':len(nodes),'pages':sum(len(n['templates']) for n in nodes.values()),'vocabulary':len(vocab),'questions':sum(len(t.get('content',{}).get('question',[])) for n in nodes.values() for t in n['templates']),'mediaReferenced':len(referenced),'mediaDownloaded':len(media_map),'mediaFailed':len(referenced)-len(media_map),'classroomReferenced':len(classroom['resources']),'classroomDownloaded':sum(r['status']=='downloaded' for r in classroom['resources'])}
data={'version':1,'capturedAt':'2026-09-23','source':'https://mdl.mfu.ac.th/#/v4/HP01/1','lessons':lessons,'nodes':nodes,'vocab':vocab,'media':media_map,'mediaGaps':[{'source':r['source'],'error':r.get('error',r['status'])} for r in media if r['status']!='downloaded'],'classroom':classroom,'gaps':errors,'stats':stats}
(ROOT/'content/chinese1.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
index=[{**l,'art':media_map[l['art']],'words':sum(w['lesson']==l['id'] for w in vocab)} for l in lessons]
(ROOT/'content/chinese1-lessons.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
(OUT/'media-manifest.json').write_text(json.dumps(media,ensure_ascii=False,indent=2))
(OUT/'classroom-manifest.json').write_text(json.dumps(classroom,ensure_ascii=False,indent=2))
with zipfile.ZipFile(OUT/'source-records.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted((SRC/'raw').glob('*.json')):z.write(p,'raw/'+p.name)
 for n in ['capture-status.json','classroom-manifest.json','media-manifest.json']:
  if (SRC/n).exists():z.write(SRC/n,n)
print(json.dumps(stats,indent=2))
