(()=>{
  let done=false;
  const splash=document.getElementById('doxaBootSplash');
  if(!splash)return;

  /*
    Abertura Doxa:
    - mantém a splash por aproximadamente 3s no fluxo normal;
    - o leitor continua renderizando por trás durante esse tempo;
    - se o aparelho realmente precisar de mais tempo, não revela
      uma interface incompleta: espera o leitor ficar pronto.
  */
  const TOTAL_MS=4500;
  const FADE_MS=400;
  const EXIT_AT_MS=TOTAL_MS-FADE_MS;

  const finish=()=>{
    if(done)return;
    done=true;

    try{clearTimeout(window.__doxaBootFailsafe)}catch(e){}

    const elapsed=Date.now()-(window.__doxaBootStarted||Date.now());
    const wait=Math.max(0,EXIT_AT_MS-elapsed);

    setTimeout(()=>{
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        splash.classList.add('doxa-boot-splash-hide');
        document.documentElement.removeAttribute('data-doxa-boot');

        setTimeout(()=>{
          try{splash.remove()}catch(e){}
        },FADE_MS+30);
      }));
    },wait);
  };

  const readerReady=()=>{
    const body=document.getElementById('textBody');
    const panel=document.getElementById('p-ler');
    return !!(
      body &&
      panel &&
      (body.children.length || String(body.textContent||'').trim().length)
    );
  };

  const check=()=>{
    if(readerReady())finish();
  };

  if(document.readyState==='complete'){
    check();
  }else{
    window.addEventListener('load',()=>{
      check();
      setTimeout(check,80);
    },{once:true});
  }

  const obs=new MutationObserver(check);
  const target=document.getElementById('textBody');
  if(target)obs.observe(target,{
    childList:true,
    subtree:true,
    characterData:true
  });

  const poll=setInterval(()=>{
    if(done){
      clearInterval(poll);
      obs.disconnect();
      return;
    }
    check();
  },120);

  // Segurança: nunca deixa uma splash presa sobre um app utilizável.
  setTimeout(()=>{
    if(!done)finish();
  },15000);
})();

/* Doxa · extensão do limite mínimo do tamanho do texto
   Apenas amplia o controle já existente: 14 px -> 11 px.
   Mantém o máximo, passos, margens, alinhamento, números e persistência. */
(()=>{
  const MIN_SIZE=11;
  const MAX_SIZE=28;

  const slider=document.getElementById('swSize');
  if(slider)slider.min=String(MIN_SIZE);

  if(typeof applyTextPrefs!=='function')return;

  applyTextPrefs=function(save=false){
    const size=Math.max(MIN_SIZE,Math.min(MAX_SIZE,Number(prefs.size)||18.5));
    const margin=Math.max(8,Math.min(42,Number(prefs.textMargin)||26));
    const align=['left','justify','center'].includes(prefs.textAlign)?prefs.textAlign:'justify';
    const showNumbers=prefs.showVerseNumbers!==false;
    prefs.size=size;prefs.textMargin=margin;prefs.textAlign=align;prefs.showVerseNumbers=showNumbers;

    document.documentElement.style.setProperty('--reader-font-size',size+'px');
    document.documentElement.style.setProperty('--parallel-font-size',size+'px');
    document.documentElement.style.setProperty('--reader-side-padding',margin+'px');
    document.documentElement.style.setProperty('--parallel-side-padding',Math.max(7,Math.round(margin*.55))+'px');
    document.documentElement.style.setProperty('--reader-family',"Georgia,'Times New Roman',serif");

    document.body.dataset.readerAlign=align;
    delete document.body.dataset.readerFont;
    document.body.classList.toggle('reader-hide-verse-numbers',!showNumbers);
    document.body.classList.toggle('reader-hyper-active',mode==='hyper');

    const sizeEl=document.getElementById('swSize');
    const sizeOut=document.getElementById('swSizeValue');
    const marginEl=document.getElementById('swTextMargin');
    const marginOut=document.getElementById('swTextMarginValue');
    const verseEl=document.getElementById('swVerseNumbers');

    if(sizeEl){
      sizeEl.min=String(MIN_SIZE);
      if(Number(sizeEl.value)!==size)sizeEl.value=size;
    }
    if(sizeOut)sizeOut.textContent=String(size).replace('.',',');
    if(marginEl&&Number(marginEl.value)!==margin)marginEl.value=margin;
    if(marginOut)marginOut.textContent=margin+' px';
    if(verseEl){verseEl.checked=showNumbers;verseEl.disabled=mode==='hyper'}

    document.querySelectorAll('[data-reader-align]').forEach(b=>{
      b.classList.toggle('on',b.dataset.readerAlign===align);
      b.disabled=mode==='hyper';
    });

    const hint=document.getElementById('readerTextHint');
    if(hint)hint.textContent=mode==='hyper'
      ?'A Hiperliteral está ativa: alinhamento e números permanecem na formatação editorial própria.'
      :'Alinhamento e números também acompanham a leitura paralela.';

    if(save)savePrefs();
  };
})();

