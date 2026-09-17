
(()=>{
  const CHAPTER_START={
    2:'E foram completados o[s] céus e a terra',
    3:'E o serpente era [mais] astuto',
    4:'E o Adam conheceu את Chaváh',
    5:'Este [é o] livro das gerações de Adam.',
    6:'E aconteceu [que] quando o Adam começou a multiplicar-se',
    7:'E disse YHWH a Noach:\n— Vem tu e toda tua casa à arca',
    8:'E lembrou Elohim את [de] Noach',
    9:'E abençoou Elohim את [a] Noach'
  };
  let hyperChapterCurrent=1,hyperVisibleBlock=0,saveTimer=null,continuousBooted=false;
  let pendingTarget=null;

  function blockRange(i){try{return hyperRange(i)}catch(e){return{sc:1,sv:1,ec:1,ev:1}}}
  function representativeBlock(ch){
    ch=Number(ch)||1;
    let i=HYPER_BLOCKS.findIndex((_,n)=>Number(blockRange(n).sc)===ch);
    if(i<0)i=HYPER_BLOCKS.findIndex((_,n)=>{const r=blockRange(n);return ch>=r.sc&&ch<=r.ec});
    return i<0?0:i;
  }
  function blockForVerse(ch,v){
    ch=Number(ch)||1;v=Number(v)||1;
    for(let i=0;i<HYPER_BLOCKS.length;i++){
      const r=blockRange(i),inside=(ch>r.sc&&ch<r.ec)||(r.sc===r.ec&&ch===r.sc&&v>=r.sv&&v<=r.ev)||(ch===r.sc&&ch<r.ec&&v>=r.sv)||(ch===r.ec&&ch>r.sc&&v<=r.ev);
      if(inside)return i;
    }
    return representativeBlock(ch);
  }
  function joinHyperBlocks(){
    let raw='';
    HYPER_BLOCKS.forEach((b,i)=>{
      const text=String(b?.t||'').trim();
      if(!text)return;
      const marker='[[DOXA_BLOCK:'+i+']]';
      if(!raw){raw=marker+text;return}
      const prev=raw.trimEnd();
      // Os blocos editoriais às vezes terminam no meio de uma frase; não criar quebra artificial nesses casos.
      const plainPrev=prev.replace(/\[\[DOXA_BLOCK:\d+\]\]/g,'');
      const sep=/[.!?][”’"')\]]?$/.test(plainPrev.trim())?'\n\n':' ';
      raw=prev+sep+marker+text;
    });
    raw='[[DOXA_CH:1]]'+raw;
    for(const [ch,phrase] of Object.entries(CHAPTER_START)){
      const at=raw.indexOf(phrase);
      if(at>=0)raw=raw.slice(0,at)+'[[DOXA_CH:'+ch+']]'+raw.slice(at);
    }
    return raw;
  }
  function renderInline(raw){
    const re=/\[\[DOXA_(CH|BLOCK):(\d+)\]\]/g;let out='',last=0,m;
    while((m=re.exec(raw))){
      if(m.index>last)out+=decorate(raw.slice(last,m.index));
      if(m[1]==='CH')out+='<span class="hyper-chapter-marker" data-hyper-chapter="'+m[2]+'" aria-hidden="true"></span>';
      else out+='<span class="hyper-block-marker" data-hyper-block="'+m[2]+'" aria-hidden="true"></span>';
      last=re.lastIndex;
    }
    if(last<raw.length)out+=decorate(raw.slice(last));
    return out;
  }
  function renderHyperText(){
    const raw=joinHyperBlocks();
    return raw.split(/\n\n+/).filter(x=>x.length).map(par=>{
      const lines=par.split('\n');
      return lines.map((ln,i)=>{
        const stripped=ln.replace(/\[\[DOXA_(?:CH|BLOCK):\d+\]\]/g,'').trim();
        const cls=stripped.startsWith('—')?'speech':(lines.length>1&&i===0?'lead':'');
        return '<p'+(cls?' class="'+cls+'"':'')+'>'+renderInline(ln)+'</p>';
      }).join('');
    }).join('');
  }
  function setHyperControls(ch){
    ch=Math.max(1,Math.min(9,Number(ch)||1));
    hyperChapterCurrent=ch;
    hIdx=representativeBlock(ch);
    const book=document.getElementById('bookSelect'),chap=document.getElementById('chapterSelect'),nav=document.getElementById('navgrid');
    if(nav)nav.className='navgrid';
    if(book){book.style.display='block';book.innerHTML='<option value="0">Gênesis</option>';book.value='0'}
    if(chap){chap.style.display='block';chap.innerHTML=Array.from({length:9},(_,i)=>'<option value="'+(i+1)+'">Capítulo '+(i+1)+'</option>').join('');chap.value=String(ch)}
    const hr=document.getElementById('hdrRef'),hv=document.getElementById('hdrVersion'),hp=document.getElementById('hdrPage');
    if(hr)hr.textContent='Gênesis '+ch;
    if(hv)hv.textContent='Tradução Hiperliteral Doxa';
    if(hp){hp.innerHTML='<svg class="hyper-bible-switch" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.2 4.8c2.7-.6 5.2.05 7.8 1.65v12.2c-2.55-1.55-5.1-2.15-7.8-1.55V4.8Z" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/><path d="M19.8 4.8c-2.7-.6-5.2.05-7.8 1.65v12.2c2.55-1.55 5.1-2.15 7.8-1.55V4.8Z" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/><line x1="12" y1="6.45" x2="12" y2="18.65" stroke="currentColor" stroke-width="1.25"/></svg>';hp.setAttribute('role','button');hp.setAttribute('tabindex','0');hp.setAttribute('aria-label','Escolher Bíblia');hp.setAttribute('title','Escolher Bíblia')}
  }
  function updateProgress(){
    const tb=document.getElementById('textBody'),fill=document.getElementById('progressFill');if(!tb||!fill)return;
    const top=tb.getBoundingClientRect().top+window.scrollY,range=Math.max(1,tb.offsetHeight-window.innerHeight+110),p=Math.max(0,Math.min(1,(window.scrollY-top+90)/range));
    fill.style.width=(p*100)+'%';
  }
  function updateVisibleState(save=true){
    if(mode!=='hyper'||parallelOn||!document.body.classList.contains('doxa-hyper-continuous'))return;
    const header=document.querySelector('body>header'),line=(header?.getBoundingClientRect().bottom||0)+12;
    let ch=1;
    document.querySelectorAll('#textBody .hyper-chapter-marker').forEach(el=>{if(el.getBoundingClientRect().top<=line)ch=Number(el.dataset.hyperChapter)||ch});
    let bi=0;
    document.querySelectorAll('#textBody .hyper-block-marker').forEach(el=>{if(el.getBoundingClientRect().top<=line)bi=Number(el.dataset.hyperBlock)||bi});
    hyperVisibleBlock=bi;setHyperControls(ch);updateProgress();
    if(save){prefs.hyperScrollY=window.scrollY;prefs.hyperChapter=ch;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{savePrefs()}catch(e){}},450)}
  }
  function jumpChapter(ch,smooth=true){
    ch=Math.max(1,Math.min(9,Number(ch)||1));pendingTarget=null;hyperChapterCurrent=ch;hIdx=representativeBlock(ch);setHyperControls(ch);
    const el=document.querySelector('#textBody .hyper-chapter-marker[data-hyper-chapter="'+ch+'"]');
    if(el)el.scrollIntoView({block:'start',behavior:smooth?'smooth':'auto'});
    setTimeout(()=>updateVisibleState(true),smooth?360:40);
  }
  function restoreHyper(target,keepY){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(mode!=='hyper')return;
      if(target?.chapter){
        const ch=Number(target.chapter)||1,v=Number(target.verse)||1;
        let el=null;
        if(v>1){const bi=blockForVerse(ch,v),br=blockRange(bi);if(br.sc===ch)el=document.querySelector('#textBody .hyper-block-marker[data-hyper-block="'+bi+'"]')}
        if(!el)el=document.querySelector('#textBody .hyper-chapter-marker[data-hyper-chapter="'+ch+'"]');
        if(el)el.scrollIntoView({block:'start',behavior:'auto'});
      }else if(Number.isFinite(keepY))window.scrollTo(0,keepY);
      else if(!continuousBooted&&Number(prefs.hyperScrollY)>0)window.scrollTo(0,Number(prefs.hyperScrollY));
      else jumpChapter(Number(prefs.hyperChapter)||Number(blockRange(hIdx).sc)||1,false);
      continuousBooted=true;setTimeout(()=>updateVisibleState(false),30);
    }));
  }
  function enableContinuous(keepY,target){
    document.body.classList.add('doxa-hyper-continuous');
    const body=document.getElementById('textBody'),opening=document.getElementById('opening');if(opening)opening.style.display='none';
    if(body){body.classList.remove('hebrew');body.setAttribute('dir','ltr');body.innerHTML=renderHyperText()}
    const ch=Number(target?.chapter)||Number(prefs.hyperChapter)||Number(blockRange(hIdx).sc)||1;setHyperControls(ch);
    const prev=document.getElementById('prev'),next=document.getElementById('next');if(prev)prev.disabled=true;if(next)next.disabled=true;
    restoreHyper(target,keepY);
  }
  function disableContinuous(){
    document.body.classList.remove('doxa-hyper-continuous');
    const hp=document.getElementById('hdrPage');if(hp){hp.removeAttribute('role');hp.removeAttribute('tabindex');hp.removeAttribute('aria-label');hp.removeAttribute('title')}
  }

  // Guardar o capítulo solicitado ao trocar de outra Bíblia para a Hiperliteral.
  const oldHyperBlockForChapter=hyperBlockForChapter;
  hyperBlockForChapter=function(ch){if(!parallelOn)pendingTarget={chapter:Number(ch)||1,verse:1};return oldHyperBlockForChapter.apply(this,arguments)};

  // A âncora usada na troca de versões passa a respeitar a posição real da leitura contínua.
  const oldCurrentSingleAnchor=currentSingleAnchor;
  currentSingleAnchor=function(){
    if(mode==='hyper'&&document.body.classList.contains('doxa-hyper-continuous')){
      const r=blockRange(hyperVisibleBlock),v=(Number(r.sc)===Number(hyperChapterCurrent)?Number(r.sv):1)||1;
      return{mode:'hyper',book:'Gen',chapter:hyperChapterCurrent,verse:v,hIdx};
    }
    return oldCurrentSingleAnchor.apply(this,arguments);
  };

  // Última camada de renderização: as demais Bíblias continuam exatamente no leitor por capítulo.
  const previousRender=renderReader;
  renderReader=function(){
    const already=mode==='hyper'&&document.body.classList.contains('doxa-hyper-continuous');
    const keepY=already?window.scrollY:null,target=pendingTarget;pendingTarget=null;
    const r=previousRender.apply(this,arguments);
    if(mode==='hyper')enableContinuous(keepY,target);else disableContinuous();
    return r;
  };

  // Seletor visível de capítulo da Hiperliteral: navegar sem recarregar o texto.
  document.getElementById('chapterSelect')?.addEventListener('change',e=>{
    if(mode!=='hyper')return;e.preventDefault();e.stopImmediatePropagation();jumpChapter(Number(e.target.value)||1,true);
  },true);
  document.getElementById('bookSelect')?.addEventListener('change',e=>{if(mode==='hyper'){e.preventDefault();e.stopImmediatePropagation()}},true);

  // O ícone de Bíblia no cabeçalho vira o atalho de troca de versão somente na Hiperliteral.
  const page=document.getElementById('hdrPage');
  function openVersionsFromPage(e){if(mode!=='hyper')return;e?.preventDefault?.();e?.stopPropagation?.();document.getElementById('versionTrigger')?.click()}
  page?.addEventListener('click',openVersionsFromPage,true);
  page?.addEventListener('keydown',e=>{if(mode==='hyper'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openVersionsFromPage(e)}},true);

  // Quando o seletor premium escolher um versículo na Hiperliteral, pelo menos a âncora de capítulo
  // e o bloco correspondente são preservados na leitura contínua.
  document.getElementById('pickerBody')?.addEventListener('click',e=>{
    if(mode!=='hyper')return;const b=e.target.closest('[data-pv]');if(!b)return;
    const strong=document.querySelector('#pickerBody .picker-stage-title strong')?.textContent||'';const m=strong.match(/(\d+)\s*$/);
    if(m)pendingTarget={chapter:Number(m[1]),verse:Number(b.dataset.pv)||1};
  },true);

  let raf=0;window.addEventListener('scroll',()=>{if(mode!=='hyper'||raf)return;raf=requestAnimationFrame(()=>{raf=0;updateVisibleState(true)})},{passive:true});
  window.addEventListener('resize',()=>{if(mode==='hyper')setTimeout(()=>updateVisibleState(false),50)},{passive:true});

  // Re-render final para aplicar a nova experiência à sessão atual.
  setTimeout(()=>{try{renderReader()}catch(e){console.error('Doxa V18 hyper continuous',e)}},0);
})();
