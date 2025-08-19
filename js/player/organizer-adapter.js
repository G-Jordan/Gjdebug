// js/player/organizer-adapter.js
(function(){
  if (window.__g73OrganizerAdapterV13c) return;
  window.__g73OrganizerAdapterV13c = true;

  /* ================= CSS ================= */
  const css = `
  .music-list{
    --list-bg:        var(--ctl-list-bg,    var(--ctl-bg, rgba(13,17,23,.72)));
    --list-stroke:    var(--ctl-list-border,var(--ctl-border, rgba(255,255,255,.12)));
    --list-ring:      var(--ctl-list-ring,  var(--ctl-ring, rgba(120,200,255,.45)));
    --list-fill:      var(--ctl-list-fill,  var(--prog-fill, linear-gradient(90deg,#5ad1ff,#a97aff)));
    --list-text:      var(--ctl-list-text,  inherit);
    --list-sub:       var(--ctl-list-sub,   inherit);
    --list-shadow:    0 14px 36px rgba(0,0,0,.50);
    --list-max-h:     56vh;

    --list-pp-inner:  var(--ctl-pp-inner, var(--pp-inner, linear-gradient(90deg,#5ad1ff,#a97aff)));
    --list-pp-outer:  var(--ctl-pp-outer, var(--pp-outer, linear-gradient(135deg,#232a3a,#151820)));
    --list-pp-glow:   var(--ctl-pp-glow,  var(--pp-glow,  rgba(95,160,255,.45)));
    --list-pp-icon:   var(--ctl-pp-icon,  var(--pp-icon-color,#ffffff));
  }

  .music-list .header{
    position: sticky; top:0; z-index:3;
    background: color-mix(in srgb, var(--list-bg) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom:1px solid color-mix(in srgb, var(--list-stroke) 70%, transparent);
  }

  .music-list .g73-shell{
    position:relative; border-radius:18px; backdrop-filter: blur(10px);
    background: linear-gradient(180deg,
      color-mix(in srgb, var(--list-bg) 78%, transparent),
      color-mix(in srgb, var(--list-bg) 52%, transparent));
    box-shadow: var(--list-shadow);
    outline:1px solid color-mix(in srgb, var(--list-stroke) 65%, transparent);
  }
  .music-list .g73-shell::before{
    content:""; position:absolute; inset:0; border-radius:18px; padding:1px;
    background: var(--list-fill);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none;
  }
  .music-list .g73-shell::after{
    content:""; position:absolute; inset:-12px; border-radius:22px;
    background: radial-gradient(60% 60% at 50% 0%,
                color-mix(in srgb, var(--list-ring) 45%, transparent) 0%,
                transparent 70%);
    filter: blur(18px); opacity:.45; pointer-events:none;
    animation: g73GlowList 6s ease-in-out infinite;
  }
  @keyframes g73GlowList{
    0%,100%{ transform: translateY(0) scale(0.98); opacity:.38; }
    50%    { transform: translateY(2px) scale(1.02); opacity:.55; }
  }

  .music-list .g73-scroll{
    max-height: var(--list-max-h, 56vh);
    overflow-y:auto; overscroll-behavior:contain; scrollbar-gutter:stable;
    padding:12px;
  }
  .music-list .g73-scroll::-webkit-scrollbar{ width:10px; }
  .music-list .g73-scroll::-webkit-scrollbar-thumb{ background: var(--list-fill); border-radius:999px; }
  .music-list .g73-scroll{ scrollbar-color: color-mix(in srgb, var(--list-stroke) 50%, transparent) transparent; }

  .music-list .g73-scroll > ul.g73-adapted{ list-style:none; margin:0; padding:0; }

  .music-list .g73-scroll > ul.g73-adapted > li{
    position:relative;
    display:flex; align-items:center; gap:12px;
    padding:12px; margin:8px 0; border-radius:14px;
    border:1px solid color-mix(in srgb, var(--list-stroke) 85%, transparent);
    background: linear-gradient(180deg,
      color-mix(in srgb, var(--list-bg) 82%, transparent),
      color-mix(in srgb, var(--list-bg) 64%, transparent));
    outline:none; color: var(--list-text);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--list-stroke) 35%, transparent);
    transition: transform .14s, box-shadow .14s, border-color .14s, background .14s;
    content-visibility:auto; contain-intrinsic-size: 70px;
  }
  @media (hover: hover){
    .music-list .g73-scroll > ul.g73-adapted > li:hover{
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--list-ring) 50%, var(--list-stroke));
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--list-ring) 30%, var(--list-stroke)),
                  0 6px 18px rgba(0,0,0,.35);
    }
  }

  .music-list .g73-scroll > ul.g73-adapted > li.active,
  .music-list .g73-scroll > ul.g73-adapted > li.playing{
    border-color: color-mix(in srgb, var(--list-ring) 70%, var(--list-stroke));
    background: linear-gradient(180deg,
      color-mix(in srgb, var(--list-bg) 90%, transparent),
      color-mix(in srgb, var(--list-bg) 72%, transparent));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--list-ring) 50%, var(--list-stroke)),
                0 10px 24px rgba(0,0,0,.45);
  }
  .music-list .g73-scroll > ul.g73-adapted > li.playing::before{
    content:""; position:absolute; inset:-2px; border-radius:16px; z-index:0;
    background: var(--list-fill); opacity:.25; filter: blur(14px); pointer-events:none;
  }
  .music-list li.playing .eq,
  .music-list li .g73-play-btn[aria-pressed="true"] .eq { opacity:1; transform:scale(1); }

  .g73-row-progress{
    position:absolute; left:10px; right:10px; bottom:6px; height:3px; border-radius:999px;
    background: color-mix(in srgb, var(--list-stroke) 35%, transparent);
    overflow:hidden; pointer-events:none; z-index:2; opacity:.85;
  }
  .g73-row-progress .g73-row-fill{
    height:100%; width:0%; border-radius:inherit;
    background: var(--list-fill);
    transform-origin:left center;
    transition: width .08s linear;
  }

  .g73-thumb{ width:46px; height:46px; flex:0 0 46px; border-radius:12px;
    background:#0a0e12 center/cover no-repeat;
    border:1px solid color-mix(in srgb, var(--list-stroke) 70%, rgba(255,255,255,.12));
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.05);
  }

  .g73-meta{ min-width:0; display:grid; gap:2px; flex:1 1 auto; z-index:1; }
  .g73-title.track-title{ font:inherit; font-weight:800; letter-spacing:.01em; overflow-wrap:anywhere; }
  .g73-artist.track-artist{ font:inherit; opacity:.95; overflow-wrap:anywhere; }
  .audio-duration.track-duration{ font:inherit; opacity:.95; min-width:48px; text-align:right; z-index:1; }

  .g73-play-btn{
    position:relative; z-index:1; width:42px; height:42px; border-radius:50%;
    border:none; cursor:pointer; flex:0 0 42px;
    display:grid; place-items:center; background: var(--list-pp-outer);
    box-shadow: 0 0 5px var(--list-pp-glow);
    transition: transform .12s, box-shadow .12s, filter .12s;
    outline:1px solid color-mix(in srgb, var(--list-stroke) 60%, transparent);
  }
  .g73-play-btn::before{
    content:""; position:absolute; inset:0; margin:auto; width:34px; height:34px; border-radius:50%;
    background: var(--list-pp-inner); z-index:0;
  }
  .g73-play-btn .material-icons{ position:relative; z-index:1; font-size:22px; line-height:1; color: var(--list-pp-icon); -webkit-text-fill-color: var(--list-pp-icon); }
  @media (hover: hover){ .g73-play-btn:hover{ transform: translateY(-1px); box-shadow: 0 8px 18px rgba(0,0,0,.45); } }
  `;
  document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));

  /* ============== Helpers & State ============== */
  const UL_SEL = '.music-list ul';
  const $ul         = () => document.querySelector(UL_SEL);
  const $listRoot   = () => document.querySelector('.music-list');
  const $audio      = () => document.getElementById('main-audio');

  let builtOnce = false;
  let rafTick = 0;
  let boundAudio = null;

  const isUrl = s => typeof s === 'string' && /^https?:\/\//i.test(s);
  const hasExt = s => typeof s === 'string' && /\.[a-z0-9]{2,5}(\?.*)?$/i.test(s);
  const resolveCoverKey = it => it?.cover || it?.img || it?.src || null;
  const resolveCoverUrl = k => !k ? '' : (isUrl(k) || hasExt(k) ? k : `images/${k}.jpg`);
  const audioSrc = k => !k ? '' : (isUrl(k) || hasExt(k) ? k : `songs/${k}.mp3`);
  const getId = it => it?.src || it?.img || `${it?.name||''}-${it?.artist||''}`;
  const fmtTime = s => (!isFinite(s)||s<=0) ? '–:–' : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  const isActuallyPlaying = (audio)=>{
    if (!audio) return false;
    return !audio.paused && !audio.ended && (audio.currentTime > 0 || audio.readyState >= 2);
  };

  /* filename helpers */
  function filename(url){
    try{
      const u = new URL(url, location.href);
      const p = u.pathname; const f = p.substring(p.lastIndexOf('/')+1);
      return f.replace(/\.[a-z0-9]+$/i,'');
    }catch{
      return String(url||'').split('/').pop().replace(/\.[a-z0-9]+$/i,'');
    }
  }
  function sameFile(a, b){ return filename(a) === filename(b); }

  function getCurrentIndexFromAudio(){
    const a = $audio(); if (!a) return -1;
    const list = window.allMusic || [];
    const cur = filename(a.currentSrc || a.src || '');
    if (!cur) return -1;
    return list.findIndex(it => sameFile(audioSrc(it?.src), cur));
  }

  /* NEW: robust “is this row the current track?” */
  function rowIsCurrent(i){
    const ul = $ul(); const a = $audio();
    if (!ul || !a) return false;
    const li = ul.children[i]; if (!li) return false;

    // 1) id match with global
    if (window.currentSongId && li.dataset.id === window.currentSongId) return true;

    // 2) filename match between main audio and the row’s own <audio> src
    const rowMetaAudio = li.querySelector('audio.g73-meta-audio');
    const rowSrc = rowMetaAudio?.getAttribute('src') || '';
    const mainSrc = a.currentSrc || a.src || '';
    return sameFile(rowSrc, mainSrc);
  }

  /* ======== rAF-coalesced UI ======== */
  function scheduleUI(fn){
    if (rafTick) return;
    rafTick = requestAnimationFrame(()=>{ rafTick=0; fn(); });
  }

  /* ======== Theme adoption (robust to swaps) ======== */
  function adoptCtlThemeToList(){
    const controls = document.querySelector('.controls');
    const root = $listRoot();
    if (!controls || !root) return;
    const cs = getComputedStyle(controls);
    const picks = {
      '--ctl-list-bg':     cs.getPropertyValue('--ctl-bg').trim(),
      '--ctl-list-border': cs.getPropertyValue('--ctl-border').trim(),
      '--ctl-list-ring':   cs.getPropertyValue('--ctl-ring').trim(),
      '--ctl-list-fill':   cs.getPropertyValue('--prog-fill').trim(),
      '--ctl-pp-inner':    cs.getPropertyValue('--pp-inner').trim(),
      '--ctl-pp-outer':    cs.getPropertyValue('--pp-outer').trim(),
      '--ctl-pp-glow':     cs.getPropertyValue('--pp-glow').trim(),
      '--ctl-pp-icon':     cs.getPropertyValue('--pp-icon-color').trim()
    };
    Object.entries(picks).forEach(([k,v])=>{ if (v) root.style.setProperty(k, v); });
  }
  document.addEventListener('DOMContentLoaded', adoptCtlThemeToList);
  window.addEventListener('player:controls-theme', adoptCtlThemeToList, { passive:true });

  // Re-attach when controls/audio nodes are swapped
  let lastControls = null;
  const docObs = new MutationObserver(() => {
    const controls = document.querySelector('.controls');
    if (controls && controls !== lastControls){
      lastControls = controls;
      adoptCtlThemeToList();
      new MutationObserver(adoptCtlThemeToList)
        .observe(controls, {attributes:true, attributeFilter:['style','class']});
    }
    const a = $audio();
    if (a && a !== boundAudio) attachAudioListeners();
  });
  docObs.observe(document.documentElement, {subtree:true, childList:true});

  /* ======== Stable shell for CLS ======== */
  function ensureShell(){
    const listRoot = $listRoot();
    const ul = $ul();
    if (!listRoot || !ul || ul.closest('.g73-shell')) return;

    const rect = ul.getBoundingClientRect();
    const shell = document.createElement('div'); shell.className = 'g73-shell';
    const scroll = document.createElement('div'); scroll.className = 'g73-scroll';
    shell.style.minHeight = rect.height + 'px';
    ul.parentNode.insertBefore(shell, ul);
    shell.appendChild(scroll);
    scroll.appendChild(ul);
    requestAnimationFrame(()=>{ shell.style.minHeight = ''; });
  }

  function clearActive(){
    const ul = $ul(); if (!ul) return;
    [...ul.children].forEach(li=>{
      li.classList.remove('active','playing','pending');
      const fill = li.querySelector('.g73-row-fill'); if (fill) fill.style.width = '0%';
      const icon = li.querySelector('.g73-play-btn .material-icons');
      const btn  = li.querySelector('.g73-play-btn');
      if (icon) icon.textContent = 'play_arrow';
      if (btn)  btn.setAttribute('aria-pressed','false');
    });
  }

  function markActive(index, playing){
    const ul = $ul(); if (!ul) return;
    [...ul.children].forEach((li, i)=>{
      const isCurrent = i === index;
      li.classList.toggle('active',  isCurrent);
      li.classList.toggle('playing', isCurrent && !!playing);
      if (!isCurrent) li.classList.remove('pending');
      const icon = li.querySelector('.g73-play-btn .material-icons');
      const btn  = li.querySelector('.g73-play-btn');
      if (icon && btn){
        if (isCurrent){
          icon.textContent = playing ? 'pause' : 'play_arrow';
          btn.setAttribute('aria-pressed', String(!!playing));
        }else{
          icon.textContent = 'play_arrow';
          btn.setAttribute('aria-pressed','false');
        }
      }
    });
  }

  function updateProgressUI(){
    const ul = $ul(); if (!ul) return;
    const a = $audio(); if (!a) return;
    const curIdx = getCurrentIndexFromAudio();
    const dur  = Math.max(0, a.duration || 0);
    const cur  = Math.max(0, a.currentTime || 0);
    const pct  = (dur > 0) ? Math.max(0, Math.min(100, (cur / dur) * 100)) : 0;

    [...ul.children].forEach((li, i)=>{
      const fill = li.querySelector('.g73-row-fill');
      if (!fill) return;
      fill.style.width = (i === curIdx) ? (pct + '%') : '0%';
    });
  }

  function refreshRowUI(){
    const a = $audio();
    const playing = isActuallyPlaying(a);
    const idx = getCurrentIndexFromAudio();
    if (idx >= 0) markActive(idx, playing);
    updateProgressUI();
  }

  /* ======== Audio ↔ row sync ======== */
  function syncFromAudio(){
    const a = $audio(); if (!a) return;
    const idx = getCurrentIndexFromAudio();
    if (idx >= 0){
      const item = (window.allMusic || [])[idx];
      const id = item ? getId(item) : '';
      if (id && window.currentSongId !== id) window.currentSongId = id;
      markActive(idx, isActuallyPlaying(a));
    } else {
      clearActive();
    }
    scheduleUI(refreshRowUI);
  }

  /* ======== Robust audio binding (handles node swaps) ======== */
  function attachAudioListeners(){
    const a = $audio();
    if (!a) return;
    if (boundAudio === a) return;

    if (boundAudio){
      try { boundAudio.__g73Handlers?.forEach(([ev,fn]) => boundAudio.removeEventListener(ev, fn)); } catch {}
    }

    const H = [];
    const on = (ev, fn) => { a.addEventListener(ev, fn, {passive:true}); H.push([ev,fn]); };

    const sync = ()=> syncFromAudio();
    ['play','playing','pause','ended','loadedmetadata','durationchange','seeking','seeked','ratechange','stalled','emptied','abort']
      .forEach(ev=> on(ev, sync));
    on('timeupdate', ()=> scheduleUI(updateProgressUI));

    a.__g73Handlers = H;
    boundAudio = a;

    if (a.currentSrc || a.src) syncFromAudio();
  }

  /* ======== External API helpers + normalized toggle ======== */
  function callExternalForIndex(i){
    const oneBased = i + 1;
    try { if (typeof window.musicIndex !== 'undefined') window.musicIndex = oneBased; } catch {}
    try {
      if (typeof window.loadMusic === 'function') window.loadMusic(oneBased);
      else if (typeof window.loadTrack === 'function') window.loadTrack(i);
      else if (typeof window.setMusic  === 'function') window.setMusic(oneBased);
      if (typeof window.playMusic === 'function') window.playMusic(i);
      if (typeof window.selectSong === 'function') window.selectSong(i);
      if (typeof window.startPlaying === 'function') window.startPlaying(i);
    } catch(e){ console.warn('[OrganizerAdapter] External API error', e); }
  }

  function forceAudioToIndex(i){
    const a = $audio(); if (!a) return;
    const list = window.allMusic || [];
    const it = list[i]; if (!it) return;
    const want = audioSrc(it.src);
    if (!sameFile(a.currentSrc || a.src || '', want)) {
      a.src = want;
    }
  }

  // FIXED: pause/play always works, even if Organizer changed indices or another UI selected the song
  function togglePlayPauseForIndex(i){
    const ul = $ul(); if (!ul) return;
    const a = $audio(); if (!a) return;
    const li = ul.children[i]; if (!li) return;

    const isCurrent = rowIsCurrent(i);
    const playing = isActuallyPlaying(a);

    if (isCurrent){
      // Just toggle the real audio element
      try { playing ? a.pause() : a.play(); } catch {}
      scheduleUI(refreshRowUI);
      return;
    }

    // Switch to this track, and play
    const item = (window.allMusic || [])[i];
    window.currentSongId = item ? getId(item) : '';
    li.classList.add('pending');
    markActive(i, true);
    scheduleUI(refreshRowUI);

    callExternalForIndex(i);
    forceAudioToIndex(i);
    a.play?.().catch(()=>{});
  }

  /* ======== Duration via hidden audio ======== */
  function wireDuration(li){
    const a = li.querySelector('audio.g73-meta-audio');
    const out = li.querySelector('.audio-duration');
    if (!a || !out) return;
    let done = false;
    const apply = () => {
      if (done) return;
      if (isFinite(a.duration) && a.duration > 0){
        const t = fmtTime(a.duration);
        out.textContent = t; out.setAttribute('t-duration', t);
        done = true;
      }
    };
    a.addEventListener('loadedmetadata', apply, {passive:true});
    a.addEventListener('durationchange', apply, {passive:true});
    a.preload = 'metadata';
    try { a.load(); } catch {}
    setTimeout(() => { if (!done) apply(); }, 1000);
  }

  /* ======== Lazy covers ======== */
  const io = new IntersectionObserver((entries)=>{
    for (const e of entries){
      if (e.isIntersecting){
        const el = e.target;
        const url = el.getAttribute('data-bg');
        if (url){ el.style.backgroundImage = `url("${url}")`; el.removeAttribute('data-bg'); }
        io.unobserve(el);
      }
    }
  }, {root: null, rootMargin: '200px 0px', threshold: 0.01});

  /* ================= BUILD ================= */
  function rebuild(){
    if (builtOnce) { scheduleUI(refreshRowUI); return; }
    adoptCtlThemeToList();
    ensureShell();

    const ul = $ul();
    if (!ul || !Array.isArray(window.allMusic)) return;

    ul.innerHTML = '';
    ul.classList.add('g73-adapted');

    window.allMusic.forEach((item, i) => {
      const li = document.createElement('li');
      li.dataset.id = getId(item);
      li.dataset.index = String(i);
      li.setAttribute('li-index', String(i + 1));
      li.setAttribute('role', 'button');
      li.setAttribute('tabindex', '0');

      const coverUrl = resolveCoverUrl(resolveCoverKey(item));
      const src = audioSrc(item?.src);

      li.innerHTML = `
        <div class="g73-thumb" aria-hidden="true" data-bg="${coverUrl}"></div>
        <div class="g73-meta">
          <div class="g73-title track-title"  title="${(item?.name||'').replace(/"/g,'&quot;')}">${item?.name || 'Untitled'}</div>
          <div class="g73-artist track-artist" title="${(item?.artist||'').replace(/"/g,'&quot;')}">${item?.artist || ''}</div>
        </div>
        <span class="audio-duration track-duration">–:–</span>
        <button class="g73-play-btn" type="button" aria-label="Play" aria-pressed="false">
          <i class="material-icons" aria-hidden="true">play_arrow</i>
        </button>
        <div class="g73-row-progress"><div class="g73-row-fill"></div></div>
        <audio class="g73-meta-audio" preload="metadata" src="${src}"></audio>
      `;

      wireDuration(li);

      const onRowActivate = ()=> togglePlayPauseForIndex(i);
      li.addEventListener('click', onRowActivate);
      li.querySelector('.g73-play-btn')?.addEventListener('click', (e)=>{ e.stopPropagation(); onRowActivate(); });
      li.addEventListener('keydown', (e) => { if (e.key==='Enter'||e.key===' '){ e.preventDefault(); onRowActivate(); }});

      ul.appendChild(li);

      const thumb = li.querySelector('.g73-thumb');
      if (thumb) io.observe(thumb);
    });

    builtOnce = true;
    attachAudioListeners();
    scheduleUI(refreshRowUI);
  }

  /* ======== Boot & resiliency ======== */
  function boot(){
    adoptCtlThemeToList();
    ensureShell();
    if (Array.isArray(window.allMusic) && window.allMusic.length) {
      rebuild();
    } else {
      let ticks = 0, max = 180;
      (function wait(){
        if (Array.isArray(window.allMusic) && window.allMusic.length) { rebuild(); return; }
        if (++ticks < max) requestAnimationFrame(wait);
      })();
    }
    attachAudioListeners();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Public helpers
  window.g73RebuildMusicListUI = rebuild;
  window.g73AdoptThemeNow     = adoptCtlThemeToList;
})();