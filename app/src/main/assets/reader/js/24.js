(()=>{
  'use strict';
  /* Doxa 33 · Rolagem sincronizada contínua na leitura paralela
     Antes: o painel que acompanha só pulava quando o versículo do topo mudava (em degraus),
     e ainda com scroll-behavior:smooth, então parecia travado e atrasado.
     Agora: calcula quanto do versículo atual já passou (ex.: 40%) e posiciona o outro painel
     no mesmo ponto do mesmo versículo, a cada quadro. Os dois andam juntos, como se um
     segundo dedo rolasse a outra tela. Só o painel que você está tocando comanda. */
  if(window.__doxa33ParallelSyncInstalled)return;
  window.__doxa33ParallelSyncInstalled=true;

  const REF=6;                     // linha de referência: 6px abaixo do topo do painel
  let driver=null,driverUntil=0,raf=0,pendingSide=null;
  const box=s=>document.getElementById('pText'+s);
  const other=s=>s==='A'?'B':'A';

  function claim(side,ms=900){driver=side;driverUntil=Date.now()+ms}
  function driverOk(side){return !driver||driver===side||Date.now()>driverUntil}

  /* versículo que cruza a linha de referência e a fração já rolada dele */
  function anchor(el){
    const verses=el.querySelectorAll('.verse[data-v]');if(!verses.length)return null;
    const top=el.getBoundingClientRect().top+REF;
    let lo=0,hi=verses.length-1,idx=0;
    while(lo<=hi){const mid=(lo+hi)>>1;if(verses[mid].getBoundingClientRect().top<=top){idx=mid;lo=mid+1}else hi=mid-1}
    const v=verses[idx],r=v.getBoundingClientRect();
    const next=verses[idx+1],span=Math.max(1,(next?next.getBoundingClientRect().top:r.bottom)-r.top);
    return{v:v.dataset.v,f:Math.max(0,Math.min(1,(top-r.top)/span))};
  }
  function sameChapter(){
    try{const a=parallelCanonical('A'),b=parallelCanonical('B');return a.book===b.book&&Number(a.chapter)===Number(b.chapter)}catch(e){return false}
  }
  function apply(src){
    const s=box(src),t=box(other(src));if(!s||!t)return;
    // topo e fim: os dois encostam juntos
    if(s.scrollTop<=0){t.scrollTop=0;return}
    if(s.scrollTop+s.clientHeight>=s.scrollHeight-1){t.scrollTop=t.scrollHeight;return}
    const a=anchor(s);if(!a)return;
    const target=t.querySelector('.verse[data-v="'+a.v+'"]');if(!target)return;
    const list=[...t.querySelectorAll('.verse[data-v]')],i=list.indexOf(target),next=list[i+1];
    const tr=t.getBoundingClientRect(),r=target.getBoundingClientRect();
    const span=Math.max(1,(next?next.getBoundingClientRect().top:r.bottom)-r.top);
    t.scrollTop+=Math.round(r.top-tr.top-REF+a.f*span);
  }

  function sync(side){
    if(typeof parallelOn==='undefined'||!parallelOn||!parallelSync)return;
    if(!driverOk(side))return;              // eco da rolagem que nós mesmos aplicamos no outro painel
    if(!sameChapter())return;
    if(!driver||Date.now()>driverUntil)claim(side,250);
    else if(driver===side)driverUntil=Math.max(driverUntil,Date.now()+250);
    pendingSide=side;
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;const s=pendingSide;pendingSide=null;if(s)apply(s)});
  }
  window.syncParallelScroll=sync;           // substitui a versão em degraus do js/02.js

  function bind(){
    for(const side of ['A','B']){
      const el=box(side);if(!el||el.dataset.doxa33Sync)continue;el.dataset.doxa33Sync='1';
      el.addEventListener('touchstart',()=>claim(side,60000),{passive:true});
      el.addEventListener('touchend',()=>claim(side,1200),{passive:true});   // cobre a inércia depois de soltar
      el.addEventListener('touchcancel',()=>claim(side,1200),{passive:true});
      el.addEventListener('wheel',()=>claim(side,500),{passive:true});
      el.addEventListener('pointerdown',()=>claim(side,60000),{passive:true});
      el.addEventListener('pointerup',()=>claim(side,1200),{passive:true});
    }
  }
  const style=document.createElement('style');
  style.textContent='body.parallel-mode .parallel-text{scroll-behavior:auto!important;overflow-anchor:none}';
  document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
