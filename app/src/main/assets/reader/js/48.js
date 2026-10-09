(()=>{
  'use strict';
  /* Doxa 62 · ATLAS do Pentateuco (Gênesis a Deuteronômio)
     Modo de leitura (entra por Ferramentas › Explorar o texto). Enquanto se rola o texto, sobe um cartão
     de até meia tela com o mapa: onde a passagem acontece e o trajeto. Nos trechos de viagem, o ponto
     anda junto com a leitura ou percorre o trecho sozinho ao chegar. Os lugares citados no versículo da
     linha de leitura acendem no mapa e aparecem em botões no alto do mapa.
     Os dados (mapa, ~300 lugares, ~260 cenas) ficam em js/48d.js e só são carregados ao ligar o Atlas.

     Rotas:
       • Pela Arábia (destaque): Paulo — “Agar é o monte Sinai, na Arábia” (Gl 4:25); Moisés chega ao
         Horebe vindo de Midiã (Êx 3:1). Monte Sinai = Jabal al-Lawz; travessia de Nuweiba à costa de
         Midiã, no golfo de Ácaba (o “mar Vermelho” de 1Rs 9:26). Lugares sem identificação firme ficam
         marcados como aproximados.
       • Tradicional (opcional, em Rotas): Jebel Musa, no sul da península do Sinai.

     Dados: litoral, lagos e rios de Natural Earth (domínio público); identificações dos lugares e os
     traçados do Arnom, Zerede, Jaboque e ribeiro do Egito de OpenBible.info Bible Geocoding Data
     (CC BY 4.0; traçados © OpenStreetMap); as da rota pela Arábia segundo seus defensores (Wyatt,
     Cornuke, Möller, Fritz). Projeção: x = (lon−16)·cos31°·100, y = (45−lat)·100.
     Citações conferidas palavra por palavra com a Almeida 1819 (Bíblia Livre).
     Numeração da Almeida (a mesma da KJV); no hebraico, o verso é convertido por DoxaVersif. */
  if(window.__doxa62AtlasInstalled)return;
  window.__doxa62AtlasInstalled=true;


  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const NT=new Set(['Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev']);
  const ABBR={Gen:'Gn',Exod:'Êx',Lev:'Lv',Num:'Nm',Deut:'Dt',Josh:'Js','1Kgs':'1Rs','2Chr':'2Cr',Acts:'At',Gal:'Gl',Heb:'Hb'};
  const BOOKS=['Gen','Exod','Lev','Num','Deut'];
  const NS='http://www.w3.org/2000/svg';
  const SVG_ATLAS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4.6 3.8 6.7v12.7L9 17.3l6 2.1 5.2-2.1V4.6L15 6.7z"/><path d="M9 4.6v12.7M15 6.7v12.7"/></svg>';
  const SVG_LAYERS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 4 8.5 4.6L12 13.2 3.5 8.6z"/><path d="m3.5 12.4 8.5 4.6 8.5-4.6"/><path d="m3.5 16.2 8.5 4.6 8.5-4.6"/></svg>';
  const SVG_DOWN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>';
  const SVG_FIT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/></svg>';
  const AREA=new Set(['region','sea','river','people','tribe','road']);
  // estações da rota do Êxodo sempre presentes em Êxodo–Deuteronômio
  const EXO_BASE=['ramesses','sucote','eta','pihairote','margem','mara','elim','sim','refidim','sinai','midia'];
  const CHAIN_BASE={Exod:EXO_BASE,Lev:EXO_BASE,Num:EXO_BASE.concat(['tabera','quibrote','hazerote','cades','hor','elate','eziomgeber','obote','ijeabarim','zerede','arnom','hesbom','campinas','nebo','jerico'])};
  CHAIN_BASE.Deut=CHAIN_BASE.Num;
  // até onde a rota “a seguir” aparece em cada livro (Êxodo e Levítico: só até o Sinai)
  const NEXT_LIMIT={Exod:9,Lev:9};

  /* ================= DADOS (carregados ao ligar o Atlas: js/48d.js) ================= */
  let D=null,PL=null,MAIN=null,LEG={},loading=null;
  const B={};   // por livro: cenas, contagem corrida dos versos, lugares citados por verso
  function prep(raw){
    D=raw;PL=D.pl;MAIN=D.main;
    // trechos: curva suave (Catmull-Rom) em pontos densos, com o comprimento acumulado
    for(const id in D.rt){
      const p=D.rt[id].p,pts=[];
      for(let i=0;i<p.length-1;i++){
        const a=p[i-1]||p[i],b=p[i],c=p[i+1],d=p[i+2]||c;const n=p.length===2?2:9;
        for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;
          pts.push([0,1].map(j=>0.5*((2*b[j])+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t2+(-a[j]+3*b[j]-3*c[j]+d[j])*t3)))}
      }
      pts.push(p[p.length-1]);
      const len=[0];for(let i=1;i<pts.length;i++)len.push(len[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
      LEG[id]={id,k:D.rt[id].k,pts,len,L:len[len.length-1]||1};
    }
    for(const id in PL){const p=PL[id];p.id=id;p.r=p.r||[]}
    for(const bk of BOOKS){
      const bd=D.books[bk];if(!bd)continue;
      const ORD=[0];for(let c=1;c<bd.exl.length;c++)ORD[c]=ORD[c-1]+(bd.exl[c-1]||0);
      const ord=(c,v)=>(ORD[c]||0)+v;
      bd.sc.forEach((s,i)=>{[s.c1,s.v1]=s.a.split(':').map(Number);[s.c2,s.v2]=s.b.split(':').map(Number);s.o1=ord(s.c1,s.v1);s.o2=ord(s.c2,s.v2);s.i=i;s.bk=bk});
      B[bk]={sc:bd.sc,ord,men:new Map()};
    }
    // índice: versículo → lugares citados
    for(const id in PL)for(const r of PL[id].r){const m=r.match(/^(\S+) (\d+):(\d+)$/);if(!m||!B[m[1]])continue;
      const o=B[m[1]].ord(+m[2],+m[3]);const a=B[m[1]].men.get(o);if(a){if(!a.includes(id))a.push(id)}else B[m[1]].men.set(o,[id])}
    return D;
  }
  function loadData(){
    if(D)return Promise.resolve(D);
    if(window.__DOXA_ATLAS_D)return Promise.resolve(prep(window.__DOXA_ATLAS_D));
    if(loading)return loading;
    loading=new Promise((res,rej)=>{const s=document.createElement('script');s.src='js/48d.js';s.async=true;
      s.onload=()=>{try{res(prep(window.__DOXA_ATLAS_D))}catch(e){rej(e)}};s.onerror=()=>{loading=null;rej(new Error('atlas'))};document.head.appendChild(s)});
    return loading;
  }
  const tgt=id=>{const p=PL[id];return p&&p.al?PL[p.al]:p};   // nome do texto → lugar do mapa
  function sceneIdx(bk,c,v){const b=B[bk],o=b.ord(c,v),S=b.sc;let lo=0,hi=S.length-1,best=0;while(lo<=hi){const m=(lo+hi)>>1;if(S[m].o1<=o){best=m;lo=m+1}else hi=m-1}return best}
  function cut(leg,f){
    const t=Math.max(0,Math.min(1,f))*leg.L;let i=1;while(i<leg.pts.length-1&&leg.len[i]<t)i++;
    const a=leg.pts[i-1],b=leg.pts[i],seg=(leg.len[i]-leg.len[i-1])||1,u=Math.max(0,Math.min(1,(t-leg.len[i-1])/seg));
    const h=[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
    return{pts:leg.pts.slice(0,i).concat([h]),head:h};
  }
  const nice=n=>n&&n===n.toUpperCase()&&/[A-ZÀ-Ý]{2}/.test(n)?n.charAt(0)+n.slice(1).toLowerCase():n;
  const bookName=b=>(typeof BOOK_NAMES!=='undefined'&&BOOK_NAMES[b])||b;
  const refLabel=r=>{const m=String(r).match(/^(\S+) (\d+):(\d+)$/);return m?((ABBR[m[1]]||bookName(m[1]))+' '+m[2]+':'+m[3]):r};
  const scRef=s=>ABBR[s.bk]+' '+(s.c1===s.c2?(s.c1+':'+s.v1+(s.v2!==s.v1?'–'+s.v2:'')):(s.c1+':'+s.v1+'–'+s.c2+':'+s.v2));

  /* ================= VERSÕES ================= */
  const versif=()=>window.DoxaVersif;
  function readerRef(el){
    try{
      if(typeof mode==='undefined'||mode==='hyper'||!CORPORA[mode])return null;
      const v=Number(String(el.id||'').replace(/^v/,''));if(!v)return null;
      const p=pos(),b=CORPORA[mode].books[p.b];let c=Number(p.c),vv=v;
      if(mode==='wlc'&&versif()){const r=versif().toPt(b.book,c,vv);if(!r)return null;c=r.chapter;vv=r.verse}
      return{book:b.book,c,v:vv};
    }catch(e){return null}
  }

  /* ================= ESTADO ================= */
  let on=false;
  const st={S:null,min:false,trad:false,user:false,f:0,fT:0,autoT:0,away:false,hideT:0,pop:'',vo:-1,hits:new Set(),allRefs:''};
  try{st.trad=localStorage.getItem('doxa:atlas:trad')==='1'}catch(e){}
  const V={s:1,tx:0,ty:0,W:0,H:0};
  let anim=null,raf=0,drawRaf=0;
  const R={};   // elementos do mapa
  let items={routes:[],pins:[],labels:[],walkers:[]};

  /* ================= O CARTÃO ================= */
  function sheet(){
    let s=$('atlasSheet');if(s)return s;
    s=document.createElement('section');s.id='atlasSheet';s.className='atlas-sheet';s.setAttribute('aria-label','Atlas');
    s.innerHTML='<div class="atlas-grip" aria-hidden="true"><i></i></div>'
      +'<div class="atlas-head"><div class="atlas-titles"><span class="atlas-ref"></span><strong class="atlas-title"></strong></div>'
      +'<button type="button" class="atlas-hbtn atlas-rbtn" aria-label="Rotas" aria-expanded="false">'+SVG_LAYERS+'<span>Rotas</span></button>'
      +'<button type="button" class="atlas-hbtn atlas-min" aria-label="Recolher">'+SVG_DOWN+'</button></div>'
      +'<p class="atlas-note"></p>'
      +'<div class="atlas-map"><svg class="atlas-base" xmlns="'+NS+'" aria-hidden="true"></svg><svg class="atlas-svg" xmlns="'+NS+'" role="img" aria-label="Mapa"></svg>'
      +'<div class="atlas-chips" hidden></div>'
      +'<div class="atlas-ctrl"><button type="button" data-z="in" aria-label="Aproximar">+</button><button type="button" data-z="out" aria-label="Afastar">−</button><button type="button" data-z="fit" aria-label="Centralizar a cena">'+SVG_FIT+'</button></div>'
      +'<div class="atlas-scale" aria-hidden="true"><i></i><span></span></div>'
      +'<div class="atlas-credit">Natural Earth · OpenBible · OSM</div>'
      +'<div class="atlas-pop" hidden></div>'
      +'<div class="atlas-layers" hidden><div class="atlas-lh">Rotas do Êxodo</div>'
      +'<div class="atlas-lrow main"><i></i><span><b>Pela Arábia · em destaque</b><small>Monte Sinai em Midiã: “o monte Sinai, na Arábia” (Gl 4:25)</small></span></div>'
      +'<label class="atlas-lrow trad"><i></i><span><b>Tradicional</b><small>Jebel Musa, no sul da península do Sinai</small></span><input type="checkbox" class="atlas-trad" role="switch"><em aria-hidden="true"></em></label>'
      +'<div class="atlas-legend"><span class="lg done">percorrido</span><span class="lg next">a seguir</span><span class="lg pat">patriarcas · Moisés</span><span class="lg side">outros caminhos</span><span class="lg army">exércitos inimigos</span><span class="lg hit">citado no versículo</span></div>'
      +'<p class="atlas-lfoot">Lugares sem identificação firme aparecem como aproximados ou incertos. Mapa: Natural Earth. Lugares: OpenBible.info (CC BY 4.0); rios da Transjordânia © colaboradores do OpenStreetMap.</p></div>'
      +'</div>'
      +'<div class="atlas-away"><span></span><button type="button" class="atlas-go">Abrir Gênesis</button></div>';
    document.body.appendChild(s);
    s.querySelector('.atlas-min').addEventListener('click',()=>setMin(!st.min));
    s.querySelector('.atlas-note').addEventListener('click',e=>e.currentTarget.classList.toggle('open'));
    s.querySelector('.atlas-go').addEventListener('click',()=>goVerse('Gen',1,1));
    const lb=s.querySelector('.atlas-rbtn'),ly=s.querySelector('.atlas-layers');
    lb.addEventListener('click',()=>{if(st.min)setMin(false);const o=ly.hidden;ly.hidden=!o;lb.setAttribute('aria-expanded',String(o));lb.classList.toggle('on',o);closePop()});
    const tr=s.querySelector('.atlas-trad');tr.checked=st.trad;
    tr.addEventListener('change',()=>{st.trad=tr.checked;try{localStorage.setItem('doxa:atlas:trad',st.trad?'1':'0')}catch(e){}
      buildOverlay();fitScene(true)});
    s.querySelector('.atlas-ctrl').addEventListener('click',e=>{const b=e.target.closest('[data-z]');if(!b)return;
      const z=b.dataset.z;if(z==='fit'){st.user=false;fitScene(true);return}
      st.user=true;const k=z==='in'?1.8:1/1.8;const cx=(V.W/2-V.tx)/V.s,cy=(V.H/2-V.ty)/V.s;flyTo(cx,cy,clampS(V.s*k),260)});
    s.querySelector('.atlas-pop').addEventListener('click',e=>{
      if(e.target.closest('.atlas-pop-x')){closePop();return}
      if(e.target.closest('.atlas-pop-more')){openPop(st.pop,true);return}
      const r=e.target.closest('[data-ref]');if(r){const m=r.dataset.ref.match(/^(\S+) (\d+):(\d+)$/);if(m){closePop();goVerse(m[1],+m[2],+m[3])}}});
    s.querySelector('.atlas-chips').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(!b)return;focusPlace(b.dataset.id)});
    // alça: arrastar para baixo recolhe; para cima abre
    let y0=null,x0=0;const grip=s.querySelector('.atlas-grip'),head=s.querySelector('.atlas-head');
    [grip,head].forEach(el=>{
      el.addEventListener('touchstart',e=>{if(e.target.closest('button'))return;y0=e.touches[0].clientY;x0=e.touches[0].clientX},{passive:true});
      el.addEventListener('touchend',e=>{if(y0==null)return;const dy=e.changedTouches[0].clientY-y0,dx=e.changedTouches[0].clientX-x0;y0=null;
        if(Math.abs(dy)<Math.abs(dx)*1.5)return;if(dy>36)setMin(true);else if(dy<-36)setMin(false)},{passive:true});
    });
    grip.addEventListener('click',()=>setMin(!st.min));
    const map=s.querySelector('.atlas-map');
    if('ResizeObserver' in window)new ResizeObserver(()=>measure(true)).observe(map);
    if('MutationObserver' in window)new MutationObserver(placeSheet).observe(document.body,{attributes:true,attributeFilter:['data-doxa30-theme']});
    return s;
  }
  function setMin(v){st.min=!!v;const s=$('atlasSheet');if(!s)return;s.classList.toggle('min',st.min);
    if(!st.min){requestAnimationFrame(()=>{measure(false);if(!st.user)fitScene(false);draw()})}else{closePop();const ly=s.querySelector('.atlas-layers');if(ly){ly.hidden=true;s.querySelector('.atlas-rbtn')?.classList.remove('on')}}}
  function placeSheet(){
    const s=$('atlasSheet');if(!s)return;
    const w=document.querySelector('.doxa30-bottom-wrap');const h=w&&w.offsetHeight?w.offsetHeight+4:96;
    if(s._h!==h){s._h=h;s.style.setProperty('--cb',h+'px')}
    // tema claro ou escuro: pela luminância do painel (só recalcula quando o tema muda)
    const tk=document.body.dataset.doxa30Theme||'-';
    if(s._tone!==tk){s._tone=tk;s.classList.toggle('light',lum(getComputedStyle(document.documentElement).getPropertyValue('--d30-panel'))>0.5)}
  }
  function lum(c){
    c=String(c||'').trim();let m=c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i),r,g,b;
    if(m){let h=m[1];if(h.length===3)h=h.replace(/./g,x=>x+x);r=parseInt(h.slice(0,2),16);g=parseInt(h.slice(2,4),16);b=parseInt(h.slice(4,6),16)}
    else if((m=c.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i))){r=+m[1];g=+m[2];b=+m[3]}
    else return 0;
    return (0.2126*r+0.7152*g+0.0722*b)/255;
  }
  function hideSheet(now){
    clearTimeout(st.hideT);
    const go=()=>{const s=$('atlasSheet');if(s)s.classList.remove('on');document.body.classList.remove('atlas-sheet-on');closePop()};
    if(now)go();else st.hideT=setTimeout(go,650);
  }
  function openSheet(){
    clearTimeout(st.hideT);const s=sheet();placeSheet();
    if(!s.classList.contains('on')){s.classList.add('on');s.classList.toggle('min',st.min);document.body.classList.add('atlas-sheet-on');return true}
    return false;
  }
  function setAway(msg,btn){
    const s=sheet();const opened=openSheet();
    s.classList.add('away');s.querySelector('.atlas-ref').textContent='Atlas';s.querySelector('.atlas-title').textContent=msg[0];
    s.querySelector('.atlas-away span').textContent=msg[1];const g=s.querySelector('.atlas-go');g.hidden=!btn;closePop();
    if(!st.away||opened){st.away=true}
  }

  /* ================= O MAPA ================= */
  function mk(tag,attrs,parent){const e=document.createElementNS(NS,tag);if(attrs)for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
  // o mapa-base fica num SVG próprio (camada separada): o ponto que anda e os rótulos não obrigam a redesenhar o litoral
  function buildSvg(svg){
    if(R.svg)return;
    R.svg=svg;const base=svg.parentNode.querySelector('.atlas-base');R.base=base;
    R.sea=mk('rect',{class:'atlas-sea',x:0,y:0,width:'100%',height:'100%'},base);
    R.world=mk('g',{class:'atlas-world'},base);
    mk('path',{class:'atlas-land',d:D.land},R.world);
    mk('image',{class:'atlas-green',href:D.green,x:0,y:0,width:D.w,height:D.h,preserveAspectRatio:'none'},R.world);
    mk('path',{class:'atlas-coast',d:D.coast},R.world);
    mk('path',{class:'atlas-lake',d:D.lakes},R.world);
    for(const k in D.riv)mk('path',{class:'atlas-river rv-'+k,d:D.riv[k]},R.world);
    R.routes=mk('g',{class:'atlas-routes'},svg);
    R.pins=mk('g',{class:'atlas-pins'},svg);
    R.labels=mk('g',{class:'atlas-labels'},svg);
    bindGestures(svg);
  }
  function measure(keep){
    const map=document.querySelector('#atlasSheet .atlas-map');if(!map||!D)return;
    const W=map.clientWidth,H=map.clientHeight;if(!W||!H)return;
    if(W===V.W&&H===V.H)return;
    const had=V.W>0;
    if(had&&keep){const cx=(V.W/2-V.tx)/V.s,cy=(V.H/2-V.ty)/V.s;V.W=W;V.H=H;V.tx=W/2-V.s*cx;V.ty=H/2-V.s*cy;clampView()}
    else{V.W=W;V.H=H}
    if(!st.user&&st.S)fitScene(false);else dirty();
  }
  const sMin=()=>Math.max(V.W/D.w,V.H/D.h);
  const S_MAX=16;
  const clampS=s=>Math.max(sMin(),Math.min(S_MAX,s));
  function clampView(){
    V.s=clampS(V.s);
    V.tx=Math.min(0,Math.max(V.W-V.s*D.w,V.tx));
    V.ty=Math.min(0,Math.max(V.H-V.s*D.h,V.ty));
  }
  function setCenter(cx,cy,s){V.s=s;V.tx=V.W/2-s*cx;V.ty=V.H/2-s*cy;clampView()}
  // voo curto: centro em linha reta, zoom em escala logarítmica
  function flyTo(cx,cy,s,dur){
    if(!V.W)return;
    const c0=[(V.W/2-V.tx)/V.s,(V.H/2-V.ty)/V.s],s0=V.s;
    const keep={s:V.s,tx:V.tx,ty:V.ty};setCenter(cx,cy,s);const c1=[(V.W/2-V.tx)/V.s,(V.H/2-V.ty)/V.s],s1=V.s;Object.assign(V,keep);
    if(!dur||matchMedia('(prefers-reduced-motion: reduce)').matches){setCenter(c1[0],c1[1],s1);draw();return}
    // viagens longas fazem um pequeno arco de zoom (afasta, anda, aproxima)
    const far=Math.hypot(c1[0]-c0[0],c1[1]-c0[1])*Math.max(s0,s1)/Math.max(V.W,V.H);
    anim={c0,c1,s0,s1,t0:performance.now(),dur:dur*(far>2?1.35:1),arc:far>2?Math.min(0.75,Math.log(far)/2.2):0};loop();
  }
  function stopAnim(){anim=null}
  // caixa da cena; os nomes de regiões entram pela largura do rótulo (em pixels, convertidos pela escala s)
  function sceneBox(S,s){
    const xs=[],ys=[];const add=(x,y)=>{xs.push(x);ys.push(y)};
    const addId=id=>{const p=tgt(id);if(p&&!p.nl&&p.x!=null){add(p.x,p.y);if(s&&AREA.has(p.k)){const hw=(p.n.length*7+8)/s;
        if(p.an==='end')add(p.x-2*hw,p.y);else{add(p.x-hw,p.y);add(p.x+hw,p.y)}}}
      else if(LEG[id])LEG[id].pts.forEach(p=>add(p[0],p[1]))};
    const ids=(S.fit||[]).concat(S.pins||[]);
    ids.forEach(addId);
    if(st.trad&&S.done>=0){ids.forEach(id=>{if(D.twin[id])addId(D.twin[id]);if(D.tradof[id])addId(D.tradof[id])});
      if(S.leg&&D.tradof[S.leg])addId(D.tradof[S.leg])}
    if(!xs.length)return{x0:0,y0:0,x1:D.w,y1:D.h};
    let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const ms=S.minspan||64;
    if(x1-x0<ms){const c=(x0+x1)/2;x0=c-ms/2;x1=c+ms/2}
    if(y1-y0<ms*0.8){const c=(y0+y1)/2;y0=c-ms*0.4;y1=c+ms*0.4}
    return{x0,y0,x1,y1};
  }
  function fitScene(animate){
    const S=st.S;if(!S||!V.W)return;
    // margens: à direita ficam os botões; em cima, os lugares do versículo; embaixo, a escala
    const pl=Math.min(34,V.W*0.09),pr=58,pt=50,pb=32;
    const sOf=b=>clampS(Math.min((V.W-pl-pr)/(b.x1-b.x0),(V.H-pt-pb)/(b.y1-b.y0)));
    let b=sceneBox(S),s=sOf(b);b=sceneBox(S,s);s=sOf(b);b=sceneBox(S,s);s=sOf(b);
    const cx=(b.x0+b.x1)/2+(pr-pl)/2/s,cy=(b.y0+b.y1)/2+(pb-pt)/2/s;
    flyTo(cx,cy,s,animate?760:0);
  }
  function focusPlace(id){
    const p=PL[id];if(!p)return;const t=tgt(id);
    if(t&&!t.nl&&t.x!=null){st.user=true;const s=Math.max(V.s,Math.min(S_MAX,4));
      const visible=sx(t.x)>40&&sx(t.x)<V.W-60&&sy(t.y)>50&&sy(t.y)<V.H-40;
      if(!visible||V.s<2)flyTo(t.x,t.y,visible?V.s:s,520)}
    openPop(id);
  }

  /* ---------- camadas da cena ---------- */
  const TWIN_NAME=new Set(['pihairote_t','mara_t','elim_t','refidim_t','sim_t','dofca_t','alus_t','tabera_t','quibrote_t','hazerote_t']);
  function sceneMentions(S){
    if(S._men)return S._men;const b=B[S.bk],set=new Set();
    for(let o=S.o1;o<=S.o2;o++){const a=b.men.get(o);if(a)for(const id of a)set.add(id)}
    return S._men=set;
  }
  function visibleIds(S){
    const vis=new Set(),add=id=>{const p=tgt(id);if(p&&!p.nl&&p.x!=null)vis.add(p.id)};
    const chain=S.done>=0;
    // sempre: as grandes regiões, mares e rios; em Êxodo–Deuteronômio, também as cidades principais do livro
    for(const id in PL){const p=PL[id];if(p.al||p.nl||p.l==='t'||p.p>1)continue;
      if(AREA.has(p.k)?p.k!=='people'&&p.k!=='tribe':(chain&&p.r.some(r=>r.startsWith(S.bk+' '))))vis.add(id)}
    if(chain)(CHAIN_BASE[S.bk]||[]).forEach(add);
    (S.pins||[]).forEach(add);(S.show||[]).forEach(add);(S.fit||[]).forEach(add);
    sceneMentions(S).forEach(add);
    if(st.trad&&chain)for(const id in PL)if(PL[id].l==='t')vis.add(id);
    if(!chain)for(const id of [...vis])if(PL[id].l==='a')vis.delete(id);
    return vis;
  }
  function buildOverlay(){
    if(!R.svg)return;
    const S=st.S;
    R.routes.textContent='';R.pins.textContent='';R.labels.textContent='';
    items={routes:[],pins:[],labels:[],walkers:[]};
    for(const k of ['nile','eufr','tigre','jordao','sangue'])R.base.classList.toggle('hl-'+k,!!(S&&S.hl&&S.hl.includes(k)));
    if(!S){draw();return}
    const done=S.done,cur=S.leg;
    const layers=[[],[],[],[],[]];  // a seguir · tradicional · percorrido · outros · em movimento
    if(done>=0){
      const lim=NEXT_LIMIT[S.bk]??MAIN.length;
      MAIN.forEach((id,i)=>{const m=id===cur?'cur':i<done?'done':'next';if(m==='next'&&i>=lim)return;layers[m==='next'?0:m==='done'?2:4].push([id,LEG[id].k,m])});
      if(st.trad)MAIN.forEach((id,i)=>{const t=D.tradof[id];if(!t)return;const m=id===cur?'cur':i<done?'done':'next';if(m==='next'&&i>=lim)return;layers[m==='cur'?4:1].push([t,'trad',m])});
    }
    (S.trail||[]).forEach(id=>layers[2].push([id,LEG[id].k,'done']));
    if(cur&&!(done>=0&&MAIN.includes(cur)))layers[4].push([cur,LEG[cur].k,'cur']);
    (S.also||[]).forEach(id=>layers[3].push([id,LEG[id].k,'also']));
    for(const L of layers)for(const [id,k,m] of L){
      const leg=LEG[id];if(!leg)continue;
      if(m==='cur'){
        const base=mk('path',{class:'r r-'+k+' base'},R.routes),prog=mk('path',{class:'r r-'+k+' prog'},R.routes);
        const w=mk('g',{class:'atlas-walker w-'+k},R.routes);mk('circle',{class:'halo',r:11,cx:0,cy:0},w);mk('circle',{class:'core',r:5.2,cx:0,cy:0},w);
        items.routes.push({leg,el:base});items.walkers.push({leg,prog,w});
      }else{
        const el=mk('path',{class:'r r-'+k+' '+m},R.routes);items.routes.push({leg,el});
        if(k==='phil')items.labels.push(labelItem('phil',null,'caminho dos filisteus','note',1,leg.pts[Math.floor(leg.pts.length*0.55)]));
      }
    }
    // lugares
    const pins=new Set((S.pins||[]).map(id=>tgt(id)?.id)),show=new Set((S.show||[]).map(id=>tgt(id)?.id)),lbl=S.lbl||{};
    for(const id of visibleIds(S)){
      const p=PL[id];if(p.l==='t'&&!st.trad)continue;
      const em=pins.has(id),sh=show.has(id);
      let name=lbl[id]||p.n;if(TWIN_NAME.has(id))name+=' (trad.)';
      if(AREA.has(p.k)){items.labels.push(labelItem(id,p,name,'area '+p.k+(em?' em':sh?' sh':'')+(p.l==='t'?' trad':'')+(p.k==='region'&&name!==name.toUpperCase()?' small':''),em?-1:sh?0.5:p.p,[p.x,p.y]));continue}
      const g=mk('g',{class:'pin k-'+p.k+(em?' em':'')+(p.l==='t'?' trad':'')},R.pins);
      if(em)mk('circle',{class:'halo',r:12,cx:0,cy:0},g);
      if(p.k==='mount')mk('path',{class:'glyph',d:em?'M0 -8.5L8 5.5H-8z':'M0 -6L5.6 4H-5.6z'},g);
      else mk('circle',{class:'glyph',r:em?5.6:(p.k==='site'?3.6:3.4),cx:0,cy:0},g);
      items.pins.push({id,p,g,em});
      items.labels.push(labelItem(id,p,name,'place'+(em?' em':'')+(p.l==='t'?' trad':''),em?-1:(sh?0.5:p.p),[p.x,p.y],true,em&&p.q));
    }
    for(const L of items.labels)R.labels.appendChild(L.el);
    ovDirty=true;applyHits(true);
  }
  // rótulo; nos lugares em destaque, uma 2ª linha com a identificação (ex.: Jabal al-Lawz)
  function labelItem(id,p,text,cls,pri,xy,pin,q){
    const el=mk('text',{class:'lab '+cls});let t2=null;
    if(q){mk('tspan',{},el).textContent=text;t2=mk('tspan',{class:'q',dy:'13'},el);t2.textContent=q}else el.textContent=text;
    const big=/\bem\b/.test(cls),up=text===text.toUpperCase()&&/region|tribe/.test(cls);
    const fs=big?13:(/region|tribe|people/.test(cls)?(up?11:11.5):12);
    const ls=up?0.17*fs:0;
    const cw=/people|road|sea|river|small/.test(cls)?0.6:0.56;
    const w=Math.max(text.length*fs*cw+text.length*ls,q?q.length*10.5*0.55:0),h=fs*1.15+(q?13:0);
    return{id,el,t2,pri,base:pri,x:xy[0],y:xy[1],w,h,pin:!!pin,fs,ex:q?13:0,an:p&&p.an};
  }

  /* ---------- os lugares do versículo ---------- */
  function setVerse(S,o){
    if(st.vo===S.bk+o)return;st.vo=S.bk+o;
    const ids=(B[S.bk].men.get(o)||[]).slice();
    // ordem: como aparecem no texto não temos; os do mapa primeiro, depois os sem lugar
    ids.sort((a,b)=>(PL[a].nl?1:0)-(PL[b].nl?1:0));
    st.hits=new Set(ids.map(id=>tgt(id)).filter(p=>p&&!p.nl).map(p=>p.id));
    const box=document.querySelector('#atlasSheet .atlas-chips');
    if(box){
      if(!ids.length){box.hidden=true;box.innerHTML=''}
      else{box.hidden=false;box.innerHTML='<span class="atlas-chips-h">'+(st.ref?st.ref.c+':'+st.ref.v:'')+'</span>'
        +ids.map(id=>'<button type="button" data-id="'+esc(id)+'"'+(PL[id].nl?' class="nl"':'')+'>'+esc(nice(PL[id].n))+'</button>').join('')}
    }
    applyHits(false);
  }
  function applyHits(rebuilt){
    for(const P of items.pins)P.g.classList.toggle('hit',st.hits.has(P.id));
    for(const L of items.labels){const h=st.hits.has(L.id);L.el.classList.toggle('hit',h);L.pri=h&&L.base>=0?-0.5:L.base}
    items.labels.sort((a,b)=>a.pri-b.pri);
    dirty();
  }

  /* ---------- desenho ---------- */
  const sx=x=>V.tx+V.s*x,sy=y=>V.ty+V.s*y;
  const dPath=pts=>{let d='';for(let i=0;i<pts.length;i++)d+=(i?'L':'M')+sx(pts[i][0]).toFixed(1)+' '+sy(pts[i][1]).toFixed(1);return d};
  let lastView='',ovDirty=true;
  const dirty=()=>{ovDirty=true;draw()};
  function draw(){if(drawRaf)return;drawRaf=requestAnimationFrame(()=>{drawRaf=0;render()})}
  function render(){
    if(!R.svg||!V.W)return;
    // só o que mudou: a vista (mapa, trajetos, rótulos) ou só o ponto que anda
    const vk=V.s.toFixed(5)+','+V.tx.toFixed(2)+','+V.ty.toFixed(2)+','+V.W+','+V.H;
    const vch=vk!==lastView;lastView=vk;
    if(vch)R.world.setAttribute('transform','translate('+V.tx.toFixed(2)+' '+V.ty.toFixed(2)+') scale('+V.s.toFixed(5)+')');
    for(const w of items.walkers){const c=cut(w.leg,st.f);w.prog.setAttribute('d',dPath(c.pts));
      w.w.setAttribute('transform','translate('+sx(c.head[0]).toFixed(1)+' '+sy(c.head[1]).toFixed(1)+')')}
    if(!vch&&!ovDirty)return;
    ovDirty=false;
    for(const r of items.routes)r.el.setAttribute('d',dPath(r.leg.pts));
    // botões, escala, créditos e os lugares do versículo ocupam espaço; os pinos também
    const chips=document.querySelector('#atlasSheet .atlas-chips');
    const placed=[[V.W-50,0,V.W,134],[0,V.H-22,112,V.H],[V.W-150,V.H-15,V.W,V.H]];
    if(chips&&!chips.hidden)placed.push([0,0,Math.min(V.W-56,chips.offsetWidth+8),chips.offsetHeight+8]);
    for(const P of items.pins){const X=sx(P.p.x),Y=sy(P.p.y);P.sx=X;P.sy=Y;
      const inV=X>-30&&X<V.W+30&&Y>-30&&Y<V.H+30;P.g.style.display=inV?'':'none';
      if(inV){P.g.setAttribute('transform','translate('+X.toFixed(1)+' '+Y.toFixed(1)+')');const r=P.em?7:4;placed.push([X-r,Y-r,X+r,Y+r])}}
    for(const w of items.walkers){const c=cut(w.leg,st.f);const X=sx(c.head[0]),Y=sy(c.head[1]);placed.push([X-7,Y-7,X+7,Y+7])}
    const hit=(a)=>a[0]<4||a[2]>V.W-4||a[1]<2||a[3]>V.H-4||placed.some(b=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1]);
    const cands=(L,X,Y,g)=>{const e=L.ex,b0=Y+L.fs*0.36-e/2;return L.pin?[['start',X+g,b0,[X+g-2,Y-L.h/2,X+g+L.w+2,Y+L.h/2]],['end',X-g,b0,[X-g-L.w-2,Y-L.h/2,X-g+2,Y+L.h/2]],
      ['middle',X,Y-g-2-e,[X-L.w/2-2,Y-g-L.h-2,X+L.w/2+2,Y-g]],['middle',X,Y+g+L.fs,[X-L.w/2-2,Y+g,X+L.w/2+2,Y+g+L.h+2]]]
      :[L.an==='end'?['end',X,Y+L.fs*0.36,[X-L.w-2,Y-L.h/2,X+2,Y+L.h/2]]:['middle',X,Y+L.fs*0.36,[X-L.w/2-2,Y-L.h/2,X+L.w/2+2,Y+L.h/2]]]};
    for(const L of items.labels){
      const X=sx(L.x),Y=sy(L.y);let ok=null;
      if(X<-300||X>V.W+300||Y<-60||Y>V.H+60){L.el.style.display='none';L.box=null;continue}
      for(const c of cands(L,X,Y,L.pri<0?10:8))if(!hit(c[3])){ok=c;break}
      // o que está em destaque (ou citado no versículo) aparece mesmo apertado: na posição que menos cobre os outros
      if(!ok&&L.base<0&&X>-20&&X<V.W+20&&Y>-20&&Y<V.H+20){
        const cs=cands(L,X,Y,10);
        const cost=a=>{let o=0;for(const b of placed)o+=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
          o+=Math.max(0,4-a[0])*40+Math.max(0,a[2]-V.W+4)*40+Math.max(0,2-a[1])*40+Math.max(0,a[3]-V.H+4)*40;return o};
        ok=cs.reduce((m,c)=>cost(c[3])<cost(m[3])?c:m,cs[0])}
      if(ok){L.el.style.display='';const xs=ok[1].toFixed(1);L.el.setAttribute('x',xs);L.el.setAttribute('y',ok[2].toFixed(1));L.el.setAttribute('text-anchor',ok[0]);
        if(L.t2){L.el.firstChild.setAttribute('x',xs);L.t2.setAttribute('x',xs)}placed.push(ok[3]);L.box=ok[3]}
      else{L.el.style.display='none';L.box=null}
    }
    scaleBar();
  }
  function scaleBar(){
    const el=document.querySelector('#atlasSheet .atlas-scale');if(!el)return;
    const kmPx=1.112/V.s;let best=10;for(const k of [2,5,10,20,25,50,100,200,250,500,1000])if(k/kmPx<=92)best=k;
    el.querySelector('i').style.width=(best/kmPx).toFixed(0)+'px';el.querySelector('span').textContent=best+' km';
  }
  // um só laço para o voo, o ponto que anda e a suavização
  function loop(){if(raf)return;raf=requestAnimationFrame(tick)}
  function tick(now){
    raf=0;let more=false;
    if(anim){const t=Math.min(1,(now-anim.t0)/anim.dur),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      let s=Math.exp(Math.log(anim.s0)+(Math.log(anim.s1)-Math.log(anim.s0))*e);
      if(anim.arc)s*=Math.exp(-anim.arc*Math.sin(Math.PI*e)*1.4);
      setCenter(anim.c0[0]+(anim.c1[0]-anim.c0[0])*e,anim.c0[1]+(anim.c1[1]-anim.c0[1])*e,s);
      if(t>=1)anim=null;else more=true}
    const S=st.S;
    if(S&&S.leg){
      if(S.walk==='a'){const L=LEG[S.leg].L;const dur=1500+Math.min(2200,L*2.2);const t=Math.min(1,Math.max(0,(now-st.autoT)/dur));
        st.f=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;if(t<1)more=true}
      else{const d=st.fT-st.f;if(Math.abs(d)>0.0015){st.f+=d*0.16;more=true}else st.f=st.fT}
    }
    if(!st.min)render();
    if(more)loop();
  }

  /* ---------- toque: arrastar, pinçar, roda, toque duplo ---------- */
  function bindGestures(svg){
    const ptr=new Map();let g=null,lastTap=0,lastXY=[0,0];
    const rel=e=>{const r=svg.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
    svg.addEventListener('pointerdown',e=>{
      try{svg.setPointerCapture(e.pointerId)}catch(_){}
      ptr.set(e.pointerId,rel(e));stopAnim();
      if(ptr.size===1){const p=ptr.get(e.pointerId);g={t:'pan',x0:p[0],y0:p[1],tx:V.tx,ty:V.ty,moved:false,t0:performance.now()}}
      else if(ptr.size===2){const [a,b]=[...ptr.values()];g={t:'pinch',d0:Math.hypot(a[0]-b[0],a[1]-b[1])||1,s0:V.s,wx:((a[0]+b[0])/2-V.tx)/V.s,wy:((a[1]+b[1])/2-V.ty)/V.s,moved:true}}
    });
    svg.addEventListener('pointermove',e=>{
      if(!ptr.has(e.pointerId)||!g)return;ptr.set(e.pointerId,rel(e));
      if(g.t==='pan'&&ptr.size===1){const p=ptr.get(e.pointerId),dx=p[0]-g.x0,dy=p[1]-g.y0;
        if(!g.moved&&Math.hypot(dx,dy)<6)return;g.moved=true;st.user=true;V.tx=g.tx+dx;V.ty=g.ty+dy;clampView();draw()}
      else if(g.t==='pinch'&&ptr.size>=2){const [a,b]=[...ptr.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);
        const s=clampS(g.s0*d/g.d0),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;V.s=s;V.tx=mx-s*g.wx;V.ty=my-s*g.wy;clampView();st.user=true;draw()}
    });
    const end=e=>{
      if(!ptr.has(e.pointerId))return;const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);
      if(g&&g.t==='pan'&&!g.moved&&e.type==='pointerup'&&performance.now()-g.t0<450){
        const now=performance.now();
        if(now-lastTap<320&&Math.hypot(p[0]-lastXY[0],p[1]-lastXY[1])<28){lastTap=0;st.user=true;zoomAt(p[0],p[1],2,true)}
        else{lastTap=now;lastXY=p;tap(p[0],p[1])}
      }
      if(ptr.size===1){const q=[...ptr.values()][0];g={t:'pan',x0:q[0],y0:q[1],tx:V.tx,ty:V.ty,moved:true,t0:0}}
      else if(!ptr.size)g=null;
    };
    svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
    svg.addEventListener('wheel',e=>{e.preventDefault();stopAnim();const p=rel(e);st.user=true;zoomAt(p[0],p[1],Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0018)),false)},{passive:false});
  }
  function zoomAt(px,py,k,animate){
    const s=clampS(V.s*k);if(animate){const wx=(px-V.tx)/V.s,wy=(py-V.ty)/V.s;
      const cx=wx-(px-V.W/2)/s,cy=wy-(py-V.H/2)/s;flyTo(cx,cy,s,260);return}
    V.tx=px-(px-V.tx)*(s/V.s);V.ty=py-(py-V.ty)*(s/V.s);V.s=s;clampView();draw();
  }
  function tap(x,y){
    // o pino mais perto, depois os nomes de regiões
    let best=null,bd=24;
    for(const P of items.pins){if(P.g.style.display==='none')continue;const d=Math.hypot(P.sx-x,P.sy-y);if(d<bd){bd=d;best=P.id}}
    if(!best)for(const L of items.labels){const b=L.box;if(b&&PL[L.id]&&x>=b[0]-6&&x<=b[2]+6&&y>=b[1]-6&&y<=b[3]+6){best=L.id;break}}
    if(best&&(PL[best].t||PL[best].s||PL[best].r.length))openPop(best);else closePop();
    const ly=document.querySelector('#atlasSheet .atlas-layers');if(ly&&!ly.hidden){ly.hidden=true;document.querySelector('#atlasSheet .atlas-rbtn')?.classList.remove('on')}
  }
  function openPop(id,all){
    const p=PL[id],S=st.S;const el=document.querySelector('#atlasSheet .atlas-pop');if(!el||!p)return;
    const t=tgt(id);
    let name=(S&&S.lbl&&S.lbl[id])?S.lbl[id]+' · '+nice(p.n):nice(p.n);
    let sub=p.s||'';if(p.al&&t){sub=(sub?sub+' · ':'')+'no mapa: '+nice(t.n)}
    const note=p.t||(p.al&&t?t.t:'');
    // os versículos do livro aberto vêm primeiro
    let refs=p.r.slice();if(S){refs.sort((a,b)=>(b.startsWith(S.bk+' ')?1:0)-(a.startsWith(S.bk+' ')?1:0))}
    const MAXR=36,more=!all&&refs.length>MAXR;
    el.innerHTML='<div class="atlas-pop-h"><strong>'+esc(name)+'</strong><button type="button" class="atlas-pop-x" aria-label="Fechar">×</button></div>'
      +(sub?'<small class="atlas-pop-s">'+esc(sub)+'</small>':'')+(note?'<p>'+esc(note)+'</p>':'')
      +(refs.length?'<div class="atlas-pop-refs">'+(more?refs.slice(0,MAXR):refs).map(r=>'<button type="button" data-ref="'+esc(r)+'">'+esc(refLabel(r))+'</button>').join('')
        +(more?'<button type="button" class="atlas-pop-more">+'+(refs.length-MAXR)+'</button>':'')+'</div>':'');
    el.hidden=false;if(!all)el.scrollTop=0;st.pop=id;
  }
  function closePop(){const el=document.querySelector('#atlasSheet .atlas-pop');if(el)el.hidden=true;st.pop=''}

  /* ================= LEITURA ================= */
  const readingNow=()=>$('p-ler')?.classList.contains('on')&&!document.body.classList.contains('parallel-mode')&&!document.body.classList.contains('doxa-home-open');
  function lineVerse(){
    const host=$('textBody');if(!host)return null;
    const vs=host.querySelectorAll('.verse[id^="v"]');if(!vs.length)return null;
    const line=window.innerHeight*0.32;
    let lo=0,hi=vs.length-1,best=-1;
    while(lo<=hi){const mid=(lo+hi)>>1;if(vs[mid].getBoundingClientRect().top<=line){best=mid;lo=mid+1}else hi=mid-1}
    if(best<0){const r=vs[0].getBoundingClientRect();return r.top<window.innerHeight*0.55?vs[0]:null}
    const r=vs[best].getBoundingClientRect();if(r.bottom<0)return null;
    return vs[best];
  }
  let uRaf=0;
  function update(){
    uRaf=0;if(!on)return;
    placeSheet();
    if(!readingNow()){hideSheet(true);return}
    const el=lineVerse();const ref=el&&readerRef(el);
    if(!ref){hideSheet(false);return}
    if(!D){setAway(['Carregando o mapa…','Um instante.'],false);loadData().then(()=>{st.S=null;queue()}).catch(()=>setAway(['Não foi possível abrir o mapa','Tente sair e entrar de novo no Atlas.'],false));return}
    const s=sheet();buildSvg(s.querySelector('.atlas-svg'));
    if(!B[ref.book]){setAway(['Por enquanto, o Pentateuco','O Atlas acompanha de Gênesis a Deuteronômio. Abra um desses livros e role a leitura.'],true);return}
    if(st.away){st.away=false;s.classList.remove('away')}
    const opened=openSheet();
    const b=B[ref.book],i=sceneIdx(ref.book,ref.c,ref.v),S=b.sc[i],o=b.ord(ref.c,ref.v);st.ref=ref;
    const r=el.getBoundingClientRect(),fr=Math.max(0,Math.min(1,(window.innerHeight*0.32-r.top)/Math.max(1,r.height)));
    const fT=S.leg&&S.walk==='v'?Math.max(0,Math.min(1,(o-S.o1+fr)/(S.o2-S.o1+1))):1;
    if(S!==st.S){
      st.S=S;st.user=false;st.vo=-1;
      s.querySelector('.atlas-ref').textContent=scRef(S);s.querySelector('.atlas-title').textContent=S.t;
      const n=s.querySelector('.atlas-note');n.textContent=S.n;n.classList.remove('open');
      closePop();buildOverlay();setVerse(S,o);
      st.fT=fT;st.f=S.walk==='v'?fT:0;st.autoT=performance.now()+(opened?420:180);
      requestAnimationFrame(()=>{measure(false);fitScene(!opened);loop()});
    }else{
      setVerse(S,o);
      if(S.leg&&S.walk==='v'&&Math.abs(fT-st.fT)>1e-4){st.fT=fT;loop()}
    }
  }
  const queue=()=>{if(on&&!uRaf)uRaf=requestAnimationFrame(update)};

  /* ================= IR PARA O VERSO ================= */
  function goVerse(book,c,v){
    try{
      let md=typeof mode!=='undefined'&&CORPORA[mode]&&mode!=='hyper'?mode:'almeida';
      if(md==='wlc'&&NT.has(book))md='almeida';if(md==='tr'&&!NT.has(book))md='almeida';
      let cc=+c,vv=+v;if(md==='wlc'&&versif()){const h=versif().toHeb(book,cc,vv);cc=h.chapter;vv=h.verse}
      const bi=CORPORA[md].books.findIndex(x=>x.book===book);if(bi<0)return;
      if(md!==mode)mode=md;positions[mode]={...(positions[mode]||{}),b:bi,c:cc};focusVerse=vv;
      renderReader();try{savePrefs()}catch(e){}
      const place=()=>{const el=document.getElementById('v'+vv);if(!el)return;const y=el.getBoundingClientRect().top+window.scrollY-window.innerHeight*0.26;
        try{window.scrollTo({top:Math.max(0,y),behavior:'smooth'})}catch(e){window.scrollTo(0,Math.max(0,y))}};
      setTimeout(place,70);setTimeout(queue,700);
    }catch(e){}
  }

  /* ================= MODO ================= */
  // em Ferramentas › Explorar o texto, depois da Linha do tempo
  function ensureCard(){
    let b=$('toolsAtlasStart');
    if(!b){
      b=document.createElement('button');b.className='tool-card';b.id='toolsAtlasStart';b.type='button';
      b.innerHTML='<span class="tool-card-icon">'+SVG_ATLAS+'</span><span class="tool-card-copy"><strong>Atlas</strong><small>O mapa e o trajeto do texto, de Gênesis a Deuteronômio.</small></span><span class="tool-card-arrow" aria-hidden="true">›</span>';
      b.addEventListener('click',()=>setMode(true));
    }
    const tl=$('toolsTimelineStart');
    const ref=tl&&tl.closest('.doxa59-tools-stack')?tl:($('toolsCronoStart')||tl||$('toolsLupaStart'));
    if(ref&&ref.nextElementSibling!==b)ref.after(b);
  }
  function leaveOthers(){
    try{if(window.DoxaCrono?.isOn?.())window.DoxaCrono.setMode(false)}catch(e){}
    try{window.DoxaLupa?.setMode?.(false)}catch(e){}
    try{if(document.body.classList.contains('doxa-timeline-mode'))$('tlModeExit')?.click()}catch(e){}
    try{const bar=$('hlModeBar');if(bar&&!bar.hidden)$('hlModeExit')?.click()}catch(e){}
  }
  function openPanelLer(){try{openPanel('ler')}catch(e){}}
  function setMode(v){
    v=!!v;if(v===on&&v)return openPanelLer();
    if(v===on)return;
    const tools=$('doxa30Tools');
    if(v){
      leaveOthers();
      on=true;document.body.classList.add('doxa-atlas-on');
      if(tools){if(!tools.dataset.atlasPrev)tools.dataset.atlasPrev=tools.innerHTML;tools.innerHTML=SVG_ATLAS+'<span>Sair</span>';tools.classList.add('lupa-exit','atlas-exit');tools.setAttribute('aria-label','Sair do Atlas')}
      openPanelLer();
      const s=document.createElement('div');s.className='lupa-sweep';s.innerHTML='<i></i><span>'+SVG_ATLAS+' Atlas · role o texto</span>';
      document.body.appendChild(s);setTimeout(()=>s.remove(),2600);
      st.S=null;st.away=false;st.min=false;st.vo=-1;
      loadData().then(()=>queue()).catch(()=>{});
      setTimeout(queue,420);
    }else{
      on=false;document.body.classList.remove('doxa-atlas-on');
      if(tools&&tools.dataset.atlasPrev){tools.innerHTML=tools.dataset.atlasPrev;delete tools.dataset.atlasPrev;tools.classList.remove('lupa-exit','atlas-exit');tools.setAttribute('aria-label','Ferramentas')}
      hideSheet(true);st.S=null;stopAnim();
    }
  }

  // outros modos que usam a aba Ferramentas: sai do Atlas antes
  document.addEventListener('click',e=>{
    if(!on)return;
    if(e.target.closest?.('#toolsLupaStart,#toolsTimelineStart,#toolsHighlightStart,#toolsCopyVersesStart,#toolsCronoStart'))setMode(false);
  },true);
  window.addEventListener('click',e=>{
    if(!on)return;
    if(e.target.closest?.('#doxa30Tools.atlas-exit:not(.doxa-copy-action)')){e.preventDefault();e.stopImmediatePropagation();setMode(false)}
  },true);
  window.addEventListener('scroll',queue,{passive:true});
  window.addEventListener('resize',()=>{queue();measure(true)},{passive:true});
  const host=$('textBody');
  if(host&&'MutationObserver' in window){let t=0;new MutationObserver(()=>{if(!on)return;clearTimeout(t);t=setTimeout(queue,90)}).observe(host,{childList:true})}
  const origOpen=window.openPanel;
  if(typeof origOpen==='function'&&!origOpen.__doxa62){
    const w=function(name){const r=origOpen.apply(this,arguments);if(name==='marcar')ensureCard();if(on){setTimeout(queue,60);setTimeout(queue,400)}return r};
    w.__doxa62=true;for(const k of Object.keys(origOpen))try{w[k]=origOpen[k]}catch(e){}window.openPanel=w;
  }

  ensureCard();setTimeout(ensureCard,1200);setTimeout(ensureCard,3000);
  window.DoxaAtlas={setMode,isOn:()=>on,update:queue,
    scene:(bk,c,v)=>{if(!D||!B[bk])return null;const S=B[bk].sc[sceneIdx(bk,c,v)];return S&&{ref:scRef(S),title:S.t,leg:S.leg||null,pins:S.pins||[]}},
    view:()=>({...V,scene:st.S?st.S.bk+' '+st.S.a:null,f:st.f,user:st.user,trad:st.trad,away:st.away,hits:[...st.hits]}),
    scenes:()=>D?BOOKS.map(b=>B[b]?B[b].sc.length:0):null,ready:()=>!!D,load:loadData};
})();
