
(()=>{
  'use strict';

  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));

  const I={
    menu:`<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
    down:`<svg viewBox="0 0 24 24"><path d="m7 9 5 5 5-5"/></svg>`,
    search:`<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 4.8 4.8"/></svg>`,
    bookmark:`<svg viewBox="0 0 24 24"><path d="M6.5 4.2h11v16l-5.5-3.4-5.5 3.4z"/></svg>`,
    home:`<svg viewBox="0 0 24 24"><path d="m4 11 8-7 8 7v9H7v-9"/><path d="M9.5 20v-5h5v5"/></svg>`,
    bible:`<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21.5z"/></svg>`,
    study:`<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
    more:`<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>`
  };

  const oldTab=name=>q(`nav.bar .tab[data-p="${name}"]`);
  const clickOld=name=>oldTab(name)?.click();

  function shortVersion(txt=''){
    const s=String(txt).toUpperCase();
    const known=['NTLH','AS21','JFAA','NAA','NVI','KJA','KJF','ARA','ARC','WLC'];
    for(const x of known)if(s.includes(x))return x;
    if(s.includes('BÍBLIA LIVRE')||s.includes('BIBLIA LIVRE'))return 'BL';
    if(s.includes('ALMEIDA'))return '1819';
    if(s.includes('RECEPTUS')||s.includes('STEPHANUS'))return 'TR';
    if(s.includes('HIPER'))return 'DOXA';
    if(s.includes('TB'))return 'TB';
    return (String(txt).trim().split(/\s+/)[0]||'BÍBLIA').slice(0,6).toUpperCase();
  }

  function passageLabel(){
    const book=q('#bookSelect');
    const chap=q('#chapterSelect');
    if(book&&book.options&&book.selectedIndex>=0){
      const name=(book.options[book.selectedIndex]?.textContent||'').replace(/\s*—.*$/,'').trim();
      const c=chap?.value||'';
      if(name&&c)return `${name} ${c}`;
    }
    const h=q('#hdrRef')?.textContent?.trim()||'Leitura';
    const m=h.match(/^(.+?)\s+(\d+)/);
    return m?`${m[1]} ${m[2]}`:h.replace(/\s*[·|∥].*$/,'');
  }

  function versionLong(){
    return q('#hdrVersion')?.textContent?.trim()||q('#versionTriggerTitle')?.textContent?.trim()||'Bíblia';
  }

  function makeShell(){
    if(q('#d32Chrome'))return;

    const chrome=document.createElement('div');
    chrome.id='d32Chrome';
    chrome.innerHTML=`
      <div id="d32Topbar">
        <button class="d32-menu" type="button" aria-label="Menu">${I.menu}</button>
        <button class="d32-ref" type="button" aria-label="Selecionar passagem"><span id="d32Ref">Gênesis 1</span>${I.down}</button>
        <button class="d32-version" type="button" aria-label="Selecionar versão"><span id="d32Version">1819</span></button>
        <button class="d32-search" type="button" aria-label="Buscar">${I.search}</button>
        <button class="d32-bookmark" type="button" aria-label="Notas">${I.bookmark}</button>
      </div>
      <nav id="d32BottomBar" aria-label="Navegação principal">
        <button class="on" type="button" data-d32="home">${I.home}<span>Início</span></button>
        <button type="button" data-d32="bible">${I.bible}<span>Bíblia</span></button>
        <button type="button" data-d32="study">${I.study}<span>Estudo</span></button>
        <button type="button" data-d32="more">${I.more}<span>Mais</span></button>
      </nav>`;
    document.body.appendChild(chrome);

    const overlay=document.createElement('div');
    overlay.id='d32Overlay';
    document.body.appendChild(overlay);

    const contextBackdrop=document.createElement('div');
    contextBackdrop.id='d32ContextBackdrop';
    document.body.appendChild(contextBackdrop);

    const more=document.createElement('aside');
    more.id='d32MoreSheet';
    more.className='d32-sheet';
    more.innerHTML=`
      <div class="d32-sheet-grab"></div>
      <h3>Mais</h3>
      <p class="d32-sub">Ferramentas e preferências do Doxa.</p>
      <button type="button" data-more="versions"><span>▥</span>Versões bíblicas</button>
      <button type="button" data-more="parallel"><span>▤</span>Leitura paralela</button>
      <button type="button" data-more="appearance"><span>◐</span>Aparência da leitura</button>
      <button type="button" data-more="search"><span>⌕</span>Buscar na Bíblia</button>
      <button type="button" data-more="notes"><span>▧</span>Notas e marcações</button>
      <button type="button" data-more="settings"><span>⚙</span>Ajustes</button>`;
    document.body.appendChild(more);

    const theme=document.createElement('aside');
    theme.id='d32ThemeSheet';
    theme.className='d32-sheet';
    theme.innerHTML=`
      <div class="d32-sheet-grab"></div>
      <h3>Aparência da leitura</h3>
      <p class="d32-sub">A interface acompanha o tema escolhido pelo leitor.</p>
      <div id="d32ThemeChoices">
        <button data-theme="paper" type="button"><i></i><span>Paper</span></button>
        <button data-theme="sepia" type="button"><i></i><span>Sepia</span></button>
        <button data-theme="white" type="button"><i></i><span>White</span></button>
        <button data-theme="night" type="button"><i></i><span>Night</span></button>
        <button data-theme="olive" type="button"><i></i><span>Olive</span></button>
      </div>`;
    document.body.appendChild(theme);

    const reader=q('#singleReader');
    if(reader&&!q('#d32ChapterHero')){
      const hero=document.createElement('div');
      hero.id='d32ChapterHero';
      hero.innerHTML='<h1>Gênesis 1</h1><p>Almeida 1819</p>';
      reader.insertBefore(hero,reader.firstChild);
    }

    bindShell();
    observeEngine();
    syncAll(true);
  }

  function openSheet(id){
    qa('.d32-sheet').forEach(x=>x.classList.remove('on'));
    q(id)?.classList.add('on');
    document.body.classList.add('d32-sheet-open');
  }
  function closeSheets(){
    document.body.classList.remove('d32-sheet-open');
    qa('.d32-sheet').forEach(x=>x.classList.remove('on'));
  }

  function openPassage(){
    closeSheets();
    const old=q('header .headmain');
    if(old)old.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  }
  function openVersions(){
    closeSheets();
    q('#versionTrigger')?.click();
  }
  function openNotes(){
    closeSheets();
    clickOld('marcar');
    setTimeout(()=>q('#toolsNotesBtn')?.click(),120);
  }
  function openSettings(target){
    closeSheets();
    clickOld('ajustes');
    if(target)setTimeout(()=>q(target)?.scrollIntoView({behavior:'smooth',block:'start'}),160);
  }
  function openParallel(){
    closeSheets();
    q('#parallelToggle')?.click();
  }

  function bindShell(){
    q('#d32Topbar .d32-menu')?.addEventListener('click',()=>openSheet('#d32MoreSheet'));
    q('#d32Topbar .d32-ref')?.addEventListener('click',openPassage);
    q('#d32Topbar .d32-version')?.addEventListener('click',openVersions);
    q('#d32Topbar .d32-search')?.addEventListener('click',()=>clickOld('buscar'));
    q('#d32Topbar .d32-bookmark')?.addEventListener('click',openNotes);

    q('#d32BottomBar')?.addEventListener('click',e=>{
      const b=e.target.closest('[data-d32]'); if(!b)return;
      const a=b.dataset.d32;
      if(a==='home')clickOld('ler');
      else if(a==='bible')openPassage();
      else if(a==='study')clickOld('marcar');
      else if(a==='more')openSheet('#d32MoreSheet');
    });

    q('#d32MoreSheet')?.addEventListener('click',e=>{
      const b=e.target.closest('[data-more]'); if(!b)return;
      const a=b.dataset.more;
      if(a==='versions')openVersions();
      if(a==='parallel')openParallel();
      if(a==='appearance')openSheet('#d32ThemeSheet');
      if(a==='search'){closeSheets();clickOld('buscar')}
      if(a==='notes')openNotes();
      if(a==='settings')openSettings();
    });

    q('#d32Overlay')?.addEventListener('click',closeSheets);
    q('#d32ContextBackdrop')?.addEventListener('click',()=>{
      try{window.DoxaVerseActions?.close?.()}catch(_){}
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    });

    q('#d32ThemeChoices')?.addEventListener('click',e=>{
      const b=e.target.closest('[data-theme]'); if(!b)return;
      const name=b.dataset.theme;
      const old=q(`.theme-preset[data-theme-target="normal"][data-theme-preset="${name}"]`);
      old?.click();
      qa('#d32ThemeChoices button').forEach(x=>x.classList.toggle('on',x===b));
      setTimeout(()=>{syncTone();syncHero();},50);
      setTimeout(closeSheets,160);
    });

    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheets()});
  }

  function currentPanel(){
    return q('main>.panel.on')?.id?.replace('p-','')||'ler';
  }

  function parseColor(s){
    s=String(s||'').trim();
    if(s.startsWith('#')){
      let x=s.slice(1); if(x.length===3)x=x.split('').map(c=>c+c).join('');
      if(x.length>=6)return [parseInt(x.slice(0,2),16),parseInt(x.slice(2,4),16),parseInt(x.slice(4,6),16)];
    }
    const m=s.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    return m?[+m[1],+m[2],+m[3]]:null;
  }

  function syncTone(){
    const raw=getComputedStyle(document.documentElement).getPropertyValue('--paper')||
              getComputedStyle(document.body).backgroundColor;
    const rgb=parseColor(raw)||[230,227,218];
    const lum=(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722);
    const dark=lum<115;
    document.body.classList.toggle('d32-tone-dark',dark);
    document.body.classList.toggle('d32-tone-light',!dark);

    let best=null;
    const colors={
      paper:[232,224,211],sepia:[216,183,127],white:[248,247,242],night:[23,23,23],olive:[89,96,71]
    };
    let dist=1e9;
    for(const [k,c] of Object.entries(colors)){
      const d=(rgb[0]-c[0])**2+(rgb[1]-c[1])**2+(rgb[2]-c[2])**2;
      if(d<dist){dist=d;best=k}
    }
    qa('#d32ThemeChoices button').forEach(b=>b.classList.toggle('on',b.dataset.theme===best));
  }

  function syncHero(){
    const title=passageLabel();
    const version=versionLong();
    const hero=q('#d32ChapterHero');
    if(hero){
      hero.querySelector('h1').textContent=title;
      hero.querySelector('p').textContent=version;
    }
    const ref=q('#d32Ref');
    if(ref)ref.textContent=title;
    const vv=q('#d32Version');
    if(vv)vv.textContent=shortVersion(version);
  }

  function syncPanel(){
    const panel=currentPanel();
    document.body.classList.remove('d32-panel-ler','d32-panel-buscar','d32-panel-marcar','d32-panel-ajustes');
    document.body.classList.add('d32-panel-'+panel);

    const bottom=qa('#d32BottomBar button');
    bottom.forEach(x=>x.classList.remove('on'));
    if(panel==='ler')q('#d32BottomBar [data-d32="home"]')?.classList.add('on');
    if(panel==='marcar')q('#d32BottomBar [data-d32="study"]')?.classList.add('on');

    const ref=q('#d32Ref');
    const ver=q('#d32Topbar .d32-version');
    const names={buscar:'Buscar',marcar:'Estudo',ajustes:'Ajustes'};
    if(panel==='ler'){
      if(ref)ref.textContent=passageLabel();
      if(ver)ver.style.display='flex';
    }else{
      if(ref)ref.textContent=names[panel]||'Doxa';
      if(ver)ver.style.display='none';
    }

    const on=q(`main>.panel.on`);
    if(on){
      on.classList.remove('d32-panel-enter');
      void on.offsetWidth;
      on.classList.add('d32-panel-enter');
      setTimeout(()=>on.classList.remove('d32-panel-enter'),320);
    }
  }

  function syncContext(){
    const pop=q('#verseActions');
    const open=!!pop?.classList.contains('on');
    document.body.classList.toggle('d32-context-open',open);
  }

  function syncAll(first=false){
    syncTone();syncHero();syncPanel();syncContext();decoratePickerBooks();
    if(first){
      const bt=q('#doxaBootSplash .doxa-boot-status span:last-child');
      if(bt)bt.textContent='Preparando o Doxa...';
      q('#pickerTitle')&&(q('#pickerTitle').textContent='Selecionar Passagem');
      q('#pickerSubtitle')&&(q('#pickerSubtitle').textContent='Livro · Capítulo · Versículo');
      q('#pickerSearch')&&(q('#pickerSearch').placeholder='Gn 1:27');
    }
  }


  function decoratePickerBooks(){
    const grid=q('#pickerBody .picker-book-grid, #pickerBody .picker-books-v4');
    if(!grid)return;
    const books=Array.from(grid.querySelectorAll('.picker-book-v4'));
    if(!books.length)return;
    books.forEach(b=>{
      if(!b.dataset.d32Name){
        const name=(b.textContent||'').trim();
        b.dataset.d32Name=name;
      }
    });
    grid.querySelectorAll('.d32-testament-head').forEach(x=>x.remove());
    const ot=document.createElement('div');
    ot.className='d32-testament-head';ot.textContent='Antigo Testamento';
    grid.insertBefore(ot,books[0]);
    if(books.length>39){
      const nt=document.createElement('div');
      nt.className='d32-testament-head';nt.textContent='Novo Testamento';
      grid.insertBefore(nt,books[39]);
    }
  }

  function observeEngine(){
    const hdr=q('#hdrRef'),ver=q('#hdrVersion'),main=q('main'),pop=q('#verseActions'),pickerBody=q('#pickerBody');
    if(hdr)new MutationObserver(()=>{syncHero()}).observe(hdr,{childList:true,subtree:true,characterData:true});
    if(ver)new MutationObserver(()=>{syncHero()}).observe(ver,{childList:true,subtree:true,characterData:true});
    if(main)new MutationObserver(()=>syncPanel()).observe(main,{subtree:true,attributes:true,attributeFilter:['class','aria-selected']});
    if(pop)new MutationObserver(syncContext).observe(pop,{attributes:true,attributeFilter:['class','aria-hidden']});
    if(pickerBody)new MutationObserver(()=>setTimeout(decoratePickerBooks,0)).observe(pickerBody,{childList:true,subtree:true});

    const reader=q('#singleReader'),text=q('#textBody');
    if(reader&&text){
      let t=0;
      new MutationObserver(()=>{
        clearTimeout(t);
        reader.classList.remove('d32-reader-enter');
        void reader.offsetWidth;
        reader.classList.add('d32-reader-enter');
        syncHero();
        t=setTimeout(()=>reader.classList.remove('d32-reader-enter'),420);
      }).observe(text,{childList:true,subtree:false});
    }

    const html=document.documentElement;
    new MutationObserver(()=>setTimeout(syncTone,0)).observe(html,{attributes:true,attributeFilter:['style','class']});
    qa('.theme-preset').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{syncTone();syncHero()},40)));

    qa('nav.bar .tab').forEach(b=>b.addEventListener('click',()=>setTimeout(syncPanel,0)));

    document.addEventListener('pointerdown',e=>{
      const b=e.target.closest('button');
      if(!b||b.disabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      try{b.animate([{transform:'scale(1)'},{transform:'scale(.955)'},{transform:'scale(1)'}],
        {duration:145,easing:'ease-out'})}catch(_){}
    },{passive:true});
  }

  const boot=()=>{
    document.documentElement.classList.add('doxa32');
    makeShell();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
