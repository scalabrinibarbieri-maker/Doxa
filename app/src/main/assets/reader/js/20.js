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

  function init(){
    installTools();
    installHelp();
    setTimeout(installTools,350);
    setTimeout(installHelp,500);
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init,{once:true})}else init();
})();
