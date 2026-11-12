# 录音清单

每级一个文件，每行「录音文件名 ⇥ 句子」，由 `../reclist.py` 从 `typing-data/hsk*.js` 生成：

```sh
python3 reclist.py <仓库目录> <输出目录>   # 另外还会生成 Excel 和 CSV（含拼音、本题词、英韩译文）
```

录好的 MP3 按清单里的文件名放到仓库的 `audio/` 目录下即可（见 `audio/README.md`）。
