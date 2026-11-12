"""Segment every line into words by aligning the workbook's space-separated pinyin
with the Chinese text (pypinyin gives candidate readings per character).
Writes aligned.json (items with word lists), failed.json, unknown.json and stats."""
import sys, json, re, unicodedata, collections
from pypinyin import pinyin, Style

IN, OUTDIR = sys.argv[1], sys.argv[2]
d = json.load(open(IN, encoding='utf-8'))

HAN = re.compile(r'[㐀-䶿一-鿿豈-﫿]')
TURN = re.compile(r'(?:^|(?<=\s))[QAB]\s*[:：]\s*')
EDGE = '.,!?;:"“”‘’\'()（）。，？！、…—~～《》「」『』【】·:'

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

def norm_py(s):
    return unicodedata.normalize('NFC', s).replace('ɡ', 'g').replace('ɑ', 'a').replace('’', "'").replace('‘', "'")

DIGIT = {'0': ['ling'], '1': ['yi', 'yao'], '2': ['er', 'liang'], '3': ['san'], '4': ['si'],
         '5': ['wu'], '6': ['liu'], '7': ['qi'], '8': ['ba'], '9': ['jiu']}
EXTRA = {'儿': ['r'], '嗯': ['en', 'ng', 'n', 'eng'], '呣': ['m'], '哪': ['nei'], '那': ['nei'], '这': ['zhei'],
         '什': ['she'], '谁': ['shei', 'shui'], '什么': [], '么': ['me', 'ma']}
NUM_SYL = ['baifenzhi', 'fenzhi', 'ling', 'liang', 'yao', 'yi', 'er', 'san', 'si', 'wu', 'liu', 'qi', 'ba', 'jiu',
           'shi', 'bai', 'qian', 'wan']
def is_number_pinyin(s):
    i = 0
    while i < len(s):
        for n in NUM_SYL:
            if s.startswith(n, i):
                i += len(n)
                break
        else:
            return False
    return True
_cache = {}
def readings(ch):
    if ch not in _cache:
        if ch.isdigit():
            r = DIGIT.get(ch, [])
        elif HAN.match(ch):
            r = [tl(x) for x in pinyin(ch, style=Style.NORMAL, heteronym=True)[0]]
        else:
            r = []
        for x in EXTRA.get(ch, []):
            if x not in r:
                r.append(x)
        _cache[ch] = r
    return _cache[ch]

def make_units(zh):
    units = []
    ctx = pinyin(zh, style=Style.NORMAL, heteronym=False)
    pos = 0
    for el in ctx:
        piece = el[0]
        ch = zh[pos]
        if HAN.match(ch):
            rs = [tl(piece)] + [x for x in readings(ch) if x != tl(piece)]
            units.append(dict(type='han', text=ch, readings=rs))
            pos += 1
            continue
        # non-Han run returned verbatim
        run = piece
        assert zh[pos:pos + len(run)] == run, (zh, run, pos)
        for m in re.finditer(r'[A-Za-z0-9]+|\s+|.', run):
            t = m.group(0)
            if t.isspace():
                continue
            if re.fullmatch(r'[A-Za-z0-9]+', t):
                # 数字、字母串：原样显示，不要求打拼音；拼音里对应的记号整个吞掉
                units.append(dict(type='fixed', text=t, readings=[]))
            else:
                units.append(dict(type='punct', text=t, readings=[]))
        pos += len(run)
    return units

def match_token(target, units, start):
    best = None
    def rec(i, p, used):
        nonlocal best
        if p == len(target):
            best = list(used)
            return True
        if i >= len(units) or units[i]['type'] == 'punct':
            return False
        if units[i]['type'] == 'fixed':
            used.append((i, target[p:]))
            if rec(i + 1, len(target), used):
                return True
            used.pop()
            return False
        for r in units[i]['readings']:
            if r and target.startswith(r, p):
                used.append((i, r))
                if rec(i + 1, p + len(r), used):
                    return True
                used.pop()
        return False
    rec(start, 0, [])
    return best

