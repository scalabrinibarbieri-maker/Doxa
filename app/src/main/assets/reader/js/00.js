/* Doxa 46 · Abertura mais leve
   O hebraico com Strong (data/oshb_strong.js, ~17 MB) era lido inteiro antes da primeira tela,
   mesmo por quem só lê em português — era o principal travamento ao abrir.
   Agora a abertura usa uma "casca" vazia com a mesma forma, e o arquivo de verdade entra
   depois: na hora, se a leitura estiver no hebraico; senão, alguns segundos depois de o app
   estar na tela. Quando ele chega, a tela hebraica é redesenhada com as palavras clicáveis.
   A casca é uma propriedade de window (não uma declaração), então o "const OSHB_STRONG" do
   arquivo real pode ocupar o nome normalmente, sem conflito. */
window.OSHB_STRONG={b:["Gen","Exod","Lev","Num","Deut","Josh","Judg","Ruth","1Sam","2Sam","1Kgs","2Kgs","1Chr","2Chr","Ezra","Neh","Esth","Job","Ps","Prov","Eccl","Song","Isa","Jer","Lam","Ezek","Dan","Hos","Joel","Amos","Obad","Jonah","Mic","Nah","Hab","Zeph","Hag","Zech","Mal"],d:[],l:[],la:[],m:[],__stub:true};
(()=>{
  let state='idle';const waiting=[];
  const redraw=()=>{
    try{if(typeof mode!=='undefined'&&mode==='wlc'&&typeof renderReader==='function')renderReader()}catch(e){}
    try{if(typeof parallelOn!=='undefined'&&parallelOn&&typeof renderParallelSide==='function'){renderParallelSide('A');renderParallelSide('B')}}catch(e){}
  };
  window.DoxaLoadOshb=function(cb){
    if(state==='done'){cb&&cb();return}
    if(cb)waiting.push(cb);
    if(state==='loading')return;
    state='loading';
    const el=document.createElement('script');el.src='data/oshb_strong.js';el.async=true;
    el.onload=()=>{state='done';redraw();waiting.splice(0).forEach(f=>{try{f()}catch(e){}})};
    el.onerror=()=>{state='idle'};
    (document.body||document.head).appendChild(el);
  };
  window.DoxaOshbReady=()=>state==='done';
  const needNow=()=>{
    try{if(typeof mode!=='undefined'&&mode==='wlc')return true}catch(e){}
    try{if(typeof parallelOn!=='undefined'&&parallelOn&&typeof parallelState!=='undefined'&&(parallelState.A?.mode==='wlc'||parallelState.B?.mode==='wlc'))return true}catch(e){}
    return false;
  };
  window.addEventListener('load',()=>{
    // sempre que a leitura for para o hebraico, garante o arquivo
    for(const name of ['renderReader','renderParallelSide']){
      const orig=window[name];if(typeof orig!=='function'||orig.__doxaOshb)continue;
      const w=function(){if(state!=='done'&&needNow())window.DoxaLoadOshb();return orig.apply(this,arguments)};
      w.__doxaOshb=true;window[name]=w;
    }
    if(needNow())window.DoxaLoadOshb();
    else{const later=()=>window.DoxaLoadOshb();setTimeout(()=>('requestIdleCallback' in window)?requestIdleCallback(later,{timeout:4000}):later(),2500)}
  });
})();

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
    addCss('doxa-v42-entities-css','css/32.css');
    addCss('doxa-v43-timeline-css','css/33.css');
    addCss('doxa-v45-textus-css','css/34.css');

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
                                addScript('doxa-v38-guide-js','js/30.js',()=>{
                                  addScript('doxa-v41-entidades-pt','data/entidades-pt.js',()=>{
                                    addScript('doxa-v43-timeline-data','data/timeline.js',()=>{
                                      addScript('doxa-v43-timeline-js','js/33.js',()=>{
                                        addScript('doxa-v45-textus-data','data/doxa_textus.js',()=>{
                                          addScript('doxa-v45-textus-js','js/34.js');
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
