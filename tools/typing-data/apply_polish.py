"""polish-NN.out.json (+ .chk.json corrections) -> dict-override.json keyed by 汉字|拼音"""
import sys, json, re, glob, unicodedata
XL = sys.argv[1]
def py_key(s):
    return re.sub(r"[\s'’\-]", '', unicodedata.normalize('NFC', s)).lower()
over = {}
n = 0
for path in sorted(glob.glob(f'{XL}/out/polish-*.out.json')) + sorted(glob.glob(f'{XL}/out/polish-*.chk.json')):
    try:
        rows = json.load(open(path, encoding='utf-8'))
    except Exception as e:
        print('cannot read', path, e); continue
    for r in rows:
        if not r.get('hz') or not r.get('py'):
            continue
        over[f"{r['hz']}|{py_key(r['py'])}"] = {'pos': r.get('pos', ''), 'en': r.get('en', ''), 'ko': r.get('ko', '')}
        n += 1
json.dump(over, open(f'{XL}/out/dict-override.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('override entries', len(over), 'from', n, 'rows')
