// js/player/equalizer.js
// Full 10-band equalizer powered by Web Audio API.
// Exposes window.equalizerAPI for other parts of the app.

(function(){
  const audioEl = document.getElementById('main-audio');
  if (!audioEl) return;

  // UI elements
  const modal    = document.getElementById('eq-modal');
  const enableCb = document.getElementById('eq-enable');
  const bandsWrap= document.getElementById('eq-bands');
  const preamp   = document.getElementById('eq-preamp');
  const preampOut= document.getElementById('eq-preamp-out');
  const presetSel= document.getElementById('eq-preset');
  const saveBtn  = document.getElementById('eq-save-preset');
  const delBtn   = document.getElementById('eq-delete-preset');
  const resetBtn = document.getElementById('eq-reset');

  const STORE_KEY = 'eqSettings.v1';
  const PRESET_KEY= 'eqPresets.v1';

  // Frequencies (Hz) for a classic 10-band EQ
  const freqs = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

  // Built-in presets (dB values for each band)
  const BUILTINS = {
    'Flat':        [0,0,0,0,0,0,0,0,0,0],
    'Bass Boost':  [6,5,4,2,0,-1,-2,-3,-3,-3],
    'Treble Boost':[-3,-3,-2,-1,0,2,3,4,5,6],
    'Vocal':       [-2,-1,0,2,3,2,0,-1,-2,-2],
    'Rock':        [5,3,2,0,-1,1,3,4,4,5],
    'Pop':         [-1,2,3,4,2,-1,-1,1,2,3],
    'Hip-Hop':     [6,5,3,1,0,1,2,1,0,-1],
    'Loudness':    [4,2,0,-1,-2,0,2,3,4,5]
  };

  // Attempt to reuse a shared AudioContext if your visualizer exposed one
  let ctx = window.audioCtx || window.AudioContextInstance || null;
  if (!ctx) {
    const ACtx = window.AudioContext || window.webkitAudioContext;
    ctx = new ACtx();
    window.audioCtx = ctx;
  }

  // Create source + node chain
  // Guard against creating multiple MediaElementSources for the same element
  if (!audioEl._mediaSourceNode) {
    audioEl._mediaSourceNode = ctx.createMediaElementSource(audioEl);
  }
  const source = audioEl._mediaSourceNode;

  const preampGain = ctx.createGain();
  const filters = freqs.map((f)=> {
    const biq = ctx.createBiquadFilter();
    biq.type = 'peaking';
    biq.frequency.value = f;
    biq.Q.value = (f < 250 ? 1.0 : f < 2000 ? 1.1 : 1.2); // slightly wider in lows
    biq.gain.value = 0;
    return biq;
  });

  const outGain = ctx.createGain(); // handy for bypass
  outGain.gain.value = 1;

  // ----- Visualizer analyser helpers -----
  function getExistingAnalyser(){
    if (window.visualizerAPI?.getAnalyser) return window.visualizerAPI.getAnalyser();
    if (window.visualizerAnalyser) return window.visualizerAnalyser;
    return null;
  }
  function publishAnalyser(node){
    // Prefer explicit analyser sink if available
    if (window.visualizerAPI?.setAnalyser) window.visualizerAPI.setAnalyser(node);
    // Some visualizers just want a node to tap
    else if (window.visualizerAPI?.setAudioNode) window.visualizerAPI.setAudioNode(node);
    // Stash a global fallback so other code can find it
    window.visualizerAnalyser = node;
  }

  // Build chain so the visualizer still sees audio AFTER EQ:
  // source -> preamp -> f1..f10 -> analyser -> outGain -> destination
  function connectChain() {
    // Clean up what we own
    try { preampGain.disconnect(); } catch {}
    filters.forEach(n=>{ try{ n.disconnect(); } catch {} });
    try { outGain.disconnect(); } catch {}

    // Move the source to our preamp (detach any old connection)
    try { source.disconnect(); } catch {}
    source.connect(preampGain);

    let head = preampGain;
    filters.forEach(f => { head.connect(f); head = f; });

    // Use existing analyser if the visualizer already made one; otherwise create+publish
    let analyser = getExistingAnalyser();
    if (!analyser) {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      publishAnalyser(analyser);
    }

    head.connect(analyser);
    analyser.connect(outGain);
    outGain.connect(ctx.destination);

    // Nudge the visualizer in case it subscribes late or uses a different hook
    publishAnalyser(analyser);
  }
  connectChain();

  // Build sliders UI
  const sliders = [];
  bandsWrap.innerHTML = '';
  freqs.forEach((hz, idx)=>{
    const wrap = document.createElement('div');
    wrap.className = 'eq-band';
    const label = document.createElement('label');
    label.textContent = hz >= 1000 ? (hz/1000) + 'k' : String(hz);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = -12;
    input.max = 12;
    input.step = 0.1;
    input.value = 0;
    input.dataset.index = String(idx);

    const out = document.createElement('output');
    out.textContent = '0 dB';

    input.addEventListener('input', ()=>{
      const v = parseFloat(input.value);
      filters[idx].gain.value = v;
      out.textContent = (v>0?'+':'') + v.toFixed(1) + ' dB';
      persist();
    });

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(out);
    bandsWrap.appendChild(wrap);
    sliders.push({input, out});
  });

  // Preamp hook
  function setPreamp(db){
    preampGain.gain.value = Math.pow(10, db/20);
    preamp.value = db;
    preampOut.textContent = (db>0?'+':'') + db.toFixed(1) + ' dB';
  }
  preamp.addEventListener('input', ()=>{
    setPreamp(parseFloat(preamp.value));
    persist();
  });

  // Enable/bypass
  function setEnabled(on){
    enableCb.checked = !!on;
    // We keep outGain at unity; bypass by zeroing band gains
    filters.forEach((f, i)=>{
      const v = parseFloat(sliders[i].input.value);
      f.gain.value = on ? v : 0;
    });
    bandsWrap.classList.toggle('is-disabled', !on);
    persist();
  }
  enableCb.addEventListener('change', ()=>{
    setEnabled(enableCb.checked);
  });

  // Presets (built-in + custom saved)
  function loadCustomPresets(){
    try{
      const raw = localStorage.getItem(PRESET_KEY);
      return raw ? JSON.parse(raw) : {};
    }catch{ return {}; }
  }
  function saveCustomPresets(obj){
    try{ localStorage.setItem(PRESET_KEY, JSON.stringify(obj)); }catch{}
  }

  function refreshPresetOptions(selectedName){
    const customs = loadCustomPresets();
    const all = {...BUILTINS, ...customs};
    const keys = Object.keys(all);
    presetSel.innerHTML = '';
    keys.forEach(name=>{
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      presetSel.appendChild(opt);
    });
    if (selectedName && keys.includes(selectedName)) presetSel.value = selectedName;
  }

  function applyPresetByName(name){
    const customs = loadCustomPresets();
    const map = {...BUILTINS, ...customs};
    const arr = map[name] || BUILTINS['Flat'];
    sliders.forEach((s, i)=>{
      const val = arr[i] ?? 0;
      s.input.value = val;
      s.out.textContent = (val>0?'+':'') + Number(val).toFixed(1) + ' dB';
      filters[i].gain.value = enableCb.checked ? val : 0;
    });
    presetSel.value = name in map ? name : 'Flat';
    persist();
  }

  presetSel.addEventListener('change', ()=>{
    applyPresetByName(presetSel.value);
  });

  saveBtn.addEventListener('click', ()=>{
    const name = prompt('Preset name:');
    if (!name) return;
    const arr = sliders.map(s=> parseFloat(s.input.value));
    const customs = loadCustomPresets();
    customs[name] = arr;
    saveCustomPresets(customs);
    refreshPresetOptions(name);
  });

  delBtn.addEventListener('click', ()=>{
    const name = presetSel.value;
    if (BUILTINS[name]) { alert('Cannot delete a built-in preset.'); return; }
    const customs = loadCustomPresets();
    if (!(name in customs)) { alert('Not a custom preset.'); return; }
    if (!confirm(`Delete preset "${name}"?`)) return;
    delete customs[name];
    saveCustomPresets(customs);
    refreshPresetOptions('Flat');
  });

  resetBtn.addEventListener('click', ()=>{
    setPreamp(0);
    applyPresetByName('Flat');
    setEnabled(true);
  });

  // Persistence
  function persist(){
    const data = {
      enabled: enableCb.checked,
      preamp: parseFloat(preamp.value),
      bands: sliders.map(s=> parseFloat(s.input.value)),
      preset: presetSel.value
    };
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }catch{}
  }
  function restore(){
    refreshPresetOptions();
    let data = null;
    try{
      const raw = localStorage.getItem(STORE_KEY);
      data = raw ? JSON.parse(raw) : null;
    }catch{}
    const presetName = data?.preset || 'Flat';
    setPreamp(data?.preamp ?? 0);
    setEnabled(data?.enabled ?? true);
    applyPresetByName(presetName);
    // If user had custom manual tweaks (bands array), restore those on top
    if (data?.bands && Array.isArray(data.bands)){
      sliders.forEach((s,i)=>{
        const val = data.bands[i] ?? 0;
        s.input.value = val;
        s.out.textContent = (val>0?'+':'') + Number(val).toFixed(1) + ' dB';
        filters[i].gain.value = enableCb.checked ? val : 0;
      });
    }
  }
  restore();

  // Resume AudioContext on user gesture (mobile autoplay policies)
  ['click','touchstart','pointerdown'].forEach(evt=>{
    window.addEventListener(evt, ()=>{
      if (ctx.state === 'suspended') ctx.resume?.();
    }, {once:true, passive:true});
  });

  // Public API
  window.equalizerAPI = {
    setEnabled,
    setPreamp,
    setBand(index, dB){
      if (index<0 || index>=filters.length) return;
      sliders[index].input.value = dB;
      sliders[index].out.textContent = (dB>0?'+':'') + Number(dB).toFixed(1) + ' dB';
      filters[index].gain.value = enableCb.checked ? dB : 0;
      persist();
    },
    applyPreset: applyPresetByName,
    getSettings(){
      return {
        enabled: enableCb.checked,
        preamp: parseFloat(preamp.value),
        bands: sliders.map(s=> parseFloat(s.input.value)),
        preset: presetSel.value
      };
    }
  };
})();