(()=>{
  'use strict';
  if(window.__doxa31HomeInstalled)return;
  window.__doxa31HomeInstalled=true;

  const $=s=>document.querySelector(s);
  const HOME_KEY='doxa:home:content:v1';
  const EARNED_KEY='doxa:pao-diario:last-earned';
  const STREAK_KEY='doxa:pao-diario:streak';
  let homeOpen=false;

  const fallback={
    verse:{kicker:'VERSÍCULO DO DIA',text:'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo o que nele crê não pereça, mas tenha a vida eterna.',ref:'João 3:16',book:'John',chapter:3,verse:16,image:'assets/home_verse.webp'},
    news:[
      {title:'Congresso reúne milhares de jovens em São Paulo',sub:'Fé que move uma geração.',meta:'Conteúdo demonstrativo',image:'assets/home_news_1.webp'},
      {title:'Nova tradução da Bíblia é lançada no Brasil',sub:'Leitura, texto e tradição.',meta:'Conteúdo demonstrativo',image:'assets/home_news_2.webp'},
      {title:'Arqueologia bíblica em destaque',sub:'Descobertas e contexto histórico.',meta:'Conteúdo demonstrativo',image:'assets/home_news_3.webp'}
    ],
    articles:[
      {title:'Como ouvir a voz de Deus no meio da rotina',sub:'Princípios práticos para uma vida mais sensível à direção de Deus.',meta:'8 min de leitura',image:'assets/home_article_1.webp'},
      {title:'Disciplina espiritual para dias difíceis',sub:'Pequenos hábitos que sustentam a fé em tempos de provação.',meta:'6 min de leitura',image:'assets/home_article_2.webp'}
    ]
  };

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function dateKey(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function lastEarned(){try{return localStorage.getItem(EARNED_KEY)||''}catch(e){return''}}
  function streak(){try{return Math.max(0,Number(localStorage.getItem(STREAK_KEY)||0))}catch(e){return 0}}
  function earnedToday(){return lastEarned()===dateKey()}
  function greeting(){const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'}

  function content(){
    try{const x=JSON.parse(localStorage.getItem(HOME_KEY)||'null');if(x&&typeof x==='object')return Object.assign({},fallback,x)}catch(e){}
    return fallback;
  }

  function html(){
    const data=content(),v=data.verse||fallback.verse,n=Array.isArray(data.news)?data.news:fallback.news,a=Array.isArray(data.articles)?data.articles:fallback.articles;
    return '<div class="doxa-home-scroll"><div class="doxa-home-inner">'
      +'<header class="doxa-home-head"><div><h1>Início</h1><p>'+greeting()+'. Com Deus, todo dia.</p></div><blockquote>A Tua palavra é lâmpada para os meus pés.<span>Salmo 119:105</span></blockquote></header>'
      +'<button class="doxa-home-bread-card" id="doxaHomeBreadCard" type="button">'
        +'<span class="doxa-home-bread-copy"><small>PÃO DIÁRIO</small><strong>Alimente sua fé, um dia de cada vez.</strong><span class="doxa-home-streak-label">Sequência atual</span><b id="doxaHomeStreak">0 dias</b></span>'
        +'<span class="doxa-home-bread-art"><span class="doxa-home-bread-stage" id="doxa30BreadStage"><img class="doxa-home-bread-inactive" src="assets/doxa_pao_inativo.png" alt=""><img class="doxa-home-bread-active" src="assets/doxa_pao_ativo.png" alt="Pão Diário"><i></i></span></span>'
        +'<span class="doxa-home-goal"><span><em>Meta diária</em><b id="doxaHomeGoalText">0/1 capítulo</b></span><span class="doxa-home-goal-track"><i id="doxaHomeGoalBar"></i></span><strong id="doxaHomeGoalPct">0%</strong></span>'
        +'<span class="doxa-home-week" id="doxaHomeWeek"></span>'
      +'</button>'
      +'<button class="doxa-home-verse" id="doxaHomeVerse" type="button" style="--home-verse-image:url(\''+esc(v.image||fallback.verse.image)+'\')"><span class="doxa-home-verse-shade"></span><span class="doxa-home-verse-copy"><small>'+esc(v.kicker||'VERSÍCULO DO DIA')+'</small><strong>“'+esc(v.text||'')+'”</strong><span>'+esc(v.ref||'')+'</span></span><span class="doxa-home-open-label">Abrir <b>›</b></span></button>'
      +'<section class="doxa-home-section"><div class="doxa-home-section-head"><h2>Notícias</h2><button type="button" data-home-coming>Ver todas <span>›</span></button></div><div class="doxa-home-news-grid">'
        +n.slice(0,6).map(x=>'<button class="doxa-home-news" type="button" data-home-coming style="--home-image:url(\''+esc(x.image||'')+'\')"><span class="doxa-home-image"></span><span class="doxa-home-card-copy"><strong>'+esc(x.title)+'</strong><small>'+esc(x.sub)+'</small><em>'+esc(x.meta)+'</em></span></button>').join('')
      +'</div></section>'
      +'<section class="doxa-home-section"><div class="doxa-home-section-head"><h2>Artigos</h2><button type="button" data-home-coming>Ver todos <span>›</span></button></div><div class="doxa-home-article-grid">'
        +a.slice(0,6).map(x=>'<button class="doxa-home-article" type="button" data-home-coming style="--home-image:url(\''+esc(x.image||'')+'\')"><span class="doxa-home-image"></span><span class="doxa-home-card-copy"><strong>'+esc(x.title)+'</strong><small>'+esc(x.sub)+'</small><em>◷ &nbsp;'+esc(x.meta)+'</em></span></button>').join('')
      +'</div></section>'
      +'<section class="doxa-home-section doxa-home-evidence"><div class="doxa-home-section-head"><h2>Em evidência</h2><button type="button" data-home-coming>Ver todos <span>›</span></button></div><button class="doxa-home-feature" type="button" data-home-coming><span>ESTUDO EM DESTAQUE</span><strong>Uma leitura mais profunda começa com boas perguntas.</strong><small>Em breve, conteúdo administrado pelo Doxa.</small></button></section>'
    +'</div></div>';
  }

  function streakDates(){
    const set=new Set(),last=lastEarned(),count=streak();
    if(!last||!count)return set;
    const p=last.split('-').map(Number);if(p.length!==3)return set;
    const d=new Date(p[0],p[1]-1,p[2],12,0,0,0);
    for(let i=0;i<Math.min(count,366);i++){set.add(dateKey(d));d.setDate(d.getDate()-1)}
    return set;
  }

  function renderBread(){
    const ok=earnedToday(),s=streak();
    const stage=$('#doxa30BreadStage');if(stage){stage.classList.remove('earned','earned-static');if(ok)stage.classList.add('earned-static')}
    const st=$('#doxaHomeStreak');if(st)st.textContent=s+' dia'+(s===1?'':'s');
    const gt=$('#doxaHomeGoalText');if(gt)gt.textContent=(ok?'1/1':'0/1')+' capítulo';
    const gb=$('#doxaHomeGoalBar');if(gb)gb.style.width=ok?'100%':'0%';
    const gp=$('#doxaHomeGoalPct');if(gp)gp.textContent=ok?'100%':'0%';
    const week=$('#doxaHomeWeek');if(!week)return;
    const done=streakDates(),today=new Date(),fmt=new Intl.DateTimeFormat('pt-BR',{weekday:'short'}),arr=[];
    for(let off=6;off>=0;off--){
      const d=new Date(today);d.setHours(12,0,0,0);d.setDate(d.getDate()-off);
      const key=dateKey(d),hit=done.has(key),isToday=off===0,label=isToday?'Hoje':fmt.format(d).replace('.','');
      arr.push('<span class="doxa-home-day '+(hit?'done ':'')+(isToday?'today':'')+'"><i><img src="'+(hit?'assets/doxa_pao_ativo.png':'assets/doxa_pao_inativo.png')+'" alt=""></i><small>'+esc(label)+'</small></span>');
    }
    week.innerHTML=arr.join('');
  }

  function toast(msg){
    let el=$('.doxa30-streak-toast');if(!el){el=document.createElement('div');el.className='doxa30-streak-toast';document.body.appendChild(el)}
    el.textContent=msg;el.classList.add('show');clearTimeout(el.__timer);el.__timer=setTimeout(()=>el.classList.remove('show'),1700);
  }

  function setHomeActive(){
    const bottom=$('#doxa30Bottom');if(!bottom)return;
    bottom.querySelectorAll('.doxa30-nav-item').forEach(x=>x.classList.remove('active'));
    $('#doxa30Home')?.classList.add('active');bottom.dataset.active='home';
  }

  function restorePanelActive(){
    const bottom=$('#doxa30Bottom');if(!bottom)return;
    bottom.querySelectorAll('.doxa30-nav-item').forEach(x=>x.classList.remove('active'));
    const tools=document.getElementById('p-marcar')?.classList.contains('on');
    (tools?$('#doxa30Tools'):$('#doxa30Bible'))?.classList.add('active');bottom.dataset.active=tools?'tools':'bible';
  }

  function showHome(){
    const home=$('#doxa30HomeScreen');if(!home)return;
    homeOpen=true;document.body.classList.add('doxa-home-open');document.body.classList.remove('hud-hidden');
    home.classList.add('on');home.setAttribute('aria-hidden','false');setHomeActive();renderBread();
  }
  function hideHome(restore=true){
    const home=$('#doxa30HomeScreen');homeOpen=false;document.body.classList.remove('doxa-home-open');
    home?.classList.remove('on');home?.setAttribute('aria-hidden','true');if(restore)restorePanelActive();
  }

  function openVerse(){
    const v=content().verse||fallback.verse;
    try{
      const cp=CORPORA.almeida,bi=cp.books.findIndex(b=>b.book===v.book);
      if(bi>=0){mode='almeida';positions.almeida={b:bi,c:Number(v.chapter)||1};focusVerse=Number(v.verse)||null;renderReader();savePrefs?.()}
    }catch(e){}
    hideHome(false);window.openPanel?.('ler');
    setTimeout(()=>document.getElementById('v'+(Number(v.verse)||1))?.scrollIntoView({block:'center',behavior:'smooth'}),180);
  }

  function install(){
    if($('#doxa30HomeScreen'))return;
    const home=document.createElement('section');home.id='doxa30HomeScreen';home.className='doxa-home-screen';home.setAttribute('aria-hidden','true');home.innerHTML=html();document.body.appendChild(home);

    // O Pão Diário deixa a HUD e passa a existir somente na Home.
    $('#doxa30Bread')?.remove();

    $('#doxaHomeBreadCard')?.addEventListener('click',()=>toast(earnedToday()?'Pão Diário concluído hoje':'Leia um capítulo até o final para concluir o Pão Diário'));
    $('#doxaHomeVerse')?.addEventListener('click',openVerse);
    home.querySelectorAll('[data-home-coming]').forEach(b=>b.addEventListener('click',()=>toast('Esta área será alimentada pelo painel ADM do Doxa')));

    $('#doxa30Home')?.addEventListener('click',showHome);
    $('#doxa30Bible')?.addEventListener('click',()=>hideHome(false));
    $('#doxa30Tools')?.addEventListener('click',()=>hideHome(false));
    $('#doxa30More')?.addEventListener('click',()=>hideHome(false));

    window.addEventListener('storage',e=>{if(e.key===EARNED_KEY||e.key===STREAK_KEY)renderBread()});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderBread()});
    setInterval(()=>{if(homeOpen)renderBread()},2500);
    renderBread();
  }

  // API pronta para a etapa Supabase/painel ADM, sem acoplar segredo algum no APK.
  window.DoxaHome={
    show:showHome,hide:hideHome,refresh:renderBread,
    applyContent(data){if(!data||typeof data!=='object')return;try{localStorage.setItem(HOME_KEY,JSON.stringify(data))}catch(e){}const old=$('#doxa30HomeScreen');old?.remove();install();if(homeOpen)showHome()},
    clearContent(){try{localStorage.removeItem(HOME_KEY)}catch(e){}const old=$('#doxa30HomeScreen');old?.remove();install();}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
