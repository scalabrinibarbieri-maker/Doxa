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
    estrutura_literaria:'Estrutura literária',
    texto_manuscritos:'Texto & manuscritos',
    conexao:'Conexões',
    destaque:'Destaque Doxa'
  };

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
    setTimeout(()=>fx.classList.remove('play','on','off'),760);
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
      },70);
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

  function createUi(){
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

  async function fetchChapter(book,chapter,force=false){
    const key=String(book)+':'+Number(chapter);
    const old=cache.get(key);
    if(!force&&old&&Date.now()-old.at<CACHE_MS)return old.rows;

    const fields='id,livro,capitulo,versiculo_inicio,versiculo_fim,tipo,titulo,subtitulo,texto,fonte,fonte_url,imagem_url,versoes,ordem,criado_em';
    const path='/rest/v1/ferramenta_doxa?select='+fields+
      '&livro=eq.'+encodeURIComponent(book)+
      '&capitulo=eq.'+Number(chapter)+
      '&publicado=eq.true&order=ordem.asc,criado_em.asc';

    const r=await fetch(SB_URL+path,{
      headers:{apikey:SB_KEY},
      cache:'no-store'
    });
    if(!r.ok)throw new Error('HTTP '+r.status);
    const rows=await r.json();
    cache.set(key,{at:Date.now(),rows:Array.isArray(rows)?rows:[]});
    return cache.get(key).rows;
  }

  function rowsForRef(rows,ref){
    return rows.filter(x=>{
      const start=Number(x.versiculo_inicio);
      const end=x.versiculo_fim==null?start:Number(x.versiculo_fim);
      if(!(ref.verse>=start&&ref.verse<=end))return false;
      if(Array.isArray(x.versoes)&&x.versoes.length&&!x.versoes.includes(ref.sourceMode))return false;
      return true;
    });
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

    body.innerHTML=rows.map((x,i)=>{
      const type=TYPE_LABELS[x.tipo]||TYPE_LABELS.nota;
      const url=safeUrl(x.fonte_url);
      const img=safeUrl(x.imagem_url);
      const source=x.fonte?`<div class="doxa-tool-source"><span>Fonte</span><strong>${esc(x.fonte)}</strong>${url?`<a href="${esc(url)}" target="_blank" rel="noopener">Abrir fonte ↗</a>`:''}</div>`:'';
      const image=img?`<img class="doxa-tool-image" src="${esc(img)}" alt="" loading="lazy">`:'';
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
    }).join('');
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
