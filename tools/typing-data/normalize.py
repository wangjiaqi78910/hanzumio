"""Read every uploaded HSK workbook and write one normalized JSON.

Rows are keyed by file + row number (the 序号 column has gaps and duplicates), words are
merged into one dictionary by (汉字, 拼音), and dialogues/examples are merged into items
by their Chinese text so that translations from different files fill each other's gaps.
"""
import sys, os, re, glob, json, collections, unicodedata, hashlib
import openpyxl

SRC, OUT = sys.argv[1], sys.argv[2]

def cells(r):
    return ['' if c is None else str(c).strip() for c in r]

def to_int(v):
    try:
        return int(float(v))
    except Exception:
        return None

LEVEL_RANGES = [(1, 300, '1'), (301, 500, '2'), (501, 1000, '3'), (1001, 2000, '4'),
                (2001, 3600, '5'), (3601, 5400, '6'), (5401, 11000, '7-9')]
def level_of(i):
    if i is None:
        return None
    for a, b, lv in LEVEL_RANGES:
        if a <= i <= b:
            return lv
    return None

LEVEL_BY_END = {300: '1', 500: '2', 1000: '3', 2000: '4', 3600: '5', 5400: '6', 10000: '7-9', 11000: '7-9'}
def file_level(name):
    m = re.search(r'(\d+)\s*-\s*(\d+)', name)
    if m and int(m.group(2)) in LEVEL_BY_END:
        return LEVEL_BY_END[int(m.group(2))]
    m = re.search(r'HSK\s*(\d(?:-\d)?)', name)
    return m.group(1) if m else '?'

def tl(s):
    """Toneless, lowercase pinyin letters; ü -> v."""
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

issues = []
def issue(kind, ref, msg):
    issues.append({'kind': kind, 'ref': ref, 'msg': msg})

SPLIT_BRACKET = re.compile(r'^(.*?)\s*\[([^\]]*)\]\s*(.*?)\s*$')
def split_bracket(s):
    m = SPLIT_BRACKET.match(s)
    if not m:
        return (s.strip(), '')
    if m.group(3):
        issue('trailing-text', s[:60], f'拼音括号后面还有文字：{m.group(3)!r}')
    return (m.group(1).strip(), m.group(2).strip())

TURN = re.compile(r'(?:^|(?<=[\s！!？?。.，,；;]))([QAB])\s*[:：]\s*')
def split_turns(s):
    s = s.strip()
    marks = list(TURN.finditer(s))
    if not marks:
        return [('', s)] if s else []
    out = []
    for k, m in enumerate(marks):
        end = marks[k + 1].start() if k + 1 < len(marks) else len(s)
        out.append((m.group(1), s[m.end():end].strip()))
    return out

SENT_SPLIT = re.compile(r'(?<=[.?!。？！])\s+')
HANGUL = re.compile(r'[가-힣]')
def norm_zh(s):
    return re.sub(r'\s+', '', s)
def key_lines(lines):
    return '|'.join(norm_zh(l['zh']) for l in lines)

# ---------------- read workbooks ----------------
sources = []
for path in sorted(glob.glob(os.path.join(SRC, '*.xlsx'))):
    name = os.path.basename(path)
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    for ws in wb.worksheets:
        rows = [cells(r) for r in ws.iter_rows(values_only=True)]
        head = ' '.join(' '.join(r) for r in rows[:6])
        ncol = max(len(r) for r in rows)
        if ncol >= 12:
            role = 'full'
        elif '造句' in head:
            role = 'example'
        elif '一问一答' in head and ('韩文' in head or '한국어' in head or '품사' in head):
            role = 'dlg_ko'
        elif '一问一答' in head:
            role = 'dlg_en'
        elif '韩文' in head or '한국어' in head:
            role = 'vocab_ko'
        elif '英文' in head or 'English' in head:
            role = 'vocab_en'
        else:
            role = 'unknown'
        sources.append(dict(name=name, tag=name[:8], lv=file_level(name), sheet=ws.title, role=role, rows=rows))
        print(f'{role:9s} HSK{file_level(name):4s} {name} [{ws.title}] rows={len(rows)}')

entries = []   # one per word row
cands = []     # one per dialogue / example row

def add_entry(uid, num, lv, hz, py, src, **kw):
    e = dict(uid=uid, num=num, lv=level_of(num) or lv, hz=hz, py=py, pos='', pos_ko='', pos_en='', ko='', en='', src=src)
    e.update(kw)
    entries.append(e)
    return e

