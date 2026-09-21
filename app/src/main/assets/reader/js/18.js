(()=>{
  'use strict';
  const boot=()=>{
    document.documentElement.classList.add('doxa31');
    const icons={
      ler:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21.5z"/></svg>',
      buscar:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
      marcar:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14v15H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
      ajustes:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5 7 7M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5"/></svg>'
    };
    const labels={ler:'Leitura',buscar:'Buscar',marcar:'Estudo',ajustes:'Ajustes'};
    document.querySelectorAll('nav.bar .tab[data-p]').forEach(btn=>{
      const key=btn.dataset.p;
      if(!icons[key])return;
      btn.innerHTML=icons[key]+'<span>'+labels[key]+'</span>';
    });

    const bootText=document.querySelector('#doxaBootSplash .doxa-boot-status span:last-child');
    if(bootText)bootText.textContent='Preparando a leitura…';

    const body=document.getElementById('textBody');
    const reader=document.getElementById('singleReader');
    if(body&&reader){
      let timer=0;
      new MutationObserver(()=>{
        clearTimeout(timer);
        reader.classList.remove('d31-content-enter');
        void reader.offsetWidth;
        reader.classList.add('d31-content-enter');
        timer=setTimeout(()=>reader.classList.remove('d31-content-enter'),360);
      }).observe(body,{childList:true});
    }

    document.addEventListener('pointerdown',e=>{
      const b=e.target.closest('button');
      if(!b||b.disabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      try{b.animate([{transform:'scale(1)'},{transform:'scale(.965)'},{transform:'scale(1)'}],{duration:155,easing:'ease-out'})}catch(_e){}
    },{passive:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
