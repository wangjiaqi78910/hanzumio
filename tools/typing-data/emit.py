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
        gloss_by_key[(rec['hz'], py_key(rec['py']))] = rec
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

def split_senses(text):
    """按 / ; , 、 拆成义项，括号里的分隔符不拆"""
    out, buf, depth = [], '', 0
    for ch in text:
        if ch in '([（［':
            depth += 1
        elif ch in ')]）］':
            depth = max(0, depth - 1)
        if depth == 0 and ch in '/;,、；，':
            out.append(buf)
            buf = ''
        else:
            buf += ch
    out.append(buf)
    return [x.strip() for x in out if x.strip()]

def with_alt(m, f):
    """同形同音的词在别的级别还有一个意思时，把两边的义项合并去重：花 → to spend / flower"""
    v = (m.get(f) or '').strip()
    alts = [a.strip() for a in (m.get('alt') or {}).get(f, []) if a.strip()]
    if not alts:
        return v
    norm = lambda x: re.sub(r'[\s()（）\[\].,;:/~～·]+', '', x).lower()
    senses = []
    def add(x):
        nx = norm(x)
        if not nx:
            return
        for sx in senses:
            ns = norm(sx)
            if nx == ns or nx in ns or ns in nx:
                return
        senses.append(x)
    for x in split_senses(v):
        add(x)
    for a in alts:
        for x in split_senses(a):
            add(x)
    out = []
    for x in senses:
        if out and len(' / '.join(out + [x])) > 44:
            break
        out.append(x)
    return ' / '.join(out) if out else v

def load_map(name):
    try:
        v = json.load(open(f'{XL}/out/{name}', encoding='utf-8'))
        return v if isinstance(v, dict) else {}
    except Exception:
        return {}
DICT_PYFIX = load_map('dict-pyfix.json')        # {"汉字|错拼音": "对拼音"}   词表里的声调笔误
DICT_OVERRIDE = load_map('dict-override.json')  # {"汉字|拼音": {pos, en, ko}}  润色过的词卡
by_hz = collections.defaultdict(list)
for m in A['dictionary']:
    k = m['hz'] + '|' + py_key(m['py'])
    if k in DICT_PYFIX:
        m['py'] = DICT_PYFIX[k]
        report['dict-pyfix'] += 1
        k = m['hz'] + '|' + py_key(m['py'])
    ov = DICT_OVERRIDE.get(k) or DICT_OVERRIDE.get(m['hz'] + '|' + py_key(m['py'].split('/')[0]))
    if ov:
        for f in ('pos', 'en', 'ko'):
            if ov.get(f):
                m[f] = ov[f]
        m['alt'] = {}
        report['dict-override'] += 1
    m['_pos'] = pos_code(m.get('pos'), m.get('pos_en'))
    m['en'], m['ko'] = with_alt(m, 'en'), with_alt(m, 'ko')
    by_hz[m['hz']].append(m)

SANDHI = {'一', '不'}
tone_mismatch = collections.Counter()
tone_example = {}
def same_py(a, b, hz):
    if a == b:
        return True
    return hz in SANDHI and tl(a) == tl(b)

def resolve(hz, syls, example=''):
    pk = py_key(''.join(syls))
    t = tl(pk)
    ms = by_hz.get(hz, [])
    for m in ms:
        if any(same_py(py_key(alt), pk, hz) for alt in m['py'].split('/')):
            return m
    g = gloss_by_key.get((hz, pk))
    if g:
        return {'hz': hz, 'py': g['py'] or ''.join(syls), '_pos': pos_code(g['pos']), 'en': g['en'], 'ko': g['ko'], '_agent': True}
    for m in ms:
        if any(tl(py_key(alt)) == t for alt in m['py'].split('/')):
            # 同字同音不同调：词表只有另一个读音的释义，先用着，另外收集起来补
            tone_mismatch[(hz, pk)] += 1
            tone_example.setdefault((hz, pk), example)
            return m
    g = gloss_by_key.get((hz, t)) or gloss_by_hz.get(hz)
    if g:
        return {'hz': hz, 'py': g['py'] or ''.join(syls), '_pos': pos_code(g['pos']), 'en': g['en'], 'ko': g['ko'], '_agent': True}
    if ms:
        tone_mismatch[(hz, pk)] += 1
        tone_example.setdefault((hz, pk), example)
        return ms[0]
    return None

# ---------------- 专名大小写 ----------------
# 词表里首字母大写的词，以及语料里非句首位置多数写成大写的词（北京、王），句首时也大写；
# 其他词句首一律小写，非句首保留原文写法（小王 的 Xiǎo 大写、小猫 的 xiǎo 小写）
cap_count = collections.defaultdict(lambda: [0, 0])
for it in A['items']:
    for l in it['lines']:
        initial = True
        for w in l.get('w') or []:
            if len(w) == 1:
                if w[0] in SENT_END:
                    initial = True
                continue
            if not initial:
                cap_count[w[0]][0 if w[1][0][:1].isupper() else 1] += 1
            initial = False