for s in [x for x in sources if x['role'] == 'full']:
    for n, r in enumerate(s['rows']):
        r = r + [''] * (12 - len(r))
        if r[0] == '序号' or not r[1]:
            continue
        uid = f"{s['tag']}#{n+1}"
        num = to_int(r[0])
        if '[' in r[1] and HANGUL.search(r[9]):
            # 词语列把拼音也写进去了，后面的列整体左移一格
            hz, py = split_bracket(r[1])
            issue('shifted-row', uid, f'词语列含拼音，整行左移一列，已按左移读取：{hz}')
            r = [r[0], hz, py] + r[2:11]
        elif HANGUL.search(r[2] + r[9]):
            # 韩文串进了拼音列：汉字和英文照常，拼音和韩文留空待补
            issue('shifted-row', uid, f'拼音列混入韩文，拼音和韩文待补：{r[1]}')
            en_cell = r[10] if not HANGUL.search(r[10]) and re.search(r'[A-Za-z]', r[10]) else ''
            r = r[:9] + ['', '', en_cell]
        add_entry(uid, num, s['lv'], r[1], r[2], s['name'], pos=r[3], pos_ko=r[4], pos_en=r[5], ko=r[6], en=r[7])
        zh_t, py_t, ko_t, en_t = (split_turns(x) for x in (r[8], r[9], r[10], r[11]))
        n_zh = len(zh_t)
        if not n_zh:
            issue('no-dialogue', uid, r[1])
            continue
        guessed = []
        def fit(turns, label, field):
            if len(turns) == n_zh:
                return [t[1] for t in turns]
            if len(turns) == 1 and n_zh > 1:
                parts = SENT_SPLIT.split(turns[0][1])
                if len(parts) == n_zh:
                    issue('split-guess', uid, f'{label}只有一段，按句号拆成 {n_zh} 句：{parts}')
                    guessed.append(field)
                    return parts
            issue('turns-mismatch', uid, f'{label} {len(turns)} 段，中文 {n_zh} 段：{[t[1][:30] for t in turns]}')
            vals = [t[1] for t in turns][:n_zh]
            return vals + [''] * (n_zh - len(vals))
        pys, kos, ens = fit(py_t, '拼音', 'py'), fit(ko_t, '韩文', 'ko'), fit(en_t, '英文', 'en')
        lines = [dict(role=zh_t[k][0], zh=zh_t[k][1], py=pys[k], ko=kos[k], en=ens[k]) for k in range(n_zh)]
        if guessed:
            for l in lines:
                l['guess'] = list(guessed)
        cands.append(dict(uid=uid, num=num, lv=s['lv'], hz=r[1], py=r[2], kind='dialogue', lines=lines, src=s['name']))

def read_dlg(s, lang):
    cur = None
    for n, r in enumerate(s['rows']):
        r = r + [''] * (6 - len(r))
        if r[0] == '序号' or r[4].startswith('一问一答') or r[1].startswith('词语'):
            continue
        num = to_int(r[0])
        if num is not None:
            hz, py = split_bracket(r[1])
            uid = f"{s['tag']}#{n+1}"
            kw = {'pos_ko' if lang == 'ko' else 'pos': r[2], lang: r[3]}
            add_entry(uid, num, s['lv'], hz, py, s['name'], **kw)
            cur = dict(uid=uid, num=num, lv=s['lv'], hz=hz, py=py, kind='dialogue', lines=[], src=s['name'])
            cands.append(cur)
        if cur is None or not r[4]:
            continue
        zh_turns = split_turns(r[4])
        tr_turns = split_turns(r[5])
        if len(tr_turns) < len(zh_turns):
            issue('turns-mismatch', cur['uid'], f'{lang} 翻译 {len(tr_turns)} 段，中文 {len(zh_turns)} 段')
        for k, (role, text) in enumerate(zh_turns):
            zh, py = split_bracket(text)
            if not py:
                issue('no-pinyin', cur['uid'], text[:40])
            line = dict(role=role, zh=zh, py=py, ko='', en='')
            line[lang] = tr_turns[k][1] if k < len(tr_turns) else ''
            cur['lines'].append(line)

for s in [x for x in sources if x['role'] == 'dlg_ko']:
    read_dlg(s, 'ko')
