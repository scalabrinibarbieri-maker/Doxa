
(()=>{
  const pop=document.getElementById('verseActions'),screen=document.getElementById('studyScreen'),body=document.getElementById('studyBody'),title=document.getElementById('studyTitle'),refEl=document.getElementById('studyRef');let activeVerseEl=null,activeRef=null,studyMode='compare',compareIndex=0,compareModes=[];
  const modeLabel=m=>VERSION_META[m]?.label||m;
  function identityFromVerse(el){
    if(!el)return null;
    const v=Number(el.dataset.v||String(el.id||'').replace(/^v/,''));if(!Number.isFinite(v))return null;
    const pane=el.closest?.('.parallel-pane[data-side]');
    if(pane){const side=pane.dataset.side,st=sanitizeParallelState(side);if(st.mode==='hyper'||!CORPORA[st.mode])return null;const cp=CORPORA[st.mode],b=cp.books.find(x=>x.book===st.book);if(!b)return null;return{book:b.book,chapter:Number(st.chapter),verse:v,label:bookName(b)+' '+st.chapter+':'+v,sourceMode:st.mode,parallelSide:side}}
    if(mode==='hyper'||!CORPORA[mode])return null;const p=pos(),cp=corpus(),b=cp.books[p.b];return{book:b.book,chapter:Number(p.c),verse:v,label:bookName(b)+' '+p.c+':'+v,sourceMode:mode}
  }
  function getVerse(m,r){const cp=CORPORA[m];if(!cp)return null;const b=cp.books.find(x=>x.book===r.book);if(!b)return null;const c=b.chapters.find(x=>Number(x.chapter)===Number(r.chapter));if(!c)return null;const v=c.verses.find(x=>Number(x.number)===Number(r.verse));return v?{text:v.text,book:b,chapter:c}:null}
  function comparisonCandidates(r){const pref=[r.sourceMode,'almeida','blivre','tb','nvi','ntlh','naa','kja','kjf','jfaa','as21','ara','arc','wlc','tr',...Object.keys(CORPORA)],out=[];for(const m of pref){if(!m||out.includes(m))continue;if(getVerse(m,r))out.push(m)}return out}
  function baseForRef(r){if(getVerse('almeida',r))return ALMEIDA;return CORPORA[r.sourceMode]||Object.values(CORPORA).find(cp=>cp.books.some(b=>b.book===r.book))}
  function adjacent(r,d){const cp=baseForRef(r);if(!cp)return null;let bi=cp.books.findIndex(b=>b.book===r.book);if(bi<0)return null;let ci=cp.books[bi].chapters.findIndex(c=>Number(c.chapter)===Number(r.chapter));if(ci<0)return null;let vs=cp.books[bi].chapters[ci].verses,vi=vs.findIndex(v=>Number(v.number)===Number(r.verse));if(vi<0)return null;if(d>0){if(vi<vs.length-1)return{...r,verse:Number(vs[vi+1].number),label:bookName(cp.books[bi])+' '+r.chapter+':'+vs[vi+1].number};if(ci<cp.books[bi].chapters.length-1){const nc=cp.books[bi].chapters[ci+1],nv=nc.verses[0];return{...r,chapter:Number(nc.chapter),verse:Number(nv.number),label:bookName(cp.books[bi])+' '+nc.chapter+':'+nv.number}}if(bi<cp.books.length-1){const nb=cp.books[bi+1],nc=nb.chapters[0],nv=nc.verses[0];return{...r,book:nb.book,chapter:Number(nc.chapter),verse:Number(nv.number),label:bookName(nb)+' '+nc.chapter+':'+nv.number}}}else{if(vi>0)return{...r,verse:Number(vs[vi-1].number),label:bookName(cp.books[bi])+' '+r.chapter+':'+vs[vi-1].number};if(ci>0){const pc=cp.books[bi].chapters[ci-1],pv=pc.verses.at(-1);return{...r,chapter:Number(pc.chapter),verse:Number(pv.number),label:bookName(cp.books[bi])+' '+pc.chapter+':'+pv.number}}if(bi>0){const pb=cp.books[bi-1],pc=pb.chapters.at(-1),pv=pc.verses.at(-1);return{...r,book:pb.book,chapter:Number(pc.chapter),verse:Number(pv.number),label:bookName(pb)+' '+pc.chapter+':'+pv.number}}}return null}
  let verseBackdrop=document.getElementById('verseActionsBackdrop');
  if(!verseBackdrop){verseBackdrop=document.createElement('div');verseBackdrop.id='verseActionsBackdrop';verseBackdrop.className='verse-actions-backdrop';document.body.appendChild(verseBackdrop)}
  function addVerseFx(el){
    if(!el||el.querySelector(':scope>.verse-smoke'))return;
    const smoke=document.createElement('span');smoke.className='verse-smoke';smoke.setAttribute('aria-hidden','true');smoke.innerHTML='<i class="p1"></i><i class="p2"></i><i class="p3"></i><i class="p4"></i><i class="vein"></i>';
    const left=document.createElement('span');left.className='verse-handle left';left.setAttribute('aria-hidden','true');
    const right=document.createElement('span');right.className='verse-handle right';right.setAttribute('aria-hidden','true');
    el.prepend(smoke,left,right);
  }
  function removeVerseFx(el){el?.querySelectorAll(':scope>.verse-smoke,:scope>.verse-handle').forEach(x=>x.remove())}
  function positionPopover(el){pop.classList.add('on');pop.setAttribute('aria-hidden','false');keepVerseVisible(el)}
  /* O versículo segurado precisa continuar visível acima da folha que sobe.
     Mede a folha, reserva esse espaço no fim do capítulo (para dar para rolar até o último
     versículo) e rola só o necessário, com suavidade. */
  function keepVerseVisible(el){
    requestAnimationFrame(()=>{
      if(!el||!pop.classList.contains('on'))return;
      const sheetH=pop.offsetHeight||Math.round(window.innerHeight*.55);
      document.documentElement.style.setProperty('--doxa-sheet-h',sheetH+'px');
      requestAnimationFrame(()=>{
        const r=el.getBoundingClientRect(),top=86,bottom=window.innerHeight-sheetH-18;
        let delta=0;
        if(r.bottom>bottom)delta=r.bottom-bottom;
        if(r.top-delta<top)delta=r.top-top;          // versículo maior que o espaço: alinha pelo começo
        if(Math.abs(delta)<4)return;
        /* Animação própria em vez de scrollBy({behavior:'smooth'}): com o dedo ainda
           pressionando a tela, a rolagem suave nativa pode ser cancelada pela WebView. */
        const from=window.scrollY,to=from+delta,t0=performance.now(),dur=420;
        window.__doxaVerseAutoScrollUntil=Date.now()+dur+400;
        const ease=x=>1-Math.pow(1-x,3);
        const step=now=>{
          if(!pop.classList.contains('on'))return;
          const k=Math.min(1,(now-t0)/dur);
          window.scrollTo(0,from+(to-from)*ease(k));
          if(k<1)requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    });
  }
  function closePop(){pop.classList.remove('on');pop.setAttribute('aria-hidden','true');verseBackdrop.classList.remove('on');document.body.classList.remove('verse-menu-open');removeVerseFx(activeVerseEl);activeVerseEl?.classList.remove('verse-context');activeVerseEl=null}
  let popOpenedAt=0;
  function openPop(el){closePop();popOpenedAt=Date.now();activeVerseEl=el;activeRef=identityFromVerse(el);if(!activeRef)return;el.classList.add('verse-context');addVerseFx(el);document.body.classList.add('verse-menu-open');verseBackdrop.classList.add('on');positionPopover(el)}
  window.DoxaVerseActions={open:openPop,close:closePop};
  /* O dedo ainda está na tela quando o menu abre: o click do soltar cai no véu e fechava o menu na hora. */
  const popJustOpened=(ms)=>Date.now()-popOpenedAt<ms;
  verseBackdrop.addEventListener('click',()=>{if(popJustOpened(700))return;closePop()});
  document.addEventListener('touchstart',e=>{if(pop.classList.contains('on')&&!popJustOpened(400)&&!e.target.closest('#verseActions')&&!e.target.closest('.verse-context'))closePop()},{passive:true});
  window.addEventListener('scroll',()=>{if(pop.classList.contains('on')&&!popJustOpened(600)&&Date.now()>(window.__doxaVerseAutoScrollUntil||0))closePop()},{passive:true});
  function openStudy(kind){if(!activeRef)return;studyMode=kind;compareIndex=0;delete body.dataset.compareStarted;closePop();screen.classList.add('on');screen.setAttribute('aria-hidden','false');renderStudy()}
  function closeStudy(){screen.classList.remove('on');screen.setAttribute('aria-hidden','true')}
  document.getElementById('studyBack').onclick=closeStudy;
  async function copyActiveVerse(){
    if(!activeRef)return;
    const m=activeRef.sourceMode||mode;
    const v=getVerse(m,activeRef)||getVerse('almeida',activeRef);
    if(!v)return;
    const text=String(v.text||'').trim()+'\n\n'+activeRef.label+' — '+modeLabel(m);
    try{await navigator.clipboard.writeText(text)}catch(e){const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
    closePop();
    try{flash('Verso copiado.')}catch(e){}
  }
  pop.onclick=e=>{const b=e.target.closest('[data-va]');if(!b)return;const a=b.dataset.va;if(a==='copy'){copyActiveVerse();return}if(a==='xref'){if(activeRef?.parallelSide&&window.DoxaOpenCrossRefs){const r={...activeRef};closePop();window.DoxaOpenCrossRefs(r);return}const v=activeRef?.verse,el=document.getElementById('v'+v);let trigger=el?.querySelector('.xref-trigger');if(!trigger&&el){trigger=document.createElement('button');trigger.className='xref-trigger';trigger.dataset.xv=v;trigger.style.display='none';el.appendChild(trigger)}closePop();trigger?.click();return}if(a==='interlinear'){openStudy('interlinear');return}openStudy(a==='exegete'?'exegete':'compare')};
  function renderCompare(){compareModes=comparisonCandidates(activeRef);if(!compareModes.length){body.innerHTML='<div class="study-loading">Nenhuma outra versão instalada contém esta referência.</div>';return}if(compareIndex>=compareModes.length)compareIndex=0;let m=compareModes[compareIndex];if(activeRef.sourceMode&&compareModes.includes(activeRef.sourceMode)&&!body.dataset.compareStarted){compareIndex=compareModes.indexOf(activeRef.sourceMode);m=activeRef.sourceMode;body.dataset.compareStarted='1'}const v=getVerse(m,activeRef);title.textContent='Comparar versos';refEl.textContent=activeRef.label;body.innerHTML='<div class="study-version-nav"><button id="cmpLeft" type="button">‹</button><div class="study-version-name"><strong>'+esc(modeLabel(m))+'</strong><small>'+(compareIndex+1)+' de '+compareModes.length+'</small></div><button id="cmpRight" type="button">›</button></div><div class="study-verse-card'+(m==='wlc'?' original':'')+'">'+esc(v?.text||'—')+'</div>';document.getElementById('cmpLeft').onclick=()=>{compareIndex=(compareIndex-1+compareModes.length)%compareModes.length;renderCompare()};document.getElementById('cmpRight').onclick=()=>{compareIndex=(compareIndex+1)%compareModes.length;renderCompare()}}
  function otWordRows(r){const items=oshbVerse(r.book,r.chapter,r.verse)||[];return items.filter(Array.isArray).map(tok=>{const lex=lexicalFromToken(tok),attr=OSHB_STRONG.la[tok[1]]||'',morph=OSHB_STRONG.m[tok[2]]||'',strong=lex?.[1]||mainLemmaFromAttr(attr)||'—',pt=doxaStrongPtEntry(lex),gloss=pt.m.length?pt.m.slice(0,3).join(' · '):'sentido dependente do contexto';return '<div class="word-row"><div><div class="word-original">'+esc(tok[0])+'</div><div class="word-meta">'+esc(lex?.[4]||'')+'</div></div><div class="word-meta"><b>'+esc(lex?.[3]||'—')+'</b><br><span class="strong-pill">'+esc(String(strong).startsWith('H')?strong:'H'+strong)+'</span><span class="word-pt">'+esc(gloss)+'</span><span>'+esc(decodeMorph(morph))+'</span>'+(lex?'<details class="word-original-en"><summary>Original em inglês</summary><div>'+esc(lex?.[7]||lex?.[9]||'—')+'</div></details>':'')+'</div></div>'}).join('')}
  const GREEK_DB='doxa-greek-strong-v1';let greekFlat=null,greekPromise=null;
  function greekDb(){return new Promise((res,rej)=>{const q=indexedDB.open(GREEK_DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('cache'))q.result.createObjectStore('cache')};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
  async function loadGreekFlat(){if(greekFlat)return greekFlat;if(greekPromise)return greekPromise;greekPromise=(async()=>{try{const db=await greekDb(),cached=await new Promise((res,rej)=>{const tx=db.transaction('cache','readonly'),q=tx.objectStore('cache').get('flat');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});if(cached){greekFlat=cached;return cached}}catch(e){}const r=await fetch('https://raw.githubusercontent.com/honza/textus-receptus/master/data/gnt.flat.json',{cache:'force-cache'});if(!r.ok)throw new Error('Não foi possível baixar a base Strong do grego ('+r.status+').');const data=await r.json();greekFlat=data;try{const db=await greekDb();await new Promise((res,rej)=>{const tx=db.transaction('cache','readwrite');tx.objectStore('cache').put(data,'flat');tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}catch(e){}return data})();try{return await greekPromise}finally{greekPromise=null}}
  function greekRecord(data,r){const arr=Array.isArray(data)?data:(data?.verses||data?.data||[]);return arr.find(x=>String(x.book_name_osis||x.book||'')===String(r.book)&&Number(x.chapter)===Number(r.chapter)&&Number(x.verse)===Number(r.verse))||null}
  function interlinearGloss(text){
    const x=String(text||'').replace(/\s+/g,' ').trim();
    if(!x)return '—';
    const first=x.split(/\s*[;|]\s*|\.\s+/)[0].trim()||x;
    return first.length>92?first.slice(0,89).trim()+'…':first;
  }
  function interlinearTranslation(r){
    const chosen=(!['wlc','tr'].includes(r.sourceMode)&&getVerse(r.sourceMode,r))?r.sourceMode:'almeida';
    return {mode:chosen,verse:getVerse(chosen,r)||getVerse('almeida',r)};
  }

  // Gênesis 1 — protótipo do interlinear morfológico real.
  // A estrutura vem do WLC/OSHB já embutido: tok[4] preserva as divisões de morfema
  // (ex.: בְּ/רֵאשִׁית), enquanto la/m preservam prefixos, artigo e morfologia.
  const GEN1_BASE={
    H7225:'princípio',H1254:'criar',H430:'Deus',H853:'[obj.]',H8064:'céus',H776:'terra',H1961:'ser',H8414:'desolação',H922:'vazio',H2822:'treva',H5921:'sobre',H6440:'face',H8415:'abismo',H7307:'espírito',H7363:'pairar',H4325:'águas',H559:'dizer',H216:'luz',H7200:'ver',H3588:'que',H2896:'bom',H914:'separar',H996:'entre',H7121:'chamar',H3117:'dia',H3915:'noite',H6153:'tarde',H1242:'manhã',H259:'um',H7549:'firmamento',H8432:'meio',H6213:'fazer',H834:'que',H8478:'debaixo',H3651:'assim',H8145:'segundo',H6960:'reunir',H413:'para',H4725:'lugar',H3004:'seca',H4723:'reunião',H3220:'mar',H1876:'brotar',H1877:'broto',H6212:'erva',H2232:'semear',H2233:'semente',H6086:'árvore',H6529:'fruto',H4327:'espécie',H3318:'produzir',H7992:'terceiro',H3974:'luzeiro',H226:'sinal',H4150:'tempo determinado',H8141:'ano',H215:'iluminar',H8147:'dois',H1419:'grande',H4475:'governo',H6996:'pequeno',H3556:'estrela',H5414:'dar',H4910:'governar',H7243:'quarto',H8317:'fervilhar',H8318:'enxame',H5315:'alma',H2416:'vivente',H5775:'ave',H5774:'voar',H8577:'tannin',H3605:'todo',H7430:'rastejar',H3671:'asa',H1288:'abençoar',H6509:'frutificar',H7235:'multiplicar',H4390:'encher',H2549:'quinto',H929:'animal',H7431:'rastejante',H127:'solo',H120:'Adam',H6754:'imagem',H1823:'semelhança',H7287:'dominar',H1710:'peixe',H2145:'macho',H5347:'fêmea',H3533:'subjugar',H2009:'eis',H402:'alimento',H3418:'verde',H3966:'muito',H8345:'sexto'
  };
  const GEN1_ARTICLE={H8064:'os',H776:'a',H4325:'as',H216:'a',H2822:'a',H7549:'o',H3004:'a',H3117:'o',H3915:'a',H3974:'o',H1419:'o',H6996:'o',H3556:'as',H5775:'a',H8577:'os',H2416:'a',H929:'o',H127:'o',H3220:'o',H7431:'o',H120:'o',H6086:'a',H7430:'o',H8345:'o'};
  const GEN1_FULL={
    'בָּרָא':'criou','הָיְתָה':'era','מְרַחֶפֶת':'pairava','וַיֹּאמֶר':'e disse','וַיַּרְא':'e viu','וַיַּבְדֵּל':'e separou','וַיִּקְרָא':'e chamou','קָרָא':'chamou','וִיהִי':'e esteja','מַבְדִּיל':'separando','וַיַּעַשׂ':'e fez','יִקָּווּ':'sejam reunidas','וְתֵרָאֶה':'e apareça','תַּדְשֵׁא':'faça brotar','מַזְרִיעַ':'semeando','עֹשֶׂה':'fazendo','וַתּוֹצֵא':'e produziu','לֵאמֹר':'dizendo','לְהַבְדִּיל':'para separar','לְהָאִיר':'para iluminar','וַיִּתֵּן':'e colocou','וְלִמְשֹׁל':'e para governar','וּלֲהַבְדִּיל':'e para separar','יִשְׁרְצוּ':'fervilhem','יְעוֹפֵף':'voe','וַיִּבְרָא':'e criou','שָׁרְצוּ':'enxamearam','וַיְבָרֶךְ':'e abençoou','פְּרוּ':'frutificai','וּרְבוּ':'e multiplicai','וּמִלְאוּ':'e enchei','יִרֶב':'multiplique-se','תּוֹצֵא':'produza','נַעֲשֶׂה':'façamos','וְיִרְדּוּ':'e dominem','וְכִבְשֻׁהָ':'e subjugai-a','וּרְדוּ':'e dominai','נָתַתִּי':'dei','זֹרֵעַ':'semeando','יִהְיֶה':'será','רוֹמֵשׂ':'rastejante','עָשָׂה':'fez',
    'פְּנֵי':'faces','מַיִם':'águas','שָׁמָיִם':'céus','מְאֹרֹת':'luzeiros','שְׁנֵי':'dois','יַמִּים':'mares','שֶׁרֶץ':'enxame','נֶפֶשׁ':'alma','חַיָּה':'vivente','עוֹף':'ave','כָּנָף':'asa','בְּהֵמָה':'animal doméstico','רֶמֶשׂ':'rastejante','אָדָם':'Adam','זָכָר':'macho','נְקֵבָה':'fêmea','יֶרֶק':'verde','מְאֹד':'muito','מִתַּחַת':'debaixo','מֵעַל':'acima','לָהֶם':'para eles','לָכֶם':'para vós','וּבְעוֹף':'e em aves','הָרֹמֶשֶׂת':'a rastejante','הָרֹמֵשׂ':'o rastejante'
  };
  const GEN1_AT={
    '3:2':'haja','3:4':'e houve','5:7':'e foi','5:10':'e foi','6:2':'seja','7:16':'e foi','8:4':'e foi','8:7':'e foi','9:12':'e foi','11:20':'e foi','13:0':'e foi','13:3':'e foi','14:2':'haja','14:11':'e serão','15:0':'e serão','15:8':'e foi','19:0':'e foi','19:3':'e foi','23:0':'e foi','23:3':'e foi','24:13':'e foi','30:25':'e foi','31:12':'e foi','31:15':'e foi'
  };
  const GEN1_FORM_BASE={
    'תֹהוּ':'desolação','בֹהוּ':'vazio','חֹשֶׁךְ':'treva','רוּחַ':'espírito','אוֹר':'luz','טוֹב':'bom','יוֹם':'dia','לָיְלָה':'noite','עֶרֶב':'tarde','בֹקֶר':'manhã','אֶחָד':'um','רָקִיעַ':'firmamento','תּוֹךְ':'meio','אֲשֶׁר':'que','כֵן':'assim','שֵׁנִי':'segundo','מָקוֹם':'lugar','יַבָּשָׁה':'seca','דֶּשֶׁא':'broto','עֵשֶׂב':'erva','זֶרַע':'semente','עֵץ':'árvore','פְּרִי':'fruto','שְׁלִישִׁי':'terceiro','מְאֹרֹת':'luzeiros','אֹתֹת':'sinais','מוֹעֲדִים':'tempos determinados','יָמִים':'dias','שָׁנִים':'anos','גְּדֹלִים':'grandes','מָאוֹר':'luzeiro','גָּדֹל':'grande','מֶמְשֶׁלֶת':'governo','קָּטֹן':'pequeno','כּוֹכָבִים':'estrelas','רְבִיעִי':'quarto','תַּנִּינִם':'tanninim','חֲמִישִׁי':'quinto','אֲדָמָה':'solo','צֶלֶם':'imagem','דְמוּת':'semelhança','דְגַת':'peixes','שִּׁשִּׁי':'sexto'
  };
  function gen1Strong(tok){const lex=lexicalFromToken(tok);return lex?.[1]||''}
  function gen1Morph(tok){return OSHB_STRONG.m[tok?.[2]]||''}
  function gen1Attr(tok){return OSHB_STRONG.la[tok?.[1]]||''}
  function gen1LexMorph(morph){return String(morph||'').split('/').find(x=>/^[NAV]/.test(x))||''}
  function gen1Plural(word){const w=String(word||'');const special={sinal:'sinais','animal':'animais','luzeiro':'luzeiros','estrela':'estrelas','ave':'aves','asa':'asas','ano':'anos','dia':'dias','fruto':'frutos','árvore':'árvores','espécie':'espécies','peixe':'peixes'};if(special[w])return special[w];if(/ão$/.test(w))return w.replace(/ão$/,'ões');if(/[rlz]$/.test(w))return w+'es';if(/[aeiou]$/.test(w))return w+'s';return w}
  function gen1Article(strong,morph,base){let a=GEN1_ARTICLE[strong]||'';const lm=gen1LexMorph(morph),plural=/^.[^\/]{2}p/.test(lm)||/^[NA].{2}p/.test(lm);if(!a){const feminine=/^[NA].?f/.test(lm);a=feminine?'a':'o'}if(plural){if(a==='a')a='as';else if(a==='o')a='os'}return a}
  function gen1Contract(prep,article){if(prep==='em')return article==='o'?'no':article==='a'?'na':article==='os'?'nos':article==='as'?'nas':'em';if(prep==='para')return article==='o'?'ao':article==='a'?'à':article==='os'?'aos':article==='as'?'às':'para';if(prep==='de')return article==='o'?'do':article==='a'?'da':article==='os'?'dos':article==='as'?'das':'de';return prep+(article?' '+article:'')}
  function gen1PronSuffix(morph,strong){if(!/Sp/.test(morph))return'';const m=morph.match(/Sp(\d)([mfc])?([sp])/);if(!m)return'';const p=m[1],g=m[2]||'',n=m[3];if(strong==='H853')return p==='3'?(n==='p'?'eles':g==='f'?'ela':'ele'):'';if(p==='1'&&n==='p')return'nossa';if(p==='2'&&n==='p')return'vós';if(p==='3'&&n==='p')return'deles';if(p==='3'&&g==='f')return'dela';if(p==='3')return'dele';return''}
  function gen1WordGloss(tok,v,ti){
    const exact=GEN1_AT[v+':'+ti];if(exact)return exact;
    const word=tok[0],full=GEN1_FULL[word];if(full)return full;
    const strong=gen1Strong(tok),morph=gen1Morph(tok),attr=gen1Attr(tok),seg=String(tok[4]||word).split('/');
    if(!strong){const suf=gen1PronSuffix(morph,strong);if(/^b(?:\/|$)/.test(attr)&&suf)return suf==='dele'?'nele':'em '+suf;if(/^l(?:\/|$)/.test(attr)&&suf)return'para '+suf;return word}
    let base=GEN1_FORM_BASE[seg.find(x=>GEN1_FORM_BASE[x])||'']||GEN1_BASE[strong]||doxaStrongPtEntry(lexicalFromToken(tok)).m?.[0]||'—';
    const lm=gen1LexMorph(morph);if(/[NA].{2}p/.test(lm)&&!['céus','águas','tanninim','tempos determinados'].includes(base))base=gen1Plural(base);
    const codes=attr.split('/'),mp=morph.split('/');let prefix=[],article='';
    let mi=0;for(let i=0;i<codes.length;i++){const c=codes[i];if(/^\d/.test(c))break;const mm=mp[mi]||'';mi++;if(c==='c'){prefix.push('e');continue}if(c==='d'){article=gen1Article(strong,morph,base);prefix.push(article);continue}if(c==='b'){const embedded=/Rd/.test(mm);if(embedded){article=gen1Article(strong,morph,base);prefix.push(gen1Contract('em',article))}else prefix.push('em');continue}if(c==='l'){const embedded=/Rd/.test(mm);if(embedded){article=gen1Article(strong,morph,base);prefix.push(gen1Contract('para',article))}else prefix.push('para');continue}if(c==='m'){prefix.push('de');continue}if(c==='k'){prefix.push('como');continue}}
    let suffix=gen1PronSuffix(morph,strong);if(suffix){if(strong==='H853')base='[obj.] '+suffix;else if(suffix==='nossa')base=base+' nossa';else base=base+' '+suffix}
    return [...prefix,base].filter(Boolean).join(' ').replace(/\be (no|na|nos|nas|ao|à|aos|às)\b/g,'e $1').replace(/\s+/g,' ').trim();
  }
  function renderGen1Interlinear(currentVerse){
    const chapter=OSHB_STRONG.d?.[OSHB_BOOK_INDEX.Gen]?.[0]||[];
    let out='<div class="il27-head"><strong>Gênesis 1 · interlinear morfológico</strong><small>O português acompanha os morfemas do hebraico, sem completar a frase como uma tradução corrente. Prefixos, artigos e pronomes só aparecem quando estão marcados no texto.</small><div class="il27-example"><span class="h">בְּרֵאשִׁית</span><span class="p">em princípio</span></div></div><div class="il27-chapter">';
    chapter.forEach((items,vi)=>{const v=vi+1;out+='<section class="il27-verse'+(v===Number(currentVerse)?' current':'')+'" data-v="'+v+'"><span class="il27-vnum">'+v+'</span><div class="il27-flow" dir="rtl">';items.forEach((tok,ti)=>{if(Array.isArray(tok)){const gloss=gen1WordGloss(tok,v,ti);out+='<button type="button" class="il27-word interlinear-hebrew oshb-word" data-b="Gen" data-c="1" data-v="'+v+'" data-ti="'+ti+'" title="'+esc(String(tok[4]||tok[0]).replace(/\//g,' · '))+'"><span class="il27-hebrew">'+esc(tok[0])+'</span><span class="il27-gloss">'+esc(gloss)+'</span></button>'}else if(tok==='־'||tok==='׃')out+='<span class="il27-punct" aria-hidden="true">'+esc(tok)+'</span>'});out+='</div></section>'});
    return out+'</div><div class="il27-note"><b>Gênesis 1.</b> A segmentação é a do WLC/OSHB já incorporado ao Doxa. A camada portuguesa é uma glosa morfológica, não uma tradução corrida. Exemplo-chave: בְּרֵאשִׁית traz a preposição בְּ (“em”) + רֵאשִׁית (“princípio”); portanto o interlinear mostra <b>em princípio</b>, sem inserir artigo.</div>';
  }
  const GENESIS_IL_LOADED=new Set();
  const GENESIS_IL_LOADING=new Map();
  const EXODUS_IL_LOADED=new Set();
  const EXODUS_IL_LOADING=new Map();
  function genesisIlStrongNum(s){
    const m=String(s||'').match(/H?0*(\d+)/i);return m?String(Number(m[1])):'';
  }
  function genesisIlOshbStrong(tok){
    if(!Array.isArray(tok))return'';
    const attr=String(OSHB_STRONG.la?.[tok[1]]||'');
    const nums=attr.match(/\d+/g);return nums?.length?String(Number(nums[nums.length-1])):'';
  }
  function genesisIlTokenIndexes(chapter,verse,tokens){
    const raw=oshbVerse('Gen',Number(chapter),Number(verse))||[];
    const words=[];raw.forEach((x,i)=>{if(Array.isArray(x))words.push({i,strong:genesisIlOshbStrong(x)})});
    let cursor=0;
    return (tokens||[]).map(t=>{
      const target=genesisIlStrongNum(t?.strong);let found=-1;
      if(target){for(let j=cursor;j<words.length;j++){if(words[j].strong===target){found=j;break}}}
      if(found<0&&cursor<words.length)found=cursor;
      if(found<0)return-1;
      cursor=found+1;return words[found].i;
    });
  }
  function loadGenesisInterlinearChapter(chapter){
    const c=Number(chapter);if(c<2||c>50)return Promise.resolve(null);
    window.DOXA_GENESIS_INTERLINEAR=window.DOXA_GENESIS_INTERLINEAR||{};
    if(window.DOXA_GENESIS_INTERLINEAR[String(c)]){GENESIS_IL_LOADED.add(c);return Promise.resolve(window.DOXA_GENESIS_INTERLINEAR[String(c)])}
    if(GENESIS_IL_LOADING.has(c))return GENESIS_IL_LOADING.get(c);
    const p=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.async=true;script.src='interlinear/genesis/'+String(c).padStart(2,'0')+'.js';
      script.onload=()=>{GENESIS_IL_LOADING.delete(c);const data=window.DOXA_GENESIS_INTERLINEAR?.[String(c)];if(data){GENESIS_IL_LOADED.add(c);resolve(data)}else reject(new Error('Capítulo interlinear sem dados.'))};
      script.onerror=()=>{GENESIS_IL_LOADING.delete(c);reject(new Error('Não foi possível abrir o banco interlinear local de Gênesis '+c+'.'))};
      document.head.appendChild(script);
    });GENESIS_IL_LOADING.set(c,p);return p;
  }
  function exodusIlTokenIndexes(sourceChapter,sourceVerse,tokens){
    const raw=oshbVerse('Exod',Number(sourceChapter),Number(sourceVerse))||[];
    const words=[];raw.forEach((x,i)=>{if(Array.isArray(x))words.push({i,strong:genesisIlOshbStrong(x)})});
    let cursor=0;
    return (tokens||[]).map(t=>{
      const target=genesisIlStrongNum(t?.strong);let found=-1;
      if(target){for(let j=cursor;j<words.length;j++){if(words[j].strong===target){found=j;break}}}
      if(found<0&&cursor<words.length)found=cursor;
      if(found<0)return-1;
      cursor=found+1;return words[found].i;
    });
  }
  function loadExodusInterlinearChapter(chapter){
    const c=Number(chapter);if(c<1||c>40)return Promise.resolve(null);
    window.DOXA_EXODUS_INTERLINEAR=window.DOXA_EXODUS_INTERLINEAR||{};
    if(window.DOXA_EXODUS_INTERLINEAR[String(c)]){EXODUS_IL_LOADED.add(c);return Promise.resolve(window.DOXA_EXODUS_INTERLINEAR[String(c)])}
    if(EXODUS_IL_LOADING.has(c))return EXODUS_IL_LOADING.get(c);
    const p=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.async=true;script.src='interlinear/exodus/'+String(c).padStart(2,'0')+'.js';
      script.onload=()=>{EXODUS_IL_LOADING.delete(c);const data=window.DOXA_EXODUS_INTERLINEAR?.[String(c)];if(data){EXODUS_IL_LOADED.add(c);resolve(data)}else reject(new Error('Capítulo interlinear sem dados.'))};
      script.onerror=()=>{EXODUS_IL_LOADING.delete(c);reject(new Error('Não foi possível abrir o banco interlinear local de Êxodo '+c+'.'))};
      document.head.appendChild(script);
    });EXODUS_IL_LOADING.set(c,p);return p;
  }
  function exodusStandardFromSource(displayChapter,sources){
    const c=Number(displayChapter),out={};
    const put=(dv,sc,sv)=>{const rec=sources?.[String(sc)]?.[String(sv)];if(rec)out[String(dv)]={...rec,_sourceChapter:sc,_sourceVerse:sv}};
    if(c===7){for(let v=1;v<=25;v++)put(v,7,v);return out}
    if(c===8){for(let v=1;v<=4;v++)put(v,7,v+25);for(let v=5;v<=32;v++)put(v,8,v-4);return out}
    if(c===21){for(let v=1;v<=36;v++)put(v,21,v);return out}
    if(c===22){put(1,21,37);for(let v=2;v<=31;v++)put(v,22,v-1);return out}
    const src=sources?.[String(c)]||{};Object.keys(src).forEach(k=>{const v=Number(k);out[String(v)]={...src[k],_sourceChapter:c,_sourceVerse:v}});return out;
  }
  async function loadExodusDisplayChapter(chapter,hebrewVersification){
    const c=Number(chapter);
    if(hebrewVersification){const src=await loadExodusInterlinearChapter(c);const out={};Object.keys(src||{}).forEach(k=>{out[k]={...src[k],_sourceChapter:c,_sourceVerse:Number(k)}});return out}
    if(c===8){const [a,b]=await Promise.all([loadExodusInterlinearChapter(7),loadExodusInterlinearChapter(8)]);return exodusStandardFromSource(8,{'7':a,'8':b})}
    if(c===22){const [a,b]=await Promise.all([loadExodusInterlinearChapter(21),loadExodusInterlinearChapter(22)]);return exodusStandardFromSource(22,{'21':a,'22':b})}
    const a=await loadExodusInterlinearChapter(c);return exodusStandardFromSource(c,{[String(c)]:a});
  }

  function genesisIlPartsTitle(tok){
    const parts=Array.isArray(tok?.parts)?tok.parts:[];
    if(!parts.length)return String(tok?.lemma||tok?.strong||'');
    return parts.map(p=>String(p.surface||'')+' = '+String(p.gloss_pt||'')).join(' · ');
  }
  function renderGenesisDataChapter(chapter,currentVerse,data){
    const c=Number(chapter);let out='<div class="il27-head"><strong>Gênesis '+c+' · interlinear morfológico</strong><small>O português acompanha a análise morfológica do hebraico fornecida pelo banco Doxa. A glosa não é uma tradução corrente; gênero, número, partículas, prefixos e sufixos podem produzir português deliberadamente não natural.</small><div class="il27-example"><span class="h">הַמַּיִם</span><span class="p">os águas</span></div></div><div class="il27-chapter">';
    const verses=Object.keys(data||{}).map(Number).sort((a,b)=>a-b);
    verses.forEach(v=>{
      const rec=data[String(v)]||{},tokens=Array.isArray(rec.tokens)?rec.tokens:[],idxs=genesisIlTokenIndexes(c,v,tokens);
      out+='<section class="il27-verse'+(v===Number(currentVerse)?' current':'')+'" data-v="'+v+'"><span class="il27-vnum">'+v+'</span><div class="il27-flow" dir="rtl">';
      tokens.forEach((tok,j)=>{
        const ti=idxs[j],title=genesisIlPartsTitle(tok),surface=String(tok.surface||''),gloss=String(tok.gloss_pt||'—');
        out+='<button type="button" class="il27-word interlinear-hebrew oshb-word" data-b="Gen" data-c="'+c+'" data-v="'+v+'"'+(ti>=0?' data-ti="'+ti+'"':'')+' title="'+esc(title)+'" aria-label="'+esc(surface+' — '+gloss)+'"><span class="il27-hebrew">'+esc(surface)+'</span><span class="il27-gloss">'+esc(gloss)+'</span></button>';
      });
      out+='</div></section>';
    });
    return out+'</div><div class="il27-note"><b>Gênesis '+c+'.</b> Dados interlineares locais e offline. Foram preservadas as glosas do banco fornecido para o Doxa, sem normalização para português corrente. Fontes registradas no banco: WLC/OSHB, STEPBible TAHOT/TBESH e MACULA/Cherith.</div>';
  }
  function renderExodusDataChapter(chapter,currentVerse,data,hebrewVersification){
    const c=Number(chapter);let out='<div class="il27-head"><strong>Êxodo '+c+' · interlinear morfológico</strong><small>O português acompanha a morfologia hebraica, mesmo quando isso produz uma construção deliberadamente não natural. As glosas lexicais foram desambiguadas pelo contexto no banco de Êxodo.</small><div class="il27-example"><span class="h">הַמַּיִם</span><span class="p">os águas</span></div></div><div class="il27-chapter">';
    const verses=Object.keys(data||{}).map(Number).sort((a,b)=>a-b);
    verses.forEach(v=>{
      const rec=data[String(v)]||{},tokens=Array.isArray(rec.tokens)?rec.tokens:[],sc=Number(rec._sourceChapter||c),sv=Number(rec._sourceVerse||v),idxs=exodusIlTokenIndexes(sc,sv,tokens);
      out+='<section class="il27-verse'+(v===Number(currentVerse)?' current':'')+'" data-v="'+v+'"><span class="il27-vnum">'+v+'</span><div class="il27-flow" dir="rtl">';
      tokens.forEach((tok,j)=>{
        const ti=idxs[j],title=genesisIlPartsTitle(tok),surface=String(tok.surface||''),gloss=String(tok.gloss_pt||'—');
        out+='<button type="button" class="il27-word interlinear-hebrew oshb-word" data-b="Exod" data-c="'+sc+'" data-v="'+sv+'"'+(ti>=0?' data-ti="'+ti+'"':'')+' title="'+esc(title)+'" aria-label="'+esc(surface+' — '+gloss)+'"><span class="il27-hebrew">'+esc(surface)+'</span><span class="il27-gloss">'+esc(gloss)+'</span></button>';
      });
      out+='</div></section>';
    });
    const versNote=hebrewVersification?'A numeração acompanha o WLC/BHS porque a versão hebraica está em leitura.':'A referência acompanha a numeração das Bíblias em português; nas diferenças de Êxodo 7–8 e 21–22, o Doxa remapeia automaticamente para o versículo correspondente do WLC/BHS.';
    return out+'</div><div class="il27-note"><b>Êxodo '+c+'.</b> Dados interlineares locais e offline. '+versNote+' As glosas preservam a estrutura morfológica hebraica e usam desambiguação lexical contextual. Fontes registradas no banco: WLC/OSHB, STEPBible TAHOT/TBESH e MACULA/Cherith.</div>';
  }

  function renderGreekInterlinearCards(rec){
    return (rec?.words||[]).map(w=>{const original=w.definition||'',pt=doxaPtEnLex(original),grammar=doxaGreekGrammarPt(w.grammar_human||w.grammar||''),strong=String(w.strong||'').replace(/^G/i,'');return '<button type="button" class="interlinear-token interlinear-greek doxa-greek-rayx" data-gstrong="'+esc(strong)+'" data-gword="'+esc(w.greek||'')+'" data-glemma="'+esc(w.dictionary_form||'')+'" data-gtrans="'+esc(w.transliteration||'')+'"><span class="il-original">'+esc(w.greek||'—')+'</span><strong class="il-gloss">'+esc(interlinearGloss(pt||original))+'</strong><span class="il-meta">G'+esc(strong||'—')+' · '+esc(grammar||'—')+'</span></button>'}).join('')
  }
  async function renderInterlinear(){
    title.textContent='Interlinear';
    if(activeRef.book==='Gen'){
      const c=Number(activeRef.chapter),v=Number(activeRef.verse);
      if(c===1){
        refEl.textContent='Gênesis 1 · interlinear morfológico';body.innerHTML=renderGen1Interlinear(v);setTimeout(()=>{const el=body.querySelector('.il27-verse.current');if(el)el.scrollIntoView({block:'center',behavior:'auto'})},25);return;
      }
      if(c>=2&&c<=50){
        refEl.textContent='Gênesis '+c+' · interlinear morfológico';
        body.innerHTML='<div class="study-loading">Abrindo banco interlinear local de Gênesis '+c+'…</div>';
        const requested=c;
        try{
          const data=await loadGenesisInterlinearChapter(c);
          if(studyMode!=='interlinear'||!screen.classList.contains('on')||activeRef.book!=='Gen'||Number(activeRef.chapter)!==requested)return;
          body.innerHTML=renderGenesisDataChapter(c,v,data);setTimeout(()=>{const el=body.querySelector('.il27-verse.current');if(el)el.scrollIntoView({block:'center',behavior:'auto'})},25);return;
        }catch(e){
          body.innerHTML='<div class="il27-unavailable"><b>Banco interlinear indisponível</b><span>'+esc(e?.message||'Não foi possível abrir os dados locais deste capítulo.')+'</span></div>';return;
        }
      }
    }
    if(activeRef.book==='Exod'){
      const c=Number(activeRef.chapter),v=Number(activeRef.verse),hebrewVersification=activeRef.sourceMode==='wlc';
      if(c>=1&&c<=40){
        refEl.textContent='Êxodo '+c+' · interlinear morfológico';
        body.innerHTML='<div class="study-loading">Abrindo banco interlinear local de Êxodo '+c+'…</div>';
        const requestedC=c,requestedV=v,requestedMode=activeRef.sourceMode;
        try{
          const data=await loadExodusDisplayChapter(c,hebrewVersification);
          if(studyMode!=='interlinear'||!screen.classList.contains('on')||activeRef.book!=='Exod'||Number(activeRef.chapter)!==requestedC||Number(activeRef.verse)!==requestedV||activeRef.sourceMode!==requestedMode)return;
          body.innerHTML=renderExodusDataChapter(c,v,data,hebrewVersification);setTimeout(()=>{const el=body.querySelector('.il27-verse.current');if(el)el.scrollIntoView({block:'center',behavior:'auto'})},25);return;
        }catch(e){
          body.innerHTML='<div class="il27-unavailable"><b>Banco interlinear indisponível</b><span>'+esc(e?.message||'Não foi possível abrir os dados locais deste capítulo.')+'</span></div>';return;
        }
      }
    }
    refEl.textContent=activeRef.label;body.innerHTML='<div class="il27-unavailable"><b>Interlinear morfológico: Gênesis + Êxodo</b><span>Nesta versão, o banco interlinear está disponível para Gênesis 1–50 e Êxodo 1–40. Os demais livros ainda não receberam esta camada.</span></div>';
  }
  async function renderExegete(){title.textContent='Guia exegético';refEl.textContent=activeRef.label;const cur=getVerse(activeRef.sourceMode,activeRef)||getVerse('almeida',activeRef);const ot=!!getVerse('wlc',activeRef),nt=!!getVerse('tr',activeRef);let html='<div class="study-label">Texto · '+esc(modeLabel(activeRef.sourceMode))+'</div><div class="study-verse-card">'+esc(cur?.text||'—')+'</div>';if(!ot&&!nt){body.innerHTML=html+'<div class="study-section"><div class="study-loading">O guia Strong está disponível para referências do Antigo e do Novo Testamento presentes nos corpora originais do Doxa.</div></div>';return}if(ot){const orig=getVerse('wlc',activeRef);html+='<div class="study-section"><div class="study-label">Hebraico · WLC / OSHB</div><div class="study-verse-card original">'+esc(orig?.text||oshbTokenText(oshbVerse(activeRef.book,activeRef.chapter,activeRef.verse)))+'</div><div class="study-label" style="margin-top:18px">Palavra por palavra · Strong+</div><div class="word-guide">'+otWordRows(activeRef)+'</div><p class="study-note">A camada lexical Doxa apresenta os sentidos Strong em português. O verbete original em inglês permanece disponível para conferência em cada palavra.</p></div>';body.innerHTML=html;return}const orig=getVerse('tr',activeRef);html+='<div class="study-section"><div class="study-label">Grego · Textus Receptus 1550</div><div class="study-verse-card greek">'+esc(orig?.text||'—')+'</div><div class="study-label" style="margin-top:18px">Palavra por palavra · Strong</div><div id="greekGuide" class="study-loading">Carregando base lexical grega…</div><p class="study-note">O texto grego mostrado acima é o TR 1550 do Doxa. A camada PT-BR traduz a definição lexical para leitura; o original em inglês permanece disponível em cada palavra. A marcação Strong/gramatical usa uma base TR marcada separada.</p></div>';body.innerHTML=html;try{const data=await loadGreekFlat();if(studyMode!=='exegete'||!screen.classList.contains('on'))return;const rec=greekRecord(data,activeRef),box=document.getElementById('greekGuide');if(!box)return;if(!rec){box.innerHTML='Não foi encontrada marcação Strong para esta referência.';return}box.className='word-guide';box.innerHTML=(rec.words||[]).map(w=>{const original=w.definition||'—',pt=doxaPtEnLex(original),grammar=doxaGreekGrammarPt(w.grammar_human||w.grammar||'');return '<div tabindex="0" role="button" class="word-row doxa-greek-rayx" data-gstrong="'+esc(String(w.strong||''))+'" data-gword="'+esc(w.greek||'')+'" data-glemma="'+esc(w.dictionary_form||'')+'" data-gtrans="'+esc(w.transliteration||'')+'"><div><div class="word-original greek">'+esc(w.greek||'')+'</div><div class="word-meta">'+esc(w.transliteration||'')+'</div></div><div class="word-meta"><b>'+esc(w.dictionary_form||'—')+'</b><br><span class="strong-pill">G'+esc(w.strong||'—')+'</span><span class="word-pt">'+esc(pt||'—')+'</span><span>'+esc(grammar)+'</span><details class="word-original-en"><summary>Original em inglês</summary><div>'+esc(original)+'</div></details></div></div>'}).join('')}catch(e){const box=document.getElementById('greekGuide');if(box)box.innerHTML='Não foi possível carregar a base Strong do grego agora. Na primeira utilização, é necessária conexão com a internet.'}}
  function renderStudy(){if(!activeRef)return;try{document.dispatchEvent(new CustomEvent('doxa-study-active-ref',{detail:{...activeRef}}))}catch(e){}if(studyMode==='compare')renderCompare();else if(studyMode==='interlinear')renderInterlinear();else renderExegete();const p=adjacent(activeRef,-1),n=adjacent(activeRef,1);document.getElementById('studyPrev').disabled=!p;document.getElementById('studyNext').disabled=!n}
  body.addEventListener('click',e=>{const w=e.target.closest('.interlinear-hebrew[data-ti]');if(w){e.preventDefault();e.stopPropagation();openStrong(w)}});
  body.addEventListener('keydown',e=>{const w=e.target.closest?.('.interlinear-hebrew[data-ti]');if(w&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openStrong(w)}});
  document.getElementById('studyPrev').onclick=()=>{const r=adjacent(activeRef,-1);if(r){activeRef=r;compareIndex=0;delete body.dataset.compareStarted;renderStudy()}};document.getElementById('studyNext').onclick=()=>{const r=adjacent(activeRef,1);if(r){activeRef=r;compareIndex=0;delete body.dataset.compareStarted;renderStudy()}};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(screen.classList.contains('on'))closeStudy();else closePop()}});
})();
