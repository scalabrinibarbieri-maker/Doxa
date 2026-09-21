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

  // Novo shell visual aprovado: carregado no fim do DOM para não interferir
  // na inicialização dos recursos já existentes do leitor.
  try{
    const css=document.createElement('link');
    css.rel='stylesheet';css.id='doxa-v30-shell-css';css.href='css/21.css';
    document.head.appendChild(css);
    document.addEventListener('DOMContentLoaded',()=>{
      if(document.getElementById('doxa-v30-shell-js'))return;
      const js=document.createElement('script');js.id='doxa-v30-shell-js';js.src='js/18.js';js.async=false;
      document.body.appendChild(js);
    },{once:true});
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
