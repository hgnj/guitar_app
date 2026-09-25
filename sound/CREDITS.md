# 音源のクレジット

## エレキギター（クリーン）— `guitar-clean.data.js`

- 音源: [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) の `samples/guitar-electric`
- 作者: Nicholaus P. Brosowsky
- 元の録音: [Karoryfer Samples](https://www.karoryfer.com/karoryfer-samples)
- ライセンス: [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/)（音源部分。tonejs-instruments のコード部分は MIT）
- 改変: 元の WAV（モノラル 44.1kHz、各 4.22 秒、17 音：C#2〜C6 を約3半音おき）を
  MP3 96kbps に再エンコードし、base64 で JS に埋め込んだ。長さ・音量・音色は変えていない。

## 作り直し方

`build-guitar-data.py` を参照（元の WAV を取得 → MP3 に変換 → `guitar-clean.data.js` を書き出す）。
