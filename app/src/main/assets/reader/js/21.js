(()=>{
  'use strict';
  /* Doxa 32 · Home ligada ao Supabase
     - Lê home_itens (notícias, artigos, destaques) e home_versiculos (versículo fixado do dia).
     - Guarda a última versão baixada e funciona offline com ela.
     - Curtidas anônimas: cada instalação recebe uma sessão anônima do Supabase na primeira curtida.
     - A chave usada é a "publishable", feita para ficar no app; o banco só deixa ler o que está
       publicado e curtir/descurtir em nome da própria sessão (RLS). */
  if(window.__doxa31HomeInstalled)return;
  window.__doxa31HomeInstalled=true;

  const $=s=>document.querySelector(s);
  const HOME_KEY='doxa:home:content:v2';
  const SESSION_KEY='doxa:home:session:v1';
  const LIKED_KEY='doxa:home:liked:v1';
  const EARNED_KEY='doxa:pao-diario:last-earned';
  const STREAK_KEY='doxa:pao-diario:streak';
  const SB_URL='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const SB_KEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  const REFRESH_MS=5*60*1000;
  let homeOpen=false,fetching=null;

  const demo={
    news:[
      {id:'demo-n1',title:'Congresso reúne milhares de jovens em São Paulo',sub:'Fé que move uma geração.',meta:'Conteúdo demonstrativo',image:'assets/home_news_1.webp'},
      {id:'demo-n2',title:'Nova tradução da Bíblia é lançada no Brasil',sub:'Leitura, texto e tradição.',meta:'Conteúdo demonstrativo',image:'assets/home_news_2.webp'},
      {id:'demo-n3',title:'Arqueologia bíblica em destaque',sub:'Descobertas e contexto histórico.',meta:'Conteúdo demonstrativo',image:'assets/home_news_3.webp'}
    ],
    articles:[
      {id:'demo-a1',title:'Como ouvir a voz de Deus no meio da rotina',sub:'Princípios práticos para uma vida mais sensível à direção de Deus.',meta:'8 min de leitura',image:'assets/home_article_1.webp'},
      {id:'demo-a2',title:'Disciplina espiritual para dias difíceis',sub:'Pequenos hábitos que sustentam a fé em tempos de provação.',meta:'6 min de leitura',image:'assets/home_article_2.webp'}
    ],
    featured:[]
  };

  /* ---------- versículo do dia ---------- */
  const PT2OSIS={gn:'Gen','êx':'Exod',ex:'Exod',lv:'Lev',nm:'Num',dt:'Deut',js:'Josh',jz:'Judg',rt:'Ruth','1sm':'1Sam','2sm':'2Sam','1rs':'1Kgs','2rs':'2Kgs','1cr':'1Chr','2cr':'2Chr',ed:'Ezra',ne:'Neh',et:'Esth','jó':'Job',jo:'John',sl:'Ps',pv:'Prov',ec:'Eccl',ct:'Song',is:'Isa',jr:'Jer',lm:'Lam',ez:'Ezek',dn:'Dan',os:'Hos',jl:'Joel',am:'Amos',ob:'Obad',jn:'Jonah',mq:'Mic',na:'Nah',hc:'Hab',sf:'Zeph',ag:'Hag',zc:'Zech',ml:'Mal',mt:'Matt',mc:'Mark',lc:'Luke',at:'Acts',rm:'Rom','1co':'1Cor','2co':'2Cor',gl:'Gal',ef:'Eph',fp:'Phil',cl:'Col','1ts':'1Thess','2ts':'2Thess','1tm':'1Tim','2tm':'2Tim',tt:'Titus',fm:'Phlm',hb:'Heb',tg:'Jas','1pe':'1Pet','2pe':'2Pet','1jo':'1John','2jo':'2John','3jo':'3John',jd:'Jude',ap:'Rev'};
  const POOL=['Gen 1 1','Gen 12 2','Gen 28 15','Exod 14 14','Exod 15 2','Exod 33 14','Num 6 24','Deut 6 5','Deut 31 6','Deut 31 8','Josh 1 8','Josh 1 9','Josh 24 15','1Sam 16 7','2Sam 22 31','1Chr 16 11','2Chr 7 14','Neh 8 10','Job 19 25','Ps 1 1','Ps 16 11','Ps 18 2','Ps 19 1','Ps 19 14','Ps 23 1','Ps 23 4','Ps 27 1','Ps 27 14','Ps 34 8','Ps 37 4','Ps 37 5','Ps 42 11','Ps 46 1','Ps 46 10','Ps 51 10','Ps 55 22','Ps 56 3','Ps 62 1','Ps 73 26','Ps 84 11','Ps 90 12','Ps 91 1','Ps 91 11','Ps 103 2','Ps 103 12','Ps 118 24','Ps 119 11','Ps 119 105','Ps 121 1','Ps 121 2','Ps 127 1','Ps 139 14','Ps 145 18','Ps 147 3','Prov 3 5','Prov 3 6','Prov 4 23','Prov 16 3','Prov 18 10','Eccl 3 1','Isa 9 6','Isa 26 3','Isa 40 8','Isa 40 31','Isa 41 10','Isa 43 2','Isa 53 5','Isa 55 8','Jer 17 7','Jer 29 11','Jer 33 3','Lam 3 22','Lam 3 23','Mic 6 8','Hab 3 19','Zeph 3 17','Matt 5 8','Matt 5 14','Matt 6 33','Matt 6 34','Matt 7 7','Matt 11 28','Matt 28 20','Mark 10 27','Luke 1 37','Luke 6 31','John 1 1','John 3 16','John 8 12','John 8 32','John 10 10','John 11 25','John 14 6','John 14 27','John 15 5','John 16 33','Acts 1 8','Rom 5 8','Rom 8 1','Rom 8 28','Rom 8 31','Rom 10 9','Rom 12 2','Rom 12 12','Rom 15 13','1Cor 10 13','1Cor 13 4','1Cor 16 14','2Cor 5 17','2Cor 12 9','Gal 2 20','Gal 5 22','Gal 6 9','Eph 2 8','Eph 3 20','Eph 6 10','Phil 1 6','Phil 4 6','Phil 4 7','Phil 4 13','Phil 4 19','Col 3 2','Col 3 23','1Thess 5 16','1Thess 5 18','2Tim 1 7','2Tim 3 16','Heb 4 12','Heb 11 1','Heb 12 1','Heb 13 5','Jas 1 5','Jas 4 8','1Pet 5 7','1John 1 9','1John 4 8','1John 4 19','Rev 3 20','Rev 21 4'];
  function osisOf(code){const c=String(code||'').trim();if(!c)return'';const low=c.toLowerCase().replace(/\s+/g,'');return PT2OSIS[low]||c}
  function corpusBook(osis){try{return (CORPORA.almeida||ALMEIDA).books.find(b=>String(b.book).toLowerCase()===String(osis).toLowerCase())||null}catch(e){return null}}
  function verseText(osis,ch,v){
    const b=corpusBook(osis);if(!b)return null;
    const c=b.chapters.find(x=>Number(x.chapter)===Number(ch));if(!c)return null;
    const vv=c.verses.find(x=>Number(x.number)===Number(v));if(!vv)return null;
    let name=b.book;try{name=(typeof bookName==='function')?bookName(b):b.book}catch(e){}
    return{text:String(vv.text).replace(/\[|\]/g,''),ref:name+' '+ch+':'+v,book:b.book,chapter:Number(ch),verse:Number(v)};
  }
  /* Embaralhamento determinístico: todos veem o mesmo versículo no mesmo dia e nenhum repete
     antes de o ciclo inteiro passar. Não precisa guardar histórico. */
  function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function autoVerse(d=new Date()){
    const epoch=Date.UTC(2026,0,1),day=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-epoch)/864e5);
    const n=POOL.length,cycle=Math.floor(day/n),idx=((day%n)+n)%n;
    const order=POOL.map((_,i)=>i),rnd=seeded(20260101+cycle*7919);
    for(let i=n-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
    for(let k=0;k<n;k++){const [b,c,v]=POOL[order[(idx+k)%n]].split(' ');const r=verseText(b,c,v);if(r)return r}
    return null;
  }
  function todayVerse(data){
    const f=data.verseFixed;
    if(f&&f.dia===dateKey()){const r=verseText(osisOf(f.livro),f.capitulo,f.versiculo);if(r)return Object.assign(r,{note:f.nota||''})}
    return autoVerse()||{text:'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',ref:'João 3:16',book:'John',chapter:3,verse:16};
  }

  /* ---------- utilidades ---------- */
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function cssUrl(u){return String(u||'').replace(/["'()\\\s]/g,m=>encodeURIComponent(m))}
  function dateKey(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function lastEarned(){try{return localStorage.getItem(EARNED_KEY)||''}catch(e){return''}}
  function streak(){try{return Math.max(0,Number(localStorage.getItem(STREAK_KEY)||0))}catch(e){return 0}}
  function earnedToday(){return lastEarned()===dateKey()}
  function greeting(){const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'}
  function readJson(k,def){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x??def}catch(e){return def}}
  function writeJson(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

  /* ---------- conteúdo ---------- */
  function content(){
    const x=readJson(HOME_KEY,null);
    if(x&&x.remote)return x;
    return{remote:false,news:demo.news,articles:demo.articles,featured:demo.featured,verseFixed:null};
  }
  function mapItem(r){return{id:r.id,type:r.tipo,title:r.titulo||'',sub:r.subtitulo||'',text:r.texto||'',image:r.imagem_url||'',link:r.link_url||'',meta:r.meta||'',likes:Number(r.curtidas)||0,date:r.publicado_em}}
  function findItem(id){const d=content();return [...(d.news||[]),...(d.articles||[]),...(d.featured||[])].find(x=>String(x.id)===String(id))||null}

  async function sb(path,{method='GET',body,token,prefer}={}){
    const h={apikey:SB_KEY,'Content-Type':'application/json'};
    if(token)h.Authorization='Bearer '+token;
    if(prefer)h.Prefer=prefer;
    const r=await fetch(SB_URL+path,{method,headers:h,body:body?JSON.stringify(body):undefined,cache:'no-store'});
    if(!r.ok){const e=new Error('HTTP '+r.status);e.status=r.status;try{e.body=await r.text()}catch(_){}throw e}
    const t=await r.text();return t?JSON.parse(t):null;
  }

  async function refreshContent(force=false){
    const cur=readJson(HOME_KEY,null);
    if(!force&&cur&&cur.remote&&Date.now()-(cur.fetchedAt||0)<REFRESH_MS)return;
    if(fetching)return fetching;
    fetching=(async()=>{
      try{
        const [items,verses]=await Promise.all([
          sb('/rest/v1/home_itens?select=id,tipo,titulo,subtitulo,texto,imagem_url,link_url,meta,ordem,publicado_em,curtidas&publicado=eq.true&order=ordem.asc,publicado_em.desc&limit=60'),
          sb('/rest/v1/home_versiculos?select=dia,livro,capitulo,versiculo,nota&dia=eq.'+dateKey())
        ]);
        const all=(items||[]).map(mapItem);
        const data={remote:true,fetchedAt:Date.now(),
          news:all.filter(x=>x.type==='noticia'),
          articles:all.filter(x=>x.type==='artigo'),
          featured:all.filter(x=>x.type==='destaque'),
          verseFixed:(verses&&verses[0])||null};
        writeJson(HOME_KEY,data);
        render();
      }catch(e){/* sem internet: fica a última versão guardada */}
      finally{fetching=null}
    })();
    return fetching;
  }

  /* ---------- curtidas anônimas ---------- */
  function liked(){return new Set(readJson(LIKED_KEY,[]))}
  function saveLiked(set){writeJson(LIKED_KEY,[...set])}
  async function session(){
    let s=readJson(SESSION_KEY,null);
    if(s&&s.access_token&&Date.now()<(s.expires_at||0)-60000)return s;
    const save=r=>{s={access_token:r.access_token,refresh_token:r.refresh_token,expires_at:Date.now()+(Number(r.expires_in)||3600)*1000,user_id:r.user?.id||s?.user_id};writeJson(SESSION_KEY,s);return s};
    if(s&&s.refresh_token){
      try{return save(await sb('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh_token}}))}catch(e){}
    }
    return save(await sb('/auth/v1/signup',{method:'POST',body:{}}));
  }
  async function syncMyLikes(){
    const s=readJson(SESSION_KEY,null);if(!s)return;       // sem sessão ainda = nunca curtiu nada
    try{const tok=(await session()).access_token;const rows=await sb('/rest/v1/home_curtidas?select=item_id',{token:tok});saveLiked(new Set((rows||[]).map(r=>r.item_id)));paintLikes()}catch(e){}
  }
  function adjustCount(id,delta){
    const d=readJson(HOME_KEY,null);if(!d||!d.remote)return;
    for(const k of ['news','articles','featured'])for(const x of d[k]||[])if(String(x.id)===String(id))x.likes=Math.max(0,(x.likes||0)+delta);
    writeJson(HOME_KEY,d);
  }
  let likeBusy=new Set();
  async function toggleLike(id){
    if(!id||String(id).startsWith('demo-')){toast('Curtidas ficam disponíveis no conteúdo publicado');return}
    if(likeBusy.has(id))return;likeBusy.add(id);
    const set=liked(),was=set.has(id);
    if(was)set.delete(id);else set.add(id);saveLiked(set);adjustCount(id,was?-1:1);paintLikes();
    try{
      const tok=(await session()).access_token;
      if(was)await sb('/rest/v1/home_curtidas?item_id=eq.'+encodeURIComponent(id),{method:'DELETE',token:tok,prefer:'return=minimal'});
      else{try{await sb('/rest/v1/home_curtidas',{method:'POST',token:tok,body:{item_id:id},prefer:'return=minimal'})}catch(e){if(e.status!==409)throw e}}
    }catch(e){
      const back=liked();if(was)back.add(id);else back.delete(id);saveLiked(back);adjustCount(id,was?1:-1);paintLikes();
      toast('Sem conexão. Tente curtir de novo.');
    }finally{likeBusy.delete(id)}
  }
  function likeHtml(x){
    if(!x||String(x.id).startsWith('demo-'))return'';
    const on=liked().has(x.id);
    return '<span class="doxa-home-like'+(on?' on':'')+'" role="button" tabindex="0" data-like="'+esc(x.id)+'" aria-label="Curtir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.3-4.4-9.2-9A5.1 5.1 0 0 1 12 6.1a5.1 5.1 0 0 1 9.2 5.2c-1.9 4.6-9.2 9-9.2 9z"/></svg><b>'+(x.likes||0)+'</b></span>';
  }
  function paintLikes(){
    const set=liked();
    document.querySelectorAll('[data-like]').forEach(el=>{
      const id=el.dataset.like,x=findItem(id);el.classList.toggle('on',set.has(id));
      const b=el.querySelector('b');if(b&&x)b.textContent=String(x.likes||0);
    });
  }

  /* ---------- tela da Home ---------- */
  function cardNews(x){return '<button class="doxa-home-news" type="button" data-open-item="'+esc(x.id)+'" style="--home-image:url(\''+cssUrl(x.image)+'\')"><span class="doxa-home-image"></span><span class="doxa-home-card-copy"><strong>'+esc(x.title)+'</strong><small>'+esc(x.sub)+'</small><span class="doxa-home-card-foot"><em>'+esc(x.meta)+'</em>'+likeHtml(x)+'</span></span></button>'}
  function cardArticle(x){return '<button class="doxa-home-article" type="button" data-open-item="'+esc(x.id)+'" style="--home-image:url(\''+cssUrl(x.image)+'\')"><span class="doxa-home-image"></span><span class="doxa-home-card-copy"><strong>'+esc(x.title)+'</strong><small>'+esc(x.sub)+'</small><span class="doxa-home-card-foot"><em>'+(x.meta?'◷ &nbsp;'+esc(x.meta):'')+'</em>'+likeHtml(x)+'</span></span></button>'}
  function cardFeature(x){return '<button class="doxa-home-feature" type="button" data-open-item="'+esc(x.id)+'"'+(x.image?' style="--home-image:url(\''+cssUrl(x.image)+'\')"':'')+'><span>'+esc(x.meta||'EM DESTAQUE')+'</span><strong>'+esc(x.title)+'</strong><small>'+esc(x.sub)+'</small>'+likeHtml(x)+'</button>'}
  function section(title,key,items,card,gridClass,extra=''){
    if(!items.length)return'';
    return '<section class="doxa-home-section'+extra+'"><div class="doxa-home-section-head"><h2>'+title+'</h2>'+(items.length>(key==='featured'?1:gridClass==='doxa-home-news-grid'?3:2)?'<button type="button" data-see-all="'+key+'">Ver todos <span>›</span></button>':'')+'</div><div class="'+gridClass+'">'+items.slice(0,key==='featured'?1:6).map(card).join('')+'</div></section>';
  }

  function html(){
    const data=content(),v=todayVerse(data);
    return '<div class="doxa-home-scroll"><div class="doxa-home-inner">'
      +'<header class="doxa-home-head"><div><h1>Início</h1><p>'+greeting()+'. Com Deus, todo dia.</p></div><blockquote>A Tua palavra é lâmpada para os meus pés.<span>Salmo 119:105</span></blockquote></header>'
      +'<button class="doxa-home-bread-card" id="doxaHomeBreadCard" type="button">'
        +'<span class="doxa-home-bread-copy"><small>PÃO DIÁRIO</small><strong>Alimente sua fé, um dia de cada vez.</strong><span class="doxa-home-streak-label">Sequência atual</span><b id="doxaHomeStreak">0 dias</b></span>'
        +'<span class="doxa-home-bread-art"><span class="doxa-home-bread-stage" id="doxa30BreadStage"><img class="doxa-home-bread-inactive" src="assets/doxa_pao_inativo.png" alt=""><img class="doxa-home-bread-active" src="assets/doxa_pao_ativo.png" alt="Pão Diário"><i></i></span></span>'
        +'<span class="doxa-home-goal"><span><em>Meta diária</em><b id="doxaHomeGoalText">0/1 capítulo</b></span><span class="doxa-home-goal-track"><i id="doxaHomeGoalBar"></i></span><strong id="doxaHomeGoalPct">0%</strong></span>'
        +'<span class="doxa-home-week" id="doxaHomeWeek"></span>'
      +'</button>'
      +'<button class="doxa-home-verse" id="doxaHomeVerse" type="button" data-book="'+esc(v.book)+'" data-chapter="'+v.chapter+'" data-verse="'+v.verse+'" style="--home-verse-image:url(\'assets/home_verse.webp\')"><span class="doxa-home-verse-shade"></span><span class="doxa-home-verse-copy"><small>VERSÍCULO DO DIA</small><strong>“'+esc(v.text)+'”</strong><span>'+esc(v.ref)+'</span></span><span class="doxa-home-open-label">Abrir <b>›</b></span></button>'
      +section('Notícias','news',data.news||[],cardNews,'doxa-home-news-grid')
      +section('Artigos','articles',data.articles||[],cardArticle,'doxa-home-article-grid')
      +section('Em evidência','featured',data.featured||[],cardFeature,'doxa-home-feature-list',' doxa-home-evidence')
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
    refreshContent(false);
  }
  function hideHome(restore=true){
    const home=$('#doxa30HomeScreen');homeOpen=false;document.body.classList.remove('doxa-home-open');
    home?.classList.remove('on');home?.setAttribute('aria-hidden','true');closeReader();if(restore)restorePanelActive();
  }

  function openVerse(){
    const el=$('#doxaHomeVerse');if(!el)return;
    const book=el.dataset.book,ch=Number(el.dataset.chapter)||1,vs=Number(el.dataset.verse)||1;
    try{
      const cp=CORPORA.almeida,bi=cp.books.findIndex(b=>b.book===book);
      if(bi>=0){mode='almeida';positions.almeida={b:bi,c:ch};focusVerse=vs;renderReader();savePrefs?.()}
    }catch(e){}
    hideHome(false);window.openPanel?.('ler');
    setTimeout(()=>document.getElementById('v'+vs)?.scrollIntoView({block:'center',behavior:'smooth'}),180);
  }

  /* ---------- leitura de artigo / lista "Ver todos" ---------- */
  function ensureReader(){
    let r=$('#doxaHomeReader');if(r)return r;
    r=document.createElement('section');r.id='doxaHomeReader';r.className='doxa-home-reader';r.setAttribute('aria-hidden','true');
    r.innerHTML='<div class="doxa-home-reader-bar"><button type="button" id="doxaHomeReaderBack" aria-label="Voltar">‹</button><span id="doxaHomeReaderTitle"></span></div><div class="doxa-home-reader-scroll" id="doxaHomeReaderBody"></div>';
    document.body.appendChild(r);
    $('#doxaHomeReaderBack').addEventListener('click',closeReader);
    r.addEventListener('click',e=>{
      const lk=e.target.closest('[data-like]');if(lk){e.stopPropagation();toggleLike(lk.dataset.like);return}
      const it=e.target.closest('[data-open-item]');if(it){openItem(it.dataset.openItem);return}
      const ex=e.target.closest('[data-external]');if(ex){window.open(ex.dataset.external,'_blank','noopener')}
    });
    return r;
  }
  function paragraphs(t){return String(t||'').split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('')}
  function showReader(title,inner){
    const r=ensureReader();$('#doxaHomeReaderTitle').textContent=title;
    const body=$('#doxaHomeReaderBody');body.innerHTML=inner;body.scrollTop=0;
    r.classList.add('on');r.setAttribute('aria-hidden','false');
  }
  function closeReader(){const r=$('#doxaHomeReader');if(!r)return;r.classList.remove('on');r.setAttribute('aria-hidden','true')}
  function openItem(id){
    const x=findItem(id);if(!x)return;
    if(String(id).startsWith('demo-')){toast('Conteúdo demonstrativo: publique itens no painel do Doxa');return}
    if(x.link&&!x.text){window.open(x.link,'_blank','noopener');return}
    const kind=x.type==='noticia'?'Notícia':x.type==='destaque'?'Em evidência':'Artigo';
    showReader(kind,
      (x.image?'<div class="doxa-home-reader-hero" style="--home-image:url(\''+cssUrl(x.image)+'\')"></div>':'')
      +'<article class="doxa-home-reader-article">'
      +(x.meta?'<small>'+esc(x.meta)+'</small>':'')
      +'<h1>'+esc(x.title)+'</h1>'
      +(x.sub?'<p class="doxa-home-reader-sub">'+esc(x.sub)+'</p>':'')
      +'<div class="doxa-home-reader-actions">'+likeHtml(x)+(x.link?'<button type="button" class="doxa-home-reader-link" data-external="'+esc(x.link)+'">Abrir fonte ›</button>':'')+'</div>'
      +'<div class="doxa-home-reader-text">'+paragraphs(x.text)+'</div>'
      +'</article>');
  }
  function openList(key){
    const d=content(),items=d[key]||[],title={news:'Notícias',articles:'Artigos',featured:'Em evidência'}[key]||'';
    showReader(title,'<div class="doxa-home-reader-list">'+items.map(cardArticle).join('')+'</div>');
  }

  /* ---------- montagem ---------- */
  function render(){
    const home=$('#doxa30HomeScreen');if(!home)return;
    const sc=home.querySelector('.doxa-home-scroll'),y=sc?sc.scrollTop:0;
    home.innerHTML=html();
    const nsc=home.querySelector('.doxa-home-scroll');if(nsc)nsc.scrollTop=y;
    renderBread();paintLikes();
  }

  let globalsBound=false;
  function bindGlobals(){
    if(globalsBound)return;globalsBound=true;
    $('#doxa30Home')?.addEventListener('click',showHome);
    $('#doxa30Bible')?.addEventListener('click',()=>hideHome(false));
    $('#doxa30Tools')?.addEventListener('click',()=>hideHome(false));
    $('#doxa30More')?.addEventListener('click',()=>hideHome(false));
    window.addEventListener('storage',e=>{if(e.key===EARNED_KEY||e.key===STREAK_KEY)renderBread()});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderBread();if(homeOpen)refreshContent(false)}});
    window.addEventListener('online',()=>refreshContent(true));
    setInterval(()=>{if(homeOpen)renderBread()},2500);
  }

  function install(){
    let home=$('#doxa30HomeScreen');
    if(!home){
      home=document.createElement('section');home.id='doxa30HomeScreen';home.className='doxa-home-screen';home.setAttribute('aria-hidden','true');
      document.body.appendChild(home);
      // Um único ouvinte para tudo que é redesenhado.
      home.addEventListener('click',e=>{
        const lk=e.target.closest('[data-like]');if(lk){e.preventDefault();e.stopPropagation();toggleLike(lk.dataset.like);return}
        if(e.target.closest('#doxaHomeBreadCard')){toast(earnedToday()?'Pão Diário concluído hoje':'Leia um capítulo até o final para concluir o Pão Diário');return}
        if(e.target.closest('#doxaHomeVerse')){openVerse();return}
        const all=e.target.closest('[data-see-all]');if(all){openList(all.dataset.seeAll);return}
        const it=e.target.closest('[data-open-item]');if(it){openItem(it.dataset.openItem)}
      });
    }
    $('#doxa30Bread')?.remove();   // o Pão Diário mora só na Home
    bindGlobals();
    render();
    // O versículo automático depende do corpus Almeida; se ainda não estava pronto, redesenha em seguida.
    setTimeout(render,1200);
    refreshContent(false).then(syncMyLikes);
  }

  window.DoxaHome={
    show:showHome,hide:hideHome,refresh:()=>refreshContent(true),
    applyContent(data){if(!data||typeof data!=='object')return;writeJson(HOME_KEY,Object.assign({remote:true,fetchedAt:Date.now()},data));render()},
    clearContent(){try{localStorage.removeItem(HOME_KEY)}catch(e){}render()}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
