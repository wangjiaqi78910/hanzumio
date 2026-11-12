"""Split the remaining work into batch files for the agents:
fix-NN.json   lines whose pinyin could not be aligned with the Chinese (or has no pinyin)
tr-NN.json    dialogues with a missing Korean / English translation
gloss-NN.json words that are not in the 11000-word dictionary (need POS + meanings)
chk-NN.json   translations that were split by sentence punctuation (need a check)
"""
import json, os, sys, collections

XL = sys.argv[1]
A = json.load(open(f'{XL}/aligned.json', encoding='utf-8'))
F = json.load(open(f'{XL}/failed.json', encoding='utf-8'))
U = json.load(open(f'{XL}/unknown.json', encoding='utf-8'))
OUT = f'{XL}/batches'
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))
items = {it['id']: it for it in A['items']}

def write(kind, rows, size):
    files = []
    for k in range(0, len(rows), size):
        n = len(files) + 1
        path = f'{OUT}/{kind}-{n:02d}.json'
        json.dump(rows[k:k + size], open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        files.append(dict(path=os.path.abspath(path), n=len(rows[k:k + size])))
    return files

# 1. pinyin fixes
fix = []
for f in F:
    it = items[f['id']]
    li = next(k for k, l in enumerate(it['lines']) if l['zh'] == f['zh'])
    l = it['lines'][li]
    fix.append(dict(key=f"{f['id']}:{li}", lv=f['lv'], zh=f['zh'], py=f['py'], en=l['en'], ko=l['ko'],
                    context=[x['zh'] for k, x in enumerate(it['lines']) if k != li],
                    problem=f.get('reason', ''), token=f.get('token', '')))
seen = {x['key'] for x in fix}
for it in A['items']:
    for li, l in enumerate(it['lines']):
        key = f"{it['id']}:{li}"
        if not l['py'] and key not in seen:
            fix.append(dict(key=key, lv=it['lv'], zh=l['zh'], py='', en=l['en'], ko=l['ko'],
                            context=[x['zh'] for k, x in enumerate(it['lines']) if k != li], problem='no-pinyin', token=''))

# 2. translations
tr = []
for it in A['items']:
    need = {}
    for li, l in enumerate(it['lines']):
        miss = [f for f in ('ko', 'en') if not l[f]]
        if miss:
            need[str(li)] = miss
    if need:
        tr.append(dict(key=it['id'], kind=it['kind'], lv=it['lv'], word=it['hz'], word_py=it['py'],
                       lines=[dict(i=li, zh=l['zh'], py=l['py'], en=l['en'], ko=l['ko']) for li, l in enumerate(it['lines'])],
                       need=need))

# 3. glosses
gloss = [dict(hz=u['hz'], py=u['py'], lv=u['lv'], n=u['n'], example=u['ex']) for u in U]
for m in A['dictionary']:
    if not m['ko'] or not m['en']:
        gloss.append(dict(hz=m['hz'], py=m['py'], lv=m['lv'], n=0, example='', pos=m['pos'], en=m['en'], ko=m['ko']))

# 4. checks of guessed splits
chk = []
for it in A['items']:
    if any(l.get('guess') for l in it['lines']):
        chk.append(dict(key=it['id'], lv=it['lv'], guessed=sorted({g for l in it['lines'] for g in l.get('guess', [])}),
                        lines=[dict(i=li, zh=l['zh'], py=l['py'], en=l['en'], ko=l['ko']) for li, l in enumerate(it['lines'])]))

index = dict(fix=write('fix', fix, 50), tr=write('tr', tr, 40), gloss=write('gloss', gloss, 120), chk=write('chk', chk, 40))
json.dump(index, open(f'{OUT}/index.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print({k: (len(v), sum(x['n'] for x in v)) for k, v in index.items()})
print('tr lines needing ko:', sum(1 for t in tr for v in t['need'].values() if 'ko' in v),
      'en:', sum(1 for t in tr for v in t['need'].values() if 'en' in v))