PARTICLES = {'ma', 'ne', 'ba', 'le', 'a', 'de', 'ya', 'la', 'me'}
PARTICLE_HZ = '吗呢吧了啊呀啦嘛么'

def align_line(zh, py):
    """Returns (words, error, repairs). words: [hz, syllables] for Chinese words,
    [text] for punctuation / digits / Latin (shown as-is, not typed)."""
    zh = unicodedata.normalize('NFC', zh)
    units = make_units(zh)
    toks = [t for t in TURN.sub(' ', norm_py(py)).split() if t]
    words, repairs = [], []
    ui, ti = 0, 0
    while ti < len(toks):
        t = toks[ti]
        ti += 1
        core = re.sub(r"['\-]", '', t.strip(EDGE))
        if not core:
            continue
        while ui < len(units) and units[ui]['type'] == 'punct':
            words.append([units[ui]['text']])
            ui += 1
        han_left = any(u['type'] == 'han' for u in units[ui:])
        if ui >= len(units) or not han_left:
            if tl(core) in PARTICLES:
                repairs.append(['drop-token', t])
                continue
            return None, dict(reason='extra-token', token=t), repairs
        m = match_token(tl(core), units, ui)
        if m is None and len(core) > 1 and tl(core).endswith('r'):
            # 拼音写了儿化（diǎnr），汉字里没有「儿」：按不儿化的读音算
            m = match_token(tl(core)[:-1], units, ui)
            if m is not None:
                core = core[:-1]
                repairs.append(['erhua-r', t])
        if m is None and tl(core) in PARTICLES and units[ui]['type'] == 'han' and units[ui]['text'] not in PARTICLE_HZ \
                and not any(u['text'] in PARTICLE_HZ for u in units[ui:] if u['type'] == 'han'):
            repairs.append(['drop-token', t])
            continue
        if m is None:
            return None, dict(reason='no-match', token=t, at=''.join(u['text'] for u in units[ui:ui + 6])), repairs
        if all(units[i]['type'] == 'fixed' for i, r in m):
            words.append([''.join(units[i]['text'] for i, r in m)])
            ui = m[-1][0] + 1
            # 数字串的拼音常常不止一个记号（1990 → Yī jiǔ jiǔ líng）：属于数字读法、又对不上下一个字的记号一并吞掉
            while ti < len(toks):
                ncore = re.sub(r"['\-]", '', toks[ti].strip(EDGE))
                if not ncore or not is_number_pinyin(tl(ncore)):
                    break
                nui = ui
                while nui < len(units) and units[nui]['type'] == 'punct':
                    nui += 1
                if nui < len(units) and match_token(tl(ncore), units, nui) is not None:
                    break
                ti += 1
            continue
        if any(units[i]['type'] == 'fixed' for i, r in m):
            return None, dict(reason='mixed-fixed', token=t), repairs
        syls, p = [], 0
        for i, r in m:
            syls.append(core[p:p + len(r)])
            p += len(r)
        if p != len(core):
            return None, dict(reason='tone-length', token=t), repairs
        words.append([''.join(units[i]['text'] for i, r in m), syls])
        ui = m[-1][0] + 1
    while ui < len(units):
        u = units[ui]
        if u['type'] == 'punct' or u['type'] == 'fixed':
            words.append([u['text']])
        elif u['type'] == 'han' and u['text'] in PARTICLE_HZ:
            # 汉字有语气词、拼音漏了：补上轻声读音
            words.append([u['text'], [u['readings'][0]]])
            repairs.append(['synth-particle', u['text']])
        else:
            return None, dict(reason='leftover', at=''.join(x['text'] for x in units[ui:])), repairs
        ui += 1
    return words, None, repairs

# ---------------- dictionary ----------------
by_hz = collections.defaultdict(list)
for m in d['dictionary']:
    by_hz[m['hz']].append(m)
def lookup(hz, syls):
    ms = by_hz.get(hz)
    if not ms:
        return None
    pk = py_key(''.join(syls))
    for m in ms:
        if py_key(m['py']) == pk:
            return m
    for m in ms:
        if tl(py_key(m['py'])) == tl(pk):
            return m
    return ms[0] if len(ms) == 1 else None

