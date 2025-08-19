// js/dev/g73-debugger.js  (compat-safe: no optional chaining / no ??)
(function(){
  if (window.__G73_DEBUGGER__) return; window.__G73_DEBUGGER__ = true;

  // ---- Polyfills (tiny) ----
  if (typeof window.CSS === 'undefined') window.CSS = {};
  if (!CSS.escape){
    CSS.escape = function(value){
      // simple escape: wrap if contains quotes or whitespace
      try{
        return String(value).replace(/[^a-zA-Z0-9_\-]/g, function(ch){
          var hex = ch.charCodeAt(0).toString(16).toUpperCase();
          return '\\' + hex + ' ';
        });
      }catch(e){ return '' + value; }
    };
  }

  // ---- Styles ----
  var style = document.createElement('style');
  style.textContent = '\
  .g73dbg-panel{position:fixed;right:10px;bottom:76px;width:min(92vw,360px);max-height:65vh;z-index:2147483646;display:grid;grid-template-rows:auto auto 1fr auto;gap:8px;padding:10px;border-radius:14px;background:color-mix(in srgb,#0b0f14 87%,transparent);border:1px solid rgba(255,255,255,.15);box-shadow:0 16px 44px rgba(0,0,0,.55);font:12px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#eaf2ff;backdrop-filter:blur(10px)}\
  .g73dbg-row{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}\
  .g73dbg-bad{color:#ffb4c4}.g73dbg-warn{color:#ffd27a}.g73dbg-good{color:#a7ffbf}\
  .g73dbg-chip{padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.15)}\
  .g73dbg-logs{overflow:auto;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:6px}\
  .g73dbg-logs pre{margin:0;white-space:pre-wrap;font:11px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#dbe8ff}\
  .g73dbg-btn{background:transparent;border:1px solid rgba(255,255,255,.18);color:#eaf2ff;border-radius:10px;padding:8px 10px;cursor:pointer;font-size:12px}\
  .g73dbg-btn:hover{background:rgba(255,255,255,.08)}\
  .g73dbg-handle{cursor:move;user-select:none;touch-action:none}\
  .g73dbg-mark{animation:g73dbgMark .9s ease-out both}\
  .g73dbg-fab{position:fixed;right:12px;bottom:12px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;z-index:2147483646;background:radial-gradient(120% 120% at 30% 25%,rgba(255,255,255,.09),rgba(255,255,255,.03));color:#eaf2ff;border:1px solid rgba(255,255,255,.18);box-shadow:0 10px 24px rgba(0,0,0,.55);font-weight:700;letter-spacing:.02em}\
  .g73dbg-fab:active{transform:translateY(1px)}\
  .g73dbg-controls{display:flex;gap:6px;flex-wrap:wrap}\
  .g73dbg-inputs{display:flex;gap:6px;align-items:center;flex-wrap:wrap}\
  .g73dbg-logs textarea{width:100%;height:180px;background:transparent;color:#dbe8ff;border:none;outline:none;resize:vertical;font:11px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}\
  @keyframes g73dbgMark{0%{opacity:.0;transform:scale(.98)}8%{opacity:1}100%{opacity:0;transform:scale(1.02)}}\
  @media (min-width:600px){.g73dbg-panel{bottom:76px}}';
  document.head.appendChild(style);

  // ---- Panel + FAB (created BEFORE logging) ----
  var panel = document.createElement('section');
  panel.className = 'g73dbg-panel';
  panel.innerHTML = '\
    <div class="g73dbg-row g73dbg-handle">\
      <div style="display:flex;gap:8px;align-items:center;">\
        <strong>G73 Debugger</strong>\
        <small class="g73dbg-scans" style="opacity:.85"></small>\
      </div>\
      <div style="display:flex;gap:6px;">\
        <button class="g73dbg-btn" data-act="hide" aria-label="Close debugger">Close</button>\
      </div>\
    </div>\
    <div class="g73dbg-row">\
      <div class="g73dbg-inputs">\
        <span>FPS:</span><span class="g73dbg-chip" data-k="fps">–</span>\
        <span>Jank:</span><span class="g73dbg-chip" data-k="rafJank">–</span>\
        <span>Long:</span><span class="g73dbg-chip" data-k="lt">0</span>\
        <span>CLS:</span><span class="g73dbg-chip" data-k="ls">0</span>\
        <span>IMG:</span><span class="g73dbg-chip" data-k="img">0</span>\
        <span>AUD:</span><span class="g73dbg-chip" data-k="aud">0</span>\
      </div>\
    </div>\
    <div class="g73dbg-row">\
      <span>Current Song:</span><span class="g73dbg-chip" data-k="song">–</span>\
      <span>Rows:</span><span class="g73dbg-chip" data-k="rows">–</span>\
    </div>\
    <div class="g73dbg-logs"><pre></pre></div>\
    <div class="g73dbg-row g73dbg-controls">\
      <button class="g73dbg-btn" data-act="scan">Scan</button>\
      <button class="g73dbg-btn" data-act="markplay">Mark Playing</button>\
      <button class="g73dbg-btn" data-act="copy">Copy Log</button>\
      <button class="g73dbg-btn" data-act="select">Select All</button>\
      <button class="g73dbg-btn" data-act="clear">Clear</button>\
    </div>';
  document.body.appendChild(panel);

  var fab = document.createElement('button');
  fab.className = 'g73dbg-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label','Open debugger');
  fab.textContent = '🐞';
  document.body.appendChild(fab);

  function openPanel(){ panel.removeAttribute('hidden'); fab.setAttribute('hidden',''); if (G.renderPanel) G.renderPanel(); }
  function closePanel(){ panel.setAttribute('hidden',''); fab.removeAttribute('hidden'); }

  // ---- Log buffer (no modern syntax) ----
  var LOG_MAX = 3000;
  var logBuf = [];
  var t0 = (performance && performance.timeOrigin) || Date.now();
  function _now(){ return (performance && performance.now) ? performance.now() : (Date.now() - t0); }
  function logsText(){
    if (!logBuf.length) return '(no recent logs)';
    var out = [];
    for (var i=0;i<logBuf.length;i++){
      var l = logBuf[i];
      var line = (''+l.t).padStart ? (''+l.t).padStart(7,' ') : l.t;
      var type = (l.type && l.type.padEnd) ? l.type.padEnd(10,' ') : l.type;
      out.push(line + 'ms  ' + type + '  ' + l.msg + (l.data ? ('  ' + JSON.stringify(l.data)) : ''));
    }
    return out.join('\n');
  }

  var G = {
    cfg: {
      startOpen: /[?&]debug(=1)?/.test(location.search),
      mirrorConsole: false,
      jankBudgetMs: 16.7,
      highlightDuration: 900,
      rowScanInterval: 1200
    },
    stats: { fps: 0, rafJankPct: 0, longTasks: 0, layoutShifts: 0, imagesSlow: 0, audioSlow: 0 },
    mark: function(el, color){
      if(!el) return; color = color || '#00d4ff';
      var r = el.getBoundingClientRect();
      var m = document.createElement('div'); m.className='g73dbg-mark';
      m.style.position='fixed'; m.style.left=r.left+'px'; m.style.top=r.top+'px';
      m.style.width=r.width+'px'; m.style.height=r.height+'px';
      m.style.border='2px solid '+color; m.style.borderRadius='12px';
      m.style.pointerEvents='none'; m.style.zIndex='2147483647'; m.style.boxShadow='0 0 12px '+color;
      document.body.appendChild(m); setTimeout(function(){ try{ m.parentNode.removeChild(m); }catch(e){} }, G.cfg.highlightDuration);
    }
  };

  function log(type, msg, data){
    var entry = { t: +_now().toFixed ? +_now().toFixed(2) : Math.round(_now()), type: type, msg: msg, data: data };
    logBuf.push(entry); if (logBuf.length > LOG_MAX) logBuf.shift();
    if (G.cfg.mirrorConsole && window.console && console.debug) console.debug('[G73DBG]', type, msg, data || '');
    // only render if panel is visible
    if (!panel.hasAttribute('hidden') && G.renderPanel) G.renderPanel();
  }

  // ---- Open/close ----
  if (!G.cfg.startOpen) closePanel();
  fab.addEventListener('click', openPanel, false);

  // ---- Drag (mobile) ----
  (function(){
    var sx=0, sy=0, ox=0, oy=0, down=false;
    var handle = panel.querySelector('.g73dbg-handle');
    function start(e){ down=true; var p=e.touches?e.touches[0]:e; sx=p.clientX; sy=p.clientY; var r=panel.getBoundingClientRect(); ox=r.left; oy=r.top; e.preventDefault(); }
    function move(e){ if(!down) return; var p=e.touches?e.touches[0]:e; var dx=p.clientX-sx, dy=p.clientY-sy; panel.style.right='auto'; panel.style.left=(ox+dx)+'px'; panel.style.top=(oy+dy)+'px'; panel.style.bottom='auto'; }
    function end(){ down=false; }
    handle.addEventListener('pointerdown', start, false);
    window.addEventListener('pointermove', move, false);
    window.addEventListener('pointerup', end, false);
    handle.addEventListener('touchstart', start, false);
    window.addEventListener('touchmove', move, false);
    window.addEventListener('touchend', end, false);
  })();

  // ---- Panel actions ----
  function renderLogs(){ var pre = panel.querySelector('.g73dbg-logs pre'); if (pre) pre.textContent = logsText(); }
  function toTextarea(text, autoSelect){
    var box = panel.querySelector('.g73dbg-logs'); if (!box) return;
    var pre = box.querySelector('pre');
    var ta = document.createElement('textarea'); ta.value = text;
    if (pre) box.replaceChild(ta, pre); else box.appendChild(ta);
    if (autoSelect){ try{ ta.focus(); ta.select(); }catch(e){} }
    ta.addEventListener('blur', function(){
      var preNew = document.createElement('pre'); preNew.textContent = ta.value;
      try{ box.replaceChild(preNew, ta); }catch(e){}
    }, {once:true});
  }
  function toast(msg){
    var n = document.getElementById('g73dbg-toast');
    if(!n){
      n=document.createElement('div'); n.id='g73dbg-toast';
      n.style.position='fixed'; n.style.left='50%'; n.style.bottom='84px'; n.style.transform='translateX(-50%)';
      n.style.background='rgba(0,0,0,.8)'; n.style.color='#fff'; n.style.padding='8px 12px'; n.style.borderRadius='10px';
      n.style.zIndex='2147483647'; n.style.font='12px system-ui'; n.style.boxShadow='0 4px 16px rgba(0,0,0,.5)';
      document.body.appendChild(n);
    }
    n.textContent = msg; n.style.opacity='1'; clearTimeout(n._t);
    n._t = setTimeout(function(){ n.style.opacity='0'; }, 1400);
  }
  function copyLogs(){
    var txt = logsText();
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(function(){ toast('Log copied to clipboard'); }, function(){ toTextarea(txt, true); toast('Select-all shown; copy manually'); });
    } else {
      toTextarea(txt, true); toast('Select-all shown; copy manually');
    }
  }
  function selectAllLogs(){ toTextarea(logsText(), true); }

  panel.addEventListener('click', function(e){
    var t = e.target || e.srcElement; if (!t || !t.dataset) return;
    var act = t.dataset.act; if(!act) return;
    if (act==='hide'){ closePanel(); log('ui','panel hidden'); }
    if (act==='scan'){ scanList(true); }
    if (act==='markplay'){ markPlayingRow(); }
    if (act==='clear'){ logBuf.length=0; renderLogs(); }
    if (act==='select'){ selectAllLogs(); }
    if (act==='copy'){ copyLogs(); }
  }, false);

  // ---- Render chips ----
  function setChip(k, val, mood){
    var el = panel.querySelector('[data-k="'+k+'"]'); if(!el) return;
    el.textContent = val;
    el.classList.remove('g73dbg-bad','g73dbg-warn','g73dbg-good');
    if (mood) el.classList.add(mood);
  }
  function renderPanel(){
    setChip('fps', Math.round(G.stats.fps) || '–', G.stats.fps<45?'g73dbg-warn':'g73dbg-good');
    var j = (G.stats.rafJankPct*100)|0; setChip('rafJank', j+'%', j>35?'g73dbg-bad':(j>18?'g73dbg-warn':'g73dbg-good'));
    setChip('lt', G.stats.longTasks || 0, G.stats.longTasks>0?'g73dbg-warn':'');
    setChip('ls', G.stats.layoutShifts || 0, G.stats.layoutShifts>0?'g73dbg-warn':'');
    setChip('img', G.stats.imagesSlow || 0, G.stats.imagesSlow>0?'g73dbg-warn':'');
    setChip('aud', G.stats.audioSlow || 0, G.stats.audioSlow>0?'g73dbg-warn':'');
    var id = window.currentSongId || '–'; setChip('song', (''+id).slice(-26));
    var ul = document.querySelector('.music-list ul'); setChip('rows', ul?ul.children.length:0);
    var scans = panel.querySelector('.g73dbg-scans');
    if (scans) scans.textContent = 'FPS:'+(Math.round(G.stats.fps)||0)+'  Jank:'+(((G.stats.rafJankPct*100)|0))+'%';
    renderLogs();
  }
  G.renderPanel = renderPanel;

  // ---- Metrics ----
  (function fpsMeter(){
    var frames=0, last=performance.now(), lastTick=performance.now(), jankFrames=0;
    function tick(ts){
      frames++; var dt = ts - lastTick; lastTick = ts;
      if (dt > G.cfg.jankBudgetMs * 2) jankFrames++;
      if (ts - last >= 1000){
        G.stats.fps = frames * 1000 / (ts - last);
        G.stats.rafJankPct = frames ? (jankFrames / frames) : 0;
        frames=0; jankFrames=0; last=ts; if (G.renderPanel) G.renderPanel();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  try{
    if (window.PerformanceObserver){
      new PerformanceObserver(function(list){
        var arr = list.getEntries(); for (var i=0;i<arr.length;i++){
          var e = arr[i]; G.stats.longTasks++; log('longtask','Long task',{dur:+e.duration.toFixed(1)});
        }
        if (G.renderPanel) G.renderPanel();
      }).observe({entryTypes:['longtask']});
    }
  }catch(e){}

  try{
    if (window.PerformanceObserver){
      new PerformanceObserver(function(list){
        var arr = list.getEntries(); for (var i=0;i<arr.length;i++){
          var e = arr[i];
          if (!e.hadRecentInput){ G.stats.layoutShifts++; log('layout-shift','CLS fragment',{value:+e.value.toFixed(4)}); }
        }
        if (G.renderPanel) G.renderPanel();
      }).observe({type:'layout-shift', buffered:true});
    }
  }catch(e){}

  try{
    if (window.PerformanceObserver){
      var SLOW_IMG = 600, SLOW_AUD = 1200;
      new PerformanceObserver(function(list){
        var arr = list.getEntries(); for (var i=0;i<arr.length;i++){
          var e = arr[i];
          if (e.initiatorType === 'img' && e.duration > SLOW_IMG){ G.stats.imagesSlow++; log('res-img','Slow image',{name:e.name,dur:+e.duration.toFixed(1)}); }
          if ((e.initiatorType === 'xmlhttprequest' || e.initiatorType==='fetch') && /\/songs?\//.test(e.name) && e.duration > SLOW_AUD){ G.stats.audioSlow++; log('res-aud','Slow audio',{name:e.name,dur:+e.duration.toFixed(1)}); }
        }
        if (G.renderPanel) G.renderPanel();
      }).observe({entryTypes:['resource']});
    }
  }catch(e){}

  // ---- v11 hooks ----
  function wrap(obj, name){
    if (!obj || typeof obj[name] !== 'function' || obj[name].__g73wrapped) return;
    var orig = obj[name];
    var w = function(){ var args = Array.prototype.slice.call(arguments); var ret = orig.apply(this, args); log('call', name, {args:args}); return ret; };
    w.__g73wrapped = true; obj[name] = w;
  }
  function markPlayingRow(){
    var id = window.currentSongId;
    if (!id) return log('mark','no currentSongId');
    var li = document.querySelector('.music-list ul > li[data-id="'+CSS.escape(id)+'"]');
    if (li) G.mark(li, '#7affb3');
  }
  window.G73DBG = { log: log, open: openPanel, close: closePanel, markPlayingRow: markPlayingRow };

  function tryWrap(){ wrap(window, 'g73RebuildMusicListUI'); wrap(window, 'playIndex'); wrap(window, 'hardPauseAndUnselect'); }
  tryWrap(); setTimeout(tryWrap, 1000);

  // ---- Scanners ----
  function visible(el){ if(!el) return false; var r=el.getBoundingClientRect(); return r.width>1 && r.height>1 && r.bottom>=0 && r.right>=0 && r.top<=innerHeight && r.left<=innerWidth; }
  function colorIsInvisible(el){
    var cs = getComputedStyle(el);
    var c = cs.color || '';
    var wtf = cs.webkitTextFillColor || '';
    return (wtf && /rgba?\(0,\s*0,\s*0,\s*0\)/.test(wtf)) || /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(c);
  }
  function scanList(verbose){
    var ul = document.querySelector('.music-list ul'); if (!ul){ log('scan','no UL'); return; }
    var rows = [].slice.call(ul.children);
    var missingText=0, missingArtist=0, offscreenCovers=0;
    for (var i=0;i<rows.length;i++){
      var li = rows[i];
      var title = li.querySelector('.g73-title');
      var artist= li.querySelector('.g73-artist');
      var cover = li.querySelector('.g73-thumb');
      if (title && colorIsInvisible(title)){ missingText++; if (verbose) G.mark(title, '#ff8aa1'); }
      if (artist && colorIsInvisible(artist)){ missingArtist++; if (verbose) G.mark(artist, '#ff8aa1'); }
      if (cover && visible(li) && getComputedStyle(cover).backgroundImage === 'none'){ offscreenCovers++; if (verbose) G.mark(cover, '#ffd27a'); }
    }
    log('scan','list state', {rows:rows.length, missingText:missingText, missingArtist:missingArtist, offscreenCovers:offscreenCovers});
    if (G.renderPanel) G.renderPanel();
  }
  setInterval(function(){ scanList(false); }, 1200);

  try{
    var mo = new MutationObserver(function(muts){
      var added=0, attr=0;
      for (var i=0;i<muts.length;i++){
        var m = muts[i];
        if (m.type==='childList') added += (m.addedNodes ? m.addedNodes.length : 0);
        if (m.type==='attributes') attr++;
      }
      if (added || attr){ log('mut','list changed',{added:added,attr:attr}); if (G.renderPanel) G.renderPanel(); }
    });
    function hook(){
      var ul = document.querySelector('.music-list ul');
      if (!ul) return;
      mo.observe(ul, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style','src']});
      scanList(false);
    }
    hook(); setInterval(hook, 1500);
  }catch(e){}

  (function audioWatch(){
    var a = document.getElementById('main-audio'); if (!a) return;
    ['play','playing','pause','ended','timeupdate','loadedmetadata','seeking','seeked','stalled','waiting','canplay'].forEach(function(ev){
      a.addEventListener(ev, function(){
        log('audio', ev, {t: (a.currentTime|0), src: a.currentSrc||''}); 
        if (ev==='playing'){ markPlayingRow(); }
        if (G.renderPanel) G.renderPanel();
      }, false);
    });
  })();

  // Passive-ish nudge—older browsers ignore the flag, but harmless
  try{
    window.addEventListener('scroll', function(){}, false);
    window.addEventListener('touchstart', function(){}, false);
    window.addEventListener('touchmove', function(){}, false);
  }catch(e){}

  // Pointer “repaint nudge” for transparent text on first touch
  document.addEventListener('pointerdown', function(){
    var ul = document.querySelector('.music-list ul'); if (!ul) return;
    var nodes = ul.querySelectorAll('.g73-title,.g73-artist');
    for (var i=0;i<nodes.length;i++){
      var el = nodes[i], cs = getComputedStyle(el), wtf = cs.webkitTextFillColor;
      if (wtf && /rgba?\(0,\s*0,\s*0,\s*0\)/.test(wtf)){
        el.style.transform = 'translateZ(0)'; (function(e){ requestAnimationFrame(function(){ e.style.transform = ''; }); })(el);
        log('fix','nudged text repaint', {el: el.className});
      }
    }
  }, false);

  // Prewarm covers near viewport
  (function(){
    var ul = document.querySelector('.music-list ul'); if (!ul || !('IntersectionObserver' in window)) return;
    var root = (function(){ var s = ul.closest ? ul.closest('.g73-scroll') : null; return s || null; })();
    var io = new IntersectionObserver(function(ents){
      for (var i=0;i<ents.length;i++){
        var ent = ents[i];
        if (ent.isIntersecting || ent.intersectionRatio > 0){
          var li = ent.target;
          var th = li.querySelector('.g73-thumb');
          var bg = th && getComputedStyle(th).backgroundImage;
          if (th && (!bg || bg==='none')){
            th.style.willChange='transform';
            (function(e){ requestAnimationFrame(function(){ e.style.willChange='auto'; }); })(th);
          }
          io.unobserve(li);
        }
      }
    }, {root: root, rootMargin: '160px 0px 240px 0px', threshold: 0});
    var kids = ul.children; for (var k=0;k<kids.length;k++) io.observe(kids[k]);
  })();

  // Hotkey toggle (desktop)
  window.addEventListener('keydown', function(e){
    var key = e.key || ''; var mod = (e.ctrlKey||e.metaKey) && e.altKey && (key==='d' || key==='D');
    if (mod){ if (panel.hasAttribute('hidden')) openPanel(); else closePanel(); }
  }, false);

  // Safety
  window.addEventListener('error', function(e){
    try{
      toast('G73 Debugger error (see console)');
      if (window.console && console.error) console.error('[G73DBG] window.onerror', e.error || e.message || e);
    }catch(_e){}
  }, false);

  // Hi!
  log('init','Debugger ready (compat)', {hint:'Tap 🐞 to open; Copy Log to clipboard'});
  if (G.renderPanel) G.renderPanel();
})();