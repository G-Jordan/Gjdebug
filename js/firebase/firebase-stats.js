// js/firebase/firebase-stats.js
import { doc, updateDoc, increment, onSnapshot, collection, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

function subscribeToSongStats(songId) {
  const reactionsRef = collection(db, "songs", songId, "reactions");
  onSnapshot(reactionsRef, (snapshot) => {
    let likes = 0;
    let dislikes = 0;
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.reaction === "like") likes++;
      if (data.reaction === "dislike") dislikes++;
    });
    const likesEl = document.getElementById("stats-likes");
    const dislikesEl = document.getElementById("stats-dislikes");
    if (likesEl) likesEl.innerText = `Likes ${likes}`;
    if (dislikesEl) dislikesEl.innerText = `Dislikes ${dislikes}`;
  });

  const songDocRef = doc(db, "songs", songId);
  onSnapshot(songDocRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    const playsEl = document.getElementById("stats-plays");
    const dlEl = document.getElementById("stats-downloads");
    if (playsEl) playsEl.innerText = `Plays ${data.views || 0}`;
    if (dlEl) dlEl.innerText = `Downloads ${data.downloads || 0}`;
  });
}

async function likeSongFirebase(songId) {
  if (!auth.currentUser) {
    window.showAuthModal?.();
    return;
  }
  const userId = auth.currentUser.uid;
  const reactionDocRef = doc(db, "songs", songId, "reactions", userId);
  const reactionSnap = await getDoc(reactionDocRef);
  if (reactionSnap.exists()) {
    const current = reactionSnap.data().reaction;
    if (current === "like") return;
    await updateDoc(reactionDocRef, { reaction: "like", timestamp: Date.now() });
  } else {
    await setDoc(reactionDocRef, { reaction: "like", timestamp: Date.now() });
  }
}

async function dislikeSongFirebase(songId) {
  if (!auth.currentUser) {
    window.showAuthModal?.();
    return;
  }
  const userId = auth.currentUser.uid;
  const reactionDocRef = doc(db, "songs", songId, "reactions", userId);
  const reactionSnap = await getDoc(reactionDocRef);
  if (reactionSnap.exists()) {
    const current = reactionSnap.data().reaction;
    if (current === "dislike") return;
    await updateDoc(reactionDocRef, { reaction: "dislike", timestamp: Date.now() });
  } else {
    await setDoc(reactionDocRef, { reaction: "dislike", timestamp: Date.now() });
  }
}

function updateViewCount(songId) {
  const songDocRef = doc(db, "songs", songId);
  updateDoc(songDocRef, { views: increment(1) }).catch(console.error);
}

async function downloadSong() {
  if (!auth.currentUser) {
    window.showAuthModal?.();
    return;
  }
  const song = window.mymusic?.find(s => s.src === window.currentSongId);
  if (!song) {
    window.showToast?.("Song not found.");
    return;
  }

  const songDocRef = doc(db, "songs", window.currentSongId);
  await updateDoc(songDocRef, { downloads: increment(1) });

  window.showToast?.(`Downloading "${song.name}"...`);
  setTimeout(() => {
    const a = document.createElement("a");
    a.href = `songs/${window.currentSongId}.mp3`;
    a.download = `${song.name}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, 500);
}

// expose to window for inline handlers
window.subscribeToSongStats = subscribeToSongStats;
window.likeSongFirebase = likeSongFirebase;
window.dislikeSongFirebase = dislikeSongFirebase;
window.updateViewCount = updateViewCount;
window.downloadSong = downloadSong;