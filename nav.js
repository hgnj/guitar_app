/* ═══════════════════════════════════════════════════════════════
   nav.js — Guitar Apps 共通ナビゲーション（ハンバーガー・ドロワー）
   各ページの <body> 末尾で <script src="../nav.js" defer></script>。
   ・画面左上に ☰ を置き、タップで全アプリ／全ページの一覧を開く
   ・従来の横並びリンク（.app-nav / .site-nav）は自動で隠す
   ・現在地はハイライト。リンクはすべて相対パス（GitHub Pages / file:// 両対応）
   ═══════════════════════════════════════════════════════════════ */
(function(){
"use strict";
if(window.__gnav) return; window.__gnav=true;

/* ── このスクリプトの場所＝アプリ集のルート ── */
var SELF = document.currentScript || (function(){
  var a=document.getElementsByTagName("script");
  for(var i=a.length-1;i>=0;i--){ if(/nav\.js(\?|#|$)/.test(a[i].src||"")) return a[i]; }
  return null;
})();
var ROOT = SELF ? SELF.src.replace(/[^\/]*$/,"") : "./";
function url(p){ return ROOT + p; }

/* ── サイトマップ ── */
var APPS = [
  { id:"home", icon:"🏠", name:"Home", desc:"アプリ一覧", href:"index.html" },
  { id:"tuner", icon:"🎚", name:"Tuner", desc:"チューニング / 音の分析", href:"tuner/index.html", subs:[
      { name:"チューナー",             href:"tuner/index.html#tuner" },
      { name:"ストロボ",               href:"tuner/index.html#strobe" },
      { name:"ビジュアライザー",       href:"tuner/index.html#visualizer" },
      { name:"ミックス",               href:"tuner/index.html#mix" },
      { name:"アドバイザー（音作り）", href:"tuner/index.html#advisor" }
    ]},
  { id:"fretboard", icon:"🎸", name:"Fretboard", desc:"指板 / スケール / 練習", href:"fretboard/index.html", byFile:true, subs:[
      { name:"指板マップ",   href:"fretboard/index.html" },
      { name:"練習ツール",   href:"fretboard/practice.html" }
    ]},
  { id:"theory", icon:"🎼", name:"Theory", desc:"音楽理論 / 作曲", href:"theory/index.html", byFile:true, subs:[
      { name:"音楽理論",           href:"theory/index.html" },
      { name:"コード進行（作曲）", href:"theory/compose.html" }
    ]},
  { id:"studio", icon:"🎹", name:"Studio", desc:"伴奏 / ドラム / リズム練習", href:"studio/index.html", subs:[
      { name:"コードプレイヤー",     href:"studio/index.html#chord" },
      { name:"ドラムマシーン",       href:"studio/index.html#drum" },
      { name:"リズム練習（裏拍）",   href:"studio/index.html#rhythm" }
    ]},
  { id:"bookmark", icon:"🔖", name:"Bookmark", desc:"YouTube ループ / 練習動画", href:"bookmark/index.html" }
];

/* ── 現在地の判定 ──
   nav.js の置き場所（＝アプリ集のルート）からの相対パスで見る。
   パス全体で判定すると、親フォルダに theory / studio 等の名前があるだけで誤判定するため。 */
var path = location.pathname.replace(/\\/g,"/");
var here = path;
try{
  var rootPath = new URL(ROOT, location.href).pathname.replace(/\\/g,"/");
  if(rootPath && path.indexOf(rootPath)===0) here = "/" + path.slice(rootPath.length);
}catch(e){}
var CUR = "home", CURFILE = (path.match(/[^\/]*$/)||[""])[0] || "index.html";
if(/^\/tuner\//.test(here)) CUR="tuner";
else if(/^\/fretboard\//.test(here)) CUR="fretboard";
else if(/^\/theory\//.test(here)) CUR="theory";
else if(/^\/studio\//.test(here)) CUR="studio";
else if(/^\/bookmark\//.test(here)) CUR="bookmark";

/* ── スタイル ── */
var CSS = [
"#gnavBtn{position:relative; z-index:60; display:inline-flex; flex-direction:column; justify-content:center;",
"  align-items:center; gap:4px; width:42px; height:38px; padding:0; flex:0 0 auto;",
"  background:rgba(33,42,59,.85); border:1px solid #2e3852; border-radius:10px; cursor:pointer;",
"  -webkit-tap-highlight-color:transparent;}",
"#gnavBtn:hover{border-color:#4a5a82; background:#263047;}",
"#gnavBtn i{display:block; width:18px; height:2px; border-radius:2px; background:#cfd9ea; transition:.18s;}",
"#gnavBtn.on i:nth-child(1){transform:translateY(6px) rotate(45deg);}",
"#gnavBtn.on i:nth-child(2){opacity:0;}",
"#gnavBtn.on i:nth-child(3){transform:translateY(-6px) rotate(-45deg);}",
"#gnavBtn.fixed{position:fixed; top:calc(10px + env(safe-area-inset-top,0px)); left:calc(10px + env(safe-area-inset-left,0px)); z-index:9998;}",
"#gnavOv{position:fixed; inset:0; background:rgba(4,7,12,.62); opacity:0; pointer-events:none;",
"  transition:opacity .18s; z-index:9998;}",
"#gnavOv.on{opacity:1; pointer-events:auto;}",
"#gnavDr{position:fixed; top:0; left:0; bottom:0; width:290px; max-width:86vw; z-index:9999;",
"  background:#141a26; border-right:1px solid #2e3852; box-shadow:12px 0 40px rgba(0,0,0,.5);",
"  transform:translateX(-102%); transition:transform .22s cubic-bezier(.4,0,.2,1);",
"  overflow-y:auto; -webkit-overflow-scrolling:touch;",
"  padding:calc(14px + env(safe-area-inset-top,0px)) 0 calc(20px + env(safe-area-inset-bottom,0px));",
"  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Kaku Gothic ProN',Meiryo,sans-serif;}",
"#gnavDr.on{transform:none;}",
"#gnavDr .gh{display:flex; align-items:center; justify-content:space-between; padding:2px 14px 12px;",
"  font-size:11px; letter-spacing:.28em; color:#7d8ea9; text-transform:uppercase; font-weight:700;}",
"#gnavDr .gx{background:none; border:none; color:#7d8ea9; font-size:20px; line-height:1; cursor:pointer; padding:4px 6px;}",
"#gnavDr a{display:block; text-decoration:none; color:#e7edf6;}",
"#gnavDr .ga{display:flex; align-items:center; gap:11px; padding:11px 14px; border-left:3px solid transparent;}",
"#gnavDr .ga:hover{background:#1c2434;}",
"#gnavDr .ga .gi{font-size:19px; width:24px; text-align:center; flex:0 0 auto;}",
"#gnavDr .ga .gt{display:block; font-size:15px; font-weight:700; letter-spacing:.02em;}",
"#gnavDr .ga .gd{display:block; font-size:10.5px; color:#8a9ab5; font-weight:400; margin-top:2px;}",
"#gnavDr .ga.cur{border-left-color:#ff8a4d; background:#1a2130;}",
"#gnavDr .ga.cur .gt{color:#ffb454;}",
"#gnavDr .gsubs{padding:0 0 6px;}",
"#gnavDr .gs{display:block; padding:8px 14px 8px 52px; font-size:12.5px; color:#a9b8d0; border-left:3px solid transparent;}",
"#gnavDr .gs:hover{background:#1c2434; color:#fff;}",
"#gnavDr .gs.cur{color:#4db6ff; border-left-color:#4db6ff; background:#18202e;}",
"#gnavDr .gsep{height:1px; background:#232c3d; margin:6px 14px;}",
"#gnavDr .gf{padding:12px 16px 0; font-size:10.5px; line-height:1.7; color:#6f7f99;}",
"#gnavDr .gf kbd{background:#212a3b; border:1px solid #2e3852; border-radius:4px; padding:1px 5px; font-size:10px;}",
/* 旧・横並びリンクはドロワーに統合したので隠す */
".app-nav{display:none !important;}",
"nav.site-nav>a{display:none !important;}",
"nav.site-nav{display:flex; align-items:center; gap:8px;}",
"@media (prefers-reduced-motion:reduce){#gnavDr,#gnavOv,#gnavBtn i{transition:none;}}"
].join("\n");

/* アプリごとの設置場所の微調整（☰ を必ず左端に置く） */
var FIT = {
  tuner:     "body>header{justify-content:flex-start !important;}\nbody>header>.title{margin-right:auto;}",
  bookmark:  "#gnavBtn{margin-bottom:10px;}",
  studio:    ".tabs #gnavBtn{margin-right:2px;}",
  fretboard: "nav.site-nav{padding-top:8px; padding-bottom:8px;}",
  theory:    "nav.site-nav{padding-top:8px; padding-bottom:8px;}"
};

/* ── 組み立て ── */
function build(){
  var st=document.createElement("style"); st.id="gnavCSS";
  st.textContent = CSS + (FIT[CUR] ? "\n"+FIT[CUR] : "");
  document.head.appendChild(st);

  var btn=document.createElement("button");
  btn.id="gnavBtn"; btn.type="button";
  btn.setAttribute("aria-label","メニュー"); btn.setAttribute("aria-expanded","false");
  btn.innerHTML="<i></i><i></i><i></i>";

  var ov=document.createElement("div"); ov.id="gnavOv";
  var dr=document.createElement("nav"); dr.id="gnavDr";
  dr.setAttribute("aria-label","アプリ切替"); dr.setAttribute("aria-hidden","true");

  var h='<div class="gh"><span>Guitar Apps</span><button class="gx" type="button" aria-label="閉じる">✕</button></div>';
  APPS.forEach(function(app,i){
    var cur = app.id===CUR;
    h+='<a class="ga'+(cur?" cur":"")+'" href="'+url(app.href)+'">'+
         '<span class="gi">'+app.icon+'</span>'+
         '<span><span class="gt">'+app.name+'</span><span class="gd">'+app.desc+'</span></span>'+
       '</a>';
    if(app.subs && cur){
      h+='<div class="gsubs">';
      app.subs.forEach(function(s){
        var f=(s.href.match(/[^\/]*$/)||[""])[0].split("#")[0];
        var sc = app.byFile && (f===CURFILE);
        h+='<a class="gs'+(sc?" cur":"")+'" href="'+url(s.href)+'">'+s.name+'</a>';
      });
      h+='</div>';
    }
    if(i===0) h+='<div class="gsep"></div>';
  });
  h+='<div class="gf">すべてブラウザ内で完結（通信なし）。<br><kbd>Esc</kbd> で閉じる。</div>';
  dr.innerHTML=h;

  document.body.appendChild(ov);
  document.body.appendChild(dr);

  /* 設置場所（各アプリのヘッダー左端）。無ければ画面左上に固定 */
  var sel = CUR==="tuner" ? "body>header"
          : CUR==="studio" ? ".tabs"
          : (CUR==="fretboard"||CUR==="theory") ? "nav.site-nav"
          : CUR==="bookmark" ? ".sidebar-head" : null;
  var mount = sel ? document.querySelector(sel) : null;
  if(mount) mount.insertBefore(btn, mount.firstChild);
  else { btn.classList.add("fixed"); document.body.appendChild(btn); }

  /* 開閉 */
  var open=false;
  function set(v){
    open=v;
    dr.classList.toggle("on",v); ov.classList.toggle("on",v); btn.classList.toggle("on",v);
    btn.setAttribute("aria-expanded",v?"true":"false");
    dr.setAttribute("aria-hidden",v?"false":"true");
    if(v){ var f=dr.querySelector("a"); if(f) f.focus(); }
  }
  btn.addEventListener("click",function(e){ e.preventDefault(); set(!open); });
  ov.addEventListener("click",function(){ set(false); });
  dr.querySelector(".gx").addEventListener("click",function(){ set(false); });
  dr.addEventListener("click",function(e){ if(e.target.closest("a")) set(false); });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&open) set(false); });
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",build);
else build();
})();
