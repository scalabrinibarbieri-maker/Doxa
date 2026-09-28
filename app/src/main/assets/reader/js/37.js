/* Doxa V50 · Comparar textos via Supabase + Comentários premium */
(()=>{
  'use strict';

  const SUPABASE_URL='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const SUPABASE_KEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  const COMPARE_URL=SUPABASE_URL+'/functions/v1/doxa-verse-compare';

  const VERSION_ORDER=['almeida','blivre','tb','nvi','ntlh','naa','kja','kjf','jfaa','as21','ara','arc','wlc','lxx','tr','hyper'];
  const VERSION_INFO={
    almeida:{mark:'A',name:'Almeida 1819',sub:'Português · versão principal'},
    blivre:{mark:'BL',name:'Bíblia Livre',sub:'Português · CC BY 4.0'},
    tb:{mark:'TB',name:'Tradução Brasileira',sub:'Português'},
    nvi:{mark:'NV',name:'Nova Versão Internacional',sub:'Português'},
    ntlh:{mark:'NL',name:'Nova Tradução na Linguagem de Hoje',sub:'Português'},
    naa:{mark:'NA',name:'Nova Almeida Atualizada',sub:'Português'},
    kja:{mark:'KJ',name:'King James Atualizada',sub:'Português'},
    kjf:{mark:'KF',name:'King James Fiel',sub:'Português'},
    jfaa:{mark:'JF',name:'João Ferreira de Almeida Atualizada',sub:'Português'},
    as21:{mark:'21',name:'Almeida Século 21',sub:'Português'},
    ara:{mark:'RA',name:'Almeida Revista e Atualizada',sub:'Português'},
    arc:{mark:'RC',name:'Almeida Revista e Corrigida',sub:'Português'},
    wlc:{mark:'א',name:'WLC · Texto Massorético',sub:'Hebraico'},
    lxx:{mark:'LXX',name:'Septuaginta',sub:'Grego · LXX'},
    tr:{mark:'Ω',name:'Textus Receptus 1550',sub:'Grego · Novo Testamento'},
    hyper:{mark:'H',name:'Tradução Hiperliteral Doxa',sub:'Projeto Doxa'}
  };
  const COMMENTARY_INFO={
    'matthew-henry':{mark:'MH',short:'Henry'},
    'jamieson-fausset-brown':{mark:'JFB',short:'JFB'},
    'adam-clarke':{mark:'AC',short:'Clarke'},
    'john-gill':{mark:'JG',short:'Gill'}
  };

  let activeRef=null;
  let compareRequest=0;
  let compareDbPromise=null;
  let commentRaf=0;
  let compareRaf=0;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  document.addEventListener('doxa-study-active-ref',e=>{
    if(e.detail) activeRef={...e.detail};
  });

  /* ---------- cache leve: somente referências já comparadas ---------- */
  function compareDb(){
    if(compareDbPromise)return compareDbPromise;
    compareDbPromise=new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){resolve(null);return}
      const q=indexedDB.open('doxa-verse-compare-v1',1);
      q.onupgradeneeded=()=>{
        if(!q.result.objectStoreNames.contains('verses'))q.result.createObjectStore('verses');
      };
      q.onsuccess=()=>resolve(q.result);
      q.onerror=()=>reject(q.error);
    }).catch(()=>null);
    return compareDbPromise;
  }
  async function cacheGet(key){
    try{
      const db=await compareDb(); if(!db)return null;
      return await new Promise((resolve,reject)=>{
        const q=db.transaction('verses','readonly').objectStore('verses').get(key);
        q.onsuccess=()=>resolve(q.result||null); q.onerror=()=>reject(q.error);
      });
    }catch{return null}
  }
  async function cachePut(key,value){
    try{
      const db=await compareDb(); if(!db)return;
      await new Promise((resolve,reject)=>{
        const tx=db.transaction('verses','readwrite');
        tx.objectStore('verses').put(value,key);
        tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);
      });
    }catch{}
  }

  function refKey(r){return String(r.book)+':'+Number(r.chapter)+':'+Number(r.verse)}
  function localVerse(version,r){
    try{
      if(typeof CORPORA==='undefined')return '';
      const cp=CORPORA[version]; if(!cp?.books)return '';
      const b=cp.books.find(x=>x.book===r.book);
      const c=b?.chapters?.find(x=>Number(x.chapter)===Number(r.chapter));
      const v=c?.verses?.find(x=>Number(x.number)===Number(r.verse));
      return String(v?.text||'').trim();
    }catch{return ''}
  }
  function mergeLocalTexts(texts,r){
    const out={...(texts||{})};
    for(const version of VERSION_ORDER){
      if(out[version])continue;
      const t=localVerse(version,r);
      if(t)out[version]=t;
    }
    return out;
  }

  async function requestComparison(r){
    const response=await fetch(COMPARE_URL,{
      method:'POST',
      cache:'no-store',
      headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({book:r.book,chapter:Number(r.chapter),verse:Number(r.verse)})
    });
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json();
    return data&&typeof data.texts==='object'?data.texts:{};
  }

  function sortedVersions(texts,r){
    const found=Object.keys(texts||{}).filter(k=>String(texts[k]||'').trim());
    const ordered=[
      ...VERSION_ORDER.filter(k=>found.includes(k)),
      ...found.filter(k=>!VERSION_ORDER.includes(k))
    ];
    const source=r?.sourceMode;
    if(source&&ordered.includes(source)){
      ordered.splice(ordered.indexOf(source),1);
      ordered.unshift(source);
    }
    return ordered;
  }

  function compareLoading(body,r){
    body.innerHTML=
      '<section class="doxa-compare-v50 is-loading">'+
        '<div class="doxa-compare-hero">'+
          '<span class="doxa-compare-kicker">COMPARAÇÃO</span>'+
          '<h2>'+esc(r?.label||'Passagem')+'</h2>'+
          '<div class="doxa-compare-goldline"></div>'+
          '<p>Buscando somente este versículo nas versões do Doxa…</p>'+
        '</div>'+
        '<div class="doxa-compare-skeletons">'+
          '<i></i><i></i><i></i><i></i>'+
        '</div>'+
      '</section>';
  }

  function renderComparison(body,r,texts,opts={}){
    texts=mergeLocalTexts(texts,r);
    const versions=sortedVersions(texts,r);
    if(!versions.length){
      body.innerHTML=
        '<section class="doxa-compare-v50">'+
          '<div class="doxa-compare-hero"><span class="doxa-compare-kicker">COMPARAÇÃO</span><h2>'+esc(r.label||'Passagem')+'</h2><div class="doxa-compare-goldline"></div></div>'+
          '<div class="doxa-compare-empty"><span>⌁</span><strong>Nenhum texto disponível</strong><p>Esta referência ainda não está disponível no comparador.</p></div>'+
        '</section>';
      return;
    }

    const chips=versions.map(v=>{
      const info=VERSION_INFO[v]||{mark:v.slice(0,3).toUpperCase(),name:v,sub:''};
      return '<button type="button" data-compare-jump="'+esc(v)+'"><span>'+esc(info.mark)+'</span>'+esc(info.mark==='LXX'?'LXX':(info.name.split(' ')[0]||v))+'</button>';
    }).join('');

    const cards=versions.map((v,i)=>{
      const info=VERSION_INFO[v]||{mark:v.slice(0,3).toUpperCase(),name:v,sub:''};
      const current=r.sourceMode===v;
      const lang=v==='wlc'?'he':(v==='lxx'||v==='tr'?'grc':'pt-BR');
      const dir=v==='wlc'?'rtl':'ltr';
      return '<article id="doxaCompareCard-'+esc(v)+'" class="doxa-compare-card '+(current?'is-current ':'')+(v==='wlc'?'is-hebrew ':'')+(v==='lxx'||v==='tr'?'is-greek ':'')+'" style="--i:'+i+'" data-compare-version="'+esc(v)+'">'+
        '<header>'+
          '<span class="doxa-compare-mark">'+esc(info.mark)+'</span>'+
          '<span class="doxa-compare-name"><strong>'+esc(info.name)+'</strong><small>'+esc(info.sub)+(current?' · versão de origem':'')+'</small></span>'+
          '<button type="button" class="doxa-compare-copy" data-compare-copy="'+esc(v)+'" aria-label="Copiar '+esc(info.name)+'">'+
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h10v11H9z"/><path d="M5 5h10v11"/></svg>'+
          '</button>'+
        '</header>'+
        '<div class="doxa-compare-text" lang="'+lang+'" dir="'+dir+'">'+esc(texts[v])+'</div>'+
      '</article>';
    }).join('');

    body.innerHTML=
      '<section class="doxa-compare-v50">'+
        '<div class="doxa-compare-hero">'+
          '<span class="doxa-compare-kicker">COMPARAÇÃO</span>'+
          '<h2>'+esc(r.label||'Passagem')+'</h2>'+
          '<div class="doxa-compare-goldline"></div>'+
          '<p><b>'+versions.length+'</b> '+(versions.length===1?'versão disponível':'versões disponíveis')+' para esta passagem'+(opts.cached?' · cache local':'')+'</p>'+
        '</div>'+
        '<div class="doxa-compare-jump" aria-label="Ir para uma versão">'+chips+'</div>'+
        (opts.offline?'<div class="doxa-compare-offline">Sem conexão agora · mostrando o que já estava salvo neste aparelho.</div>':'')+
        '<div class="doxa-compare-stack">'+cards+'</div>'+
        '<p class="doxa-compare-foot">O comparador consulta apenas a referência selecionada. As Bíblias completas não são carregadas nesta tela.</p>'+
      '</section>';
  }

  async function enhanceCompare(){
    const screen=document.getElementById('studyScreen');
    const body=document.getElementById('studyBody');
    const title=document.getElementById('studyTitle');
    if(!screen?.classList.contains('on')||!body||title?.textContent?.trim()!=='Comparar versos'||!activeRef)return;

    const r={...activeRef};
    const key=refKey(r);
    if(body.dataset.doxaRemoteCompare===key&&body.querySelector('.doxa-compare-v50'))return;
    body.dataset.doxaRemoteCompare=key;
    const seq=++compareRequest;
    compareLoading(body,r);

    const cached=await cacheGet(key);
    if(seq!==compareRequest||refKey(activeRef||{})!==key)return;
    if(cached?.texts)renderComparison(body,r,cached.texts,{cached:true});

    try{
      const texts=await requestComparison(r);
      if(seq!==compareRequest||refKey(activeRef||{})!==key)return;
      const merged=mergeLocalTexts(texts,r);
      await cachePut(key,{texts:merged,t:Date.now()});
      renderComparison(body,r,merged);
    }catch(e){
      if(seq!==compareRequest||refKey(activeRef||{})!==key)return;
      if(cached?.texts)renderComparison(body,r,cached.texts,{cached:true,offline:true});
      else{
        const local=mergeLocalTexts({},r);
        if(Object.keys(local).length)renderComparison(body,r,local,{offline:true});
        else body.innerHTML=
          '<section class="doxa-compare-v50"><div class="doxa-compare-error"><span>⌁</span><strong>Comparador indisponível agora</strong><p>Na primeira abertura desta passagem, o Comparar textos precisa de internet.</p><button type="button" id="doxaCompareRetry">Tentar novamente</button></div></section>';
        document.getElementById('doxaCompareRetry')?.addEventListener('click',()=>{delete body.dataset.doxaRemoteCompare;enhanceCompare()},{once:true});
      }
    }
  }

  function scheduleCompare(){
    cancelAnimationFrame(compareRaf);
    compareRaf=requestAnimationFrame(enhanceCompare);
  }

  document.getElementById('studyBody')?.addEventListener('click',async e=>{
    const jump=e.target.closest('[data-compare-jump]');
    if(jump){
      const card=document.getElementById('doxaCompareCard-'+jump.dataset.compareJump);
      card?.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    const copy=e.target.closest('[data-compare-copy]');
    if(copy){
      const card=copy.closest('[data-compare-version]');
      const text=card?.querySelector('.doxa-compare-text')?.textContent?.trim()||'';
      const version=copy.dataset.compareCopy;
      const info=VERSION_INFO[version]||{name:version};
      const value=text+'\n\n'+(activeRef?.label||'')+' — '+info.name;
      try{await navigator.clipboard.writeText(value)}
      catch{
        const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
      }
      copy.classList.add('copied');
      setTimeout(()=>copy.classList.remove('copied'),800);
      try{if(typeof flash==='function')flash('Verso copiado.')}catch{}
    }
  });

  const studyBody=document.getElementById('studyBody');
  if(studyBody)new MutationObserver(scheduleCompare).observe(studyBody,{childList:true,subtree:false});
  const studyTitle=document.getElementById('studyTitle');
  if(studyTitle)new MutationObserver(scheduleCompare).observe(studyTitle,{childList:true,characterData:true,subtree:true});

  /* ---------- Comentários: mantém a fonte atual e troca apenas apresentação ---------- */
  function commentSkeleton(host){
    if(!host||host.dataset.v50Skeleton)return;
    host.dataset.v50Skeleton='1';
    host.classList.add('v50-comments-loading');
    host.innerHTML='<div class="v50-comment-skeleton hero"></div><div class="v50-comment-skeleton"></div><div class="v50-comment-skeleton"></div>';
  }

  function enhanceComments(){
    const adv=document.getElementById('v20Advanced');
    const body=document.getElementById('v20AdvBody');
    const title=document.getElementById('v20AdvTitle');
    if(!adv?.classList.contains('on')||!body||title?.textContent?.trim()!=='Comentários')return;

    const loading=body.querySelector('#v20CommentHost.v20-loading');
    if(loading){commentSkeleton(loading);return}

    const tabs=body.querySelector('.v20-tabs');
    if(tabs&&!tabs.classList.contains('v50-comment-tabs')){
      tabs.classList.add('v50-comment-tabs');
      tabs.querySelectorAll('[data-commentary]').forEach(btn=>{
        const info=COMMENTARY_INFO[btn.dataset.commentary]||{mark:'C',short:btn.textContent.trim()};
        btn.innerHTML='<span class="v50-comment-tab-mark">'+esc(info.mark)+'</span><span>'+esc(info.short)+'</span>';
      });
    }

    const source=body.querySelector('.v20-comment-source');
    if(source&&!source.closest('.v50-comment-hero')){
      const hero=document.createElement('section');
      hero.className='v50-comment-hero';
      hero.innerHTML=
        '<span class="v50-comment-book" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M5 6.5c4-1.3 7.3-1 11 1.1v18c-3.7-2.1-7-2.4-11-1.1z"/><path d="M27 6.5c-4-1.3-7.3-1-11 1.1v18c3.7-2.1 7-2.4 11-1.1z"/><path d="M16 7.6v18"/></svg></span>'+
        '<div class="v50-comment-hero-copy"></div>'+
        '<div class="v50-comment-line"></div>';
      source.parentNode.insertBefore(hero,source);
      hero.querySelector('.v50-comment-hero-copy').appendChild(source);

      const words=[...body.querySelectorAll('.v20-card.v20-comment')].reduce((n,el)=>n+(el.textContent.trim().match(/\S+/g)||[]).length,0);
      const mins=Math.max(1,Math.round(words/210));
      const meta=document.createElement('div');
      meta.className='v50-comment-meta';
      meta.innerHTML='<span>'+esc(document.getElementById('v20AdvRef')?.textContent||'')+'</span>'+(words?'<span>'+mins+' min de leitura</span>':'');
      hero.querySelector('.v50-comment-hero-copy').appendChild(meta);
    }

    body.querySelectorAll('.v20-card.v20-comment').forEach((card,i)=>{
      if(card.classList.contains('v50-comment-card'))return;
      card.classList.add('v50-comment-card');
      card.style.setProperty('--i',String(i));
      const num=document.createElement('span');
      num.className='v50-comment-number';
      num.textContent=String(i+1).padStart(2,'0');
      card.prepend(num);
    });

    body.querySelectorAll('details.v20-card').forEach(el=>el.classList.add('v50-comment-intro'));
    const generic=body.querySelector('#v20CommentHost > .v20-card:not(.v20-comment):not(details)');
    if(generic)generic.classList.add('v50-comment-empty');
  }

  function scheduleComments(){
    cancelAnimationFrame(commentRaf);
    commentRaf=requestAnimationFrame(enhanceComments);
  }
  const advBody=document.getElementById('v20AdvBody');
  if(advBody)new MutationObserver(scheduleComments).observe(advBody,{childList:true,subtree:true});
  const advTitle=document.getElementById('v20AdvTitle');
  if(advTitle)new MutationObserver(scheduleComments).observe(advTitle,{childList:true,characterData:true,subtree:true});

  scheduleCompare();
  scheduleComments();
})();
