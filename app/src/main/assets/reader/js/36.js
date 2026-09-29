(()=>{
  'use strict';
  if(window.__doxa49ToolInstalled)return;
  window.__doxa49ToolInstalled=true;

  const SB_URL='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const SB_KEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  const CACHE_MS=5*60*1000;
  const cache=new Map();

  const TYPE_LABELS={
    nota:'Nota Doxa',
    idioma_original:'Idioma original',
    contexto_historico:'Contexto histórico',
    arqueologia:'Arqueologia',
    tradicoes_antigas:'Tradições antigas',
    apocrifos:'Apócrifos',
    estrutura_literaria:'Estrutura literária',
    texto_manuscritos:'Texto & manuscritos',
    conexao:'Conexões',
    destaque:'Destaque Doxa'
  };

  const TYPE_ORDER=[
    'destaque',
    'idioma_original',
    'texto_manuscritos',
    'contexto_historico',
    'arqueologia',
    'tradicoes_antigas',
    'apocrifos',
    'estrutura_literaria',
    'conexao',
    'nota'
  ];

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=v=>{
    const s=String(v||'').trim();
    if(!/^https?:\/\//i.test(s))return '';
    return s;
  };

  function identityFromVerse(el){
    if(!el)return null;
    const v=Number(el.dataset.v||String(el.id||'').replace(/^v/,''));
    if(!Number.isFinite(v))return null;

    const pane=el.closest?.('.parallel-pane[data-side]');
    if(pane){
      const side=pane.dataset.side;
      try{
        const st=sanitizeParallelState(side);
        if(!st||st.mode==='hyper'||!CORPORA[st.mode])return null;
        const cp=CORPORA[st.mode];
        const b=cp.books.find(x=>x.book===st.book);
        if(!b)return null;
        return{
          book:b.book,
          chapter:Number(st.chapter),
          verse:v,
          label:bookName(b)+' '+st.chapter+':'+v,
          sourceMode:st.mode,
          parallelSide:side
        };
      }catch(e){return null}
    }

    try{
      if(mode==='hyper'||!CORPORA[mode])return null;
      const p=pos(),cp=corpus(),b=cp.books[p.b];
      if(!b)return null;
      return{
        book:b.book,
        chapter:Number(p.c),
        verse:v,
        label:bookName(b)+' '+p.c+':'+v,
        sourceMode:mode
      };
    }catch(e){return null}
  }

  function currentRef(){
    return identityFromVerse(document.querySelector('.verse.verse-context'));
  }


  function cleanseVerseActions(){
    const pop=document.getElementById('verseActions');
    if(!pop)return;
    const banned=['interlinear','crítica textual','critica textual'];
    pop.querySelectorAll('button,[role="button"],.va-item,.action-item').forEach(el=>{
      const txt=String(el.textContent||'').trim().toLowerCase();
      const dataVa=String(el.getAttribute('data-va')||'').trim().toLowerCase();
      if(el.hasAttribute('data-doxa-tool')||dataVa==='interlinear'||banned.some(x=>txt.includes(x))){
        el.remove();
      }
    });
  }


  /* =========================================================
     Modo Ferramenta Doxa
     Ativado pela aba Ferramentas. No modo ativo, apenas os
     versículos com conteúdo Doxa recebem a marca editorial.
     ========================================================= */
  let doxaModeActive=false;
  let markSequence=0;
  let markTimer=0;

  function rowAppliesToVersion(row,sourceMode){
    return !(Array.isArray(row?.versoes)&&row.versoes.length&&!row.versoes.includes(sourceMode));
  }

  function clearVerseMarks(){
    document.querySelectorAll('.verse.doxa-tool-hit').forEach(el=>{
      el.classList.remove('doxa-tool-hit','doxa-tool-hit-enter');
      el.removeAttribute('data-doxa-tool-hit');
      el.style.removeProperty('--doxa-hit-index');
    });
  }

  function currentNormalChapterRef(){
    return identityFromVerse(document.querySelector('#textBody .verse'));
  }

  function syncModeButton(){
    const btn=document.getElementById('toolsDoxaMode');
    if(!btn)return;
    btn.classList.toggle('is-active',doxaModeActive);
    btn.setAttribute('aria-pressed',doxaModeActive?'true':'false');
    const state=btn.querySelector('.doxa-tool-mode-state');
    const copy=btn.querySelector('.doxa-tool-mode-copy small');
    if(state)state.textContent=doxaModeActive?'ATIVO':'';
    if(copy)copy.textContent=doxaModeActive
      ?'Ativa · toque novamente para desativar'
      :'Revele no texto os versículos com conteúdo Doxa';
  }

  function syncToolCardVisibility(){
    const btn=document.getElementById('toolsDoxaMode');
    if(!btn)return;
    const notes=document.getElementById('toolsNotesView');
    const highlights=document.getElementById('toolsHighlightsView');
    btn.hidden=!!((notes&&!notes.hidden)||(highlights&&!highlights.hidden));
  }

  function createModeFx(){
    if(document.getElementById('doxaToolModeFx'))return;
    const fx=document.createElement('div');
    fx.id='doxaToolModeFx';
    fx.className='doxa-tool-mode-fx';
    fx.setAttribute('aria-hidden','true');
    fx.innerHTML=`
      <div class="doxa-tool-mode-fx-core">
        <span class="doxa-tool-mode-fx-ring"></span>
        <img src="doxa_splash_icon.png" alt="">
      </div>
      <span class="doxa-tool-mode-fx-line"></span>`;
    document.body.appendChild(fx);
  }

  function playModeFx(on){
    createModeFx();
    const fx=document.getElementById('doxaToolModeFx');
    if(!fx)return;
    fx.classList.remove('on','off','play');
    void fx.offsetWidth;
    fx.classList.add(on?'on':'off','play');
    setTimeout(()=>fx.classList.remove('play','on','off'),980);
  }

  function installModeButton(){
    const panel=document.getElementById('p-marcar');
    if(!panel)return;
    let btn=document.getElementById('toolsDoxaMode');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.id='toolsDoxaMode';
      btn.className='tool-card doxa-tool-mode-card';
      btn.setAttribute('aria-pressed','false');
      btn.innerHTML=`
        <span class="doxa-tool-mode-icon" aria-hidden="true"><img src="doxa_splash_icon.png" alt=""></span>
        <span class="tool-card-copy doxa-tool-mode-copy">
          <strong>Ferramenta Doxa</strong>
          <small>Revele no texto os versículos com conteúdo Doxa</small>
        </span>
        <span class="doxa-tool-mode-state" aria-hidden="true"></span>
        <span class="tool-card-arrow">›</span>`;
      const anchor=document.getElementById('toolsHighlightStart')||panel.firstElementChild;
      if(anchor)panel.insertBefore(btn,anchor); else panel.appendChild(btn);
      btn.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        setDoxaMode(!doxaModeActive,true);
      });
    }
    syncModeButton();
    syncToolCardVisibility();

    for(const id of ['toolsNotesView','toolsHighlightsView']){
      const el=document.getElementById(id);
      if(!el||el.dataset.doxaModeObserved)continue;
      el.dataset.doxaModeObserved='1';
      try{new MutationObserver(syncToolCardVisibility).observe(el,{attributes:true,attributeFilter:['hidden']})}catch(e){}
    }
  }

  function scheduleMarks(delay=40){
    clearTimeout(markTimer);
    markTimer=setTimeout(()=>markCurrentChapter(),delay);
  }

  async function markCurrentChapter(force=false){
    const seq=++markSequence;
    clearVerseMarks();
    if(!doxaModeActive)return;

    const base=currentNormalChapterRef();
    if(!base){
      if(seq===markSequence&&doxaModeActive)scheduleMarks(120);
      return;
    }

    try{
      const rows=await fetchChapter(base.book,base.chapter,force);
      if(seq!==markSequence||!doxaModeActive)return;

      const verses=new Set();
      for(const row of rows){
        if(!rowAppliesToVersion(row,base.sourceMode))continue;
        const start=Number(row.versiculo_inicio);
        const end=row.versiculo_fim==null?start:Number(row.versiculo_fim);
        if(!Number.isFinite(start)||!Number.isFinite(end))continue;
        for(let v=start;v<=end&&v<1000;v++)verses.add(v);
      }

      let hitIndex=0;
      document.querySelectorAll('#textBody .verse').forEach(el=>{
        const v=Number(el.dataset.v||String(el.id||'').replace(/^v/,''));
        if(!verses.has(v))return;
        el.classList.add('doxa-tool-hit','doxa-tool-hit-enter');
        el.setAttribute('data-doxa-tool-hit','1');
        el.style.setProperty('--doxa-hit-index',String(hitIndex++));
      });

      if(hitIndex){
        setTimeout(()=>{
          document.querySelectorAll('#textBody .verse.doxa-tool-hit-enter')
            .forEach(el=>el.classList.remove('doxa-tool-hit-enter'));
        },900);
      }
    }catch(e){
      /* Sem conexão: o modo permanece ativo e tenta de novo
         numa próxima renderização, sem quebrar o leitor. */
    }
  }

  function goToNormalBible(){
    try{
      if(typeof setParallelMode==='function'&&(window.parallelOn||document.body.classList.contains('parallel-mode'))){
        setParallelMode(false);
      }
    }catch(e){}
    try{window.openPanel?.('ler')}catch(e){
      try{openPanel('ler')}catch(_){}
    }
  }

  function setDoxaMode(on,fromTools=false){
    doxaModeActive=!!on;
    document.body.classList.toggle('doxa-tool-mode-active',doxaModeActive);
    syncModeButton();

    if(!doxaModeActive){
      ++markSequence;
      clearVerseMarks();
    }

    if(fromTools){
      goToNormalBible();
      setTimeout(()=>{
        playModeFx(doxaModeActive);
        if(doxaModeActive)markCurrentChapter();
      },95);
    }else if(doxaModeActive){
      markCurrentChapter();
    }
  }

  function installReaderModeHooks(){
    const textBody=document.getElementById('textBody');
    if(textBody&&!textBody.dataset.doxaModeObserved){
      textBody.dataset.doxaModeObserved='1';
      try{
        new MutationObserver(()=>{
          if(doxaModeActive)scheduleMarks(55);
        }).observe(textBody,{childList:true,subtree:true});
      }catch(e){}
    }

    document.addEventListener('click',e=>{
      if(!doxaModeActive)return;
      const target=e.target instanceof Element?e.target:null;
      const verse=target?.closest?.('#textBody .verse.doxa-tool-hit');
      if(!verse)return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      const ref=identityFromVerse(verse);
      if(ref)open(ref);
    },true);
  }

  function ensureCategoryStyles(){
    if(document.getElementById('doxaToolCategoryStyles'))return;
    const style=document.createElement('style');
    style.id='doxaToolCategoryStyles';
    style.textContent=`
      .doxa-tool-overview{
        display:flex;align-items:center;gap:7px;
        margin:0 0 13px;padding:0 2px 2px;
        color:var(--ink-faint,#777);
        font:650 10.5px/1.35 var(--ui,system-ui,sans-serif);
        letter-spacing:.025em;
      }
      .doxa-tool-overview i{
        width:4px;height:4px;flex:0 0 auto;border-radius:50%;
        background:color-mix(in srgb,var(--accent,#8c2f39) 58%,transparent);
      }
      .doxa-tool-categories{display:grid;gap:9px}
      .doxa-tool-category{
        --doxa-cat:var(--accent,#8c2f39);
        position:relative;overflow:hidden;
        border:1px solid color-mix(in srgb,var(--ink,#23262c) 8%,transparent);
        border-radius:18px;
        background:
          linear-gradient(135deg,color-mix(in srgb,var(--doxa-cat) 5%,transparent),transparent 42%),
          color-mix(in srgb,var(--paper,#e6e3da) 96%,var(--ink,#23262c) 4%);
        box-shadow:0 5px 18px rgba(0,0,0,.035);
        transition:border-color .24s ease,box-shadow .24s ease,background .24s ease;
      }
      .doxa-tool-category[data-type="destaque"]{--doxa-cat:#b98a35}
      .doxa-tool-category[data-type="idioma_original"]{--doxa-cat:#a3404c}
      .doxa-tool-category[data-type="texto_manuscritos"]{--doxa-cat:#7359a6}
      .doxa-tool-category[data-type="contexto_historico"]{--doxa-cat:#9a6536}
      .doxa-tool-category[data-type="arqueologia"]{--doxa-cat:#7b6848}
      .doxa-tool-category[data-type="tradicoes_antigas"]{--doxa-cat:#8b5f83}
      .doxa-tool-category[data-type="apocrifos"]{--doxa-cat:#8a6042}
      .doxa-tool-category[data-type="estrutura_literaria"]{--doxa-cat:#477b70}
      .doxa-tool-category[data-type="conexao"]{--doxa-cat:#526fa6}
      .doxa-tool-category[data-type="nota"]{--doxa-cat:var(--accent,#8c2f39)}
      .doxa-tool-category.is-open{
        border-color:color-mix(in srgb,var(--doxa-cat) 29%,transparent);
        box-shadow:0 11px 30px rgba(0,0,0,.06),
          inset 0 0 0 1px color-mix(in srgb,var(--doxa-cat) 5%,transparent);
      }
      .doxa-tool-category-toggle{
        width:100%;min-height:58px;display:grid;
        grid-template-columns:auto minmax(0,1fr) auto auto;
        align-items:center;gap:10px;
        padding:11px 13px;border:0;background:transparent;
        color:var(--ink,#23262c);text-align:left;
        -webkit-tap-highlight-color:transparent;
      }
      .doxa-tool-category-toggle:active{
        background:color-mix(in srgb,var(--doxa-cat) 5%,transparent);
      }
      .doxa-tool-category-mark{
        width:31px;height:31px;display:grid;place-items:center;
        border-radius:10px;
        background:color-mix(in srgb,var(--doxa-cat) 10%,transparent);
        box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--doxa-cat) 12%,transparent);
      }
      .doxa-tool-category-mark::before{
        content:"";width:8px;height:8px;border-radius:50%;
        background:var(--doxa-cat);
        box-shadow:0 0 12px color-mix(in srgb,var(--doxa-cat) 35%,transparent);
      }
      .doxa-tool-category-name{
        min-width:0;font:760 13px/1.2 var(--ui,system-ui,sans-serif);
        letter-spacing:.01em;
      }
      .doxa-tool-category-count{
        min-width:25px;height:25px;padding:0 8px;
        display:grid;place-items:center;border-radius:999px;
        color:color-mix(in srgb,var(--doxa-cat) 78%,var(--ink,#23262c));
        background:color-mix(in srgb,var(--doxa-cat) 8%,transparent);
        font:800 10px/1 var(--ui,system-ui,sans-serif);
      }
      .doxa-tool-category-chevron{
        width:22px;height:22px;position:relative;
        color:var(--ink-faint,#777);
        transition:transform .30s cubic-bezier(.2,.8,.2,1),color .22s ease;
      }
      .doxa-tool-category-chevron::before,
      .doxa-tool-category-chevron::after{
        content:"";position:absolute;top:10px;width:8px;height:1.5px;
        border-radius:2px;background:currentColor;
      }
      .doxa-tool-category-chevron::before{left:4px;transform:rotate(42deg)}
      .doxa-tool-category-chevron::after{right:4px;transform:rotate(-42deg)}
      .doxa-tool-category.is-open .doxa-tool-category-chevron{
        transform:rotate(180deg);color:var(--doxa-cat);
      }
      .doxa-tool-category-panel{
        display:grid;grid-template-rows:0fr;
        opacity:.30;
        transition:grid-template-rows .34s cubic-bezier(.22,.78,.22,1),opacity .24s ease;
      }
      .doxa-tool-category-panel-inner{min-height:0;overflow:hidden}
      .doxa-tool-category-content{
        padding:0 10px 10px;
        border-top:1px solid transparent;
        transition:border-color .22s ease,padding-top .28s ease;
      }
      .doxa-tool-category.is-open .doxa-tool-category-panel{grid-template-rows:1fr;opacity:1}
      .doxa-tool-category.is-open .doxa-tool-category-content{
        padding-top:10px;
        border-top-color:color-mix(in srgb,var(--doxa-cat) 10%,transparent);
      }
      .doxa-tool-category .doxa-tool-card{
        margin:0 0 9px;border-radius:16px;
        box-shadow:0 5px 16px rgba(0,0,0,.035);
        opacity:0;transform:translateY(-7px) scale(.994);
        animation:none;
      }
      .doxa-tool-category .doxa-tool-card:last-child{margin-bottom:0}
      .doxa-tool-category.is-open .doxa-tool-card{
        animation:doxa-tool-accordion-card-in .31s both cubic-bezier(.22,.78,.22,1);
        animation-delay:calc(var(--doxa-card-index) * 55ms + 70ms);
      }
      .doxa-tool-category .doxa-tool-card:before{background:var(--doxa-cat)}
      .doxa-tool-category .doxa-tool-type{color:var(--doxa-cat)}
      .doxa-tool-image-credit{
        margin:-2px 2px 12px;
        color:var(--ink-faint,#777);
        font:600 10px/1.45 var(--ui,system-ui,sans-serif);
        letter-spacing:.01em;
      }
      .doxa-tool-image-credit span{
        margin-right:5px;
        color:color-mix(in srgb,var(--ink-faint,#777) 78%,transparent);
        font-weight:750;
      }
      @keyframes doxa-tool-accordion-card-in{
        from{opacity:0;transform:translateY(-7px) scale(.994)}
        to{opacity:1;transform:none}
      }
      @media (prefers-reduced-motion:reduce){
        .doxa-tool-category,.doxa-tool-category-chevron,
        .doxa-tool-category-panel,.doxa-tool-category-content{transition:none}
        .doxa-tool-category.is-open .doxa-tool-card{
          animation:none;opacity:1;transform:none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createUi(){
    ensureCategoryStyles();
    if(document.getElementById('doxaToolSheet'))return;

    const backdrop=document.createElement('div');
    backdrop.id='doxaToolBackdrop';
    backdrop.className='doxa-tool-backdrop';

    const sheet=document.createElement('aside');
    sheet.id='doxaToolSheet';
    sheet.className='doxa-tool-sheet';
    sheet.setAttribute('aria-hidden','true');
    sheet.setAttribute('aria-label','Ferramenta Doxa');
    sheet.innerHTML=`
      <div class="doxa-tool-grab"></div>
      <div class="doxa-tool-head">
        <div class="doxa-tool-head-copy">
          <span>FERRAMENTA DOXA</span>
          <strong id="doxaToolTitle">Passagem</strong>
          <small id="doxaToolSubtitle">Camada editorial independente da tradução</small>
        </div>
        <button id="doxaToolClose" type="button" aria-label="Fechar">×</button>
      </div>
      <div class="doxa-tool-body" id="doxaToolBody"></div>
    `;
    document.body.append(backdrop,sheet);

    backdrop.addEventListener('click',close);
    sheet.querySelector('#doxaToolClose').addEventListener('click',close);
  }

  function close(){
    const sheet=document.getElementById('doxaToolSheet');
    const backdrop=document.getElementById('doxaToolBackdrop');
    sheet?.classList.remove('on');
    backdrop?.classList.remove('on');
    sheet?.setAttribute('aria-hidden','true');
    document.body.classList.remove('doxa-tool-open');
  }

  function openShell(ref){
    createUi();
    const sheet=document.getElementById('doxaToolSheet');
    const backdrop=document.getElementById('doxaToolBackdrop');
    document.getElementById('doxaToolTitle').textContent=ref.label;
    document.getElementById('doxaToolSubtitle').textContent='Disponível em qualquer versão bíblica desta referência';
    document.getElementById('doxaToolBody').innerHTML=`
      <div class="doxa-tool-loading">
        <i></i>
        <strong>Consultando a Ferramenta Doxa…</strong>
        <span>Buscando conteúdo editorial para ${esc(ref.label)}.</span>
      </div>`;
    backdrop.classList.add('on');
    sheet.classList.add('on');
    sheet.setAttribute('aria-hidden','false');
    document.body.classList.add('doxa-tool-open');
  }

  async function sbRows(path){
    const r=await fetch(SB_URL+path,{
      headers:{apikey:SB_KEY},
      cache:'no-store'
    });
    if(!r.ok)throw new Error('HTTP '+r.status);
    const data=await r.json();
    return Array.isArray(data)?data:[];
  }

  async function fetchChapter(book,chapter,force=false){
    const key=String(book)+':'+Number(chapter);
    const old=cache.get(key);
    if(!force&&old&&Date.now()-old.at<CACHE_MS)return old.rows;

    const fields='id,livro,capitulo,versiculo_inicio,versiculo_fim,tipo,titulo,subtitulo,texto,fonte,fonte_url,imagem_url,imagem_fonte,versoes,ordem,criado_em';

    // Referência principal (estrutura antiga, continua funcionando).
    const mainPath='/rest/v1/ferramenta_doxa?select='+fields+
      '&livro=eq.'+encodeURIComponent(book)+
      '&capitulo=eq.'+Number(chapter)+
      '&publicado=eq.true&order=ordem.asc,criado_em.asc';

    // Referências adicionais da mesma nota.
    const linkedSelect='livro,capitulo,versiculo_inicio,versiculo_fim,conteudo:ferramenta_doxa!inner('+fields+',publicado)';
    const linkedPath='/rest/v1/ferramenta_doxa_referencias?select='+encodeURIComponent(linkedSelect)+
      '&livro=eq.'+encodeURIComponent(book)+
      '&capitulo=eq.'+Number(chapter)+
      '&conteudo.publicado=eq.true';

    const [mainResult,linkedResult]=await Promise.allSettled([
      sbRows(mainPath),
      sbRows(linkedPath)
    ]);

    if(mainResult.status==='rejected'&&linkedResult.status==='rejected'){
      throw mainResult.reason||linkedResult.reason||new Error('Falha ao consultar a Ferramenta Doxa');
    }

    const merged=[];

    if(mainResult.status==='fulfilled')merged.push(...mainResult.value);

    if(linkedResult.status==='fulfilled'){
      for(const refRow of linkedResult.value){
        const content=refRow?.conteudo;
        if(!content)continue;
        merged.push({
          ...content,
          livro:refRow.livro,
          capitulo:Number(refRow.capitulo),
          versiculo_inicio:Number(refRow.versiculo_inicio),
          versiculo_fim:refRow.versiculo_fim==null?null:Number(refRow.versiculo_fim)
        });
      }
    }

    const seen=new Set(),rows=[];
    for(const row of merged){
      const start=Number(row.versiculo_inicio);
      const end=row.versiculo_fim==null?start:Number(row.versiculo_fim);
      const signature=String(row.id)+'|'+start+'|'+end;
      if(seen.has(signature))continue;
      seen.add(signature);
      rows.push(row);
    }

    rows.sort((a,b)=>{
      const byOrder=(Number(a.ordem)||0)-(Number(b.ordem)||0);
      if(byOrder)return byOrder;
      return String(a.criado_em||'').localeCompare(String(b.criado_em||''));
    });

    cache.set(key,{at:Date.now(),rows});
    return rows;
  }

  function rowsForRef(rows,ref){
    const out=[],seen=new Set();
    for(const x of rows){
      const start=Number(x.versiculo_inicio);
      const end=x.versiculo_fim==null?start:Number(x.versiculo_fim);
      if(!(ref.verse>=start&&ref.verse<=end))continue;
      if(Array.isArray(x.versoes)&&x.versoes.length&&!x.versoes.includes(ref.sourceMode))continue;
      if(seen.has(x.id))continue;
      seen.add(x.id);
      out.push(x);
    }
    return out;
  }

  function textHtml(text){
    return String(text||'')
      .split(/\n{2,}/)
      .map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>')
      .join('');
  }

  function render(ref,rows){
    const body=document.getElementById('doxaToolBody');
    if(!body)return;

    if(!rows.length){
      body.innerHTML=`
        <div class="doxa-tool-empty">
          <img class="doxa-tool-empty-icon" src="doxa_splash_icon.png" alt="" aria-hidden="true">
          <strong>Ainda não há conteúdo Doxa para esta passagem.</strong>
        </div>`;
      return;
    }

    const grouped=new Map();
    for(const row of rows){
      const type=TYPE_LABELS[row.tipo]?row.tipo:'nota';
      if(!grouped.has(type))grouped.set(type,[]);
      grouped.get(type).push(row);
    }

    const orderedTypes=[
      ...TYPE_ORDER.filter(type=>grouped.has(type)),
      ...[...grouped.keys()].filter(type=>!TYPE_ORDER.includes(type))
    ];

    const contentCount=rows.length;
    const categoryCount=orderedTypes.length;
    const contentWord=contentCount===1?'conteúdo Doxa':'conteúdos Doxa';
    const categoryWord=categoryCount===1?'categoria':'categorias';

    const cardHtml=(x,i)=>{
      const type=TYPE_LABELS[x.tipo]||TYPE_LABELS.nota;
      const url=safeUrl(x.fonte_url);
      const img=safeUrl(x.imagem_url);
      const source=x.fonte?`<div class="doxa-tool-source"><span>Fonte</span><strong>${esc(x.fonte)}</strong>${url?`<a href="${esc(url)}" target="_blank" rel="noopener">Abrir fonte ↗</a>`:''}</div>`:'';
      const imageCredit=x.imagem_fonte?`<div class="doxa-tool-image-credit"><span>Fonte da imagem</span>${esc(x.imagem_fonte)}</div>`:'';
      const image=img?`<img class="doxa-tool-image" src="${esc(img)}" alt="" loading="lazy">${imageCredit}`:'';
      return `
        <article class="doxa-tool-card type-${esc(x.tipo||'nota')}" style="--doxa-card-index:${i}">
          <div class="doxa-tool-card-top">
            <span class="doxa-tool-type">${esc(type)}</span>
            <span class="doxa-tool-index">${String(i+1).padStart(2,'0')}</span>
          </div>
          <h3>${esc(x.titulo||'Ferramenta Doxa')}</h3>
          ${x.subtitulo?`<div class="doxa-tool-card-sub">${esc(x.subtitulo)}</div>`:''}
          ${image}
          <div class="doxa-tool-text">${textHtml(x.texto)}</div>
          ${source}
        </article>`;
    };

    body.innerHTML=`
      <div class="doxa-tool-overview">
        <span>${contentCount} ${contentWord}</span>
        <i aria-hidden="true"></i>
        <span>${categoryCount} ${categoryWord}</span>
      </div>
      <div class="doxa-tool-categories">
        ${orderedTypes.map(type=>{
          const items=grouped.get(type)||[];
          const label=TYPE_LABELS[type]||TYPE_LABELS.nota;
          const id='doxa-cat-'+String(type).replace(/[^a-z0-9_-]/gi,'-');
          return `
            <section class="doxa-tool-category" data-type="${esc(type)}">
              <button class="doxa-tool-category-toggle" type="button"
                aria-expanded="false" aria-controls="${esc(id)}">
                <span class="doxa-tool-category-mark" aria-hidden="true"></span>
                <span class="doxa-tool-category-name">${esc(label)}</span>
                <span class="doxa-tool-category-count">${items.length}</span>
                <span class="doxa-tool-category-chevron" aria-hidden="true"></span>
              </button>
              <div class="doxa-tool-category-panel" id="${esc(id)}" aria-hidden="true">
                <div class="doxa-tool-category-panel-inner">
                  <div class="doxa-tool-category-content">
                    ${items.map((x,i)=>cardHtml(x,i)).join('')}
                  </div>
                </div>
              </div>
            </section>`;
        }).join('')}
      </div>`;

    const sections=[...body.querySelectorAll('.doxa-tool-category')];
    const setOpen=(section,on)=>{
      section.classList.toggle('is-open',on);
      const button=section.querySelector('.doxa-tool-category-toggle');
      const panel=section.querySelector('.doxa-tool-category-panel');
      button?.setAttribute('aria-expanded',on?'true':'false');
      panel?.setAttribute('aria-hidden',on?'false':'true');
    };

    body.querySelectorAll('.doxa-tool-category-toggle').forEach(button=>{
      button.addEventListener('click',()=>{
        const section=button.closest('.doxa-tool-category');
        if(!section)return;
        const willOpen=!section.classList.contains('is-open');

        for(const other of sections){
          if(other!==section)setOpen(other,false);
        }
        setOpen(section,willOpen);
      });
    });
  }

  function renderError(ref){
    const body=document.getElementById('doxaToolBody');
    if(!body)return;
    body.innerHTML=`
      <div class="doxa-tool-empty error">
        <div class="doxa-tool-empty-mark">!</div>
        <strong>Não foi possível carregar agora.</strong>
        <p>A Ferramenta Doxa precisa de conexão para buscar conteúdo novo. O restante do leitor continua funcionando normalmente.</p>
        <button id="doxaToolRetry" type="button">Tentar novamente</button>
      </div>`;
    document.getElementById('doxaToolRetry')?.addEventListener('click',()=>load(ref,true));
  }

  async function load(ref,force=false){
    try{
      const rows=await fetchChapter(ref.book,ref.chapter,force);
      if(!document.getElementById('doxaToolSheet')?.classList.contains('on'))return;
      render(ref,rowsForRef(rows,ref));
    }catch(e){
      if(document.getElementById('doxaToolSheet')?.classList.contains('on'))renderError(ref);
    }
  }

  async function open(ref){
    if(!ref)return;
    try{window.DoxaVerseActions?.close?.()}catch(e){}
    openShell(ref);
    load(ref);
  }

  function removeLegacyContextButton(){
    document.querySelectorAll('#verseActions [data-doxa-tool]').forEach(el=>el.remove());
    cleanseVerseActions();
  }

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById('doxaToolSheet')?.classList.contains('on')){
      e.preventDefault();
      close();
    }
  });

  function init(){
    removeLegacyContextButton();
    installModeButton();
    installReaderModeHooks();
    createModeFx();
    syncModeButton();

    const verseActions=document.getElementById('verseActions');
    if(verseActions&&'MutationObserver' in window){
      try{new MutationObserver(removeLegacyContextButton).observe(verseActions,{childList:true,subtree:true})}catch(e){}
    }

    setTimeout(removeLegacyContextButton,350);
    setTimeout(()=>{installModeButton();syncToolCardVisibility()},500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.DoxaTool={
    open,
    close,
    clearCache(){cache.clear()},
    setMode(on){setDoxaMode(!!on,false)},
    toggleMode(){setDoxaMode(!doxaModeActive,false);return doxaModeActive},
    isModeActive(){return doxaModeActive},
    refreshMarks(){return markCurrentChapter(true)},
    refreshCurrent(){
      const ref=currentRef();
      if(ref){openShell(ref);load(ref,true)}
    }
  };
})();
