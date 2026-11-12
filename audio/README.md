# 句子录音

`typing.html` 为每道题找这个位置的录音：

```
audio/hsk<级别>/<题目id>-<行号>.mp3
```

例如 `audio/hsk1/ce53b631-0.mp3`。级别是 `1`–`6` 或 `7-9`，题目 id 和行号来自 `typing-data/hsk*.js`；每句对应的文件名可以用 `tools/typing-data/reclist.py` 生成完整清单（Excel + 每级一个文本文件）。

- 有文件的句子：题目出现时自动朗读，按 Ctrl 或喇叭按钮重听。
- 没有文件的句子：按钮自动隐藏，其他功能不受影响，可以分批补。
- 格式用 MP3（单声道、48–64 kbps 即可），一句一个文件，前后不留长静音。

## 录音放在别处

两万多个 MP3 放进仓库会很大（GitHub Pages 站点上限 1 GB）。可以把 `hsk1/…hsk7-9/` 这些目录放到任意静态存储（对象存储、CDN），然后在 `typing.html` 引入 `typing.js` 之前加一行：

```html
<script>window.HANZUMIO_AUDIO_BASE = 'https://你的域名/hanzumio-audio/';</script>
```

文件名规则不变。存储需要允许跨域读取（CORS 允许本站点）。
