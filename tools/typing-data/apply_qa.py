"""Turn the QA findings that the skeptic confirmed into override files that the
normal pipeline already understands:
  out/fix-98.out.json    pinyin / segmentation / chinese  -> apply_fixes.py
  out/tr-98.out.json     translation                      -> emit.py
  out/gloss-98.out.json  gloss                            -> emit.py
"""
import sys, os, json, glob, collections

XL = sys.argv[1]
Q = f'{XL}/qa'
fix, tr, gloss = [], collections.defaultdict(dict), []
stats = collections.Counter()
for path in sorted(glob.glob(f'{Q}/out/qa-hsk*.json')):
    if path.endswith('.verdict.json'):
        continue
    lv = os.path.basename(path)[len('qa-hsk'):-len('.json')]
    try:
        findings = json.load(open(path, encoding='utf-8'))
    except Exception as e:
        print('cannot read', path, e)
        continue
    vpath = path[:-5] + '.verdict.json'
    verdicts = {}
    if os.path.exists(vpath):
        for v in json.load(open(vpath, encoding='utf-8')):
            verdicts[int(v['index'])] = v
    for k, f in enumerate(findings):
        v = verdicts.get(k)
        stats[f'{lv}:{f.get("kind")}:{f.get("severity")}'] += 1
        if not v or not v.get('real'):
            stats['rejected'] += 1
            continue
        fixv = v.get('fix') or f.get('fix')
        kind = f.get('kind')
        key = f"{f['key']}:{f.get('i', 0)}"
        if kind in ('pinyin', 'segmentation', 'chinese'):
            if not isinstance(fixv, str) and isinstance(f.get('fix'), str) and ' ' in f['fix']:
                fixv = f['fix']          # 质疑者给的是词条，复核员给的是整行拼音：用整行的
            if not isinstance(fixv, str) or ' ' not in fixv.strip():
                stats['bad-fix-format'] += 1
                continue
            rec = {'key': key, 'py': fixv}
            zh_fix = (v.get('zh_fix') if v else None) or f.get('zh_fix')
            if zh_fix:
                rec['zh_fix'] = zh_fix
            fix.append(rec)
        elif kind == 'translation':
            field = f.get('what') if f.get('what') in ('en', 'ko') else None
            if not field or not isinstance(fixv, str):
                stats['bad-fix-format'] += 1
                continue
            tr[f['key']].setdefault(int(f.get('i', 0)), {})[field] = fixv
        elif kind == 'gloss':
            if not isinstance(fixv, dict) or not fixv.get('hz'):
                stats['bad-fix-format'] += 1
                continue
            gloss.append({k2: fixv.get(k2, '') for k2 in ('hz', 'py', 'pos', 'en', 'ko')})
        stats['accepted:' + kind] += 1

json.dump(fix, open(f'{XL}/out/fix-98.out.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump([{'key': k, 'lines': [dict(i=i, **flds) for i, flds in v.items()]} for k, v in tr.items()],
          open(f'{XL}/out/tr-98.out.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(gloss, open(f'{XL}/out/gloss-98.out.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(dict(stats))
print('fix', len(fix), 'tr', sum(len(v) for v in tr.values()), 'gloss', len(gloss))
