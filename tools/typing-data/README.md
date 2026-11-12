# typing-data 构建脚本

`typing.html` 的题目放在 `typing-data/hsk*.js`，由 HSK 词汇表（Excel）生成。词表文件不在仓库里；重新生成时把所有 `.xlsx` 放进一个目录，按下面的顺序运行。需要 Python 3 和 `openpyxl`、`pypinyin`：

```sh
python3 -m venv venv && ./venv/bin/pip install openpyxl pypinyin
```

| 步骤 | 命令 | 作用 |
| --- | --- | --- |
| 1 | `python -I normalize.py <xlsx目录> work/normalized.json` | 读所有工作表，按「文件 + 行号」收词，按汉字和拼音合并成词典，按中文内容合并对话和例句，并记录源数据问题（编号重复、列位错乱、译文缺段等） |
| 2 | `python -I align.py work/normalized.json work` | 用 pypinyin 把每句的拼音按词对到汉字上，得到分词和逐字拼音；写出 `aligned.json`、对不上的 `failed.json`、不在词表里的词 `unknown.json` |
| 3 | `python -I batches.py work` | 把需要人工/模型处理的部分分批：拼音重写（fix）、缺的译文（tr）、不在词表里的词的释义（gloss）、按标点猜拆的译文复核（chk） |
| 4 | （模型或人工）| 每批输出写到 `work/out/<批名>.out.json`，复核结果写到 `<批名>.chk.json`，格式见 `batches.py` 顶部注释和 `emit.py` |
| 5 | `python -I apply_fixes.py work` | 把拼音修正写回 `normalized.json`，然后再跑一次第 2 步 |
| 6 | `python -I emit.py work <仓库目录>` | 合并译文和释义，写出 `typing-data/hsk*.js` |

## 数据格式

```js
window.HANZUMIO_TYPING_LEVELS['1'] = {
  words: { '学生': ['xuésheng', 'n', 'student', '학생'], ... },   // 同形异音的词再加一条 '行|háng'
  items: [
    [id, 'd' /* 对话 */ | 'e' /* 例句 */, '本题词', [
      ['你 爱 吃 什么 ？', 'nǐ ài chī shén-me', 'What do you love to eat?', '무엇을 먹는 걸 좋아해요?'],
      ...
    ]],
  ],
};
```

一行里词与词用空格隔开，标点和数字也是一个词；拼音只给汉字词，一个字一个音节，音节间用 `-`，儿化的「儿」写作 `r`（哪儿 → `nǎ-r`）。词性代码：n 名词 v 动词 a 形容词 d 副词 r 代词 m 数词 q 量词 p 介词 c 连词 u 助词 i 叹词 o 拟声词 af 词缀 ci 成语 x 短语。
