(()=>{
  'use strict';
  /* Doxa 55 · Artigos ricos na Home
     - Só intercepta itens publicados que tenham conteudo_html.
     - Itens antigos continuam sendo abertos pelo js/21.js, sem mudança.
     - O HTML vindo do banco é sanitizado no cliente antes de ser exibido.
     - Mantém um cache local para leitura offline do último conteúdo recebido.
     - Permite uma imagem exclusiva no topo interno do artigo usando
       alt="DOXA_ARTICLE_HERO", sem alterar a capa do card da Home. */
  if(window.__doxa55RichHomeInstalled)return;
  window.__doxa55RichHomeInstalled=true;

  const SB_URL='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const SB_KEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  const CACHE_KEY='doxa:home:rich:v1';
  const REFRESH_MS=5*60*1000;
  let lastFetch=0;
  let fetching=null;
  const richItems=new Map();

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cssUrl=v=>String(v||'').replace(/["'()\\\s]/g,m=>encodeURIComponent(m));
  const safeWebUrl=v=>{
    const s=String(v||'').trim();
    if(!/^https?:\/\//i.test(s))return'';
    try{
      const u=new URL(s);
      return (u.protocol==='http:'||u.protocol==='https:')?u.href:'';
    }catch(e){return''}
  };

  function readCache(){
    try{
      const data=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');
      if(!data||!Array.isArray(data.items))return;
      richItems.clear();
      for(const x of data.items){
        if(x&&x.id&&String(x.conteudo_html||'').trim())richItems.set(String(x.id),x);
      }
      lastFetch=Number(data.fetchedAt)||0;
    }catch(e){}
  }

  function writeCache(items){
    try{localStorage.setItem(CACHE_KEY,JSON.stringify({fetchedAt:Date.now(),items}))}catch(e){}
  }

  async function refresh(force=false){
    if(fetching)return fetching;
    if(!force&&lastFetch&&Date.now()-lastFetch<REFRESH_MS)return;
    fetching=(async()=>{
      try{
        const fields='id,tipo,titulo,subtitulo,texto,conteudo_html,autor,imagem_url,link_url,meta,ordem,publicado_em,curtidas';
        const path='/rest/v1/home_itens?select='+fields+'&publicado=eq.true&conteudo_html=not.is.null&order=ordem.asc,publicado_em.desc&limit=250';
        const r=await fetch(SB_URL+path,{headers:{apikey:SB_KEY},cache:'no-store'});
        if(!r.ok)throw new Error('HTTP '+r.status);
        const rows=await r.json();
        const items=(Array.isArray(rows)?rows:[]).filter(x=>String(x.conteudo_html||'').trim());
        richItems.clear();
        for(const x of items)richItems.set(String(x.id),x);
        lastFetch=Date.now();
        writeCache(items);
      }catch(e){
        // Sem internet: o último cache válido continua sendo usado.
      }finally{
        fetching=null;
      }
    })();
    return fetching;
  }

  const ALLOWED=new Set([
    'P','H2','H3','H4','STRONG','B','EM','I','U','S','SPAN','BLOCKQUOTE',
    'UL','OL','LI','HR','A','IMG','BR','FIGURE','FIGCAPTION',
    'SUP','SUB','CODE','PRE','MARK'
  ]);
  const DROP=new Set([
    'SCRIPT','STYLE','IFRAME','OBJECT','EMBED','FORM','INPUT','TEXTAREA',
    'SELECT','OPTION','BUTTON','LINK','META','BASE','SVG','MATH','TEMPLATE',
    'VIDEO','AUDIO','SOURCE','CANVAS'
  ]);

  function sanitizeElement(el){
    const tag=el.tagName;
    if(tag==='A'){
      const href=safeWebUrl(el.getAttribute('href'));
      const title=el.getAttribute('title')||'';
      [...el.attributes].forEach(a=>el.removeAttribute(a.name));
      if(href){
        el.setAttribute('href',href);
        el.setAttribute('target','_blank');
        el.setAttribute('rel','noopener noreferrer');
      }
      if(title)el.setAttribute('title',title);
      return;
    }
    if(tag==='IMG'){
      const src=safeWebUrl(el.getAttribute('src'));
      const alt=el.getAttribute('alt')||'';
      const title=el.getAttribute('title')||'';
      [...el.attributes].forEach(a=>el.removeAttribute(a.name));
      if(src){
        el.setAttribute('src',src);
        el.setAttribute('loading','lazy');
        el.setAttribute('decoding','async');
      }
      if(alt)el.setAttribute('alt',alt);
      if(title)el.setAttribute('title',title);
      return;
    }
    [...el.attributes].forEach(a=>el.removeAttribute(a.name));
  }

  function sanitizeHtml(raw){
    const parser=new DOMParser();
    const doc=parser.parseFromString('<div id="doxa-rich-root">'+String(raw||'')+'</div>','text/html');
    const root=doc.getElementById('doxa-rich-root');
    if(!root)return'';

    function walk(parent){
      for(const node of [...parent.childNodes]){
        if(node.nodeType===8){
          node.remove();
          continue;
        }
        if(node.nodeType!==1)continue;
        const tag=node.tagName;
        if(DROP.has(tag)){
          node.remove();
          continue;
        }
        walk(node);
        if(tag==='H1'){
          const h2=doc.createElement('h2');
          while(node.firstChild)h2.appendChild(node.firstChild);
          node.replaceWith(h2);
          sanitizeElement(h2);
          continue;
        }
        if(!ALLOWED.has(tag)){
          const frag=doc.createDocumentFragment();
          while(node.firstChild)frag.appendChild(node.firstChild);
          node.replaceWith(frag);
          continue;
        }
        sanitizeElement(node);
        if(tag==='IMG'&&!node.getAttribute('src'))node.remove();
        if(tag==='A'&&!node.getAttribute('href')){
          const frag=doc.createDocumentFragment();
          while(node.firstChild)frag.appendChild(node.firstChild);
          node.replaceWith(frag);
        }
      }
    }

    walk(root);
    return root.innerHTML;
  }

  /* Se o HTML trouxer uma imagem com alt="DOXA_ARTICLE_HERO",
     ela vira a imagem grande do topo interno e é retirada do corpo.
     A imagem_url continua sendo a capa usada na Home. */
  function splitArticleHero(raw,fallback){
    try{
      const parser=new DOMParser();
      const doc=parser.parseFromString('<div id="doxa-rich-split">'+String(raw||'')+'</div>','text/html');
      const root=doc.getElementById('doxa-rich-split');
      if(!root)return{hero:safeWebUrl(fallback),html:String(raw||'')};

      const img=[...root.querySelectorAll('img')].find(el=>
        String(el.getAttribute('alt')||'').trim()==='DOXA_ARTICLE_HERO'
      );

      let hero=safeWebUrl(fallback);
      if(img){
        const marked=safeWebUrl(img.getAttribute('src'));
        if(marked)hero=marked;
        const figure=img.closest('figure');
        (figure||img).remove();
      }
      return{hero,html:root.innerHTML};
    }catch(e){
      return{hero:safeWebUrl(fallback),html:String(raw||'')};
    }
  }

  function ensureStyles(){
    if(document.getElementById('doxaRichReaderStyles'))return;
    const style=document.createElement('style');
    style.id='doxaRichReaderStyles';
    style.textContent=`
      .doxa-rich-reader{
        position:fixed;z-index:92;inset:0;visibility:hidden;opacity:0;pointer-events:none;
        background:var(--dh00,var(--d30-bg,#17130f));color:var(--dh01,var(--d30-text,#eee7dd));
        transform:translate3d(12px,0,0);
        transition:opacity .18s ease,transform .24s cubic-bezier(.2,.8,.2,1),visibility .18s;
      }
      .doxa-rich-reader.on{visibility:visible;opacity:1;pointer-events:auto;transform:none}
      .doxa-rich-reader-bar{
        position:absolute;z-index:3;left:0;right:0;top:0;
        min-height:calc(env(safe-area-inset-top,0px) + 58px);
        padding:env(safe-area-inset-top,0px) 16px 0;
        display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;
        background:color-mix(in srgb,var(--dh00,var(--d30-bg,#17130f)) 92%,transparent);
        border-bottom:1px solid color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 9%,transparent);
        backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
      }
      .doxa-rich-reader-back{
        width:42px;height:42px;border:0;border-radius:50%;background:transparent;
        color:var(--dh01,var(--d30-text,#eee7dd));font:300 34px/1 Georgia,serif;
      }
      .doxa-rich-reader-label{
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;
        color:color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 72%,transparent);
        font:650 11px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.11em;
        text-transform:uppercase;
      }
      .doxa-rich-reader-scroll{
        position:absolute;inset:0;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;
        padding-top:calc(env(safe-area-inset-top,0px) + 58px);
        background:
          radial-gradient(circle at 50% -10%,color-mix(in srgb,var(--dh09,#bb8d58) 7%,transparent),transparent 27%),
          var(--dh00,var(--d30-bg,#17130f));
      }
      .doxa-rich-reader-shell{width:min(100%,860px);margin:0 auto;padding:22px 20px calc(env(safe-area-inset-bottom,0px) + 70px)}
      .doxa-rich-reader-hero{
        width:100%;aspect-ratio:16/8.2;border-radius:22px;overflow:hidden;
        background-image:var(--home-image);background-size:cover;background-position:center;
        border:1px solid color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 9%,transparent);
        box-shadow:0 18px 55px color-mix(in srgb,#000 20%,transparent);
      }
      .doxa-rich-article{max-width:720px;margin:0 auto;padding:30px 8px 0}
      .doxa-rich-kicker{
        display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin-bottom:11px;
        color:var(--dh81,var(--d30-gold,#c6924e));
        font:750 11px/1.25 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.09em;text-transform:uppercase;
      }
      .doxa-rich-kicker i{width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.6}
      .doxa-rich-article>h1{
        margin:0;color:var(--dh13,var(--d30-text,#eee7dd));
        font:500 clamp(34px,6vw,52px)/1.02 Georgia,'Times New Roman',serif;letter-spacing:-.025em;
      }
      .doxa-rich-sub{
        margin:15px 0 0;color:var(--dh73,var(--d30-muted,#a99e94));
        font:400 18px/1.45 Georgia,'Times New Roman',serif;
      }
      .doxa-rich-source{
        margin-top:20px;padding-bottom:22px;border-bottom:1px solid color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 9%,transparent);
      }
      .doxa-rich-source button{
        border:1px solid color-mix(in srgb,var(--dh81,var(--d30-gold,#c6924e)) 46%,transparent);
        border-radius:999px;background:color-mix(in srgb,var(--dh81,var(--d30-gold,#c6924e)) 7%,transparent);
        color:var(--dh68,var(--d30-gold,#c6924e));padding:10px 15px;
        font:650 12px/1 system-ui,-apple-system,'Segoe UI',sans-serif;
      }
      .doxa-rich-content{
        margin-top:28px;color:var(--dh70,var(--d30-text,#eee7dd));
        font:400 19px/1.72 Georgia,'Times New Roman',serif;overflow-wrap:anywhere;
      }
      .doxa-rich-content p{margin:0 0 1.35em}
      .doxa-rich-content h2,.doxa-rich-content h3,.doxa-rich-content h4{
        color:var(--dh13,var(--d30-text,#eee7dd));letter-spacing:-.015em;
        font-family:Georgia,'Times New Roman',serif;font-weight:600;
      }
      .doxa-rich-content h2{margin:1.85em 0 .65em;font-size:1.62em;line-height:1.12}
      .doxa-rich-content h3{margin:1.6em 0 .55em;font-size:1.3em;line-height:1.18}
      .doxa-rich-content h4{margin:1.45em 0 .5em;font-size:1.08em;line-height:1.22}
      .doxa-rich-content strong,.doxa-rich-content b{font-weight:700;color:color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 94%,var(--dh81,#c6924e))}
      .doxa-rich-content em,.doxa-rich-content i{font-style:italic}
      .doxa-rich-content a{color:var(--dh68,var(--d30-gold,#c6924e));text-decoration-thickness:1px;text-underline-offset:3px}
      .doxa-rich-content mark{background:none;color:#c65d14;font-weight:700;padding:0}
      body[data-doxa30-theme="night"] .doxa-rich-content mark{color:#df9754}
      .doxa-rich-content blockquote{
        margin:1.6em 0;padding:4px 0 4px 20px;border-left:3px solid var(--dh81,var(--d30-gold,#c6924e));
        color:color-mix(in srgb,var(--dh70,var(--d30-text,#eee7dd)) 86%,var(--dh81,#c6924e));
        font-size:1.06em;line-height:1.62;font-style:italic;
      }
      .doxa-rich-content blockquote p:last-child{margin-bottom:0}
      .doxa-rich-content ul,.doxa-rich-content ol{margin:1.15em 0 1.4em;padding-left:1.45em}
      .doxa-rich-content li{margin:.45em 0;padding-left:.2em}
      .doxa-rich-content hr{
        border:0;height:1px;margin:2.2em auto;width:72%;
        background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--dh81,var(--d30-gold,#c6924e)) 58%,transparent),transparent);
      }
      .doxa-rich-content figure{margin:1.8em 0}
      .doxa-rich-content img{
        display:block;width:auto;max-width:100%;height:auto;margin:1.7em auto;border-radius:15px;
        border:1px solid color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 8%,transparent);
      }
      .doxa-rich-content figure img{margin-bottom:.55em}
      .doxa-rich-content figcaption{
        margin:0 auto;color:var(--dh74,var(--d30-muted,#a99e94));text-align:center;
        font:400 12px/1.45 system-ui,-apple-system,'Segoe UI',sans-serif;
      }
      .doxa-rich-content pre,.doxa-rich-content code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
      .doxa-rich-content pre{
        overflow:auto;margin:1.5em 0;padding:15px;border-radius:12px;
        background:color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 6%,transparent);
        font-size:13px;line-height:1.5;
      }
      body.doxa-rich-reader-open{overflow:hidden!important}
      @media(max-width:680px){
        .doxa-rich-reader-shell{padding:12px 14px calc(env(safe-area-inset-bottom,0px) + 52px)}
        .doxa-rich-reader-hero{border-radius:17px;aspect-ratio:16/9.4}
        .doxa-rich-article{padding:24px 5px 0}
        .doxa-rich-article>h1{font-size:36px}
        .doxa-rich-sub{font-size:16px}
        .doxa-rich-content{font-size:18px;line-height:1.68}
        .doxa-rich-content h2{font-size:1.48em}
      }
      @media(prefers-reduced-motion:reduce){.doxa-rich-reader{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function ensureReader(){
    ensureStyles();
    let r=document.getElementById('doxaRichReader');
    if(r)return r;
    r=document.createElement('section');
    r.id='doxaRichReader';
    r.className='doxa-rich-reader';
    r.setAttribute('aria-hidden','true');
    r.innerHTML=`
      <div class="doxa-rich-reader-bar">
        <button class="doxa-rich-reader-back" type="button" aria-label="Voltar">‹</button>
        <span class="doxa-rich-reader-label">Artigo</span><span></span>
      </div>
      <div class="doxa-rich-reader-scroll"><div class="doxa-rich-reader-shell"></div></div>
    `;
    document.body.appendChild(r);
    r.querySelector('.doxa-rich-reader-back').addEventListener('click',closeReader);
    r.addEventListener('click',e=>{
      const btn=e.target.closest('[data-rich-external]');
      if(btn){
        const u=safeWebUrl(btn.dataset.richExternal);
        if(u)window.open(u,'_blank','noopener');
      }
    });
    return r;
  }

  function closeReader(){
    const r=document.getElementById('doxaRichReader');
    if(!r)return;
    r.classList.remove('on');
    r.setAttribute('aria-hidden','true');
    document.body.classList.remove('doxa-rich-reader-open');
  }

  function openRich(x){
    const split=splitArticleHero(x.conteudo_html,x.imagem_url);
    const html=sanitizeHtml(split.html);
    if(!html)return false;
    const r=ensureReader();
    const shell=r.querySelector('.doxa-rich-reader-shell');
    const kind=x.tipo==='noticia'?'Notícia':x.tipo==='destaque'?'Em evidência':'Artigo';
    r.querySelector('.doxa-rich-reader-label').textContent=kind;
    const source=safeWebUrl(x.link_url);
    const hero=split.hero;
    const kicker=[];
    if(x.autor)kicker.push('<span>'+esc(x.autor)+'</span>');
    if(x.meta)kicker.push('<i></i><span>'+esc(x.meta)+'</span>');

    shell.innerHTML=
      (hero?'<div class="doxa-rich-reader-hero" style="--home-image:url(\''+cssUrl(hero)+'\')"></div>':'')
      +'<article class="doxa-rich-article">'
      +(kicker.length?'<div class="doxa-rich-kicker">'+kicker.join('')+'</div>':'')
      +'<h1>'+esc(x.titulo||'')+'</h1>'
      +(x.subtitulo?'<p class="doxa-rich-sub">'+esc(x.subtitulo)+'</p>':'')
      +(source?'<div class="doxa-rich-source"><button type="button" data-rich-external="'+esc(source)+'">Abrir fonte original ›</button></div>':'')
      +'<div class="doxa-rich-content">'+html+'</div>'
      +'</article>';

    const scroll=r.querySelector('.doxa-rich-reader-scroll');
    if(scroll)scroll.scrollTop=0;
    r.classList.add('on');
    r.setAttribute('aria-hidden','false');
    document.body.classList.add('doxa-rich-reader-open');
    return true;
  }

  function intercept(e){
    const el=e.target instanceof Element?e.target:null;
    if(!el)return;
    if(el.closest('[data-like]'))return;

    const target=el.closest('[data-open-item]');
    if(!target)return;
    const x=richItems.get(String(target.dataset.openItem||''));
    if(!x||!String(x.conteudo_html||'').trim())return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    openRich(x);
  }

  function install(){
    readCache();
    document.addEventListener('click',intercept,true);
    window.addEventListener('online',()=>refresh(true));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(false)});
    refresh(false);
    setTimeout(()=>refresh(false),1600);
  }

  window.DoxaRichHome={
    refresh:()=>refresh(true),
    close:closeReader,
    sanitize:sanitizeHtml
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();

/* ============================================================
   Doxa · Coleções de artigos
   - Artigos agrupados deixam de ocupar a Home individualmente.
   - A Home recebe um único card por coleção.
   - Ao abrir a coleção, os artigos aparecem como módulos ordenados.
   - Os módulos continuam abrindo no leitor rico acima.
   ============================================================ */
(()=>{
  'use strict';
  if(window.__doxaArticleCollectionsInstalled)return;
  window.__doxaArticleCollectionsInstalled=true;

  const SB_URL='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const SB_KEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  const HOME_KEY='doxa:home:content:v2';
  const CACHE_KEY='doxa:home:collections:v1';
  const REFRESH_MS=5*60*1000;
  let lastFetch=0,fetching=null,scheduled=false;
  const collections=new Map();
  const modulesByCollection=new Map();

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cssUrl=v=>String(v||'').replace(/["'()\\\s]/g,m=>encodeURIComponent(m));
  const plural=(n,a,b)=>n+' '+(n===1?a:b);

  function readJson(key,def){
    try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??def}catch(e){return def}
  }
  function writeJson(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(e){}}

  function hydrate(data){
    collections.clear();modulesByCollection.clear();
    for(const c of data?.collections||[]){
      if(c?.id)collections.set(String(c.id),c);
    }
    for(const m of data?.modules||[]){
      const cid=String(m?.colecao_id||'');if(!cid)continue;
      if(!modulesByCollection.has(cid))modulesByCollection.set(cid,[]);
      modulesByCollection.get(cid).push(m);
    }
    for(const list of modulesByCollection.values()){
      list.sort((a,b)=>(Number(a.modulo_ordem)||9999)-(Number(b.modulo_ordem)||9999)||String(a.publicado_em||'').localeCompare(String(b.publicado_em||'')));
    }
  }

  function readCache(){
    const c=readJson(CACHE_KEY,null);
    if(!c)return;
    hydrate(c);lastFetch=Number(c.fetchedAt)||0;
  }

  async function sb(path){
    const r=await fetch(SB_URL+path,{headers:{apikey:SB_KEY},cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }

  async function refresh(force=false){
    if(fetching)return fetching;
    if(!force&&lastFetch&&Date.now()-lastFetch<REFRESH_MS){scheduleApply();return}
    fetching=(async()=>{
      try{
        const [cs,ms]=await Promise.all([
          sb('/rest/v1/home_colecoes?select=id,slug,titulo,subtitulo,autor,imagem_url,ordem&publicado=eq.true&order=ordem.asc'),
          sb('/rest/v1/home_itens?select=id,titulo,subtitulo,imagem_url,meta,publicado_em,colecao_id,modulo_ordem&publicado=eq.true&tipo=eq.artigo&colecao_id=not.is.null&order=colecao_id.asc,modulo_ordem.asc&limit=500')
        ]);
        const data={fetchedAt:Date.now(),collections:Array.isArray(cs)?cs:[],modules:Array.isArray(ms)?ms:[]};
        hydrate(data);lastFetch=data.fetchedAt;writeJson(CACHE_KEY,data);
        window.DoxaRichHome?.refresh?.();
        scheduleApply();
      }catch(e){scheduleApply()}
      finally{fetching=null}
    })();
    return fetching;
  }

  function collectionCover(c,list){
    if(c?.imagem_url)return c.imagem_url;
    for(let i=list.length-1;i>=0;i--)if(list[i]?.imagem_url)return list[i].imagem_url;
    return'';
  }

  function synthetic(c,list){
    const n=list.length,latest=list[list.length-1]||{};
    return{
      id:'demo-collection:'+c.id,
      type:'artigo',
      title:c.titulo||'Coleção',
      sub:c.subtitulo||'',
      text:'',
      image:collectionCover(c,list),
      link:'',
      meta:plural(n,'módulo','módulos'),
      likes:0,
      date:latest.publicado_em||'',
      collectionId:c.id
    };
  }

  function applyCollections(){
    const home=readJson(HOME_KEY,null);
    if(!home||!home.remote||!Array.isArray(home.articles)||!collections.size)return;

    const moduleIds=new Set();
    for(const list of modulesByCollection.values())for(const m of list)moduleIds.add(String(m.id));

    const plain=home.articles.filter(x=>{
      const id=String(x?.id||'');
      return !moduleIds.has(id)&&!id.startsWith('demo-collection:');
    });

    const grouped=[...collections.values()]
      .sort((a,b)=>(Number(a.ordem)||100)-(Number(b.ordem)||100))
      .map(c=>synthetic(c,modulesByCollection.get(String(c.id))||[]))
      .filter(x=>Number((modulesByCollection.get(String(x.collectionId))||[]).length)>0);

    const next=[...grouped,...plain];
    const sig=a=>JSON.stringify((a||[]).map(x=>[x.id,x.title,x.sub,x.image,x.meta,x.likes]));
    if(sig(next)===sig(home.articles))return;

    home.articles=next;
    if(window.DoxaHome?.applyContent)window.DoxaHome.applyContent(home);
    else writeJson(HOME_KEY,home);
  }

  function scheduleApply(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;applyCollections()});
  }

  function ensureStyles(){
    if(document.getElementById('doxaCollectionStyles'))return;
    const st=document.createElement('style');st.id='doxaCollectionStyles';st.textContent=`
      .doxa-collection-reader{position:fixed;z-index:91;inset:0;visibility:hidden;opacity:0;pointer-events:none;background:var(--dh00,var(--d30-bg,#17130f));color:var(--dh01,var(--d30-text,#eee7dd));transform:translate3d(12px,0,0);transition:opacity .18s ease,transform .24s cubic-bezier(.2,.8,.2,1),visibility .18s}
      .doxa-collection-reader.on{visibility:visible;opacity:1;pointer-events:auto;transform:none}
      .doxa-collection-bar{position:absolute;z-index:3;left:0;right:0;top:0;min-height:calc(env(safe-area-inset-top,0px) + 58px);padding:env(safe-area-inset-top,0px) 16px 0;display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;background:color-mix(in srgb,var(--dh00,var(--d30-bg,#17130f)) 92%,transparent);border-bottom:1px solid color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 9%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
      .doxa-collection-back{width:42px;height:42px;border:0;border-radius:50%;background:transparent;color:var(--dh01,var(--d30-text,#eee7dd));font:300 34px/1 Georgia,serif}
      .doxa-collection-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;color:color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 72%,transparent);font:650 11px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.11em;text-transform:uppercase}
      .doxa-collection-scroll{position:absolute;inset:0;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding-top:calc(env(safe-area-inset-top,0px) + 58px);background:radial-gradient(circle at 50% -10%,color-mix(in srgb,var(--dh09,#bb8d58) 8%,transparent),transparent 29%),var(--dh00,var(--d30-bg,#17130f))}
      .doxa-collection-shell{width:min(100%,860px);margin:0 auto;padding:18px 16px calc(env(safe-area-inset-bottom,0px) + 70px)}
      .doxa-collection-hero{position:relative;min-height:265px;border-radius:24px;overflow:hidden;background-image:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.86)),var(--collection-image);background-size:cover;background-position:center;border:1px solid color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 10%,transparent);box-shadow:0 20px 56px rgba(0,0,0,.24);display:flex;align-items:flex-end}
      .doxa-collection-hero-copy{width:100%;padding:24px 22px 22px;text-align:left}
      .doxa-collection-hero-copy>small{display:block;margin-bottom:9px;color:#efbd79;font:750 10px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.15em;text-transform:uppercase}
      .doxa-collection-hero-copy h1{margin:0;color:#fff7ed;font:500 34px/1.04 Georgia,'Times New Roman',serif;letter-spacing:-.025em;text-shadow:0 2px 20px rgba(0,0,0,.3)}
      .doxa-collection-hero-copy p{margin:10px 0 0;max-width:620px;color:rgba(255,244,230,.77);font:400 15px/1.45 system-ui,-apple-system,'Segoe UI',sans-serif}
      .doxa-collection-stats{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}
      .doxa-collection-stats span{padding:7px 10px;border-radius:999px;border:1px solid rgba(255,220,175,.2);background:rgba(16,10,6,.42);color:rgba(255,239,218,.86);font:650 11px/1 system-ui,-apple-system,'Segoe UI',sans-serif;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .doxa-collection-modules{max-width:720px;margin:28px auto 0}
      .doxa-collection-modules-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:0 4px 13px}
      .doxa-collection-modules-head h2{margin:0;color:var(--dh13,var(--d30-text,#eee7dd));font:500 29px/1 Georgia,'Times New Roman',serif}
      .doxa-collection-modules-head span{color:var(--dh74,var(--d30-muted,#a99e94));font:600 11px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.08em;text-transform:uppercase}
      .doxa-collection-module{width:100%;border:1px solid color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 9%,transparent);border-radius:19px;background:color-mix(in srgb,var(--dh01,var(--d30-text,#eee7dd)) 3.6%,transparent);padding:0;display:grid;grid-template-columns:104px minmax(0,1fr) 34px;align-items:stretch;overflow:hidden;color:inherit;text-align:left;margin:0 0 12px;box-shadow:0 10px 30px rgba(0,0,0,.08)}
      .doxa-collection-module-img{min-height:104px;background-image:var(--module-image);background-size:cover;background-position:center;position:relative}
      .doxa-collection-module-img b{position:absolute;left:9px;top:9px;min-width:30px;height:26px;padding:0 8px;border-radius:999px;display:grid;place-items:center;background:rgba(5,4,3,.72);border:1px solid rgba(255,219,168,.22);color:#f1c989;font:750 10px/1 system-ui,-apple-system,'Segoe UI',sans-serif;backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
      .doxa-collection-module-copy{padding:15px 13px 14px;min-width:0}
      .doxa-collection-module-copy small{display:block;margin:0 0 5px;color:var(--dh81,var(--d30-gold,#c6924e));font:750 9px/1.15 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.12em;text-transform:uppercase}
      .doxa-collection-module-copy strong{display:block;color:var(--dh13,var(--d30-text,#eee7dd));font:500 20px/1.12 Georgia,'Times New Roman',serif}
      .doxa-collection-module-copy em{display:block;margin-top:7px;color:var(--dh74,var(--d30-muted,#a99e94));font:500 11px/1.3 system-ui,-apple-system,'Segoe UI',sans-serif;font-style:normal}
      .doxa-collection-module-go{display:grid;place-items:center;color:var(--dh68,var(--d30-gold,#c6924e));font:300 29px/1 Georgia,serif}
      .doxa-collection-module:active{transform:scale(.992);background:color-mix(in srgb,var(--dh81,var(--d30-gold,#c6924e)) 7%,transparent)}
      body.doxa-collection-open{overflow:hidden!important}
      @media(max-width:520px){.doxa-collection-shell{padding:12px 12px calc(env(safe-area-inset-bottom,0px) + 54px)}.doxa-collection-hero{min-height:245px;border-radius:19px}.doxa-collection-hero-copy{padding:21px 18px 19px}.doxa-collection-hero-copy h1{font-size:31px}.doxa-collection-module{grid-template-columns:92px minmax(0,1fr) 30px}.doxa-collection-module-img{min-height:100px}.doxa-collection-module-copy strong{font-size:18px}}
      @media(prefers-reduced-motion:reduce){.doxa-collection-reader{transition:none}}
    `;document.head.appendChild(st);
  }

  function ensureReader(){
    ensureStyles();
    let r=document.getElementById('doxaCollectionReader');if(r)return r;
    r=document.createElement('section');r.id='doxaCollectionReader';r.className='doxa-collection-reader';r.setAttribute('aria-hidden','true');
    r.innerHTML='<div class="doxa-collection-bar"><button class="doxa-collection-back" type="button" aria-label="Voltar">‹</button><span class="doxa-collection-label">Coleção</span><span></span></div><div class="doxa-collection-scroll"><div class="doxa-collection-shell"></div></div>';
    document.body.appendChild(r);
    r.querySelector('.doxa-collection-back').addEventListener('click',closeCollection);
    return r;
  }

  function closeCollection(){
    const r=document.getElementById('doxaCollectionReader');if(!r)return;
    r.classList.remove('on');r.setAttribute('aria-hidden','true');document.body.classList.remove('doxa-collection-open');
  }

  function moduleHtml(m,idx){
    const img=m.imagem_url||'';
    const meta=m.meta||'';
    return '<button class="doxa-collection-module" type="button" data-open-item="'+esc(m.id)+'">'
      +'<span class="doxa-collection-module-img"'+(img?' style="--module-image:url(\''+cssUrl(img)+'\')"':'')+'><b>'+(Number(m.modulo_ordem)||idx+1)+'</b></span>'
      +'<span class="doxa-collection-module-copy"><small>Módulo '+(Number(m.modulo_ordem)||idx+1)+'</small><strong>'+esc(m.titulo||'')+'</strong>'+(meta?'<em>◷ &nbsp;'+esc(meta)+'</em>':'')+'</span>'
      +'<span class="doxa-collection-module-go">›</span></button>';
  }

  async function openCollection(id){
    const c=collections.get(String(id));if(!c)return;
    await window.DoxaRichHome?.refresh?.();
    const list=modulesByCollection.get(String(id))||[];
    const r=ensureReader(),shell=r.querySelector('.doxa-collection-shell'),cover=collectionCover(c,list),n=list.length;
    r.querySelector('.doxa-collection-label').textContent=c.titulo||'Coleção';
    shell.innerHTML='<div class="doxa-collection-hero"'+(cover?' style="--collection-image:url(\''+cssUrl(cover)+'\')"':'')+'><div class="doxa-collection-hero-copy"><small>Curso em módulos</small><h1>'+esc(c.titulo||'')+'</h1>'+(c.subtitulo?'<p>'+esc(c.subtitulo)+'</p>':'')+'<div class="doxa-collection-stats"><span>'+plural(n,'módulo','módulos')+'</span>'+(c.autor?'<span>'+esc(c.autor)+'</span>':'')+'</div></div></div>'
      +'<div class="doxa-collection-modules"><div class="doxa-collection-modules-head"><h2>Módulos</h2><span>'+plural(n,'aula','aulas')+'</span></div>'+list.map(moduleHtml).join('')+'</div>';
    const sc=r.querySelector('.doxa-collection-scroll');if(sc)sc.scrollTop=0;
    r.classList.add('on');r.setAttribute('aria-hidden','false');document.body.classList.add('doxa-collection-open');
  }

  function intercept(e){
    const el=e.target instanceof Element?e.target:null;if(!el)return;
    const target=el.closest('[data-open-item^="demo-collection:"]');if(!target)return;
    const raw=String(target.dataset.openItem||'');const id=raw.slice('demo-collection:'.length);if(!id)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();openCollection(id);
  }

  function install(){
    readCache();ensureStyles();
    document.addEventListener('click',intercept,true);
    const mo=new MutationObserver(scheduleApply);mo.observe(document.documentElement,{subtree:true,childList:true});
    window.addEventListener('online',()=>refresh(true));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(false)});
    refresh(false);setTimeout(scheduleApply,300);setTimeout(()=>refresh(false),1800);
  }

  window.DoxaCollections={refresh:()=>refresh(true),open:openCollection,close:closeCollection};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

