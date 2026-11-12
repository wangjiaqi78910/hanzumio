"""Recording list: every sentence of the typing question bank with the audio file
name the page expects (audio/hsk<level>/<id>-<line>.mp3).
Reads typing-data/hsk*.js from the repo; writes an .xlsx (one sheet per level),
a .txt per level (file name <TAB> sentence) and a CSV."""
import sys, os, re, json, csv
import openpyxl
from openpyxl.styles import Font, Alignment

REPO, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
LEVELS = ['1', '2', '3', '4', '5', '6', '7-9']
HAN = re.compile(r'[㐀-䶿一-鿿豈-﫿]')

def load(lv):
    js = open(f'{REPO}/typing-data/hsk{lv}.js', encoding='utf-8').read()
    body = js[js.index(']=') + 2:].rstrip().rstrip(';')
    return json.loads(body)

wb = openpyxl.Workbook()
wb.remove(wb.active)
all_rows = []
total = 0
for lv in LEVELS:
    data = load(lv)
    ws = wb.create_sheet(f'HSK{lv}')
    head = ['序号', '文件名', '中文', '拼音', '本题词', '英文', '韩文']
    ws.append(head)
    for c in ws[1]:
        c.font = Font(bold=True)
    n = 0
    for it in data['items']:
        iid, kind, hz, lines = it
        for li, (w, p, en, ko) in enumerate(lines):
            n += 1
            zh = w.replace(' ', '')
            py = ' '.join(tok.replace('-', '') for tok in p.split(' ')) if p else ''
            fname = f'audio/hsk{lv}/{iid}-{li}.mp3'
            ws.append([n, fname, zh, py, hz, en, ko])
            all_rows.append([lv, n, fname, zh, py, hz, en, ko])
    ws.column_dimensions['A'].width = 7
    ws.column_dimensions['B'].width = 30
    ws.column_dimensions['C'].width = 44
    ws.column_dimensions['D'].width = 48
    ws.column_dimensions['E'].width = 10
    ws.column_dimensions['F'].width = 44
    ws.column_dimensions['G'].width = 44
    ws.freeze_panes = 'A2'
    with open(f'{OUT}/hsk{lv}.txt', 'w', encoding='utf-8') as f:
        for r in all_rows:
            if r[0] == lv:
                f.write(f'{r[2]}\t{r[3]}\n')
    print(f'HSK{lv:4s} {n:6d} 句')
    total += n
wb.save(f'{OUT}/hanzumio-typing-recording-list.xlsx')
with open(f'{OUT}/all.csv', 'w', encoding='utf-8-sig', newline='') as f:
    wr = csv.writer(f)
    wr.writerow(['级别', '序号', '文件名', '中文', '拼音', '本题词', '英文', '韩文'])
    wr.writerows(all_rows)
print('total', total)
