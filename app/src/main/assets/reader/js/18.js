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
    for(const x of ['NTLH','AS21','JFAA','NAA','NVI','KJA','KJF','ARA','ARC','WLC'])if(s.includes(x))return x;
    if(s.includes('BÍBLIA LIVRE')||s.includes('BIBLIA LIVRE'))return 'BL';
    if(s.includes('ALMEIDA'))return '1819';
    if(s.includes('RECEPTUS')||s.includes('STEPHANUS'))return 'TR';
    if(s.includes('HIPER'))return 'DOXA';
    if(s.includes('TB'))return 'TB';
    return (String(txt).trim().split(/\s+/)[0]||'BÍBLIA').slice(0,6).toUpperCase();
  }

  function passageLabel(){
    const book=q('#bookSelect'),chap=q('#chapterSelect');
    if(book?.options&&book.selectedIndex>=0){
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

  function hideSplash(){
    const splash=q('#doxaBootSplash');
    if(!splash)return;
    try{clearTimeout(window.__doxaBootFailsafe)}catch(_){ }
    splash.classList.add('doxa-boot-splash-hide');
    document.documentElement.removeAttribute('data-doxa-boot');
    setTimeout(()=>{try{splash.remove()}catch(_){ }},430);
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

    const overlay=document.createElement('div');overlay.id='d32Overlay';document.body.appendChild(overlay);
    const context=document.createElement('div');context.id='d32ContextBackdrop';document.body.appendChild(context);

    const more=document.createElement('aside');
    more.id='d32MoreSheet';more.className='d32-sheet';
    more.innerHTML=`<div class="d32-sheet-grab"></div><h3>Mais</h3><p class="d32-sub">Ferramentas e preferências do Doxa.</p>
      <button type="button" data-more="versions"><span>▥</span>Versões bíblicas</button>
      <button type="button" data-more="parallel"><span>▤</span>Leitura paralela</button>
      <button type="button" data-more="appearance"><span>◐</span>Aparência da leitura</button>
      <button type="button" data-more="search"><span>⌕</span>Buscar na Bíblia</button>
      <button type="button" data-more="notes"><span>▧</span>Notas e marcações</button>
      <button type="button" data-more="settings"><span>⚙</span>Ajustes</button>`;
    document.body.appendChild(more);

    const theme=document.createElement('aside');
    theme.id='d32ThemeSheet';theme.className='d32-sheet';
    theme.innerHTML=`<div class="d32-sheet-grab"></div><h3>Aparência da leitura</h3><p class="d32-sub">A interface acompanha o tema escolhido pelo leitor.</p>
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
      hero.id='d32ChapterHero';hero.innerHTML='<h1>Gênesis 1</h1><p>Almeida 1819</p>';
      reader.insertBefore(hero,reader.firstChild);
    }
    bindShell();
  }

  function openSheet(id){
    qa('.d32-sheet').forEach(x=>x.classList.remove('on'));
    q(id)?.classList.add('on');document.body.classList.add('d32-sheet-open');
  }
  function closeSheets(){document.body.classList.remove('d32-sheet-open');qa('.d32-sheet').forEach(x=>x.classList.remove('on'))}
  function openPassage(){closeSheets();q('header .headmain')?.dispatchEvent(new MouseEvent('click',{bubbles:true}))}
  function openVersions(){closeSheets();q('#versionTrigger')?.click()}
  function openNotes(){closeSheets();clickOld('marcar');setTimeout(()=>q('#toolsNotesBtn')?.click(),120)}
  function openSettings(){closeSheets();clickOld('ajustes')}
  function openParallel(){closeSheets();q('#parallelToggle')?.click()}

  function bindShell(){
    q('#d32Topbar .d32-menu')?.addEventListener('click',()=>openSheet('#d32MoreSheet'));
    q('#d32Topbar .d32-ref')?.addEventListener('click',openPassage);
    q('#d32Topbar .d32-version')?.addEventListener('click',openVersions);
    q('#d32Topbar .d32-search')?.addEventListener('click',()=>clickOld('buscar'));
    q('#d32Topbar .d32-bookmark')?.addEventListener('click',openNotes);

    q('#d32BottomBar')?.addEventListener('click',e=>{
      const b=e.target.closest('[data-d32]');if(!b)return;
      if(b.dataset.d32==='home')clickOld('ler');
      if(b.dataset.d32==='bible')openPassage();
      if(b.dataset.d32==='study')clickOld('marcar');
      if(b.dataset.d32==='more')openSheet('#d32MoreSheet');
    });

    q('#d32MoreSheet')?.addEventListener('click',e=>{
      const b=e.target.closest('[data-more]');if(!b)return;
      const a=b.dataset.more;
      if(a==='versions')openVersions();
      else if(a==='parallel')openParallel();
      else if(a==='appearance')openSheet('#d32ThemeSheet');
      else if(a==='search'){closeSheets();clickOld('buscar')}
      else if(a==='notes')openNotes();
      else if(a==='settings')openSettings();
    });

    q('#d32Overlay')?.addEventListener('click',closeSheets);
    q('#d32ContextBackdrop')?.addEventListener('click',()=>{
      try{window.DoxaVerseActions?.close?.()}catch(_){ }
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    });
    q('#d32ThemeChoices')?.addEventListener('click',e=>{
      const b=e.target.closest('[data-theme]');if(!b)return;
      q(`.theme-preset[data-theme-target="normal"][data-theme-preset="${b.dataset.theme}"]`)?.click();
      setTimeout(closeSheets,150);
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheets()});
  }

  function currentPanel(){return q('main>.panel.on')?.id?.replace('p-','')||'ler'}
  function parseColor(s){
    s=String(s||'').trim();
    if(s.startsWith('#')){let x=s.slice(1);if(x.length===3)x=x.split('').map(c=>c+c).join('');if(x.length>=6)return[parseInt(x.slice(0,2),16),parseInt(x.slice(2,4),16),parseInt(x.slice(4,6),16)]}
    const m=s.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);return m?[+m[1],+m[2],+m[3]]:null;
  }

  function syncTone(){
    const raw=getComputedStyle(document.documentElement).getPropertyValue('--paper')||getComputedStyle(document.body).backgroundColor;
    const rgb=parseColor(raw)||[230,227,218];const lum=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;const dark=lum<115;
    document.body.classList.toggle('d32-tone-dark',dark);document.body.classList.toggle('d32-tone-light',!dark);
    const colors={paper:[232,224,211],sepia:[216,183,127],white:[248,247,242],night:[23,23,23],olive:[89,96,71]};
    let best='paper',dist=1e9;
    for(const[k,c]of Object.entries(colors)){const d=(rgb[0]-c[0])**2+(rgb[1]-c[1])**2+(rgb[2]-c[2])**2;if(d<dist){dist=d;best=k}}
    qa('#d32ThemeChoices button').forEach(b=>b.classList.toggle('on',b.dataset.theme===best));
  }

  function syncHero(){
    const title=passageLabel(),version=versionLong(),hero=q('#d32ChapterHero');
    if(hero){hero.querySelector('h1').textContent=title;hero.querySelector('p').textContent=version}
    if(q('#d32Ref'))q('#d32Ref').textContent=title;
    if(q('#d32Version'))q('#d32Version').textContent=shortVersion(version);
  }

  function syncPanel(){
    const panel=currentPanel();
    for(const n of['ler','buscar','marcar','ajustes'])document.body.classList.toggle('d32-panel-'+n,panel===n);
    qa('#d32BottomBar button').forEach(x=>x.classList.remove('on'));
    if(panel==='ler')q('#d32BottomBar [data-d32="home"]')?.classList.add('on');
    if(panel==='marcar')q('#d32BottomBar [data-d32="study"]')?.classList.add('on');
    const ref=q('#d32Ref'),ver=q('#d32Topbar .d32-version');
    if(panel==='ler'){if(ref)ref.textContent=passageLabel();if(ver)ver.style.display='flex'}
    else{if(ref)ref.textContent=({buscar:'Buscar',marcar:'Estudo',ajustes:'Ajustes'}[panel]||'Doxa');if(ver)ver.style.display='none'}
  }

  function syncContext(){document.body.classList.toggle('d32-context-open',!!q('#verseActions')?.classList.contains('on'))}

  function decoratePickerBooks(){
    const grid=q('#pickerBody .picker-book-grid, #pickerBody .picker-books-v4');if(!grid)return;
    const books=Array.from(grid.querySelectorAll('.picker-book-v4'));if(!books.length)return;
    books.forEach(b=>{if(!b.dataset.d32Name)b.dataset.d32Name=(b.textContent||'').trim()});
    const wanted=books.length>39?2:1,heads=grid.querySelectorAll('.d32-testament-head');
    if(heads.length===wanted)return; // importante: não reage às próprias alterações
    heads.forEach(x=>x.remove());
    const ot=document.createElement('div');ot.className='d32-testament-head';ot.textContent='Antigo Testamento';grid.insertBefore(ot,books[0]);
    if(books.length>39){const nt=document.createElement('div');nt.className='d32-testament-head';nt.textContent='Novo Testamento';grid.insertBefore(nt,books[39])}
  }

  function syncAll(){syncTone();syncHero();syncPanel();syncContext();decoratePickerBooks()}

  function animateReaderSafely(){
    const body=q('#textBody');if(!body)return;
    new MutationObserver(()=>{
      if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const reader=q('#singleReader');
      try{reader?.animate([{opacity:.2,transform:'translateX(9px)'},{opacity:1,transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.78,.2,1)'})}catch(_){ }
    }).observe(body,{childList:true});
  }

  function boot(){
    document.documentElement.classList.add('doxa32');
    makeShell();
    q('#pickerTitle')&&(q('#pickerTitle').textContent='Selecionar Passagem');
    q('#pickerSubtitle')&&(q('#pickerSubtitle').textContent='Livro · Capítulo · Versículo');
    q('#pickerSearch')&&(q('#pickerSearch').placeholder='Gn 1:27');
    syncAll();animateReaderSafely();

    // Sincronização estável: leitura periódica, sem MutationObserver autorreativo.
    const syncTimer=setInterval(()=>{if(!document.documentElement.isConnected){clearInterval(syncTimer);return}syncAll()},500);

    // Fecha assim que a aplicação já está montada. O js/17 continua como segundo mecanismo.
    setTimeout(hideSplash,900);
    setTimeout(hideSplash,6000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