proper = set(m['hz'] for m in A['dictionary'] if re.match(r'[A-ZĀÁǍÀĒÉĚÈŌÓǑÒ]', m['py'] or ''))
proper |= {hz for hz, (c, l) in cap_count.items() if c >= 1 and c >= 0.6 * (c + l)}

def disp_syl(hz, syls, initial=False):
    if initial:
        out = [s.lower() for s in syls]
        if hz in proper:
            out[0] = out[0][:1].upper() + out[0][1:]
        return out
    return [s[:1] + s[1:].lower() for s in syls]

def join_py(syls):
    return ''.join(("'" + s) if k and re.match(r'[aeoāáǎàēéěèōóǒò]', s, re.I) else s for k, s in enumerate(syls))

# ---------------- 译文里的括号注释 ----------------
# 韩文译文常夹着原汉字或汉字词的韩文读音/同义词：카드(筹码)、조심(류신)、관심(흥미)。题面里去掉，词卡释义只去掉带汉字的
HAN_PAREN = re.compile(r'\s*[（(][^()（）]*[\u4e00-\u9fff][^()（）]*[)）]')
GLUED_HANGUL = re.compile(r'(?<=[가-힣"”’\'])[（(][가-힣\s,/·]{1,10}[)）]')
def clean_line(text, lang):
    if not text:
        return text
    t = HAN_PAREN.sub('', text)
    if lang == 'ko':
        t = GLUED_HANGUL.sub('', t)
    t = re.sub(r'\s{2,}', ' ', t).replace(' ,', ',').replace(' .', '.').strip()
    if t != text:
        report['paren-cleaned:' + lang] += 1
    return t
def clean_gloss(text):
    return HAN_PAREN.sub('', text or '').strip()

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
            if not any(len(w) == 2 for w in l['w']):
                # 只有数字、字母或标点的句子（答句「123456.」）没有可打的词，不出题
                report['line-nothing-to-type'] += 1
                continue
            toks, pys = [], []
            initial = True
            for w in l['w']:
                if len(w) == 1:
                    toks.append(w[0].replace(' ', ''))
                    if w[0] in SENT_END:
                        initial = True
                    continue
                hz, syls = w[0], disp_syl(w[0], w[1], initial)
                initial = False
                toks.append(hz)
                pys.append('-'.join(syls))
                e = resolve(hz, w[1], l['zh'])
                if e is None:
                    missing_gloss[hz] += 1
                    continue
                entries[hz][py_key(e['py'])] = e
            fix = tr_fix.get(it['id'], {}).get(li, {})
            en = clean_line(fix.get('en') or l.get('en', ''), 'en')
            ko = clean_line(fix.get('ko') or l.get('ko', ''), 'ko')
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
            rec = [py, e['_pos'], clean_gloss(e.get('en')), clean_gloss(e.get('ko'))]
            if len(vals) > 1:
                words[hz + '|' + py_key(e['py'])] = rec
        first = vals[0]
        words[hz] = [join_py(disp_syl(hz, re.split(r"[\s'’\-]+", unicodedata.normalize('NFC', first['py']).strip()))) if first['py'] else '',
                     first['_pos'], clean_gloss(first.get('en')), clean_gloss(first.get('ko'))]
    data = {'level': lv, 'words': words, 'items': out_items}
    js = ("window.HANZUMIO_TYPING_LEVELS=window.HANZUMIO_TYPING_LEVELS||{};"
          f"window.HANZUMIO_TYPING_LEVELS[{json.dumps(lv)}]=" + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ";\n")
    path = f'{REPO}/typing-data/hsk{lv}.js'
    open(path, 'w', encoding='utf-8').write(js)
    summary[lv] = dict(items=len(out_items), dropped=dropped, words=len(words), bytes=os.path.getsize(path))
    print(f'HSK{lv:4s} items={len(out_items):5d} dropped={dropped:3d} words={len(words):5d} size={os.path.getsize(path)/1024:7.0f} KB')

print('agent data merged:', dict(report))
print('heteronym readings without their own gloss:', len(tone_mismatch), sum(tone_mismatch.values()),
      [(h, p, n) for (h, p), n in tone_mismatch.most_common(12)])
json.dump([dict(hz=h, py=p, n=n, example=tone_example[(h, p)]) for (h, p), n in tone_mismatch.most_common()],
          open(f'{XL}/heteronyms.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('tokens without any gloss:', sum(missing_gloss.values()), 'distinct', len(missing_gloss), missing_gloss.most_common(15))
json.dump(dict(summary=summary, missing_gloss=missing_gloss.most_common()), open(f'{XL}/emit-report.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
