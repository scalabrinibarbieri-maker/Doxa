(()=>{
  'use strict';
  /* Doxa 59 · Comentários premium + organização visual da aba Ferramentas.
     A camada de dados e permissões dos comentários permanece igual à V58. */
  if(window.__doxa58CommentsInstalled)return;
  window.__doxa58CommentsInstalled=true;

  const SB='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const APIKEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||''));
  const counts=new Map();

  const ERR=[
    [/muitos comentários seguidos/i,'Você comentou várias vezes seguidas. Espere um minuto e tente de novo.'],
    [/muitos comentários hoje/i,'Você atingiu o limite de comentários de hoje.'],
    [/duplicate key|23505|already/i,'Você já denunciou este comentário.'],
    [/resposta inválida/i,'Esse comentário não está mais disponível.'],
    [/check constraint|body/i,'O comentário precisa ter entre 1 e 2.000 caracteres.']
  ];

  async function api(path,{method='GET',body,auth=false,prefer}={}){
    const h={apikey:APIKEY,'Content-Type':'application/json'};
    const tok=window.DoxaConta&&window.DoxaConta.user?await window.DoxaConta.token():null;
    if(tok)h.Authorization='Bearer '+tok;else if(auth)throw new Error('Entre na sua Conta Doxa para comentar.');
    if(prefer)h.Prefer=prefer;
    let r;
    try{r=await fetch(SB+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'})}
    catch(e){throw new Error('Sem conexão com a internet.');}
    const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}
    if(!r.ok){
      const raw=(j&&(j.message||j.msg||j.details||j.code))||'';
      for(const [re,m] of ERR)if(re.test(raw))throw new Error(m);
      throw new Error('Não deu certo agora. Tente de novo.');
    }
    return j;
  }

  const listComments=id=>api('/rest/v1/rpc/home_comments_list',{method:'POST',body:{p_item:id}});
  const loggedIn=()=>!!(window.DoxaConta&&window.DoxaConta.user);

  /* ---------- contagens e balões nos cards ---------- */
  let pending=new Set(),timer=null;
  function want(id){if(!isUuid(id)||counts.has(id))return;pending.add(id);clearTimeout(timer);timer=setTimeout(fetchCounts,350)}
  async function fetchCounts(ids){
    const list=ids||[...pending];pending=new Set();if(!list.length)return;
    try{
      const rows=await api('/rest/v1/rpc/home_comments_counts',{method:'POST',body:{p_ids:list}});
      for(const id of list)counts.set(id,0);
      for(const r of rows||[])counts.set(r.item_id,r.total);
      paintPills();
    }catch(e){}
  }
  const ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5H4.5z"/></svg>';
  function pillFor(id){const n=counts.get(id);return'<span class="doxa-home-like doxa-cmt-pill" role="button" tabindex="0" data-cmt="'+esc(id)+'" aria-label="Comentários">'+ICON+'<b>'+(n==null?'':n)+'</b></span>'}
  function decorate(){
    document.querySelectorAll('[data-like]').forEach(el=>{
      const id=el.dataset.like;if(!isUuid(id))return;
      const nx=el.nextElementSibling;if(nx&&nx.dataset&&nx.dataset.cmt===id)return;
      el.insertAdjacentHTML('afterend',pillFor(id));want(id);
    });
  }
  function paintPills(){document.querySelectorAll('[data-cmt]').forEach(el=>{const n=counts.get(el.dataset.cmt);const b=el.querySelector('b');if(b)b.textContent=n==null?'':String(n)})}
  let decoTimer=null;
  new MutationObserver(()=>{clearTimeout(decoTimer);decoTimer=setTimeout(decorate,60)}).observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{const ids=[...new Set([...document.querySelectorAll('[data-cmt]')].map(e=>e.dataset.cmt))];if(ids.length&&document.visibilityState==='visible')fetchCounts(ids)},120000);

  // O toque no balão abre os comentários antes de o card abrir artigo/link.
  window.addEventListener('click',e=>{
    const p=e.target.closest&&e.target.closest('[data-cmt]');if(!p)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const card=p.closest('[data-open-item]')||p.closest('article,section');
    open(p.dataset.cmt,titleFor(p.dataset.cmt,card));
  },true);
  window.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset&&e.target.dataset.cmt){e.preventDefault();e.target.click()}},true);

  function titleFor(id,card){
    try{
      const d=JSON.parse(localStorage.getItem('doxa:home:content:v2')||'null');
      if(d)for(const k of ['news','articles','featured'])for(const x of d[k]||[])if(String(x.id)===String(id))return x.title;
    }catch(e){}
    const s=card&&card.querySelector('strong,h1');return s?s.textContent.trim():'';
  }

  /* ---------- tela de comentários ---------- */
  let cur={id:null,title:'',items:[],replyTo:null,editing:null};
  const EMPTY_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14v10H10l-5 3.5z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/></svg>';

  function sheet(){
    let o=$('cmtOverlay');if(o)return o;
    o=document.createElement('div');o.id='cmtOverlay';o.className='cmt-overlay';
    o.innerHTML='<section class="cmt-sheet" role="dialog" aria-modal="true" aria-label="Comentários">'
      +'<div class="cmt-grab"></div>'
      +'<header class="cmt-head"><div class="cmt-head-copy"><small>COMENTÁRIOS</small><strong id="cmtTitle"></strong><span class="cmt-count" id="cmtCount">Carregando…</span></div>'
      +'<button type="button" id="cmtClose" aria-label="Fechar"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg></button></header>'
      +'<div class="cmt-list" id="cmtList"></div><footer class="cmt-foot" id="cmtFoot"></footer></section>';
    document.body.appendChild(o);
    o.addEventListener('click',e=>{if(e.target===o)close()});
    $('cmtClose').onclick=close;
    $('cmtList').addEventListener('click',onListClick);

    // Força o estado fechado a ser composto antes da primeira animação.
    // Isso evita o frame em que a sheet aparecia já aberta e "piscava".
    void o.getBoundingClientRect();
    o.classList.add('cmt-mounted');
    return o;
  }

  function close(){
    const o=$('cmtOverlay');if(!o)return;
    o.classList.remove('on');
    o.setAttribute('aria-hidden','true');
  }

  function setCount(n,loading=false){
    const el=$('cmtCount');if(!el)return;
    if(loading){el.textContent='Carregando…';return;}
    el.textContent=n===1?'1 comentário':n+' comentários';
  }

  function loadingHtml(){
    const card=()=>'<div class="cmt-skeleton-card"><div class="cmt-skeleton-av"></div><div class="cmt-skeleton-copy"><i class="cmt-skeleton-line s"></i><i class="cmt-skeleton-line l"></i><i class="cmt-skeleton-line m"></i></div></div>';
    return'<div class="cmt-skeleton" aria-label="Carregando comentários">'+card()+card()+'</div>';
  }

  async function open(id,title){
    cur={id,title:title||'',items:[],replyTo:null,editing:null};
    const o=sheet();
    o.classList.remove('on');
    o.setAttribute('aria-hidden','false');
    $('cmtTitle').textContent=cur.title||'Comentários';
    $('cmtList').innerHTML=loadingHtml();setCount(0,true);renderFoot();

    // Um flush + um frame separado garante que translateY(104%) seja o estado inicial real.
    void o.offsetHeight;
    requestAnimationFrame(()=>o.classList.add('on'));
    await reload(id);
  }

  async function reload(expectedId=cur.id){
    try{
      const rows=await listComments(expectedId)||[];
      if(cur.id!==expectedId)return;
      cur.items=rows;
      const n=cur.items.filter(c=>!c.deleted).length;
      counts.set(cur.id,n);paintPills();setCount(n);renderList();
    }catch(e){
      if(cur.id!==expectedId)return;
      setCount(0);
      $('cmtList').innerHTML='<div class="cmt-empty is-error"><span class="cmt-empty-icon">'+EMPTY_ICON+'</span><strong>Não foi possível carregar</strong><span>'+esc(e.message)+'</span></div>';
    }
  }

  function ago(t){
    const s=Math.max(1,Math.round((Date.now()-new Date(t).getTime())/1000));if(s<60)return'agora';
    const m=Math.round(s/60);if(m<60)return m+' min';
    const h=Math.round(m/60);if(h<24)return h+' h';
    const d=Math.round(h/24);if(d<30)return d+(d===1?' dia':' dias');
    return new Date(t).toLocaleDateString('pt-BR');
  }
  function avatar(c){
    const n=(c.author_name||'?').trim().charAt(0).toUpperCase();
    return c.author_avatar?'<span class="cmt-av"><img src="'+esc(c.author_avatar)+'" alt="" loading="lazy"></span>':'<span class="cmt-av">'+esc(n)+'</span>';
  }
  function one(c,isReply){
    if(c.deleted)return'<div class="cmt-item gone'+(isReply?' reply':'')+'"><p>Comentário apagado.</p></div>';
    const actions=[];
    if(loggedIn()&&!isReply)actions.push('<button type="button" data-act="reply" data-id="'+c.id+'">Responder</button>');
    if(loggedIn()&&isReply)actions.push('<button type="button" data-act="reply" data-id="'+c.parent_id+'" data-name="'+esc(c.author_name)+'">Responder</button>');
    if(c.is_mine){
      actions.push('<button type="button" data-act="edit" data-id="'+c.id+'">Editar</button>');
      actions.push('<button type="button" data-act="del" data-id="'+c.id+'">Apagar</button>');
    }else if(loggedIn())actions.push('<button type="button" data-act="report" data-id="'+c.id+'">Denunciar</button>');
    return'<div class="cmt-item'+(isReply?' reply':'')+(c.is_mine?' mine':'')+'">'+avatar(c)
      +'<div class="cmt-body"><div class="cmt-meta"><b>'+esc(c.author_name)+'</b><span>'+ago(c.created_at)+(c.edited_at?' · editado':'')+'</span></div>'
      +'<p>'+esc(c.body).replace(/\n/g,'<br>')+'</p>'+(actions.length?'<div class="cmt-acts">'+actions.join('')+'</div>':'')+'</div></div>';
  }
  function renderList(){
    const L=$('cmtList');const top=cur.items.filter(c=>!c.parent_id);
    if(!cur.items.length){
      L.innerHTML='<div class="cmt-empty"><span class="cmt-empty-icon">'+EMPTY_ICON+'</span><strong>Ainda não há comentários</strong><span>'+(loggedIn()?'Seja o primeiro a comentar este artigo.':'Entre na sua Conta Doxa para participar da conversa.')+'</span></div>';
      return;
    }
    L.innerHTML=top.map(c=>{
      const reps=cur.items.filter(r=>r.parent_id===c.id);
      if(c.deleted&&!reps.some(r=>!r.deleted))return'';
      return'<div class="cmt-thread">'+one(c,false)+reps.map(r=>one(r,true)).join('')+'</div>';
    }).join('')||'<div class="cmt-empty"><span class="cmt-empty-icon">'+EMPTY_ICON+'</span><strong>Ainda não há comentários</strong></div>';
  }
  function renderFoot(){
    const F=$('cmtFoot');
    if(!loggedIn()){
      F.innerHTML='<button type="button" class="cmt-login" id="cmtLogin">Entre na sua Conta Doxa para comentar</button>';
      $('cmtLogin').onclick=()=>{close();window.DoxaConta?window.DoxaConta.open():null};return;
    }
    const p=window.DoxaConta.profile||{};
    const ctx=cur.editing?'<div class="cmt-ctx">Editando seu comentário <button type="button" id="cmtCancel">×</button></div>'
      :cur.replyTo?'<div class="cmt-ctx">Respondendo a <b>'+esc(cur.replyTo.name||'')+'</b> <button type="button" id="cmtCancel">×</button></div>':'';
    F.innerHTML=ctx+'<div class="cmt-compose">'
      +(p.avatar_url?'<span class="cmt-av"><img src="'+esc(p.avatar_url)+'" alt=""></span>':'<span class="cmt-av">'+esc((p.display_name||'?').charAt(0).toUpperCase())+'</span>')
      +'<textarea id="cmtText" rows="1" maxlength="2000" placeholder="'+(cur.replyTo?'Escreva sua resposta…':'Escreva um comentário…')+'"></textarea>'
      +'<button type="button" id="cmtSend" aria-label="Enviar"><svg viewBox="0 0 24 24"><path d="M4 12l16-7-6 16-2.5-6.5z"/></svg></button></div>';
    const ta=$('cmtText');if(cur.editing)ta.value=cur.editing.body;
    const grow=()=>{ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,140)+'px'};ta.addEventListener('input',grow);grow();
    if($('cmtCancel'))$('cmtCancel').onclick=()=>{cur.replyTo=null;cur.editing=null;renderFoot()};
    $('cmtSend').onclick=send;
  }
  async function send(){
    const ta=$('cmtText'),body=ta.value.trim();if(!body)return;
    const btn=$('cmtSend');btn.disabled=true;
    try{
      if(cur.editing)await api('/rest/v1/home_comments?id=eq.'+cur.editing.id,{method:'PATCH',auth:true,body:{body},prefer:'return=minimal'});
      else await api('/rest/v1/home_comments',{method:'POST',auth:true,body:{item_id:cur.id,body,parent_id:cur.replyTo?cur.replyTo.id:null},prefer:'return=minimal'});
      cur.replyTo=null;cur.editing=null;renderFoot();await reload();
      const L=$('cmtList');L.scrollTop=L.scrollHeight;
    }catch(e){toast(e.message);btn.disabled=false}
  }
  async function onListClick(e){
    const b=e.target.closest('[data-act]');if(!b)return;
    const id=b.dataset.id,c=cur.items.find(x=>x.id===id);
    if(b.dataset.act==='reply'){
      const target=cur.items.find(x=>x.id===id);
      cur.replyTo={id,name:b.dataset.name||(target&&target.author_name)};cur.editing=null;renderFoot();$('cmtText')?.focus();return;
    }
    if(b.dataset.act==='edit'&&c){cur.editing={id,body:c.body};cur.replyTo=null;renderFoot();$('cmtText')?.focus();return}
    if(b.dataset.act==='del'){
      if(!confirm('Apagar este comentário?'))return;
      try{await api('/rest/v1/home_comments?id=eq.'+id,{method:'PATCH',auth:true,body:{deleted:true},prefer:'return=minimal'});await reload()}
      catch(err){toast(err.message)}
      return;
    }
    if(b.dataset.act==='report'){
      const why=prompt('Por que você está denunciando este comentário?\n(ofensivo, spam, fora do tema…)','');
      if(why===null)return;
      try{await api('/rest/v1/home_comment_reports',{method:'POST',auth:true,body:{comment_id:id,reason:why.slice(0,300)||null},prefer:'return=minimal'});toast('Obrigado. A denúncia foi registrada.')}
      catch(err){toast(err.message)}
    }
  }
  function toast(msg){
    let t=$('cmtToast');if(!t){t=document.createElement('div');t.id='cmtToast';t.className='conta-toast';document.body.appendChild(t)}
    t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),3000);
  }

  document.addEventListener('doxa:perfil',()=>{if($('cmtOverlay')?.classList.contains('on')){renderFoot();renderList()}});
  window.addEventListener('focus',()=>{if($('cmtOverlay')?.classList.contains('on'))renderFoot()});

  /* ---------- Ferramentas: organiza sem trocar handlers/IDs ---------- */
  const SVG={
    highlight:'<svg viewBox="0 0 24 24"><path d="M6 17.5 8.4 8l7.9 2-2.4 9.5z"/><path d="M9.3 5.5 17.2 7.5M5 20h10"/></svg>',
    timeline:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.2"/><path d="M12 9.5v3.7l2.6 1.7M9.3 3.6h5.4"/><path d="M5.3 13H3.8M20.2 13h-1.5"/></svg>',
    bookmarks:'<svg viewBox="0 0 24 24"><path d="M6 4.5h10.5v15L11.2 16l-5.2 3.5z"/><path d="M9 7.5h4.7M9 10.5h4.7"/></svg>',
    notes:'<svg viewBox="0 0 24 24"><path d="M5 4.5h11.5v15H5z"/><path d="M8 8h5.5M8 11h5.5M8 14h3.7"/><path d="m15.5 16.2 3.7-3.7 1.3 1.3-3.7 3.7-1.8.5z"/></svg>',
    parallel:'<svg viewBox="0 0 24 24"><path d="M3.5 5.5h7v13h-7zM13.5 5.5h7v13h-7z"/><path d="M6.2 9h1.6M16.2 9h1.6"/></svg>'
  };

  function setCopy(btn,small){const el=btn?.querySelector('.tool-card-copy small,.doxa31-tool-copy small');if(el)el.textContent=small}
  function setIcon(btn,svg){const el=btn?.querySelector('.tool-card-icon,.doxa31-tool-icon');if(el)el.innerHTML=svg}
  function ensureArrow(btn){
    if(!btn)return;
    if(btn.querySelector('.tool-card-arrow,.doxa31-tool-arrow'))return;
    const a=document.createElement('span');a.className='tool-card-arrow';a.setAttribute('aria-hidden','true');a.textContent='›';btn.appendChild(a);
  }
  function makeGroup(label,nodes){
    const section=document.createElement('section');section.className='doxa59-tools-group';
    const head=document.createElement('div');head.className='doxa59-tools-group-head';head.innerHTML='<span>'+label+'</span>';
    const stack=document.createElement('div');stack.className='doxa59-tools-stack';
    for(const n of nodes)if(n)stack.appendChild(n);
    section.append(head,stack);return section;
  }
  function installPremiumTools(){
    const panel=$('p-marcar');if(!panel)return false;
    if(panel.classList.contains('doxa59-tools-refined'))return true;
    const doxa=$('toolsDoxaMode'),lupa=$('toolsLupaStart'),timeline=$('toolsTimelineStart'),highlight=$('toolsHighlightStart'),highlights=$('toolsHighlightsBtn'),notes=$('toolsNotesBtn'),parallel=$('doxa31ParallelTool');
    if(!doxa||!lupa||!timeline||!highlight||!highlights||!notes||!parallel)return false;

    // Textos mais curtos: a função continua a mesma.
    if(!doxa.classList.contains('is-active'))setCopy(doxa,'Revele no texto os versículos com conteúdo Doxa.');
    setCopy(lupa,'Descubra camadas escondidas no texto.');
    setCopy(timeline,'Veja o versículo em sua época.');
    setCopy(highlight,'Pinte o texto bíblico com o dedo.');
    setCopy(highlights,'Seus grifos organizados em pastas.');
    setCopy(notes,'Suas anotações do estudo bíblico.');
    setCopy(parallel,'Duas versões lado a lado.');

    setIcon(highlight,SVG.highlight);setIcon(timeline,SVG.timeline);setIcon(highlights,SVG.bookmarks);setIcon(notes,SVG.notes);setIcon(parallel,SVG.parallel);
    for(const b of [lupa,timeline,highlight,highlights,notes,parallel])ensureArrow(b);

    const intro=document.createElement('div');intro.className='doxa59-tools-intro';intro.innerHTML='<span class="kicker">ESTUDO</span><h2>Ferramentas</h2><p>Recursos para estudar, marcar e aprofundar o texto bíblico.</p>';
    const hero=document.createElement('div');hero.className='doxa59-tools-hero';
    const badge=document.createElement('span');badge.className='doxa59-hero-badge';badge.textContent='DESTAQUE';
    const copy=doxa.querySelector('.doxa-tool-mode-copy');if(copy&&!copy.querySelector('.doxa59-hero-badge'))copy.prepend(badge);
    hero.appendChild(doxa);

    const explore=makeGroup('Explorar o texto',[lupa,timeline]);
    const keep=makeGroup('Marcar e guardar',[highlight,highlights,notes]);
    const read=makeGroup('Leitura',[parallel]);
    const anchor=$('toolsHighlightsView')||$('toolsNotesView')||panel.firstElementChild;
    panel.insertBefore(intro,anchor);panel.insertBefore(hero,anchor);panel.insertBefore(explore,anchor);panel.insertBefore(keep,anchor);panel.insertBefore(read,anchor);
    panel.classList.add('doxa59-tools-refined');

    const notesView=$('toolsNotesView'),highlightsView=$('toolsHighlightsView');
    const syncLibrary=()=>panel.classList.toggle('doxa59-library-open',!!((notesView&&!notesView.hidden)||(highlightsView&&!highlightsView.hidden)));
    syncLibrary();
    const obs=new MutationObserver(syncLibrary);
    if(notesView)obs.observe(notesView,{attributes:true,attributeFilter:['hidden']});
    if(highlightsView)obs.observe(highlightsView,{attributes:true,attributeFilter:['hidden']});
    return true;
  }
  function bootTools(attempt=0){
    if(installPremiumTools())return;
    if(attempt<8)setTimeout(()=>bootTools(attempt+1),180+attempt*90);
  }


  /* ============================================================
     Doxa 60 · social nos módulos e no leitor rico
     A coleção do Jean continua agrupada, mas cada módulo volta a
     ter curtida + comentários, inclusive dentro do próprio artigo.
     ============================================================ */
  const HOME_SESSION_KEY='doxa:home:session:v1';
  const HOME_LIKED_KEY='doxa:home:liked:v1';
  const articleLikeCounts=new Map();
  let articleLikePending=new Set(),articleLikeTimer=null,pendingRichItemId='';
  const HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.3-4.4-9.2-9A5.1 5.1 0 0 1 12 6.1a5.1 5.1 0 0 1 9.2 5.2c-1.9 4.6-9.2 9-9.2 9z"/></svg>';

  function readLocalJson(key,def){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??def}catch(e){return def}}
  function writeLocalJson(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(e){}}
  function homeLikedSet(){return new Set(readLocalJson(HOME_LIKED_KEY,[]))}
  function saveHomeLiked(set){writeLocalJson(HOME_LIKED_KEY,[...set])}

  async function homeLikeSb(path,{method='GET',body,token,prefer}={}){
    const h={apikey:APIKEY,'Content-Type':'application/json'};
    if(token)h.Authorization='Bearer '+token;
    if(prefer)h.Prefer=prefer;
    const r=await fetch(SB+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
    const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}
    if(!r.ok){const er=new Error((j&&(j.message||j.msg||j.details))||('HTTP '+r.status));er.status=r.status;throw er}
    return j;
  }
  async function homeLikeSession(){
    let s=readLocalJson(HOME_SESSION_KEY,null);
    const save=r=>{s={access_token:r.access_token,refresh_token:r.refresh_token,expires_at:Date.now()+(Number(r.expires_in)||3600)*1000,user_id:r.user?.id||s?.user_id};writeLocalJson(HOME_SESSION_KEY,s);return s};
    if(s&&s.access_token&&Date.now()<(s.expires_at||0)-60000)return s;
    if(s&&s.refresh_token){
      try{return save(await homeLikeSb('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh_token}}))}catch(e){}
    }
    return save(await homeLikeSb('/auth/v1/signup',{method:'POST',body:{}}));
  }

  function syncLikeDom(id){
    const n=articleLikeCounts.get(id),on=homeLikedSet().has(id);
    document.querySelectorAll('[data-like]').forEach(el=>{
      if(String(el.dataset.like)!==String(id))return;
      el.classList.toggle('on',on);
      if(el.hasAttribute('data-article-social-like')){
        const b=el.querySelector('b');if(b&&n!=null)b.textContent=String(n);
      }
    });
  }
  function syncHomeLikeCache(id,n){
    try{
      const d=JSON.parse(localStorage.getItem('doxa:home:content:v2')||'null');
      if(!d)return;
      let changed=false;
      for(const k of ['news','articles','featured'])for(const x of d[k]||[])if(String(x.id)===String(id)){x.likes=n;changed=true}
      if(changed)localStorage.setItem('doxa:home:content:v2',JSON.stringify(d));
    }catch(e){}
  }
  async function fetchArticleLikeCounts(ids){
    const list=(ids||[...articleLikePending]).filter(isUuid);articleLikePending=new Set();
    if(!list.length)return;
    try{
      const rows=await api('/rest/v1/home_itens?select=id,curtidas&id=in.('+list.join(',')+')');
      for(const id of list)if(!articleLikeCounts.has(id))articleLikeCounts.set(id,0);
      for(const row of rows||[])articleLikeCounts.set(String(row.id),Math.max(0,Number(row.curtidas)||0));
      for(const id of list)syncLikeDom(id);
    }catch(e){}
  }
  function wantArticleLikeCount(id){
    if(!isUuid(id)||articleLikeCounts.has(id))return;
    articleLikePending.add(id);clearTimeout(articleLikeTimer);articleLikeTimer=setTimeout(fetchArticleLikeCounts,120);
  }

  function articleLikeHtml(id,extra=''){
    const on=homeLikedSet().has(id),n=articleLikeCounts.get(id);
    return '<span class="doxa-home-like doxa-article-social-like'+(on?' on':'')+(extra?' '+extra:'')+'" role="button" tabindex="0" data-like="'+esc(id)+'" data-article-social-like="1" aria-label="Curtir">'+HEART+'<b>'+(n==null?'':n)+'</b></span>';
  }

  function ensureModuleSocial(){
    document.querySelectorAll('.doxa-collection-module[data-open-item]').forEach(card=>{
      const id=String(card.dataset.openItem||'');if(!isUuid(id))return;
      if(card.querySelector('[data-article-social-like]')){wantArticleLikeCount(id);return}
      const copy=card.querySelector('.doxa-collection-module-copy');if(!copy)return;
      const row=document.createElement('span');row.className='doxa-module-social';row.setAttribute('aria-label','Interações do módulo');
      row.innerHTML=articleLikeHtml(id,'doxa-module-like');
      copy.appendChild(row);wantArticleLikeCount(id);
    });
  }

  function ensureRichSocial(){
    const reader=document.getElementById('doxaRichReader');
    if(!reader||!reader.classList.contains('on'))return;
    const article=reader.querySelector('.doxa-rich-article');if(!article)return;
    if(article.querySelector('.doxa-rich-social'))return;
    const id=String(pendingRichItemId||'');if(!isUuid(id))return;
    const row=document.createElement('div');row.className='doxa-rich-social';row.dataset.socialItem=id;
    row.innerHTML='<span class="doxa-rich-social-label">INTERAÇÕES</span><div class="doxa-rich-social-actions">'+articleLikeHtml(id,'doxa-rich-like')+'</div>';
    const source=article.querySelector('.doxa-rich-source');
    const content=article.querySelector('.doxa-rich-content');
    if(source)source.insertAdjacentElement('afterend',row);
    else if(content)content.insertAdjacentElement('beforebegin',row);
    else article.appendChild(row);
    wantArticleLikeCount(id);
  }

  async function toggleArticleLike(el){
    const id=String(el?.dataset?.like||'');if(!isUuid(id))return;
    if(el.dataset.likeBusy==='1')return;el.dataset.likeBusy='1';
    if(!articleLikeCounts.has(id))await fetchArticleLikeCounts([id]);
    const set=homeLikedSet(),was=set.has(id),oldCount=Math.max(0,Number(articleLikeCounts.get(id))||0);
    if(was)set.delete(id);else set.add(id);saveHomeLiked(set);
    articleLikeCounts.set(id,Math.max(0,oldCount+(was?-1:1)));syncLikeDom(id);syncHomeLikeCache(id,articleLikeCounts.get(id));
    try{
      const tok=(await homeLikeSession()).access_token;
      if(was)await homeLikeSb('/rest/v1/home_curtidas?item_id=eq.'+encodeURIComponent(id),{method:'DELETE',token:tok,prefer:'return=minimal'});
      else{
        try{await homeLikeSb('/rest/v1/home_curtidas',{method:'POST',token:tok,body:{item_id:id},prefer:'return=minimal'})}
        catch(e){if(e.status!==409)throw e}
      }
    }catch(e){
      const back=homeLikedSet();if(was)back.add(id);else back.delete(id);saveHomeLiked(back);
      articleLikeCounts.set(id,oldCount);syncLikeDom(id);syncHomeLikeCache(id,oldCount);toast('Sem conexão. Tente curtir de novo.');
    }finally{delete el.dataset.likeBusy}
  }

  // Captura antes do leitor rico: guarda qual artigo/módulo será aberto.
  window.addEventListener('click',e=>{
    const el=e.target instanceof Element?e.target:null;if(!el)return;
    const like=el.closest('[data-article-social-like]');
    if(like){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toggleArticleLike(like);return}
    if(el.closest('[data-cmt]'))return;
    const item=el.closest('[data-open-item]');
    if(item&&isUuid(item.dataset.openItem))pendingRichItemId=String(item.dataset.openItem);
  },true);
  window.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target?.matches?.('[data-article-social-like]')){e.preventDefault();toggleArticleLike(e.target)}
  },true);

  let socialTimer=null;
  const socialObserver=new MutationObserver(()=>{
    clearTimeout(socialTimer);socialTimer=setTimeout(()=>{ensureModuleSocial();ensureRichSocial();decorate()},35);
  });
  socialObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

  decorate();
  bootTools();
  window.DoxaComments={open,refreshCounts:()=>fetchCounts([...counts.keys()])};
})();
