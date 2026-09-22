(()=>{
  'use strict';
  /* Doxa 36.2 · Voltar para a leitura no mesmo ponto
     O openPanel() do js/02.js termina sempre com window.scrollTo(0,0), e outras rotinas
     (renderReader, modo grifar) também rolam para o topo logo depois da troca de painel.
     Por isso guardamos a altura enquanto se lê e reaplicamos algumas vezes ao voltar,
     até a tela assentar. Qualquer toque seu cancela na hora, e nada é reaplicado se o
     capítulo mudou ou se o app está indo para um versículo específico. */
  if(window.__doxa362KeepScrollInstalled)return;
  window.__doxa362KeepScrollInstalled=true;

  let saved=null,cancel=false,timers=[];
  const reading=()=>document.getElementById('p-ler')?.classList.contains('on');
  function key(){
    try{
      if(typeof mode==='undefined')return null;
      if(mode==='hyper')return 'hyper.'+hIdx;
      const p=pos(),b=CORPORA[mode]?.books[p.b];
      return b?mode+'.'+b.book+'.'+Number(p.c):null;
    }catch(e){return null}
  }
  // guarda a posição o tempo todo enquanto a leitura está aberta
  window.addEventListener('scroll',()=>{
    if(!reading()||document.body.classList.contains('doxa-home-open'))return;
    const y=window.scrollY;if(y>4)saved={key:key(),y};
  },{passive:true});

  function stop(){cancel=true;timers.forEach(clearTimeout);timers=[]}
  document.addEventListener('touchstart',stop,{capture:true,passive:true});
  document.addEventListener('wheel',stop,{capture:true,passive:true});

  function restore(){
    if(!saved||!saved.key||saved.key!==key())return;
    if(typeof focusVerse!=='undefined'&&focusVerse)return;     // o app está indo para um versículo
    const y=saved.y;cancel=false;
    const go=()=>{
      if(cancel||!reading())return;
      if(document.querySelector('#textBody .verse.focus,#textBody .verse.picker-arrival'))return;
      if(Math.abs(window.scrollY-y)<2)return;
      try{window.scrollTo({top:y,left:0,behavior:'instant'})}catch(e){window.scrollTo(0,y)}
    };
    requestAnimationFrame(go);
    timers.forEach(clearTimeout);
    timers=[30,90,180,320,600].map(ms=>setTimeout(go,ms));
  }

  const orig=window.openPanel;
  if(typeof orig==='function'&&!orig.__doxa362){
    const wrapped=function(name){
      if(reading()&&window.scrollY>4)saved={key:key(),y:window.scrollY};
      else stop();
      const r=orig.apply(this,arguments);
      if(name==='ler')restore();else stop();
      return r;
    };
    wrapped.__doxa362=true;window.openPanel=wrapped;
  }
  window.DoxaKeepScroll={restore,saved:()=>saved};
})();
