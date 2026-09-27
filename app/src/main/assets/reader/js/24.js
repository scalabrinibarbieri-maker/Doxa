(()=>{
  'use strict';
  /* Doxa 33.1 · Rolagem sincronizada contínua otimizada
     Mantém exatamente o mesmo comportamento da leitura paralela:
     - o painel tocado continua comandando;
     - livro/capítulo/versículo continuam sincronizados;
     - topo e fim continuam encostando juntos.
     Diferença interna: a geometria dos versículos é medida uma única vez por renderização,
     e a rolagem passa a usar apenas números em cache a cada frame. */
  if(window.__doxa33ParallelSyncInstalled)return;
  window.__doxa33ParallelSyncInstalled=true;

  const REF=6;
  let driver=null,driverUntil=0,raf=0,pendingSide=null;
  const cache={A:null,B:null};
  const box=s=>document.getElementById('pText'+s);
  const other=s=>s==='A'?'B':'A';

  function now(){return performance?.now?.()||Date.now()}
  function claim(side,ms=900){driver=side;driverUntil=now()+ms}
  function driverOk(side){return !driver||driver===side||now()>driverUntil}
  function invalidate(side){cache[side]=null}

  function geometry(side){
    const el=box(side);if(!el)return null;
    const verses=[...el.querySelectorAll('.verse[data-v]')];
    if(!verses.length)return null;

    const cached=cache[side];
    if(cached&&cached.first===verses[0]&&cached.last===verses[verses.length-1])return cached;

    const cr=el.getBoundingClientRect(),scroll=el.scrollTop;
    const items=new Array(verses.length),byVerse=new Map();

    for(let i=0;i<verses.length;i++){
      const node=verses[i],r=node.getBoundingClientRect();
      const item={
        v:String(node.dataset.v),
        top:r.top-cr.top+scroll,
        bottom:r.bottom-cr.top+scroll
      };
      items[i]=item;
      byVerse.set(item.v,i);
    }

    for(let i=0;i<items.length;i++){
      const next=items[i+1];
      items[i].span=Math.max(1,(next?next.top:items[i].bottom)-items[i].top);
    }

    return cache[side]={
      first:verses[0],
      last:verses[verses.length-1],
      items,
      byVerse
    };
  }

  function anchor(side){
    const el=box(side),g=geometry(side);if(!el||!g)return null;
    const y=el.scrollTop+REF,items=g.items;
    let lo=0,hi=items.length-1,idx=0;
    while(lo<=hi){
      const mid=(lo+hi)>>1;
      if(items[mid].top<=y){idx=mid;lo=mid+1}
      else hi=mid-1;
    }
    const it=items[idx];
    return{v:it.v,f:Math.max(0,Math.min(1,(y-it.top)/it.span))};
  }

  function sameChapter(){
    try{
      const a=parallelCanonical('A'),b=parallelCanonical('B');
      return a.book===b.book&&Number(a.chapter)===Number(b.chapter)
    }catch(e){return false}
  }

  function apply(src){
    const dst=other(src),s=box(src),t=box(dst);
    if(!s||!t)return;

    if(s.scrollTop<=0){
      if(t.scrollTop!==0)t.scrollTop=0;
      return
    }
    if(s.scrollTop+s.clientHeight>=s.scrollHeight-1){
      const end=Math.max(0,t.scrollHeight-t.clientHeight);
      if(Math.abs(t.scrollTop-end)>.25)t.scrollTop=end;
      return
    }

    const a=anchor(src),tg=geometry(dst);
    if(!a||!tg)return;
    const idx=tg.byVerse.get(String(a.v));
    if(idx==null)return;

    const it=tg.items[idx];
    const max=Math.max(0,t.scrollHeight-t.clientHeight);
    const dest=Math.max(0,Math.min(max,it.top+a.f*it.span-REF));

    if(Math.abs(t.scrollTop-dest)>.25)t.scrollTop=dest;
  }

  function sync(side){
    if(typeof parallelOn==='undefined'||!parallelOn||!parallelSync)return;
    if(!driverOk(side)||!sameChapter())return;

    const n=now();
    if(!driver||n>driverUntil)claim(side,250);
    else if(driver===side)driverUntil=Math.max(driverUntil,n+250);

    pendingSide=side;
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const s=pendingSide;
      pendingSide=null;
      if(s)apply(s);
    });
  }

  window.syncParallelScroll=sync;

  function bind(){
    for(const side of ['A','B']){
      const el=box(side);if(!el)continue;

      if(!el.dataset.doxa33Sync){
        el.dataset.doxa33Sync='1';
        el.addEventListener('touchstart',()=>claim(side,60000),{passive:true});
        el.addEventListener('touchend',()=>claim(side,1200),{passive:true});
        el.addEventListener('touchcancel',()=>claim(side,1200),{passive:true});
        el.addEventListener('wheel',()=>claim(side,500),{passive:true});
        el.addEventListener('pointerdown',()=>claim(side,60000),{passive:true});
        el.addEventListener('pointerup',()=>claim(side,1200),{passive:true});
      }

      if(!el.dataset.doxa331Geom){
        el.dataset.doxa331Geom='1';
        new MutationObserver(()=>invalidate(side)).observe(el,{childList:true});
      }
    }
  }

  const style=document.createElement('style');
  style.textContent='body.parallel-mode .parallel-text{scroll-behavior:auto!important;overflow-anchor:none}';
  document.head.appendChild(style);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();

