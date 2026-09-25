(()=>{
  'use strict';
  /* Doxa 45 · Doxa Textus
     A leitura hiperliteral passa a se chamar Doxa Textus. O texto continua o mesmo (português
     hebraizado); o que muda é que cada trecho com decisão textual documentada ganha um
     sublinhado dourado discreto e um pequeno losango. Tocando, sobe um cartão com a leitura
     adotada, o grau de confiança, o que cada testemunha traz (MT, LXX, Peshitta, Samaritano)
     e o porquê da decisão.
     Os dados vêm de data/doxa_textus.js (window.DOXA_TEXTUS), um pacote à parte, que cresce
     capítulo a capítulo sem mexer no texto. */
  if(window.__doxa45TextusInstalled)return;
  window.__doxa45TextusInstalled=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const segs=()=>(typeof DOXA_TEXTUS!=='undefined'&&Array.isArray(DOXA_TEXTUS.segs))?DOXA_TEXTUS.segs:[];
  const NOMES={MT:'Texto Massorético',LXX:'Septuaginta',Peshitta:'Peshitta',SP:'Pentateuco Samaritano',PS:'Pentateuco Samaritano'};
  const CONF={alta:['Alta confiança','alta'],provavel:['Provável','provavel'],dividido:['Leituras divididas','dividido']};
  const NIVEL={1:'Testemunho hebraico direto',2:'Versão antiga com provável hebraico distinto',3:'Versão antiga que corrobora',4:'Evidência secundária'};

  /* ---------- localizar cada trecho no texto desenhado ---------- */
  function paragraphIndex(p){
    const nodes=[],w=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let full='';
    while(w.nextNode()){const n=w.currentNode;if(n.parentElement?.closest('.textus-mark'))continue;nodes.push({n,start:full.length});full+=n.nodeValue}
    return{nodes,full};
  }
  // posição no texto "normalizado" (espaços colapsados) -> nó + deslocamento real
  function locate(idx,needle){
    const map=[];let norm='',prevSpace=false;
    for(let i=0;i<idx.full.length;i++){const ch=idx.full[i],sp=/\s/.test(ch);if(sp&&prevSpace)continue;norm+=sp?' ':ch;map.push(i);prevSpace=sp}
    const at=norm.indexOf(needle);if(at<0)return null;
    const a=map[at],b=map[at+needle.length-1]+1;
    const pick=off=>{for(let k=idx.nodes.length-1;k>=0;k--){if(off>=idx.nodes[k].start)return{node:idx.nodes[k].n,off:off-idx.nodes[k].start}}return null};
    const s=pick(a),e=pick(b-1);if(!s||!e)return null;
    const r=document.createRange();r.setStart(s.node,s.off);r.setEnd(e.node,e.off+1);return r;
  }
  const ranges=[];
  function decorate(){
    ranges.length=0;
    try{CSS.highlights?.delete('doxa-textus')}catch(e){}
    if(typeof mode==='undefined'||mode!=='hyper')return;
    try{$('hdrVersion').textContent='Doxa Textus'}catch(e){}
    const body=$('textBody');if(!body)return;
    const list=segs();if(!list.length)return;
    const ps=[...body.querySelectorAll('p')];
    list.forEach((sg,i)=>{
      for(const p of ps){
        const r=locate(paragraphIndex(p),sg.t);if(!r)continue;
        ranges.push({r,i});
        const mk=document.createElement('button');mk.type='button';mk.className='textus-mark conf-'+(CONF[sg.c]?.[1]||'alta');
        mk.dataset.seg=i;mk.setAttribute('aria-label','Ver decisão textual');mk.textContent='◆';
        const end=r.cloneRange();end.collapse(false);end.insertNode(mk);
        break;
      }
    });
    try{if(window.Highlight&&CSS.highlights&&ranges.length)CSS.highlights.set('doxa-textus',new Highlight(...ranges.map(x=>x.r)))}catch(e){}
  }

  /* ---------- cartão ---------- */
  function sheet(){
    let s=$('textusSheet');if(s)return s;
    const bd=document.createElement('div');bd.id='textusBackdrop';bd.className='textus-backdrop';document.body.appendChild(bd);
    s=document.createElement('section');s.id='textusSheet';s.className='textus-sheet';document.body.appendChild(s);
    bd.onclick=close;return s;
  }
  function close(){$('textusSheet')?.classList.remove('on');$('textusBackdrop')?.classList.remove('on')}
  function open(i){
    const sg=segs()[i];if(!sg)return;
    const s=sheet(),cf=CONF[sg.c]||CONF.alta;
    const wit=Object.entries(sg.w||{}).map(([k,v])=>'<div class="tx-wit'+(String(sg.a||'').includes(k)?' on':'')+'"><strong>'+esc(NOMES[k]||k)+'</strong><span>'+esc(v)+'</span></div>').join('');
    s.innerHTML='<div class="tx-grab"></div>'
      +'<header class="tx-head"><div><small>DOXA TEXTUS · '+esc(sg.r)+'</small><strong>'+esc(sg.t)+'</strong></div><button type="button" id="txClose" aria-label="Fechar">×</button></header>'
      +'<div class="tx-scroll">'
      +'<div class="tx-row"><span class="tx-pill">Leitura adotada: <b>'+esc(sg.a||'—')+'</b></span><span class="tx-conf '+cf[1]+'">'+cf[0]+'</span></div>'
      +(sg.n?'<p class="tx-level">'+esc(NIVEL[sg.n]||'')+'</p>':'')
      +'<h4>Testemunhas</h4><div class="tx-wits">'+wit+'</div>'
      +'<h4>Decisão</h4><p class="tx-dec">'+esc(sg.d||'')+'</p>'
      +(sg.s?'<h4>Revisão sugerida</h4><p class="tx-dec">'+esc(sg.s)+'</p>':'')
      +'</div>';
    s.classList.add('on');$('textusBackdrop').classList.add('on');$('txClose').onclick=close;
  }
  document.addEventListener('click',e=>{
    const mk=e.target.closest?.('.textus-mark');
    if(mk){e.preventDefault();e.stopPropagation();open(+mk.dataset.seg);return}
    // toque sobre o próprio trecho sublinhado
    if(!ranges.length||typeof mode==='undefined'||mode!=='hyper'||!e.target.closest?.('#textBody'))return;
    const cr=document.caretRangeFromPoint?.(e.clientX,e.clientY);if(!cr)return;
    const hit=ranges.find(x=>{try{return x.r.isPointInRange(cr.startContainer,cr.startOffset)}catch(_){return false}});
    if(hit){e.preventDefault();e.stopPropagation();open(hit.i)}
  },true);

  const orig=window.renderReader;
  if(typeof orig==='function'&&!orig.__doxa45){
    const w=function(){const r=orig.apply(this,arguments);try{decorate()}catch(e){}return r};
    w.__doxa45=true;window.renderReader=w;
  }
  /* O nome antigo aparece em vários rótulos espalhados (seletor de versão, busca, ajustes).
     Em vez de editar cada tela, troca o texto visível onde ele surgir. */
  function relabel(root){
    const w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>/iperliteral/i.test(n.nodeValue)&&!n.parentElement?.closest('script,style')?1:2});
    const hits=[];while(w.nextNode())hits.push(w.currentNode);
    hits.forEach(n=>{n.nodeValue=n.nodeValue.replace(/Tradu[çc][ãa]o\s+[Hh]iperliteral(\s+Doxa)?/g,'Doxa Textus').replace(/[Hh]iperliteral/g,'Doxa Textus')});
  }
  let pend=false;
  new MutationObserver(()=>{if(pend)return;pend=true;requestAnimationFrame(()=>{pend=false;try{relabel()}catch(e){}})}).observe(document.body,{childList:true,subtree:true,characterData:true});
  relabel();
  decorate();
  window.DoxaTextus={decorate,open};
})();
