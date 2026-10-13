/* Doxa · Interlinear Pergaminho Vivo · substitui somente o controlador v63.
   Bancos 49d.js / 49-gen-*.js intactos. Hebraico, morfologia e léxico: OSHB instalado.
   Glosas e transliterações: banco Doxa existente. Não afeta o interlinear do versículo. */
(()=>{
  'use strict';
  if(window.DoxaInterlinear2?.__scrollEdition)return;

  const FILES={'Gen.1':'js/49d.js','Gen.2':'js/49-gen-02.js','Gen.3':'js/49-gen-03.js',
    'Gen.4':'js/49-gen-04.js','Gen.5':'js/49-gen-05.js','Gen.6':'js/49-gen-06.js',
    'Gen.7':'js/49-gen-07.js','Gen.8':'js/49-gen-08.js','Gen.9':'js/49-gen-09.js',
    'Gen.10':'js/49-gen-10.js','Gen.11':'js/49-gen-11.js',
    'Gen.12':'js/49-gen-12.js',
    'Gen.13':'js/49-gen-13.js','Gen.14':'js/49-gen-14.js','Gen.15':'js/49-gen-15.js',
    'Gen.16':'js/49-gen-16.js','Gen.17':'js/49-gen-17.js'};
  const NAMES={Gen:'Gênesis'},LAYERS_KEY='doxa-il2-layers';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId=id=>document.getElementById(id);
  const bookNameIl=b=>NAMES[b]||b;
  const bookKey=(b,c)=>b+'.'+Number(c);
  const wait={};
  function load(key){
    window.DOXA_IL2=window.DOXA_IL2||{};
    if(window.DOXA_IL2[key])return Promise.resolve(window.DOXA_IL2[key]);
    if(wait[key])return wait[key];
    if(!FILES[key])return Promise.reject(new Error('Capítulo ainda não disponível.'));
    wait[key]=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.async=true;script.src=FILES[key];
      script.onload=()=>{delete wait[key];const data=window.DOXA_IL2[key];data?resolve(data):reject(new Error('O banco não contém este capítulo.'))};
      script.onerror=()=>{delete wait[key];script.remove();reject(new Error('Falha ao carregar o banco interlinear.'))};
      document.head.appendChild(script);
    });
    return wait[key];
  }
  const oshbItems=(b,c,v)=>{try{return OSHB_STRONG.d[OSHB_BOOK_INDEX[b]][c-1][v-1]||null}catch(_){return null}};
  const POS={A:'adjetivo',C:'conjunção',D:'advérbio',N:'substantivo',P:'pronome',R:'preposição',S:'sufixo',T:'partícula',V:'verbo'};
  const GEN={m:'masculino',f:'feminino',b:'masculino ou feminino',c:'comum'};
  const NUM={s:'singular',p:'plural',d:'dual'};
  const STATE={a:'absoluto',c:'construto',d:'determinado'};
  const STEM={q:'Qal',N:'Nifal',p:'Piel',P:'Pual',h:'Hifil',H:'Hofal',t:'Hitpael',o:'Polel',O:'Polal',r:'Hitpolel',m:'Poel',M:'Poal',k:'Palel',K:'Pulal',Q:'Qal passivo',l:'Pilpel',L:'Polpal',f:'Hitpalpel',D:'Nitpael',j:'Pealal',i:'Pilel',u:'Hotpaal',c:'Tifil',v:'Hishtafel',w:'Nitpalel',y:'Nitpoel',z:'Hitpoel'};
  const VT={p:'perfeito',q:'perfeito consecutivo',i:'imperfeito',w:'imperfeito consecutivo',h:'coortativo',j:'jussivo',v:'imperativo',r:'particípio ativo',s:'particípio passivo',a:'infinitivo absoluto',c:'infinitivo construto'};
  const VTS={p:'perf.',q:'perf. consec.',i:'imperf.',w:'wayyiqtol',h:'coort.',j:'jussivo',v:'imperat.',r:'part. ativo',s:'part. passivo',a:'inf. abs.',c:'inf. constr.'};
  const NTYPE={c:'comum',g:'gentílico',p:'próprio'}, ATYPE={a:'adjetivo',c:'numeral cardinal',g:'gentílico',o:'numeral ordinal'}, PTYPE={d:'demonstrativo',f:'indefinido',i:'interrogativo',p:'pessoal',r:'relativo'};
  const TTYPE={a:'afirmação',d:'artigo definido',e:'exortação',i:'interrogativa',j:'interjeição',m:'demonstrativa',n:'negação',o:'marca do objeto direto',r:'relativa'};
  const SUF={'1cs':'meu / me','2ms':'teu / te','2fs':'teu / te','3ms':'dele','3fs':'dela','1cp':'nosso / nos','2mp':'vosso / vos','2fp':'vosso / vos','3mp':'deles','3fp':'delas'};
  const shortGen=g=>({m:'masc.',f:'fem.'})[g]||'';
  const shortNum=n=>({s:'sing.',p:'pl.',d:'dual'})[n]||'';
  const person=(p,g,n)=>(({1:'1ª',2:'2ª',3:'3ª'})[p]||'')+' pessoa '+(GEN[g]||'')+' '+(NUM[n]||'');
  function segment(s){
    const c=s[0],r=s.slice(1),o={pos:POS[c]||c,tags:[],short:''};
    if(c==='N'){
      o.tags.push(NTYPE[r[0]]||r[0]);
      if(r[0]==='p'){if(r[1]==='l')o.tags.push('nome de lugar');else if(r[1])o.tags.push(GEN[r[1]]||r[1])}
      else{if(r[1])o.tags.push(GEN[r[1]]);if(r[2])o.tags.push(NUM[r[2]]);if(r[3])o.tags.push(STATE[r[3]])}
      o.short=r[0]==='p'?'nome próprio':['subst.',shortGen(r[1]),shortNum(r[2]),r[3]==='c'?'constr.':''].filter(Boolean).join(' ');
    }else if(c==='A'){
      o.tags.push(ATYPE[r[0]]||r[0]);if(r[1])o.tags.push(GEN[r[1]]);if(r[2])o.tags.push(NUM[r[2]]);if(r[3])o.tags.push(STATE[r[3]]);
      o.short=[({a:'adj.',c:'num.',o:'ordinal',g:'gentílico'})[r[0]],shortGen(r[1]),shortNum(r[2]),r[3]==='c'?'constr.':''].filter(Boolean).join(' ');
    }else if(c==='V'){
      const t=r[1],rest=r.slice(2);o.tags.push(STEM[r[0]],VT[t]);let pn='';
      if(t==='r'||t==='s'){o.tags.push(GEN[rest[0]],NUM[rest[1]]);if(rest[2])o.tags.push(STATE[rest[2]]);pn=(rest[0]||'')+(rest[1]||'')}
      else if(t!=='a'&&t!=='c'&&rest){o.tags.push(person(rest[0],rest[1],rest[2]));pn=rest}
      o.short=['verbo',STEM[r[0]],VTS[t],pn].filter(Boolean).join(' · ');
    }else if(c==='P'){
      o.tags.push(PTYPE[r[0]]||r[0]);if(r[0]==='p'&&r.length>=4)o.tags.push(person(r[1],r[2],r[3]));
      else{if(r[1])o.tags.push(GEN[r[1]]);if(r[2])o.tags.push(NUM[r[2]])}
      o.short='pron.';
    }else if(c==='R'){o.pos=r[0]==='d'?'preposição + artigo':'preposição';o.short=r[0]==='d'?'prep. + art.':'prep.'}
    else if(c==='T'){o.pos=r[0]==='d'?'artigo':'partícula';if(r[0]!=='d')o.tags.push(TTYPE[r[0]]||r[0]);o.short=r[0]==='d'?'art.':r[0]==='o'?'marca do obj.':'partíc.'}
    else if(c==='S'){
      if(r[0]==='p'){const k=r.slice(1);o.pos='sufixo pronominal';o.tags.push(person(k[0],k[1],k[2]),SUF[k]||k);o.short='suf.'}
      else{o.pos=({d:'he direcional',h:'he paragógico',n:'nun paragógico'})[r[0]]||'sufixo';o.short=o.pos}
    }else if(c==='C')o.short='conj.';
    else if(c==='D')o.short='adv.';
    o.tags=o.tags.filter(Boolean).map(x=>String(x).replace(/\s+/g,' ').trim());return o;
  }
  const decode=code=>String(code||'').slice(1).split('/').filter(Boolean).map(segment);
  function shortMorph(code){
    const a=decode(code);if(!a.length)return'';
    const small=x=>['conj.','art.','prep.','prep. + art.','suf.'].includes(x.short);
    const major=[...a].reverse().find(x=>!small(x))||a[a.length-1];
    return a.map(x=>x===major?x.short:x.short.split(' ')[0]).join(' + ');
  }
  const OBJ='<span class="il2-obj">obj.</span>';
  const glossHtml=x=>esc(x).replace(/\bobj\b/g,OBJ);
  const stripNiqqud=x=>String(x).replace(/[\u0591-\u05BD\u05BF-\u05C7]/g,'');
  let layers={tr:true,gl:true,mo:true,parts:false,lit:true};
  try{const saved=JSON.parse(localStorage.getItem(LAYERS_KEY)||'null');if(saved&&typeof saved==='object')layers={...layers,...saved}}catch(_){}
  const saveLayers=()=>{try{localStorage.setItem(LAYERS_KEY,JSON.stringify(layers))}catch(_){}};
  let screen=null,scroller=null,frame=null,sheet=null,scrim=null,navPanel=null;
  let state=null,place=null,modeIl='interlinear',settingsOpen=false,navOpen=false,selected=null,raf=0,scrollRAF=0;
  let focusBefore=null;

  /* ================================================================
     O R O L O : conteúdo contínuo com direção hebraica preservada.
     ================================================================ */
  function verseHtml(book,c,v,data){
    const tokens=oshbItems(book,c,v),verse=data.verses?.[v-1];
    if(!tokens||!verse)throw new Error('Versículo fora do banco interlinear.');
    const indexed=[];
    tokens.forEach((t,i)=>{if(Array.isArray(t))indexed.push({t,ti:i,maqaf:false});else if(t==='־'&&indexed.length)indexed[indexed.length-1].maqaf=true});
    if(indexed.length!==verse.length||indexed.some((item,k)=>item.t[0]!==verse[k][0]))
      throw new Error('O texto hebraico instalado difere do banco interlinear.');
    const html=indexed.map(({t,ti,maqaf},k)=>{
      const [surface,tr,gloss,parts]=verse[k], morph=data.morphFix?.[v+'.'+k]||OSHB_STRONG.m[t[2]]||'';
      const segs=String(t[4]||t[0]).split('/'),decoded=decode(morph);
      const heb=segs.length>1?segs.map((s,j)=>'<span class="il2-seg-h s'+Math.min(3,j)+'">'+esc(s)+'</span>').join(''):esc(surface);
      const partHtml=segs.map((s,j)=>'<span class="il2-mini-part"><i>'+esc(decoded[j]?.pos||'')+'</i><b>'+glossHtml(parts[j]||'')+'</b></span>').join('');
      const unpointed=stripNiqqud(surface)+(maqaf?'־':'');
      return '<button type="button" class="il2-word" data-il2="'+esc(JSON.stringify({book,c,v,ti,w:k}))+'" aria-label="'+esc(surface+': '+gloss)+'">'
        +'<span class="il2-heb" dir="rtl"><span class="il2-pointed">'+heb+'</span><span class="il2-unpointed">'+esc(unpointed)+'</span>'+(maqaf?'<span class="il2-maqaf">־</span>':'')+'</span>'
        +'<span class="il2-tr">'+esc(tr)+'</span><span class="il2-gl">'+glossHtml(gloss)+'</span>'
        +'<span class="il2-mo">'+esc(shortMorph(morph))+'</span><span class="il2-parts">'+partHtml+'</span></button>';
    }).join('');
    return '<section class="il2-verse" id="il2-v'+v+'" data-v="'+v+'">'
      +'<div class="il2-verse-number"><span class="il2-verse-line"></span><span>'+v+'</span><span class="il2-verse-line"></span></div>'
      +'<div class="il2-flow" dir="rtl">'+html+'</div>'
      +'<p class="il2-lit" dir="ltr">'+glossHtml(verse.map(x=>x[2]).join(' '))+'</p>'
      +'</section>';
  }
  function chapterHtml(book,c,data){
    const sections=data.verses.map((_,idx)=>verseHtml(book,c,idx+1,data)).join('');
    const label=bookNameIl(book);
    return '<div class="il2-document">'
      +'<div class="il2-manuscript-head"><div class="il2-filigree">✧ &nbsp; ✦ &nbsp; ✧</div><div class="il2-scroll-kicker">דוקסה · כתבי הקודש</div>'
      +'<h1>'+esc(label)+'</h1><p>פרק '+esc(String(c))+' <span aria-hidden="true">·</span> '+esc(label)+' '+c+'</p>'
      +'<div class="il2-head-rule"></div></div>'
      +'<div class="il2-verses">'+sections+'</div>'
      +'<footer class="il2-colophon"><span class="il2-colophon-symbol">✦</span><b>DOXA · INTERLINEAR</b>'
      +'<small>Texto e morfologia: WLC / OSHB · Glosas e transliteração: Doxa</small>'
      +'<div class="il2-chapter-links">'+prevNext(book,c)+'</div></footer></div>';
  }
  function prevNext(book,c){
    const prev=FILES[bookKey(book,c-1)]?'<button type="button" data-goto="'+bookKey(book,c-1)+'">‹ '+esc(bookNameIl(book))+' '+(c-1)+'</button>':'';
    const next=FILES[bookKey(book,c+1)]?'<button type="button" data-goto="'+bookKey(book,c+1)+'">'+esc(bookNameIl(book))+' '+(c+1)+' ›</button>':'';
    return prev+next;
  }
  function unavailableHtml(label){
    return '<div class="il2-empty"><div class="il2-empty-sigil">✧</div><small>PERGAMINHO DOXA</small><h2>'+esc(label||'Este capítulo')+'</h2>'
      +'<p>O interlinear deste capítulo ainda está sendo preparado. O pergaminho é expandido capítulo a capítulo.</p>'
      +'<div class="il2-available">'+Object.keys(FILES).map(k=>'<button type="button" data-goto="'+k+'">'+esc(bookNameIl(k.split('.')[0]))+' '+k.split('.')[1]+'</button>').join('')+'</div></div>';
  }
  function scrollTemplate(){return '<div class="il2-frame" id="il2Frame">'
    +'<div class="il2-roll il2-roll-left" aria-hidden="true"><span class="il2-roll-finial"></span><span class="il2-roll-core"></span><span class="il2-roll-finial"></span></div>'
    +'<div class="il2-scroll" id="il2Scroll" role="region" aria-label="Pergaminho interlinear"><div class="il2-loading">Abrindo o pergaminho…</div></div>'
    +'<div class="il2-roll il2-roll-right" aria-hidden="true"><span class="il2-roll-finial"></span><span class="il2-roll-core"></span><span class="il2-roll-finial"></span></div>'
    +'<div class="il2-scroll-shadow il2-scroll-shadow-left" aria-hidden="true"></div><div class="il2-scroll-shadow il2-scroll-shadow-right" aria-hidden="true"></div>'
    +'</div>'}
  function topTemplate(){return '<div class="il2-top">'
    +'<div class="il2-title-row"><button type="button" class="il2-back" data-action="close" aria-label="Fechar pergaminho">‹</button>'
    +'<div class="il2-heading"><small>דוקסה · O PERGAMINHO VIVO</small><strong>Interlinear</strong></div>'
    +'<button type="button" class="il2-icon-button" data-action="verseNav" aria-expanded="false" aria-label="Navegar por capítulos e versículos">☷</button></div>'
    +'<div class="il2-readingbar"><span class="il2-current-ref">—</span><div class="il2-mode-switch" role="group" aria-label="Modo de leitura">'
    +'<button type="button" data-action="interlinear" aria-pressed="true">Interlinear</button><button type="button" data-action="torah" aria-pressed="false">Torá</button>'
    +'</div><button type="button" class="il2-layer-toggle" data-action="layers" aria-expanded="false" aria-label="Escolher camadas">✥</button></div>'
    +'<div class="il2-toolbar" hidden>'+layerButtons()+'</div>'
    +'</div>'}
  function layerButtons(){return [['tr','Transliteração'],['gl','Glosa'],['mo','Morfologia'],['parts','Partes da palavra'],['lit','Linha hiperliteral']].map(([k,n])=>
    '<button type="button" class="il2-chip" data-layer="'+k+'" aria-pressed="'+(layers[k]?'true':'false')+'">'+n+'</button>').join('')}
  function readerPlace(){
    try{
      const cp=CORPORA[mode]||null,p=positions[mode];if(!cp||!p)return null;
      const b=cp.books[p.b];if(!b)return null;
      let v=1;const nodes=Array.from(document.querySelectorAll('#textBody [id^="v"]'));
      const first=nodes.find(el=>el.getBoundingClientRect().bottom>110);
      if(first){const n=Number(first.dataset.v||String(first.id).replace(/^v/,''));if(n>0)v=n}
      return {book:b.book,c:Number(p.c),v,label:(typeof bookName==='function'?bookName(b):bookNameIl(b.book))+' '+p.c};
    }catch(_){return null}
  }
  function ensureScreen(){
    if(screen)return;
    screen=document.createElement('section');screen.id='il2Screen';screen.className='il2-screen';screen.setAttribute('aria-hidden','true');
    screen.innerHTML=topTemplate()+'<div class="il2-stage">'+scrollTemplate()+'</div>'
      +'<div class="il2-bottom"><span class="il2-bottom-seal" aria-hidden="true">✦</span><span class="il2-progress-text">TOQUE NO HEBRAICO PARA EXAMINAR</span><span class="il2-progress-count">—</span><div class="il2-progress-track"><i></i></div></div>'
      +'<div class="il2-nav-scrim" hidden></div><div class="il2-nav-panel" hidden></div>';
    document.body.appendChild(screen);
    scroller=screen.querySelector('.il2-scroll');frame=screen.querySelector('.il2-frame');navPanel=screen.querySelector('.il2-nav-panel');
    scroller.addEventListener('scroll',queueScroll,{passive:true});
    screen.addEventListener('click',e=>{
      const action=e.target.closest('[data-action]');
      if(action){const a=action.dataset.action;
        if(a==='close'){closeTool();return}
        if(a==='interlinear'||a==='torah'){setReadingMode(a);return}
        if(a==='layers'){toggleSettings();return}
        if(a==='verseNav'){toggleNav();return}
      }
      const chip=e.target.closest('[data-layer]');
      if(chip){const k=chip.dataset.layer;layers[k]=!layers[k];saveLayers();syncLayers();return}
      const target=e.target.closest('[data-goto]');
      if(target){const [b,c]=target.dataset.goto.split('.');toggleNav(false);show(b,Number(c),1,bookNameIl(b)+' '+c);return}
      const jump=e.target.closest('[data-jump]');
      if(jump){toggleNav(false);jumpVerse(Number(jump.dataset.jump),true);return}
      const word=e.target.closest('.il2-word');
      if(word){e.preventDefault();openWord(word);return}
      if(e.target.classList.contains('il2-nav-scrim'))toggleNav(false);
    });
    screen.querySelector('.il2-nav-scrim').addEventListener('click',()=>toggleNav(false));
    syncLayers();setReadingMode(modeIl);
  }
  function syncLayers(){
    if(!screen)return;
    for(const k of ['tr','gl','mo','parts','lit']){
      screen.classList.toggle('il2-no-'+k,!layers[k]);
      const btn=screen.querySelector('[data-layer="'+k+'"]');if(btn)btn.setAttribute('aria-pressed',layers[k]?'true':'false');
    }
  }
  function setReadingMode(m){
    modeIl=m==='torah'?'torah':'interlinear';if(!screen)return;
    screen.classList.toggle('il2-torah',modeIl==='torah');
    for(const k of ['interlinear','torah']){
      const btn=screen.querySelector('[data-action="'+k+'"]');if(btn)btn.setAttribute('aria-pressed',modeIl===k?'true':'false');
    }
    if(modeIl==='torah')toggleSettings(false);
  }
  function toggleSettings(to){
    if(!screen)return;settingsOpen=typeof to==='boolean'?to:!settingsOpen;
    const el=screen.querySelector('.il2-toolbar');el.hidden=!settingsOpen;
    screen.querySelector('[data-action="layers"]').setAttribute('aria-expanded',String(settingsOpen));
  }
  function toggleNav(to){
    if(!screen)return;navOpen=typeof to==='boolean'?to:!navOpen;
    if(navOpen){
      const [book,c]=[place?.book||'Gen',place?.c||1],data=window.DOXA_IL2?.[bookKey(book,c)],verses=data?.verses?.length||0;
      navPanel.innerHTML='<div class="il2-nav-title"><strong>Percorrer o pergaminho</strong><button type="button" data-action="verseNav" aria-label="Fechar navegação">×</button></div>'
        +'<small>CAPÍTULOS</small><div class="il2-nav-chapters">'+Object.keys(FILES).map(k=>'<button type="button" data-goto="'+k+'" '+(k===bookKey(book,c)?'class="active"':'')+'>'+k.split('.')[1]+'</button>').join('')+'</div>'
        +'<small>VERSÍCULOS · '+esc(bookNameIl(book))+' '+c+'</small><div class="il2-nav-verses">'
        +Array.from({length:verses},(_,i)=>'<button type="button" data-jump="'+(i+1)+'">'+(i+1)+'</button>').join('')+'</div>';
    }
    navPanel.hidden=!navOpen;screen.querySelector('.il2-nav-scrim').hidden=!navOpen;
    screen.querySelector('[data-action="verseNav"]').setAttribute('aria-expanded',String(navOpen));
  }
  function jumpVerse(v,smooth){
    if(!scroller)return;const el=scroller.querySelector('#il2-v'+v);if(!el)return;
    const y=el.getBoundingClientRect().top-scroller.getBoundingClientRect().top+scroller.scrollTop;
    const options={top:Math.max(0,y-22),behavior:smooth&&!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'smooth':'auto'};
    scroller.scrollTo(options);updatePosition(v);
  }
  function updatePosition(v){
    if(!place)return;
    const ref=bookNameIl(place.book)+' '+place.c+(v?':'+v:'');
    const target=screen?.querySelector('.il2-current-ref');if(target)target.textContent=ref;
    const count=screen?.querySelector('.il2-progress-count');if(count)count.textContent=v?String(v).padStart(2,'0'):'';
    screen?.querySelectorAll('.il2-verse.current').forEach(x=>x.classList.remove('current'));
    const el=scroller?.querySelector('#il2-v'+v);if(el)el.classList.add('current');
  }
  function queueScroll(){if(scrollRAF)return;scrollRAF=requestAnimationFrame(()=>{scrollRAF=0;updateScroll()})}
  function updateScroll(){
    if(!scroller||!screen?.classList.contains('on'))return;
    const extent=Math.max(1,scroller.scrollHeight-scroller.clientHeight),pct=Math.max(0,Math.min(1,scroller.scrollTop/extent));
    const offset=Math.round(scroller.scrollTop*.55);
    frame.style.setProperty('--il2-roll-offset',(-offset%80)+'px');
    frame.style.setProperty('--il2-left-wind',(1.08-pct*.08).toFixed(3));
    frame.style.setProperty('--il2-right-wind',(1+pct*.08).toFixed(3));
    const progress=screen.querySelector('.il2-progress-track i');if(progress)progress.style.width=(pct*100).toFixed(2)+'%';
    const verses=scroller.querySelectorAll('.il2-verse');
    // Pequeno conjunto (máximo 32 versos); evita medir DOM na montagem da palavra.
    let v=1;const top=scroller.getBoundingClientRect().top+Math.min(150,scroller.clientHeight*.20);
    for(const el of verses){if(el.getBoundingClientRect().top<=top)v=Number(el.dataset.v);else break}
    updatePosition(v);
  }
  async function show(book,c,v,label){
    ensureScreen();const key=bookKey(book,c),token={};state=token;
    place={book,c,v};toggleNav(false);closeSheet();
    scroller.innerHTML='<div class="il2-loading"><span class="il2-loading-sigil">✦</span><p>Desenrolando o pergaminho…</p></div>';
    scroller.scrollTop=0;screen.querySelector('.il2-current-ref').textContent=label||bookNameIl(book)+' '+c;
    const renderError=msg=>{scroller.innerHTML='<div class="il2-empty"><div class="il2-empty-sigil">✧</div><h2>Não foi possível abrir o pergaminho</h2><p>'+esc(msg)+'</p></div>';updateScroll()};
    if(!FILES[key]){scroller.innerHTML=unavailableHtml(label);queueScroll();return}
    if(typeof OSHB_STRONG==='undefined'||typeof OSHB_BOOK_INDEX==='undefined'){
      renderError('O pacote hebraico OSHB não está disponível neste dispositivo. Instale o pacote core-texts.');return;
    }
    try{
      const data=await load(key);if(state!==token)return;
      // Validação antes de exibir: nunca apresentar glosas desalinhadas.
      const html=chapterHtml(book,c,data);if(state!==token)return;
      scroller.innerHTML=html;
      requestAnimationFrame(()=>{if(state!==token)return;if(v>1)jumpVerse(v,false);else updatePosition(1);updateScroll()});
    }catch(e){if(state===token)renderError(e?.message||'Banco indisponível.')}
  }
  function openTool(){
    ensureScreen();focusBefore=document.activeElement;
    const p=readerPlace()||{book:'Gen',c:1,v:1,label:'Gênesis 1'};
    screen.classList.add('on');screen.setAttribute('aria-hidden','false');document.body.classList.add('il2-open');
    toggleSettings(false);setReadingMode('interlinear');show(p.book,p.c,p.v,p.label);
    screen.querySelector('.il2-back')?.focus({preventScroll:true});
  }
  function closeTool(){
    if(!screen)return;closeSheet();toggleNav(false);toggleSettings(false);
    screen.classList.remove('on');screen.setAttribute('aria-hidden','true');document.body.classList.remove('il2-open');state=null;
    if(raf){cancelAnimationFrame(raf);raf=0}if(scrollRAF){cancelAnimationFrame(scrollRAF);scrollRAF=0}
    if(focusBefore&&typeof focusBefore.focus==='function')try{focusBefore.focus({preventScroll:true})}catch(_){};
  }
  const isOpen=()=>!!screen?.classList.contains('on');

  /* Palavra: painel manuscrito com os dados lexicais originais do OSHB. */
  function ensureSheet(){
    if(sheet)return;
    scrim=document.createElement('div');scrim.className='il2-scrim';
    sheet=document.createElement('aside');sheet.className='il2-sheet';sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-hidden','true');sheet.setAttribute('aria-label','Análise da palavra hebraica');
    document.body.append(scrim,sheet);
    scrim.addEventListener('click',closeSheet);
    sheet.addEventListener('click',e=>{
      if(e.target.closest('[data-sheet="close"]'))closeSheet();
      else if(e.target.closest('[data-sheet="occurrences"]'))openOccurrences();
      else if(e.target.closest('[data-sheet="prev"]'))moveWord(-1);
      else if(e.target.closest('[data-sheet="next"]'))moveWord(1);
    });
  }
  function closeSheet(){
    if(!sheet)return;sheet.classList.remove('on');scrim.classList.remove('on');
    sheet.setAttribute('aria-hidden','true');
    screen?.querySelectorAll('.il2-word.selected').forEach(x=>x.classList.remove('selected'));
  }
  function openWord(btn){
    ensureSheet();const identity=btn.dataset.il2;if(!identity)return;
    let info;try{info=JSON.parse(identity)}catch(_){return}
    const {book,c,v,ti,w}=info;
    const data=window.DOXA_IL2?.[bookKey(book,c)],tok=oshbItems(book,c,v)?.[ti];
    if(!data||!tok||!Array.isArray(tok)||!data.verses?.[v-1]?.[w])return;
    selected=info;
    screen?.querySelectorAll('.il2-word.selected').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');
    const [surface,tr,gloss,parts]=data.verses[v-1][w];
    const raw=OSHB_STRONG.m[tok[2]]||'',code=data.morphFix?.[v+'.'+w]||raw,ds=decode(code),segs=String(tok[4]||tok[0]).split('/');
    const li=tok[3],lex=li>=0?OSHB_STRONG.l[li]:null;
    const senses=lex?(data.senses?.[li]||(typeof doxaStrongPtEntry==='function'?doxaStrongPtEntry(lex)?.m:[])||[]):[];
    const occ=lex?Number(lex[12])||0:0;
    const partsHtml=segs.map((s,k)=>'<div class="il2-seg"><span class="il2-seg-original" dir="rtl">'+esc(s)+'</span><small>'+esc(ds[k]?.pos||'')+'</small><strong>'+glossHtml(parts[k]||'')+'</strong></div>').join('');
    const morphHtml=ds.map(d=>'<div class="il2-morph-tag"><b>'+esc(d.pos)+'</b><span>'+esc(d.tags.join(' · '))+'</span></div>').join('');
    const lexHtml=lex?'<dl class="il2-lex"><dt>Lema</dt><dd class="he" dir="rtl">'+esc(lex[3])+'</dd>'
      +'<dt>Transliteração</dt><dd>'+esc(data.lemmaTr?.[li]||lex[4]||'')+'</dd>'
      +(lex[5]?'<dt>Raiz</dt><dd class="he" dir="rtl">'+esc(lex[5])+'</dd>':'')
      +'<dt>Strong</dt><dd>'+esc(lex[1])+'</dd>'
      +(senses.length?'<dt>Sentidos</dt><dd>'+esc(senses.join(' · '))+'</dd>':'')
      +'<dt>No Antigo Testamento</dt><dd>'+occ.toLocaleString('pt-BR')+' ocorrências</dd></dl>'
      +'<button type="button" data-sheet="occurrences" class="il2-occ">Explorar ocorrências e Strong completo <span>↗</span></button>'
      :'<p class="il2-no-lex">Elemento gramatical sem verbete lexical independente.</p>';
    sheet.innerHTML='<div class="il2-sheet-handle"></div><div class="il2-sheet-top"><span>GLOSSÁRIO DO PERGAMINHO</span>'
      +'<button type="button" data-sheet="close" class="il2-sheet-close" aria-label="Fechar análise">×</button></div>'
      +'<div class="il2-sheet-head"><div><h2>'+glossHtml(gloss)+'</h2><em>'+esc(tr)+'</em></div><div class="il2-sheet-hebrew" dir="rtl">'+esc(surface)+'</div></div>'
      +'<div class="il2-sheet-pager"><button data-sheet="prev" type="button">‹ Anterior</button><small>'+esc(bookNameIl(book))+' '+c+':'+v+'</small><button data-sheet="next" type="button">Próxima ›</button></div>'
      +'<section class="il2-sheet-section"><h3>Estrutura da palavra</h3><div class="il2-segs" dir="rtl">'+partsHtml+'</div></section>'
      +'<section class="il2-sheet-section"><h3>Morfologia</h3><div class="il2-morphs">'+morphHtml+'</div><p class="il2-morph-code">'+esc(code)+(code!==raw?'<br>OSHB: '+esc(raw)+' · correção contextual Doxa':'')+'</p></section>'
      +'<section class="il2-sheet-section"><h3>Estudo lexical</h3>'+lexHtml+'</section>';
    sheet.scrollTop=0;sheet.classList.add('on');scrim.classList.add('on');sheet.setAttribute('aria-hidden','false');
  }
  function moveWord(delta){
    if(!selected||!screen)return;
    const words=Array.from(screen.querySelectorAll('.il2-word'));const idx=words.findIndex(x=>x.dataset.il2===selected);
    if(idx<0)return;const next=words[idx+delta];if(!next)return;
    next.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});openWord(next);
  }
  function openOccurrences(){
    if(!selected||typeof openStrong!=='function')return;
    let cur;try{cur=JSON.parse(selected)}catch(_){return}
    const strongSheet=byId('strongSheet'),backdrop=byId('strongBackdrop');
    const btn=document.createElement('button');btn.className='oshb-word';
    btn.dataset.b=cur.book;btn.dataset.c=cur.c;btn.dataset.v=cur.v;btn.dataset.ti=cur.ti;
    closeSheet();
    if(strongSheet&&backdrop){
      strongSheet.style.zIndex='320';backdrop.style.zIndex='319';
      const mo=new MutationObserver(()=>{if(!strongSheet.classList.contains('on')){strongSheet.style.zIndex='';backdrop.style.zIndex='';mo.disconnect()}});
      mo.observe(strongSheet,{attributes:true,attributeFilter:['class']});
    }
    openStrong(btn);
  }

  /* Integrado ao comportamento Voltar do Android e ESC no navegador. */
  const previousBack=window.doxaHandleBack;
  window.doxaHandleBack=function(){
    if(!isOpen())return typeof previousBack==='function'?previousBack():false;
    if(byId('strongSheet')?.classList.contains('on'))return typeof previousBack==='function'?previousBack():false;
    if(sheet?.classList.contains('on')){closeSheet();return true}
    if(navOpen){toggleNav(false);return true}
    if(settingsOpen){toggleSettings(false);return true}
    closeTool();return true;
  };
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||!isOpen())return;
    if(byId('strongSheet')?.classList.contains('on'))return;
    if(sheet?.classList.contains('on'))closeSheet();
    else if(navOpen)toggleNav(false);
    else if(settingsOpen)toggleSettings(false);
    else closeTool();e.preventDefault();
  });

  /* Mesmo lugar, mesma API pública do Interlinear v2. */
  function ensureCard(){
    let b=byId('toolsInterlinearStart');
    if(!b){
      b=document.createElement('button');b.className='tool-card';b.id='toolsInterlinearStart';b.type='button';
      b.innerHTML='<span class="tool-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v18M17 3v18M7 5h10M7 19h10M10 9h4m-4 3h4m-4 3h4"/><circle cx="7" cy="3" r="2"/><circle cx="17" cy="21" r="2"/></svg></span>'
        +'<span class="tool-card-copy"><strong>Interlinear</strong><small>Abra o pergaminho vivo: hebraico palavra por palavra.</small></span><span class="tool-card-arrow" aria-hidden="true">›</span>';
      b.addEventListener('click',openTool);
    }
    const lupa=byId('toolsLupaStart'),stack=lupa?.closest('.doxa59-tools-stack');
    if(stack){if(stack.firstElementChild!==b)stack.prepend(b);return true}
    if(lupa&&lupa.previousElementSibling!==b){lupa.before(b);return true}
    return !!lupa;
  }
  const originalOpen=window.openPanel;
  if(typeof originalOpen==='function'&&!originalOpen.__doxa63){
    const wrapped=function(name){const result=originalOpen.apply(this,arguments);if(name==='marcar')ensureCard();return result};
    wrapped.__doxa63=true;for(const k of Object.keys(originalOpen))try{wrapped[k]=originalOpen[k]}catch(_){};
    window.openPanel=wrapped;
  }
  ensureCard();setTimeout(ensureCard,1200);setTimeout(ensureCard,3000);
  window.DoxaInterlinear2={open:openTool,close:closeTool,show,isOpen,has:(book,c)=>!!FILES[bookKey(book,c)],__scrollEdition:true};
})();
