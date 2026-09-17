
(()=>{
  window.__doxaBootStarted=Date.now();
  document.documentElement.setAttribute('data-doxa-boot','1');
  // Fusível de segurança: a tela de abertura jamais pode prender o usuário.
  window.__doxaBootFailsafe=setTimeout(()=>{
    const splash=document.getElementById('doxaBootSplash');
    if(!splash)return;
    splash.classList.add('doxa-boot-splash-hide');
    document.documentElement.removeAttribute('data-doxa-boot');
    setTimeout(()=>{try{splash.remove()}catch(e){}},430);
  },12000);
})();