POS_MAP = {'名': 'n', '动': 'v', '形': 'a', '副': 'd', '代': 'r', '数': 'm', '数量': 'm', '量': 'q', '介': 'p',
           '连': 'c', '助': 'u', '叹': 'i', '拟声': 'o', '前缀': 'af', '后缀': 'af', '成语': 'ci', '短语': 'x', '惯用语': 'x'}
EN_MAP = [('idiom', 'ci'), ('phrase', 'x'), ('verb', 'v'), ('noun', 'n'), ('adj', 'a'), ('adv', 'd'), ('int', 'i'),
          ('prep', 'p'), ('conj', 'c'), ('pron', 'r'), ('num', 'm'), ('meas', 'q'), ('part', 'u'), ('onomat', 'o'),
          ('suffix', 'af'), ('prefix', 'af'), ('greeting', 'x'), ('expression', 'x')]
unmapped = collections.Counter()
def pos_code(m):
    p = (m.get('pos') or '').strip()
    first = re.split(r'[、,，/ ()（）]+', p.strip('()（）'))[0] if p else ''
    if first in POS_MAP:
        return POS_MAP[first]
    for src in (p, m.get('pos_en') or ''):
        s = src.lower()
        for k, v in EN_MAP:
            if k in s:
                return v
        if s.startswith('v.') or s.startswith('v/'):
            return 'v'
        if s.startswith('n.') or s.startswith('n/'):
            return 'n'
        if s.startswith('m.'):
            return 'q'
    unmapped[(p, m.get('pos_en'))] += 1
    return 'x'

# ---------------- run ----------------
stats = collections.Counter()
failed, unknown = [], collections.OrderedDict()
single_pairs = collections.Counter()
for it in d['items']:
    for l in it['lines']:
        stats['lines'] += 1
        if not l['py']:
            stats['no-pinyin'] += 1
            failed.append(dict(id=it['id'], lv=it['lv'], zh=l['zh'], py=l['py'], reason='no-pinyin'))
            continue
        words, err, repairs = align_line(l['zh'], l['py'])
        for r in repairs:
            stats['repair:' + r[0]] += 1
        if err:
            stats['failed:' + err['reason']] += 1
            failed.append(dict(id=it['id'], lv=it['lv'], zh=l['zh'], py=l['py'], **err))
            continue
        stats['aligned'] += 1
        l['w'] = words
        if repairs:
            l['repairs'] = repairs
        prev = None
        for w in words:
            if len(w) == 1:
                prev = None
                continue
            m = lookup(w[0], w[1])
            if m is None:
                k = w[0] + '|' + ''.join(w[1]).lower()
                u = unknown.setdefault(k, dict(hz=w[0], py=''.join(w[1]), n=0, lv=it['lv'], ex=l['zh']))
                u['n'] += 1
                stats['unknown-tokens'] += 1
            if prev and len(prev[0]) == 1 and len(w[0]) == 1 and (prev[0] + w[0]) in by_hz:
                single_pairs[prev[0] + w[0]] += 1
            prev = w

print('stats', dict(stats))
print('unknown unique', len(unknown))
uk = sorted(unknown.values(), key=lambda u: -u['n'])
print('top unknown', [(u['hz'], u['py'], u['n']) for u in uk[:60]])
print('unknown by level', collections.Counter(u['lv'] for u in uk))
print('adjacent single-char pairs that form dictionary words:', sum(single_pairs.values()), single_pairs.most_common(25))
print('failed by level', collections.Counter(f['lv'] for f in failed))
print('failed samples:')
for f in failed[:40]:
    print('  ', f)
print('unmapped POS', unmapped.most_common(20))
caps = [m['py'] for m in d['dictionary'] if re.match(r'[A-ZĀÁǍÀĒÉĚÈŌÓǑÒ]', m['py'] or '')]
print('capitalized dictionary pinyin', len(caps), caps[:20])

json.dump(d, open(OUTDIR + '/aligned.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
json.dump(failed, open(OUTDIR + '/failed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(uk, open(OUTDIR + '/unknown.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
