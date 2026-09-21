(()=>{
  'use strict';
  if(window.__doxa31ToolsInstalled)return;
  window.__doxa31ToolsInstalled=true;

  const $=s=>document.querySelector(s);
  const stop=e=>e.stopPropagation();

  /* =========================================================
     Ferramentas limpas + Leitura paralela
     ========================================================= */
  function installTools(){
    const panel=document.getElementById('p-marcar');
    const notes=document.getElementById('toolsNotesBtn');
    const notesView=document.getElementById('toolsNotesView');
    if(!panel||!notes)return;

    const head=panel.querySelector(':scope>.tools-head');
    if(head)head.hidden=true;

    const info=panel.querySelector(':scope>.v20-tools-pack');
    if(info)info.hidden=true;

    /* js/06 espera esta âncora ao abrir/fechar Notas. */
    if(!panel.querySelector('.tool-coming')){
      const compat=document.createElement('div');
      compat.className='tool-coming';
      compat.hidden=true;
      panel.appendChild(compat);
    }

    const noteCopy=notes.querySelector('.tool-card-copy small');
    if(noteCopy)noteCopy.textContent='Suas anotações';

    if(!document.getElementById('doxa31ParallelTool')){
      const btn=document.createElement('button');
      btn.type='button';
      btn.id='doxa31ParallelTool';
      btn.className='doxa31-parallel-tool';
      btn.innerHTML='\
        <span class="doxa31-tool-icon" aria-hidden="true">\
          <svg viewBox="0 0 24 24"><path d="M3.5 5.5h7v13h-7z"/><path d="M13.5 5.5h7v13h-7z"/><path d="M7 9h0"/><path d="M17 9h0"/></svg>\
        </span>\
        <span class="doxa31-tool-copy"><strong>Leitura paralela</strong><small>Abra duas versões lado a lado</small></span>\
        <span class="doxa31-tool-arrow">›</span>';
      notes.insertAdjacentElement('afterend',btn);

      const openSecondVersion=()=>{
        try{
          /* O seletor oficial já sabe carregar todas as versões locais.
             Abrimos a escolha do painel B ANTES de ativar a segunda janela. */
          window.__doxa31ParallelPending=true;
          const trigger=document.getElementById('pVersionTriggerB');
          if(trigger){
            trigger.click();
            return;
          }
          /* Fallback seguro. */
          openPanel('ler');
          setParallelMode(true);
        }catch(e){
          try{openPanel('ler');setParallelMode(true)}catch(_){}
        }
      };

      ['touchstart','touchmove','touchend','pointerdown','pointerup'].forEach(type=>{
        btn.addEventListener(type,stop,{passive:true});
      });
      btn.addEventListener('click',e=>{e.stopPropagation();openSecondVersion()});
    }

    /* Quando a versão B é escolhida pelo picker oficial, abre a segunda janela. */
    const versionB=document.getElementById('pVersionB');
    if(versionB&&!versionB.dataset.doxa31ToolsBound){
      versionB.dataset.doxa31ToolsBound='1';
      versionB.addEventListener('change',()=>{
        if(!window.__doxa31ParallelPending)return;
        window.__doxa31ParallelPending=false;
        setTimeout(()=>{
          try{
            openPanel('ler');
            setParallelMode(true);
          }catch(e){}
        },0);
      });
    }

    /* Fechar o picker sem escolher cancela a intenção. */
    for(const el of [document.getElementById('versionPickerClose'),document.getElementById('versionPickerBackdrop')]){
      if(!el||el.dataset.doxa31PendingBound)continue;
      el.dataset.doxa31PendingBound='1';
      el.addEventListener('click',()=>{window.__doxa31ParallelPending=false},true);
    }

    /* Na tela de Notas, deixa apenas as notas; ao voltar, mostra a Paralela de novo. */
    const parallelBtn=document.getElementById('doxa31ParallelTool');
    if(notesView&&parallelBtn){
      const syncVisibility=()=>{parallelBtn.hidden=!notesView.hidden};
      syncVisibility();
      new MutationObserver(syncVisibility).observe(notesView,{attributes:true,attributeFilter:['hidden']});
    }
  }

  /* =========================================================
     Ajuda em Ajustes — recebe as explicações removidas de Ferramentas
     ========================================================= */
  function installHelp(){
    const settings=document.getElementById('p-ajustes');
    if(!settings||document.getElementById('doxa31HelpCard'))return;

    const card=document.createElement('button');
    card.type='button';
    card.id='doxa31HelpCard';
    card.className='doxa31-help-card';
    card.innerHTML='\
      <span class="doxa31-help-card-icon">?</span>\
      <span class="doxa31-help-card-copy"><strong>Ajuda</strong><small>Como usar leitura, estudo e ferramentas</small></span>\
      <span class="doxa31-help-card-arrow">›</span>';

    const offlineTitle=[...settings.querySelectorAll(':scope>h2')].find(h=>/Recursos offline/i.test(h.textContent||''));
    if(offlineTitle)offlineTitle.insertAdjacentElement('beforebegin',card);
    else settings.appendChild(card);

    const backdrop=document.createElement('div');
    backdrop.className='doxa31-help-backdrop';
    backdrop.id='doxa31HelpBackdrop';

    const sheet=document.createElement('aside');
    sheet.className='doxa31-help-sheet';
    sheet.id='doxa31HelpSheet';
    sheet.setAttribute('aria-hidden','true');
    sheet.innerHTML='\
      <div class="doxa31-sheet-grab"></div>\
      <div class="doxa31-help-head"><strong>Ajuda</strong><button type="button" id="doxa31HelpClose" aria-label="Fechar">×</button></div>\
      <p class="doxa31-help-intro">Orientações de leitura e estudo ficam reunidas aqui, sem poluir a aba Ferramentas.</p>\
      <div class="doxa31-help-content" id="doxa31HelpContent"></div>';

    document.body.append(backdrop,sheet);

    const content=document.getElementById('doxa31HelpContent');
    const oldInfo=document.querySelector('#p-marcar>.v20-tools-pack');
    if(oldInfo){
      const clone=oldInfo.cloneNode(true);
      clone.hidden=false;
      content.appendChild(clone);
    }

    const quick=document.createElement('div');
    quick.className='v20-tools-pack';
    quick.innerHTML='<div class="v20-tools-title"><strong>Leitura</strong><small>Toque no texto para alternar o HUD. Pressione um versículo para abrir as ferramentas contextuais.</small></div>';
    content.prepend(quick);

    const open=()=>{
      backdrop.classList.add('on');
      sheet.classList.add('on');
      sheet.setAttribute('aria-hidden','false');
    };
    const close=()=>{
      backdrop.classList.remove('on');
      sheet.classList.remove('on');
      sheet.setAttribute('aria-hidden','true');
    };

    card.addEventListener('click',open);
    backdrop.addEventListener('click',close);
    document.getElementById('doxa31HelpClose')?.addEventListener('click',close);
  }

  /* =========================================================
     Menu contextual do verso — ícones SVG + fumaça v4
     ========================================================= */
  const ICONS={
    xref:'<svg viewBox="0 0 24 24"><path d="M6 7h4v4"/><path d="M18 17h-4v-4"/><path d="M10 11 6 7"/><path d="M14 13l4 4"/><path d="M14 7h4v4"/><path d="M10 17H6v-4"/><path d="M14 11l4-4"/><path d="M10 13l-4 4"/></svg>',
    exegete:'<svg viewBox="0 0 24 24"><path d="M4 7.5c2-.7 3.9-.7 6 0v12c-2.1-.7-4-.7-6 0z"/><path d="M20 7.5c-2-.7-3.9-.7-6 0v12c2.1-.7 4-.7 6 0z"/><path d="M10 8.5h4"/><path d="M12 6v5"/></svg>',
    interlinear:'<svg viewBox="0 0 24 24"><path d="M5 6.5h14"/><path d="M5 12h14"/><path d="M5 17.5h14"/><path d="M8 9.2h8"/><path d="M8 14.8h8"/></svg>',
    compare:'<svg viewBox="0 0 24 24"><path d="M7 7h10v10H7z"/><path d="M4 4h10v10"/><path d="M14 10h4"/><path d="M16 8l2 2-2 2"/></svg>',
    comments:'<svg viewBox="0 0 24 24"><path d="M5 6h14v10H9l-4 3z"/><path d="M8 10h8"/><path d="M8 13h5"/></svg>',
    crit:'<svg viewBox="0 0 24 24"><path d="M7 5h10v14H7z"/><path d="M9.5 9h5"/><path d="M9.5 12h5"/><path d="M9.5 15h3"/><path d="M16.5 15l2 2"/><path d="M18.5 15l-2 2"/></svg>',
    entities:'<svg viewBox="0 0 24 24"><path d="M12 21s-5-4.6-5-9a5 5 0 1 1 10 0c0 4.4-5 9-5 9z"/><circle cx="12" cy="11" r="1.8"/></svg>',
    copy:'<svg viewBox="0 0 24 24"><path d="M9 9h10v11H9z"/><path d="M5 5h10v11"/></svg>'
  };
  const LABELS={
    xref:'Referências Cruzadas',
    exegete:'Guia Exegético',
    interlinear:'Interlinear',
    compare:'Comparar Versos',
    comments:'Comentários',
    crit:'Crítica Textual',
    entities:'Pessoas e Lugares',
    copy:'Copiar Verso'
  };

  function decorateActions(){
    const pop=document.getElementById('verseActions');
    if(!pop)return;
    pop.querySelectorAll('[data-va]').forEach(btn=>{
      const a=btn.dataset.va;
      if(!ICONS[a])return;
      btn.innerHTML='<span class="doxa31-va-icon">'+ICONS[a]+'</span><span class="doxa31-va-label">'+LABELS[a]+'</span><span class="doxa31-va-chevron">›</span>';
    });
  }

  function injectSelection(verse){
    if(!verse||verse.querySelector(':scope>.doxa31-verse-smoke'))return;

    const smoke=document.createElement('span');
    smoke.className='doxa31-verse-smoke';
    smoke.setAttribute('aria-hidden','true');
    smoke.innerHTML='\
      <span class="doxa31-smoke-puff p1"></span>\
      <span class="doxa31-smoke-puff p2"></span>\
      <span class="doxa31-smoke-puff p3"></span>\
      <span class="doxa31-smoke-puff p4"></span>\
      <span class="doxa31-smoke-vein"></span>';

    const left=document.createElement('span');
    left.className='doxa31-handle left';
    left.setAttribute('aria-hidden','true');

    const right=document.createElement('span');
    right.className='doxa31-handle right';
    right.setAttribute('aria-hidden','true');

    verse.prepend(smoke,left,right);
  }

  function clearSelectionFx(){
    document.body.classList.remove('doxa31-verse-menu-open');
    document.getElementById('doxa31VerseBackdrop')?.classList.remove('on');
    document.querySelectorAll('.doxa31-verse-smoke,.doxa31-handle').forEach(x=>x.remove());
  }

  function keepVerseVisible(verse){
    const pop=document.getElementById('verseActions');
    if(!verse||!pop)return;
    requestAnimationFrame(()=>{
      const h=pop.offsetHeight||470;
      const limit=Math.max(120,window.innerHeight-h-14);
      const r=verse.getBoundingClientRect();
      if(r.bottom>limit){
        const delta=r.bottom-limit+12;
        window.scrollBy({top:delta,behavior:'smooth'});
      }else if(r.top<82){
        window.scrollBy({top:r.top-96,behavior:'smooth'});
      }
    });
  }

  function installVerseMenu(){
    const pop=document.getElementById('verseActions');
    if(!pop)return;
    decorateActions();

    if(!document.getElementById('doxa31VerseBackdrop')){
      const backdrop=document.createElement('div');
      backdrop.id='doxa31VerseBackdrop';
      backdrop.className='doxa31-verse-backdrop';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click',()=>window.DoxaVerseActions?.close());
    }

    const sync=()=>{
      if(pop.classList.contains('on')){
        const verse=document.querySelector('.verse-context');
        if(!verse)return;
        document.body.classList.add('doxa31-verse-menu-open');
        document.getElementById('doxa31VerseBackdrop')?.classList.add('on');
        injectSelection(verse);
        keepVerseVisible(verse);
      }else{
        clearSelectionFx();
      }
    };

    new MutationObserver(sync).observe(pop,{attributes:true,attributeFilter:['class']});
    sync();
  }


  /* =========================================================
     Leitura paralela v4 — duas colunas reais
     ========================================================= */
  function installParallelV4(){
    const reader=document.getElementById('parallelReader');
    const appbar=reader?.querySelector('.parallel-appbar');
    if(!reader||!appbar)return;

    if(!document.getElementById('doxa31ParallelSyncBar')){
      const syncbar=document.createElement('div');
      syncbar.id='doxa31ParallelSyncBar';
      syncbar.className='doxa31-parallel-syncbar';
      syncbar.innerHTML='<button type="button" id="doxa31ParallelSync" class="doxa31-sync-toggle"><span class="doxa31-sync-dot"></span><span id="doxa31SyncLabel">Sincronizado</span></button>';

      const controls=document.createElement('div');
      controls.id='doxa31ParallelControls';
      controls.className='doxa31-parallel-controls';

      for(const side of ['A','B']){
        const combo=document.createElement('div');
        combo.className='doxa31-parallel-combo';
        combo.dataset.side=side;
        combo.innerHTML='\
          <button type="button" class="doxa31-parallel-passage" data-d31-passage="'+side+'"><span class="doxa31-combo-ref">—</span></button>\
          <button type="button" class="doxa31-parallel-version" data-d31-version="'+side+'"><span class="doxa31-combo-version">—</span><span class="doxa31-combo-chevron">⌄</span></button>';
        controls.appendChild(combo);
      }

      appbar.insertAdjacentElement('afterend',syncbar);
      syncbar.insertAdjacentElement('afterend',controls);

      controls.querySelectorAll('[data-d31-passage]').forEach(b=>b.addEventListener('click',e=>{
        e.stopPropagation();
        document.getElementById('pPassage'+b.dataset.d31Passage)?.click();
      }));
      controls.querySelectorAll('[data-d31-version]').forEach(b=>b.addEventListener('click',e=>{
        e.stopPropagation();
        document.getElementById('pVersionTrigger'+b.dataset.d31Version)?.click();
      }));

      document.getElementById('doxa31ParallelSync')?.addEventListener('click',e=>{
        e.stopPropagation();
        const cb=document.getElementById('parallelSync');
        if(!cb)return;
        cb.checked=!cb.checked;
        cb.dispatchEvent(new Event('change',{bubbles:true}));
        setTimeout(updateParallelV4,0);
      });
    }

    const base=window.renderParallel;
    if(typeof base==='function'&&!base.__doxa31v4){
      const wrapped=function(){
        const r=base.apply(this,arguments);
        setTimeout(updateParallelV4,0);
        return r;
      };
      wrapped.__doxa31v4=true;
      window.renderParallel=wrapped;
    }
    updateParallelV4();
  }

  function updateParallelV4(){
    const cb=document.getElementById('parallelSync');
    const synced=!!cb?.checked;
    const sync=document.getElementById('doxa31ParallelSync');
    sync?.classList.toggle('off',!synced);
    sync?.setAttribute('aria-pressed',synced?'true':'false');
    const sl=document.getElementById('doxa31SyncLabel');
    if(sl)sl.textContent=synced?'Sincronizado':'Livre';

    let titleRef='';
    for(const side of ['A','B']){
      const passage=document.querySelector('[data-d31-passage="'+side+'"] .doxa31-combo-ref');
      const version=document.querySelector('[data-d31-version="'+side+'"] .doxa31-combo-version');
      const ptxt=document.querySelector('#pPassage'+side+' span:first-child')?.textContent?.trim()||'—';
      const vtxt=document.getElementById('pVersionName'+side)?.textContent?.trim()||
                 document.getElementById('pVersion'+side)?.selectedOptions?.[0]?.textContent?.trim()||'—';
      if(passage)passage.textContent=ptxt;
      if(version)version.textContent=vtxt;
      if(side==='A')titleRef=ptxt;
    }
    const titleSmall=document.querySelector('.parallel-appbar-title small');
    if(titleSmall)titleSmall.textContent=titleRef||'Leitura em duas versões';
  }

  /* =========================================================
     Contexto temporário para recursos de verso na paralela.
     O motor antigo calcula a referência usando mode/pos().
     Durante o menu, apontamos temporariamente para o painel
     pressionado e restauramos tudo ao fechar.
     ========================================================= */
  let parallelContextRestore=null;

  function enterParallelVerseContext(side,verse){
    try{
      const st=sanitizeParallelState(side);
      if(!st||st.mode==='hyper'||!CORPORA[st.mode])return false;

      if(parallelContextRestore)parallelContextRestore();

      const targetMode=st.mode;
      const previousMode=mode;
      const previousHIdx=hIdx;
      const previousFocus=focusVerse;
      const previousPosition=positions[targetMode] ? {...positions[targetMode]} : null;

      const cp=CORPORA[targetMode];
      const bi=cp.books.findIndex(b=>b.book===st.book);
      if(bi<0)return false;

      mode=targetMode;
      positions[targetMode]={b:bi,c:Number(st.chapter)};
      focusVerse=Number(verse)||null;

      /* Garante que Referências Cruzadas tenha um alvo clicável
         mesmo que a leitura principal esteja em outro capítulo. */
      const textBody=document.getElementById('textBody');
      const v=Number(verse);
      if(textBody && Number.isFinite(v) && !document.getElementById('v'+v)){
        const shadow=document.createElement('span');
        shadow.id='v'+v;
        shadow.className='verse doxa31-shadow-verse';
        shadow.dataset.v=String(v);
        shadow.hidden=true;
        textBody.appendChild(shadow);
      }

      let restored=false;
      parallelContextRestore=()=>{
        if(restored)return;
        restored=true;
        mode=previousMode;
        hIdx=previousHIdx;
        focusVerse=previousFocus;
        if(previousPosition)positions[targetMode]=previousPosition;
        else delete positions[targetMode];
        parallelContextRestore=null;
      };
      return true;
    }catch(e){
      return false;
    }
  }

  function maybeRestoreParallelContext(){
    if(!parallelContextRestore)return;
    const popOpen=document.getElementById('verseActions')?.classList.contains('on');
    const xrefOpen=document.getElementById('xrefSheet')?.classList.contains('on');
    if(!popOpen&&!xrefOpen)parallelContextRestore();
  }

  function bindParallelContextRestore(){
    for(const el of [document.getElementById('verseActions'),document.getElementById('xrefSheet')]){
      if(!el||el.dataset.doxa31RestoreBound==='1')continue;
      el.dataset.doxa31RestoreBound='1';
      new MutationObserver(()=>setTimeout(maybeRestoreParallelContext,0))
        .observe(el,{attributes:true,attributeFilter:['class']});
    }
  }

  /* =========================================================
     Long press também nas duas colunas da leitura paralela
     ========================================================= */
  function installParallelLongPress(){
    bindParallelContextRestore();

    for(const side of ['A','B']){
      const host=document.getElementById('pText'+side);
      if(!host||host.dataset.doxa31LongPress==='1')continue;
      host.dataset.doxa31LongPress='1';

      let timer=0,startX=0,startY=0,target=null,fired=false;

      const reset=()=>{
        clearTimeout(timer);
        timer=0;target=null;fired=false;
      };

      host.addEventListener('touchstart',e=>{
        if(e.touches.length!==1)return;
        const verse=e.target.closest('.verse[data-v]');
        if(!verse)return;

        const t=e.touches[0];
        clearTimeout(timer);
        startX=t.clientX;
        startY=t.clientY;
        target=verse;
        fired=false;

        timer=setTimeout(()=>{
          if(!target)return;
          const v=Number(target.dataset.v);
          if(!enterParallelVerseContext(side,v))return;
          fired=true;
          window.__doxaLongPressActive=true;
          try{navigator.vibrate?.(18)}catch(_){}
          window.DoxaVerseActions?.open(target);
          setTimeout(()=>{window.__doxaLongPressActive=false},700);
        },430);
      },{passive:true});

      host.addEventListener('touchmove',e=>{
        if(!target||e.touches.length!==1)return;
        const t=e.touches[0];
        if(Math.hypot(t.clientX-startX,t.clientY-startY)>13&&!fired)reset();
      },{passive:true});

      host.addEventListener('touchend',()=>{
        clearTimeout(timer);timer=0;target=null;fired=false;
      },{passive:true});
      host.addEventListener('touchcancel',reset,{passive:true});

      host.addEventListener('scroll',()=>{
        if(document.getElementById('verseActions')?.classList.contains('on')){
          window.DoxaVerseActions?.close();
        }
      },{passive:true});
    }
  }

  function init(){
    installTools();
    installHelp();
    installVerseMenu();
    installParallelV4();
    installParallelLongPress();

    /* Reaplica caso algum módulo posterior reconstrua Ferramentas. */
    setTimeout(installTools,350);
    setTimeout(installHelp,500);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();