/* Doxa 61 · correção social em "Em evidência" + data/hora das notícias */
(()=>{
  'use strict';

  const HOME_KEY='doxa:home:content:v2';
  let scheduled=false;
  let activeNewsId=null;

  const readHome=()=>{
    try{
      const x=JSON.parse(localStorage.getItem(HOME_KEY)||'null');
      return x&&typeof x==='object'?x:null;
    }catch(e){return null}
  };

  const newsMap=()=>{
    const h=readHome(),m=new Map();
    for(const x of h?.news||[])if(x?.id)m.set(String(x.id),x);
    return m;
  };

  const publishedText=raw=>{
    if(!raw)return'';
    const d=new Date(raw);
    if(Number.isNaN(d.getTime()))return'';
    const opts={
      day:'2-digit',month:'2-digit',year:'numeric',
      hour:'2-digit',minute:'2-digit',hour12:false,
      timeZone:'America/Sao_Paulo'
    };
    let s='';
    try{s=new Intl.DateTimeFormat('pt-BR',opts).format(d)}
    catch(e){
      try{s=new Intl.DateTimeFormat('pt-BR',{
        day:'2-digit',month:'2-digit',year:'numeric',
        hour:'2-digit',minute:'2-digit',hour12:false
      }).format(d)}catch(_){return''}
    }
    return s.replace(/,\s*/,' · ');
  };

  const ensureStyle=()=>{
    if(document.getElementById('doxa61NewsSocialStyle'))return;
    const st=document.createElement('style');
    st.id='doxa61NewsSocialStyle';
    st.textContent=`
      /* Em evidência: curtida e comentário formam um único grupo, sem sobreposição. */
      .doxa-home-feature{position:relative!important}
      .doxa-home-feature>.doxa-feature-social{
        position:absolute!important;right:18px!important;bottom:16px!important;z-index:7;
        display:flex!important;align-items:center!important;gap:7px!important;
        width:auto!important;margin:0!important;padding:0!important;
        color:inherit!important;font:inherit!important;letter-spacing:normal!important;
        text-transform:none!important;
      }
      .doxa-home-feature>.doxa-feature-social .doxa-home-like{
        position:static!important;right:auto!important;bottom:auto!important;
        margin:0!important;min-width:46px;height:36px;padding:0 10px!important;
        display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;
        border:1px solid color-mix(in srgb,var(--d30-gold,#d9a25e) 20%,transparent)!important;
        border-radius:999px!important;
        background:color-mix(in srgb,var(--d30-bg,#050403) 72%,transparent)!important;
        color:color-mix(in srgb,var(--d30-text,#fff) 72%,var(--d30-gold,#d9a25e))!important;
        font:700 11px/1 system-ui,sans-serif!important;
        letter-spacing:normal!important;
        -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
      }
      .doxa-home-feature>.doxa-feature-social .doxa-home-like.on{
        color:var(--d30-gold2,#f1c989)!important;
        border-color:color-mix(in srgb,var(--d30-gold2,#f1c989) 38%,transparent)!important;
      }
      .doxa-home-feature>.doxa-feature-social .doxa-cmt-pill svg{fill:none!important}
      .doxa-home-feature>.doxa-feature-social .doxa-home-like svg{width:16px;height:16px}

      /* Notícias: mantém a editoria/meta e acrescenta o momento da publicação no Doxa. */
      .doxa-news-meta-stack{
        min-width:0;display:flex!important;flex-direction:column;align-items:flex-start;gap:4px;
        margin-right:auto;
      }
      .doxa-news-meta-stack>em{margin:0!important}
      .doxa-news-published{
        display:block!important;margin:0!important;
        color:color-mix(in srgb,var(--dh74,var(--d30-muted,#9e9286)) 88%,transparent)!important;
        font:600 9.5px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif!important;
        letter-spacing:.025em!important;text-transform:none!important;white-space:nowrap;
      }
      .doxa-news-reader-published{
        margin:8px 0 0;color:var(--dh74,var(--d30-muted,#9e9286));
        font:650 10.5px/1.3 system-ui,-apple-system,'Segoe UI',sans-serif;
        letter-spacing:.035em;
      }
      .doxa-rich-kicker+.doxa-news-reader-published{margin-top:0;margin-bottom:11px}
      @media(max-width:380px){
        .doxa-home-feature>.doxa-feature-social{right:14px!important;bottom:14px!important;gap:6px!important}
        .doxa-home-feature>.doxa-feature-social .doxa-home-like{height:34px;min-width:43px;padding:0 9px!important}
        .doxa-news-published{font-size:9px!important}
      }
    `;
    document.head.appendChild(st);
  };

  const fixFeaturedSocial=()=>{
    document.querySelectorAll('.doxa-home-feature[data-open-item]').forEach(card=>{
      let group=card.querySelector(':scope>.doxa-feature-social');
      const direct=[...card.children].filter(el=>
        el.matches?.('.doxa-home-like:not(.doxa-feature-social),.doxa-cmt-pill')
      );
      if(!group&&direct.length){
        group=document.createElement('span');
        group.className='doxa-feature-social';
        card.appendChild(group);
      }
      if(!group)return;
      for(const el of [...card.children]){
        if(el===group)continue;
        if(el.matches?.('.doxa-home-like,.doxa-cmt-pill'))group.appendChild(el);
      }
    });
  };

  const decorateNewsCards=()=>{
    const map=newsMap();
    if(!map.size)return;

    document.querySelectorAll('[data-open-item]').forEach(card=>{
      const item=map.get(String(card.dataset.openItem||''));
      if(!item)return;
      const label=publishedText(item.date||item.publicado_em);
      if(!label)return;

      const foot=card.querySelector('.doxa-home-card-foot');
      if(!foot)return;

      let stack=foot.querySelector(':scope>.doxa-news-meta-stack');
      if(!stack){
        stack=document.createElement('span');
        stack.className='doxa-news-meta-stack';

        const meta=[...foot.children].find(el=>el.tagName==='EM');
        if(meta){
          foot.insertBefore(stack,meta);
          stack.appendChild(meta);
        }else{
          foot.insertBefore(stack,foot.firstChild);
        }
      }

      let d=stack.querySelector('.doxa-news-published');
      if(!d){
        d=document.createElement('span');
        d.className='doxa-news-published';
        stack.appendChild(d);
      }
      d.textContent='Publicado '+label;
    });
  };

  const decorateReaders=()=>{
    const map=newsMap();
    const item=activeNewsId?map.get(String(activeNewsId)):null;
    const label=item?publishedText(item.date||item.publicado_em):'';

    document.querySelectorAll('.doxa-news-reader-published').forEach(el=>{
      if(!label||el.dataset.newsId!==String(activeNewsId))el.remove();
    });
    if(!label)return;

    const plain=document.querySelector('.doxa-home-reader.on .doxa-home-reader-article');
    if(plain&&!plain.querySelector('.doxa-news-reader-published')){
      const d=document.createElement('div');
      d.className='doxa-news-reader-published';
      d.dataset.newsId=String(activeNewsId);
      d.textContent='Publicado no Doxa em '+label;
      const small=plain.querySelector(':scope>small');
      if(small)small.after(d);else plain.prepend(d);
    }

    const rich=document.querySelector('.doxa-rich-reader.on .doxa-rich-article');
    if(rich&&!rich.querySelector('.doxa-news-reader-published')){
      const d=document.createElement('div');
      d.className='doxa-news-reader-published';
      d.dataset.newsId=String(activeNewsId);
      d.textContent='Publicado no Doxa em '+label;
      const kicker=rich.querySelector(':scope>.doxa-rich-kicker');
      if(kicker)kicker.after(d);else rich.prepend(d);
    }
  };

  const apply=()=>{
    scheduled=false;
    ensureStyle();
    fixFeaturedSocial();
    decorateNewsCards();
    decorateReaders();
  };

  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(apply);
  };

  document.addEventListener('click',e=>{
    const el=e.target instanceof Element?e.target:null;
    const open=el?.closest?.('[data-open-item]');
    if(open){
      const id=String(open.dataset.openItem||'');
      activeNewsId=newsMap().has(id)?id:null;
      setTimeout(schedule,0);
      setTimeout(schedule,120);
    }
  },true);

  const obs=new MutationObserver(schedule);
  obs.observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('storage',e=>{if(e.key===HOME_KEY)schedule()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});

  schedule();
  setTimeout(schedule,400);
  setTimeout(schedule,1400);
})();

/* Doxa 62 · Rosé + Lavanda + textura Mármore
   Extensão não destrutiva do sistema 30.5/30.6: mantém os cinco temas atuais,
   Pergaminho/Linho, as mesmas chaves de persistência e a mesma lógica tema + textura. */
