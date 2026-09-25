# -*- coding: utf-8 -*-
"""エレキ（クリーン）の録音音源を、アプリに埋め込む JS ファイルに変換する。

作り直すとき:
  1) 元の WAV を取得（17 音）
     https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/guitar-electric/<音名>.wav
     音名: Cs2 E2 Fs2 A2 C3 Ds3 Fs3 A3 C4 Ds4 Fs4 A4 C5 Ds5 Fs5 A5 C6
  2) MP3 エンコーダを作業用フォルダにだけ入れる:  python -m pip install --target <作業用フォルダ> lameenc
  3) python build-guitar-data.py <作業用フォルダ> <WAV のフォルダ> sound/guitar-clean.data.js

入力: tonejs-instruments の guitar-electric WAV（モノラル 44.1kHz 16bit、各 4.22 秒）
出力: guitar_app/sound/guitar-clean.data.js
      window.GUITAR_CLEAN_SAMPLES = { format, notes: { "Cs2": "<base64 mp3>", ... } }

・長さは削らない（低音弦は 3 秒後もまだ -20dB で鳴っている＝コードを伸ばすときに必要）
・原本（劣化なしの WAV）から 1 回だけ MP3 96kbps に変換する（元の MP3 は約 190kbps で過剰）
・埋め込みにするのは、ネットが無くても・ファイルを直接開いても鳴るようにするため
"""
import base64, io, json, os, sys, wave

sys.path.insert(0, sys.argv[1])          # 作業用フォルダに入れた lameenc
import lameenc

SRC, OUT = sys.argv[2], sys.argv[3]
NOTES = ["Cs2", "E2", "Fs2", "A2", "C3", "Ds3", "Fs3", "A3", "C4",
         "Ds4", "Fs4", "A4", "C5", "Ds5", "Fs5", "A5", "C6"]
KBPS = 96

notes, total_in, total_out = {}, 0, 0
for n in NOTES:
    p = os.path.join(SRC, n + ".wav")
    w = wave.open(p)
    assert w.getnchannels() == 1 and w.getsampwidth() == 2, n
    pcm = w.readframes(w.getnframes())
    enc = lameenc.Encoder()
    enc.set_bit_rate(KBPS)
    enc.set_in_sample_rate(w.getframerate())
    enc.set_channels(1)
    enc.set_quality(2)                    # 2 = 高品質（遅いが一度きり）
    mp3 = enc.encode(pcm) + enc.flush()
    notes[n] = base64.b64encode(mp3).decode("ascii")
    total_in += os.path.getsize(p)
    total_out += len(mp3)

header = """/* ═══════════════════════════════════════════════════════════════
   guitar-clean.data.js — エレキギター（クリーン）の録音音源（生成ファイル・手で編集しない）

   音源: tonejs-instruments  https://github.com/nbrosowsky/tonejs-instruments
         by Nicholaus P. Brosowsky — samples licensed under CC-BY 3.0
         https://creativecommons.org/licenses/by/3.0/
         元の録音: Karoryfer Samples  https://www.karoryfer.com/karoryfer-samples
   改変: 元の WAV を MP3 %dkbps（モノラル）に再エンコードし、base64 で埋め込んだ。
         音そのもの（長さ・音量・音色）は変えていない。
   収録: %s（約3半音おき、各 4.22 秒）
   ═══════════════════════════════════════════════════════════════ */
""" % (KBPS, " ".join(NOTES))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write(header)
    f.write("window.GUITAR_CLEAN_SAMPLES=")
    f.write(json.dumps({"format": "audio/mpeg", "notes": notes}, separators=(",", ":")))
    f.write(";\n")

print("WAV 原本     : %4d KB" % (total_in // 1024))
print("MP3 %dkbps   : %4d KB" % (KBPS, total_out // 1024))
print("埋め込み JS  : %4d KB  -> %s" % (os.path.getsize(OUT) // 1024, OUT))
