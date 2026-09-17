
(()=>{
  const META={
    almeida:{mark:'A',title:'Almeida 1819',short:'Almeida',sub:'Português · versão principal do Doxa'},
    blivre:{mark:'BL',title:'Bíblia Livre',short:'BLIVRE',sub:'Português · CC BY 4.0 · incluída',module:true,group:'bible'},
    wlc:{mark:'א',title:'WLC · Hebraico',short:'WLC',sub:'Texto hebraico · Strong+ e morfologia',group:'bible'},
    tr:{mark:'Ω',title:'Textus Receptus 1550',short:'TR 1550',sub:'Texto grego do Novo Testamento',group:'bible'},
    hyper:{mark:'H',title:'Tradução hiperliteral',short:'Hiperliteral',sub:'Gênesis 1:1–9:17 · projeto Doxa',group:'bible'}
  };
  const ORDER=['almeida','blivre','wlc','tr','hyper'];
  const vSheet=document.getElementById('versionPicker'),vBack=document.getElementById('versionPickerBackdrop'),vList=document.getElementById('versionPickerList'),vCtx=document.getElementById('versionPickerContext');
  let versionContext='single';
  function activeVersion(){return versionContext==='single'?mode:sanitizeParallelState(versionContext).mode}
  function closeVersionPicker(){vSheet?.classList.remove('on');vBack?.classList.remove('on');vSheet?.setAttribute('aria-hidden','true');document.body.classList.remove('version-picker-open')}
  function renderVersionPicker(){
    const active=activeVersion();let html='';
    for(const k of ORDER){const m=META[k],sp=OPEN_BIBLE_SPECS[k],installed=k==='hyper'||!!CORPORA[k]||!m.module,loading=!!sp&&openBibleInstalling?.has?.(k),state=m.module?(loading?'loading':(installed?'installed':'missing')):'installed';let moduleText='';if(m.module)moduleText='<span class="version-card-module">'+(installed?'Disponível offline':'↓ Disponibilizar offline')+'</span>';html+='<button type="button" class="version-card '+(active===k?'on':'')+'" data-module-state="'+state+'" data-version="'+k+'"><span class="version-card-mark">'+m.mark+'</span><span class="version-card-copy"><strong>'+m.title+'</strong><small>'+m.sub+'</small>'+moduleText+'</span><span class="version-card-end">'+(active===k?'✓':(installed?'›':'↓'))+'</span></button>'}vList.innerHTML=html;
    vList.querySelectorAll('[data-version]').forEach(b=>b.onclick=async()=>{const k=b.dataset.version,m=META[k];if(m.module&&!CORPORA[k]){try{b.dataset.moduleState='loading';b.querySelector('.version-card-end').textContent='…';await window.DoxaOpenBibles.install(k)}catch(e){renderVersionPicker();return}renderVersionPicker()}if(CORPORA[k]||k==='hyper'||!m.module)selectVersion(k)});
  }
  function openVersionPicker(context='single'){
    versionContext=(context==='A'||context==='B')?context:'single';
    vCtx.textContent=versionContext==='single'?'Leitura principal':(versionContext==='A'?'Painel superior':'Painel inferior');
    renderVersionPicker();document.body.classList.add('version-picker-open');vSheet.classList.add('on');vBack.classList.add('on');vSheet.setAttribute('aria-hidden','false');
  }
  function setMainVersion(next){
    if(next===mode)return;if(next!=='hyper'&&!CORPORA[next])return;
    const anchor=currentSingleAnchor();
    mode=next;focusVerse=null;
    if(next==='hyper'){
      hIdx=(anchor.book==='Gen'&&anchor.chapter<=9)?hyperBlockForChapter(anchor.chapter):0;
    }else{
      const cp=CORPORA[next],bi=cp.books.findIndex(b=>b.book===anchor.book);
      if(bi>=0){positions[next]={b:bi,c:anchor.chapter};focusVerse=anchor.verse}else{positions[next]={b:0,c:Number(cp.books[0].chapters[0].chapter)}}
    }
    document.getElementById('versionSelect').value=next;savePrefs();renderReader();renderChips();renderSearch();
    if(focusVerse)setTimeout(()=>document.getElementById('v'+focusVerse)?.scrollIntoView({block:'center'}),35)
  }
  function selectVersion(next){
    if(versionContext==='single')setMainVersion(next);
    else{const sel=document.getElementById('pVersion'+versionContext);sel.value=next;sel.dispatchEvent(new Event('change',{bubbles:true}))}
    closeVersionPicker();updateVersionUI();
  }
  function updateVersionUI(){
    const m=META[mode]||META.almeida;
    document.getElementById('versionTriggerMark').textContent=m.mark;document.getElementById('versionTriggerTitle').textContent=m.title;document.getElementById('versionTriggerSub').textContent=m.sub;
    for(const side of ['A','B']){const pm=META[sanitizeParallelState(side).mode]||META.almeida;document.getElementById('pVersionMark'+side).textContent=pm.mark;document.getElementById('pVersionName'+side).textContent=pm.short}
    const ff=document.getElementById('parallelFloatRef');if(ff){const v=singleVisibleVerse();const base=currentRef().replace(/[.](\d+)/,':$1');ff.textContent=v&&mode!=='hyper'?base+':'+v:currentRef()}
  }
  document.getElementById('versionTrigger')?.addEventListener('click',()=>openVersionPicker('single'));
  document.getElementById('pVersionTriggerA')?.addEventListener('click',()=>openVersionPicker('A'));
  document.getElementById('pVersionTriggerB')?.addEventListener('click',()=>openVersionPicker('B'));
  document.getElementById('versionPickerClose')?.addEventListener('click',closeVersionPicker);vBack?.addEventListener('click',closeVersionPicker);

  // Update custom controls whenever either reader rerenders.
  const prevReader=renderReader;renderReader=function(){const r=prevReader.apply(this,arguments);setTimeout(updateVersionUI,0);return r};
  const prevParallel=renderParallel;renderParallel=function(){const r=prevParallel.apply(this,arguments);setTimeout(updateVersionUI,0);return r};

  // Contextual parallel-reading pill: upward finger motion / forward reading reveals it briefly.
  const floater=document.getElementById('parallelToggle');let floatTimer=null,touchStartY=null,lastY=window.scrollY;
  function showParallelFloat(){if(parallelOn||!document.getElementById('p-ler')?.classList.contains('on'))return;updateVersionUI();floater.classList.add('show');clearTimeout(floatTimer);floatTimer=setTimeout(()=>floater.classList.remove('show'),3200)}
  function hideParallelFloat(){floater.classList.remove('show')}
  document.getElementById('textBody')?.addEventListener('touchstart',e=>{touchStartY=e.changedTouches?.[0]?.clientY??null},{passive:true});
  document.getElementById('textBody')?.addEventListener('touchmove',e=>{if(touchStartY==null)return;const y=e.changedTouches?.[0]?.clientY??touchStartY;if(touchStartY-y>18){showParallelFloat();touchStartY=y}},{passive:true});
  window.addEventListener('scroll',()=>{const y=window.scrollY;if(y-lastY>10)showParallelFloat();else if(lastY-y>24)hideParallelFloat();lastY=y},{passive:true});
  floater?.addEventListener('click',()=>hideParallelFloat());

  // Search stays optional: opening the passage picker never summons the keyboard.
  document.getElementById('pickerSearch')?.addEventListener('pointerdown',e=>e.currentTarget.focus(),{passive:true});

  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeVersionPicker()});
  updateVersionUI();
})();
