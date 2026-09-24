(()=>{
  'use strict';
  /* Doxa 38 · Guia Exegético na identidade do app
     - Reorganiza cada palavra em um cartão: original em destaque, Strong dourado, sentido em
       português, morfologia e o verbete em inglês recolhido, que abre ao tocar.
     - No grego, monta as palavras a partir do pacote local (GREEK_STRONG), em vez de baixar
       uma base de terceiros toda vez: mesma fonte do toque na palavra e funciona offline. */
  if(window.__doxa38GuideInstalled)return;
  window.__doxa38GuideInstalled=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const body=$('studyBody');if(!body)return;
  let working=false;

  /* ---------- grego a partir do pacote local ---------- */
  function currentRef(){
    const t=$('studyRef')?.textContent||'';
    return t;
  }
  function greekRows(ref){
    if(typeof GREEK_STRONG==='undefined'||!window.DoxaGreekStrong)return null;
    const pack=window.DoxaGreekStrong.tokens(ref.book,Number(ref.chapter),Number(ref.verse));
    if(!pack)return null;
    return pack.items.filter(Array.isArray).map(tok=>{
      const lex=(typeof lexicalFromToken==='function')?lexicalFromToken(tok):null;
      const pt=(typeof doxaStrongPtEntry==='function')?doxaStrongPtEntry(lex):{m:[],p:''};
      const morph=GREEK_STRONG.m[tok[2]]||'';
      return{
        original:tok[0],translit:lex?.[4]||'',lemma:lex?.[3]||'—',
        strong:lex?.[1]||'—',
        gloss:pt.m.length?pt.m.slice(0,3).join(' · '):'sentido dependente do contexto',
        morph:(typeof decodeMorph==='function')?decodeMorph(morph):morph,
        english:lex?.[7]||lex?.[9]||''
      };
    });
  }
  /* a referência ativa chega pelo evento que o js/09.js dispara */
  let activeRef=null;
  document.addEventListener('doxa-study-active-ref',e=>{activeRef=e.detail||null});

  /* ---------- leitura de uma linha já montada pelo js/09.js ---------- */
  function readRow(row){
    const q=s=>row.querySelector(s);
    return{
      original:q('.word-original')?.textContent?.trim()||'',
      greek:!!q('.word-original.greek'),
      translit:row.querySelector('div > .word-meta')?.textContent?.trim()||'',
      lemma:q('.word-meta b')?.textContent?.trim()||'',
      strong:q('.strong-pill')?.textContent?.trim()||'',
      gloss:q('.word-pt')?.textContent?.trim()||'',
      morph:[...row.querySelectorAll('.word-meta > span')].filter(x=>!x.classList.contains('strong-pill')&&!x.classList.contains('word-pt')).map(x=>x.textContent.trim()).filter(Boolean).join(' · '),
      english:q('.word-original-en div')?.textContent?.trim()||''
    };
  }
  function rowHtml(d,grego){
    return '<div class="ex-row-main">'
      +'<div class="ex-word"><span class="ex-original'+(grego?' greek':' hebrew')+'">'+esc(d.original)+'</span>'
      +(d.translit?'<span class="ex-translit">'+esc(d.translit)+'</span>':'')+'</div>'
      +'<span class="ex-strong">'+esc(d.strong)+'</span></div>'
      +(d.gloss?'<div class="ex-gloss">'+esc(d.gloss)+'</div>':'')
      +'<div class="ex-foot">'+(d.lemma&&d.lemma!=='—'?'<span class="ex-lemma'+(grego?' greek':' hebrew')+'">'+esc(d.lemma)+'</span>':'')
      +(d.morph?'<span class="ex-morph">'+esc(d.morph)+'</span>':'')+'</div>'
      +(d.english?'<div class="ex-en"><span>Verbete original</span><p>'+esc(d.english)+'</p></div>':'')
      +'<span class="ex-chevron" aria-hidden="true">›</span>';
  }
  function upgrade(){
    if(working)return;working=true;
    try{
      // grego: troca a base remota pela local, quando disponível
      /* Doxa 43.8 · O js/09.js busca uma base grega de terceiros pela internet e, quando ela
         chega (um pouco depois, na PRIMEIRA abertura), escreve por cima do quadro grego.
         Antes eu marcava o quadro como "já trocado" e não voltava mais nele, então essa escrita
         tardia vencia e aparecia a versão antiga. Agora, sempre que o quadro tiver qualquer
         linha que não seja nossa, ele é refeito a partir do pacote local. */
      const box=$('greekGuide');
      if(box&&activeRef){
        const temAlheio=box.classList.contains('study-loading')||box.querySelector('.word-row:not([data-local])')||!box.querySelector('[data-local]');
        if(temAlheio){
          const rows=greekRows(activeRef);
          if(rows&&rows.length){
            box.className='word-guide';
            box.innerHTML=rows.map(d=>'<div class="word-row ex-row" data-local="1" tabindex="0" role="button">'+rowHtml(d,true)+'</div>').join('');
          }
        }
      }
      body.querySelectorAll('.word-row:not(.ex-row)').forEach(row=>{
        const d=readRow(row);if(!d.original)return;
        const grego=d.greek||String(d.strong).startsWith('G');
        row.classList.add('ex-row');row.innerHTML=rowHtml(d,grego);
      });
      // cabeçalhos das seções ficam com a cara do app
      body.querySelectorAll('.study-label:not(.ex-label)').forEach(l=>l.classList.add('ex-label'));
    }finally{working=false}
  }

  body.addEventListener('click',e=>{
    const row=e.target.closest('.ex-row');if(!row)return;
    if(e.target.closest('.interlinear-hebrew'))return;
    row.classList.toggle('open');
  });
  body.addEventListener('keydown',e=>{
    const row=e.target.closest?.('.ex-row');
    if(row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();row.classList.toggle('open')}
  });

  new MutationObserver(()=>{if(!working)requestAnimationFrame(upgrade)}).observe(body,{childList:true,subtree:true});

  /* Doxa 43.1 · Corrige a corrida do primeiro toque
     js/30.js é o último de uma cadeia longa de carregamento (grego, hebraico, dados...).
     Se o Novo Testamento ainda não tinha terminado de carregar, o toque em "Guia Exegético"
     podia acontecer ANTES deste script existir: o observer acima nem estava ligado ainda,
     e o guia aparecia na versão antiga, sem o novo visual. Duas garantias agora:
     1) se o guia já estiver aberto quando este script finalmente carregar, atualiza na hora;
     2) toda chamada futura de renderStudy (troca de versículo, reabertura) força a atualização
        também, sem depender só do observer. */
  const origRenderStudy=window.renderStudy;
  if(typeof origRenderStudy==='function'&&!origRenderStudy.__doxa43){
    const wrapped=function(){const r=origRenderStudy.apply(this,arguments);try{upgrade()}catch(e){}return r};
    wrapped.__doxa43=true;window.renderStudy=wrapped;
  }
  if(document.getElementById('studyScreen')?.classList.contains('on'))upgrade();

  upgrade();
  window.DoxaGuide={upgrade};
})();
