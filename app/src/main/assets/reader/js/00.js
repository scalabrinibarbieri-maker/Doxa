(()=>{
  window.__doxaBootStarted=Date.now();
  document.documentElement.setAttribute('data-doxa-boot','1');

  try{
    const splash=document.getElementById('doxaBootSplash');
    if(splash){
      const icon=splash.querySelector('.doxa-boot-icon');
      if(icon)icon.src='doxa_splash_icon.png';
      const label=splash.querySelector('.doxa-boot-status span:last-child');
      if(label)label.textContent='Preparando o Doxa...';
    }
  }catch(e){}

  try{
    const addCss=(id,href)=>{
      if(document.getElementById(id))return;
      const el=document.createElement('link');
      el.rel='stylesheet';el.id=id;el.href=href;
      document.head.appendChild(el);
    };
    const addScript=(id,src,done)=>{
      if(document.getElementById(id)){done?.();return}
      const el=document.createElement('script');
      el.id=id;el.src=src;el.async=false;
      el.onload=()=>done?.();
      el.onerror=()=>done?.();
      document.body.appendChild(el);
    };

    addCss('doxa-v30-shell-css','css/21.css');
    addCss('doxa-v31-tools-css','css/22.css');

    document.addEventListener('DOMContentLoaded',()=>{
      addScript('doxa-v30-shell-js','js/18.js',()=>{
        addScript('doxa-v30-paper-js','js/19.js',()=>{
          addScript('doxa-v31-tools-js','js/20.js');
        });
      });
    },{once:true});
  }catch(e){}

  window.__doxaBootFailsafe=setTimeout(()=>{
    const splash=document.getElementById('doxaBootSplash');
    if(!splash)return;
    splash.classList.add('doxa-boot-splash-hide');
    document.documentElement.removeAttribute('data-doxa-boot');
    setTimeout(()=>{try{splash.remove()}catch(e){}},430);
  },12000);
})();
