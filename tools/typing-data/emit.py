"""Merge aligned.json with the agents' translations and glosses and write the
per-level data files used by typing.html:

  typing-data/hsk<level>.js  ->  window.HANZUMIO_TYPING_LEVELS['<level>'] = {words, items}

words: { "汉字" or "汉字|pinyin": [pinyin, pos, en, ko] }
items: [ [id, kind, headword, [[w, p, en, ko], ...]] ]
  w: the line with one space between tokens (punctuation and digits are tokens too)
  p: pinyin for the Chinese tokens only, syllables joined with "-"  (哪儿 -> nǎ-r)
"""
import sys, os, re, json, glob, unicodedata, collections

XL, REPO = sys.argv[1], sys.argv[2]
A = json.load(open(f'{XL}/aligned.json', encoding='utf-8'))
LEVELS = ['1', '2', '3', '4', '5', '6', '7-9']
HAN = re.compile(r'[㐀-䶿一-鿿豈-﫿]')
SENT_END = set('。！？!?')

def tl(s):
    out = []
    for ch in unicodedata.normalize('NFD', s.replace('ɡ', 'g').replace('ɑ', 'a')):
        if unicodedata.combining(ch):
            if ch == '̈' and out and out[-1] == 'u':
                out[-1] = 'v'
            continue
        out.append(ch.lower())
    return ''.join(out)

def py_key(s):
    return re.sub(r"[\s'’\-]", '', unicodedata.normalize('NFC', s)).lower()

def load(path):
    try:
        v = json.load(open(path, encoding='utf-8'))
        return v if isinstance(v, list) else []
    except Exception as e:
        print('  cannot read', path, e)
        return []

report = collections.Counter()

# ---------------- agent outputs ----------------
tr_fix = collections.defaultdict(dict)       # item id -> line index -> {ko, en}
for path in sorted(glob.glob(f'{XL}/out/tr-*.out.json')) + sorted(glob.glob(f'{XL}/out/chk-*.out.json')) \
        + sorted(glob.glob(f'{XL}/out/tr-*.chk.json')):
    for rec in load(path):
        for l in rec.get('lines', []) or []:
            try:
                i = int(l['i'])
            except Exception:
                continue
            for f in ('ko', 'en'):
                if l.get(f):
                    tr_fix[rec['key']].setdefault(i, {})[f] = l[f].strip()
                    report['tr:' + f] += 1

gloss_by_key, gloss_by_hz = {}, {}
for path in sorted(glob.glob(f'{XL}/out/gloss-*.out.json')) + sorted(glob.glob(f'{XL}/out/gloss-*.chk.json')):
    for rec in load(path):
        if not rec.get('hz'):
            continue
        rec = {k: (rec.get(k) or '').strip() for k in ('hz', 'py', 'pos', 'en', 'ko')}
        gloss_by_key[(rec['hz'], tl(py_key(rec['py'])))] = rec
        gloss_by_hz.setdefault(rec['hz'], rec)
        report['gloss'] += 1

# ---------------- dictionary ----------------
POS_MAP = {'名': 'n', '动': 'v', '形': 'a', '副': 'd', '代': 'r', '数': 'm', '数量': 'm', '量': 'q', '介': 'p',
           '连': 'c', '助': 'u', '叹': 'i', '拟声': 'o', '前缀': 'af', '后缀': 'af', '成语': 'ci', '短语': 'x', '惯用语': 'x'}
EN_MAP = [('idiom', 'ci'), ('phrase', 'x'), ('verb', 'v'), ('noun', 'n'), ('adj', 'a'), ('adv', 'd'), ('int', 'i'),
          ('prep', 'p'), ('conj', 'c'), ('pron', 'r'), ('num', 'm'), ('meas', 'q'), ('part', 'u'), ('onomat', 'o'),
          ('suffix', 'af'), ('prefix', 'af'), ('greeting', 'x'), ('expression', 'x')]
def pos_code(pos, pos_en=''):
    p = (pos or '').strip()
    first = re.split(r'[、,，/ ()（）]+', p.strip('()（）'))[0] if p else ''
    if first in POS_MAP:
        return POS_MAP[first]
    for src in (p, pos_en or ''):
        s = src.lower()
        for k, v in EN_MAP:
            if k in s:
                return v
        if s.startswith(('v.', 'v/')):
            return 'v'
        if s.startswith(('n.', 'n/')):
            return 'n'
        if s.startswith('m.'):
            return 'q'
    return 'x'

def with_alt(m, f):
    """'flower / to spend' when the same written+spoken word has a second meaning in the lists."""
    v = (m.get(f) or '').strip()
    for a in (m.get('alt') or {}).get(f, []):
        a = a.strip()
        if a and a.lower() != v.lower() and len(v) + len(a) <= 44:
            v = f'{v} / {a}'
            break
    return v

by_hz = collections.defaultdict(list)
for m in A['dictionary']:
    m['_pos'] = pos_code(m.get('pos'), m.get('pos_en'))
    m['en'], m['ko'] = with_alt(m, 'en'), with_alt(m, 'ko')
    by_hz[m['hz']].append(m)

