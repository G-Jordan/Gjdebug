(function(){  
  function setNavHeight() {  
    const nav = document.querySelector('.navbar');  
    const h = nav ? Math.round(nav.getBoundingClientRect().height) : 56;  
    document.documentElement.style.setProperty('--nav-h', h + 'px');  
    document.body.style.paddingTop = h + 'px';  
    const sp = document.getElementById('nav-spacer');  
    if (sp) sp.style.height = h + 'px';  
  }  
  if (document.readyState === 'loading') {  
    document.addEventListener('DOMContentLoaded', setNavHeight);  
  } else {  
    setNavHeight();  
  }  
  window.addEventListener('resize', setNavHeight);  
  document.getElementById('menuIcon')?.addEventListener('click', () => setTimeout(setNavHeight, 0));  
})();