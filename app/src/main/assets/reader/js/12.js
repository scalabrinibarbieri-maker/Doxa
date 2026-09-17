
(()=>{
  
  VERSION_META["tb"]={label:"Tradução Brasileira",short:"TB",prefix:"tb"};VERSION_META["nvi"]={label:"Nova Versão Internacional",short:"NVI",prefix:"nv"};VERSION_META["ntlh"]={label:"Nova Tradução na Linguagem de Hoje",short:"NTLH",prefix:"nl"};VERSION_META["naa"]={label:"Nova Almeida Atualizada",short:"NAA",prefix:"na"};VERSION_META["kja"]={label:"King James Atualizada",short:"KJA",prefix:"kj"};VERSION_META["kjf"]={label:"King James Fiel",short:"KJF",prefix:"kf"};VERSION_META["jfaa"]={label:"João Ferreira de Almeida Atualizada",short:"JFAA",prefix:"jf"};VERSION_META["as21"]={label:"Almeida Século 21",short:"AS21",prefix:"s21"};VERSION_META["ara"]={label:"Almeida Revista e Atualizada",short:"ARA",prefix:"ra"};VERSION_META["arc"]={label:"Almeida Revista e Corrigida",short:"ARC",prefix:"rc"};
  const INFO={"tb":{"mark":"TB","title":"Tradução Brasileira","short":"TB","sub":"Português · arquivo local"},"nvi":{"mark":"NV","title":"Nova Versão Internacional","short":"NVI","sub":"Português · arquivo local"},"ntlh":{"mark":"NL","title":"Nova Tradução na Linguagem de Hoje","short":"NTLH","sub":"Português · arquivo local"},"naa":{"mark":"NA","title":"Nova Almeida Atualizada","short":"NAA","sub":"Português · arquivo local"},"kja":{"mark":"KJ","title":"King James Atualizada","short":"KJA","sub":"Português · arquivo local"},"kjf":{"mark":"KF","title":"King James Fiel","short":"KJF","sub":"Português · arquivo local"},"jfaa":{"mark":"JF","title":"João Ferreira de Almeida Atualizada","short":"JFAA","sub":"Português · arquivo local"},"as21":{"mark":"21","title":"Almeida Século 21","short":"AS21","sub":"Português · arquivo local"},"ara":{"mark":"RA","title":"Almeida Revista e Atualizada","short":"ARA","sub":"Português · arquivo local"},"arc":{"mark":"RC","title":"Almeida Revista e Corrigida","short":"ARC","sub":"Português · arquivo local"},"almeida":{"mark":"A","title":"Almeida 1819","short":"Almeida 1819","sub":"Português · versão principal do Doxa"},"blivre":{"mark":"BL","title":"Bíblia Livre","short":"BLIVRE","sub":"Português · incluída no Doxa"},"wlc":{"mark":"א","title":"WLC · Hebraico","short":"WLC","sub":"Texto hebraico · Strong+ e morfologia"},"tr":{"mark":"Ω","title":"Textus Receptus 1550","short":"TR 1550","sub":"Texto grego do Novo Testamento"},"hyper":{"mark":"H","title":"Tradução hiperliteral","short":"Hiperliteral","sub":"Gênesis 1:1–9:17 · projeto Doxa"}};
  const ORDER=["almeida","blivre","tb","nvi","ntlh","naa","kja","kjf","jfaa","as21","ara","arc","wlc","tr","hyper"];
  const PT_ORDER=["almeida","blivre","tb","nvi","ntlh","naa","kja","kjf","jfaa","as21","ara","arc"];
  const STUDY_ORDER=["wlc","tr","hyper"];
  for(const k of ORDER){if(k!=='hyper'&&CORPORA[k]&&!positions[k])positions[k]={b:0,c:1}}
  // load() may have run before this late integration script. Restore a saved V17 mode/position now that its corpus exists.
  try{if(prefs?.positions)Object.assign(positions,prefs.positions);if(prefs?.mode&&CORPORA[prefs.mode])mode=prefs.mode;for(const k of ORDER){if(k==='hyper'||!CORPORA[k])continue;const cp=CORPORA[k],pp=positions[k]||{b:0,c:1};pp.b=Math.max(0,Math.min(cp.books.length-1,Number(pp.b)||0));const nums=cp.books[pp.b].chapters.map(c=>Number(c.chapter));pp.c=nums.includes(Number(pp.c))?Number(pp.c):nums[0];positions[k]=pp}}catch(e){}

  // Parallel and legacy selects: all local versions are available immediately/offline.
  try{PARALLEL_VERSION_OPTIONS.splice(0,PARALLEL_VERSION_OPTIONS.length,...[["almeida","Almeida 1819"],["blivre","BLIVRE"],["tb","TB"],["nvi","NVI"],["ntlh","NTLH"],["naa","NAA"],["kja","KJA"],["kjf","KJF"],["jfaa","JFAA"],["as21","AS21"],["ara","ARA"],["arc","ARC"],["wlc","WLC"],["tr","TR 1550"],["hyper","Hiperliteral"]])}catch(e){}
  syncLegacyVersionSelects=function(){
    const entries=ORDER.filter(k=>k==='hyper'||!!CORPORA[k]).map(k=>[k,INFO[k]?.short||VERSION_META[k]?.short||k]);
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
    let html='<div class="version-group-label">Bíblias em português</div>'+PT_ORDER.filter(k=>CORPORA[k]).map(card).join('');
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
  function choose(next){
    if(context==='single')setMain(next);else{const sel=document.getElementById('pVersion'+context);if(sel){sel.value=next;sel.dispatchEvent(new Event('change',{bubbles:true}))}}
    close();updateUI();
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
  const rr=renderReader;renderReader=function(){const r=rr.apply(this,arguments);setTimeout(updateUI,0);return r};
  const rp=renderParallel;renderParallel=function(){const r=rp.apply(this,arguments);setTimeout(updateUI,0);return r};
  setTimeout(()=>{syncLegacyVersionSelects();updateUI();try{renderReader();if(parallelOn)renderParallel()}catch(e){}},0);
  setTimeout(updateUI,500);

  // Keep corpus information accurate without asserting rights metadata for user-supplied files.
  const cards=[...document.querySelectorAll('.sourcecard')];const corpusCard=cards.find(x=>/Textos-base embutidos|Textos embutidos neste leitor/.test(x.textContent||''));
  if(corpusCard)corpusCard.innerHTML='Textos-base do Doxa: Almeida 1819 · Bíblia Livre · WLC corrigido/OSHB · Textus Receptus 1550 · Tradução Hiperliteral.<br><br><b>Versões locais adicionadas:</b> TB · NVI · NTLH · NAA · KJA · KJF · JFAA · AS21 · ARA · ARC. Os arquivos dessas versões ficam embutidos no aplicativo e funcionam offline.';
})();
