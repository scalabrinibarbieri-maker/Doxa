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
    addCss('doxa-v31-home-css','css/23.css');
    addCss('doxa-v312-fixes-css','css/24.css');
    addCss('doxa-v33-parallel-css','css/25.css');
    addCss('doxa-v34-notes-css','css/26.css');
    addCss('doxa-v35-bread-css','css/27.css');
    addCss('doxa-v36-share-css','css/28.css');
    addCss('doxa-v38-guide-css','css/30.css');

    document.addEventListener('DOMContentLoaded',()=>{
      addScript('doxa-v30-shell-js','js/18.js',()=>{
        /* js/19.js (textura antiga) não é mais carregado: o pergaminho vive no css/24.css. */
        addScript('doxa-v31-tools-js','js/20.js',()=>{
          addScript('doxa-v31-home-js','js/21.js',()=>{
            addScript('doxa-v32-fonts-js','js/22.js',()=>{
              addScript('doxa-v321-arrival-js','js/23.js',()=>{
                addScript('doxa-v33-parallel-js','js/24.js',()=>{
                  addScript('doxa-v34-notes-js','js/25.js',()=>{
                    addScript('doxa-v35-bread-js','js/26.js',()=>{
                      addScript('doxa-v36-share-js','js/27.js',()=>{
                        addScript('doxa-v361-scroll-js','js/28.js',()=>{
                          /* Dados do Strong grego: vêm do pacote remoto; se não estiverem
                             instalados, o onerror segue em frente e o js/29.js não faz nada. */
                          addScript('doxa-v37-greek-data','data/greek_strong.js',()=>{
                            addScript('doxa-v37-greek-pt','data/strong-pt-g.js',()=>{
                              addScript('doxa-v37-greek-js','js/29.js',()=>{
                                addScript('doxa-v38-guide-js','js/30.js');
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
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
