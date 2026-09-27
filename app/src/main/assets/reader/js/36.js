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
      if(dataVa==='interlinear'||banned.some(x=>txt.includes(x))){
        el.remove();
      }
    });
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

  function installButton(){
    const pop=document.getElementById('verseActions');
    if(!pop)return;
    cleanseVerseActions();
    if(pop.querySelector('[data-doxa-tool]'))return;

    const btn=document.createElement('button');
    btn.type='button';
    btn.setAttribute('data-doxa-tool','1');
    btn.innerHTML=`
      <span class="va-icon doxa-tool-va-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M6.5 4.5h6.2c3.2 0 5.8 2.6 5.8 5.8v3.4c0 3.2-2.6 5.8-5.8 5.8H6.5z"/>
          <path d="M10 8v8"/>
          <path d="M10 8h2.3c2 0 3.4 1.5 3.4 4s-1.4 4-3.4 4H10"/>
        </svg>
      </span>
      <span class="va-label">Ferramenta Doxa</span>
      <span class="va-chevron">›</span>`;

    const copy=pop.querySelector('[data-va="copy"]');
    if(copy)pop.insertBefore(btn,copy);
    else pop.appendChild(btn);

    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      const ref=currentRef();
      if(ref)open(ref);
    });
  }

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById('doxaToolSheet')?.classList.contains('on')){
      e.preventDefault();
      close();
    }
  });

  installButton();
  cleanseVerseActions();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installButton();cleanseVerseActions()},{once:true});

  const verseActions=document.getElementById('verseActions');
  if(verseActions&&'MutationObserver' in window){
    try{new MutationObserver(()=>cleanseVerseActions()).observe(verseActions,{childList:true,subtree:true})}catch(e){}
  }

  window.DoxaTool={
    open,
    close,
    clearCache(){cache.clear()},
    refreshCurrent(){
      const ref=currentRef();
      if(ref){openShell(ref);load(ref,true)}
    }
  };
})();
