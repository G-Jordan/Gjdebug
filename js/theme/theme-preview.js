// js/theme/theme-preview.js
(function(){
  function previewTheme(){
    const $ = (id) => document.getElementById(id);
    const mainColor = $("mainThemeColor")?.value || getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const accentColor = $("accentColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    const textColor = $("textColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
    const textBg = $("textBgColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--white-faint').trim();
    const borderColor = $("borderColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--glow-color').trim();
    const artistColor = $("artistColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--artist-color').trim();
    const likeColor = $("likeColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--like-color').trim();
    const dislikeColor = $("dislikeColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--dislike-color').trim();
    const downloadColor = $("downloadColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--download-color').trim();

    const root = document.documentElement.style;
    root.setProperty('--primary-color', mainColor);
    root.setProperty('--glow-color', mainColor);
    root.setProperty('--accent-color', accentColor);
    root.setProperty('--text-muted', textColor);
    root.setProperty('--white-faint', textBg);
    root.setProperty('--glow-border', `1px solid ${borderColor}`);
    root.setProperty('--artist-color', artistColor);

    const likeEl = document.querySelector("#stats-likes"); if (likeEl) likeEl.style.color = likeColor;
    const disEl = document.querySelector("#stats-dislikes"); if (disEl) disEl.style.color = dislikeColor;
    const dlEl = document.querySelector("#stats-downloads"); if (dlEl) dlEl.style.color = downloadColor;

    const likeIcon = document.querySelector(".like-btn i.material-icons"); if (likeIcon) likeIcon.style.color = likeColor;
    const disIcon = document.querySelector(".dislike-btn i.material-icons"); if (disIcon) disIcon.style.color = dislikeColor;
    const dlIcon = document.querySelector(".download-btn i.material-icons"); if (dlIcon) dlIcon.style.color = downloadColor;
  }

  window.previewTheme = previewTheme;
})();