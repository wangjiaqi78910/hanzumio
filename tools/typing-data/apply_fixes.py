"""Apply the agents' pinyin fixes (xl/out/fix-NN.out.json, corrected by fix-NN.chk.json)
to normalized.json, so align.py can be run again."""
import sys, os, json, glob

XL = sys.argv[1]
N = json.load(open(f'{XL}/normalized.json', encoding='utf-8'))
items = {it['id']: it for it in N['items']}

def load(path):
    try:
        return json.load(open(path, encoding='utf-8'))
    except Exception as e:
        print('  cannot read', path, e)
        return []

fixes = {}
for path in sorted(glob.glob(f'{XL}/out/fix-*.out.json')):
    for rec in load(path):
        if rec.get('key') and rec.get('py'):
            fixes[rec['key']] = {'py': rec['py'], 'zh_fix': rec.get('zh_fix') or '', 'src': os.path.basename(path)}
n_chk = 0
for path in sorted(glob.glob(f'{XL}/out/fix-*.chk.json')):
    for rec in load(path):
        if not rec.get('key'):
            continue
        f = fixes.setdefault(rec['key'], {'py': '', 'zh_fix': '', 'src': ''})
        if rec.get('py'):
            f['py'] = rec['py']
        if 'zh_fix' in rec:
            f['zh_fix'] = rec['zh_fix'] or ''
        f['src'] += ' +' + os.path.basename(path)
        n_chk += 1

applied, zh_changed = 0, []
for key, f in fixes.items():
    iid, _, li = key.partition(':')
    it = items.get(iid)
    if not it or not li.isdigit() or int(li) >= len(it['lines']):
        print('  unknown key', key)
        continue
    line = it['lines'][int(li)]
    if f['py']:
        line['py'] = f['py']
        applied += 1
    if f['zh_fix'] and f['zh_fix'] != line['zh']:
        line.setdefault('zh_orig', line['zh'])
        zh_changed.append((it['lv'], line['zh'], f['zh_fix']))
        line['zh'] = f['zh_fix']
    line['py_fixed'] = True

json.dump(N, open(f'{XL}/normalized.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(f'pinyin fixes applied: {applied} (verifier corrections: {n_chk}); Chinese typo fixes: {len(zh_changed)}')
for z in zh_changed:
    print('  zh:', z)