def resolve(hz, syls):
    pk = py_key(''.join(syls))
    t = tl(pk)
    ms = by_hz.get(hz, [])
    for m in ms:
        if py_key(m['py']) == pk:
            return m
    for m in ms:
        if tl(py_key(m['py'])) == t:
            return m
    if len(ms) == 1:
        return ms[0]
    g = gloss_by_key.get((hz, t)) or gloss_by_hz.get(hz)
    if g:
        return {'hz': hz, 'py': g['py'] or ''.join(syls), '_pos': pos_code(g['pos']), 'en': g['en'], 'ko': g['ko'], '_agent': True}
    return ms[0] if ms else None

# ---------------- proper nouns: capitalised somewhere other than sentence start ----------------
proper = set(m['hz'] for m in A['dictionary'] if re.match(r'[A-ZĀÁǍÀĒÉĚÈŌÓǑÒ]', m['py'] or ''))
for it in A['items']:
    for l in it['lines']:
        initial = True
        for w in l.get('w') or []:
            if len(w) == 1:
                if w[0] in SENT_END:
                    initial = True
                continue
            if not initial and w[1][0][:1].isupper():
                proper.add(w[0])
            initial = False

def disp_syl(hz, syls):
    out = [s.lower() for s in syls]
    if hz in proper and out:
        out[0] = out[0][:1].upper() + out[0][1:]
    return out

def join_py(syls):
    return ''.join(("'" + s) if k and re.match(r'[aeoāáǎàēéěèōóǒò]', s, re.I) else s for k, s in enumerate(syls))

# ---------------- build per level ----------------
os.makedirs(f'{REPO}/typing-data', exist_ok=True)
summary = {}
missing_gloss = collections.Counter()
for lv in LEVELS:
    items = [it for it in A['items'] if it['lv'] == lv]
    items.sort(key=lambda it: (it['num'] if it['num'] is not None else 10 ** 9, 0 if it['kind'] == 'dialogue' else 1))
    words = {}          # key -> [py, pos, en, ko]
    entries = collections.defaultdict(dict)   # hz -> {py_key: entry}
    out_items, dropped = [], 0
    for it in items:
        lines = []
        ok = True
        for li, l in enumerate(it['lines']):
            if not l.get('w'):
                ok = False
                break
            toks, pys = [], []
            for w in l['w']:
                if len(w) == 1:
                    toks.append(w[0].replace(' ', ''))
                    continue
                hz, syls = w[0], disp_syl(w[0], w[1])
                toks.append(hz)
                pys.append('-'.join(syls))
                e = resolve(hz, w[1])
                if e is None:
                    missing_gloss[hz] += 1
                    continue
                entries[hz][py_key(e['py'])] = e
            fix = tr_fix.get(it['id'], {}).get(li, {})
            en = fix.get('en') or l.get('en', '')
            ko = fix.get('ko') or l.get('ko', '')
            if not en and not ko:
                report['line-no-translation'] += 1
            lines.append([' '.join(toks), ' '.join(pys), en, ko])
        if not ok or not lines:
            dropped += 1
            continue
        out_items.append([it['id'], 'd' if it['kind'] == 'dialogue' else 'e', it['hz'], lines])
    for hz, variants in entries.items():
        vals = list(variants.values())
        for e in vals:
            py = join_py(disp_syl(hz, re.split(r"[\s'’\-]+", unicodedata.normalize('NFC', e['py']).strip()))) if e['py'] else ''
            rec = [py, e['_pos'], (e.get('en') or '').strip(), (e.get('ko') or '').strip()]
            if len(vals) > 1:
                words[hz + '|' + py_key(e['py'])] = rec
        first = vals[0]
        words[hz] = [join_py(disp_syl(hz, re.split(r"[\s'’\-]+", unicodedata.normalize('NFC', first['py']).strip()))) if first['py'] else '',
                     first['_pos'], (first.get('en') or '').strip(), (first.get('ko') or '').strip()]
    data = {'level': lv, 'words': words, 'items': out_items}
    js = ("window.HANZUMIO_TYPING_LEVELS=window.HANZUMIO_TYPING_LEVELS||{};"
          f"window.HANZUMIO_TYPING_LEVELS[{json.dumps(lv)}]=" + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ";\n")
    path = f'{REPO}/typing-data/hsk{lv}.js'
    open(path, 'w', encoding='utf-8').write(js)
    summary[lv] = dict(items=len(out_items), dropped=dropped, words=len(words), bytes=os.path.getsize(path))
    print(f'HSK{lv:4s} items={len(out_items):5d} dropped={dropped:3d} words={len(words):5d} size={os.path.getsize(path)/1024:7.0f} KB')

print('agent data merged:', dict(report))
print('tokens without any gloss:', sum(missing_gloss.values()), 'distinct', len(missing_gloss), missing_gloss.most_common(15))
json.dump(dict(summary=summary, missing_gloss=missing_gloss.most_common()), open(f'{XL}/emit-report.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
