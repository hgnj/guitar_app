/* ═══════════════════════════════════════════════════════════════
   sound/guitar.js — 録音したエレキギター（クリーン）で1音を鳴らす共通エンジン

   ・音源は同じフォルダの guitar-clean.data.js（MP3 を埋め込んだもの＝ネット不要、
     ファイルを直接開いても鳴る）。出典とライセンスは sound/CREDITS.md。
   ・各ページの合成音の「代わり」に使う。読み込みとデコードが終わるまでは、
     ページ側はこれまでの合成音で鳴らす（isReady() が false の間）。
   ・音の高さは、最寄りの録音音から再生速度でずらして作る。
     収録は約3半音おきなので、ずらす量は最大でも ±1.5 半音（不自然にならない範囲）。

   使い方
     <script src="../sound/guitar.js"></script>   … 読み込むだけで、裏で音源の準備を始める
     GuitarRec.isReady()                              … 準備ができたか
     GuitarRec.voice(ctx, midi, t, opt)               … 時刻 t に1音。opt は下を参照
     GuitarRec.now(ctx, midi, opt)                    … 今すぐ1音（同じ瞬間の連続呼び出しは和音として少しずらす）
     GuitarRec.freqToMidi(hz)                         … 周波数 → MIDI（小数可）
   ═══════════════════════════════════════════════════════════════ */