for s in [x for x in sources if x['role'] == 'dlg_en']:
    read_dlg(s, 'en')

for s in [x for x in sources if x['role'] == 'example']:
    for n, r in enumerate(s['rows']):
        r = r + [''] * (7 - len(r))
        num = to_int(r[1])
        if num is None:
            continue
        hz, py = split_bracket(r[2])
        uid = f"{s['tag']}#{n+1}"
        add_entry(uid, num, s['lv'], hz, py, s['name'], pos=r[3], en=r[4])
        zh, spy = split_bracket(r[5])
        if zh:
            # 个别例句本身是「A:谢谢！B:不客气。」这样的小对话：按 A/B 拆成两行
            zh_t, py_t, en_t = split_turns(zh), split_turns(spy), split_turns(r[6])
            if len(zh_t) > 1:
                # 括号里的拼音可能只覆盖一部分（A:谢谢！B:不客气。 [Bú kèqi.]）：段数对不上就留空，由 align.py 自动生成
                if len(py_t) != len(zh_t):
                    issue('example-partial-pinyin', uid, f'{zh}：拼音「{spy}」只有 {len(py_t)} 段，留空自动生成')
                lines = [dict(role=zh_t[k][0], zh=zh_t[k][1], py=py_t[k][1] if len(py_t) == len(zh_t) else '', ko='',
                              en=en_t[k][1] if len(en_t) == len(zh_t) else '') for k in range(len(zh_t))]
            else:
                lines = [dict(role='', zh=zh, py=spy, ko='', en=r[6])]
            cands.append(dict(uid=uid, num=num, lv=s['lv'], hz=hz, py=py, kind='example', lines=lines, src=s['name']))

for s in [x for x in sources if x['role'] == 'vocab_en']:
    for n, r in enumerate(s['rows']):
        r = r + [''] * (6 - len(r))
        num = to_int(r[1])
        if num is not None and r[2]:
            add_entry(f"{s['tag']}#{n+1}", num, s['lv'], r[2], r[3], s['name'], pos=r[4], en=r[5])
for s in [x for x in sources if x['role'] == 'vocab_ko']:
    for n, r in enumerate(s['rows']):
        r = r + [''] * (6 - len(r))
        num = to_int(r[0])
        if num is not None and r[1]:
            add_entry(f"{s['tag']}#{n+1}", num, s['lv'], r[1], r[2], s['name'], pos_ko=r[3], ko=r[4])

# ---------------- clean word rows ----------------
# 「两1」「没（有）」「有时(候)」这类写法：去掉尾部数字，带括号的拆成不带和带括号两个词
from pypinyin import pinyin as _pinyin, Style as _Style
def auto_py(hz):
    return ''.join(x[0] for x in _pinyin(hz, style=_Style.TONE))
OPT = re.compile(r'[（(]([^()（）]+)[)）]')
cleaned = []
for e in entries:
    hz = re.sub(r'\d+$', '', e['hz']).strip()
    py = unicodedata.normalize('NFC', e['py'].strip())
    if hz != e['hz']:
        issue('hz-cleaned', e['uid'], f'{e["hz"]} → {hz}')
    if py and not re.match(r'[A-Za-zÀ-ɏ]', py):
        issue('bad-pinyin', e['uid'], f'{hz} 的拼音 {py!r} 不像拼音，丢弃这一行')
        continue
    m = OPT.search(hz)
    if m:
        short = hz[:m.start()] + hz[m.end():]
        long = hz[:m.start()] + m.group(1) + hz[m.end():]
        pm = OPT.search(py)
        if pm:
            py_short = re.sub(r'\s+', ' ', py[:pm.start()] + py[pm.end():]).strip()
            py_long = re.sub(r'\s+', ' ', py[:pm.start()] + pm.group(1) + py[pm.end():]).strip()
        else:
            py_short, py_long = auto_py(short), auto_py(long)
        issue('hz-optional', e['uid'], f'{e["hz"]} → {short} [{py_short}] / {long} [{py_long}]')
        for h, p in ((short, py_short), (long, py_long)):
            ce = dict(e)
            ce['hz'], ce['py'] = h, p
            cleaned.append(ce)
        continue
    ce = dict(e)
    ce['hz'], ce['py'] = hz, py
    cleaned.append(ce)
entries = cleaned

