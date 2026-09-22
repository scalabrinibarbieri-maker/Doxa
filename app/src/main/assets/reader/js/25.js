(()=>{
  'use strict';
  /* Doxa 34 · Notas e Ferramentas
     - Nota por versículo: "Anotar" no menu do versículo, editor em folha, marcador no texto.
     - A nota pertence ao versículo (livro/capítulo/versículo), não à versão: aparece em qualquer Bíblia.
     - Ferramentas reorganizada em seções; tela de Notas reúne notas de versículo e notas de grifos.
     - Ajustes: mostrar/ocultar o marcador de notas e os grifos no texto (os dados nunca são apagados). */
  if(window.__doxa34NotesInstalled)return;
  window.__doxa34NotesInstalled=true;

  const $=id=>document.getElementById(id);
  const KEY='doxa:notas:v1';
  const SHOW_NOTES_KEY='doxa:marcas:mostrar-notas';
  const SHOW_HL_KEY='doxa:marcas:mostrar-grifos';
  let db={items:[]},loaded=false;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ICON_NOTE='<svg viewBox="0 0 24 24"><path d="M5 4.5h10l4 4v11H5z"/><path d="M15 4.5v4h4"/><path d="M8.5 12.5h7M8.5 16h5"/></svg>';
  const ICON_PEN='<svg viewBox="0 0 24 24"><path d="M4.5 19.5l1-4 10-10 3 3-10 10z"/><path d="M13.5 7.5l3 3"/></svg>';

  /* ---------- armazenamento ---------- */
  async function load(){
    try{const raw=await getStored(KEY);const x=raw?JSON.parse(raw):null;if(x&&Array.isArray(x.items))db=x}catch(e){}
    loaded=true;paintMarks();renderList();
  }
  async function save(){try{await setStored(KEY,JSON.stringify(db))}catch(e){}paintMarks();renderList()}
  const keyOf=r=>r.book+'.'+Number(r.chapter)+'.'+Number(r.verse);
  const find=r=>db.items.find(n=>keyOf(n)===keyOf(r));
  const byId=id=>db.items.find(n=>n.id===id);

  /* ---------- referência do versículo ---------- */
  function refFromEl(el){
    if(!el)return null;
    const v=Number(el.dataset.v||String(el.id||'').replace(/^v/,''));if(!Number.isFinite(v)||v<1)return null;
    try{
      const pane=el.closest('.parallel-pane[data-side]');
      if(pane){
        const st=sanitizeParallelState(pane.dataset.side);if(st.mode==='hyper'||!CORPORA[st.mode])return null;
        const b=CORPORA[st.mode].books.find(x=>x.book===st.book);if(!b)return null;
        return{book:b.book,chapter:Number(st.chapter),verse:v,label:bookName(b)+' '+st.chapter+':'+v,mode:st.mode};
      }
      if(mode==='hyper'||!CORPORA[mode])return null;
      const p=pos(),b=CORPORA[mode].books[p.b];
      return{book:b.book,chapter:Number(p.c),verse:v,label:bookName(b)+' '+p.c+':'+v,mode};
    }catch(e){return null}
  }
  function verseText(r){
    for(const m of [r.mode,typeof mode!=='undefined'?mode:null,'almeida',...Object.keys(CORPORA||{})]){
      try{const b=CORPORA[m]?.books.find(x=>x.book===r.book);const c=b?.chapters.find(x=>Number(x.chapter)===Number(r.chapter));const v=c?.verses.find(x=>Number(x.number)===Number(r.verse));if(v&&m!=='wlc')return String(v.text).replace(/[\[\]]/g,'')}catch(e){}
    }
    return'';
  }
  function labelOf(r){
    try{for(const m of ['almeida',typeof mode!=='undefined'?mode:null,...Object.keys(CORPORA)]){const b=CORPORA[m]?.books.find(x=>x.book===r.book);if(b)return bookName(b)+' '+r.chapter+':'+r.verse}}catch(e){}
    return r.label||(r.book+' '+r.chapter+':'+r.verse);
  }

  /* ---------- editor ---------- */
  let editing=null;
  function ensureSheet(){
    let s=$('doxaNoteSheet');if(s)return s;
    const bd=document.createElement('div');bd.id='doxaNoteBackdrop';bd.className='doxa-note-backdrop';document.body.appendChild(bd);
    s=document.createElement('section');s.id='doxaNoteSheet';s.className='doxa-note-sheet';s.setAttribute('aria-hidden','true');
    s.innerHTML='<div class="doxa-note-grab"></div>'
      +'<header class="doxa-note-head"><div><small>NOTA</small><strong id="doxaNoteRef"></strong></div><button type="button" id="doxaNoteClose" aria-label="Fechar">×</button></header>'
      +'<blockquote class="doxa-note-verse" id="doxaNoteVerse"></blockquote>'
      +'<textarea id="doxaNoteText" rows="5" placeholder="Escreva sua anotação sobre este versículo…"></textarea>'
      +'<div class="doxa-note-foot"><button type="button" class="doxa-note-del" id="doxaNoteDelete">Excluir</button><span id="doxaNoteWhen"></span><button type="button" class="doxa-note-save" id="doxaNoteSave">Salvar</button></div>';
    document.body.appendChild(s);
    bd.addEventListener('click',closeEditor);
    $('doxaNoteClose').addEventListener('click',closeEditor);
    $('doxaNoteSave').addEventListener('click',saveEditor);
    $('doxaNoteDelete').addEventListener('click',deleteEditor);
    const ta=$('doxaNoteText');ta.addEventListener('input',()=>{ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,window.innerHeight*.42)+'px'});
    return s;
  }
  function fmtDate(t){try{return new Date(t).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return''}}
  function openEditor(ref){
    if(!ref)return;const s=ensureSheet(),n=find(ref);
    editing={ref,id:n?.id||null};
    $('doxaNoteRef').textContent=labelOf(ref);
    const vt=verseText(ref);$('doxaNoteVerse').textContent=vt;$('doxaNoteVerse').hidden=!vt;
    const ta=$('doxaNoteText');ta.value=n?.text||'';ta.style.height='auto';
    $('doxaNoteDelete').hidden=!n;$('doxaNoteWhen').textContent=n?('Editada em '+fmtDate(n.updatedAt||n.createdAt)):'';
    $('doxaNoteBackdrop').classList.add('on');s.classList.add('on');s.setAttribute('aria-hidden','false');document.body.classList.add('doxa-note-open');
    setTimeout(()=>{ta.focus();ta.dispatchEvent(new Event('input'));try{ta.setSelectionRange(ta.value.length,ta.value.length)}catch(e){}},320);
  }
  function closeEditor(){
    const s=$('doxaNoteSheet');if(!s)return;$('doxaNoteText').blur();
    s.classList.remove('on');s.setAttribute('aria-hidden','true');$('doxaNoteBackdrop').classList.remove('on');document.body.classList.remove('doxa-note-open');editing=null;
  }
  async function saveEditor(){
    if(!editing)return;const text=$('doxaNoteText').value.trim();
    if(!text){if(editing.id){db.items=db.items.filter(n=>n.id!==editing.id);await save()}closeEditor();return}
    const now=Date.now();let n=editing.id?byId(editing.id):find(editing.ref);
    if(n){n.text=text;n.updatedAt=now}
    else db.items.push({id:'n_'+now.toString(36)+Math.random().toString(36).slice(2,6),book:editing.ref.book,chapter:Number(editing.ref.chapter),verse:Number(editing.ref.verse),label:labelOf(editing.ref),text,createdAt:now,updatedAt:now});
    await save();closeEditor();try{flash('Nota salva.')}catch(e){}
  }
  async function deleteEditor(){
    if(!editing?.id)return;
    if(!confirm('Excluir esta nota?'))return;
    db.items=db.items.filter(n=>n.id!==editing.id);await save();closeEditor();try{flash('Nota excluída.')}catch(e){}
  }

  /* ---------- menu do versículo ---------- */
  function installMenu(){
    const pop=$('verseActions');if(!pop||pop.querySelector('[data-va="note"]'))return;
    const b=document.createElement('button');b.type='button';b.dataset.va='note';
    b.innerHTML='<span class="va-icon">'+ICON_NOTE+'</span><span class="va-label" id="doxaVaNoteLabel">Anotar</span><span class="va-chevron">›</span>';
    const first=pop.querySelector('[data-va]');first?pop.insertBefore(b,first):pop.appendChild(b);
    // Captura antes do onclick do js/09.js, que não conhece esta ação.
    pop.addEventListener('click',e=>{
      const t=e.target.closest('[data-va="note"]');if(!t)return;
      e.preventDefault();e.stopImmediatePropagation();
      const ref=refFromEl(document.querySelector('.verse.verse-context')||document.querySelector('.verse-context'));
      try{window.DoxaVerseActions?.close()}catch(_){}
      if(!ref){try{flash('Notas funcionam nas Bíblias por capítulo.')}catch(_){}return}
      setTimeout(()=>openEditor(ref),120);
    },true);
    new MutationObserver(()=>{
      if(!pop.classList.contains('on'))return;
      const ref=refFromEl(document.querySelector('.verse-context'));
      const lb=$('doxaVaNoteLabel');if(lb)lb.textContent=ref&&find(ref)?'Editar nota':'Anotar';
    }).observe(pop,{attributes:true,attributeFilter:['class']});
  }

  /* ---------- marcador no texto ---------- */
  let painting=false,paintQueued=false;
  function currentChapter(){
    try{if(mode==='hyper'||!CORPORA[mode])return null;const p=pos(),b=CORPORA[mode].books[p.b];return{book:b.book,chapter:Number(p.c)}}catch(e){return null}
  }
  function paintMarks(){
    const host=$('textBody');if(!host||!loaded)return;
    painting=true;
    host.querySelectorAll('.doxa-note-mark').forEach(m=>m.remove());
    const cur=currentChapter();
    if(cur){
      for(const n of db.items){
        if(n.book!==cur.book||Number(n.chapter)!==cur.chapter)continue;
        const v=host.querySelector('#v'+n.verse);if(!v)continue;
        const m=document.createElement('button');m.type='button';m.className='doxa-note-mark';m.dataset.noteId=n.id;m.setAttribute('aria-label','Ver nota');m.innerHTML=ICON_NOTE;
        v.appendChild(m);
      }
    }
    painting=false;
  }
  function queuePaint(){if(painting||paintQueued)return;paintQueued=true;requestAnimationFrame(()=>{paintQueued=false;paintMarks()})}
  function installMarks(){
    const host=$('textBody');if(!host)return;
    new MutationObserver(muts=>{
      if(painting)return;
      if(muts.some(m=>[...m.addedNodes].some(x=>x.nodeType===1&&!x.classList?.contains('doxa-note-mark'))))queuePaint();
    }).observe(host,{childList:true,subtree:true});
    const open=e=>{
      const m=e.target.closest?.('.doxa-note-mark');if(!m)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(e.type!=='click')return;
      const n=byId(m.dataset.noteId);if(n)openEditor({book:n.book,chapter:n.chapter,verse:n.verse,label:n.label});
    };
    host.addEventListener('click',open,true);
    host.addEventListener('touchstart',e=>{if(e.target.closest?.('.doxa-note-mark'))e.stopPropagation()},{capture:true,passive:true});
  }

  /* ---------- tela de Notas em Ferramentas ---------- */
  let query='';
  function goTo(n){
    try{
      let m=(CORPORA[mode]&&mode!=='hyper')?mode:'almeida';
      let bi=CORPORA[m].books.findIndex(b=>b.book===n.book);
      if(bi<0){m='almeida';bi=CORPORA[m].books.findIndex(b=>b.book===n.book)}
      if(bi<0)return;
      mode=m;positions[m]={b:bi,c:Number(n.chapter)};focusVerse=Number(n.verse);
      openPanel('ler');renderReader();try{savePrefs()}catch(e){}
      setTimeout(()=>document.getElementById('v'+n.verse)?.scrollIntoView({block:'center',behavior:'smooth'}),160);
    }catch(e){}
  }
  function bookOrder(book){try{return CORPORA.almeida.books.findIndex(b=>b.book===book)}catch(e){return 0}}
  function renderList(){
    const view=$('toolsNotesView');if(!view)return;
    let box=$('doxaNotesBox');
    if(!box){
      box=document.createElement('div');box.id='doxaNotesBox';
      box.innerHTML='<div class="doxa-notes-search" id="doxaNotesSearchWrap"><input id="doxaNotesSearch" type="search" placeholder="Buscar nas notas" autocomplete="off"></div><div id="doxaNotesList" class="doxa-notes-list"></div><h3 class="doxa-notes-sub" id="doxaHlNotesTitle">Notas em grifos</h3>';
      const old=$('toolsNotesList');view.insertBefore(box,old);
      $('doxaNotesSearch').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();renderList()});
      box.addEventListener('click',e=>{
        const ed=e.target.closest('[data-note-edit]');if(ed){const n=byId(ed.dataset.noteEdit);if(n)openEditor(n);return}
        const go=e.target.closest('[data-note-go]');if(go){const n=byId(go.dataset.noteGo);if(n)goTo(n)}
      });
      new MutationObserver(updateCount).observe(old,{childList:true});
    }
    const rows=db.items.filter(n=>!query||(n.text+' '+labelOf(n)).toLowerCase().includes(query))
      .sort((a,b)=>(b.updatedAt||b.createdAt)-(a.updatedAt||a.createdAt));
    $('doxaNotesSearchWrap').hidden=db.items.length<4;
    $('doxaNotesList').innerHTML=rows.length?rows.map(n=>
      '<article class="doxa-note-card" data-note-go="'+n.id+'"><header><strong>'+esc(labelOf(n))+'</strong><button type="button" data-note-edit="'+n.id+'" aria-label="Editar nota">'+ICON_PEN+'</button></header>'
      +'<p>'+esc(n.text)+'</p><footer>'+esc(fmtDate(n.updatedAt||n.createdAt))+'</footer></article>').join('')
      :(db.items.length?'<div class="doxa-notes-empty">Nenhuma nota encontrada.</div>':'<div class="doxa-notes-empty"><strong>Nenhuma nota ainda</strong><span>Segure um versículo e toque em <b>Anotar</b>.</span></div>');
    updateCount();
  }
  function updateCount(){
    const old=$('toolsNotesList'),hl=old?old.querySelectorAll('li[data-note-nav]').length:0;
    const c=$('toolsNotesCount');if(c)c.textContent=String(db.items.length+hl);
    if(old)old.hidden=!hl;const t=$('doxaHlNotesTitle');if(t)t.hidden=!hl;
  }

  /* ---------- Ferramentas organizada ---------- */
  function installTools(){
    const panel=$('p-marcar');if(!panel||panel.dataset.doxa34)return;panel.dataset.doxa34='1';
    const head=panel.querySelector(':scope>.tools-head');
    if(head){head.hidden=false;head.classList.add('doxa34-tools-head');const p=head.querySelector('p');if(p)p.textContent='Marque, anote e compare o texto bíblico.'}
    const mk=(txt,id)=>{const h=document.createElement('div');h.className='doxa34-tools-label';h.id=id;h.textContent=txt;return h};
    const start=$('toolsHighlightStart');
    if(start)panel.insertBefore(mk('Marcações','doxa34LabelMarks'),start);
    const par=$('doxa31ParallelTool');
    if(par){par.classList.add('tool-card');par.parentNode.insertBefore(mk('Leitura','doxa34LabelRead'),par)}
    const nb=$('toolsNotesBtn')?.querySelector('.tool-card-copy small');if(nb)nb.textContent='Anotações nos versículos e nos grifos.';
    const nh=$('toolsNotesView')?.querySelector('.tools-notes-head small');if(nh)nh.textContent='Toque para abrir a passagem';
    // cabeçalho e rótulos somem quando uma subtela (Meus grifos / Notas) está aberta
    const sync=()=>{const sub=!$('toolsHighlightsView')?.hidden||!$('toolsNotesView')?.hidden;panel.classList.toggle('doxa34-sub',sub)};
    for(const id of ['toolsHighlightsView','toolsNotesView']){const v=$(id);if(v)new MutationObserver(sync).observe(v,{attributes:true,attributeFilter:['hidden']})}
    sync();
  }

  /* ---------- Ajustes: exibir marcações ---------- */
  function readFlag(k){try{return localStorage.getItem(k)!=='0'}catch(e){return true}}
  function applyFlags(){
    document.body.classList.toggle('doxa-hide-note-marks',!readFlag(SHOW_NOTES_KEY));
    document.body.classList.toggle('doxa-hide-highlights',!readFlag(SHOW_HL_KEY));
  }
  function installSettings(){
    const anchor=$('swVerseNumbers')?.closest('.reader-toggle-row');if(!anchor||$('swShowNoteMarks'))return;
    const row=(id,title,sub)=>{const l=document.createElement('label');l.className='reader-toggle-row';l.innerHTML='<span><strong>'+title+'</strong><small>'+sub+'</small></span><input type="checkbox" id="'+id+'">';return l};
    const a=row('swShowNoteMarks','Marcador de notas','Mostra o ícone de nota ao lado do versículo anotado. As notas continuam salvas.');
    const b=row('swShowHighlights','Grifos no texto','Mostra as cores dos grifos na leitura. Os grifos continuam salvos em Meus grifos.');
    anchor.after(a,b);
    const bind=(id,k)=>{const cb=$(id);cb.checked=readFlag(k);cb.addEventListener('change',()=>{try{localStorage.setItem(k,cb.checked?'1':'0')}catch(e){}applyFlags()})};
    bind('swShowNoteMarks',SHOW_NOTES_KEY);bind('swShowHighlights',SHOW_HL_KEY);
  }

  function init(){
    applyFlags();installTools();installSettings();installMenu();installMarks();ensureSheet();load();
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editing)closeEditor()});
  }
  window.DoxaNotes={open:openEditor,list:()=>db.items.slice()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
