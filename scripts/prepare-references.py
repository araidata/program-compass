"""Normalize official reference inputs. No organization assessments or inferred mappings.
Inputs downloaded with TLS verification: csf-elements.json, nice-v2.2.0.json,
cjis-6.0.pdf (and optional cached cjis-pages.json) in --source-dir.
"""
import argparse, json, hashlib, re
from pathlib import Path
from pypdf import PdfReader
parser=argparse.ArgumentParser()
parser.add_argument('--source-dir',default='.vercel')
parser.add_argument('--out-dir',default='data/references')
args=parser.parse_args(); source=Path(args.source_dir); out=Path(args.out_dir);out.mkdir(parents=True,exist_ok=True)
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def canonical(data):return json.dumps(data,ensure_ascii=False,separators=(',',':'))
def write(name,data):
 (out/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 return hashlib.sha256(canonical(data).encode()).hexdigest()
csf_url='https://csrc.nist.gov/extensions/nudp/services/json/csf/elements'
csf=json.loads((source/'csf-elements.json').read_text(encoding='utf-8-sig'))['response']['elements']; rows=[]
def add_csf(node,parent=None):
 kind=node['elementTypeIdentifier']
 if kind not in ['function','category','subcategory']:return
 if any(c['elementTypeIdentifier']=='withdraw_reason' for c in node.get('elements',[])):return
 identifier=node['elementIdentifier']
 rows.append({'identifier':identifier,'title':node.get('title') or identifier,'description':node.get('text') or '', 'parent':parent,'kind':kind,'sourceUrl':'https://csrc.nist.gov/projects/cybersecurity-framework/filters','sourcePage':None,'deadline':None})
 for child in node.get('elements',[]):add_csf(child,identifier)
for node in csf:add_csf(node)
counts={k:sum(r['kind']==k for r in rows) for k in ['function','category','subcategory']}
assert counts=={'function':6,'category':22,'subcategory':106},counts
csf_data={'key':'nist-csf','name':'NIST Cybersecurity Framework','version':'2.0','sourceUrl':csf_url,'sourceSha256':digest(source/'csf-elements.json'),'requirements':rows}
# CJIS: actual normative body, excluding TOC/priority overview and appendices.
cache=source/'cjis-pages.json'
texts=json.loads(cache.read_text(encoding="utf-8")) if cache.exists() else [p.extract_text() or '' for p in PdfReader(source/'cjis-6.0.pdf').pages]
start=next(i for i,t in enumerate(texts) if i>20 and re.search(r'^5\.1 Policy Area 1:',t,re.M))
stop=next(i for i,t in enumerate(texts) if i>start and re.search(r'^APPENDICES\s*$',t,re.M))
records={};current=None;base_control=None
for index in range(start,stop):
 lines=texts[index].splitlines()
 for raw in lines:
  line=raw.strip()
  if not line or line in ['12/27/2024','CJISSECPOL v6.0'] or re.fullmatch(r'\d+',line):continue
  family=re.fullmatch(r'([A-Z][A-Z ,/&-]+)\s+\(([A-Z]{2})\)',line)
  control=re.match(r'^([A-Z]{2}-\d+)\s+([A-Z][A-Z 0-9,/()&|\-]+)$',line)
  legacy=re.match(r'^(5\.\d+(?:\.\d+)*)\s+([A-Z][^.]*)$',line)
  enhancement=re.match(r'^\((\d+)\)\s+([A-Z][A-Z 0-9, /()&\-]+\|.*)$',line) if base_control else None
  if family:
   identifier=family[2];title=family[1].strip();parent=None;kind='family';base_control=None
  elif control:
   identifier=control[1];title=control[2].strip();parent=identifier.split('-')[0];kind='control';base_control=identifier
   if parent not in records:records[parent]={'identifier':parent,'title':parent,'description':'','parent':None,'kind':'family','sourcePage':index+1}
  elif legacy:
   identifier=legacy[1];title=legacy[2].strip();parent=identifier.rsplit('.',1)[0] if identifier.count('.')>1 else None;kind='policy';base_control=None
  elif enhancement:
   identifier=base_control+'('+enhancement[1]+')';title=enhancement[2].strip();parent=base_control;kind='enhancement'
  else:
   if current:records[current]['description']+='\n'+line
   continue
  if identifier in records:
   # Repeated references are not independent requirements and never overwrite source facts.
   current=None
   continue
  records[identifier]={'identifier':identifier,'title':title,'description':line,'parent':parent,'kind':kind,'sourcePage':index+1};current=identifier
# Normative contractor addendum is separate from illustrative appendices/forms.
records['H']={'identifier':'H','title':'Security Addendum','description':'Contractor security addendum. Source Appendix H; organizational applicability requires review.','parent':None,'kind':'appendix','sourcePage':455}
current=None
for index in [454,455]:
 for raw in texts[index].splitlines():
  line=raw.strip()
  match=re.match(r'^(\d\.\d{2})\s+(.+)$',line)
  if match:
   number=match[1];identifier='H.'+number
   parent='H' if number.endswith('.00') else 'H.'+number[0]+'.00'
   records[identifier]={'identifier':identifier,'title':line,'description':line,'parent':parent,'kind':'addendum','sourcePage':index+1};current=identifier
  elif current and line and not re.match(r'^(12/27/2024|CJISSECPOL|H-\d)',line):records[current]['description']+='\n'+line
cjis_url='https://le.fbi.gov/file-repository/cjis_security_policy_v6-0_20241227.pdf'
for record in records.values():
 record['description']=record['description'].strip();record['sourceUrl']=cjis_url+'#page='+str(record['sourcePage']);record['deadline']=None
 # Pin the official implementation-marking policy (physical pp22-23). Existing
 # controls remain existing even when also marked Priority 2/3/4.
 if record['kind'] in ['control','enhancement']:
  marking=record['description'].split('Control:')[0]
  if '[Existing]' in marking or '[Priority 1]' in marking:record['deadline']='2024-10-01'
  elif re.search(r'\[Priority [234]\]',marking):record['deadline']='2027-09-30'
 if record['parent'] and record['parent'] not in records:raise ValueError('Missing CJIS parent '+record['parent'])
assert 'AC-1' in records and 'AC-2' in records and 'SR-12' in records
assert records['AC-1']['sourcePage']==37
cjis_data={'key':'cjis','name':'FBI CJIS Security Policy','version':'6.0','sourceUrl':cjis_url,'sourceSha256':digest(source/'cjis-6.0.pdf'),'requirements':list(records.values())}
# NICE semantics are kept independently of regulatory requirement references.
nice=json.loads((source/'nice-v2.2.0.json').read_text(encoding='utf-8-sig'));elements=[e for e in nice['elements'] if e['element_type'] not in ['sort','opm_code']];keys={e['element_identifier'] for e in elements}
nice_url='https://csrc.nist.gov/csrc/media/Projects/cprt/documents/nice/v2-2-0_nf_components.json'
nice_data={'version':'2.2.0','sourceUrl':nice_url,'sourceSha256':digest(source/'nice-v2.2.0.json'),'elements':elements,'relationships':[r for r in nice['relationships'] if r['source_element_identifier'] in keys and r['dest_element_identifier'] in keys]}
manifest={'normalizerVersion':1,'sources':[]}
for filename,data in [('nist-csf-2.0.json',csf_data),('cjis-6.0.json',cjis_data),('nice-2.2.0.json',nice_data)]:
 normalized=write(filename,data);manifest['sources'].append({'file':filename,'sourceUrl':data['sourceUrl'],'sourceSha256':data['sourceSha256'],'normalizedSha256':normalized})
write('manifest.json',manifest)
print(json.dumps({'csf':counts,'cjis':{k:sum(r['kind']==k for r in records.values()) for k in ['family','control','enhancement','policy']},'niceElements':len(elements),'niceRelationships':len(nice_data['relationships'])}))
