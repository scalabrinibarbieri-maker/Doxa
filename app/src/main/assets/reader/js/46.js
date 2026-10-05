(()=>{
  'use strict';
  /* Doxa 60 · BUSCA DOXA — tudo sem internet, calculado do texto
     · No texto: expressão exata ou todas as palavras; palavra inteira; excluir com -palavra; aspas para frase;
       português sem acentos; hebraico e grego direto (com ou sem sinais).
     · Pelo original: o português vira as palavras hebraicas/gregas por trás dele (Strong) e a busca roda no
       original — "amor" encontra אָהֵב, אַהֲבָה, חֶסֶד, ἀγάπη, φιλέω… mesmo onde a tradução usou outra palavra.
     · Suas notas e grifos.
     · Onde a palavra se concentra (gráfico por livro, toque para filtrar) e filtros por grupo de livros.
     · Atalhos: "jo 3 16" vai ao versículo; "H2617"/"G26" abre a palavra; nomes abrem o verbete do dicionário. */
  if(window.__doxa60BuscaInstalled)return;
  window.__doxa60BuscaInstalled=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f\u0591-\u05C7\u05F3\u05F4]/g,'').replace(/[\u05BE]/g,' ').toLowerCase();
  const OT=['Gen','Exod','Lev','Num','Deut','Josh','Judg','Ruth','1Sam','2Sam','1Kgs','2Kgs','1Chr','2Chr','Ezra','Neh','Esth','Job','Ps','Prov','Eccl','Song','Isa','Jer','Lam','Ezek','Dan','Hos','Joel','Amos','Obad','Jonah','Mic','Nah','Hab','Zeph','Hag','Zech','Mal'];
  const NTB=['Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'];
  const ALL=OT.concat(NTB);
  const GROUPS=[['all','Tudo',ALL],['ot','Antigo Test.',OT],['nt','Novo Test.',NTB],['lei','Lei',OT.slice(0,5)],['hist','Históricos',OT.slice(5,17)],
    ['poet','Poéticos',OT.slice(17,22)],['prof','Profetas',OT.slice(22)],['evang','Evangelhos e Atos',NTB.slice(0,5)],['cartas','Cartas',NTB.slice(5,26)],['apoc','Apocalipse',['Rev']]];
  const GROUP=Object.fromEntries(GROUPS.map(g=>[g[0],new Set(g[2])]));
  const bname=b=>(typeof BOOK_NAMES!=='undefined'&&BOOK_NAMES[b])||b;
  const ABBR={Gen:'Gn',Exod:'Êx',Lev:'Lv',Num:'Nm',Deut:'Dt',Josh:'Js',Judg:'Jz',Ruth:'Rt','1Sam':'1Sm','2Sam':'2Sm','1Kgs':'1Rs','2Kgs':'2Rs','1Chr':'1Cr','2Chr':'2Cr',Ezra:'Ed',Neh:'Ne',Esth:'Et',Job:'Jó',Ps:'Sl',Prov:'Pv',Eccl:'Ec',Song:'Ct',Isa:'Is',Jer:'Jr',Lam:'Lm',Ezek:'Ez',Dan:'Dn',Hos:'Os',Joel:'Jl',Amos:'Am',Obad:'Ob',Jonah:'Jn',Mic:'Mq',Nah:'Na',Hab:'Hc',Zeph:'Sf',Hag:'Ag',Zech:'Zc',Mal:'Ml',
    Matt:'Mt',Mark:'Mc',Luke:'Lc',John:'Jo',Acts:'At',Rom:'Rm','1Cor':'1Co','2Cor':'2Co',Gal:'Gl',Eph:'Ef',Phil:'Fp',Col:'Cl','1Thess':'1Ts','2Thess':'2Ts','1Tim':'1Tm','2Tim':'2Tm',Titus:'Tt',Phlm:'Fm',Heb:'Hb',Jas:'Tg','1Pet':'1Pe','2Pet':'2Pe','1John':'1Jo','2John':'2Jo','3John':'3Jo',Jude:'Jd',Rev:'Ap'};
  // apelidos de livro para "jo 3 16", "joão 3:16", "1 co 13", "salmo 23"…
  const ALIAS=(()=>{const m=new Map();const add=(k,b)=>{const x=N(k).replace(/[\s.]/g,'');if(x&&!m.has(x))m.set(x,b)};
    for(const b of ALL){add(ABBR[b],b);add(bname(b),b)}
    const extra={Ps:['salmo','salmos','sal'],Song:['cantares','cantico','canticos','cantico dos canticos'],Eccl:['eclesiastes','ecl'],Prov:['proverbios','prov'],Rev:['apocalipse','apoc'],
      Matt:['mateus','mat'],Mark:['marcos','mar'],Luke:['lucas','luc'],John:['joao'],Acts:['atos'],Phil:['filipenses','fil'],Phlm:['filemom','filemon'],Jas:['tiago'],Jude:['judas'],
      Judg:['juizes','jui'],Josh:['josue','jos'],Job:['jo','job'],Jonah:['jonas'],Joel:['joel'],Lam:['lamentacoes','lam'],Ezek:['ezequiel'],Exod:['exodo','ex'],Gen:['genesis','gen'],Deut:['deuteronomio','deut'],Lev:['levitico'],Num:['numeros','num']};
    for(const b in extra)for(const k of extra[b])add(k,b);
    m.set('jo','John');   // "jo" é João (Jó é "jó" com acento, que vira "jo"… por isso Jó fica em "job")
    return m})();
  const gr=s=>/[\u0370-\u03FF\u1F00-\u1FFF]/.test(s),he=s=>/[\u0590-\u05FF]/.test(s);

  /* ---------------- estado e interface ---------------- */
  const st={view:'texto',group:'all',book:null,parts:false,allWords:false,open:null,shown:100};
  let last={sig:'',hits:[],extra:null};
  function ensureUI(){
    const panel=$('p-buscar');if(!panel||$('bxTools'))return!!panel;
    const field=panel.querySelector('.field');
    const box=document.createElement('div');box.id='bxTools';box.className='bx-tools';
    box.innerHTML='<div class="bx-seg" role="tablist"><button data-view="texto" class="on" type="button">No texto</button><button data-view="original" type="button">No original</button><button data-view="notas" type="button">Suas notas</button></div>'
      +'<div class="bx-opts" id="bxOpts"><button type="button" data-opt="parts">Partes de palavras</button><button type="button" data-opt="allWords">Todas as palavras</button><span class="bx-help" id="bxHelp">Dica: <b>-palavra</b> exclui · <b>"frase"</b> exata</span></div>'
      +'<div class="bx-groups" id="bxGroups">'+GROUPS.map(g=>'<button type="button" data-group="'+g[0]+'"'+(g[0]==='all'?' class="on"':'')+'>'+g[1]+'</button>').join('')+'</div>'
      +'<div id="bxCards"></div><div id="bxDist"></div>';
    field.after(box);
    box.addEventListener('click',e=>{
      const v=e.target.closest('[data-view]');if(v){st.view=v.dataset.view;st.book=null;st.open=null;st.shown=100;paintTools();run(true);return}
      const o=e.target.closest('[data-opt]');if(o){st[o.dataset.opt]=!st[o.dataset.opt];st.shown=100;paintTools();run(true);return}
      const g=e.target.closest('[data-group]');if(g){st.group=g.dataset.group;st.book=null;st.shown=100;paintTools();run(true);return}
      const bk=e.target.closest('[data-book]');if(bk){st.book=st.book===bk.dataset.book?null:bk.dataset.book;st.shown=100;run(true);return}
      const q=e.target.closest('[data-q]');if(q){$('q').value=q.dataset.q;if(q.dataset.view){st.view=q.dataset.view;paintTools()}run(true);return}
      const go=e.target.closest('[data-go]');if(go){const [b,c,v]=go.dataset.go.split('|');goTo(b,+c,+v||null);return}
      const lem=e.target.closest('[data-lemma]');if(lem){st.view='original';st.open=lem.dataset.lemma;paintTools();$('q').value=lem.dataset.lemma;run(true);return}
      const ent=e.target.closest('[data-entmore]');if(ent){ent.parentElement.classList.toggle('open');return}
    });
    // resultados do "No original" (cartões das palavras)
    $('hits').addEventListener('click',e=>{
      const t=e.target.closest('[data-toggle]');if(t){st.open=st.open===t.dataset.toggle?null:t.dataset.toggle;st.shown=100;run(true);return}
      const b=e.target.closest('button[data-q],button[data-view]');if(b){if(b.dataset.q)$('q').value=b.dataset.q;if(b.dataset.view){st.view=b.dataset.view;paintTools()}run(true)}
    },true);
    // "Carregar mais": nas buscas novas, trata aqui; na hiperliteral, deixa o original
    const more=$('searchLoadMore');if(more)more.addEventListener('click',e=>{if(typeof mode!=='undefined'&&mode==='hyper')return;e.stopImmediatePropagation();st.shown+=100;run(true)},true);
    return true;
  }
  function paintTools(){
    const box=$('bxTools');if(!box)return;
    box.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===st.view));
    box.querySelectorAll('[data-opt]').forEach(b=>b.classList.toggle('on',!!st[b.dataset.opt]));
    box.querySelectorAll('[data-group]').forEach(b=>b.classList.toggle('on',b.dataset.group===st.group));
    $('bxOpts').hidden=st.view!=='texto';$('bxGroups').hidden=st.view==='notas';
    const ch=$('chips');if(ch)ch.hidden=true;
  }

  /* ---------------- versículos: texto em português e navegação ---------------- */
  const ptMode=()=>(typeof mode!=='undefined'&&CORPORA[mode]&&!['wlc','tr','hyper'].includes(mode))?mode:'almeida';
  const idxCache={};
  function bookIdx(m,b){const k=m+'|'+b;if(idxCache[k]!=null)return idxCache[k];const i=CORPORA[m]?CORPORA[m].books.findIndex(x=>x.book===b):-1;return idxCache[k]=i}
  function verseText(m,b,c,v){const cp=CORPORA[m];const bk=cp&&cp.books[bookIdx(m,b)];const ch=bk&&bk.chapters.find(x=>+x.chapter===+c);const vs=ch&&ch.verses.find(x=>+x.number===+v);return vs?vs.text:''}
  function goTo(book,c,v,m){
    try{const md=m||(typeof mode!=='undefined'&&CORPORA[mode]&&mode!=='hyper'?mode:'almeida');
      if(md!==mode){mode=md}
      const bi=bookIdx(md,book);if(bi<0)return;positions[mode]={b:bi,c:+c};focusVerse=v||null;renderReader();openPanel('ler')}catch(e){}
  }

  /* ---------------- consulta ---------------- */
  function parse(raw){
    const q=raw.trim();
    // referência
    const rm=q.match(/^([1-3]?\s*[a-zà-úç]+\.?)\s*(\d{1,3})(?:\s*[:.,\s]\s*(\d{1,3}))?(?:\s*[-–]\s*(\d{1,3}))?$/i);
    let ref=null;
    if(rm){const k=N(rm[1]).replace(/[\s.]/g,'');const b=ALIAS.get(k);if(b)ref={book:b,c:+rm[2],v:rm[3]?+rm[3]:null}}
    const strong=/^[HhGg]\d{1,5}$/.test(q)?q.toUpperCase():null;
    // termos: "frase", -excluir, palavras
    const phrases=[],neg=[],words=[];
    q.replace(/"([^"]+)"/g,(_,p)=>{phrases.push(p);return' '}).replace(/"[^"]*$/,' ').split(/\s+/).forEach(w=>{if(!w)return;if(/^-\S/.test(w))neg.push(w.slice(1));else if(!/^"/.test(w))words.push(w)});
    const cleaned=q.replace(/(^|\s)-\S+/g,' ').replace(/"/g,'').trim();
    return{q,ref,strong,phrases,neg,words:words.filter(w=>!/^"|"$/.test(w)),cleaned};
  }
  function corpusFor(P){
    if(he(P.cleaned))return'wlc';if(gr(P.cleaned))return'tr';
    return ptMode();
  }

  /* ---------------- NO TEXTO ---------------- */
  function searchText(P){
    const m=corpusFor(P),cp=CORPORA[m];if(!cp)return{m,hits:[],occ:0};
    const isWord=c=>/[\p{L}\p{M}]/u.test(c||'');
    const terms=[];const neg=P.neg.map(N).filter(Boolean);
    if(st.allWords){for(const p of P.phrases)terms.push(N(p));for(const w of P.words)terms.push(N(w))}
    else terms.push(N(P.cleaned));
    const tt=terms.filter(Boolean);if(!tt.length)return{m,hits:[],occ:0};
    // português: a palavra (aceitando plural "s"/"es"), não um pedaço dela — "amor" não acha "amorreus", "fé" não acha "oferecer".
    // hebraico e grego: dentro da palavra, porque prefixos (וְ, הַ, בְּ…) e terminações grudam nela.
    const wordMode=!st.parts&&m!=='wlc'&&m!=='tr';
    const endOk=(hay,e)=>{if(!isWord(hay[e]))return 0;if(hay[e]==='s'&&!isWord(hay[e+1]))return 1;if(hay[e]==='e'&&hay[e+1]==='s'&&!isWord(hay[e+2]))return 2;return -1};
    const find=(hay,t)=>{const out=[];let from=0,p;while((p=hay.indexOf(t,from))!==-1){
      if(!wordMode)out.push([p,p+t.length]);
      else if(!isWord(hay[p-1])){const x=endOk(hay,p+t.length);if(x>=0)out.push([p,p+t.length+x])}
      from=p+Math.max(1,t.length)}return out};
    const hits=[];let occ=0;
    for(let bi=0;bi<cp.books.length;bi++){
      const b=cp.books[bi];
      for(const c of b.chapters)for(const v of c.verses){
        const flat=v.text,hay=N(flat);
        let spans=[],ok=true;
        for(const t of tt){const f=find(hay,t);if(!f.length){ok=false;break}spans=spans.concat(f)}
        if(!ok)continue;
        if(neg.length&&neg.some(t=>find(hay,t).length))continue;
        occ+=st.allWords?1:spans.length;
        hits.push({book:b.book,bi,ch:+c.chapter,v:+v.number,flat,hay,spans});
      }
    }
    return{m,hits,occ,allWords:st.allWords};
  }
  // converte posições do texto sem sinais para o texto exibido e marca os trechos
  function markHtml(flat,spans,max=260){
    if(!spans.length)return esc(flat.length>max?flat.slice(0,max)+'…':flat);
    const map=[];let i=0;for(const ch of flat){const n=N(ch);for(let k=0;k<n.length;k++)map.push(i);i+=ch.length}map.push(flat.length);
    const real=spans.map(([a,z])=>{const s=map[a]??0;let e=(map[z-1]??s)+1;while(e<flat.length&&/\p{M}/u.test(flat[e]))e++;return[s,e]}).sort((x,y)=>x[0]-y[0]);
    let start=0,end=flat.length;
    if(flat.length>max){start=Math.max(0,real[0][0]-70);end=Math.min(flat.length,start+max)}
    let out=start>0?'…':'',pos=start;
    for(const [s,e] of real){if(s<pos||s>=end)continue;out+=esc(flat.slice(pos,s))+'<mark>'+esc(flat.slice(s,Math.min(e,end)))+'</mark>';pos=Math.min(e,end)}
    out+=esc(flat.slice(pos,end))+(end<flat.length?'…':'');return out;
  }

  /* ---------------- NO ORIGINAL ---------------- */
  const ORIG={};
  function origReady(){return typeof OSHB_STRONG!=='undefined'&&!OSHB_STRONG.__stub}
  function origIndex(t){
    if(ORIG[t])return ORIG[t];
    const C=t==='nt'?(typeof GREEK_STRONG!=='undefined'?GREEK_STRONG:null):(origReady()?OSHB_STRONG:null);if(!C)return null;
    const occ=new Map(),lex=new Map();
    C.d.forEach((bk,bi)=>bk.forEach((ch,ci)=>ch.forEach((vs,vi)=>{for(const tk of vs){if(!Array.isArray(tk)||tk[3]==null||tk[3]<0)continue;const L=C.l[tk[3]];if(!L)continue;const s=L[1];
      let a=occ.get(s);if(!a){a=[];occ.set(s,a);lex.set(s,L)}const last=a[a.length-1];if(!last||last[0]!==bi||last[1]!==ci||last[2]!==vi)a.push([bi,ci,vi]);a.n=(a.n||0)+1}})));
    return ORIG[t]={C,occ,lex};
  }
  const PT=t=>t==='nt'?(typeof DOXA_STRONG_PT_G!=='undefined'?DOXA_STRONG_PT_G:{}):(typeof DOXA_STRONG_PT_H!=='undefined'?DOXA_STRONG_PT_H:{});
  function lemmasFor(P){
    const out=[];const add=(t,s)=>{const I=origIndex(t);if(!I)return;const a=I.occ.get(s);if(!a)return;if(out.some(x=>x.s===s))return;const L=I.lex.get(s);const e=PT(t)[s];
      out.push({t,s,lemma:L[3],tr:L[4],gloss:(e&&e.m&&e.m.length?e.m.slice(0,4).join(', '):(L[7]||'')),cls:(e&&e.p)||'',n:a.n||a.length,verses:a.length,refs:a})};
    if(P.strong){add(P.strong[0]==='G'?'nt':'ot',P.strong);return out}
    const q=N(P.cleaned);if(!q)return out;
    if(he(P.cleaned)||gr(P.cleaned)){
      const t=he(P.cleaned)?'ot':'nt';const I=origIndex(t);if(!I)return out;
      for(const [s,L] of I.lex){const lm=N(L[3]).replace(/\s/g,'');if(lm===q.replace(/\s/g,''))add(t,s)}
      if(!out.length)for(const [s,L] of I.lex){if(N(L[3]).replace(/\s/g,'').startsWith(q.replace(/\s/g,'')))add(t,s)}
      return out.sort((a,b)=>b.n-a.n).slice(0,12);
    }
    // português: palavras do original cujo significado inclui o termo como palavra inteira
    const re=new RegExp('(^|[^a-z0-9])'+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(s|es)?($|[^a-z0-9])');
    for(const t of ['ot','nt']){const pt=PT(t);for(const s in pt){const e=pt[s];if(!e||!e.m)continue;if(e.m.some(g=>re.test(N(g))))add(t,s)}}
    return out.sort((a,b)=>b.n-a.n).slice(0,16);
  }
  // outras formas para sugerir (substantivo ↔ verbo)
  function variants(w){const q=N(w);const v=new Set();
    const rules=[[/or$/,'ar'],[/ar$/,'or'],[/cao$/,'ar'],[/mento$/,'ar'],[/ura$/,'ar'],[/ade$/,'o'],[/eza$/,'o'],[/o$/,'ar'],[/er$/,'imento']];
    for(const [re,rep] of rules)if(re.test(q))v.add(q.replace(re,rep));v.delete(q);return[...v].slice(0,3)}

  /* ---------------- SUAS NOTAS ---------------- */
  function searchNotes(P){
    const q=N(P.cleaned);if(!q)return[];
    const out=[];
    try{const d=JSON.parse(localStorage.getItem('doxa:notas:v1')||'{}');for(const n of d.items||[]){const txt=String(n.text||'');if(N(txt).includes(q)||N(n.label||'').includes(q))out.push({kind:'nota',label:n.label||(bname(n.book)+' '+n.chapter+':'+n.verse),text:txt,book:n.book,c:n.chapter,v:n.verse,t:n.updatedAt||n.createdAt||0})}}catch(e){}
    try{const d=JSON.parse(localStorage.getItem('doxa:highlights:v1')||'{}');for(const h of d.items||[]){const txt=[h.excerpt,h.note].filter(Boolean).join(' — ');if(!N(txt).includes(q)&&!N(h.ref||'').includes(q))continue;
      const k=String(h.key||'').split(':');out.push({kind:'grifo',label:h.ref||'',text:txt,book:k[1],c:+k[2]||null,v:h.verse||null,color:h.color,t:h.createdAt||0})}}catch(e){}
    return out.sort((a,b)=>(b.t||0)-(a.t||0));
  }

  /* ---------------- cartões inteligentes ---------------- */
  function cards(P){
    const out=[];
    if(P.ref){const m=ptMode(),t=P.ref.v?verseText(m,P.ref.book,P.ref.c,P.ref.v):'';const label=bname(P.ref.book)+' '+P.ref.c+(P.ref.v?':'+P.ref.v:'');
      if(bookIdx(m,P.ref.book)>=0)out.push('<button type="button" class="bx-card ref" data-go="'+P.ref.book+'|'+P.ref.c+'|'+(P.ref.v||'')+'"><small>IR PARA</small><b>'+esc(label)+'</b>'+(t?'<span>'+esc(t.slice(0,160))+(t.length>160?'…':'')+'</span>':'')+'</button>')}
    if(P.strong)out.push('<button type="button" class="bx-card" data-lemma="'+P.strong+'" data-view="original"><small>PALAVRA DO ORIGINAL</small><b>'+P.strong+'</b><span>Ver todas as ocorrências no original</span></button>');
    // dicionário (Pessoas e Lugares)
    if(typeof DOXA_ENTIDADES_PT!=='undefined'&&P.cleaned.length>=3&&!P.ref){
      const q=N(P.cleaned);const found=[];
      for(const k in DOXA_ENTIDADES_PT){const e=DOXA_ENTIDADES_PT[k];if(!e)continue;if(N(e.nome)===q)found.push(e);if(found.length>=3)break}
      for(const e of found){const tx=String(e.texto||'');out.push('<div class="bx-card ent"><small>DICIONÁRIO BÍBLICO</small><b>'+esc(e.nome)+'</b>'+(e.tambem?'<em>Também: '+esc(e.tambem.split(',').slice(0,5).join(', '))+'</em>':'')
        +'<p>'+esc(tx)+'</p>'+(tx.length>260?'<button type="button" class="bx-more" data-entmore="1">ler mais</button>':'')+'</div>')}
    }
    return out.join('');
  }

  /* ---------------- distribuição por livro ---------------- */
  function distHtml(byBook,total,label){
    const rows=Object.entries(byBook).sort((a,b)=>b[1]-a[1]);if(rows.length<2)return'';
    const max=rows[0][1];const top=rows.slice(0,8);
    return'<div class="bx-dist"><div class="bx-dist-h"><b>Onde '+esc(label)+' se concentra</b><span>'+rows.length+' livros</span></div>'
      +top.map(([b,n])=>'<button type="button" class="bx-bar'+(st.book===b?' on':'')+'" data-book="'+b+'"><span>'+esc(ABBR[b]||b)+'</span><i style="width:'+Math.max(4,Math.round(n/max*100))+'%"></i><b>'+n+'</b></button>').join('')
      +(rows.length>8?'<p class="bx-dist-more">e mais '+(rows.length-8)+' livros · toque numa barra para filtrar</p>':'<p class="bx-dist-more">toque numa barra para filtrar</p>')+'</div>';
  }

  /* ---------------- execução ---------------- */
  const inGroup=b=>GROUP[st.group].has(b)&&(!st.book||st.book===b);
  function run(force){
    if(!ensureUI())return;paintTools();
    const raw=$('q').value,count=$('count'),list=$('hits'),more=$('searchLoadMore');
    $('bxCards').innerHTML='';$('bxDist').innerHTML='';
    if(!raw.trim()){
      count.textContent='';if(more)more.hidden=true;
      list.innerHTML='<li class="bx-empty"><div class="empty">Busque uma palavra, uma frase ou uma referência.<div class="bx-ex">'
        +[['amor','original'],['jo 3 16',''],['"no princípio"',''],['graça fé -lei',''],['H2617','original'],['חֶסֶד','original'],['ἀγάπη','original'],['Abraão','']]
          .map(([q,v])=>'<button type="button" data-q="'+esc(q)+'"'+(v?' data-view="'+v+'"':'')+'>'+esc(q)+'</button>').join('')+'</div></div></li>';
      return;
    }
    const P=parse(raw);
    $('bxCards').innerHTML=cards(P);
    if(st.view==='notas')return renderNotes(P);
    if(st.view==='original')return renderOriginal(P);
    return renderText(P);
  }
  function renderText(P){
    const sig='t|'+(typeof mode!=='undefined'?mode:'')+'|'+P.q+'|'+st.parts+'|'+st.allWords;
    if(last.sig!==sig){last.sig=sig;last.res=searchText(P)}
    const R=last.res,count=$('count'),list=$('hits'),more=$('searchLoadMore');
    const byBook={};for(const h of R.hits)if(GROUP[st.group].has(h.book))byBook[h.book]=(byBook[h.book]||0)+1;
    const hits=R.hits.filter(h=>inGroup(h.book));
    const verLabel=(typeof VERSION_META!=='undefined'&&VERSION_META[R.m]&&VERSION_META[R.m].short)||R.m;
    if(!R.hits.length){
      count.textContent='Nenhuma ocorrência de “'+P.cleaned+'” em '+verLabel+'.';
      const sug=!P.ref&&!P.strong&&!he(P.cleaned)&&!gr(P.cleaned)?'<li class="bx-empty"><div class="empty">Tente <button type="button" class="bx-link" data-view="original">buscar no original</button>'+(!st.parts?' ou ligar “Partes de palavras”':'')+'.</div></li>':'';
      list.innerHTML=sug;
      if(more)more.hidden=true;return;
    }
    const verses=hits.length;
    count.innerHTML=(R.allWords?'':'<b>'+R.occ+'</b> '+(R.occ===1?'ocorrência':'ocorrências')+' em ')+'<b>'+R.hits.length+'</b> '+(R.hits.length===1?'versículo':'versículos')+' · '+esc(verLabel)
      +(st.group!=='all'||st.book?' · <span class="bx-filt">'+verses+' no filtro'+(st.book?' ('+esc(bname(st.book))+')':'')+'</span>':'');
    $('bxDist').innerHTML=distHtml(byBook,R.hits.length,'“'+P.cleaned+'”');
    const shown=hits.slice(0,st.shown);
    const m=R.m,cp=CORPORA[m];
    list.innerHTML=shown.map((h,i)=>'<li data-hit="'+i+'"><div class="h-ref">'+esc(bname(h.book)+' '+h.ch+':'+h.v)+'</div><div class="h-txt'+(m==='wlc'?' bx-he':'')+'">'+markHtml(h.flat,h.spans)+'</div></li>').join('');
    list._hits=shown.map(h=>({kind:m,bi:h.bi,ch:h.ch,v:h.v}));
    if(more){more.hidden=st.shown>=hits.length;more.textContent='Carregar mais '+Math.min(100,hits.length-st.shown);0}
  }
  function renderOriginal(P){
    const count=$('count'),list=$('hits'),more=$('searchLoadMore');if(more)more.hidden=true;
    const needOT=!gr(P.cleaned)&&!(P.strong&&P.strong[0]==='G');
    if(needOT&&!origReady()){
      count.textContent='Preparando o hebraico…';list.innerHTML='';
      try{window.DoxaLoadOshb&&window.DoxaLoadOshb(()=>run(true))}catch(e){}
      if(!window.DoxaLoadOshb)setTimeout(()=>run(true),1500);
      if(typeof GREEK_STRONG==='undefined')return;
    }
    const L=lemmasFor(P);
    if(!L.length){
      count.textContent='Nenhuma palavra do original com o significado “'+P.cleaned+'”.';
      const vs=variants(P.cleaned);
      list.innerHTML='<li class="bx-empty"><div class="empty">'+(vs.length?'Tente também: '+vs.map(v=>'<button type="button" class="bx-link" data-q="'+esc(v)+'">'+esc(v)+'</button>').join(' '):'Tente outra palavra, um número Strong (H… ou G…) ou a palavra em hebraico/grego.')+'</div></li>';
      return;
    }
    const otN=L.filter(x=>x.t==='ot').reduce((a,x)=>a+x.n,0),ntN=L.filter(x=>x.t==='nt').reduce((a,x)=>a+x.n,0);
    count.innerHTML='<b>'+L.length+'</b> '+(L.length===1?'palavra':'palavras')+' do original'+(otN?' · hebraico: <b>'+otN+'</b>':'')+(ntN?' · grego: <b>'+ntN+'</b>':'')+' ocorrências';
    const vs=variants(P.cleaned);
    if(vs.length&&!P.strong&&!he(P.cleaned)&&!gr(P.cleaned))$('bxCards').insertAdjacentHTML('beforeend','<div class="bx-also">Também: '+vs.map(v=>'<button type="button" data-q="'+esc(v)+'">'+esc(v)+'</button>').join('')+'</div>');
    const m=ptMode(),parts=[],hitsArr=[];
    for(const x of L){
      const I=origIndex(x.t),C=I.C;const open=st.open===x.s||L.length===1;
      // referências na numeração das traduções
      const refs=x.refs.map(([bi,ci,vi])=>{const book=C.b[bi];let c=ci+1,v=vi+1;if(x.t==='ot'&&window.DoxaVersif){const r=window.DoxaVersif.toPt(book,c,v);if(!r)return null;c=r.chapter;v=r.verse}return{book,c,v}}).filter(Boolean);
      const byBook={};for(const r of refs)if(GROUP[st.group].has(r.book))byBook[r.book]=(byBook[r.book]||0)+1;
      const inF=refs.filter(r=>inGroup(r.book));
      const topB=Object.entries(byBook).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([b,n])=>(ABBR[b]||b)+' '+n).join(' · ');
      parts.push('<li class="bx-lemma'+(open?' open':'')+'"><button type="button" class="bx-lemma-h" data-toggle="'+x.s+'"><b class="'+(x.t==='ot'?'bx-he':'bx-gr')+'">'+esc(x.lemma)+'</b>'
        +'<span class="bx-lemma-m"><i>'+esc(x.tr||'')+'</i> · '+esc(x.gloss)+'</span><span class="bx-lemma-n"><b>'+x.n+'×</b>'+x.s+(topB?' · mais em '+esc(topB):'')+'</span></button></li>');
      if(open){
        if(L.length>1||true)$('bxDist').innerHTML=distHtml(byBook,inF.length,x.lemma);
        const pg=inF.slice(0,st.shown);
        const gl=(PT(x.t)[x.s]&&PT(x.t)[x.s].m||[]).map(N).filter(g=>g.length>=3);
        parts.push(pg.map(r=>{const t=verseText(m,r.book,r.c,r.v);let spans=[];const hay=N(t);for(const g of gl){let f=0,p;while((p=hay.indexOf(g,f))!==-1){spans.push([p,p+g.length]);f=p+g.length}}
          const i=hitsArr.length;hitsArr.push({kind:m,bi:bookIdx(m,r.book),ch:r.c,v:r.v});
          return'<li data-hit="'+i+'" class="bx-sub"><div class="h-ref">'+esc(bname(r.book)+' '+r.c+':'+r.v)+'</div><div class="h-txt">'+markHtml(t,spans)+'</div></li>'}).join(''));
        if(inF.length>st.shown&&more){more.hidden=false;more.textContent='Carregar mais '+Math.min(100,inF.length-st.shown);0}
      }
    }
    list.innerHTML=parts.join('');list._hits=hitsArr;
  }
  function renderNotes(P){
    const count=$('count'),list=$('hits'),more=$('searchLoadMore');if(more)more.hidden=true;
    const R=searchNotes(P);
    count.textContent=R.length?R.length+(R.length===1?' resultado':' resultados')+' nas suas notas e grifos':'Nada encontrado nas suas notas e grifos.';
    const q=N(P.cleaned);
    list.innerHTML=R.slice(0,200).map((r,i)=>{const hay=N(r.text);const spans=[];let f=0,p;while(q&&(p=hay.indexOf(q,f))!==-1){spans.push([p,p+q.length]);f=p+q.length}
      return'<li data-hit="'+i+'"><div class="h-ref">'+(r.kind==='grifo'?'<span class="bx-dot" data-c="'+esc(r.color||'yellow')+'"></span>Grifo · ':'Nota · ')+esc(r.label)+'</div><div class="h-txt">'+markHtml(r.text,spans)+'</div></li>'}).join('');
    const m=ptMode();
    list._hits=R.slice(0,200).map(r=>({kind:m,bi:bookIdx(m,r.book),ch:r.c,v:r.v}));
  }

  /* ---------------- encaixe na busca existente ---------------- */
  const original=window.renderSearch;
  window.renderSearch=function(){
    if(typeof mode!=='undefined'&&mode==='hyper'){const b=$('bxTools');if(b)b.hidden=true;const ch=$('chips');if(ch)ch.hidden=false;return original&&original()}
    const b=$('bxTools');if(b)b.hidden=false;
    return run();
  };
  // o resultado "No original" com 1 só palavra já abre; trocar de versão refaz
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='versionSelect'){last.sig='';}},true);
  if($('p-buscar')?.classList.contains('on'))window.renderSearch();
  window.DoxaBusca={run:()=>window.renderSearch(),parse,lemmasFor,searchText};
})();
