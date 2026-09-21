
(()=>{
  window.__doxaBootStarted=Date.now();
  document.documentElement.setAttribute('data-doxa-boot','1');

  // Doxa 31.1: UI visual carregada antes do leitor para evitar flash da interface antiga.
  try{
    const css=document.createElement('link');
    css.rel='stylesheet'; css.href='css/21.css'; css.id='doxa31-visual-css';
    document.head.appendChild(css);

    const icon=document.querySelector('.doxa-boot-icon');
    if(icon)icon.src='doxa31-icon.png';

    const ui=document.createElement('script');
    ui.src='js/18.js'; ui.defer=true; ui.id='doxa31-visual-js';
    document.head.appendChild(ui);
  }catch(e){}

  window.__doxaBootFailsafe=setTimeout(()=>{
    const splash=document.getElementById('doxaBootSplash');
    if(!splash)return;
    splash.classList.add('doxa-boot-splash-hide');
    document.documentElement.removeAttribute('data-doxa-boot');
    setTimeout(()=>{try{splash.remove()}catch(e){}},430);
  },12000);
})();
