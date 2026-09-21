
(()=>{
  'use strict';

  const svg = {
    menu:`<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
    down:`<svg viewBox="0 0 24 24"><path d="m7 9 5 5 5-5"/></svg>`,
    search:`<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 4.8 4.8"/></svg>`,
    mark:`<svg viewBox="0 0 24 24"><path d="M6.5 4.2h11v16l-5.5-3.4-5.5 3.4z"/></svg>`,
    home:`<svg viewBox="0 0 24 24"><path d="m4 11 8-7 8 7v9H7v-9"/><path d="M9.5 20v-5h5v5"/></svg>`,
    bible:`<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21.5z"/></svg>`,
    study:`<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
    more:`<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>`
  };

  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));
  const oldTab=name=>q(`nav.bar .tab[data-p="${name}"]`);
  const clickOld=name=>{ const b=oldTab(name); if(b)b.click(); };
  const cleanRef=(txt='')=>{
    txt=txt.trim();
    const m=txt.match(/^(.+?)\s+(\d+)/);
    return m ? `${m[1]} ${m[2]}` : txt;
  };
  const shortVersion=(txt='')=>{
    const s=txt.toUpperCase();
    if(s.includes('NVI'))return 'NVI';
    if(s.includes('NTLH'))return 'NTLH';
    if(s.includes('NAA'))return 'NAA';
    if(s.includes('KJA'))return 'KJA';
    if(s.includes('KJF'))return 'KJF';
    if(s.includes('JFAA'))return 'JFAA';
    if(s.includes('AS21'))return 'AS21';
    if(s.includes('ARA'))return 'ARA';
    if(s.includes('ARC'))return 'ARC';
    if(s.includes('TB'))return 'TB';
    if(s.includes('LIVRE'))return 'BL';
    if(s.includes('ALMEIDA'))return '1819';
    if(s.includes('WLC'))return 'WLC';
    if(s.includes('RECEPTUS')||s.includes('TR '))return 'TR';
    if(s.includes('HIPER'))return 'DOXA';
    const words=txt.trim().split(/\s+/).filter(Boolean);
    return (words[0]||'BÍBLIA').slice(0,6).toUpperCase();
  };

  function buildShell(){
    if(q('#d31Topbar'))return;

    const top=document.createElement('div');
    top.id='d31Topbar';
    top.innerHTML=`
      <button class="d31-menu" type="button" aria-label="Menu">${svg.menu}</button>
      <button class="d31-passage" type="button" aria-label="Selecionar passagem"><span id="d31Ref">Gênesis 1</span>${svg.down}</button>
      <button class="d31-version" type="button" aria-label="Selecionar versão"><span id="d31Version">1819</span></button>
      <button class="d31-search" type="button" aria-label="Buscar">${svg.search}</button>
      <button class="d31-bookmark" type="button" aria-label="Notas e marcações">${svg.mark}</button>`;
    document.body.appendChild(top);

    const bottom=document.createElement('nav');
    bottom.id='d31Bottombar';
    bottom.setAttribute('aria-label','Navegação principal');
    bottom.innerHTML=`
      <button type="button" data-d31="home" class="on">${svg.home}<span>Início</span></button>
      <button type="button" data-d31="bible">${svg.bible}<span>Bíblia</span></button>
      <button type="button" data-d31="study">${svg.study}<span>Estudo</span></button>
      <button type="button" data-d31="more">${svg.more}<span>Mais</span></button>`;
    document.body.appendChild(bottom);

    const backdrop=document.createElement('div');
    backdrop.id='d31MoreBackdrop';
    document.body.appendChild(backdrop);

    const more=document.createElement('aside');
    more.id='d31MoreSheet';
    more.innerHTML=`
      <div class="d31-more-grab"></div><h3>Mais</h3>
      <button type="button" data-more="versions"><span>▥</span>Versões bíblicas</button>
      <button type="button" data-more="parallel"><span>▤</span>Leitura paralela</button>
      <button type="button" data-more="search"><span>⌕</span>Buscar na Bíblia</button>
      <button type="button" data-more="notes"><span>▧</span>Notas e marcações</button>
      <button type="button" data-more="settings"><span>⚙</span>Ajustes</button>`;
    document.body.appendChild(more);

    top.querySelector('.d31-menu').addEventListener('click',openMore);
    top.querySelector('.d31-passage').addEventListener('click',openPassage);
    top.querySelector('.d31-version').addEventListener('click',openVersions);
    top.querySelector('.d31-search').addEventListener('click',()=>clickOld('buscar'));
    top.querySelector('.d31-bookmark').addEventListener('click',openNotes);

    bottom.addEventListener('click',e=>{
      const b=e.target.closest('button[data-d31]'); if(!b)return;
      const action=b.dataset.d31;
      if(action==='home')clickOld('ler');
      else if(action==='bible')openPassage();
      else if(action==='study')clickOld('marcar');
      else if(action==='more')openMore();
    });

    more.addEventListener('click',e=>{
      const b=e.target.closest('button[data-more]'); if(!b)return;
      closeMore();
      if(b.dataset.more==='versions')openVersions();
      if(b.dataset.more==='parallel'){ const p=q('#parallelToggle'); if(p)p.click(); }
      if(b.dataset.more==='search')clickOld('buscar');
      if(b.dataset.more==='notes')openNotes();
      if(b.dataset.more==='settings')clickOld('ajustes');
    });
    backdrop.addEventListener('click',closeMore);

    syncChrome();
    observeState();
    upgradePicker();
    animateReader();
  }

  function openMore(){
    document.body.classList.add('d31-more-open');
  }
  function closeMore(){
    document.body.classList.remove('d31-more-open');
  }
  function openPassage(){
    closeMore();
    const ref=q('#hdrRef');
    if(ref){ ref.dispatchEvent(new MouseEvent('click',{bubbles:true})); }
    setTimeout(()=>{
      if(!q('#premiumPicker.on')){
        const alt=q('#pPassageA')||q('.headmain');
        if(alt)alt.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      }
    },40);
  }
  function openVersions(){
    closeMore();
    const b=q('#versionTrigger');
    if(b)b.click();
  }
  function openNotes(){
    clickOld('marcar');
    setTimeout(()=>{ const n=q('#toolsNotesBtn'); if(n)n.click(); },120);
  }

  function currentPanel(){
    const on=q('main>.panel.on');
    return on ? on.id.replace('p-','') : 'ler';
  }
  function syncChrome(){
    const ref=q('#hdrRef');
    const ver=q('#hdrVersion');
    const r=q('#d31Ref');
    const v=q('#d31Version');
    if(r&&ref)r.textContent=cleanRef(ref.textContent);
    if(v){
      const source=(ver&&ver.textContent)||q('#versionTriggerTitle')?.textContent||'Bíblia';
      v.textContent=shortVersion(source);
    }

    const panel=currentPanel();
    document.body.classList.remove('d31-panel-ler','d31-panel-buscar','d31-panel-marcar','d31-panel-ajustes');
    document.body.classList.add('d31-panel-'+panel);

    const bottom=q('#d31Bottombar');
    if(bottom){
      qa('#d31Bottombar button').forEach(x=>x.classList.remove('on'));
      const key=panel==='ler'?'home':panel==='marcar'?'study':null;
      if(key)q(`#d31Bottombar [data-d31="${key}"]`)?.classList.add('on');
    }

    const pass=q('#d31Topbar .d31-passage');
    const vers=q('#d31Topbar .d31-version');
    if(pass){
      if(panel==='ler'){ pass.style.opacity='1';pass.style.pointerEvents='auto'; }
      else{
        pass.style.opacity='1';
        const names={buscar:'Buscar',marcar:'Estudo',ajustes:'Ajustes'};
        q('#d31Ref').textContent=names[panel]||'Doxa';
      }
    }
    if(vers)vers.style.display=panel==='ler'?'flex':'none';
  }

  function observeState(){
    const hdr=q('#hdrRef'), ver=q('#hdrVersion');
    if(hdr)new MutationObserver(syncChrome).observe(hdr,{childList:true,subtree:true,characterData:true});
    if(ver)new MutationObserver(syncChrome).observe(ver,{childList:true,subtree:true,characterData:true});
    const main=q('main');
    if(main)new MutationObserver(syncChrome).observe(main,{attributes:true,subtree:true,attributeFilter:['class','aria-selected']});

    qa('nav.bar .tab').forEach(b=>b.addEventListener('click',()=>setTimeout(syncChrome,0)));
    document.addEventListener('keydown',e=>{ if(e.key==='Escape')closeMore(); });
  }

  function upgradePicker(){
    const title=q('#pickerTitle');
    if(title)title.textContent='Selecionar Passagem';
    const sub=q('#pickerSubtitle');
    if(sub)sub.textContent='Livro · Capítulo · Versículo';
    const inp=q('#pickerSearch');
    if(inp)inp.placeholder='Gn 1:27';
  }

  function animateReader(){
    const reader=q('#singleReader');
    const body=q('#textBody');
    if(!reader||!body)return;
    let timer=0;
    new MutationObserver(()=>{
      clearTimeout(timer);
      reader.classList.remove('d31-reader-enter');
      void reader.offsetWidth;
      reader.classList.add('d31-reader-enter');
      timer=setTimeout(()=>reader.classList.remove('d31-reader-enter'),420);
      syncChrome();
    }).observe(body,{childList:true,subtree:false});

    document.addEventListener('pointerdown',e=>{
      const b=e.target.closest('button');
      if(!b||b.disabled||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
      try{
        b.animate([{transform:'scale(1)'},{transform:'scale(.955)'},{transform:'scale(1)'}],
          {duration:150,easing:'ease-out'});
      }catch(_){}
    },{passive:true});
  }

  const boot=()=>{
    document.documentElement.classList.add('doxa31-real');
    const bootText=q('#doxaBootSplash .doxa-boot-status span:last-child');
    if(bootText)bootText.textContent='Preparando o Doxa...';
    buildShell();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
