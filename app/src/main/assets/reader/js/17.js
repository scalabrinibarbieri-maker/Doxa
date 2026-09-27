(()=>{
  let done=false;
  const splash=document.getElementById('doxaBootSplash');
  if(!splash)return;

  /*
    Abertura Doxa:
    - mantém a splash por aproximadamente 3s no fluxo normal;
    - o leitor continua renderizando por trás durante esse tempo;
    - se o aparelho realmente precisar de mais tempo, não revela
      uma interface incompleta: espera o leitor ficar pronto.
  */
  const TOTAL_MS=4500;
  const FADE_MS=400;
  const EXIT_AT_MS=TOTAL_MS-FADE_MS;

  const finish=()=>{
    if(done)return;
    done=true;

    try{clearTimeout(window.__doxaBootFailsafe)}catch(e){}

    const elapsed=Date.now()-(window.__doxaBootStarted||Date.now());
    const wait=Math.max(0,EXIT_AT_MS-elapsed);

    setTimeout(()=>{
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        splash.classList.add('doxa-boot-splash-hide');
        document.documentElement.removeAttribute('data-doxa-boot');

        setTimeout(()=>{
          try{splash.remove()}catch(e){}
        },FADE_MS+30);
      }));
    },wait);
  };

  const readerReady=()=>{
    const body=document.getElementById('textBody');
    const panel=document.getElementById('p-ler');
    return !!(
      body &&
      panel &&
      (body.children.length || String(body.textContent||'').trim().length)
    );
  };

  const check=()=>{
    if(readerReady())finish();
  };

  if(document.readyState==='complete'){
    check();
  }else{
    window.addEventListener('load',()=>{
      check();
      setTimeout(check,80);
    },{once:true});
  }

  const obs=new MutationObserver(check);
  const target=document.getElementById('textBody');
  if(target)obs.observe(target,{
    childList:true,
    subtree:true,
    characterData:true
  });

  const poll=setInterval(()=>{
    if(done){
      clearInterval(poll);
      obs.disconnect();
      return;
    }
    check();
  },120);

  // Segurança: nunca deixa uma splash presa sobre um app utilizável.
  setTimeout(()=>{
    if(!done)finish();
  },15000);
})();
