(()=>{
  'use strict';
  /* Doxa 39 · Guia Exegético dentro da leitura
     Em vez de abrir uma tela cheia, o guia nasce logo abaixo do versículo selecionado e rola
     junto com o texto. Tocando num cartão, a palavra correspondente acende no próprio
     versículo, para a pessoa ver na hora de quem se trata.

     O vínculo entre a palavra original e a palavra em português é feito por semelhança entre
     o sentido do verbete e as palavras do versículo (radical de 4 letras). Quando não há
     correspondência clara — partículas, preposições, ordem diferente — o cartão avisa em vez
     de acender a palavra errada. */
  if(window.__doxa39InlineGuideInstalled)return;
  window.__doxa39InlineGuideInstalled=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const STOP=new Set(['de','do','da','a','o','e','em','com','para','que','se','ao','as','os','um','uma','por','ser','estar','sobre','como','não','mais','seu','sua','the','to','of']);
  const sem=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
  const raiz=w=>sem(w).slice(0,4);

  /* ---------- dados do versículo ---------- */
  function linhas(ref){
    const out=[];
    try{
      const items=oshbVerse(ref.book,ref.chapter,ref.verse)||[];
      const grego=typeof GREEK_STRONG!=='undefined'&&GREEK_STRONG.b.includes(ref.book);
      for(const tok of items){
        if(!Array.isArray(tok))continue;
        const lex=lexicalFromToken(tok);
        const tabela=(grego&&tok[5]==='G')?GREEK_STRONG:OSHB_STRONG;
        const pt=doxaStrongPtEntry(lex)||{m:[],p:''};
        out.push({
          original:tok[0],grego:tok[5]==='G',
          translit:lex?.[4]||'',lemma:lex?.[3]||'',
          strong:lex?.[1]||'—',
          gloss:pt.m.length?pt.m.slice(0,3).join(' · '):'',
          morph:decodeMorph(tabela.m[tok[2]]||''),
          english:lex?.[7]||lex?.[9]||''
        });
      }
    }catch(e){}
    return out;
  }

  /* ---------- palavras em português do versículo ---------- */
  function tokensDoVersiculo(vEl){
    let toks=[...vEl.querySelectorAll('.hl-word,.ex-tok')];
    if(toks.length)return toks;
    const sup=vEl.querySelector('.vnum');
    const walker=document.createTreeWalker(vEl,NodeFilter.SHOW_TEXT,{acceptNode(n){
      const p=n.parentElement;
      if(!p||p===sup||p.closest('sup,.doxa-ex-panel,.doxa-note-mark'))return NodeFilter.FILTER_REJECT;
      return /[A-Za-zÀ-ÿ]/.test(n.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const alvos=[];while(walker.nextNode())alvos.push(walker.currentNode);
    for(const n of alvos){
      const partes=n.nodeValue.split(/([A-Za-zÀ-ÿ]+(?:[’'-][A-Za-zÀ-ÿ]+)*)/);
      if(partes.length<2)continue;
      const frag=document.createDocumentFragment();
      partes.forEach((p,i)=>{
        if(!p)return;
        if(i%2===1){const s=document.createElement('span');s.className='ex-tok';s.textContent=p;frag.appendChild(s)}
        else frag.appendChild(document.createTextNode(p));
      });
      n.parentNode.replaceChild(frag,n);
    }
    return [...vEl.querySelectorAll('.ex-tok')];
  }
  /* casa o sentido do verbete com as palavras do versículo */
  function casar(linha,toks,usados){
    const alvos=(linha.gloss||'').split(/[·,;]/).map(x=>x.trim()).filter(Boolean)
      .flatMap(x=>x.split(/\s+/)).filter(x=>x.length>2&&!STOP.has(sem(x)));
    let melhor=null,nota=0;
    toks.forEach((t,i)=>{
      const p=sem(t.textContent);if(p.length<3||STOP.has(p))return;
      for(const alvo of alvos){
        const a=sem(alvo);if(a.length<3)continue;
        let n=0;
        if(p===a)n=1;
        else if(raiz(p)&&raiz(p)===raiz(a))n=.8;
        else if(p.startsWith(a.slice(0,5))||a.startsWith(p.slice(0,5)))n=.6;
        if(n>nota||(n===nota&&melhor!=null&&usados.has(melhor)&&!usados.has(i))){nota=n;melhor=i}
      }
    });
    return nota>=.6?melhor:null;
  }

  /* ---------- painel ---------- */
  function fechar(){document.querySelectorAll('.doxa-ex-panel').forEach(p=>p.remove());
    document.querySelectorAll('.ex-tok.on').forEach(t=>t.classList.remove('on'))}

  function abrir(ref,vEl){
    fechar();
    const dados=linhas(ref);
    const painel=document.createElement('div');
    painel.className='doxa-ex-panel';painel.dataset.ref=ref.book+'.'+ref.chapter+'.'+ref.verse;
    const cabecalho='<div class="dxp-head"><span class="dxp-icon"><svg viewBox="0 0 24 24"><path d="M4 7.5c2-.7 3.9-.7 6 0v12c-2.1-.7-4-.7-6 0z"/><path d="M20 7.5c-2-.7-3.9-.7-6 0v12c2.1-.7 4-.7 6 0z"/><path d="M10 7.5c.7-.5 1.3-.5 2-.5s1.3 0 2 .5v12c-.7-.5-1.3-.5-2-.5s-1.3 0-2 .5z"/></svg></span>'
      +'<div class="dxp-title"><strong>Guia Exegético — '+esc(ref.label||'')+'</strong><small>'+(dados.length?dados.length+' palavras no original':'sem original para esta passagem')+'</small></div>'
      +'<button type="button" class="dxp-close" aria-label="Fechar guia">×</button></div>';
    const cartoes=dados.length?dados.map((d,i)=>
      '<div class="dxp-card" tabindex="0" role="button" data-i="'+i+'">'
      +'<div class="dxp-card-main"><span class="dxp-word'+(d.grego?' greek':' hebrew')+'">'+esc(d.original)+'</span>'
      +(d.translit?'<span class="dxp-translit">'+esc(d.translit)+'</span>':'')
      +'<span class="dxp-strong">'+esc(d.strong)+'</span></div>'
      +(d.gloss?'<div class="dxp-gloss">'+esc(d.gloss)+'</div>':'<div class="dxp-gloss dxp-sem">sentido dependente do contexto</div>')
      +'<div class="dxp-foot">'+(d.lemma?'<span class="dxp-lemma'+(d.grego?' greek':' hebrew')+'">'+esc(d.lemma)+'</span>':'')
      +(d.morph&&d.morph!=='—'?'<span>'+esc(d.morph)+'</span>':'')+'</div>'
      +(d.english?'<div class="dxp-en"><span>Verbete original</span><p>'+esc(d.english)+'</p></div>':'')
      +'</div>').join('')
      :'<div class="dxp-vazio">O guia mostra o original quando a passagem existe no hebraico (WLC) ou no grego (Textus Receptus).</div>';
    painel.innerHTML=cabecalho+'<div class="dxp-cards">'+cartoes+'</div>';
    vEl.after(painel);
    requestAnimationFrame(()=>painel.classList.add('on'));

    const toks=tokensDoVersiculo(vEl);
    const usados=new Set();
    const mapa=dados.map(d=>{const i=casar(d,toks,usados);if(i!=null)usados.add(i);return i});

    painel.querySelector('.dxp-close').onclick=fechar;
    const acender=(card)=>{
      const i=Number(card.dataset.i),alvo=mapa[i];
      painel.querySelectorAll('.dxp-card.on').forEach(c=>{if(c!==card)c.classList.remove('on')});
      card.classList.toggle('on');
      toks.forEach(t=>t.classList.remove('on'));
      if(!card.classList.contains('on'))return;
      if(alvo==null){card.classList.add('dxp-sem-alvo');setTimeout(()=>card.classList.remove('dxp-sem-alvo'),1200);return}
      const el=toks[alvo];el.classList.add('on');
      const r=el.getBoundingClientRect();
      try{if(r.top<80||r.bottom>window.innerHeight*.55)el.scrollIntoView?.({block:'center',behavior:'smooth'})}catch(_){}
    };
    painel.addEventListener('click',e=>{const c=e.target.closest('.dxp-card');if(c)acender(c)});
    painel.addEventListener('keydown',e=>{const c=e.target.closest?.('.dxp-card');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();acender(c)}});
    setTimeout(()=>{try{const r=painel.getBoundingClientRect();if(r.top>window.innerHeight*.72)painel.scrollIntoView?.({block:'center',behavior:'smooth'})}catch(_){}},120);
  }

  /* ---------- entrada: item do menu do versículo ---------- */
  function refDoElemento(el){
    if(!el)return null;
    const v=Number(el.dataset.v||String(el.id||'').replace(/^v/,''));if(!v)return null;
    try{
      if(mode==='hyper'||!CORPORA[mode])return null;
      const p=pos(),b=CORPORA[mode].books[p.b];
      return{book:b.book,chapter:Number(p.c),verse:v,label:bookName(b)+' '+p.c+':'+v,sourceMode:mode};
    }catch(e){return null}
  }
  const pop=$('verseActions');
  if(pop)pop.addEventListener('click',e=>{
    const t=e.target.closest('[data-va="exegete"]');if(!t)return;
    const vEl=document.querySelector('#textBody .verse.verse-context')||document.querySelector('#textBody .verse-context');
    const ref=refDoElemento(vEl);
    if(!ref)return;                       // fora da leitura normal, segue o caminho antigo
    e.preventDefault();e.stopImmediatePropagation();
    try{window.DoxaVerseActions?.close()}catch(_){}
    setTimeout(()=>abrir(ref,vEl),140);
  },true);

  document.addEventListener('doxa-reader-rendered',fechar);
  const origRender=window.renderReader;
  if(typeof origRender==='function'&&!origRender.__doxa39){
    const w=function(){fechar();return origRender.apply(this,arguments)};
    w.__doxa39=true;window.renderReader=w;
  }
  window.DoxaInlineGuide={abrir,fechar};
})();
