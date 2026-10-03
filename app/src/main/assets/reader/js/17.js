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

/* Doxa · extensão do limite mínimo do tamanho do texto
   Apenas amplia o controle já existente: 14 px -> 11 px.
   Mantém o máximo, passos, margens, alinhamento, números e persistência. */
(()=>{
  const MIN_SIZE=11;
  const MAX_SIZE=28;

  const slider=document.getElementById('swSize');
  if(slider)slider.min=String(MIN_SIZE);

  if(typeof applyTextPrefs!=='function')return;

  applyTextPrefs=function(save=false){
    const size=Math.max(MIN_SIZE,Math.min(MAX_SIZE,Number(prefs.size)||18.5));
    const margin=Math.max(8,Math.min(42,Number(prefs.textMargin)||26));
    const align=['left','justify','center'].includes(prefs.textAlign)?prefs.textAlign:'justify';
    const showNumbers=prefs.showVerseNumbers!==false;
    prefs.size=size;prefs.textMargin=margin;prefs.textAlign=align;prefs.showVerseNumbers=showNumbers;

    document.documentElement.style.setProperty('--reader-font-size',size+'px');
    document.documentElement.style.setProperty('--parallel-font-size',size+'px');
    document.documentElement.style.setProperty('--reader-side-padding',margin+'px');
    document.documentElement.style.setProperty('--parallel-side-padding',Math.max(7,Math.round(margin*.55))+'px');
    document.documentElement.style.setProperty('--reader-family',"Georgia,'Times New Roman',serif");

    document.body.dataset.readerAlign=align;
    delete document.body.dataset.readerFont;
    document.body.classList.toggle('reader-hide-verse-numbers',!showNumbers);
    document.body.classList.toggle('reader-hyper-active',mode==='hyper');

    const sizeEl=document.getElementById('swSize');
    const sizeOut=document.getElementById('swSizeValue');
    const marginEl=document.getElementById('swTextMargin');
    const marginOut=document.getElementById('swTextMarginValue');
    const verseEl=document.getElementById('swVerseNumbers');

    if(sizeEl){
      sizeEl.min=String(MIN_SIZE);
      if(Number(sizeEl.value)!==size)sizeEl.value=size;
    }
    if(sizeOut)sizeOut.textContent=String(size).replace('.',',');
    if(marginEl&&Number(marginEl.value)!==margin)marginEl.value=margin;
    if(marginOut)marginOut.textContent=margin+' px';
    if(verseEl){verseEl.checked=showNumbers;verseEl.disabled=mode==='hyper'}

    document.querySelectorAll('[data-reader-align]').forEach(b=>{
      b.classList.toggle('on',b.dataset.readerAlign===align);
      b.disabled=mode==='hyper';
    });

    const hint=document.getElementById('readerTextHint');
    if(hint)hint.textContent=mode==='hyper'
      ?'A Hiperliteral está ativa: alinhamento e números permanecem na formatação editorial própria.'
      :'Alinhamento e números também acompanham a leitura paralela.';

    if(save)savePrefs();
  };
})();
