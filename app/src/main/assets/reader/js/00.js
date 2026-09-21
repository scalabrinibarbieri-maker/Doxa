(()=>{
  window.__doxaBootStarted=Date.now();
  document.documentElement.setAttribute('data-doxa-boot','1');

  // Splash visual aprovada: troca somente o asset e o texto,
  // mantendo intacta a lógica de boot/fechamento existente.
  try{
    const splash=document.getElementById('doxaBootSplash');
    if(splash){
      const icon=splash.querySelector('.doxa-boot-icon');
      if(icon)icon.src='doxa_splash_icon.png';
      const label=splash.querySelector('.doxa-boot-status span:last-child');
      if(label)label.textContent='Preparando o Doxa...';
    }
  }catch(e){}

  // Fusível de segurança: a tela de abertura jamais pode prender o usuário.
  window.__doxaBootFailsafe=setTimeout(()=>{
    const splash=document.getElementById('doxaBootSplash');
    if(!splash)return;
    splash.classList.add('doxa-boot-splash-hide');
    document.documentElement.removeAttribute('data-doxa-boot');
    setTimeout(()=>{try{splash.remove()}catch(e){}},430);
  },12000);
})();
