(()=>{
  'use strict';
  /* Doxa 43 · Linha do Tempo viva
     Dados: Theographic Bible Metadata (CC BY-SA 4.0) — cronologia tradicional de estudo,
     no estilo Ussher, a mesma que fundamenta o dataset. Apresentada como referência de
     estudo, não como certeza histórica.
     Tudo funciona offline: pacote local (window.TIMELINE), sem rede. */
  if(window.__doxa43TimelineInstalled)return;
  window.__doxa43TimelineInstalled=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BOOK_IDX={};if(typeof TIMELINE!=='undefined'&&TIMELINE?.b)TIMELINE.b.forEach((b,i)=>BOOK_IDX[b]=i);

  /* ---------- eras: convenção tradicional, consistente com as datas do pacote ---------- */
  const ERAS=[
    ['Criação e origens',-4004,-2348],
    ['Do Dilúvio a Abraão',-2348,-1996],
    ['Os patriarcas',-1996,-1876],
    ['Egito e escravidão',-1876,-1446],
    ['Êxodo e deserto',-1446,-1406],
    ['Conquista e Juízes',-1406,-1050],
    ['Reino Unido',-1050,-930],
    ['Reino dividido',-930,-586],
    ['Exílio na Babilônia',-586,-538],
    ['Retorno e restauração',-538,-400],
    ['Período interbíblico',-400,-5],
    ['Vida de Jesus',-5,30],
    ['Era apostólica',30,100],
  ];
  function eraOf(y){
    for(const e of ERAS)if(y>=e[1]&&y<e[2])return e;
    return y<ERAS[0][1]?ERAS[0]:ERAS[ERAS.length-1];
  }
  function fmtYear(y){
    if(y==null)return'—';
    const abs=Math.abs(y);
    return abs+(y<0?' a.C.':' d.C.');
  }

  /* ---------- consulta ---------- */
  function yearFor(book,chapter,verse){
    const bi=BOOK_IDX[book];if(bi==null)return null;
    return TIMELINE.y[bi]?.[chapter-1]?.[verse-1] ?? null;
  }
  function eventIdxFor(book,chapter,verse){
    const bi=BOOK_IDX[book];if(bi==null)return null;
    return TIMELINE.e[bi]?.[chapter-1]?.[verse-1] ?? null;
  }
  function nearestYear(book,chapter,verse){
    // se o versículo exato não tem ano, olha um pouco para trás no mesmo capítulo
    let y=yearFor(book,chapter,verse);
    if(y!=null)return y;
    for(let v=verse-1;v>=1&&v>=verse-12;v--){y=yearFor(book,chapter,v);if(y!=null)return y}
    return null;
  }
  function contemporaries(year,excludeKey){
    if(year==null)return[];
    const out=[];
    for(const [key,rec] of Object.entries(TIMELINE.p)){
      const [nome,nasc,morte]=rec;
      if(key===excludeKey)continue;
      if(nasc==null||morte==null)continue;
      if(year>=nasc&&year<=morte)out.push({key,nome,nasc,morte,span:morte-nasc});
    }
    out.sort((a,b)=>a.span-b.span);   // vidas mais curtas/específicas primeiro: tende a ser mais informativo
    return out.slice(0,8);
  }

  /* ---------- navegação para outro versículo ---------- */
  function goTo(bookIdx,chapter,verse){
    const book=TIMELINE.b[bookIdx];
    try{
      let m=(CORPORA[mode]&&mode!=='hyper')?mode:'almeida',bi=CORPORA[m].books.findIndex(b=>b.book===book);
      if(bi<0){m='almeida';bi=CORPORA[m].books.findIndex(b=>b.book===book)}
      if(bi<0)return;
      mode=m;positions[m]={b:bi,c:chapter};focusVerse=verse;
      close();window.DoxaHome?.hide?.(false);openPanel('ler');renderReader();try{savePrefs()}catch(e){}
      setTimeout(()=>document.getElementById('v'+verse)?.scrollIntoView({block:'center',behavior:'smooth'}),160);
    }catch(e){}
  }

  /* ---------- painel ---------- */
  function ensureSheet(){
    let s=$('doxaTimelineSheet');if(s)return s;
    const bd=document.createElement('div');bd.id='doxaTimelineBackdrop';bd.className='doxa-tl-backdrop';document.body.appendChild(bd);
    s=document.createElement('section');s.id='doxaTimelineSheet';s.className='doxa-tl-sheet';s.setAttribute('aria-hidden','true');
    document.body.appendChild(s);
    bd.addEventListener('click',close);
    return s;
  }
  function close(){$('doxaTimelineSheet')?.classList.remove('on');$('doxaTimelineBackdrop')?.classList.remove('on')}

  function eraBar(year){
    const total=ERAS[ERAS.length-1][2]-ERAS[0][1];
    const pct=y=>Math.max(0,Math.min(100,((y-ERAS[0][1])/total)*100));
    const marker=pct(year);
    const segs=ERAS.map(e=>'<i style="width:'+(pct(e[2])-pct(e[1])).toFixed(3)+'%" title="'+esc(e[0])+'"></i>').join('');
    return '<div class="tl-bar"><div class="tl-bar-track">'+segs+'<span class="tl-bar-dot" style="left:'+marker.toFixed(2)+'%"></span></div></div>';
  }

  function personCard(p){
    return '<button type="button" class="tl-person" data-tl-person="'+esc(p.key)+'">'
      +'<strong>'+esc(p.nome)+'</strong><small>'+fmtYear(p.nasc)+' – '+fmtYear(p.morte)+'</small></button>';
  }
  function eventNavHtml(dir,idx){
    if(idx==null||!TIMELINE.ev[idx])return'';
    const [title,year,ref]=TIMELINE.ev[idx];
    const clickable=ref?' data-tl-goto="'+ref.join(',')+'"':' disabled';
    return '<button type="button" class="tl-adj tl-adj-'+dir+'"'+clickable+'>'
      +'<small>'+(dir==='prev'?'ANTES':'DEPOIS')+' · '+fmtYear(year)+'</small><strong>'+esc(title)+'</strong></button>';
  }

  function render(ref){
    const sheet=ensureSheet();
    const year=nearestYear(ref.book,ref.chapter,ref.verse);
    const eIdx=eventIdxFor(ref.book,ref.chapter,ref.verse);
    const era=year!=null?eraOf(year):null;
    const hasEvent=eIdx!=null&&TIMELINE.ev[eIdx];
    const prevIdx=hasEvent?eIdx-1:null, nextIdx=hasEvent?eIdx+1:null;

    let head;
    if(year==null){
      head='<div class="tl-empty"><strong>Sem data estimada</strong><p>Este livro ou trecho não tem uma cronologia definida na fonte usada (ex.: parte da poesia e da sabedoria bíblica).</p></div>';
    }else{
      head = '<div class="tl-year"><b>'+fmtYear(year)+'</b>'+(era?'<span>'+esc(era[0])+'</span>':'')+'</div>'
        + eraBar(year)
        + (hasEvent?'<div class="tl-event"><small>NESTE MOMENTO</small><strong>'+esc(TIMELINE.ev[eIdx][0])+'</strong></div>':'');
    }

    const contigos=year!=null?contemporaries(year):[];
    const peopleHtml = contigos.length
      ? '<h3>Quem mais vivia</h3><div class="tl-people">'+contigos.map(personCard).join('')+'</div>'
      : '';

    const adjHtml = hasEvent
      ? '<h3>Antes e depois</h3><div class="tl-adj-row">'+eventNavHtml('prev',prevIdx)+eventNavHtml('next',nextIdx)+'</div>'
      : '';

    sheet.innerHTML =
      '<div class="tl-grab"></div>'
      +'<div class="tl-head"><span class="tl-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.2"/><path d="M12 9.5v3.7l2.6 1.7"/><path d="M9.3 3.6h5.4"/></svg></span>'
      +'<div><strong>Linha do Tempo</strong><small>'+esc(ref.label||'')+'</small></div>'
      +'<button type="button" id="tlClose" aria-label="Fechar">×</button></div>'
      +'<div class="tl-scroll">'+head+peopleHtml+adjHtml
      +'<p class="tl-note">Cronologia tradicional de estudo (Theographic Bible Metadata, CC BY-SA 4.0), apresentada como referência, não como consenso histórico definitivo.</p>'
      +'</div>';

    sheet.classList.add('on');$('doxaTimelineBackdrop').classList.add('on');

    sheet.querySelector('#tlClose').onclick=close;
    sheet.querySelectorAll('[data-tl-goto]').forEach(b=>b.addEventListener('click',()=>{
      const [bi,c,v]=b.dataset.tlGoto.split(',').map(Number);goTo(bi,c,v);
    }));
    sheet.querySelectorAll('[data-tl-person]').forEach(b=>b.addEventListener('click',()=>{
      const key=b.dataset.tlPerson,rec=TIMELINE.p[key];if(!rec)return;
      const bio=(typeof DOXA_ENTIDADES_PT!=='undefined'&&DOXA_ENTIDADES_PT[key]?.texto)||'';
      const box=b.nextElementSibling?.classList.contains('tl-person-bio')?b.nextElementSibling:null;
      if(box){box.remove();return}
      const div=document.createElement('div');div.className='tl-person-bio';
      div.textContent=bio||'Sem verbete disponível para esta pessoa.';
      b.after(div);
    }));
  }

  /* ---------- entrada pelo menu do versículo ---------- */
  function refFromEl(el){
    if(!el)return null;
    const v=Number(el.dataset.v||String(el.id||'').replace(/^v/,''));if(!Number.isFinite(v))return null;
    try{
      if(mode==='hyper'||!CORPORA[mode])return null;
      const p=pos(),b=CORPORA[mode].books[p.b];
      return{book:b.book,chapter:Number(p.c),verse:v,label:bookName(b)+' '+p.c+':'+v};
    }catch(e){return null}
  }
  /* Doxa 43.4 · Linha do Tempo como um modo, entrando por Ferramentas — igual ao Grifar:
     toque no cartão, volta pra Bíblia, toca num versículo, some ao terminar. Não fica mais
     dependurada no menu de segurar o versículo (e, se o pacote de dados ainda não tiver sido
     baixado, avisa em vez de deixar o toque cair em outra ferramenta). */
  let tlMode=false;
  const $$=id=>document.getElementById(id);
  function setTimelineMode(on){
    tlMode=!!on;
    document.body.classList.toggle('doxa-timeline-mode',tlMode);
    const bar=$$('tlModeBar');if(bar)bar.hidden=!tlMode;
    if(tlMode){try{openPanel('ler')}catch(e){}close()}
  }
  const startBtn=$$('toolsTimelineStart');
  if(startBtn)startBtn.addEventListener('click',()=>setTimelineMode(true));
  const exitBtn=$$('tlModeExit');
  if(exitBtn)exitBtn.addEventListener('click',()=>setTimelineMode(false));

  const host=document.getElementById('textBody');
  if(host)host.addEventListener('click',e=>{
    if(!tlMode)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(typeof TIMELINE==='undefined'||!TIMELINE?.b){
      try{flash('Baixe os recursos offline em Ajustes para usar a Linha do Tempo.')}catch(_){}
      return;
    }
    const vEl=e.target.closest('.verse');   // na leitura normal o versículo só tem id="vN", não data-v
    const ref=vEl?refFromEl(vEl):null;
    if(!ref){try{flash('Toque diretamente num versículo.')}catch(_){}return}
    render(ref);
  },true);

  window.DoxaTimeline={render,close,yearFor,eraOf};
})();