(()=>{
  'use strict';

  const THEME_KEY='doxa:30.5:theme';
  const TEXTURE_KEY='doxa:30.6:texture';
  const EXTRA_THEMES={
    rose:{bg:'#F1DDD9',bg2:'#E7CBC5',panel:'#F8EAE6',text:'#412D31',muted:'#7B6264',gold:'#B77967',gold2:'#D39A87'},
    lavender:{bg:'#E5DFEA',bg2:'#D6CDDD',panel:'#F0EBF3',text:'#332D3B',muted:'#6E6577',gold:'#927492',gold2:'#B398B4'}
  };
  const TEXTURE_BUTTONS={
    doxa30PaperTexture:'paper',
    doxa30LinenTexture:'linen',
    doxa30MarbleTexture:'marble'
  };

  const read=(key,def='')=>{try{return localStorage.getItem(key)||def}catch(e){return def}};
  const write=(key,value)=>{try{localStorage.setItem(key,value)}catch(e){}};

  function setThemeVars(t){
    const root=document.documentElement.style;
    root.setProperty('--d30-bg',t.bg);
    root.setProperty('--d30-bg2',t.bg2);
    root.setProperty('--d30-panel',t.panel);
    root.setProperty('--d30-text',t.text);
    root.setProperty('--d30-muted',t.muted);
    root.setProperty('--d30-gold',t.gold);
    root.setProperty('--d30-gold2',t.gold2);
  }

  function applyExtraTheme(name,save=true){
    const t=EXTRA_THEMES[name];if(!t)return;
    document.body.dataset.doxa30Theme=name;
    setThemeVars(t);

    const vals={normalPageColor:t.bg,normalTextColor:t.text,normalAccentColor:t.gold,normalChromeColor:t.panel};
    for(const [id,value] of Object.entries(vals)){
      const el=document.getElementById(id);if(!el)continue;
      el.value=value;
      el.dispatchEvent(new Event('input',{bubbles:true}));
    }

    document.querySelectorAll('.doxa30-theme-option').forEach(b=>b.classList.toggle('on',b.dataset.theme===name));
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=t.bg;
    try{window.dispatchEvent(new CustomEvent('doxa:themechange',{detail:{name,theme:t}}))}catch(e){}
    if(save)write(THEME_KEY,name);
  }

  function setTextureButtonState(name){
    for(const [id,val] of Object.entries(TEXTURE_BUTTONS)){
      const btn=document.getElementById(id);if(!btn)continue;
      const on=name===val;
      btn.classList.toggle('on',on);
      btn.setAttribute('aria-pressed',on?'true':'false');
      const state=btn.querySelector('.doxa30-paper-texture-state');
      if(state)state.textContent=on?'Ativa':'Desativada';
    }
  }

  function applyTexture(name,save=true){
    name=(name==='paper'||name==='linen'||name==='marble')?name:'none';
    document.body.dataset.doxa30Texture=name;
    document.body.classList.remove('doxa-theme-texture-cream','doxa-theme-texture-temple','doxa30-paper-on');

    // Mantém o mecanismo antigo explicitamente desligado, como o sistema atual já faz.
    const native=document.getElementById('normalTexture');
    if(native&&native.checked){
      native.checked=false;
      native.dispatchEvent(new Event('change',{bubbles:true}));
    }

    setTextureButtonState(name);
    if(save)write(TEXTURE_KEY,name);
  }

  function installStyle(){
    if(document.getElementById('doxa62ThemesStyle'))return;
    const st=document.createElement('style');
    st.id='doxa62ThemesStyle';
    st.textContent=`
      /* Sete paletas: no celular ficam em 4 + 3, sem apertar os nomes. */
      #doxa30ThemeOverlay .doxa30-theme-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important}
      #doxa30ThemeOverlay .doxa30-swatch.rose{
        background:radial-gradient(circle at 33% 27%,rgba(255,255,255,.52),transparent 31%),linear-gradient(145deg,#f8eae6,#e7cbc5 58%,#d6afa8)!important;
      }
      #doxa30ThemeOverlay .doxa30-swatch.lavender{
        background:radial-gradient(circle at 33% 27%,rgba(255,255,255,.54),transparent 31%),linear-gradient(145deg,#f0ebf3,#d6cddd 58%,#bcaec8)!important;
      }

      /* Mármore líquido: a imagem é neutra, então recebe a cor da paleta por blend. */
      body[data-doxa30-texture="marble"]::after{
        content:'';position:fixed;inset:0;z-index:19;pointer-events:none;
        background:url('assets/marble_texture.webp') center/cover no-repeat;
        mix-blend-mode:multiply;opacity:.28;
      }
      body[data-doxa30-theme="night"][data-doxa30-texture="marble"]::after{
        mix-blend-mode:screen;filter:invert(1) brightness(.58) contrast(1.35);opacity:.34;
      }
      body.doxa-home-open[data-doxa30-texture="marble"]::after{display:none}
      .doxa30-marble-preview{
        background:var(--d30-bg) url('assets/marble_texture.webp') center/cover no-repeat!important;
        background-blend-mode:multiply!important;
      }
      body[data-doxa30-theme="night"] .doxa30-marble-preview{
        background-blend-mode:screen!important;filter:brightness(.78) contrast(1.12);
      }
      @media(max-width:420px){
        #doxa30ThemeOverlay .doxa30-theme-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function themeButton(name,label,swatchClass){
    const b=document.createElement('button');
    b.className='doxa30-theme-option';b.type='button';b.dataset.theme=name;
    b.innerHTML='<span class="doxa30-swatch '+swatchClass+'"></span><span>'+label+'</span>';
    return b;
  }

  function ensureUi(){
    installStyle();
    const overlay=document.getElementById('doxa30ThemeOverlay');
    if(!overlay)return false;

    const grid=overlay.querySelector('.doxa30-theme-grid');
    if(grid){
      if(!grid.querySelector('[data-theme="rose"]'))grid.appendChild(themeButton('rose','Rosé','rose'));
      if(!grid.querySelector('[data-theme="lavender"]'))grid.appendChild(themeButton('lavender','Lavanda','lavender'));
    }

    const section=overlay.querySelector('.doxa30-paper-section');
    if(section&&!document.getElementById('doxa30MarbleTexture')){
      const b=document.createElement('button');
      b.className='doxa30-paper-texture-toggle';b.id='doxa30MarbleTexture';b.type='button';b.setAttribute('aria-pressed','false');
      b.innerHTML='<span class="doxa30-paper-preview doxa30-marble-preview"></span><span class="doxa30-paper-copy"><strong>Mármore</strong><small>Veios fluidos sobre qualquer paleta</small></span><span class="doxa30-paper-texture-state">Desativada</span>';
      section.appendChild(b);
    }

    // Texto do menu principal passa a refletir que existem várias texturas.
    const desc=document.querySelector('#doxa30OpenThemes .doxa30-more-copy small');
    if(desc)desc.textContent='Paletas e texturas';

    if(!overlay.dataset.doxa62Bound){
      overlay.dataset.doxa62Bound='1';
      // Captura antes dos handlers antigos apenas para as extensões de textura.
      overlay.addEventListener('click',e=>{
        const el=e.target instanceof Element?e.target:null;if(!el)return;

        const theme=el.closest('.doxa30-theme-option[data-theme]');
        if(theme&&EXTRA_THEMES[theme.dataset.theme]){
          e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
          applyExtraTheme(theme.dataset.theme,true);
          return;
        }

        const texture=el.closest('#doxa30PaperTexture,#doxa30LinenTexture,#doxa30MarbleTexture');
        if(texture){
          const val=TEXTURE_BUTTONS[texture.id];if(!val)return;
          e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
          const current=document.body.dataset.doxa30Texture||'none';
          applyTexture(current===val?'none':val,true);
        }
      },true);
    }

    return true;
  }

  function restoreExtras(){
    if(!ensureUi())return;
    const storedTheme=read(THEME_KEY,'night');
    if(EXTRA_THEMES[storedTheme])applyExtraTheme(storedTheme,false);

    const storedTexture=read(TEXTURE_KEY,'none');
    if(storedTexture==='marble')applyTexture('marble',false);
    else setTextureButtonState(document.body.dataset.doxa30Texture||'none');
  }

  let raf=0;
  const schedule=()=>{
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;restoreExtras()});
  };

  const boot=()=>{
    installStyle();schedule();
    const obs=new MutationObserver(schedule);
    obs.observe(document.body,{childList:true,subtree:true});
    // O shell 30.5 reaplica Night/None em dois timeouts próprios; restauramos extras depois deles.
    setTimeout(restoreExtras,650);
    setTimeout(restoreExtras,1550);
    setTimeout(restoreExtras,2300);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();



/* Doxa 63 · Home acompanha Rosé e Lavanda.
   O Home usa uma família própria de variáveis (--dh00...--dh82), por isso
   os dois temas novos precisam da mesma tradução cromática que Paper/Sepia/White/Olive.
   Texturas continuam deliberadamente fora da Home. */
(()=>{
  if(document.getElementById('doxa63HomeThemeStyle'))return;
  const st=document.createElement('style');
  st.id='doxa63HomeThemeStyle';
  st.textContent=`body[data-doxa30-theme="rose"]{--dh00:#F2DEDA;--dh01:#473034;--dh02:rgba(198,149,134,.08);--dh03:rgba(244,228,225,.98);--dh04:rgba(241,222,217,.995);--dh05:rgba(188,126,107,.19);--dh06:rgba(242,222,218,.66);--dh07:rgba(67,45,50,.035);--dh08:#887577;--dh09:#C68C7A;--dh10:#C18675;--dh11:#CD9482;--dh12:#7F5A55;--dh13:#432D32;--dh14:#806D6F;--dh15:#CA9A8C;--dh16:#745F60;--dh17:#C89485;--dh18:#462F33;--dh19:rgba(185,122,104,.48);--dh20:rgba(200,151,137,.23);--dh21:rgba(224,190,181,.98);--dh22:rgba(248,232,228,.96);--dh23:rgba(240,221,216,.99);--dh24:rgba(112,81,79,.05);--dh25:rgba(242,222,218,.33);--dh26:rgba(187,125,106,.07);--dh27:#C28E7E;--dh28:#634D50;--dh29:#A3776D;--dh30:rgba(242,222,218,.42);--dh31:rgba(198,140,122,0);--dh32:rgba(200,140,121,.28);--dh33:rgba(200,150,136,.1);--dh34:rgba(196,137,119,.54);--dh35:rgba(201,148,133,.32);--dh36:rgba(196,137,119,.42);--dh37:rgba(201,148,133,.24);--dh38:rgba(191,140,126,.75);--dh39:rgba(196,143,128,.43);--dh40:#6C5658;--dh41:rgba(67,45,50,.28);--dh42:#BF806C;--dh43:#CC9280;--dh44:#D8A595;--dh45:rgba(67,45,50,.06);--dh46:#897678;--dh47:rgba(67,45,50,.12);--dh48:rgba(67,45,50,.025);--dh49:rgba(191,136,120,.53);--dh50:rgba(208,167,155,.12);--dh51:rgba(195,136,119,.09);--dh52:#C68A77;--dh53:rgba(190,128,109,.1);--dh54:rgba(185,122,104,.18);--dh55:#5B4344;--dh56:#452F34;--dh57:rgba(67,45,50,.16);--dh58:rgba(241,222,217,.98);--dh59:rgba(241,222,217,.85);--dh60:rgba(241,222,217,.22);--dh61:rgba(241,222,217,.12);--dh62:#BF8675;--dh63:#614B4E;--dh64:#B97A68;--dh65:#976C63;--dh66:rgba(241,222,217,.62);--dh67:#432E33;--dh68:#B97D6B;--dh69:#EBDBD8;--dh70:#432D32;--dh71:rgba(242,222,218,.16);--dh72:rgba(241,222,217,.55);--dh73:#7F6C6E;--dh74:#9E8D8E;--dh75:#755F61;--dh76:rgba(185,122,104,.22);--dh77:#432E33;--dh78:rgba(191,136,120,.16);--dh79:#E3C9C3;--dh80:#EFDCD7;--dh81:#C08B7C;--dh82:#8D7B7D}
body[data-doxa30-theme="lavender"]{--dh00:#E7E0EC;--dh01:#383142;--dh02:rgba(170,146,171,.08);--dh03:rgba(235,230,240,.98);--dh04:rgba(230,224,235,.995);--dh05:rgba(152,122,153,.19);--dh06:rgba(231,224,236,.66);--dh07:rgba(53,46,62,.035);--dh08:#7D7784;--dh09:#A589A5;--dh10:#9E83A0;--dh11:#AC91AD;--dh12:#68596E;--dh13:#352E3E;--dh14:#746E7C;--dh15:#AD98B0;--dh16:#68606F;--dh17:#A992AC;--dh18:#373041;--dh19:rgba(149,119,149,.48);--dh20:rgba(172,149,174,.23);--dh21:rgba(202,190,208,.98);--dh22:rgba(239,234,244,.96);--dh23:rgba(229,223,234,.99);--dh24:rgba(94,81,100,.05);--dh25:rgba(231,224,236,.33);--dh26:rgba(151,121,152,.07);--dh27:#A48BA5;--dh28:#564E5E;--dh29:#8A768D;--dh30:rgba(231,224,236,.42);--dh31:rgba(165,137,165,0);--dh32:rgba(165,136,166,.28);--dh33:rgba(171,148,173,.1);--dh34:rgba(162,134,163,.54);--dh35:rgba(169,146,172,.32);--dh36:rgba(162,134,163,.42);--dh37:rgba(169,146,172,.24);--dh38:rgba(163,138,164,.75);--dh39:rgba(166,141,167,.43);--dh40:#5F5766;--dh41:rgba(53,46,62,.28);--dh42:#997C9B;--dh43:#AB8FAB;--dh44:#BAA2BC;--dh45:rgba(53,46,62,.06);--dh46:#7E7885;--dh47:rgba(53,46,62,.12);--dh48:rgba(53,46,62,.025);--dh49:rgba(160,134,161,.53);--dh50:rgba(184,166,187,.12);--dh51:rgba(159,133,162,.09);--dh52:#A386A4;--dh53:rgba(154,124,155,.1);--dh54:rgba(149,119,149,.18);--dh55:#4D4354;--dh56:#373140;--dh57:rgba(53,46,62,.16);--dh58:rgba(230,224,235,.98);--dh59:rgba(230,224,235,.85);--dh60:rgba(230,224,235,.22);--dh61:rgba(230,224,235,.12);--dh62:#9E839F;--dh63:#544C5C;--dh64:#957795;--dh65:#7D6B82;--dh66:rgba(230,224,235,.62);--dh67:#362F3F;--dh68:#977997;--dh69:#E3DDE7;--dh70:#352E3E;--dh71:rgba(231,224,236,.16);--dh72:rgba(230,224,235,.55);--dh73:#736D7B;--dh74:#948F9B;--dh75:#696170;--dh76:rgba(149,119,149,.22);--dh77:#362F3F;--dh78:rgba(160,134,161,.16);--dh79:#D4CAD8;--dh80:#E4DEE9;--dh81:#A288A3;--dh82:#827D8A}`;
  document.head.appendChild(st);
})();


/* ============================================================
   Doxa 64 · Copiar versos
   - remove "Copiar Verso" do menu contextual do toque longo;
   - cria "Copiar versos" em Ferramentas > Marcar e guardar;
   - entra no texto em modo de seleção;
   - a aba "Ferramentas" vira "Copiar" enquanto o modo está ativo;
   - permite selecionar um, vários ou o capítulo inteiro;
   - ao copiar, encerra o modo automaticamente.
   ============================================================ */
(()=>{
  'use strict';
  if(window.__doxa64CopyVersesInstalled)return;
  window.__doxa64CopyVersesInstalled=true;

  const $=id=>document.getElementById(id);
  const SVG_COPY='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8.3" y="7.2" width="10.2" height="11.3" rx="1.5"/><path d="M15.2 7.2V5.8A1.8 1.8 0 0 0 13.4 4H6.1a1.8 1.8 0 0 0-1.8 1.8v8.1a1.8 1.8 0 0 0 1.8 1.8h2.2"/></svg>';
  const SVG_CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5"/></svg>';
  const selected=new Set();
  let active=false;
  let chapterKey='';
  let toolsPrevHtml='';
  let toolsPrevAria='';
  let hostBound=false;
  let guardInstalled=false;
  let uiRaf=0;
  let observeRaf=0;

  function installStyle(){
    if($('doxa64CopyStyle'))return;
    const st=document.createElement('style');
    st.id='doxa64CopyStyle';
    st.textContent=`
      /* Card da ferramenta */
      #toolsCopyVersesStart .tool-card-icon svg{width:23px;height:23px}
      body.doxa-copy-mode #p-marcar.doxa59-tools-refined #toolsCopyVersesStart{
        background:linear-gradient(90deg,color-mix(in srgb,var(--d30-gold) 9%,transparent),transparent)!important
      }
      body.doxa-copy-mode #p-marcar.doxa59-tools-refined #toolsCopyVersesStart .tool-card-icon{
        box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--d30-gold2) 18%,transparent),0 0 18px color-mix(in srgb,var(--d30-gold2) 9%,transparent)!important
      }

      /* Mantém o HUD inferior visível durante a seleção. */
      body.doxa-copy-mode .doxa30-bottom-wrap,
      body.doxa-copy-mode #doxa30Bottom{
        transform:none!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important
      }

      /* Seleção do versículo */
      body.doxa-copy-mode #textBody .verse{
        position:relative;
        border-radius:15px;
        cursor:pointer;
        transition:background .22s ease,box-shadow .22s ease,transform .18s cubic-bezier(.2,.8,.2,1);
        -webkit-tap-highlight-color:transparent
      }
      body.doxa-copy-mode #textBody .verse:active{transform:scale(.993)}
      body.doxa-copy-mode #textBody .verse.doxa-copy-selected{
        background:
          linear-gradient(90deg,
            color-mix(in srgb,var(--d30-gold) 13%,transparent),
            color-mix(in srgb,var(--d30-gold2) 6%,transparent) 56%,
            transparent)!important;
        box-shadow:
          inset 0 0 0 1px color-mix(in srgb,var(--d30-gold2) 28%,transparent),
          0 7px 24px color-mix(in srgb,var(--d30-gold) 9%,transparent)!important;
        animation:doxaCopyVerseIn .34s cubic-bezier(.18,.9,.22,1) both
      }
      body.doxa-copy-mode #textBody .verse.doxa-copy-selected .vnum,
      body.doxa-copy-mode #textBody .verse.doxa-copy-selected sup.vnum{
        color:var(--d30-gold2)!important
      }
      .doxa-copy-mark{
        position:absolute;z-index:5;right:-7px;top:-7px;width:25px;height:25px;
        display:grid;place-items:center;border-radius:999px;pointer-events:none;
        color:var(--d30-bg);background:linear-gradient(145deg,var(--d30-gold2),var(--d30-gold));
        border:2px solid var(--d30-panel);
        box-shadow:0 5px 15px color-mix(in srgb,var(--d30-gold) 25%,transparent);
        font:900 13px/1 system-ui,sans-serif;
        animation:doxaCopyMarkIn .34s cubic-bezier(.18,.9,.22,1.25) both
      }
      .doxa-copy-ripple{
        position:absolute;z-index:4;right:-9px;top:-9px;width:29px;height:29px;border-radius:999px;
        pointer-events:none;border:1px solid color-mix(in srgb,var(--d30-gold2) 68%,transparent);
        animation:doxaCopyRipple .55s ease-out both
      }
      @keyframes doxaCopyVerseIn{
        0%{transform:scale(.986);filter:brightness(1)}
        52%{transform:scale(1.006);filter:brightness(1.08)}
        100%{transform:none;filter:none}
      }
      @keyframes doxaCopyMarkIn{
        0%{opacity:0;transform:scale(.2) rotate(-24deg)}
        70%{opacity:1;transform:scale(1.12) rotate(3deg)}
        100%{opacity:1;transform:none}
      }
      @keyframes doxaCopyRipple{
        0%{opacity:.85;transform:scale(.55)}
        100%{opacity:0;transform:scale(1.75)}
      }

      /* Controle flutuante do capítulo */
      .doxa-copy-console{
        position:fixed;z-index:74;left:50%;
        bottom:calc(env(safe-area-inset-bottom,0px) + 102px);
        width:min(430px,calc(100vw - 28px));min-height:52px;
        display:grid;grid-template-columns:minmax(0,1fr) auto 38px;align-items:center;gap:8px;
        padding:7px;border-radius:19px;
        color:var(--d30-text);
        background:color-mix(in srgb,var(--d30-panel) 91%,transparent);
        border:1px solid color-mix(in srgb,var(--d30-gold) 21%,transparent);
        box-shadow:0 16px 38px rgba(0,0,0,.22),inset 0 1px 0 color-mix(in srgb,var(--d30-text) 5%,transparent);
        -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
        opacity:0;transform:translate(-50%,18px) scale(.97);pointer-events:none;
        transition:opacity .22s ease,transform .3s cubic-bezier(.18,.9,.22,1)
      }
      .doxa-copy-console.on{opacity:1;transform:translate(-50%,0) scale(1);pointer-events:auto}
      .doxa-copy-all{
        min-width:0;height:38px;border:0;border-radius:13px;padding:0 11px;
        display:flex;align-items:center;gap:8px;text-align:left;
        color:var(--d30-text);background:color-mix(in srgb,var(--d30-gold) 7%,transparent);
        font:720 11px/1 system-ui,sans-serif
      }
      .doxa-copy-all svg{width:17px;height:17px;flex:0 0 17px;color:var(--d30-gold2)}
      .doxa-copy-all span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .doxa-copy-all.all{
        color:var(--d30-gold2);
        background:color-mix(in srgb,var(--d30-gold) 12%,transparent)
      }
      .doxa-copy-count{
        min-width:48px;height:38px;padding:0 8px;border-radius:13px;
        display:flex;align-items:baseline;justify-content:center;gap:4px;
        color:var(--d30-muted);background:color-mix(in srgb,var(--d30-text) 4%,transparent)
      }
      .doxa-copy-count b{color:var(--d30-gold2);font:850 14px/1 system-ui,sans-serif}
      .doxa-copy-count small{font:650 8px/1 system-ui,sans-serif}
      .doxa-copy-cancel{
        width:38px;height:38px;border:0;border-radius:13px;display:grid;place-items:center;
        color:var(--d30-muted);background:transparent;font:300 27px/1 system-ui,sans-serif
      }
      .doxa-copy-cancel:active,.doxa-copy-all:active{transform:scale(.95)}

      /* A aba Ferramentas vira uma ação contextual. */
      #doxa30Tools.doxa-copy-action{
        position:relative!important;color:var(--d30-gold2)!important;
        overflow:visible!important
      }
      #doxa30Tools.doxa-copy-action::after{
        content:"";position:absolute;left:50%;top:50%;width:48px;height:48px;border-radius:50%;
        transform:translate(-50%,-60%);pointer-events:none;z-index:-1;
        background:radial-gradient(circle,color-mix(in srgb,var(--d30-gold) 15%,transparent),transparent 70%);
        animation:doxaCopyNavAura 2.2s ease-in-out infinite
      }
      #doxa30Tools.doxa-copy-action>svg{
        animation:doxaCopyNavIn .34s cubic-bezier(.18,.9,.22,1) both
      }
      #doxa30Tools.doxa-copy-action>span{
        color:var(--d30-gold2)!important;
        animation:doxaCopyLabelIn .3s cubic-bezier(.18,.9,.22,1) both
      }
      .doxa-copy-nav-count{
        position:absolute;top:1px;left:calc(50% + 9px);
        min-width:17px;height:17px;padding:0 4px;display:grid;place-items:center;border-radius:999px;
        background:var(--d30-gold2);color:var(--d30-bg);
        border:2px solid var(--d30-panel);
        font:900 8px/1 system-ui,sans-serif;
        transform:scale(0);opacity:0;transition:transform .22s cubic-bezier(.18,.9,.22,1.25),opacity .15s ease
      }
      #doxa30Tools.doxa-copy-ready .doxa-copy-nav-count{transform:scale(1);opacity:1}
      #doxa30Tools.doxa-copy-ready>svg{
        filter:drop-shadow(0 0 7px color-mix(in srgb,var(--d30-gold2) 42%,transparent))
      }
      #doxa30Tools.doxa-copy-nudge{animation:doxaCopyNudge .34s ease}
      #doxa30Tools.doxa-copy-success>svg{animation:doxaCopySuccess .5s cubic-bezier(.18,.9,.22,1) both}
      @keyframes doxaCopyNavAura{50%{transform:translate(-50%,-60%) scale(1.16);opacity:.58}}
      @keyframes doxaCopyNavIn{0%{opacity:0;transform:scale(.5) rotate(-10deg)}100%{opacity:1;transform:none}}
      @keyframes doxaCopyLabelIn{0%{opacity:0;transform:translateY(4px)}100%{opacity:1;transform:none}}
      @keyframes doxaCopyNudge{25%{transform:translateX(-3px)}55%{transform:translateX(3px)}80%{transform:translateX(-1px)}}
      @keyframes doxaCopySuccess{0%{transform:scale(.65)}55%{transform:scale(1.18)}100%{transform:none}}

      /* Pequeno aviso de entrada/erro. */
      .doxa-copy-toast{
        position:fixed;z-index:130;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 172px);
        max-width:calc(100vw - 36px);padding:10px 14px;border-radius:999px;
        color:var(--d30-text);background:color-mix(in srgb,var(--d30-panel) 94%,transparent);
        border:1px solid color-mix(in srgb,var(--d30-gold) 18%,transparent);
        box-shadow:0 12px 30px rgba(0,0,0,.2);
        font:700 11px/1.2 system-ui,sans-serif;white-space:nowrap;
        opacity:0;transform:translate(-50%,10px) scale(.97);
        transition:opacity .18s ease,transform .25s cubic-bezier(.18,.9,.22,1);
        pointer-events:none
      }
      .doxa-copy-toast.on{opacity:1;transform:translate(-50%,0) scale(1)}

      @media(max-width:380px){
        .doxa-copy-console{width:calc(100vw - 20px);grid-template-columns:minmax(0,1fr) auto 36px;padding:6px}
        .doxa-copy-all{padding:0 9px}.doxa-copy-count{min-width:44px}
      }
      @media(prefers-reduced-motion:reduce){
        body.doxa-copy-mode #textBody .verse,
        body.doxa-copy-mode #textBody .verse.doxa-copy-selected,
        .doxa-copy-mark,.doxa-copy-ripple,.doxa-copy-console,
        #doxa30Tools.doxa-copy-action::after,
        #doxa30Tools.doxa-copy-action>svg,
        #doxa30Tools.doxa-copy-action>span,
        #doxa30Tools.doxa-copy-success>svg{animation:none!important;transition:none!important}
      }
    `;
    document.head.appendChild(st);
  }

  function removeOldContextCopy(){
    document.querySelector('#verseActions [data-va="copy"]')?.remove();
  }

  function flashCopy(text){
    let el=$('doxaCopyToast');
    if(!el){
      el=document.createElement('div');
      el.id='doxaCopyToast';
      el.className='doxa-copy-toast';
      document.body.appendChild(el);
    }
    el.textContent=text;
    el.classList.remove('on');
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('on')));
    clearTimeout(el.__timer);
    el.__timer=setTimeout(()=>el.classList.remove('on'),1500);
  }

  function makeCard(){
    let b=$('toolsCopyVersesStart');
    if(b)return b;
    b=document.createElement('button');
    b.type='button';
    b.id='toolsCopyVersesStart';
    b.className='tool-card';
    b.innerHTML='<span class="tool-card-icon">'+SVG_COPY+'</span><span class="tool-card-copy"><strong>Copiar versos</strong><small>Selecione um, vários ou todo o capítulo.</small></span><span class="tool-card-arrow" aria-hidden="true">›</span>';
    b.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      startMode();
    },true);
    return b;
  }

  function placeCard(){
    const panel=$('p-marcar');if(!panel)return false;
    const b=makeCard();

    if(panel.classList.contains('doxa59-tools-refined')){
      const keep=[...panel.querySelectorAll('.doxa59-tools-group')].find(g=>
        /Marcar e guardar/i.test(g.querySelector('.doxa59-tools-group-head')?.textContent||'')
      );
      const stack=keep?.querySelector('.doxa59-tools-stack');
      if(stack){
        const hi=$('toolsHighlightStart');
        if(hi&&hi.parentElement===stack){
          if(hi.nextElementSibling!==b)hi.insertAdjacentElement('afterend',b);
        }else if(b.parentElement!==stack)stack.prepend(b);
        return true;
      }
    }

    const hi=$('toolsHighlightStart');
    if(hi){
      if(hi.nextElementSibling!==b)hi.insertAdjacentElement('afterend',b);
      return true;
    }
    if(!b.isConnected)panel.appendChild(b);
    return true;
  }

  function verseNo(el){
    const n=Number(el?.dataset?.v||String(el?.id||'').replace(/^v/,''));
    return Number.isFinite(n)?n:0;
  }

  function currentChapterLabel(){
    return String($('doxa30Ref')?.textContent||$('hdrRef')?.textContent||'').trim().replace(/\s+∥.+$/,'');
  }

  function currentVersionLabel(){
    try{
      if(typeof mode!=='undefined'&&typeof VERSION_META!=='undefined'&&VERSION_META[mode]){
        return VERSION_META[mode].label||VERSION_META[mode].short||String(mode);
      }
    }catch(e){}
    return String($('doxa30VersionText')?.textContent||'').trim();
  }

  function keyNow(){
    let m='';try{m=typeof mode!=='undefined'?String(mode):''}catch(e){}
    return currentChapterLabel()+'|'+m+'|'+currentVersionLabel();
  }

  function currentVerses(){
    const host=$('textBody');if(!host)return[];
    return [...host.querySelectorAll('.verse')].filter(v=>verseNo(v)>0);
  }

  function cleanDisconnected(){
    let changed=false;
    for(const el of [...selected]){
      if(!el?.isConnected||!el.closest('#textBody')){
        selected.delete(el);changed=true;
      }
    }
    return changed;
  }

  function addMark(el,animate=true){
    if(!el)return;
    el.classList.add('doxa-copy-selected');
    if(!el.querySelector(':scope>.doxa-copy-mark')){
      const mark=document.createElement('span');
      mark.className='doxa-copy-mark';
      mark.setAttribute('aria-hidden','true');
      mark.textContent='✓';
      el.appendChild(mark);
    }
    if(animate){
      const old=el.querySelector(':scope>.doxa-copy-ripple');old?.remove();
      const r=document.createElement('span');
      r.className='doxa-copy-ripple';r.setAttribute('aria-hidden','true');
      el.appendChild(r);setTimeout(()=>r.remove(),620);
    }
  }

  function removeMark(el){
    if(!el)return;
    el.classList.remove('doxa-copy-selected');
    el.querySelectorAll(':scope>.doxa-copy-mark,:scope>.doxa-copy-ripple').forEach(x=>x.remove());
  }

  function toggleVerse(el,force){
    if(!active||!el)return;
    const want=force===undefined?!selected.has(el):!!force;
    if(want){
      selected.add(el);addMark(el,true);
      try{if(!window.__doxaLongPressActive)navigator.vibrate?.(8)}catch(e){}
    }else{
      selected.delete(el);removeMark(el);
    }
    updateUi();
  }

  function clearSelection(){
    for(const el of [...selected])removeMark(el);
    selected.clear();
    updateUi();
  }

  function ensureConsole(){
    let c=$('doxaCopyConsole');
    if(c)return c;
    c=document.createElement('div');
    c.id='doxaCopyConsole';
    c.className='doxa-copy-console';
    c.setAttribute('aria-hidden','true');
    c.innerHTML='<button class="doxa-copy-all" id="doxaCopyAll" type="button">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>'+
      '<span>Capítulo inteiro</span></button>'+
      '<span class="doxa-copy-count"><b id="doxaCopyCount">0</b><small>versos</small></span>'+
      '<button class="doxa-copy-cancel" id="doxaCopyCancel" type="button" aria-label="Cancelar cópia">×</button>';
    document.body.appendChild(c);

    $('doxaCopyAll')?.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      if(!active)return;
      const verses=currentVerses();
      const all=verses.length>0&&verses.every(v=>selected.has(v));
      if(all){
        clearSelection();
      }else{
        verses.forEach((v,i)=>{
          selected.add(v);
          addMark(v,false);
          v.style.setProperty('--doxa-copy-delay',Math.min(i*10,320)+'ms');
        });
        try{navigator.vibrate?.(12)}catch(_){}
        updateUi();
      }
    });

    $('doxaCopyCancel')?.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();finishMode(false);
    });
    return c;
  }

  function updateUi(){
    if(uiRaf)return;
    uiRaf=requestAnimationFrame(()=>{
      uiRaf=0;
      cleanDisconnected();
      const count=selected.size;
      const verses=currentVerses();
      const all=verses.length>0&&verses.every(v=>selected.has(v));

      const countEl=$('doxaCopyCount');if(countEl)countEl.textContent=String(count);
      const allBtn=$('doxaCopyAll');
      if(allBtn){
        allBtn.classList.toggle('all',all);
        const s=allBtn.querySelector('span');
        if(s)s.textContent=all?'Desmarcar capítulo':'Capítulo inteiro';
      }

      const tools=$('doxa30Tools');
      if(tools&&active){
        tools.classList.toggle('doxa-copy-ready',count>0);
        const badge=tools.querySelector('.doxa-copy-nav-count');
        if(badge)badge.textContent=count>99?'99+':String(count);
      }
    });
  }

  function showConsole(){
    const c=ensureConsole();
    c.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>requestAnimationFrame(()=>c.classList.add('on')));
  }

  function hideConsole(){
    const c=$('doxaCopyConsole');if(!c)return;
    c.classList.remove('on');c.setAttribute('aria-hidden','true');
  }

  function enterNavAction(){
    const tools=$('doxa30Tools');if(!tools)return false;
    toolsPrevHtml=tools.innerHTML;
    toolsPrevAria=tools.getAttribute('aria-label')||'Ferramentas';
    tools.innerHTML=SVG_COPY+'<span>Copiar</span><b class="doxa-copy-nav-count">0</b>';
    tools.setAttribute('aria-label','Copiar versos selecionados');
    tools.classList.add('doxa-copy-action');
    tools.classList.remove('lupa-exit');
    return true;
  }

  function restoreNav(success=false){
    const tools=$('doxa30Tools');if(!tools)return;
    const restore=()=>{
      if(toolsPrevHtml)tools.innerHTML=toolsPrevHtml;
      tools.setAttribute('aria-label',toolsPrevAria||'Ferramentas');
      tools.classList.remove('doxa-copy-action','doxa-copy-ready','doxa-copy-nudge','doxa-copy-success');
      toolsPrevHtml='';toolsPrevAria='';
    };
    if(!success){restore();return}
    tools.innerHTML=SVG_CHECK+'<span>Copiado</span>';
    tools.classList.remove('doxa-copy-ready');
    tools.classList.add('doxa-copy-success');
    setTimeout(restore,720);
  }

  function leaveOtherModes(){
    try{window.DoxaLupa?.setMode?.(false)}catch(e){}
    try{if(document.body.classList.contains('doxa-timeline-mode'))$('tlModeExit')?.click()}catch(e){}
    try{
      const bar=$('hlModeBar');
      if(bar&&!bar.hidden)$('hlModeExit')?.click();
    }catch(e){}
    try{
      if(document.body.classList.contains('parallel-mode')){
        if(typeof setParallelMode==='function')setParallelMode(false);
        else $('parallelExit')?.click();
      }
    }catch(e){}
    try{window.DoxaVerseActions?.close?.()}catch(e){}
  }

  function startMode(){
    if(active)return;
    installStyle();removeOldContextCopy();placeCard();
    leaveOtherModes();

    const tools=$('doxa30Tools');
    if(!tools){flashCopy('Abra a Bíblia e tente novamente.');return}

    active=true;selected.clear();chapterKey=keyNow();
    document.body.classList.add('doxa-copy-mode');
    if(!enterNavAction()){active=false;document.body.classList.remove('doxa-copy-mode');return}
    try{openPanel('ler')}catch(e){}
    document.body.classList.remove('hud-hidden');
    bindHost();installVerseGuard();showConsole();updateUi();
    flashCopy('Toque nos versos que deseja copiar');
    try{navigator.vibrate?.(10)}catch(_){}
  }

  function finishMode(success=false){
    if(!active&&!success)return;
    active=false;
    document.body.classList.remove('doxa-copy-mode');
    hideConsole();
    clearSelection();
    restoreNav(success);
  }

  function verseText(el){
    const c=el.cloneNode(true);
    c.querySelectorAll('.vnum,sup.vnum,.doxa-copy-mark,.doxa-copy-ripple,.verse-smoke,.verse-handle,.xref-trigger,.note-pin,.doxa-note-mark,button').forEach(x=>x.remove());
    return String(c.textContent||'').replace(/\s+/g,' ').trim();
  }

  async function writeClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch(e){
      try{
        const ta=document.createElement('textarea');
        ta.value=text;ta.setAttribute('readonly','');
        ta.style.position='fixed';ta.style.left='-9999px';ta.style.top='0';ta.style.opacity='0';
        document.body.appendChild(ta);ta.focus();ta.select();
        const ok=document.execCommand('copy');ta.remove();return !!ok;
      }catch(_){return false}
    }
  }

  async function copySelected(){
    cleanDisconnected();
    const list=[...selected].filter(x=>x.isConnected).sort((a,b)=>verseNo(a)-verseNo(b));
    if(!list.length){
      const tools=$('doxa30Tools');
      tools?.classList.remove('doxa-copy-nudge');
      void tools?.offsetWidth;
      tools?.classList.add('doxa-copy-nudge');
      flashCopy('Selecione ao menos um versículo');
      try{navigator.vibrate?.([18,35,18])}catch(_){}
      return;
    }

    const base=currentChapterLabel()||'Passagem';
    const version=currentVersionLabel();
    const lines=list.map(el=>base+':'+verseNo(el)+' — '+verseText(el));
    const text=lines.join('\n')+(version?'\n\n'+version:'');
    const n=list.length;
    const ok=await writeClipboard(text);
    if(!ok){flashCopy('Não foi possível copiar.');return}

    finishMode(true);
    flashCopy(n===1?'Verso copiado':n+' versos copiados');
    try{navigator.vibrate?.(18)}catch(_){}
  }

  function bindHost(){
    if(hostBound)return;
    const host=$('textBody');if(!host)return;
    hostBound=true;

    host.addEventListener('click',e=>{
      if(!active)return;
      const el=e.target instanceof Element?e.target.closest('.verse'):null;
      if(!el)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      toggleVerse(el);
    },true);

    const obs=new MutationObserver(()=>{
      if(!active)return;
      const k=keyNow();
      if(k!==chapterKey){
        for(const el of [...selected])removeMark(el);
        selected.clear();chapterKey=k;
      }else cleanDisconnected();
      updateUi();
    });
    obs.observe(host,{childList:true,subtree:true});
  }

  function installVerseGuard(){
    if(guardInstalled||!window.DoxaVerseActions?.open)return;
    const original=window.DoxaVerseActions.open;
    if(original.__doxa64CopyGuard){guardInstalled=true;return}
    const wrapped=function(el){
      if(active){
        toggleVerse(el);
        return;
      }
      return original.apply(this,arguments);
    };
    wrapped.__doxa64CopyGuard=true;
    window.DoxaVerseActions.open=wrapped;
    guardInstalled=true;
  }

  function bindNavCapture(){
    if(window.__doxa64CopyNavBound)return;
    window.__doxa64CopyNavBound=true;
    window.addEventListener('click',e=>{
      if(!active)return;
      const el=e.target instanceof Element?e.target:null;
      if(!el?.closest('#doxa30Tools'))return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      copySelected();
    },true);
  }

  function scheduleMaintenance(){
    if(observeRaf)return;
    observeRaf=requestAnimationFrame(()=>{
      observeRaf=0;
      installStyle();
      removeOldContextCopy();
      placeCard();
      bindHost();
      installVerseGuard();
    });
  }

  function boot(){
    installStyle();removeOldContextCopy();bindNavCapture();scheduleMaintenance();
    const obs=new MutationObserver(scheduleMaintenance);
    obs.observe(document.body,{childList:true,subtree:true});
    setTimeout(scheduleMaintenance,500);
    setTimeout(scheduleMaintenance,1300);
    setTimeout(scheduleMaintenance,2600);

    document.addEventListener('keydown',e=>{
      if(active&&e.key==='Escape'){e.preventDefault();finishMode(false)}
    });

    window.DoxaCopyVerses={
      start:startMode,
      cancel:()=>finishMode(false),
      copy:copySelected,
      selectAll:()=>{
        if(!active)return;
        for(const v of currentVerses()){selected.add(v);addMark(v,false)}
        updateUi();
      },
      active:()=>active
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