(function(){
"use strict";
if(window.GuitarRec) return;

var SELF = document.currentScript;
var DIR  = SELF ? SELF.src.replace(/[^\/]*$/, "") : "";

/* 収録音（ファイル名 → MIDI） */
var NAMES = { Cs2:37, E2:40, Fs2:42, A2:45, C3:48, Ds3:51, Fs3:54, A3:57, C4:60,
              Ds4:63, Fs4:66, A4:69, C5:72, Ds5:75, Fs5:78, A5:81, C6:84 };

var bank = null;      // [{midi, buf, onset}] 低い順。準備できたらここに入る
var loading = null;

function loadData(){
  if(window.GUITAR_CLEAN_SAMPLES) return Promise.resolve(window.GUITAR_CLEAN_SAMPLES);
  return new Promise(function(res, rej){
    var s = document.createElement("script");
    s.src = DIR + "guitar-clean.data.js"; s.async = true;
    s.onload  = function(){ window.GUITAR_CLEAN_SAMPLES ? res(window.GUITAR_CLEAN_SAMPLES) : rej(new Error("no sample data")); };
    s.onerror = function(){ rej(new Error("sample data could not be loaded")); };
    (document.head || document.documentElement).appendChild(s);
  });
}
function b64ToBuffer(str){
  var bin = atob(str), n = bin.length, u = new Uint8Array(n);
  for(var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}
/* デコード専用のコンテキスト。OfflineAudioContext なら、ユーザー操作の前でも
   音声出力をつかまずにデコードできる。できた AudioBuffer はどの AudioContext でも使える。 */
var decoder = null;
function decoderCtx(){
  if(decoder) return decoder;
  var O = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  decoder = O ? new O(1, 1, 44100) : null;
  return decoder;
}
function decode(ctx, ab){
  return new Promise(function(res, rej){
    var p = ctx.decodeAudioData(ab, res, rej);   // 古い Safari はコールバック形式のみ
    if(p && p.then) p.then(res, rej);
  });
}
/* MP3 はエンコーダの都合で頭に数十 ms の無音が付く。
   和音の刻みやリズムに響くので、実際に音が立ち上がる位置から再生する。 */
function onsetOf(buf){
  var d = buf.getChannelData(0), pk = 0, i, a;
  for(i = 0; i < d.length; i++){ a = d[i] < 0 ? -d[i] : d[i]; if(a > pk) pk = a; }
  var th = pk * 0.02, lim = Math.min(d.length, (buf.sampleRate * 0.25) | 0);
  for(i = 0; i < lim; i++){ a = d[i] < 0 ? -d[i] : d[i]; if(a > th) break; }
  return Math.max(0, i - 16) / buf.sampleRate;    // 立ち上がりの 16 サンプル手前から
}

/* 音源を用意する。ctx を渡さなければデコード専用コンテキストを使う */
function ready(ctx){
  if(bank) return Promise.resolve(true);
  if(loading) return loading;
  loading = loadData().then(function(data){
    var dc = ctx || decoderCtx();
    if(!dc) throw new Error("no AudioContext to decode with");
    return Promise.all(Object.keys(NAMES).map(function(k){
      return decode(dc, b64ToBuffer(data.notes[k])).then(function(buf){
        return { midi: NAMES[k], buf: buf, onset: onsetOf(buf) };
      });
    }));
  }).then(function(list){
    list.sort(function(a, b){ return a.midi - b.midi; });
    bank = list;
    return true;
  }).catch(function(e){
    loading = null;
    if(window.console) console.warn("GuitarRec:", e && e.message);
    return false;
  });
  return loading;
}

function nearest(midi){
  var best = bank[0], bd = Infinity;
  for(var i = 0; i < bank.length; i++){
    var d = Math.abs(bank[i].midi - midi);
    if(d < bd){ bd = d; best = bank[i]; }
  }
  return best;
}
function freqToMidi(f){ return 69 + 12 * Math.log(f / 440) / Math.LN2; }

/* 時刻 t に1音。
   opt.vel    強さ 0〜1（音量と明るさ。弱く弾くと少しこもる）
   opt.gain   音量の倍率（ページごとの音量合わせ用）
   opt.dur    秒。この後、指を離したように減衰させる（省略時は自然に鳴り切る）
   opt.mute   "palm"（ブリッジミュート）/ "chuck"（左手ミュートのカッティング）
   opt.pan    -1〜1
   opt.dest   接続先（省略時は ctx.destination）
   opt.sends  追加の接続先の配列（リバーブへの送りなど）
   戻り値 {src, gain, end} … 呼び出し側で止めたり（弦のミュート）するため */
function voice(ctx, midi, t, opt){
  if(!bank) return null;
  opt = opt || {};
  var v = Math.max(0.05, Math.min(1, opt.vel == null ? 0.8 : opt.vel));
  var s = nearest(midi);

  var src = ctx.createBufferSource();
  src.buffer = s.buf;
  // 1音ごとにごくわずかに揺らす（同じ音の連打が機械的に揃いすぎないように）
  src.playbackRate.value = Math.pow(2, (midi - s.midi) / 12) * (1 + (Math.random() - 0.5) * 0.0015);

  var lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.Q.value = 0.5;
  lp.frequency.value = opt.mute === "palm" ? 900 : 2200 + v * v * 12000;

  var g = ctx.createGain();
  var amp = (0.18 + 0.82 * v * v) * (opt.gain == null ? 1 : opt.gain) * (1 + (Math.random() - 0.5) * 0.08);
  g.gain.setValueAtTime(amp, t);

  var out = g;
  if(opt.pan && ctx.createStereoPanner){
    var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, opt.pan));
    g.connect(p); out = p;
  }
  src.connect(lp); lp.connect(g);
  out.connect(opt.dest || ctx.destination);
  if(opt.sends) for(var i = 0; i < opt.sends.length; i++) if(opt.sends[i]) out.connect(opt.sends[i]);

  var rate = src.playbackRate.value;
  var end = t + (s.buf.duration - s.onset) / rate;
  if(opt.mute === "chuck"){ g.gain.setTargetAtTime(0, t + 0.012, 0.012); end = t + 0.12; }
  else if(opt.mute === "palm"){ g.gain.setTargetAtTime(0, t + 0.06, 0.05); end = t + 0.4; }
  else if(opt.dur){ g.gain.setTargetAtTime(0, t + opt.dur, 0.04); end = Math.min(end, t + opt.dur + 0.3); }

  src.start(t, s.onset);
  src.stop(end + 0.05);
  return { src: src, gain: g, end: end };
}

/* 今すぐ1音（fretboard 系ページの「タップしたら鳴る」用）。
   同じ瞬間に続けて呼ばれた音＝和音は、弦を低い方から順に弾いたように 10〜16ms ずつずらす。
   （各ページの和音の鳴らし方を書き換えずに、ブロック和音をギターらしいストロークにする） */
var lastCall = 0, chordIdx = 0;
function now(ctx, midi, opt){
  var tNow = (window.performance && performance.now) ? performance.now() : Date.now();
  chordIdx = (tNow - lastCall < 4) ? chordIdx + 1 : 0;
  lastCall = tNow;
  var o = {}; for(var k in (opt || {})) o[k] = opt[k];
  if(o.vel == null) o.vel = Math.max(0.4, 0.85 - chordIdx * 0.05);   // 後の弦ほど少し弱く
  var t = ctx.currentTime + 0.005 + chordIdx * (0.010 + Math.random() * 0.006);
  return voice(ctx, midi, t, o);
}

window.GuitarRec = {
  ready: ready,
  isReady: function(){ return !!bank; },
  voice: voice,
  now: now,
  freqToMidi: freqToMidi,
  range: { lo: 37, hi: 84 }
};

/* ページを開いたら、少し待ってから裏で準備を始める（最初のタップで待たせないため） */
function warm(){ setTimeout(function(){ ready(); }, 150); }
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", warm);
else warm();
})();
