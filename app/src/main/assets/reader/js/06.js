
(()=>{
  const KEY='doxa:highlights:v1';
  let db={items:[]},activeId=null,lpTimer=null,lpActive=false,lpAnchor=null,lpCurrent=null,lpVerse=null,lpHighlighting=false,lpStartX=0,lpStartY=0,lpMoved=false,suppressClickUntil=0;
  let hlScrollLocked=false,hlPrevBodyOverflow='',hlPrevHtmlOverflow='',hlPrevBodyOverscroll='',hlPrevHtmlOverscroll='';
  function lockHighlightScroll(){
    if(hlScrollLocked)return;hlScrollLocked=true;window.__doxaHighlightDragLock=true;
    hlPrevBodyOverflow=document.body.style.overflow;hlPrevHtmlOverflow=document.documentElement.style.overflow;
    hlPrevBodyOverscroll=document.body.style.overscrollBehavior;hlPrevHtmlOverscroll=document.documentElement.style.overscrollBehavior;
    document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';
    document.body.style.overscrollBehavior='none';document.documentElement.style.overscrollBehavior='none';
    document.body.classList.add('doxa-grifando');
  }
  function unlockHighlightScroll(){
    if(!hlScrollLocked){window.__doxaHighlightDragLock=false;return}hlScrollLocked=false;window.__doxaHighlightDragLock=false;
    document.body.style.overflow=hlPrevBodyOverflow;document.documentElement.style.overflow=hlPrevHtmlOverflow;
    document.body.style.overscrollBehavior=hlPrevBodyOverscroll;document.documentElement.style.overscrollBehavior=hlPrevHtmlOverscroll;
    document.body.classList.remove('doxa-grifando');
  }
  // Captura o gesto antes que o WebView transforme o arraste do grifo em rolagem da página.
  document.addEventListener('touchmove',e=>{if(window.__doxaHighlightDragLock&&e.touches?.length===1)e.preventDefault()},{capture:true,passive:false});
  const sheet=document.getElementById('hlSheet'),back=document.getElementById('hlBackdrop'),colors=document.getElementById('hlColors'),noteEditor=document.getElementById('hlNoteEditor'),noteText=document.getElementById('hlNoteText');
  const mainBody=document.getElementById('textBody');
  function chapterKey(){if(mode==='hyper')return 'hyper:'+hIdx;const p=pos(),cp=corpus(),b=cp.books[p.b];return mode+':'+b.book+':'+p.c}
  function metaForCurrent(word){if(mode==='hyper')return{mode:'hyper',book:'Gen',chapter:hyperRange(hIdx).sc,hIdx,verse:null,ref:currentRef()};const p=pos(),cp=corpus(),b=cp.books[p.b],v=Number(word?.dataset?.hlVerse||word?.closest('.verse')?.dataset?.v||String(word?.closest('.verse')?.id||'').replace(/^v/,'')||focusVerse||1);return{mode,book:b.book,chapter:Number(p.c),hIdx:0,verse:v||1,ref:bookName(b)+' '+p.c+(v?':'+v:'')};}
  function wordList(){return [...mainBody.querySelectorAll('.hl-word[data-hli]')].sort((a,b)=>Number(a.dataset.hli)-Number(b.dataset.hli))}
  function clearSelecting(){mainBody.querySelectorAll('.hl-selecting').forEach(x=>x.classList.remove('hl-selecting'))}
  function paintSelecting(a,b){clearSelecting();if(!a||!b)return;const A=Number(a.dataset.hli),B=Number(b.dataset.hli),lo=Math.min(A,B),hi=Math.max(A,B);wordList().forEach(w=>{const i=Number(w.dataset.hli);if(i>=lo&&i<=hi)w.classList.add('hl-selecting')})}
  function tokenizeText(){
    if(!mainBody)return;
    // WLC já chega tokenizado pelo OSHB; só adicionamos os índices de grifo.
    if(mode==='wlc'){
      let i=0;mainBody.querySelectorAll('.oshb-word').forEach(w=>{w.classList.add('hl-word');w.dataset.hli=String(i++);w.dataset.hlVerse=w.dataset.v||''});
      return;
    }
    if(mainBody.querySelector('.hl-word[data-hli]'))return;
    const walker=document.createTreeWalker(mainBody,NodeFilter.SHOW_TEXT,{acceptNode(n){const p=n.parentElement;if(!p||!n.nodeValue||!/[\p{L}\p{M}\p{N}]/u.test(n.nodeValue))return NodeFilter.FILTER_REJECT;if(p.closest('sup,button,textarea,input,select,.note-pin,.xref-marker,.picker-xref,.oshb-punct'))return NodeFilter.FILTER_REJECT;if(p.closest('.hl-word'))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT}}),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    const re=/([\p{L}\p{M}\p{N}]+(?:[’'\-][\p{L}\p{M}\p{N}]+)*)/gu;
    for(const n of nodes){const txt=n.nodeValue,parts=txt.split(re);if(parts.length<2)continue;const f=document.createDocumentFragment();for(const part of parts){if(!part)continue;if(re.test(part)){re.lastIndex=0;const sp=document.createElement('span');sp.className='hl-word';sp.textContent=part;f.appendChild(sp)}else{re.lastIndex=0;f.appendChild(document.createTextNode(part))}}n.replaceWith(f)}
    let i=0;mainBody.querySelectorAll('.hl-word').forEach(w=>{w.dataset.hli=String(i++);const v=w.closest('.verse');w.dataset.hlVerse=v?(v.dataset.v||String(v.id||'').replace(/^v/,'')):''});
  }
  function currentItems(){const k=chapterKey();return db.items.filter(x=>x.key===k)}
  function applyHighlights(){
    if(!mainBody)return;tokenizeText();
    mainBody.querySelectorAll('.hl-word').forEach(w=>{w.removeAttribute('data-hl-color');w.removeAttribute('data-hl-id')});mainBody.querySelectorAll('.note-pin').forEach(n=>n.remove());
    const words=wordList();for(const rec of currentItems()){
      const lo=Math.min(rec.start,rec.end),hi=Math.max(rec.start,rec.end);for(let i=lo;i<=hi;i++){const w=words[i];if(!w)continue;w.dataset.hlColor=rec.color||'yellow';w.dataset.hlId=rec.id}
      if(rec.note&&rec.note.trim()&&words[lo]){const pin=document.createElement('span');pin.className='note-pin';pin.dataset.noteId=rec.id;pin.textContent='▤';pin.title='Abrir nota';words[lo].before(pin)}
    }
  }
  async function save(){await setStored(KEY,JSON.stringify(db));renderToolsNotes()}
  async function loadDb(){try{const raw=await getStored(KEY);const x=raw?JSON.parse(raw):null;if(x&&Array.isArray(x.items))db=x}catch(e){}applyHighlights();renderToolsNotes()}
  function recById(id){return db.items.find(x=>x.id===id)||null}
  function removeOverlaps(key,lo,hi,except=null){db.items=db.items.filter(x=>x.id===except||x.key!==key||Math.max(x.start,x.end)<lo||Math.min(x.start,x.end)>hi)}
  function createHighlight(a,b){const A=Number(a.dataset.hli),B=Number(b.dataset.hli),lo=Math.min(A,B),hi=Math.max(A,B),words=wordList();if(A===B&&a.dataset.hlId){activeId=a.dataset.hlId;return recById(activeId)}const m=metaForCurrent(words[lo]);removeOverlaps(chapterKey(),lo,hi);const text=words.slice(lo,hi+1).map(w=>w.textContent).join(' ').replace(/\s+/g,' ').trim();const rec={id:'hl_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),key:chapterKey(),start:lo,end:hi,color:'yellow',note:'',excerpt:text.slice(0,180),createdAt:Date.now(),...m};db.items.push(rec);activeId=rec.id;save();return rec}
  function openSheet(rec,showNote=false){if(!rec)return;activeId=rec.id;document.getElementById('hlSheetRef').textContent=rec.ref+' · '+(rec.excerpt||'');colors.querySelectorAll('.hl-color').forEach(b=>b.classList.toggle('on',b.dataset.color===rec.color));document.getElementById('hlNoteBtn').textContent=(rec.note&&rec.note.trim()?'▤  Editar nota':'▤  Adicionar nota');noteText.value=rec.note||'';noteEditor.hidden=!showNote;sheet.classList.add('on');back.classList.add('on');sheet.setAttribute('aria-hidden','false')}
  function closeSheet(){sheet.classList.remove('on');back.classList.remove('on');sheet.setAttribute('aria-hidden','true');noteEditor.hidden=true;activeId=null;clearSelecting()}
  colors.addEventListener('click',async e=>{const b=e.target.closest('.hl-color');if(!b||!activeId)return;const r=recById(activeId);if(!r)return;r.color=b.dataset.color;await save();applyHighlights();openSheet(r,!noteEditor.hidden)});
  document.getElementById('hlNoteBtn').onclick=()=>{const r=recById(activeId);if(!r)return;noteText.value=r.note||'';noteEditor.hidden=false;setTimeout(()=>noteText.focus(),60)};
  document.getElementById('hlNoteSave').onclick=async()=>{const r=recById(activeId);if(!r)return;r.note=noteText.value.trim();await save();applyHighlights();openSheet(r,false)};
  document.getElementById('hlRemove').onclick=async()=>{if(!activeId)return;db.items=db.items.filter(x=>x.id!==activeId);await save();applyHighlights();closeSheet()};
  document.getElementById('hlSheetClose').onclick=closeSheet;back.onclick=closeSheet;

  // Toque no ícone de nota.
  mainBody.addEventListener('click',e=>{const pin=e.target.closest('.note-pin');if(pin){e.preventDefault();e.stopImmediatePropagation();const r=recById(pin.dataset.noteId);openSheet(r,true)}},true);
  // Evita abrir Strong/clicar no HUD logo após um long press.
  mainBody.addEventListener('click',e=>{if(Date.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
  mainBody.addEventListener('contextmenu',e=>{if(e.target.closest('.hl-word'))e.preventDefault()});

  mainBody.addEventListener('touchstart',e=>{
    if(parallelOn||e.touches.length!==1)return;const t=e.touches[0],verse=e.target.closest('.verse'),w=e.target.closest('.hl-word');if(!verse)return;
    lpVerse=verse;lpAnchor=lpCurrent=w||verse.querySelector('.hl-word');lpStartX=t.clientX;lpStartY=t.clientY;lpMoved=false;lpActive=false;lpHighlighting=false;clearTimeout(lpTimer);
    lpTimer=setTimeout(()=>{lpActive=true;window.__doxaLongPressActive=true;lockHighlightScroll();suppressClickUntil=Date.now()+1000;lpVerse?.classList.add('verse-held');try{navigator.vibrate?.(18)}catch(_){}},430);
  },{passive:true});
  mainBody.addEventListener('touchmove',e=>{
    if(!lpVerse||e.touches.length!==1)return;const t=e.touches[0],dx=t.clientX-lpStartX,dy=t.clientY-lpStartY,dist=Math.hypot(dx,dy);if(dist>8)lpMoved=true;
    if(!lpActive){if(dist>13){clearTimeout(lpTimer);lpTimer=null;lpAnchor=lpCurrent=lpVerse=null}return}
    if(dist>10&&!lpHighlighting){lpHighlighting=true;lpVerse?.classList.remove('verse-held');if(!lpAnchor)lpAnchor=document.elementFromPoint(t.clientX,t.clientY)?.closest?.('.hl-word')||lpVerse.querySelector('.hl-word');lpCurrent=lpAnchor}
    if(lpHighlighting){e.preventDefault();e.stopPropagation();const at=document.elementFromPoint(t.clientX,t.clientY)?.closest?.('.hl-word');if(at&&mainBody.contains(at)){lpCurrent=at;paintSelecting(lpAnchor,lpCurrent)}}
  },{passive:false});
  mainBody.addEventListener('touchend',e=>{
    clearTimeout(lpTimer);lpTimer=null;if(!lpActive){lpAnchor=lpCurrent=lpVerse=null;return}
    e.preventDefault();e.stopPropagation();suppressClickUntil=Date.now()+1000;const heldVerse=lpVerse;lpVerse?.classList.remove('verse-held');
    if(lpHighlighting&&lpAnchor){const rec=createHighlight(lpAnchor,lpCurrent||lpAnchor);applyHighlights();openSheet(rec,false)}else if(heldVerse){window.DoxaVerseActions?.open(heldVerse)}
    lpActive=false;lpHighlighting=false;lpAnchor=lpCurrent=lpVerse=null;clearSelecting();unlockHighlightScroll();setTimeout(()=>{window.__doxaLongPressActive=false},750)
  },{passive:false});
  mainBody.addEventListener('touchcancel',()=>{clearTimeout(lpTimer);lpTimer=null;lpVerse?.classList.remove('verse-held');lpActive=false;lpHighlighting=false;lpAnchor=lpCurrent=lpVerse=null;clearSelecting();unlockHighlightScroll();setTimeout(()=>{window.__doxaLongPressActive=false},100)});

  // Ferramentas -> Notas
  function noteRecords(){return db.items.filter(x=>x.note&&x.note.trim()).sort((a,b)=>b.createdAt-a.createdAt)}
  window.renderToolsNotes=renderToolsNotes;
  function renderToolsNotes(){const rows=noteRecords(),count=document.getElementById('toolsNotesCount'),list=document.getElementById('toolsNotesList');if(count)count.textContent=String(rows.length);if(!list)return;list.innerHTML=rows.length?rows.map(r=>'<li data-note-nav="'+esc(r.id)+'"><div class="note-ref">'+esc(r.ref)+'</div><div class="note-excerpt">'+esc(r.excerpt||'')+'</div><div class="note-body">'+esc(r.note)+'</div></li>').join(''):'<li><div class="empty">Nenhuma nota ainda. Pressione uma palavra por alguns instantes para começar um grifo.</div></li>'}
  document.getElementById('toolsNotesBtn').onclick=()=>{document.getElementById('toolsNotesView').hidden=false;document.getElementById('toolsNotesBtn').hidden=true;document.querySelector('.tool-coming').hidden=true;renderToolsNotes()};
  document.getElementById('toolsNotesBack').onclick=()=>{document.getElementById('toolsNotesView').hidden=true;document.getElementById('toolsNotesBtn').hidden=false;document.querySelector('.tool-coming').hidden=false};
  document.getElementById('toolsNotesList').onclick=e=>{const li=e.target.closest('[data-note-nav]');if(!li)return;const r=recById(li.dataset.noteNav);if(!r)return;if(r.mode==='hyper'){mode='hyper';hIdx=r.hIdx||0;focusVerse=null}else{mode=r.mode;const cp=CORPORA[mode],bi=Math.max(0,cp.books.findIndex(b=>b.book===r.book));positions[mode]={b:bi,c:Number(r.chapter)};focusVerse=r.verse||null}renderReader();openPanel('ler');setTimeout(()=>{const w=document.querySelector('#textBody .hl-word[data-hl-id="'+r.id+'"]');if(w)w.scrollIntoView({block:'center',behavior:'smooth'})},80)};

  // Rodar a decoração sempre após renderizar capítulo/bloco.
  const baseRenderV9=renderReader;renderReader=function(){const r=baseRenderV9.apply(this,arguments);setTimeout(()=>{tokenizeText();applyHighlights()},24);return r};
  const baseOpenV9=openPanel;openPanel=function(name){const r=baseOpenV9.apply(this,arguments);if(name==='marcar')renderToolsNotes();return r};

  // Tipografias garantidas do Android, inclusive após timeouts do V7/V8.
  const systemStacks={editorial:'serif',literaria:'sans-serif',classica:'"sans-serif-condensed",sans-serif',humanista:'"sans-serif-light",sans-serif',limpa:'monospace'};
  function enforceFont(){const f=systemStacks[prefs.readerFont]||'serif';document.documentElement.style.setProperty('--reader-family',f);document.querySelectorAll('[data-reader-font]').forEach(b=>b.classList.toggle('on',b.dataset.readerFont===prefs.readerFont))}
  document.querySelectorAll('[data-reader-font]').forEach(b=>b.addEventListener('click',()=>{prefs.readerFont=b.dataset.readerFont;enforceFont();savePrefs()}));
  setTimeout(enforceFont,50);setTimeout(enforceFont,450);setTimeout(enforceFont,1300);
  loadDb();
})();
