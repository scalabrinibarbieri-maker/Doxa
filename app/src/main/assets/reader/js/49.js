/* Doxa · Ferramenta Interlinear (Ferramentas › Explorar o texto)
   Abre o capítulo em leitura: hebraico, transliteração para leitor brasileiro,
   glosa literal (gênero e número do hebraico), morfologia e partes da palavra.
   Texto, morfologia e léxico vêm do OSHB já instalado (core-texts);
   glosas e transliteração vêm do banco js/49d.js (carregado só ao abrir a ferramenta).
   Capítulos com banco nesta etapa: Gênesis 1–11. */
(()=>{
  'use strict';

  const FILES={'Gen.1':'js/49d.js','Gen.2':'js/49-gen-02.js','Gen.3':'js/49-gen-03.js','Gen.4':'js/49-gen-04.js','Gen.5':'js/49-gen-05.js','Gen.6':'js/49-gen-06.js','Gen.7':'js/49-gen-07.js','Gen.8':'js/49-gen-08.js','Gen.9':'js/49-gen-09.js','Gen.10':'js/49-gen-10.js','Gen.11':'js/49-gen-11.js'};
  const BOOK_PT={Gen:'Gênesis'};
  const LAYERS_KEY='doxa-il2-layers';
  const loading={};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ---------- banco ---------- */
  function load(key){
    window.DOXA_IL2=window.DOXA_IL2||{};
    if(window.DOXA_IL2[key])return Promise.resolve(window.DOXA_IL2[key]);
    if(loading[key])return loading[key];
    loading[key]=new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.async=true;s.src=FILES[key];
      s.onload=()=>{const d=window.DOXA_IL2[key];d?resolve(d):reject(new Error('Banco interlinear sem dados.'))};
      s.onerror=()=>{delete loading[key];reject(new Error('Não foi possível abrir o banco interlinear.'))};
      document.head.appendChild(s);
    });
    return loading[key];
  }
  function oshbVerseItems(book,c,v){
    try{const bi=OSHB_BOOK_INDEX[book];return OSHB_STRONG.d[bi][c-1][v-1]||null}catch(e){return null}
  }

  /* ---------- morfologia OSHB em português ---------- */
  const POS={A:'adjetivo',C:'conjunção',D:'advérbio',N:'substantivo',P:'pronome',R:'preposição',S:'sufixo',T:'partícula',V:'verbo'};
  const GEN={m:'masculino',f:'feminino',b:'masc. ou fem.',c:'comum'};
  const NUM={s:'singular',p:'plural',d:'dual'};
  const STATE={a:'absoluto',c:'construto',d:'determinado'};
  const STEM={q:'Qal',N:'Nifal',p:'Piel',P:'Pual',h:'Hifil',H:'Hofal',t:'Hitpael',o:'Polel',O:'Polal',r:'Hitpolel',m:'Poel',M:'Poal',k:'Palel',K:'Pulal',Q:'Qal passivo',l:'Pilpel',L:'Polpal',f:'Hitpalpel',D:'Nitpael',j:'Pealal',i:'Pilel',u:'Hotpaal',c:'Tifil',v:'Hishtafel',w:'Nitpalel',y:'Nitpoel',z:'Hitpoel'};
  const VT={p:'perfeito',q:'perfeito consecutivo',i:'imperfeito',w:'imperfeito consecutivo',h:'coortativo',j:'jussivo',v:'imperativo',r:'particípio ativo',s:'particípio passivo',a:'infinitivo absoluto',c:'infinitivo construto'};
  const VTS={p:'perf.',q:'perf. consec.',i:'imperf.',w:'wayyiqtol',h:'coort.',j:'jussivo',v:'imperat.',r:'part. ativo',s:'part. passivo',a:'inf. abs.',c:'inf. constr.'};
  const NTYPE={c:'comum',g:'gentílico',p:'próprio'};
  const ATYPE={a:'adjetivo',c:'numeral cardinal',g:'gentílico',o:'numeral ordinal'};
  const PTYPE={d:'demonstrativo',f:'indefinido',i:'interrogativo',p:'pessoal',r:'relativo'};
  const TTYPE={a:'afirmação',d:'artigo definido',e:'exortação',i:'interrogativa',j:'interjeição',m:'demonstrativa',n:'negação',o:'marca do objeto direto',r:'relativa'};
  const SUF={'1cs':'meu / me','2ms':'teu / te','2fs':'teu / te','3ms':'dele','3fs':'dela','1cp':'nosso / nos','2mp':'vosso / vos','2fp':'vosso / vos','3mp':'deles','3fp':'delas'};
  const SHORT_POS={'conjunção':'conj.','artigo':'art.','preposição':'prep.','preposição + artigo':'prep.+art.','substantivo':'subst.','adjetivo':'adj.','sufixo pronominal':'sufixo','partícula':'partíc.','advérbio':'adv.','pronome':'pron.'};
  const person=(p,g,n)=>(({1:'1ª',2:'2ª',3:'3ª'})[p]||'')+' pessoa '+(GEN[g]||'')+' '+(NUM[n]||'');
  function seg(s){
    const c=s[0],r=s.slice(1),o={pos:POS[c]||c,tags:[],short:''};
    const g2=x=>({m:'masc.',f:'fem.'})[x]||'',n2=x=>({s:'sing.',p:'pl.',d:'dual'})[x]||'';
    if(c==='N'){
      o.tags.push(NTYPE[r[0]]||r[0]);
      if(r[0]==='p'){if(r[1]==='l')o.tags.push('nome de lugar');else if(r[1])o.tags.push(GEN[r[1]]||r[1])}
      else{if(r[1])o.tags.push(GEN[r[1]]);if(r[2])o.tags.push(NUM[r[2]]);if(r[3])o.tags.push(STATE[r[3]])}
      o.short=r[0]==='p'?'nome próprio':['subst.',g2(r[1]),n2(r[2]),r[3]==='c'?'constr.':''].filter(Boolean).join(' ');
    }else if(c==='A'){
      o.tags.push(ATYPE[r[0]]||r[0]);if(r[1])o.tags.push(GEN[r[1]]);if(r[2])o.tags.push(NUM[r[2]]);if(r[3])o.tags.push(STATE[r[3]]);
      o.short=[({a:'adj.',c:'num.',o:'ordinal',g:'gentílico'})[r[0]],g2(r[1]),n2(r[2]),r[3]==='c'?'constr.':''].filter(Boolean).join(' ');
    }else if(c==='V'){
      const t=r[1],rest=r.slice(2);o.tags.push(STEM[r[0]]);o.tags.push(VT[t]);let pn='';
      if(t==='r'||t==='s'){o.tags.push(GEN[rest[0]]);o.tags.push(NUM[rest[1]]);if(rest[2])o.tags.push(STATE[rest[2]]);pn=(rest[0]||'')+(rest[1]||'')}
      else if(t!=='a'&&t!=='c'&&rest){o.tags.push(person(rest[0],rest[1],rest[2]));pn=rest}
      o.short='verbo · '+STEM[r[0]]+' · '+VTS[t]+(pn?' '+pn:'');
    }else if(c==='P'){
      o.tags.push(PTYPE[r[0]]||r[0]);
      if(r[0]==='p'&&r.length>=4)o.tags.push(person(r[1],r[2],r[3]));else{if(r[1])o.tags.push(GEN[r[1]]);if(r[2])o.tags.push(NUM[r[2]])}
      o.short='pron.';
    }else if(c==='R'){o.pos=r[0]==='d'?'preposição + artigo':'preposição';o.short=r[0]==='d'?'prep. + art.':'prep.'}
    else if(c==='T'){o.pos=r[0]==='d'?'artigo':'partícula';if(r[0]!=='d')o.tags.push(TTYPE[r[0]]||r[0]);o.short=r[0]==='d'?'art.':r[0]==='o'?'marca do obj.':'partíc.'}
    else if(c==='S'){
      if(r[0]==='p'){const k=r.slice(1);o.pos='sufixo pronominal';o.tags.push(person(k[0],k[1],k[2]));o.tags.push(SUF[k]||k);o.short='suf.'}
      else{o.pos=({d:'he direcional',h:'he paragógico',n:'nun paragógico'})[r[0]]||'sufixo';o.short=o.pos}
    }else if(c==='C')o.short='conj.';
    else if(c==='D')o.short='adv.';
    o.tags=o.tags.filter(Boolean).map(x=>String(x).replace(/\s+/g,' ').trim());
    return o;
  }
  const decode=code=>String(code||'').slice(1).split('/').filter(Boolean).map(seg);
  function shortMorph(code){
    const ds=decode(code);if(!ds.length)return'';
    const minor=x=>['conj.','art.','prep.','prep. + art.','suf.'].includes(x.short);
    const main=[...ds].reverse().find(x=>!minor(x))||ds[ds.length-1];
    return ds.map(x=>x===main?x.short:x.short.split(' ')[0]).join(' + ');
  }

  /* ---------- camadas (preferência só deste aparelho) ---------- */
  let layers={tr:true,gl:true,mo:true,parts:false};
  try{const s=JSON.parse(localStorage.getItem(LAYERS_KEY)||'null');if(s&&typeof s==='object')layers={...layers,...s}}catch(e){}
  function saveLayers(){try{localStorage.setItem(LAYERS_KEY,JSON.stringify(layers))}catch(e){}}
  function layerClasses(){return ['tr','gl','mo'].filter(k=>!layers[k]).map(k=>'il2-no-'+k).concat(layers.parts?['il2-mode-parts']:[]).join(' ')}

  const OBJ='<span class="il2-obj">obj.</span>';
  const glossHtml=t=>esc(t).replace(/\bobj\b/g,OBJ);

  /* ---------- painel da palavra ---------- */
  let sheet=null,scrim=null,current=null;
  function ensureSheet(){
    if(sheet)return;
    scrim=document.createElement('div');scrim.className='il2-scrim';
    sheet=document.createElement('aside');sheet.className='il2-sheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-hidden','true');
    document.body.appendChild(scrim);document.body.appendChild(sheet);
    scrim.addEventListener('click',closeSheet);
    sheet.addEventListener('click',e=>{
      if(e.target.closest('.il2-close'))closeSheet();
      else if(e.target.closest('.il2-occ'))openOccurrences();
    });
  }
  function closeSheet(){
    if(!sheet)return;sheet.classList.remove('on');scrim.classList.remove('on');sheet.setAttribute('aria-hidden','true');
    document.querySelectorAll('.il2-word.on').forEach(x=>x.classList.remove('on'));
  }
  function openWord(btn){
    ensureSheet();
    const {book,c,v,ti,w}=JSON.parse(btn.dataset.il2),data=window.DOXA_IL2?.[book+'.'+c];
    const items=oshbVerseItems(book,c,v),tok=items?.[ti];if(!tok||!data)return;
    current={book,c,v,ti};
    document.querySelectorAll('.il2-word.on').forEach(x=>x.classList.remove('on'));btn.classList.add('on');
    const [surface,tr,gloss,parts]=data.verses[v-1][w];
    const orig=OSHB_STRONG.m[tok[2]]||'',code=data.morphFix?.[v+'.'+w]||orig,ds=decode(code),segs=String(tok[4]||tok[0]).split('/');
    const li=tok[3],lex=li>=0?OSHB_STRONG.l[li]:null;
    const senses=lex?(data.senses?.[li]||(typeof doxaStrongPtEntry==='function'?doxaStrongPtEntry(lex).m:[])||[]):[];
    const occ=lex?Number(lex[12])||0:0;
    const segHtml=segs.map((s,k)=>'<div class="il2-seg"><span class="h">'+esc(s)+'</span><span class="k">'+esc(ds[k]?.pos||'')+'</span><span class="g">'+glossHtml(parts[k]||'')+'</span></div>').join('');
    const tags=ds.map(d=>d.tags.length?'<span class="il2-tag"><em>'+esc(d.pos)+'</em>'+esc(d.tags.join(' · '))+'</span>':'<span class="il2-tag">'+esc(d.pos)+'</span>').join('');
    const lexHtml=lex?'<dl class="il2-lex">'
        +'<dt>Lema</dt><dd class="he">'+esc(lex[3])+'</dd>'
        +'<dt>Transliteração</dt><dd class="it">'+esc(data.lemmaTr?.[li]||lex[4]||'')+'</dd>'
        +(lex[5]?'<dt>Raiz</dt><dd class="he">'+esc(lex[5])+'</dd>':'')
        +'<dt>Strong</dt><dd>'+esc(lex[1])+'</dd>'
        +(senses.length?'<dt>Sentidos</dt><dd>'+esc(senses.join(', '))+'</dd>':'')
        +'<dt>No AT</dt><dd>'+occ.toLocaleString('pt-BR')+' ocorrências</dd></dl>'
        +'<button type="button" class="il2-occ">Ver ocorrências e Strong completo</button>'
      :'<dl class="il2-lex"><dt>Lema</dt><dd>preposição com sufixo pronominal</dd></dl>';
    sheet.innerHTML='<div class="il2-grab"></div>'
      +'<div class="il2-sh-head"><div class="il2-sh-copy"><div class="il2-sh-gloss">'+glossHtml(gloss)+'</div><div class="il2-sh-tr">'+esc(tr)+'</div></div>'
      +'<div class="il2-sh-heb" dir="rtl">'+esc(surface)+'</div><button type="button" class="il2-close" aria-label="Fechar">×</button></div>'
      +'<div class="il2-sec"><h4>Partes</h4><div class="il2-segs" dir="rtl">'+segHtml+'</div></div>'
      +'<div class="il2-sec"><h4>Morfologia</h4><div class="il2-tags">'+tags+'</div><div class="il2-code">'+esc(code)+(code!==orig?' · o OSHB marca '+esc(orig)+'; corrigido pelo contexto':'')+'</div></div>'
      +'<div class="il2-sec"><h4>Léxico</h4>'+lexHtml+'</div>';
    sheet.scrollTop=0;sheet.classList.add('on');scrim.classList.add('on');sheet.setAttribute('aria-hidden','false');
  }
  function openOccurrences(){
    if(!current||typeof openStrong!=='function')return;
    const s=document.getElementById('strongSheet'),b=document.getElementById('strongBackdrop');
    const el=document.createElement('button');el.className='oshb-word';
    el.dataset.b=current.book;el.dataset.c=current.c;el.dataset.v=current.v;el.dataset.ti=current.ti;
    closeSheet();
    /* A ficha Strong fica sob a tela de estudo; sobe só enquanto estiver aberta a partir daqui. */
    if(s&&b){s.style.zIndex='320';b.style.zIndex='319';
      const mo=new MutationObserver(()=>{if(!s.classList.contains('on')){s.style.zIndex='';b.style.zIndex='';mo.disconnect()}});
      mo.observe(s,{attributes:true,attributeFilter:['class']});}
    openStrong(el);
  }

  /* ---------- tela da ferramenta ---------- */
  const LEGEND=[
    ['בּ ב','b · v','com ponto é b, sem ponto é v'],
    ['כּ כ','k · rr','com ponto é k, sem ponto é rr'],
    ['פּ פ','p · f','com ponto é p, sem ponto é f'],
    ['ח','rr','som de garganta, como o rr de “carro”'],
    ['ה','h','aspirado, como o h do inglês “house”'],
    ['ו וּ וֹ','v · u · o','consoante é v; com ponto no meio é u; com ponto em cima é o'],
    ['שׁ שׂ','sh · s','sh como em “show”; s sempre sibilante (ss entre vogais)'],
    ['צ','ts','como em “tsunami”'],
    ['י','y','como o i de “iate”'],
    ['ג','g','sempre duro: “gu” antes de e/i'],
    ['א ע','’','sem som próprio; o apóstrofo só separa as sílabas'],
    ['בְ','e · mudo','shevá: “e” breve no começo da sílaba, mudo no fim']
  ];
  const SVG_IL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 5.5H9.5M20 9H13"/><path d="M4 14.5h10.5M4 18h7"/><path d="M6.5 5.5 4 7.3l2.5 1.8M17.5 14.7l2.5 1.8-2.5 1.8"/></svg>';
  let screen=null,scroller=null,state=null;

  function chipsHtml(){
    const c=(k,label)=>'<button type="button" class="il2-chip" data-layer="'+k+'" aria-pressed="'+(layers[k]?'true':'false')+'">'+label+'</button>';
    return c('tr','Transliteração')+c('gl','Glosa')+c('mo','Morfologia')+c('parts','Partes da palavra');
  }
  function verseHtml(book,c,v,data){
    const items=oshbVerseItems(book,c,v),dv=data.verses?.[v-1];
    if(!items||!dv)throw new Error('Versículo fora do banco interlinear.');
    const toks=[];items.forEach((t,i)=>{if(Array.isArray(t))toks.push([t,i]);else if(t==='־'&&toks.length)toks[toks.length-1].push(true)});
    if(toks.length!==dv.length||toks.some(([t],k)=>t[0]!==dv[k][0]))throw new Error('O texto hebraico instalado difere do banco interlinear.');
    const words=toks.map(([t,ti,mq],k)=>{
      const [surface,tr,gloss,parts]=dv[k],code=data.morphFix?.[v+'.'+k]||OSHB_STRONG.m[t[2]]||'',segs=String(t[4]||t[0]).split('/'),ds=decode(code);
      const heb=segs.length>1?segs.map((s,j)=>'<span class="s'+j+'">'+esc(s)+'</span>').join(''):esc(surface);
      const partHtml=segs.map((s,j)=>'<span class="il2-part"><b>'+esc(SHORT_POS[ds[j]?.pos]||ds[j]?.pos||'')+'</b><i>'+glossHtml(parts[j]||'')+'</i></span>').join('');
      return '<button type="button" class="il2-word" data-il2=\''+esc(JSON.stringify({book,c,v,ti,w:k}))+'\' aria-label="'+esc(surface+': '+gloss)+'">'
        +'<span class="il2-heb'+(mq?' mq':'')+'" dir="rtl">'+heb+'</span>'
        +'<span class="il2-tr">'+esc(tr)+'</span>'
        +'<span class="il2-gl">'+glossHtml(gloss)+'</span>'
        +'<span class="il2-parts" dir="rtl">'+partHtml+'</span>'
        +'<span class="il2-mo">'+esc(shortMorph(code))+'</span></button>';
    }).join('');
    return '<section class="il2-verse" data-v="'+v+'"><span class="il2-vnum">'+v+'</span>'
      +'<div class="il2-flow" dir="rtl">'+words+'</div>'
      +'<p class="il2-lit">'+glossHtml(dv.map(x=>x[2]).join(' '))+'</p></section>';
  }
  function chapterHtml(book,c,data){
    let out='<div class="il2 '+layerClasses()+'">'
      +'<header class="il2-hero"><span class="il2-kicker">INTERLINEAR · HEBRAICO</span><h2>'+esc(BOOK_PT[book]||book)+' '+c+'</h2>'
      +'<p>Palavra por palavra, na ordem do hebraico. A glosa segue o gênero, o número e a forma do original, mesmo quando o português soa estranho. Toque numa palavra para a análise completa.</p><div class="il2-goldline"></div></header>'
      +'<div class="il2-chapter">';
    data.verses.forEach((_,i)=>{out+=verseHtml(book,c,i+1,data)});
    return out+'</div>'
      +'<details class="il2-howto"><summary>Como ler a transliteração</summary><p>Escrita para ser lida por brasileiro, na pronúncia do hebraico falado hoje. A sílaba forte sempre leva acento.</p><div class="il2-keys">'
      +LEGEND.map(r=>'<span class="hk" dir="rtl">'+r[0]+'</span><span class="tk">'+r[1]+'</span><span class="dk">'+r[2]+'</span>').join('')+'</div></details>'
      +navHtml(book,c)
      +'<p class="il2-source">Texto e morfologia: WLC / OSHB. Glosas e transliteração: Doxa.</p></div>';
  }
  function navHtml(book,c){
    const has=k=>!!FILES[book+'.'+k],name=BOOK_PT[book]||book;
    const prev=has(c-1)?'<button type="button" class="il2-goto il2-nav-prev" data-goto="'+book+'.'+(c-1)+'">‹ '+esc(name+' '+(c-1))+'</button>':'<span></span>';
    const next=has(c+1)?'<button type="button" class="il2-goto il2-nav-next" data-goto="'+book+'.'+(c+1)+'">'+esc(name+' '+(c+1))+' ›</button>':'<span></span>';
    return (has(c-1)||has(c+1))?'<nav class="il2-nav">'+prev+next+'</nav>':'';
  }
  function unavailableHtml(label){
    const ready=Object.keys(FILES).map(k=>{const [b,c]=k.split('.');return '<button type="button" class="il2-goto" data-goto="'+k+'">'+esc((BOOK_PT[b]||b)+' '+c)+'</button>'}).join('');
    return '<div class="il2"><div class="il2-empty"><span class="il2-kicker">INTERLINEAR · HEBRAICO</span><h2>'+esc(label||'Este capítulo')+'</h2>'
      +'<p>O interlinear ainda não chegou a este capítulo. Os capítulos entram um a um, conforme as glosas são revisadas.</p>'
      +'<span class="il2-label">Já disponível</span><div class="il2-gotos">'+ready+'</div></div></div>';
  }

  /* posição do leitor: livro, capítulo e o versículo que está no topo da tela */
  function readerPlace(){
    try{
      const cp=CORPORA[mode]||null,p=positions[mode];if(!cp||!p)return null;
      const b=cp.books[p.b];if(!b)return null;
      let book=b.book,c=Number(p.c),v=1;
      const verses=[...document.querySelectorAll('#textBody [id^="v"]')];
      const top=verses.find(el=>el.getBoundingClientRect().bottom>110);
      if(top){const n=Number(top.dataset.v||String(top.id).replace(/^v/,''));if(n>0)v=n}
      if(mode==='wlc'&&window.DoxaVersif){/* o WLC já está na numeração hebraica */}
      return {book,c,v,label:(typeof bookName==='function'?bookName(b):book)+' '+c};
    }catch(e){return null}
  }

  function ensureScreen(){
    if(screen)return;
    screen=document.createElement('section');screen.className='il2-screen';screen.id='il2Screen';screen.setAttribute('aria-hidden','true');
    screen.innerHTML='<div class="il2-top"><div class="il2-topbar"><button type="button" class="il2-back" aria-label="Voltar">‹</button>'
      +'<div class="il2-topcopy"><strong>Interlinear</strong><small class="il2-topref">—</small></div></div>'
      +'<div class="il2-chips" role="group" aria-label="Camadas">'+chipsHtml()+'</div></div>'
      +'<div class="il2-scroll"></div>';
    document.body.appendChild(screen);
    scroller=screen.querySelector('.il2-scroll');
    screen.addEventListener('click',e=>{
      if(e.target.closest('.il2-back')){closeTool();return}
      const chip=e.target.closest('.il2-chip');
      if(chip){const k=chip.dataset.layer;layers[k]=!layers[k];saveLayers();chip.setAttribute('aria-pressed',layers[k]?'true':'false');
        const box=scroller.querySelector('.il2');if(box)box.classList.toggle(k==='parts'?'il2-mode-parts':'il2-no-'+k,k==='parts'?layers[k]:!layers[k]);return}
      const go=e.target.closest('.il2-goto');
      if(go){const [b,c]=go.dataset.goto.split('.');show(b,Number(c),1,(BOOK_PT[b]||b)+' '+c);return}
      const w=e.target.closest('.il2-word');if(w){e.preventDefault();openWord(w)}
    });
  }
  async function show(book,c,v,label){
    ensureScreen();
    const key=book+'.'+c,token={};state=token;
    screen.querySelector('.il2-topref').textContent=label||((BOOK_PT[book]||book)+' '+c);
    screen.querySelector('.il2-chips').hidden=!FILES[key];
    if(!FILES[key]||typeof OSHB_STRONG==='undefined'){scroller.innerHTML=unavailableHtml(label);scroller.scrollTop=0;return}
    scroller.innerHTML='<div class="il2-loading">Abrindo interlinear…</div>';
    try{
      const data=await load(key);if(state!==token)return;
      scroller.innerHTML=chapterHtml(book,c,data);scroller.scrollTop=0;
      if(v>1){const el=scroller.querySelector('.il2-verse[data-v="'+v+'"]');if(el)requestAnimationFrame(()=>{scroller.scrollTop=Math.max(0,el.offsetTop-8)})}
    }catch(e){
      if(state!==token)return;
      scroller.innerHTML='<div class="il2"><div class="il2-empty"><h2>Interlinear indisponível</h2><p>'+esc(e?.message||'Não foi possível abrir o banco deste capítulo.')+'</p></div></div>';
    }
  }
  function openTool(){
    ensureScreen();
    const place=readerPlace()||{book:'Gen',c:1,v:1,label:'Gênesis 1'};
    screen.classList.add('on');screen.setAttribute('aria-hidden','false');document.body.classList.add('il2-open');
    show(place.book,place.c,place.v,place.label);
  }
  function closeTool(){
    closeSheet();if(!screen)return;
    screen.classList.remove('on');screen.setAttribute('aria-hidden','true');document.body.classList.remove('il2-open');state=null;
  }
  const isOpen=()=>!!screen&&screen.classList.contains('on');

  /* botão Voltar do Android (MainActivity chama window.doxaHandleBack antes das demais telas) */
  const prevBack=window.doxaHandleBack;
  window.doxaHandleBack=function(){
    if(document.getElementById('strongSheet')?.classList.contains('on'))return typeof prevBack==='function'?prevBack():false;
    if(sheet&&sheet.classList.contains('on')){closeSheet();return true}
    if(isOpen()){closeTool();return true}
    return typeof prevBack==='function'?prevBack():false;
  };
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||!isOpen())return;
    if(document.getElementById('strongSheet')?.classList.contains('on'))return;
    if(sheet&&sheet.classList.contains('on'))closeSheet();else closeTool();
  });

  /* cartão em Ferramentas › Explorar o texto */
  function ensureCard(){
    let b=document.getElementById('toolsInterlinearStart');
    if(!b){
      b=document.createElement('button');b.className='tool-card';b.id='toolsInterlinearStart';b.type='button';
      b.innerHTML='<span class="tool-card-icon">'+SVG_IL+'</span><span class="tool-card-copy"><strong>Interlinear</strong><small>O hebraico palavra por palavra, no capítulo em que você está.</small></span><span class="tool-card-arrow" aria-hidden="true">›</span>';
      b.addEventListener('click',openTool);
    }
    const lupa=document.getElementById('toolsLupaStart');
    const stack=lupa&&lupa.closest('.doxa59-tools-stack');
    if(stack){if(stack.firstElementChild!==b)stack.prepend(b);return true}
    if(lupa&&lupa.previousElementSibling!==b){lupa.before(b);return true}
    return !!lupa;
  }
  const origOpen=window.openPanel;
  if(typeof origOpen==='function'&&!origOpen.__doxa63){
    const w=function(name){const r=origOpen.apply(this,arguments);if(name==='marcar')ensureCard();return r};
    w.__doxa63=true;for(const k of Object.keys(origOpen))try{w[k]=origOpen[k]}catch(e){}window.openPanel=w;
  }
  ensureCard();setTimeout(ensureCard,1200);setTimeout(ensureCard,3000);

  window.DoxaInterlinear2={open:openTool,close:closeTool,show,isOpen,has:(book,c)=>!!FILES[book+'.'+Number(c)]};
})();
