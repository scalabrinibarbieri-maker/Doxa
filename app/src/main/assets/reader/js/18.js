(()=>{
  'use strict';
  if(window.__doxa30ShellInstalled)return;
  window.__doxa30ShellInstalled=true;

  const $=s=>document.querySelector(s);
  const stop=e=>e.stopPropagation();

  function svgSearch(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.7"></circle><path d="M16 16l5 5"></path></svg>'}
  function svgHome(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8"></path><path d="M5.5 9.8V21h5.2v-6.1h2.6V21h5.2V9.8"></path></svg>'}
  function svgBible(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 5.2c2.8-.9 5.2-.5 8 1.3v13c-2.8-1.8-5.2-2.2-8-1.3Z"></path><path d="M20 5.2c-2.8-.9-5.2-.5-8 1.3v13c2.8-1.8 5.2-2.2 8-1.3Z"></path></svg>'}
  function svgTools(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M14.8 5.3a5 5 0 0 0-6.1 6.2L3.5 16.7a2.5 2.5 0 1 0 3.6 3.6l5.2-5.2a5 5 0 0 0 6.2-6.1l-3.1 3.1-3.4-.8-.8-3.4Z"></path></svg>'}
  function svgMore(){return '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><circle cx="5" cy="12" r="1.7"></circle><circle cx="12" cy="12" r="1.7"></circle><circle cx="19" cy="12" r="1.7"></circle></svg>'}

  function shortVersionLabel(raw){
    const t=String(raw||'').trim();
    if(/Almeida\s*1819/i.test(t))return '1819';
    if(/WLC|Hebraico/i.test(t))return 'Hebraico';
    if(/Textus\s+Receptus|TR\s*1550/i.test(t))return 'Grego';
    if(/Tradução Brasileira/i.test(t))return 'TB';
    if(/Nova Versão Internacional/i.test(t))return 'NVI';
    if(/Nova Tradução na Linguagem de Hoje/i.test(t))return 'NTLH';
    if(/Nova Almeida Atualizada/i.test(t))return 'NAA';
    if(/King James Atualizada/i.test(t))return 'KJA';
    if(/King James Fiel/i.test(t))return 'KJF';
    if(/João Ferreira de Almeida Atualizada/i.test(t))return 'JFAA';
    if(/Almeida Século 21/i.test(t))return 'AS21';
    if(/Almeida Revista e Atualizada/i.test(t))return 'ARA';
    if(/Almeida Revista e Corrigida/i.test(t))return 'ARC';
    if(/Bíblia Livre/i.test(t))return 'BLIVRE';
    if(/hiperliteral/i.test(t))return 'Hiperliteral';
    return t.length>11?t.slice(0,11):t;
  }

  function installTop(){
    const header=document.querySelector('body>header');
    if(!header||header.querySelector('.doxa30-top'))return;
    header.querySelector('.brand-seal')?.remove();
    const top=document.createElement('div');
    top.className='doxa30-top';
    top.innerHTML='\
      <button class="doxa30-btn" id="doxa30Settings" type="button" aria-label="Ajustes"><span class="doxa30-hamb"><span></span></span></button>\
      <button class="doxa30-selector" id="doxa30Passage" type="button" aria-label="Selecionar passagem"><span class="txt" id="doxa30Ref">Gênesis 1</span><span class="doxa30-chevron"></span></button>\
      <button class="doxa30-selector version" id="doxa30Version" type="button" aria-label="Selecionar versão"><span id="doxa30VersionText">1819</span><span class="doxa30-chevron"></span></button>\
      <button class="doxa30-btn" id="doxa30Search" type="button" aria-label="Pesquisar">'+svgSearch()+'</button>\
      <button class="doxa30-btn doxa30-bread-btn" id="doxa30Bread" type="button" aria-label="Pão Diário"><span class="doxa30-bread-stage" id="doxa30BreadStage"><img class="doxa30-bread-state doxa30-bread-inactive" src="assets/doxa_pao_inativo.png" alt=""><img class="doxa30-bread-state doxa30-bread-active" src="assets/doxa_pao_ativo.png" alt="Pão Diário"><span class="doxa30-bread-ring"></span></span></button>';
    header.appendChild(top);

    ['doxa30Settings','doxa30Passage','doxa30Version','doxa30Search','doxa30Bread'].forEach(id=>{
      const el=document.getElementById(id);if(!el)return;
      ['touchstart','touchmove','touchend','pointerdown','pointerup'].forEach(t=>el.addEventListener(t,stop,{passive:true}));
      el.addEventListener('click',stop);
    });

    $('#doxa30Settings')?.addEventListener('click',()=>window.openPanel?.('ajustes'));
    $('#doxa30Search')?.addEventListener('click',()=>window.openPanel?.('buscar'));
    $('#doxa30Passage')?.addEventListener('click',()=>document.querySelector('header .headmain')?.click());
    $('#doxa30Version')?.addEventListener('click',()=>document.getElementById('versionTrigger')?.click());
    $('#doxa30Bread')?.addEventListener('click',()=>showToast(isEarnedToday()?'Pão Diário concluído hoje':'Leia o capítulo até o fim'));
  }

  function installBottom(){
    if($('.doxa30-bottom-wrap'))return;
    const wrap=document.createElement('div');wrap.className='doxa30-bottom-wrap';
    wrap.innerHTML='<nav class="doxa30-bottom" id="doxa30Bottom" data-active="bible" aria-label="Navegação principal">\
      <button class="doxa30-nav-item" id="doxa30Home" type="button" aria-label="Início">'+svgHome()+'<span>Início</span></button>\
      <button class="doxa30-nav-item active" id="doxa30Bible" type="button" aria-label="Bíblia">'+svgBible()+'<span>Bíblia</span></button>\
      <button class="doxa30-nav-item" id="doxa30Tools" type="button" aria-label="Ferramentas">'+svgTools()+'<span>Ferramentas</span></button>\
      <button class="doxa30-nav-item" id="doxa30More" type="button" aria-label="Mais">'+svgMore()+'<span>Mais</span></button>\
    </nav>';
    document.body.appendChild(wrap);
    ['doxa30Home','doxa30Bible','doxa30Tools','doxa30More'].forEach(id=>{
      const el=document.getElementById(id);if(!el)return;
      ['touchstart','touchmove','touchend','pointerdown','pointerup'].forEach(t=>el.addEventListener(t,stop,{passive:true}));
      el.addEventListener('click',stop);
    });
    $('#doxa30Home')?.addEventListener('click',()=>{}); // reservado para a futura tela Início
    $('#doxa30Bible')?.addEventListener('click',()=>window.openPanel?.('ler'));
    $('#doxa30Tools')?.addEventListener('click',()=>window.openPanel?.('marcar'));
    $('#doxa30More')?.addEventListener('click',()=>openMore());
  }

  function setActive(panel){
    const bottom=$('#doxa30Bottom');if(!bottom)return;
    const map={ler:'doxa30Bible',marcar:'doxa30Tools'};
    bottom.querySelectorAll('.doxa30-nav-item').forEach(x=>x.classList.remove('active'));
    const id=map[panel]||'doxa30Bible';
    document.getElementById(id)?.classList.add('active');
    bottom.dataset.active=panel==='marcar'?'tools':'bible';
  }

  function mirrorHud(){
    const oldRef=$('#hdrRef'),oldVersionTitle=$('#versionTriggerTitle'),ref=$('#doxa30Ref'),version=$('#doxa30VersionText');
    const currentVersionRaw=()=>{
      try{
        const m=(typeof mode!=='undefined')?mode:null;
        const meta=(m&&typeof VERSION_META!=='undefined')?VERSION_META[m]:null;
        if(meta)return meta.label||meta.short||m;
      }catch(e){}
      return (oldVersionTitle?.textContent||'').trim();
    };
    const sync=()=>{
      if(ref&&oldRef){
        let t=(oldRef.textContent||'').trim().replace(/\s+∥.+$/,'');
        t=t.replace(/^(Gn)\s+/,'Gênesis ').replace(/^(Êx)\s+/,'Êxodo ');
        ref.textContent=t||'Gênesis 1';
      }
      if(version){
        version.textContent=shortVersionLabel(currentVersionRaw())||'1819';
      }
    };
    window.Doxa30SyncHud=sync;
    sync();
    if(oldRef)new MutationObserver(sync).observe(oldRef,{childList:true,subtree:true,characterData:true});
    if(oldVersionTitle)new MutationObserver(sync).observe(oldVersionTitle,{childList:true,subtree:true,characterData:true});
    try{new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']})}catch(e){}
    document.getElementById('versionSelect')?.addEventListener('change',()=>setTimeout(sync,0));
    setInterval(sync,1300);
  }

  function installPanelTracking(){
    const base=window.openPanel;
    if(typeof base==='function'&&!base.__doxa30){
      const wrapped=function(name){const r=base.apply(this,arguments);setActive(name);return r};
      wrapped.__doxa30=true;window.openPanel=wrapped;
    }
    setActive(document.getElementById('p-marcar')?.classList.contains('on')?'marcar':'ler');
  }

  const THEME_KEY='doxa:30.5:theme';
  const THEMES={
    paper:{bg:'#EFE5D7',bg2:'#E1D2BC',panel:'#F8F0E5',text:'#2E2018',muted:'#6D5A49',gold:'#BF8333',gold2:'#D8A35B',texture:true},
    sepia:{bg:'#D8B98D',bg2:'#CDA977',panel:'#E2C59A',text:'#332317',muted:'#6E5138',gold:'#A96D36',gold2:'#C98B52',texture:true},
    white:{bg:'#FCFBF8',bg2:'#F4F2ED',panel:'#FFFFFF',text:'#1F1E1B',muted:'#69655F',gold:'#AA7B43',gold2:'#C79B67',texture:false},
    night:{bg:'#050403',bg2:'#0A0705',panel:'#0D0A07',text:'#F4EFE9',muted:'#A99B8B',gold:'#D9A25E',gold2:'#F1C989',texture:false},
    olive:{bg:'#B9B79A',bg2:'#A8A687',panel:'#C5C3A7',text:'#25261C',muted:'#575947',gold:'#656746',gold2:'#85865C',texture:true}
  };
  let currentTheme='night';
  function themeStored(){try{return localStorage.getItem(THEME_KEY)||'night'}catch(e){return'night'}}
  function setRootThemeVars(t){const root=document.documentElement.style;root.setProperty('--d30-bg',t.bg);root.setProperty('--d30-bg2',t.bg2);root.setProperty('--d30-panel',t.panel);root.setProperty('--d30-text',t.text);root.setProperty('--d30-muted',t.muted);root.setProperty('--d30-gold',t.gold);root.setProperty('--d30-gold2',t.gold2)}
  function applyTheme(name,save=true){
    if(!THEMES[name])name='night';currentTheme=name;const t=THEMES[name];document.body.dataset.doxa30Theme=name;setRootThemeVars(t);
    const vals={normalPageColor:t.bg,normalTextColor:t.text,normalAccentColor:t.gold,normalChromeColor:t.panel};
    for(const [id,value] of Object.entries(vals)){const el=document.getElementById(id);if(!el)continue;el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))}
    const texture=document.getElementById('normalTexture');if(texture){texture.checked=!!t.texture;texture.dispatchEvent(new Event('change',{bubbles:true}))}
    document.querySelectorAll('.doxa30-theme-option').forEach(b=>b.classList.toggle('on',b.dataset.theme===name));
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=t.bg;if(save){try{localStorage.setItem(THEME_KEY,name)}catch(e){}}
  }
  function hideAppearanceFromSettings(){const card=document.getElementById('normalAppearanceCard');if(!card)return;const h=card.previousElementSibling;if(h&&h.tagName==='H2')h.hidden=true;card.hidden=true}
  function closeOverlay(el){el?.classList.remove('on');setActive(document.getElementById('p-marcar')?.classList.contains('on')?'marcar':'ler')}
  function ensureMoreUi(){
    if(document.getElementById('doxa30MoreOverlay'))return;
    const more=document.createElement('div');more.id='doxa30MoreOverlay';more.className='doxa30-overlay';
    more.innerHTML='<div class="doxa30-sheet"><div class="doxa30-grab"></div><h2>Mais</h2><div class="doxa30-more-list"><button class="doxa30-more-row" id="doxa30OpenThemes" type="button"><span class="doxa30-more-icon">◐</span><span class="doxa30-more-copy"><strong>Temas</strong><small>Paper, Sepia, White, Night e Olive</small></span><span class="doxa30-more-arrow">›</span></button></div></div>';
    const themes=document.createElement('div');themes.id='doxa30ThemeOverlay';themes.className='doxa30-overlay doxa30-theme-overlay';
    const labels={paper:'Paper',sepia:'Sepia',white:'White',night:'Night',olive:'Olive'};
    themes.innerHTML='<div class="doxa30-theme-tray"><div class="doxa30-theme-grid">'+['paper','sepia','white','night','olive'].map(k=>'<button class="doxa30-theme-option" type="button" data-theme="'+k+'"><span class="doxa30-swatch '+k+'"></span><span>'+labels[k]+'</span></button>').join('')+'</div></div>';
    document.body.append(more,themes);
    more.addEventListener('click',e=>{if(e.target===more)closeOverlay(more)});themes.addEventListener('click',e=>{if(e.target===themes)closeOverlay(themes)});
    document.getElementById('doxa30OpenThemes')?.addEventListener('click',e=>{e.stopPropagation();more.classList.remove('on');setTimeout(()=>themes.classList.add('on'),70)});
    themes.querySelectorAll('.doxa30-theme-option').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();applyTheme(b.dataset.theme,true)}));
  }
  function openMore(){ensureMoreUi();hideAppearanceFromSettings();const bottom=$('#doxa30Bottom');if(bottom){bottom.querySelectorAll('.doxa30-nav-item').forEach(x=>x.classList.remove('active'));$('#doxa30More')?.classList.add('active');bottom.dataset.active='more'}document.getElementById('doxa30MoreOverlay')?.classList.add('on')}
  function installThemes(){ensureMoreUi();hideAppearanceFromSettings();applyTheme(themeStored(),false);setTimeout(()=>{hideAppearanceFromSettings();applyTheme(currentTheme,false)},500);setTimeout(()=>{hideAppearanceFromSettings();applyTheme(currentTheme,false)},1300)}

  function applyDefaultNightOnce(){
    const key='doxa:30.5:new-shell-default-night';
    try{if(localStorage.getItem(key)==='1')return}catch(e){}
    const vals={normalPageColor:'#050403',normalTextColor:'#F4EFE9',normalAccentColor:'#D9A25E',normalChromeColor:'#0D0A07'};
    let ok=false;
    for(const [id,value] of Object.entries(vals)){
      const el=document.getElementById(id);if(!el)continue;
      el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));ok=true;
    }
    const texture=document.getElementById('normalTexture');if(texture){texture.checked=false;texture.dispatchEvent(new Event('change',{bubbles:true}))}
    if(ok){try{localStorage.setItem(key,'1')}catch(e){}}
  }

  const dateKey=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const earnedKey='doxa:pao-diario:last-earned';
  const streakKey='doxa:pao-diario:streak';
  const earnedDate=()=>{try{return localStorage.getItem(earnedKey)||''}catch(e){return''}};
  const isEarnedToday=()=>earnedDate()===dateKey();
  function yesterdayKey(){const d=new Date();d.setDate(d.getDate()-1);return dateKey(d)}

  let toastTimer=0;
  function showToast(text){
    let el=$('.doxa30-streak-toast');if(!el){el=document.createElement('div');el.className='doxa30-streak-toast';document.body.appendChild(el)}
    el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1500);
  }

  function applyBreadState(){
    const stage=$('#doxa30BreadStage');if(!stage)return;
    stage.classList.remove('earned','earned-static');
    if(isEarnedToday())stage.classList.add('earned-static');
  }

  function earnBread(){
    if(isEarnedToday())return;
    const previous=earnedDate();let streak=1;
    try{streak=previous===yesterdayKey()?Math.max(1,Number(localStorage.getItem(streakKey)||0)+1):1}catch(e){}
    try{localStorage.setItem(earnedKey,dateKey());localStorage.setItem(streakKey,String(streak))}catch(e){}
    const stage=$('#doxa30BreadStage');if(!stage)return;
    stage.classList.remove('earned-static');stage.classList.add('earned');
    showToast(streak>1?'Pão Diário · '+streak+' dias':'Pão Diário conquistado');
    setTimeout(()=>{stage.classList.remove('earned');stage.classList.add('earned-static')},5600);
  }

  let readCheckRaf=0;
  function checkReadingComplete(){
    if(readCheckRaf)return;
    readCheckRaf=requestAnimationFrame(()=>{
      readCheckRaf=0;
      if(isEarnedToday())return;
      if(!document.getElementById('p-ler')?.classList.contains('on'))return;
      if(window.parallelOn||document.body.classList.contains('parallel-mode'))return;
      const host=document.getElementById('singleReader');if(!host)return;
      const r=host.getBoundingClientRect();
      // Considera concluído quando o final real do capítulo entra na área visível.
      if(r.bottom<=window.innerHeight+28)earnBread();
    });
  }

  function installStreak(){
    applyBreadState();
    window.addEventListener('scroll',checkReadingComplete,{passive:true});
    window.addEventListener('resize',checkReadingComplete,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){applyBreadState();checkReadingComplete()}});
    setTimeout(checkReadingComplete,700);
  }

  function init(){
    installTop();installBottom();mirrorHud();installPanelTracking();installStreak();installThemes();
    // O leitor já nasce em Almeida 1819 na 30.5; não sobrescrevemos uma escolha posterior do usuário.
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
