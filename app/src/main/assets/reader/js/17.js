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

