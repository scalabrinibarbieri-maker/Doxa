
(()=>{
  
  VERSION_META["tb"]={label:"Tradução Brasileira",short:"TB",prefix:"tb"};VERSION_META["nvi"]={label:"Nova Versão Internacional",short:"NVI",prefix:"nv"};VERSION_META["ntlh"]={label:"Nova Tradução na Linguagem de Hoje",short:"NTLH",prefix:"nl"};VERSION_META["naa"]={label:"Nova Almeida Atualizada",short:"NAA",prefix:"na"};VERSION_META["kja"]={label:"King James Atualizada",short:"KJA",prefix:"kj"};VERSION_META["kjf"]={label:"King James Fiel",short:"KJF",prefix:"kf"};VERSION_META["jfaa"]={label:"João Ferreira de Almeida Atualizada",short:"JFAA",prefix:"jf"};VERSION_META["as21"]={label:"Almeida Século 21",short:"AS21",prefix:"s21"};VERSION_META["ara"]={label:"Almeida Revista e Atualizada",short:"ARA",prefix:"ra"};VERSION_META["arc"]={label:"Almeida Revista e Corrigida",short:"ARC",prefix:"rc"};
  const INFO={"tb":{"mark":"TB","title":"Tradução Brasileira","short":"TB","sub":"Português · arquivo local"},"nvi":{"mark":"NV","title":"Nova Versão Internacional","short":"NVI","sub":"Português · arquivo local"},"ntlh":{"mark":"NL","title":"Nova Tradução na Linguagem de Hoje","short":"NTLH","sub":"Português · arquivo local"},"naa":{"mark":"NA","title":"Nova Almeida Atualizada","short":"NAA","sub":"Português · arquivo local"},"kja":{"mark":"KJ","title":"King James Atualizada","short":"KJA","sub":"Português · arquivo local"},"kjf":{"mark":"KF","title":"King James Fiel","short":"KJF","sub":"Português · arquivo local"},"jfaa":{"mark":"JF","title":"João Ferreira de Almeida Atualizada","short":"JFAA","sub":"Português · arquivo local"},"as21":{"mark":"21","title":"Almeida Século 21","short":"AS21","sub":"Português · arquivo local"},"ara":{"mark":"RA","title":"Almeida Revista e Atualizada","short":"ARA","sub":"Português · arquivo local"},"arc":{"mark":"RC","title":"Almeida Revista e Corrigida","short":"ARC","sub":"Português · arquivo local"},"almeida":{"mark":"A","title":"Almeida 1819","short":"Almeida 1819","sub":"Português · versão principal do Doxa"},"blivre":{"mark":"BL","title":"Bíblia Livre","short":"BLIVRE","sub":"Português · incluída no Doxa"},"wlc":{"mark":"א","title":"WLC · Hebraico","short":"WLC","sub":"Texto hebraico · Strong+ e morfologia"},"tr":{"mark":"Ω","title":"Textus Receptus 1550","short":"TR 1550","sub":"Texto grego do Novo Testamento"},"hyper":{"mark":"H","title":"Tradução hiperliteral","short":"Hiperliteral","sub":"Gênesis 1:1–9:17 · projeto Doxa"}};
  const ORDER=["almeida","blivre","tb","nvi","ntlh","naa","kja","kjf","jfaa","as21","ara","arc","wlc","tr","hyper"];
  const PT_ORDER=["almeida","blivre","tb","nvi","ntlh","naa","kja","kjf","jfaa","as21","ara","arc"];
  const STUDY_ORDER=["wlc","tr","hyper"];
  const LOCAL_PT=new Set(["tb","nvi","ntlh","naa","kja","kjf","jfaa","as21","ara","arc"]);
  const localLoads=new Map();
  // Capture persisted state before the legacy boot can normalize an unloaded local corpus back to Almeida/WLC.
  const savedPrefsPromise=getStored(KEY_PREFS).then(raw=>{try{return raw?JSON.parse(raw):null}catch(e){return null}}).catch(()=>null);
  const savedParallelPromise=getStored(KEY_PARALLEL).then(raw=>{try{return raw?JSON.parse(raw):null}catch(e){return null}}).catch(()=>null);
  let savedParallelState=null;
  function available(k){return k==='hyper'||LOCAL_PT.has(k)||!!CORPORA[k]}
  function normalizePosition(k){
    const cp=CORPORA[k];if(!cp?.books?.length)return;
    const pp=positions[k]||{b:0,c:Number(cp.books[0]?.chapters?.[0]?.chapter)||1};
    pp.b=Math.max(0,Math.min(cp.books.length-1,Number(pp.b)||0));
    const nums=cp.books[pp.b].chapters.map(c=>Number(c.chapter));
    pp.c=nums.includes(Number(pp.c))?Number(pp.c):nums[0];positions[k]=pp;
  }
  function ensureLocalCorpus(k){
    if(k==='hyper'||CORPORA[k]||!LOCAL_PT.has(k))return Promise.resolve(CORPORA[k]||null);
    if(localLoads.has(k))return localLoads.get(k);
    const promise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='data/bible-'+k+'.js';script.async=true;script.dataset.doxaLocalBible=k;
      script.onload=()=>{if(!CORPORA[k]){script.remove();reject(new Error('O arquivo local não registrou a versão.'));return}normalizePosition(k);syncLegacyVersionSelects();resolve(CORPORA[k])};
      script.onerror=()=>{script.remove();reject(new Error('Não foi possível ler o arquivo local desta Bíblia.'))};
      document.head.appendChild(script);
    }).catch(error=>{localLoads.delete(k);throw error});
    localLoads.set(k,promise);return promise;
  }
  function showLoadError(k,error){const label=INFO[k]?.short||VERSION_META[k]?.short||k;alert('Não foi possível abrir '+label+'.\n\n'+(error?.message||'Falha ao carregar o arquivo local.')+'\n\nOs demais textos do Doxa permanecem intactos.')}
  for(const k of ORDER){if(k!=='hyper'&&CORPORA[k]){if(!positions[k])positions[k]={b:0,c:1};normalizePosition(k)}}
  try{if(prefs?.positions)Object.assign(positions,prefs.positions);if(prefs?.mode&&CORPORA[prefs.mode])mode=prefs.mode;for(const k of ORDER){if(k!=='hyper'&&CORPORA[k])normalizePosition(k)}}catch(e){}

  // Parallel and legacy selects: all local versions are available immediately/offline.
  try{PARALLEL_VERSION_OPTIONS.splice(0,PARALLEL_VERSION_OPTIONS.length,...[["almeida","Almeida 1819"],["blivre","BLIVRE"],["tb","TB"],["nvi","NVI"],["ntlh","NTLH"],["naa","NAA"],["kja","KJA"],["kjf","KJF"],["jfaa","JFAA"],["as21","AS21"],["ara","ARA"],["arc","ARC"],["wlc","WLC"],["tr","TR 1550"],["hyper","Hiperliteral"]])}catch(e){}
  syncLegacyVersionSelects=function(){
    const entries=ORDER.filter(available).map(k=>[k,INFO[k]?.short||VERSION_META[k]?.short||k]);
    const html=entries.map(([v,l])=>'<option value="'+v+'">'+esc(l)+'</option>').join('');
    const vs=document.getElementById('versionSelect');if(vs){vs.innerHTML=html;vs.value=mode}
    for(const side of ['A','B']){const el=document.getElementById('pVersion'+side);if(el){el.innerHTML=html;const st=parallelState?.[side];if(st)el.value=st.mode}}
  };
  syncLegacyVersionSelects();

  const sheet=document.getElementById('versionPicker'),back=document.getElementById('versionPickerBackdrop'),list=document.getElementById('versionPickerList'),ctx=document.getElementById('versionPickerContext');
  let context='single';
  const active=()=>context==='single'?mode:sanitizeParallelState(context).mode;
  function close(){sheet?.classList.remove('on');back?.classList.remove('on');sheet?.setAttribute('aria-hidden','true');document.body.classList.remove('version-picker-open')}
  function card(k){const m=INFO[k]||{mark:'•',title:VERSION_META[k]?.label||k,short:k,sub:''},on=active()===k;return '<button type="button" class="version-card '+(on?'on':'')+'" data-v17-version="'+k+'"><span class="version-card-mark">'+m.mark+'</span><span class="version-card-copy"><strong>'+esc(m.title)+'</strong><small>'+esc(m.sub)+'</small></span><span class="version-card-end">'+(on?'✓':'›')+'</span></button>'}
  function render(){
    let html='<div class="version-group-label">Bíblias em português</div>'+PT_ORDER.filter(available).map(card).join('');
    html+='<div class="version-group-label">Textos de estudo</div>'+STUDY_ORDER.filter(k=>k==='hyper'||CORPORA[k]).map(card).join('');
    list.innerHTML=html;
  }
  function setMain(next){
    if(next===mode)return;if(next!=='hyper'&&!CORPORA[next])return;
    const anchor=currentSingleAnchor();mode=next;focusVerse=null;
    if(next==='hyper')hIdx=(anchor.book==='Gen'&&anchor.chapter<=9)?hyperBlockForChapter(anchor.chapter):0;
    else{const cp=CORPORA[next],bi=cp.books.findIndex(b=>b.book===anchor.book);if(bi>=0){const book=cp.books[bi],has=book.chapters.some(c=>Number(c.chapter)===Number(anchor.chapter));positions[next]={b:bi,c:has?Number(anchor.chapter):Number(book.chapters[0].chapter)};if(has)focusVerse=anchor.verse}else positions[next]={b:0,c:Number(cp.books[0].chapters[0].chapter)}}
    const sel=document.getElementById('versionSelect');if(sel)sel.value=next;savePrefs();renderReader();renderChips();renderSearch();
    if(focusVerse)setTimeout(()=>document.getElementById('v'+focusVerse)?.scrollIntoView({block:'center'}),35)
  }
  async function choose(next){
    try{
      await ensureLocalCorpus(next);
      if(context==='single')setMain(next);else{const sel=document.getElementById('pVersion'+context);if(sel){sel.value=next;sel.dispatchEvent(new Event('change',{bubbles:true}))}}
      close();updateUI();
    }catch(error){showLoadError(next,error)}
  }
  function open(c='single'){context=(c==='A'||c==='B')?c:'single';if(ctx)ctx.textContent=context==='single'?'Leitura principal':(context==='A'?'Painel superior':'Painel inferior');render();document.body.classList.add('version-picker-open');sheet?.classList.add('on');back?.classList.add('on');sheet?.setAttribute('aria-hidden','false')}
  list?.addEventListener('click',e=>{const b=e.target.closest('[data-v17-version]');if(!b)return;e.preventDefault();e.stopPropagation();choose(b.dataset.v17Version)});

  // Capture the triggers before the older fixed five-version picker sees the click.
  for(const [id,c] of [['versionTrigger','single'],['pVersionTriggerA','A'],['pVersionTriggerB','B']]){const el=document.getElementById(id);el?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open(c)},true)}

  function updateUI(){
    const m=INFO[mode]||INFO.almeida;
    const mark=document.getElementById('versionTriggerMark'),title=document.getElementById('versionTriggerTitle'),sub=document.getElementById('versionTriggerSub');
    if(mark)mark.textContent=m.mark;if(title)title.textContent=m.title;if(sub)sub.textContent=m.sub;
    for(const side of ['A','B']){const pm=INFO[sanitizeParallelState(side).mode]||INFO.almeida;const mk=document.getElementById('pVersionMark'+side),nm=document.getElementById('pVersionName'+side);if(mk)mk.textContent=pm.mark;if(nm)nm.textContent=pm.short}
  }
  // Native selects are normally hidden, but keep them safe if a WebView exposes them or accessibility activates them directly.
  for(const id of ['versionSelect','pVersionA','pVersionB']){
    const el=document.getElementById(id);el?.addEventListener('change',e=>{
      const next=e.target.value;if(!LOCAL_PT.has(next)||CORPORA[next]||e.__doxaLazyReady)return;
      e.stopImmediatePropagation();
      ensureLocalCorpus(next).then(()=>{const ev=new Event('change',{bubbles:true});ev.__doxaLazyReady=true;el.dispatchEvent(ev)}).catch(error=>{showLoadError(next,error);syncLegacyVersionSelects()});
    },true);
  }

  const rr=renderReader;renderReader=function(){const r=rr.apply(this,arguments);setTimeout(updateUI,0);return r};
  const rp=renderParallel;renderParallel=function(){const r=rp.apply(this,arguments);setTimeout(updateUI,0);return r};
  const baseSetParallelMode=setParallelMode;
  setParallelMode=function(on){
    if(on&&!parallelOn&&savedParallelState?.B){
      const preferred=savedParallelState.B.mode,open=()=>{try{parallelState.B=cloneParallelState(savedParallelState.B)}catch(e){}savedParallelState=null;baseSetParallelMode(true)};
      if(LOCAL_PT.has(preferred)&&!CORPORA[preferred]){ensureLocalCorpus(preferred).then(open).catch(()=>{savedParallelState=null;baseSetParallelMode(true)});return}
      open();return;
    }
    return baseSetParallelMode(on);
  };
  async function restorePersistedLocalState(){
    const savedPrefs=await savedPrefsPromise;
    if(savedPrefs?.positions)Object.assign(positions,savedPrefs.positions);
    if(LOCAL_PT.has(savedPrefs?.mode)){try{await ensureLocalCorpus(savedPrefs.mode);mode=savedPrefs.mode;normalizePosition(mode)}catch(error){console.warn('Doxa Bíblia local:',error)}}
    const savedParallel=await savedParallelPromise;savedParallelState=savedParallel?.state||null;
    if(savedParallel?.on&&savedParallelState?.A&&savedParallelState?.B){
      const needed=[savedParallelState.A.mode,savedParallelState.B.mode].filter((k,i,a)=>LOCAL_PT.has(k)&&!CORPORA[k]&&a.indexOf(k)===i);
      for(const k of needed){try{await ensureLocalCorpus(k)}catch(error){console.warn('Doxa Bíblia paralela local:',k,error)}}
      try{parallelState=cloneParallelState(savedParallelState);sanitizeParallelState('A');sanitizeParallelState('B');parallelSync=savedParallel.sync!==false;savedParallelState=null}catch(e){}
    }
    syncLegacyVersionSelects();updateUI();
    try{renderReader();if(parallelOn)renderParallel();renderChips();renderSearch()}catch(e){console.warn('Doxa restauração local:',e)}
  }
  function afterBaseReady(){
    let tries=0;const tick=()=>{if((document.getElementById('stats')?.innerHTML||'').length>0||tries++>150){restorePersistedLocalState();return}setTimeout(tick,20)};tick();
  }
  afterBaseReady();
  setTimeout(updateUI,500);

  // Keep corpus information accurate without asserting rights metadata for user-supplied files.
  const cards=[...document.querySelectorAll('.sourcecard')];const corpusCard=cards.find(x=>/Textos-base embutidos|Textos embutidos neste leitor/.test(x.textContent||''));
  if(corpusCard)corpusCard.innerHTML='Textos-base do Doxa: Almeida 1819 · Bíblia Livre · WLC corrigido/OSHB · Textus Receptus 1550 · Tradução Hiperliteral.<br><br><b>Versões locais adicionadas:</b> TB · NVI · NTLH · NAA · KJA · KJF · JFAA · AS21 · ARA · ARC. Os arquivos dessas versões ficam no aparelho, funcionam offline e são carregados somente quando a versão é aberta.';
})();
