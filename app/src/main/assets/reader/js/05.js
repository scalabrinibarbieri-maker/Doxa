
(()=>{
  /* ===== Tipografia ===== */
  const FONT_STACKS={
    editorial:'serif',
    literaria:'sans-serif',
    classica:'"sans-serif-condensed",sans-serif',
    humanista:'"sans-serif-light",sans-serif',
    limpa:'monospace'
  };
  const FONT_LOAD_NAMES={};
  function applyReaderFont(save=false){
    if(!FONT_STACKS[prefs.readerFont])prefs.readerFont='editorial';
    document.documentElement.style.setProperty('--reader-family',FONT_STACKS[prefs.readerFont]);
    document.body.dataset.readerFont=prefs.readerFont;
    document.querySelectorAll('[data-reader-font]').forEach(b=>b.classList.toggle('on',b.dataset.readerFont===prefs.readerFont));
    const face=FONT_LOAD_NAMES[prefs.readerFont];
    if(face&&document.fonts?.load){document.fonts.load(`400 18px "${face}"`).catch(()=>{});}
    if(save)savePrefs();
  }
  document.querySelectorAll('[data-reader-font]').forEach(b=>b.addEventListener('click',()=>{prefs.readerFont=b.dataset.readerFont;applyReaderFont(true)}));
  // load() is asynchronous and started by the base reader; apply once now and once after it has completed.
  applyReaderFont(false);setTimeout(()=>applyReaderFont(false),350);setTimeout(()=>applyReaderFont(false),1100);

  /* ===== HUD imersivo ===== */
  let hudHidden=false,lastScrollY=window.scrollY,touchStartY=null,touchLastY=null,touchStartX=null,touchMoved=false,lastTouchHudTap=0,touchInteractive=false;
  const readerPanel=()=>document.getElementById('p-ler')?.classList.contains('on');
  function overlaysOpen(){return !!document.querySelector('.strong-sheet.on,.premium-picker.on,.xref-sheet.on,.version-picker.on,.verse-actions.on,.study-screen.on,.v20-adv.on') }
  function syncParallelHud(){
    try{
      const ff=document.getElementById('parallelFloatRef');
      if(ff){const v=singleVisibleVerse();const base=currentRef().replace(/[.](\d+)/,':$1');ff.textContent=v&&mode!=='hyper'?base+':'+v:currentRef()}
    }catch(e){}
  }
  function showHud(force=false){
    if(!force&&(!readerPanel()||overlaysOpen()))return;
    hudHidden=false;document.body.classList.remove('hud-hidden');syncParallelHud();
  }
  function hideHud(){
    if(!readerPanel()||overlaysOpen()||(!parallelOn&&window.scrollY<8))return;
    hudHidden=true;document.body.classList.add('hud-hidden');
  }
  function toggleHudTap(){
    if(!readerPanel()||overlaysOpen())return;
    if(hudHidden)showHud(true);else{hudHidden=true;document.body.classList.add('hud-hidden')}
  }
  // Initial state is intentionally visible.
  showHud(true);
  const touchHost=document.getElementById('p-ler');
  touchHost?.addEventListener('touchstart',e=>{
    const t=e.changedTouches?.[0];if(!t)return;
    touchStartY=touchLastY=t.clientY;touchStartX=t.clientX;touchMoved=false;
    touchInteractive=!!e.target.closest?.('button,input,select,textarea,a,.oshb-word,.note-pin,.verse-actions,.strong-sheet,.study-screen,.v20-adv');
  },{passive:true});
  touchHost?.addEventListener('touchmove',e=>{
    if(window.__doxaHighlightDragLock||touchLastY==null)return;const t=e.changedTouches?.[0];if(!t)return;
    const dy=t.clientY-touchLastY,dx=t.clientX-(touchStartX??t.clientX);
    if(Math.abs(t.clientY-(touchStartY??t.clientY))>7||Math.abs(dx)>7)touchMoved=true;
    // O mesmo gesto imersivo vale para leitura normal e paralela.
    if(Math.abs(dy)>5&&Math.abs(t.clientY-(touchStartY??t.clientY))>Math.abs(dx)*.72){
      if(dy<0)hideHud();
      else if(dy>0)showHud();
      touchLastY=t.clientY;
    }
  },{passive:true});
  touchHost?.addEventListener('touchend',()=>{
    if(!touchMoved&&!touchInteractive&&!window.__doxaLongPressActive){toggleHudTap();lastTouchHudTap=Date.now()}
    touchStartY=touchLastY=touchStartX=null;touchMoved=false;touchInteractive=false;
  },{passive:true});
  // Mouse/trackpad/scroll fallback.
  window.addEventListener('scroll',()=>{
    // Durante o swipe de capítulo, renderReader() reposiciona a página no topo.
    // Esse scroll é técnico e não deve alterar o estado visual do HUD.
    if(window.__doxaChapterSwipeAnimating||parallelOn)return;
    if(!readerPanel())return;const y=window.scrollY,d=y-lastScrollY;
    if(y<7)showHud(true);else if(d>11)hideHud();else if(d<-11)showHud();lastScrollY=y;
  },{passive:true});
  document.getElementById('singleReader')?.addEventListener('click',e=>{
    if(Date.now()-lastTouchHudTap<650)return;
    if(!e.target.closest('button,input,select,textarea,a,.oshb-word,.note-pin'))toggleHudTap();
  });


  // A paralela rola em contêineres próprios, então o HUD acompanha essas rolagens também.
  const parallelLast={A:0,B:0};
  for(const side of ['A','B']){
    const box=document.getElementById('pText'+side);if(!box)continue;
    box.addEventListener('scroll',()=>{
      if(!parallelOn||overlaysOpen())return;
      const y=box.scrollTop,d=y-(parallelLast[side]||0);
      if(y<5)showHud(true);else if(d>12)hideHud();else if(d<-12)showHud();
      parallelLast[side]=y;
    },{passive:true});
  }
  document.getElementById('parallelReader')?.addEventListener('click',e=>{
    if(!parallelOn||Date.now()-lastTouchHudTap<650||overlaysOpen())return;
    if(!e.target.closest('button,input,select,textarea,a,.oshb-word,.note-pin'))toggleHudTap();
  });

  /* ===== Ocupação da área da câmera ===== */
  const SCREEN_KEY='doxa:screen:full-content:v1';
  function applyScreenMode(save=false){
    const cb=document.getElementById('swFullScreenContent');
    let on=false;
    try{on=save?!!cb?.checked:localStorage.getItem(SCREEN_KEY)==='1'}catch(e){on=!!cb?.checked}
    if(cb)cb.checked=on;
    document.body.classList.toggle('doxa-screen-full',on);
    if(save){try{localStorage.setItem(SCREEN_KEY,on?'1':'0')}catch(e){}}
  }
  document.getElementById('swFullScreenContent')?.addEventListener('change',()=>applyScreenMode(true));
  applyScreenMode(false);

  // Other tabs always keep the application chrome visible.
  const baseOpenPanelV7=openPanel;
  openPanel=function(name){if(name!=='ler')showHud(true);const r=baseOpenPanelV7.apply(this,arguments);if(name==='ler')showHud(true);return r};
  const baseParallelModeV7=setParallelMode;
  setParallelMode=function(on){if(on)showHud(true);const r=baseParallelModeV7.apply(this,arguments);if(!on)setTimeout(()=>showHud(true),0);return r};

  /* ===== Slide ao trocar capítulo ===== */
  const baseMoveV7=move;let chapterAnimating=false;
  function lockBibleTab(){
    const bottom=document.getElementById('doxa30Bottom');if(!bottom)return;
    bottom.dataset.active='bible';
    bottom.querySelectorAll('.doxa30-nav-item').forEach(x=>x.classList.remove('active'));
    document.getElementById('doxa30Bible')?.classList.add('active');
  }
  move=function(delta){
    if(chapterAnimating||parallelOn||!document.getElementById('p-ler')?.classList.contains('on')||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return baseMoveV7.apply(this,arguments);
    const host=document.getElementById('singleReader');if(!host)return baseMoveV7.apply(this,arguments);
    lockBibleTab();chapterAnimating=true;window.__doxaChapterSwipeAnimating=true;document.body.classList.add('chapter-animating');
    const forward=Number(delta)>0,outX=forward?'-16%':'16%',inX=forward?'16%':'-16%';
    host.style.transition='transform 145ms cubic-bezier(.38,.02,.65,.98),opacity 120ms ease';
    host.style.transform='translate3d('+outX+',0,0)';host.style.opacity='0';
    setTimeout(()=>{
      baseMoveV7(delta);
      host.style.transition='none';host.style.transform='translate3d('+inX+',0,0)';host.style.opacity='0';
      void host.offsetWidth;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        host.style.transition='transform 210ms cubic-bezier(.18,.78,.20,1),opacity 175ms ease';
        host.style.transform='translate3d(0,0,0)';host.style.opacity='1';
        setTimeout(()=>{host.style.transition='';host.style.transform='';host.style.opacity='';chapterAnimating=false;window.__doxaChapterSwipeAnimating=false;lastScrollY=window.scrollY;document.body.classList.remove('chapter-animating');lockBibleTab()},225);
      }));
    },145);
  };

  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&readerPanel()&&window.scrollY<7)showHud(true)});
})();
