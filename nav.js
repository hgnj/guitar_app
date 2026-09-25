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
  { id:"home", icon:"⌂", name:"Home", desc:"アプリ一覧", href:"index.html" },
  { id:"tuner", icon:"◎", name:"Tuner", desc:"チューニング / 音の分析", href:"tuner/index.html", subs:[
      { name:"チューナー",             href:"tuner/index.html#tuner" },
      { name:"ストロボ",               href:"tuner/index.html#strobe" },
      { name:"ビジュアライザー",       href:"tuner/index.html#visualizer" },
      { name:"ミックス",               href:"tuner/index.html#mix" },
      { name:"アドバイザー（音作り）", href:"tuner/index.html#advisor" }
    ]},
  { id:"fretboard", icon:"♮", name:"Fretboard", desc:"指板 / スケール / 練習", href:"fretboard/index.html", byFile:true, subs:[
      { name:"指板マップ",   href:"fretboard/index.html" },
      { name:"練習ツール",   href:"fretboard/practice.html" }
    ]},
  { id:"theory", icon:"♯", name:"Theory", desc:"音楽理論 / 作曲", href:"theory/index.html", byFile:true, subs:[
      { name:"音楽理論",           href:"theory/index.html" },
      { name:"コード進行（作曲）", tab:"コード進行", href:"theory/compose.html" }
    ]},
  { id:"studio", icon:"♫", name:"Studio", desc:"伴奏 / ドラム / リズム練習", href:"studio/index.html", subs:[
      { name:"コードプレイヤー",     href:"studio/index.html#chord" },
      { name:"ドラムマシーン",       href:"studio/index.html#drum" },
      { name:"リズム練習（裏拍）",   href:"studio/index.html#rhythm" }
    ]},
  { id:"bookmark", icon:"▶", name:"Bookmark", desc:"YouTube ループ / 練習動画", href:"bookmark/index.html" }
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
"  background:var(--ui-s2,#1e222b); border:1px solid var(--ui-line2,#3a4150); border-radius:10px; cursor:pointer;",
"  -webkit-tap-highlight-color:transparent;}",
"#gnavBtn:hover{border-color:rgba(var(--ui-accent-rgb,143,168,216),.75); background:var(--ui-s3,#272c37);}",
"#gnavBtn i{display:block; width:18px; height:2px; border-radius:2px; background:#cfd9ea; transition:.18s;}",
"#gnavBtn.on i:nth-child(1){transform:translateY(6px) rotate(45deg);}",
"#gnavBtn.on i:nth-child(2){opacity:0;}",
"#gnavBtn.on i:nth-child(3){transform:translateY(-6px) rotate(-45deg);}",
"#gnavBtn.fixed{position:fixed; top:calc(10px + env(safe-area-inset-top,0px)); left:calc(10px + env(safe-area-inset-left,0px)); z-index:9998;}",
"#gnavOv{position:fixed; inset:0; background:rgba(4,7,12,.62); opacity:0; pointer-events:none;",
"  transition:opacity .18s; z-index:9998;}",
"#gnavOv.on{opacity:1; pointer-events:auto;}",
"#gnavDr{position:fixed; top:0; left:0; bottom:0; width:290px; max-width:86vw; z-index:9999;",
"  background:var(--ui-s1,#161920); border-right:1px solid var(--ui-line,#2a2f3a); box-shadow:12px 0 40px rgba(0,0,0,.5);",
"  transform:translateX(-102%); transition:transform .22s cubic-bezier(.4,0,.2,1);",
"  overflow-y:auto; -webkit-overflow-scrolling:touch;",
"  padding:calc(14px + env(safe-area-inset-top,0px)) 0 calc(20px + env(safe-area-inset-bottom,0px));",
"  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Kaku Gothic ProN',Meiryo,sans-serif;}",
"#gnavDr.on{transform:none;}",
"#gnavDr .gh{display:flex; align-items:center; justify-content:space-between; padding:2px 14px 12px;",
"  font-size:11px; letter-spacing:.28em; color:#7d8ea9; text-transform:uppercase; font-weight:700;}",
"#gnavDr .gx{background:none; border:none; color:#7d8ea9; font-size:20px; line-height:1; cursor:pointer; padding:4px 6px;}",
"#gnavDr a{display:block; text-decoration:none; color:var(--ui-text,#e9edf3);}",
"#gnavDr .ga{display:flex; align-items:center; gap:11px; padding:9px 14px; border-left:3px solid transparent;}",
"#gnavDr .ga:hover{background:var(--ui-s2,#1e222b);}",
"#gnavDr .ga .gi{width:28px; height:28px; border-radius:8px; font-size:15px; flex:0 0 auto;",
"  display:inline-flex; align-items:center; justify-content:center; color:#fff; font-style:normal;",
"  background:linear-gradient(135deg,var(--t-a,#3a4150),var(--t-b,#262b36));}",
"#gnavDr .ga .gt{display:block; font-size:15px; font-weight:700; letter-spacing:.02em;}",
"#gnavDr .ga .gd{display:block; font-size:10.5px; color:var(--ui-sub,#8d97a8); font-weight:400; margin-top:2px;}",
"#gnavDr .ga.cur{border-left-color:var(--ui-accent,#ff8a4d); background:rgba(var(--ui-accent-rgb,255,138,77),.09);}",
"#gnavDr .ga.cur .gt{color:var(--ui-accent,#ffb454);}",
"#gnavDr .gsubs{padding:0 0 5px;}",
"#gnavDr .gs{display:block; padding:6px 14px 6px 53px; font-size:12px; color:var(--ui-faint,#7b879a); border-left:3px solid transparent;}",
"#gnavDr .gsubs.cur .gs{color:var(--ui-sub,#b9c7dc);}",
"#gnavDr .gs:hover{background:var(--ui-s2,#1e222b); color:var(--ui-text,#fff);}",
"#gnavDr .gsubs .gs.cur{color:var(--ui-accent,#4db6ff); border-left-color:var(--ui-accent,#4db6ff); background:rgba(var(--ui-accent-rgb,77,182,255),.07); font-weight:700;}",   /* .gsubs.cur .gs より詳細度を下げないこと */
"#gnavDr .gsep{height:1px; background:var(--ui-line,#2a2f3a); margin:6px 14px;}",
"#gnavDr .gf{padding:12px 16px 0; font-size:10.5px; line-height:1.7; color:#6f7f99;}",
"#gnavDr .gf a{display:inline; color:var(--ui-sub,#8d97a8); text-decoration:underline;}",
"#gnavDr .gf kbd{background:#212a3b; border:1px solid #2e3852; border-radius:4px; padding:1px 5px; font-size:10px;}",
/* 旧・横並びリンクはドロワーに統合したので隠す */
".app-nav{display:none !important;}",
"nav.site-nav>a{display:none !important;}",
"nav.site-nav{display:flex; align-items:center; gap:8px;}",
/* 縦が短い端末では、全部入りでもスクロールせずに収まるよう説明文を省く */
/* ページ単位のアプリ（fretboard / theory）の切り替えタブ。studio の .tabs .tab と同じ寸法 */
"#gnavTabs{display:flex; gap:6px; flex-wrap:wrap; align-items:center;}",
"#gnavTabs a{font-family:inherit; font-size:14px; font-weight:700; line-height:1.2; white-space:nowrap;",
"  padding:8px 14px; border-radius:10px; text-decoration:none; transition:.1s;",
"  color:var(--ui-sub,#8d97a8); background:transparent; border:1px solid var(--ui-line2,#3a4150);}",
"#gnavTabs a:hover{color:var(--ui-text,#e9edf3); border-color:rgba(var(--ui-accent-rgb,143,168,216),.6);}",
"#gnavTabs a.on{color:#fff; border-color:transparent; text-shadow:0 1px 1px rgba(0,0,0,.25);",
"  background:linear-gradient(135deg,var(--t-a,#6f8cc4),var(--t-b,#3b5690));",
"  box-shadow:0 3px 12px rgba(var(--ui-accent-rgb,143,168,216),.28);}",
"@media (max-width:520px){ #gnavTabs a{padding:7px 11px; font-size:13px;} }",
"@media (max-height:780px){",
"  #gnavDr .ga .gd{display:none;}",            /* ← 基本ルールと同じ詳細度にしないと負ける */
"  #gnavDr .ga{padding:7px 14px;}",
"  #gnavDr .gs{padding:5px 14px 5px 52px;}",
"  #gnavDr .gh{padding-bottom:8px;}",
"  #gnavDr .gf{display:none;}",
"}",
"@media (prefers-reduced-motion:reduce){#gnavDr,#gnavOv,#gnavBtn i{transition:none;}}"
].join("\n");

