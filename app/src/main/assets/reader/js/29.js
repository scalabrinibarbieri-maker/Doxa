(()=>{
  'use strict';
  /* Doxa 37 · Strong no grego (Textus Receptus)
     O hebraico já é tokenizado no próprio corpus. O grego do app é texto corrido, então aqui
     casamos palavra a palavra o texto exibido com o pacote GREEK_STRONG e reaproveitamos a
     MESMA ficha de Strong do hebraico (oshbVerse / lexicalFromToken / renderStrongLex).

     O casamento é por alinhamento, não por posição: o texto do app é Stephanus 1550 sem
     acentos e o pacote é acentuado, com ν final móvel diferente em ~2.200 palavras, e 63
     versículos do app trazem variantes duplicadas ("ναζαρετ ναζαρεθ"). Alinhando, nada disso
     desloca as palavras seguintes. */
  if(window.__doxa37GreekStrongInstalled)return;
  window.__doxa37GreekStrongInstalled=true;
  if(typeof GREEK_STRONG==='undefined'||!GREEK_STRONG?.d)return;   // pacote grego não instalado

  const G=GREEK_STRONG;
  const BOOK={};G.b.forEach((b,i)=>BOOK[b]=i);
  const cache=new Map();

  /* ---------- normalização e alinhamento ---------- */
  const base=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').normalize('NFC')
    .toLowerCase().replace(/ς/g,'σ').replace(/[^\u0370-\u03ff]/g,'');
  /* diferença de no máximo uma letra (troca, sobra ou falta) */
  function editaUm(a,b){
    if(Math.abs(a.length-b.length)>1)return false;
    let i=0,j=0,erros=0;
    while(i<a.length&&j<b.length){
      if(a[i]===b[j]){i++;j++;continue}
      if(++erros>1)return false;
      if(a.length===b.length){i++;j++}
      else if(a.length>b.length)i++;else j++;
    }
    return erros+(a.length-i)+(b.length-j)<=1;
  }
  function near(a,b){
    if(!a||!b)return 0;
    if(a===b)return 1;
    if(a===b+'ν'||b===a+'ν')return .96;              // ν final móvel (Stephanus × Scrivener)
    if(a.length>=5&&b.length>=5&&editaUm(a,b))return .88;   // grafias variantes: ναζαρετ / ναζαρεθ
    if(a.startsWith(b)||b.startsWith(a)){
      const min=Math.min(a.length,b.length),max=Math.max(a.length,b.length);
      return min/max>=.6?.75*min/max:0;
    }
    return 0;
  }
  /* Needleman-Wunsch simples: devolve, para cada palavra exibida, o índice do token do pacote. */
  function align(shown,pack){
    const n=shown.length,m=pack.length,GAP=-.6;
    const F=[],P=[];                                   // P guarda o caminho: sem comparar floats de novo
    for(let i=0;i<=n;i++){F.push(new Float64Array(m+1));P.push(new Int8Array(m+1))}
    for(let i=1;i<=n;i++){F[i][0]=F[i-1][0]+GAP;P[i][0]=1}
    for(let j=1;j<=m;j++){F[0][j]=F[0][j-1]+GAP;P[0][j]=2}
    for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){
      const diag=F[i-1][j-1]+(near(shown[i-1],pack[j-1])*2-.5),up=F[i-1][j]+GAP,left=F[i][j-1]+GAP;
      if(diag>=up&&diag>=left){F[i][j]=diag;P[i][j]=0}
      else if(up>=left){F[i][j]=up;P[i][j]=1}
      else{F[i][j]=left;P[i][j]=2}
    }
    const out=new Array(n).fill(-1);let i=n,j=m;
    while(i>0&&j>0){
      const step=P[i][j];
      if(step===0){if(near(shown[i-1],pack[j-1])>0)out[i-1]=j-1;i--;j--}
      else if(step===1)i--;
      else j--;
    }
    /* Costura: o pacote traz algumas formas truncadas ("δι" no lugar de "διώξωσιν").
       Se a palavra ficou sem par mas os vizinhos casaram e sobrou exatamente um token
       do pacote no meio, o vínculo é esse. */
    const usados=new Set(out.filter(x=>x>=0));
    for(let k=0;k<n;k++){
      if(out[k]>=0)continue;
      let ant=-1;for(let q=k-1;q>=0;q--)if(out[q]>=0){ant=out[q];break}
      let dep=m;for(let q=k+1;q<n;q++)if(out[q]>=0){dep=out[q];break}
      const livres=[];
      for(let j=ant+1;j<dep;j++)if(!usados.has(j))livres.push(j);
      if(livres.length===1){out[k]=livres[0];usados.add(livres[0])}
    }
    return out;
  }

  /* ---------- tokens de um versículo ---------- */
  function packTokens(book,chapter,verse){
    const bi=BOOK[book];if(bi==null)return null;
    const raw=G.d[bi]?.[chapter-1]?.[verse-1];if(!raw)return null;
    const key=book+'.'+chapter+'.'+verse;
    let hit=cache.get(key);
    if(!hit){
      hit={items:raw.map(t=>Array.isArray(t)?[t[0],t[1],t[2],t[3],null,'G']:t)};
      hit.wordIdx=[];hit.items.forEach((t,i)=>{if(Array.isArray(t))hit.wordIdx.push(i)});
      hit.words=hit.wordIdx.map(i=>base(hit.items[i][0]));
      cache.set(key,hit);
    }
    return hit;
  }

  /* ---------- as funções globais passam a entender o grego ---------- */
  const origVerse=window.oshbVerse;
  if(typeof origVerse==='function'&&!origVerse.__doxa37){
    const w=function(book,chapter,verse){
      const r=origVerse.apply(this,arguments);
      if(r)return r;
      return packTokens(book,Number(chapter),Number(verse))?.items||null;
    };w.__doxa37=true;window.oshbVerse=w;
  }
  const origLex=window.lexicalFromToken;
  if(typeof origLex==='function'&&!origLex.__doxa37){
    const w=function(tok){
      if(tok&&tok[5]==='G')return tok[3]>=0?(G.l[tok[3]]||null):null;
      return origLex.apply(this,arguments);
    };w.__doxa37=true;window.lexicalFromToken=w;
  }
  /* Morfologia Robinson em português (o decodificador original é do hebraico). */
  const ROB={
    N:'substantivo',A:'adjetivo',T:'artigo',V:'verbo',P:'preposição',ADV:'advérbio',CONJ:'conjunção',
    PRT:'partícula',INJ:'interjeição',COND:'conjunção condicional',PREP:'preposição',
    'ADV-S':'advérbio superlativo','ADV-C':'advérbio comparativo','PRT-N':'partícula de negação',
    'PRT-I':'partícula interrogativa','HEB':'palavra hebraica','ARAM':'palavra aramaica',
    'N-PRI':'nome próprio','A-NUI':'numeral','N-LI':'letra','N-OI':'substantivo indeclinável'
  };
  const CASO={N:'nominativo',G:'genitivo',D:'dativo',A:'acusativo',V:'vocativo'};
  const NUM={S:'singular',P:'plural'};
  const GEN={M:'masculino',F:'feminino',N:'neutro'};
  const TEMPO={P:'presente',I:'imperfeito',F:'futuro',A:'aoristo',R:'perfeito',L:'mais-que-perfeito',X:'sem tempo',2:'segundo'};
  const VOZ={A:'ativa',M:'média',P:'passiva',E:'média ou passiva',D:'depoente',O:'média depoente',N:'passiva depoente'};
  const MODO={I:'indicativo',S:'subjuntivo',O:'optativo',M:'imperativo',N:'infinitivo',P:'particípio',R:'imperativo'};
  const PRON={P:'pessoal',R:'relativo',D:'demonstrativo',I:'interrogativo',X:'indefinido',K:'correlativo',S:'possessivo',F:'reflexivo',Q:'correlativo ou interrogativo'};
  function greekMorph(code){
    const c=String(code||'').trim();if(!c)return '—';
    if(ROB[c])return ROB[c];
    const parts=c.split('-');
    const head=parts[0];
    // verbo: V-TVM-PN  (ex.: V-PAI-3S)
    if(head==='V'){
      const tvm=parts[1]||'',pn=parts[2]||'';
      const out=[];
      const t=tvm.replace(/^2/,''),segundo=/^2/.test(tvm);
      if(MODO[t[2]])out.push(MODO[t[2]]);
      if(TEMPO[t[0]])out.push((segundo?'segundo ':'')+TEMPO[t[0]]);
      if(VOZ[t[1]])out.push('voz '+VOZ[t[1]]);
      if(pn){const p=pn[0],n=pn[1];if('123'.includes(p))out.push(p+'ª pessoa');if(NUM[n])out.push(NUM[n]);
        if(CASO[pn[0]])out.push(CASO[pn[0]]);if(GEN[pn[1]])out.push(GEN[pn[1]]);if(NUM[pn[2]])out.push(NUM[pn[2]])}
      return out.length?'verbo, '+out.join(', '):'verbo';
    }
    const nome={N:'substantivo',A:'adjetivo',T:'artigo',R:'pronome',D:'pronome demonstrativo',P:'pronome pessoal',S:'pronome possessivo',F:'pronome reflexivo',K:'pronome correlativo',I:'pronome interrogativo',X:'pronome indefinido',Q:'pronome',C:'pronome recíproco',O:'pronome'}[head];
    if(nome){
      const m=parts[1]||'',out=[];
      if(CASO[m[0]])out.push(CASO[m[0]]);
      if(NUM[m[1]])out.push(NUM[m[1]]);
      if(GEN[m[2]])out.push(GEN[m[2]]);
      if(PRON[head]&&head!=='N'&&head!=='A'&&head!=='T')out.unshift(nome);
      return (out.length?(nome+', '+out.join(', ')):nome);
    }
    return ROB[head]||c;
  }
  const origMorph=window.decodeMorph;
  if(typeof origMorph==='function'&&!origMorph.__doxa37){
    const w=function(full){
      const s=String(full||'');
      if(/^(V|N|A|T|P|R|D|S|F|K|I|X|Q|C|O)-[A-Z0-9]|^(ADV|CONJ|PRT|INJ|COND|PREP)/.test(s)&&!s.includes('/'))return greekMorph(s);
      return origMorph.apply(this,arguments);
    };w.__doxa37=true;window.decodeMorph=w;
  }
  /* Camada em português: G#### vem do DOXA_STRONG_PT_G; sem entrada, cai na glosa em inglês. */
  const origPt=window.doxaStrongPtEntry;
  if(typeof origPt==='function'&&!origPt.__doxa37){
    const w=function(lex){
      if(lex&&String(lex[1]||'').startsWith('G')){
        const e=(typeof DOXA_STRONG_PT_G!=='undefined'?DOXA_STRONG_PT_G[lex[1]]:null)||{};
        const m=[...(e.m||[])];
        if(!m.length&&lex[7]){const g=(typeof doxaPtEnLex==='function')?doxaPtEnLex(lex[7]):'';m.push(g&&g!==lex[7]?g:lex[7]+' (glosa em inglês)')}
        return{m:[...new Set(m)].slice(0,4),p:e.p||''};
      }
      return origPt.apply(this,arguments);
    };w.__doxa37=true;window.doxaStrongPtEntry=w;
  }

  /* A ficha (renderStrongLex) lê os índices em OSHB_STRONG.la/.m. Para um token grego,
     esses índices são do pacote grego: trocamos as tabelas durante a montagem e devolvemos
     em seguida. Assim a ficha inteira é reaproveitada sem duplicar código. */
  const origSheet=window.renderStrongLex;
  if(typeof origSheet==='function'&&!origSheet.__doxa37){
    const w=function(){
      const grego=(typeof strongCurrent!=='undefined')&&strongCurrent?.tok?.[5]==='G';
      if(!grego)return origSheet.apply(this,arguments);
      const la=OSHB_STRONG.la,m=OSHB_STRONG.m;
      OSHB_STRONG.la=G.la;OSHB_STRONG.m=G.m;
      let r;
      try{r=origSheet.apply(this,arguments)}finally{OSHB_STRONG.la=la;OSHB_STRONG.m=m}
      try{
        document.querySelectorAll('#strongSheet .strong-badge').forEach(b=>{
          if(/^OSHB\s/.test(b.textContent))b.textContent='Robinson '+b.textContent.replace(/^OSHB\s/,'');
        });
      }catch(e){}
      return r;
    };w.__doxa37=true;window.renderStrongLex=w;
  }

  /* ---------- deixar as palavras gregas clicáveis ---------- */
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function decorate(){
    if(typeof mode==='undefined'||mode!=='tr')return;
    const host=document.getElementById('textBody');if(!host)return;
    let book,chapter;
    try{const p=pos(),b=CORPORA.tr.books[p.b];book=b.book;chapter=Number(p.c)}catch(e){return}
    if(BOOK[book]==null)return;
    host.querySelectorAll('.verse').forEach(vEl=>{
      if(vEl.querySelector('.oshb-word'))return;
      const verse=Number(vEl.dataset.v||String(vEl.id||'').replace(/^v/,''));
      const pack=packTokens(book,chapter,verse);if(!pack)return;
      const sup=vEl.querySelector('.vnum');
      const raw=[...vEl.childNodes].filter(n=>n!==sup).map(n=>n.textContent).join('');
      const shown=raw.split(/\s+/).filter(Boolean);
      if(!shown.length)return;
      const map=align(shown.map(base),pack.words);
      let html=sup?sup.outerHTML:'';
      shown.forEach((word,i)=>{
        const j=map[i];
        if(i)html+=' ';
        if(j>=0)html+='<span class="oshb-word greek" tabindex="0" role="button" data-b="'+esc(book)+'" data-c="'+chapter+'" data-v="'+verse+'" data-ti="'+pack.wordIdx[j]+'">'+esc(word)+'</span>';
        else html+=esc(word);
      });
      vEl.innerHTML=html;
    });
  }
  const origRender=window.renderReader;
  if(typeof origRender==='function'&&!origRender.__doxa37){
    const w=function(){const r=origRender.apply(this,arguments);try{decorate()}catch(e){}return r};
    w.__doxa37=true;window.renderReader=w;
  }

  const style=document.createElement('style');
  style.id='doxa37-greek-style';
  style.textContent='.oshb-word.greek{font-family:inherit;font-size:inherit;letter-spacing:0}'
    +'.oshb-word.greek:active{background:color-mix(in srgb,var(--d30-gold,#d9a25e) 18%,transparent)}';
  document.head.appendChild(style);

  function init(){try{decorate()}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.DoxaGreekStrong={decorate,morph:greekMorph,tokens:packTokens};
})();
