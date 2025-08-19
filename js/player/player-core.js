// js/player/player-core.js
(function(){
  const wrapper     = document.querySelector(".wrapper");
  const musicImg    = wrapper?.querySelector(".img-area img");
  const musicName   = wrapper?.querySelector(".song-details .name");
  const musicArtist = wrapper?.querySelector(".song-details .artist");
  const mainAudio   = wrapper?.querySelector("#main-audio");
  const musicListEl = wrapper?.querySelector(".music-list ul");

  // ---- Resolve playlist (always prefer up-to-date window.allMusic) ----
  function resolvePlaylistNow(){
    if (Array.isArray(window.allMusic)) return window.allMusic;
    const candidates = ['musicList','playlist','tracks','songs','music'];
    for (const k of candidates){
      const v = window[k];
      if (Array.isArray(v) && v.length && typeof v[0] === 'object' && 'name' in v[0] && 'img' in v[0] && 'src' in v[0]){
        return v;
      }
    }
    return [];
  }

  // Guard: if core elements or audio are missing, bail cleanly
  if (!wrapper || !mainAudio) {
    console.warn('[player-core] Missing wrapper or audio element; aborting init.');
    return;
  }

  // Keep a 1-based index to match your previous logic
  let musicIndex = 1;
  let viewLoggedForThisSession = false;
  let repeatMode = "repeat"; // repeat, repeat_one, shuffle
  window.currentSongId = "";

  function imgPath(key){ return `images/${key}.jpg`; }
  function audioPath(key){ return `songs/${key}.mp3`; }

  function loadMusic(indexNumb) {
    const LIST = resolvePlaylistNow();
    const item = LIST[indexNumb - 1];
    if (!item) return;

    if (musicName)   musicName.innerText   = item.name || '';
    if (musicArtist) musicArtist.innerText = item.artist || '';
    if (musicImg)    musicImg.src          = imgPath(item.img);
    mainAudio.src    = audioPath(item.src);

    window.currentSongId = item.src || '';
    viewLoggedForThisSession = false;

    // subscribe to Firebase stats if available
    window.subscribeToSongStats?.(window.currentSongId);
  }

  function playMusic() {
    wrapper.classList.add("paused");
    const pp = document.querySelector(".play-pause i");
    if (pp) pp.innerText = "pause";
    mainAudio.play();
    window.setupVisualizer?.();
  }

  function pauseMusic() {
    wrapper.classList.remove("paused");
    const pp = document.querySelector(".play-pause i");
    if (pp) pp.innerText = "play_arrow";
    mainAudio.pause();
  }

  function prevMusic() {
    const LIST = resolvePlaylistNow();
    const len = LIST.length || 1;
    musicIndex = (musicIndex - 2 + len) % len + 1;
    loadMusic(musicIndex); playMusic(); playingSong();
  }

  function nextMusic() {
    handleSongEnd();
    playingSong();
  }

  function handleSongEnd() {
    const LIST = resolvePlaylistNow();
    const len = LIST.length || 1;

    if (repeatMode === "repeat_one") {
      mainAudio.currentTime = 0; playMusic(); return;
    }
    if (repeatMode === "shuffle") {
      let rand;
      do { rand = Math.floor(Math.random() * len) + 1; } while (rand === musicIndex);
      musicIndex = rand;
    } else {
      musicIndex++;
      if (musicIndex > len) musicIndex = 1;
    }
    loadMusic(musicIndex); playMusic();
  }

  // Build playlist UI once (if UL exists). Adapter/Organizer can rebuild later as needed.
  (function buildList(){
    const LIST = resolvePlaylistNow();
    if (!LIST.length) {
      if (musicName)   musicName.textContent = 'No playlist loaded';
      if (musicArtist) musicArtist.textContent = '';
      console.warn('[player-core] Aborting buildList because playlist is empty.');
      return;
    }
    if (!musicListEl) {
      // Not fatal—some layouts build the list elsewhere; playback still works.
      console.warn('[player-core] .music-list ul not found at init; skipping initial list render.');
      return;
    }

    // Clear and rebuild
    musicListEl.innerHTML = '';
    for (let i = 0; i < LIST.length; i++) {
      const it = LIST[i];
      const li = document.createElement("li");
      li.setAttribute("li-index", i+1);
      li.innerHTML = `
        <div class="row">
          <span>${it.name}</span>
          <p>${it.artist || ''}</p>
        </div>
        <span id="${it.src}" class="audio-duration">3:40</span>
        <audio class="${it.src}" src="${audioPath(it.src)}"></audio>`;

      musicListEl.appendChild(li);

      const liAudioTag = li.querySelector(`audio.${CSS.escape(it.src)}`);
      const durEl = li.querySelector(`#${CSS.escape(it.src)}`);
      if (liAudioTag && durEl) {
        liAudioTag.addEventListener("loadeddata", () => {
          const duration = liAudioTag.duration;
          const totalMin = Math.floor(duration / 60);
          let totalSec = Math.floor(duration % 60);
          if (totalSec < 10) totalSec = `0${totalSec}`;
          durEl.innerText = `${totalMin}:${totalSec}`;
          durEl.setAttribute("t-duration", `${totalMin}:${totalSec}`);
        });
      }

      // (We do NOT attach click listeners to <li> here anymore;
      //  the delegated handler handles all current/future LIs.)
    }
  })();

  function playingSong() {
    const ul = wrapper?.querySelector(".music-list ul");
    if (!ul) return;

    const allLi = ul.querySelectorAll("li");
    allLi.forEach(li => {
      const audioTag = li.querySelector(".audio-duration");
      if (li.classList.contains("playing")) {
        li.classList.remove("playing");
        if (audioTag?.querySelector(".playing-visualizer")) {
          const duration = audioTag.getAttribute("t-duration");
          if (duration) audioTag.innerText = duration;
        }
      }
      if (parseInt(li.getAttribute("li-index"), 10) === musicIndex) {
        li.classList.add("playing");
        if (audioTag) {
          audioTag.innerHTML = `
            <span class="wave playing-visualizer">
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
            </span>`;
        }
      }
    });
  }

  function wireTimeUpdates(){
    const progressArea     = document.querySelector(".progress-area");
    const progressBar      = progressArea?.querySelector(".progress-bar");
    const musicCurrentTime = document.querySelector(".current-time");
    const musicDuration    = document.querySelector(".max-duration");

    mainAudio.addEventListener("timeupdate", (e) => {
      if (!window.__viewLogged && mainAudio.currentTime >= 10 && window.currentSongId) {
        window.updateViewCount?.(window.currentSongId);
        window.__viewLogged = true;
      }
      const current  = e.target.currentTime;
      const duration = e.target.duration || 1;
      if (progressBar) progressBar.style.width = `${(current/duration)*100}%`;

      let totalMin = Math.floor(mainAudio.duration / 60) || 0;
      let totalSec = Math.floor(mainAudio.duration % 60) || 0;
      if (totalSec < 10) totalSec = `0${totalSec}`;
      if (musicDuration) musicDuration.innerText = `${totalMin}:${totalSec}`;

      const cm = Math.floor(current / 60);
      let cs = Math.floor(current % 60);
      if (cs < 10) cs = `0${cs}`;
      if (musicCurrentTime) musicCurrentTime.innerText = `${cm}:${cs}`;
    });

    mainAudio.addEventListener("ended", () => { window.__viewLogged = false; handleSongEnd(); });
  }

  // --- Delegated click handler (works with adapter/organizer rebuilds) ---
  function toIndexFromLi(li){
    const liIndexAttr = li.getAttribute('li-index');
    if (liIndexAttr && !isNaN(liIndexAttr)) return Math.max(1, parseInt(liIndexAttr, 10));
    const di = li.dataset.index;
    if (di && !isNaN(di)) return parseInt(di, 10) + 1; // dataset.index often 0-based
    const ul = li.parentElement;
    const kids = Array.from(ul.children);
    const pos = kids.indexOf(li);
    return pos >= 0 ? pos + 1 : 1;
  }

  function shouldIgnoreClick(target){
    return !!target.closest('.download-btn,.like-btn,.dislike-btn,.org-handle,.g73-play-ignore');
  }

  function onListClick(e){
    const container = e.target.closest('.music-list');
    if (!container) return;
    const li = e.target.closest('li');
    if (!li || !container.contains(li)) return;
    if (shouldIgnoreClick(e.target)) return;

    const oneBased = toIndexFromLi(li);
    musicIndex = oneBased;
    loadMusic(musicIndex);
    playMusic();
    playingSong();
  }

  // Attach once
  document.addEventListener('click', onListClick);

  // Init on load
  window.addEventListener("load", () => {
    // pick a random starting song from current list
    const LIST = resolvePlaylistNow();
    if (LIST.length) {
      musicIndex = Math.floor(Math.random() * LIST.length) + 1;
      loadMusic(musicIndex); playingSong(); wireTimeUpdates();
    } else {
      if (musicName)   musicName.textContent = 'No playlist loaded';
      if (musicArtist) musicArtist.textContent = '';
      wireTimeUpdates();
    }
  });

  // React to organizer reorders immediately
  window.addEventListener('playlist:reordered', () => {
    // Keep the highlight in sync (the UL may be rebuilt by adapter)
    playingSong();
  });

  // expose controls for other files
  window.loadMusic    = loadMusic;     // <-- important for adapter/delegates
  window.playMusic    = playMusic;
  window.pauseMusic   = pauseMusic;
  window.prevMusic    = prevMusic;
  window.nextMusic    = nextMusic;
  window.playingSong  = playingSong;   // <-- expose highlight refresher
  window.setRepeatMode = (mode) => { repeatMode = mode; };
})();