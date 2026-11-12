"""readings.out.json (agent verdicts on pinyin mismatches) -> token-fix.json, dict-pyfix.json, gloss-95.out.json"""
import sys, json, re, unicodedata, collections
XL = sys.argv[1]
def py_key(s):
    return re.sub(r"[\s'’\-]", '', unicodedata.normalize('NFC', s)).lower()
R = json.load(open(f'{XL}/out/readings.out.json', encoding='utf-8'))
token_fix, dict_fix, gloss = {}, {}, []
stats = collections.Counter()
A = json.load(open(f'{XL}/aligned.json', encoding='utf-8'))
by = collections.defaultdict(list)
for m in A['dictionary']: by[m['hz']].append(m)
for r in R:
    v = r.get('verdict'); stats[v] += 1
    hz, spy, cpy = r['hz'], r.get('sentence_py', ''), r.get('correct_py', '')
    if v == 'sentence-typo' and cpy and py_key(cpy) != py_key(spy):
        token_fix[f'{hz}|{py_key(spy)}'] = cpy
    elif v == 'dict-typo' and r.get('dict_correct_py'):
        for m in by.get(hz, []):
            dict_fix[f'{hz}|{py_key(m["py"])}'] = r['dict_correct_py']
        if cpy and py_key(cpy) != py_key(spy):
            token_fix[f'{hz}|{py_key(spy)}'] = cpy
    elif v == 'different-word' and r.get('en'):
        if cpy and py_key(cpy) != py_key(spy):
            token_fix[f'{hz}|{py_key(spy)}'] = cpy
        gloss.append({'hz': hz, 'py': cpy or spy, 'pos': r.get('pos', ''), 'en': r.get('en', ''), 'ko': r.get('ko', '')})
json.dump(token_fix, open(f'{XL}/out/token-fix.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(dict_fix, open(f'{XL}/out/dict-pyfix.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(gloss, open(f'{XL}/out/gloss-95.out.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(dict(stats), 'token-fix', len(token_fix), 'dict-pyfix', len(dict_fix), 'gloss', len(gloss))