(()=>{
  'use strict';
  /* Doxa 33 · Interface da leitura paralela
     Um só lugar para cada coisa:
     - Topo: voltar · ‹ passagem › (toque abre o seletor) · trocar · disposição · sincronizar.
     - Cada painel: só o nome da versão. Quando a sincronização está desligada,
       o painel ganha a própria passagem e as próprias setas.
     Reaproveita os elementos originais (ids e ouvintes do js/02.js continuam valendo). */
  if(window.__doxa33ParallelUiInstalled)return;
  window.__doxa33ParallelUiInstalled=true;
  const $=id=>document.getElementById(id);

  const ICON={
    swap:'<svg viewBox="0 0 24 24"><path d="M7 4v14M7 18l-3-3M7 18l3-3M17 20V6M17 6l-3 3M17 6l3 3"/></svg>',
    cols:'<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M12 4.5v15"/></svg>',
    rows:'<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M3.5 12h17"/></svg>',
    link:'<svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4L11.5 6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.3-1.2"/></svg>',
    unlink:'<svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4L11.5 6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.3-1.2"/><path d="M4 4l16 16"/></svg>'
  };

  function build(){
    const bar=document.querySelector('.parallel-appbar');if(!bar||bar.dataset.doxa33)return false;
    bar.dataset.doxa33='1';
    const center=document.createElement('div');center.className='px-center';
    center.innerHTML='<button type="button" class="px-step" id="pxPrev" aria-label="Capítulo anterior">‹</button>'
      +'<button type="button" class="px-ref" id="pxRef" aria-label="Escolher passagem"><strong id="pxRefText">Leitura paralela</strong><small id="pxRefSub">Sincronizada</small></button>'
      +'<button type="button" class="px-step" id="pxNext" aria-label="Próximo capítulo">›</button>';
    const title=bar.querySelector('.parallel-appbar-title');
    bar.insertBefore(center,title);
    const actions=document.createElement('div');actions.className='px-actions';
    const swap=document.createElement('button');swap.type='button';swap.id='pxSwap';swap.className='px-icon';swap.setAttribute('aria-label','Trocar as duas Bíblias de lugar');swap.innerHTML=ICON.swap;
    const lay=$('parallelOrientation'),sync=$('parallelGlobalSync');
    lay.classList.add('px-icon');sync.classList.add('px-icon');
    actions.append(swap,lay,sync);bar.appendChild(actions);

    $('pxPrev').addEventListener('click',()=>$('pPrevA')?.click());
    $('pxNext').addEventListener('click',()=>$('pNextA')?.click());
    $('pxRef').addEventListener('click',()=>$('pPassageA')?.click());
    swap.addEventListener('click',()=>$('parallelSwap')?.click());

    for(const s of ['A','B']){
      const nav=$('pNav'+s),prev=$('pPrev'+s),next=$('pNext'+s);
      if(nav&&prev&&next){prev.classList.add('px-pane-step');next.classList.add('px-pane-step');nav.append(prev,next)}
    }
    $('parallelSync')?.addEventListener('change',()=>setTimeout(refresh,0));
    return true;
  }

  function passageText(side){
    const b=$('pPassage'+side);const t=b?.querySelector('span')?.textContent||'';return t.trim();
  }
  function refresh(){
    if(!document.querySelector('.parallel-appbar')?.dataset.doxa33)return;
    const synced=typeof parallelSync==='undefined'?true:!!parallelSync;
    document.body.classList.toggle('px-unsynced',!synced);
    $('pxRefText').textContent=synced?(passageText('A')||'Leitura paralela'):'Leitura paralela';
    $('pxRefSub').textContent=synced?'Sincronizada · toque para escolher':'Independente · cada Bíblia navega sozinha';
    $('pxPrev').disabled=!!$('pPrevA')?.disabled;$('pxNext').disabled=!!$('pNextA')?.disabled;
    const sync=$('parallelGlobalSync');
    sync.innerHTML=synced?ICON.link:ICON.unlink;sync.classList.toggle('on',synced);
    sync.setAttribute('aria-label',synced?'Desligar sincronização':'Ligar sincronização');
    const lay=$('parallelOrientation'),horizontal=(typeof parallelLayout==='undefined'?'horizontal':parallelLayout)==='horizontal';
    lay.innerHTML=horizontal?ICON.rows:ICON.cols;
    lay.setAttribute('aria-label',horizontal?'Um sobre o outro':'Lado a lado');
  }

  function wrap(name){
    const orig=window[name];if(typeof orig!=='function'||orig.__doxa33)return;
    const w=function(){const r=orig.apply(this,arguments);try{refresh()}catch(e){}return r};w.__doxa33=true;window[name]=w;
  }
  function init(){
    if(!build())return;
    wrap('renderParallel');wrap('applyParallelLayout');wrap('setParallelMode');
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
