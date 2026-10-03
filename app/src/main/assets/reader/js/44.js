(()=>{
  'use strict';
  /* Doxa 58 · COMENTÁRIOS nos artigos, notícias e destaques
     · O balão de comentários aparece ao lado da curtida em cada card da Home e na leitura do artigo —
       inclusive nos itens que abrem um link de outro site (o balão abre os comentários, não o link).
     · Qualquer pessoa lê; para comentar é preciso a Conta Doxa.
     · Respostas em um nível; editar e apagar os próprios; denunciar os dos outros.
     · Regras no servidor: limite de envio, 3 denúncias ocultam até moderação, campos protegidos. */
  if(window.__doxa58CommentsInstalled)return;
  window.__doxa58CommentsInstalled=true;

  const SB='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const APIKEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||''));
  const counts=new Map();

  const ERR=[[/muitos comentários seguidos/i,'Você comentou várias vezes seguidas. Espere um minuto e tente de novo.'],
    [/muitos comentários hoje/i,'Você atingiu o limite de comentários de hoje.'],
    [/duplicate key|23505|already/i,'Você já denunciou este comentário.'],
    [/resposta inválida/i,'Esse comentário não está mais disponível.'],
    [/check constraint|body/i,'O comentário precisa ter entre 1 e 2.000 caracteres.']];
  async function api(path,{method='GET',body,auth=false,prefer}={}){
    const h={apikey:APIKEY,'Content-Type':'application/json'};
    const tok=window.DoxaConta&&window.DoxaConta.user?await window.DoxaConta.token():null;
    if(tok)h.Authorization='Bearer '+tok;else if(auth)throw new Error('Entre na sua Conta Doxa para comentar.');
    if(prefer)h.Prefer=prefer;
    let r;try{r=await fetch(SB+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'})}catch(e){throw new Error('Sem conexão com a internet.')}
    const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}
    if(!r.ok){const raw=(j&&(j.message||j.msg||j.details||j.code))||'';for(const [re,m] of ERR)if(re.test(raw))throw new Error(m);throw new Error('Não deu certo agora. Tente de novo.')}
    return j;
  }
  const listComments=id=>api('/rest/v1/rpc/home_comments_list',{method:'POST',body:{p_item:id}});
  const loggedIn=()=>!!(window.DoxaConta&&window.DoxaConta.user);

  /* ---------- contagens e balões nos cards ---------- */
  let pending=new Set(),timer=null;
  function want(id){if(!isUuid(id)||counts.has(id))return;pending.add(id);clearTimeout(timer);timer=setTimeout(fetchCounts,350)}
  async function fetchCounts(ids){
    const list=ids||[...pending];pending=new Set();if(!list.length)return;
    try{const rows=await api('/rest/v1/rpc/home_comments_counts',{method:'POST',body:{p_ids:list}});
      for(const id of list)counts.set(id,0);for(const r of rows||[])counts.set(r.item_id,r.total);paintPills()}catch(e){}
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

  // o toque no balão abre os comentários (antes de o card abrir o artigo ou o link externo)
  window.addEventListener('click',e=>{
    const p=e.target.closest&&e.target.closest('[data-cmt]');if(!p)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const card=p.closest('[data-open-item]')||p.closest('article,section');
    const title=titleFor(p.dataset.cmt,card);
    open(p.dataset.cmt,title);
  },true);
  window.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset&&e.target.dataset.cmt){e.preventDefault();e.target.click()}},true);
  function titleFor(id,card){
    try{const d=JSON.parse(localStorage.getItem('doxa:home:content:v2')||'null');if(d)for(const k of ['news','articles','featured'])for(const x of d[k]||[])if(String(x.id)===String(id))return x.title}catch(e){}
    const s=card&&card.querySelector('strong,h1');return s?s.textContent.trim():'';
  }

  /* ---------- tela de comentários ---------- */
  let cur={id:null,title:'',items:[],replyTo:null,editing:null};
  function sheet(){
    let o=$('cmtOverlay');if(o)return o;
    o=document.createElement('div');o.id='cmtOverlay';o.className='cmt-overlay';
    o.innerHTML='<section class="cmt-sheet" role="dialog" aria-label="Comentários"><div class="cmt-grab"></div>'
      +'<header class="cmt-head"><div><small>COMENTÁRIOS</small><strong id="cmtTitle"></strong></div><button type="button" id="cmtClose" aria-label="Fechar">×</button></header>'
      +'<div class="cmt-list" id="cmtList"></div><footer class="cmt-foot" id="cmtFoot"></footer></section>';
    document.body.appendChild(o);
    o.addEventListener('click',e=>{if(e.target===o)close()});
    $('cmtClose').onclick=close;
    $('cmtList').addEventListener('click',onListClick);
    return o;
  }
  function close(){$('cmtOverlay')?.classList.remove('on')}
  async function open(id,title){
    cur={id,title:title||'',items:[],replyTo:null,editing:null};
    const o=sheet();$('cmtTitle').textContent=cur.title||'Comentários';
    $('cmtList').innerHTML='<p class="cmt-empty">Carregando…</p>';renderFoot();
    requestAnimationFrame(()=>o.classList.add('on'));
    await reload();
  }
  async function reload(){
    try{cur.items=await listComments(cur.id)||[];counts.set(cur.id,cur.items.filter(c=>!c.deleted).length);paintPills();renderList()}
    catch(e){$('cmtList').innerHTML='<p class="cmt-empty">'+esc(e.message)+'</p>'}
  }
  function ago(t){const s=Math.max(1,Math.round((Date.now()-new Date(t).getTime())/1000));if(s<60)return'agora';const m=Math.round(s/60);if(m<60)return m+' min';const h=Math.round(m/60);if(h<24)return h+' h';const d=Math.round(h/24);if(d<30)return d+(d===1?' dia':' dias');return new Date(t).toLocaleDateString('pt-BR')}
  function avatar(c){const n=(c.author_name||'?').trim().charAt(0).toUpperCase();return c.author_avatar?'<span class="cmt-av"><img src="'+esc(c.author_avatar)+'" alt="" loading="lazy"></span>':'<span class="cmt-av">'+esc(n)+'</span>'}
  function one(c,isReply){
    if(c.deleted)return'<div class="cmt-item gone'+(isReply?' reply':'')+'"><p>Comentário apagado.</p></div>';
    const actions=[];
    if(loggedIn()&&!isReply)actions.push('<button type="button" data-act="reply" data-id="'+c.id+'">Responder</button>');
    if(loggedIn()&&isReply)actions.push('<button type="button" data-act="reply" data-id="'+c.parent_id+'" data-name="'+esc(c.author_name)+'">Responder</button>');
    if(c.is_mine){actions.push('<button type="button" data-act="edit" data-id="'+c.id+'">Editar</button>');actions.push('<button type="button" data-act="del" data-id="'+c.id+'">Apagar</button>')}
    else if(loggedIn())actions.push('<button type="button" data-act="report" data-id="'+c.id+'">Denunciar</button>');
    return'<div class="cmt-item'+(isReply?' reply':'')+(c.is_mine?' mine':'')+'">'+avatar(c)
      +'<div class="cmt-body"><div class="cmt-meta"><b>'+esc(c.author_name)+'</b><span>'+ago(c.created_at)+(c.edited_at?' · editado':'')+'</span></div>'
      +'<p>'+esc(c.body).replace(/\n/g,'<br>')+'</p>'+(actions.length?'<div class="cmt-acts">'+actions.join('')+'</div>':'')+'</div></div>';
  }
  function renderList(){
    const L=$('cmtList');const top=cur.items.filter(c=>!c.parent_id);
    if(!cur.items.length){L.innerHTML='<p class="cmt-empty">Ainda não há comentários.'+(loggedIn()?' Seja o primeiro.':'')+'</p>';return}
    L.innerHTML=top.map(c=>{const reps=cur.items.filter(r=>r.parent_id===c.id);
      if(c.deleted&&!reps.some(r=>!r.deleted))return'';
      return'<div class="cmt-thread">'+one(c,false)+reps.map(r=>one(r,true)).join('')+'</div>'}).join('')||'<p class="cmt-empty">Ainda não há comentários.</p>';
  }
  function renderFoot(){
    const F=$('cmtFoot');
    if(!loggedIn()){F.innerHTML='<button type="button" class="cmt-login" id="cmtLogin">Entre na sua Conta Doxa para comentar</button>';
      $('cmtLogin').onclick=()=>{close();window.DoxaConta?window.DoxaConta.open():null};return}
    const p=window.DoxaConta.profile||{};
    const ctx=cur.editing?'<div class="cmt-ctx">Editando seu comentário <button type="button" id="cmtCancel">×</button></div>'
      :cur.replyTo?'<div class="cmt-ctx">Respondendo a <b>'+esc(cur.replyTo.name||'')+'</b> <button type="button" id="cmtCancel">×</button></div>':'';
    F.innerHTML=ctx+'<div class="cmt-compose">'+(p.avatar_url?'<span class="cmt-av"><img src="'+esc(p.avatar_url)+'" alt=""></span>':'<span class="cmt-av">'+esc((p.display_name||'?').charAt(0).toUpperCase())+'</span>')
      +'<textarea id="cmtText" rows="1" maxlength="2000" placeholder="'+(cur.replyTo?'Escreva sua resposta…':'Escreva um comentário…')+'"></textarea><button type="button" id="cmtSend" aria-label="Enviar"><svg viewBox="0 0 24 24"><path d="M4 12l16-7-6 16-2.5-6.5z"/></svg></button></div>';
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
    if(b.dataset.act==='reply'){const target=cur.items.find(x=>x.id===id);cur.replyTo={id,name:b.dataset.name||(target&&target.author_name)};cur.editing=null;renderFoot();$('cmtText')?.focus();return}
    if(b.dataset.act==='edit'&&c){cur.editing={id,body:c.body};cur.replyTo=null;renderFoot();$('cmtText')?.focus();return}
    if(b.dataset.act==='del'){if(!confirm('Apagar este comentário?'))return;try{await api('/rest/v1/home_comments?id=eq.'+id,{method:'PATCH',auth:true,body:{deleted:true},prefer:'return=minimal'});await reload()}catch(err){toast(err.message)}return}
    if(b.dataset.act==='report'){
      const why=prompt('Por que você está denunciando este comentário?\n(ofensivo, spam, fora do tema…)','');
      if(why===null)return;
      try{await api('/rest/v1/home_comment_reports',{method:'POST',auth:true,body:{comment_id:id,reason:why.slice(0,300)||null},prefer:'return=minimal'});toast('Obrigado. A denúncia foi registrada.')}catch(err){toast(err.message)}
    }
  }
  function toast(msg){let t=$('cmtToast');if(!t){t=document.createElement('div');t.id='cmtToast';t.className='conta-toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),3000)}
  // quando a pessoa entra/sai da conta ou troca a foto, a tela se ajusta
  document.addEventListener('doxa:perfil',()=>{if($('cmtOverlay')?.classList.contains('on')){renderFoot();renderList()}});
  window.addEventListener('focus',()=>{if($('cmtOverlay')?.classList.contains('on'))renderFoot()});

  decorate();
  window.DoxaComments={open,refreshCounts:()=>fetchCounts([...counts.keys()])};
})();
