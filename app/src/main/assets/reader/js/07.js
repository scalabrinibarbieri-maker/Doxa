
(()=>{
  // O botão de leitura paralela fica dentro do painel de leitura.
  // Impede que o mesmo toque chegue ao alternador global do HUD.
  const btn=document.getElementById('parallelToggle');
  if(!btn)return;
  const stop=e=>e.stopPropagation();
  ['touchstart','touchmove','touchend','touchcancel','pointerdown','pointerup'].forEach(type=>{
    btn.addEventListener(type,stop,{passive:true});
  });
  btn.addEventListener('click',stop);
})();