# ---------------- merge words ----------------
# 同形同音的词按级别从低到高合并，低级别的常用义放在前面（本 HSK1 量词 / HSK4 代词）
LEVEL_IDX = {lv: k for k, (a, b, lv) in enumerate(LEVEL_RANGES)}
entries.sort(key=lambda e: LEVEL_IDX.get(e['lv'], 99))
dictionary = collections.OrderedDict()
for e in entries:
    k = (e['hz'], py_key(e['py']))
    if k not in dictionary:
        m = dict(e)
        m['srcs'] = [e['src']]
        del m['src']
        dictionary[k] = m
        continue
    m = dictionary[k]
    for f in ('pos', 'pos_ko', 'pos_en', 'ko', 'en'):
        if not m[f] and e[f]:
            m[f] = e[f]
        elif m[f] and e[f] and m[f] != e[f]:
            m.setdefault('alt', {}).setdefault(f, [])
            if e[f] not in m['alt'][f]:
                m['alt'][f].append(e[f])
    if m['num'] is None and e['num'] is not None:
        m['num'], m['lv'] = e['num'], e['lv']
    m['srcs'].append(e['src'])
by_hz = collections.defaultdict(list)
for (hz, pk), m in dictionary.items():
    by_hz[hz].append(m)

def dict_level(hz, py):
    ms = by_hz.get(hz, [])
    for m in ms:
        if py_key(m['py']) == py_key(py):
            return m['lv']
    return ms[0]['lv'] if ms else None

# ---------------- merge items ----------------
def clean_head(hz, lines):
    """题目的焦点词：去掉「花1」的数字；「有时(候)」取句子里出现的那个写法"""
    hz = re.sub(r'\d+$', '', hz).strip()
    m = OPT.search(hz)
    if not m:
        return hz
    short = hz[:m.start()] + hz[m.end():]
    long = hz[:m.start()] + m.group(1) + hz[m.end():]
    text = ''.join(l['zh'] for l in lines)
    return long if long in text else short

items = collections.OrderedDict()
for c in cands:
    key = key_lines(c['lines'])
    if not key:
        continue
    c['hz'] = clean_head(c['hz'], c['lines'])
    k = key   # 同样的文字只出一题：例句和对话重合时算对话
    lv = c['lv'] if c['num'] is not None else (dict_level(c['hz'], c['py']) or c['lv'])
    if k in items:
        it = items[k]
        if c['kind'] == 'dialogue':
            it['kind'] = 'dialogue'
        for a, b in zip(it['lines'], c['lines']):
            for f in ('py', 'ko', 'en'):
                if not a[f] and b[f]:
                    a[f] = b[f]
                elif f == 'py' and a[f] and b[f] and tl(py_key(a[f])) != tl(py_key(b[f])):
                    issue('pinyin-differs', c['uid'], f'{a["zh"]}: 「{a["py"]}」≠「{b["py"]}」')
        it['srcs'].append(c['src'])
        it['heads'].append([c['hz'], c['py'], lv])
        if LEVEL_RANGES and lv < it['lv']:
            it['lv'] = lv
        continue
    hid = hashlib.blake2b(key.encode('utf-8'), digest_size=4).hexdigest()
    items[k] = dict(id=hid, kind=c['kind'], lv=lv, hz=c['hz'], py=c['py'], num=c['num'],
                    lines=[dict(l) for l in c['lines']], srcs=[c['src']], heads=[[c['hz'], c['py'], lv]])

ids = collections.Counter(it['id'] for it in items.values())
for hid, cnum in ids.items():
    if cnum > 1:
        issue('id-collision', hid, '两个条目的 id 相同')

# ---------------- checks ----------------
for it in items.values():
    for l in it['lines']:
        for f in ('py', 'ko', 'en'):
            if not l[f]:
                issue('line-missing-' + f, it['id'], f'{it["lv"]} {it["hz"]}: {l["zh"]}')
for (hz, pk), m in dictionary.items():
    for f in ('ko', 'en'):
        if not m[f]:
            issue('word-missing-' + f, m['uid'], f'{hz} {m["py"]}')
    if not m['py']:
        issue('word-missing-py', m['uid'], hz)

out = dict(dictionary=list(dictionary.values()), items=list(items.values()), issues=issues)
json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
lv_count = collections.Counter((it['lv'], it['kind']) for it in items.values())
print('entries', len(entries), 'dictionary', len(dictionary), 'items', len(items))
print('items by level/kind', sorted(lv_count.items()))
print('issues', collections.Counter(x['kind'] for x in issues))