/* アプリごとの設置場所の微調整（☰ を必ず左端に置く） */
var FIT = {
  tuner:     "body>header{justify-content:flex-start !important;}\nbody>header>.title{margin-right:auto;}",
  bookmark:  "#gnavRow{display:flex; align-items:center; gap:12px; margin:0 0 14px;}\n#gnavRow .brand{margin:0;}",
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

  /* サブページは全アプリぶん最初から開いておく（どこに何があるか一目で分かるように）。
     data-app / data-file / data-hash は、現在地マークを後から付け直すための目印。 */
  var h='<div class="gh"><span>Guitar Apps</span><button class="gx" type="button" aria-label="閉じる">✕</button></div>';
  APPS.forEach(function(app,i){
    var cur = app.id===CUR;
    h+='<a class="ga'+(cur?" cur":"")+'" href="'+url(app.href)+'">'+
         '<span class="gi ui-tile" data-tile="'+app.id+'">'+app.icon+'</span>'+
         '<span><span class="gt">'+app.name+'</span><span class="gd">'+app.desc+'</span></span>'+
       '</a>';
    if(app.subs){
      h+='<div class="gsubs'+(cur?" cur":"")+'">';
      app.subs.forEach(function(s){
        var tail=(s.href.match(/[^\/]*$/)||[""])[0], p=tail.split("#");
        h+='<a class="gs" data-app="'+app.id+'" data-file="'+p[0]+'" data-hash="'+(p[1]||"")+'"'+
             ' href="'+url(s.href)+'">'+s.name+'</a>';
      });
      h+='</div>';
    }
    if(i===0) h+='<div class="gsep"></div>';
  });
  h+='<div class="gf">すべてブラウザ内で完結（通信なし）。<kbd>Esc</kbd> で閉じる。<br>'+
     'ギター音源：<a href="https://github.com/nbrosowsky/tonejs-instruments" target="_blank" rel="noopener">tonejs-instruments</a>'+
     '（<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC-BY 3.0</a>）</div>';
  dr.innerHTML=h;

  /* 現在地のサブページに印を付ける。
     ・必ず「今いるアプリ」の中だけを見る（そうしないと index.html 同士が別アプリ間で一致してしまう）
     ・tuner / studio は #hash でモードを切り替えるので、ハッシュでも判定し、切替に追従する */
  var subEls = Array.prototype.slice.call(dr.querySelectorAll(".gs"));
  var byFile = {}; APPS.forEach(function(a){ byFile[a.id] = !!a.byFile; });
  function markCurrentSub(){
    var hash = (location.hash||"").replace("#","").toLowerCase();
    subEls.forEach(function(el){
      var mine = el.getAttribute("data-app")===CUR, on=false;
      if(mine){
        if(byFile[CUR]) on = el.getAttribute("data-file")===CURFILE;
        else if(el.getAttribute("data-hash")) on = el.getAttribute("data-hash").toLowerCase()===hash;
      }
      el.classList.toggle("cur", on);
    });
  }
  markCurrentSub();
  window.addEventListener("hashchange", markCurrentSub);

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

  /* 全アプリで「☰ ＋ アプリの顔（色タイル＋名前）」を上端の1行に揃える。
     tuner / studio は元から同じ行にある。残りの2つはここで寄せる。 */
  if(mount && (CUR==="fretboard" || CUR==="theory")){
    // ページ見出し（.logo）を ☰ のバーへ移す。見出ししか無かったヘッダーは畳む
    var logo = document.querySelector(".app > header .logo");
    if(logo){
      var hdr = logo.parentNode;
      mount.appendChild(logo);
      if(!hdr.children.length) hdr.style.display = "none";
    }
  }
  /* 1つのアプリが複数の HTML ページでできている場合（fretboard / theory）は、
     tuner のモードボタンや studio のタブと同じく、画面上でページを切り替えられるようにする。
     中身はサイトマップ（APPS）から作るので、ページを足せばドロワーとタブが一緒に増える。 */
  var curApp = null;
  APPS.forEach(function(a){ if(a.id===CUR) curApp = a; });
  if(mount && curApp && curApp.byFile && curApp.subs && curApp.subs.length > 1){
    var tabs = document.createElement("div");
    tabs.id = "gnavTabs";
    tabs.setAttribute("aria-label", curApp.name + " のページ");
    curApp.subs.forEach(function(s){
      var f = (s.href.match(/[^\/]*$/)||[""])[0].split("#")[0];
      var a = document.createElement("a");
      a.href = url(s.href);
      a.textContent = s.tab || s.name;
      if(f === CURFILE){ a.className = "on"; a.setAttribute("aria-current", "page"); }
      tabs.appendChild(a);
    });
    mount.appendChild(tabs);
  }

  if(mount && CUR==="bookmark"){
    // ☰ とロゴ（h1）を横並びの行にまとめる（h1 の中にボタンを入れない）
    var brand = mount.querySelector(".brand");
    if(brand){
      var row = document.createElement("div"); row.id = "gnavRow";
      mount.insertBefore(row, mount.firstChild);
      row.appendChild(btn); row.appendChild(brand);
    }
  }

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
