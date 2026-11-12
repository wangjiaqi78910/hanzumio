"""polish-NN.out.json (+ .chk.json corrections) -> dict-override.json keyed by 汉字|原拼音.
The agents may also correct the pinyin itself: the override then carries the new py."""
import sys, json, re, glob, unicodedata, os
XL = sys.argv[1]
def py_key(s):
    return re.sub(r"[\s'’\-]", '', unicodedata.normalize('NFC', s)).lower()
def tl(s):
    out = []
    for ch in unicodedata.normalize('NFD', s):
        if unicodedata.combining(ch):
            if ch == '̈' and out and out[-1] == 'u':
                out[-1] = 'v'
            continue
        out.append(ch.lower())
    return ''.join(out)
over, n, pychanged = {}, 0, 0
for inp in sorted(glob.glob(f'{XL}/batches2/polish-*.json')):
    name = os.path.basename(inp)[:-5]
    try:
        orig = json.load(open(inp, encoding='utf-8'))
    except Exception as e:
        print('cannot read', inp, e); continue
    by_hz = {}
    for o in orig:
        by_hz.setdefault(o['hz'], []).append(o)
    for path in (f'{XL}/out/{name}.out.json', f'{XL}/out/{name}.chk.json'):
        if not os.path.exists(path):
            continue
        try:
            rows = json.load(open(path, encoding='utf-8'))
        except Exception as e:
            print('cannot read', path, e); continue
        for r in rows:
            if not r.get('hz') or not r.get('py'):
                continue
            cands = by_hz.get(r['hz'], [])
            o = next((c for c in cands if py_key(c['py']) == py_key(r['py'])), None) \
                or next((c for c in cands if tl(py_key(c['py'])) == tl(py_key(r['py']))), None) \
                or (cands[0] if len(cands) == 1 else None)
            if o is None:
                continue
            rec = {'pos': r.get('pos', ''), 'en': r.get('en', ''), 'ko': r.get('ko', '')}
            if py_key(r['py']) != py_key(o['py']):
                rec['py'] = r['py']
                pychanged += 1
            over[f"{o['hz']}|{py_key(o['py'])}"] = rec
            n += 1
json.dump(over, open(f'{XL}/out/dict-override.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('override entries', len(over), 'from', n, 'rows; pinyin changed', pychanged)
