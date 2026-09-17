
(()=>{
  const pager=document.querySelector('#singleReader .pager');
  const prev=document.getElementById('prev'),next=document.getElementById('next');
  if(pager&&'IntersectionObserver'in window){
    const io=new IntersectionObserver(entries=>{
      const visible=entries.some(x=>x.isIntersecting&&x.intersectionRatio>0.08);
      document.body.classList.toggle('doxa-pager-visible',visible);
    },{threshold:[0,.08,.2,.5]});
    io.observe(pager);
  }
  // Um toque nos botões de navegação pertence somente a eles: não alterna HUD
  // e não pode atingir o botão flutuante da leitura paralela.
  const stop=e=>e.stopPropagation();
  for(const el of [prev,next]){
    if(!el)continue;
    ['touchstart','touchmove','touchend','touchcancel','pointerdown','pointerup'].forEach(type=>el.addEventListener(type,stop,{passive:true}));
    el.addEventListener('click',stop);
  }
})();
