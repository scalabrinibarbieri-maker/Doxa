(()=>{
  'use strict';
  /* Doxa 32.1 · Destaque de chegada em qualquer caminho
     O seletor de passagem já troca o destaque fixo (.verse.focus) pela animação que some
     (.picker-arrival). Referências cruzadas, busca, Strong, grifos e Home abriam o versículo
     com o destaque fixo, que ficava para sempre. Aqui todo .focus novo vira a mesma animação. */
  if(window.__doxa321ArrivalInstalled)return;
  window.__doxa321ArrivalInstalled=true;

  const host=document.getElementById('textBody');
  if(!host||!('MutationObserver' in window))return;
  let pending=0;

  function convert(){
    pending=0;
    const el=host.querySelector('.verse.focus');
    if(!el)return;
    el.classList.remove('focus');
    try{focusVerse=null}catch(e){}           // evita que o próximo redesenho recrie o destaque fixo
    if(el.classList.contains('picker-arrival'))return;
    el.classList.remove('picker-arrival');void el.offsetWidth;
    el.classList.add('picker-arrival');
    setTimeout(()=>el.classList.remove('picker-arrival'),2250);
  }

  new MutationObserver(()=>{
    if(pending||!host.querySelector('.verse.focus'))return;
    pending=setTimeout(convert,120);         // espera o redesenho e o início da rolagem até o versículo
  }).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  if(host.querySelector('.verse.focus'))pending=setTimeout(convert,120);
})();
