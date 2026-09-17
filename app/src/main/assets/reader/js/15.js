
(()=>{
  const iconSvg='<svg class="global-bible-switch" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.2 4.8c2.7-.6 5.2.05 7.8 1.65v12.2c-2.55-1.55-5.1-2.15-7.8-1.55V4.8Z" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/><path d="M19.8 4.8c-2.7-.6-5.2.05-7.8 1.65v12.2c2.55-1.55 5.1-2.15 7.8-1.55V4.8Z" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/><line x1="12" y1="6.45" x2="12" y2="18.65" stroke="currentColor" stroke-width="1.25"/></svg>';
  function applyHudBibleSwitch(){
    const hp=document.getElementById('hdrPage');
    if(!hp)return;
    if(document.body.classList.contains('parallel-mode')||window.parallelOn){
      hp.removeAttribute('role');hp.removeAttribute('tabindex');hp.removeAttribute('aria-label');hp.removeAttribute('title');
      return;
    }
    hp.innerHTML=iconSvg;
    hp.setAttribute('role','button');
    hp.setAttribute('tabindex','0');
    hp.setAttribute('aria-label','Escolher Bíblia');
    hp.setAttribute('title','Escolher Bíblia');
  }
  const _renderReader=window.renderReader;window.renderReader=function(){const r=_renderReader.apply(this,arguments);setTimeout(applyHudBibleSwitch,0);return r};
  const _renderParallel=window.renderParallel;window.renderParallel=function(){const r=_renderParallel.apply(this,arguments);setTimeout(applyHudBibleSwitch,0);return r};
  const _setParallelMode=window.setParallelMode; if(typeof _setParallelMode==='function'){window.setParallelMode=function(){const r=_setParallelMode.apply(this,arguments);setTimeout(applyHudBibleSwitch,0);return r}}
  function openVersionsFromHud(e){
    if(document.body.classList.contains('parallel-mode')||window.parallelOn)return;
    e?.preventDefault?.(); e?.stopPropagation?.(); if(e?.stopImmediatePropagation)e.stopImmediatePropagation();
    document.getElementById('versionTrigger')?.click();
  }
  const page=document.getElementById('hdrPage');
  if(page){
    page.addEventListener('click',openVersionsFromHud,true);
    page.addEventListener('pointerdown',e=>{if(!(document.body.classList.contains('parallel-mode')||window.parallelOn)){e.stopPropagation();}},true);
    page.addEventListener('touchstart',e=>{if(!(document.body.classList.contains('parallel-mode')||window.parallelOn)){e.stopPropagation();}},true);
    page.addEventListener('keydown',e=>{if(!(document.body.classList.contains('parallel-mode')||window.parallelOn)&&(e.key==='Enter'||e.key===' ')){openVersionsFromHud(e)}},true);
  }
  setTimeout(()=>{try{applyHudBibleSwitch()}catch(e){}},0);
})();
