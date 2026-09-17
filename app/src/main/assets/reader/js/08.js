
(()=>{
  // Impede que o toque nos seletores de versão seja interpretado também
  // como toque no fundo do leitor, que alterna o HUD imersivo.
  const ids=['versionTrigger','pVersionTriggerA','pVersionTriggerB'];
  const stop=e=>e.stopPropagation();
  for(const id of ids){
    const el=document.getElementById(id);
    if(!el)continue;
    ['touchstart','touchmove','touchend','touchcancel','pointerdown','pointerup'].forEach(type=>{
      el.addEventListener(type,stop,{passive:true});
    });
    el.addEventListener('click',stop);
  }
})();
