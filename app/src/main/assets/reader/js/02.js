
const BOOK_NAMES = {"Gen":"Gênesis","Exod":"Êxodo","Lev":"Levítico","Num":"Números","Deut":"Deuteronômio","Josh":"Josué","Judg":"Juízes","Ruth":"Rute","1Sam":"1 Samuel","2Sam":"2 Samuel","1Kgs":"1 Reis","2Kgs":"2 Reis","1Chr":"1 Crônicas","2Chr":"2 Crônicas","Ezra":"Esdras","Neh":"Neemias","Esth":"Ester","Job":"Jó","Ps":"Salmos","Prov":"Provérbios","Eccl":"Eclesiastes","Song":"Cantares","Isa":"Isaías","Jer":"Jeremias","Lam":"Lamentações","Ezek":"Ezequiel","Dan":"Daniel","Hos":"Oséias","Joel":"Joel","Amos":"Amós","Obad":"Obadias","Jonah":"Jonas","Mic":"Miquéias","Nah":"Naum","Hab":"Habacuque","Zeph":"Sofonias","Hag":"Ageu","Zech":"Zacarias","Mal":"Malaquias","Matt":"Mateus","Mark":"Marcos","Luke":"Lucas","John":"João","Acts":"Atos","Rom":"Romanos","1Cor":"1 Coríntios","2Cor":"2 Coríntios","Gal":"Gálatas","Eph":"Efésios","Phil":"Filipenses","Col":"Colossenses","1Thess":"1 Tessalonicenses","2Thess":"2 Tessalonicenses","1Tim":"1 Timóteo","2Tim":"2 Timóteo","Titus":"Tito","Phlm":"Filemom","Heb":"Hebreus","Jas":"Tiago","1Pet":"1 Pedro","2Pet":"2 Pedro","1John":"1 João","2John":"2 João","3John":"3 João","Jude":"Judas","Rev":"Apocalipse"};
const TAGS=["Leitwort","Tipologia","Divergência","Verificar","Sintaxe"];
const DIVINE=["Elohim","YHWH"];
const STOP=new Set(("e a o de da do as os que não em para com sobre ele ela eles elas dele dela deles seu sua seus suas foi era são será todo toda todos todas um uma uns umas no na nos nas ao aos à às se por mais como isto isso este esta esse essa aquele aquela tu eu vós nós me te lhe mim ti si entre até também porque quando depois antes assim ainda já desde mas ou seja").split(" "));
const CORPORA={almeida:ALMEIDA,wlc:WLC,tr:TR};
const VERSION_META={
  hyper:{label:'Tradução hiperliteral',short:'Hiperliteral',prefix:'h'},
  almeida:{label:'Almeida 1819',short:'Almeida 1819',prefix:'a'},
  wlc:{label:'WLC — Hebraico · Strong+',short:'WLC',prefix:'w'},
  tr:{label:'Textus Receptus 1550',short:'TR 1550',prefix:'t'}
};
let mode='almeida',hIdx=0,focusVerse=null,store={},storageMode='memory';
let positions={almeida:{b:0,c:1},wlc:{b:0,c:1},tr:{b:0,c:1}};
let prefs={mode:'almeida',hIdx:0,positions:null,showSup:true,rubric:true,size:18.5,textMargin:26,textAlign:'justify',showVerseNumbers:true,readerFont:'editorial'};
const KEY_MARKS='bereshit:marks:v3',KEY_PREFS='bereshit:prefs:v4',KEY_PARALLEL='bereshit:parallel:v1',KEY_PARALLEL_LAYOUT='bereshit:parallel-layout:v2',KEY_APPEARANCE='bereshit:appearance:v1';
const KEY_TEXT_PREFS='doxa:reader-text-prefs:v1',TEXT_PREF_FIELDS=['size','textMargin','textAlign','showVerseNumbers','readerFont'];
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function norm(s){return String(s).normalize('NFD').replace(/\p{M}+/gu,'').toLowerCase()}
function stripSup(s){return String(s).replace(/\[|\]/g,'')}
function decorate(raw){let s=esc(raw);s=s.replace(/את/g,'<span class="et">את</span>');DIVINE.forEach(n=>{s=s.replace(new RegExp('\\b'+n+'\\b','g'),'<span class="dn">'+n+'</span>')});s=s.replace(/\[([^\]]*)\]/g,'<span class="sup">[$1]</span>');return s}
function bookName(b){return b?.viewName||BOOK_NAMES[b.book]||b.englishName||b.book}
function corpus(){return CORPORA[mode]||null}
function pos(){return positions[mode]}
function chapterObj(){const p=pos(),cp=corpus();return cp.books[p.b].chapters.find(c=>Number(c.chapter)===Number(p.c))||cp.books[p.b].chapters[0]}
function currentRef(){if(mode==='hyper')return HYPER_BLOCKS[hIdx].ref;const p=pos(),cp=corpus();return bookName(cp.books[p.b])+' '+p.c}
function currentKey(){if(mode==='hyper')return'h:'+hIdx;const p=pos(),cp=corpus(),pre=VERSION_META[mode].prefix;return pre+':'+cp.books[p.b].book+':'+p.c}
async function getStored(key){try{if(window.storage&&typeof window.storage.get==='function'){const r=await window.storage.get(key);storageMode='window.storage';return r?r.value:null}}catch(e){}try{const v=localStorage.getItem(key);storageMode='localStorage';return v}catch(e){storageMode='memory';return null}}
async function setStored(key,value){try{if(window.storage&&typeof window.storage.set==='function'){await window.storage.set(key,value);storageMode='window.storage';return true}}catch(e){}try{localStorage.setItem(key,value);storageMode='localStorage';return true}catch(e){storageMode='memory';return false}}
let textPrefsDbPromise=null;
function textPrefsDb(){
  if(textPrefsDbPromise)return textPrefsDbPromise;
  textPrefsDbPromise=new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB indisponível'));return}
    const req=indexedDB.open('doxa-reader-settings-v1',1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',{keyPath:'id'})};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Falha no armazenamento de ajustes'));
  });
  return textPrefsDbPromise;
}
function textPrefsSnapshot(){const out={id:'reader'};for(const k of TEXT_PREF_FIELDS)out[k]=prefs[k];return out}
async function loadTextPrefsBackup(){
  let local=null;
  try{const raw=localStorage.getItem(KEY_TEXT_PREFS);if(raw)local=JSON.parse(raw)}catch(e){}
  try{
    const db=await textPrefsDb();
    const native=await new Promise((resolve,reject)=>{const tx=db.transaction('settings','readonly'),r=tx.objectStore('settings').get('reader');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)});
    return Object.assign({},local||{},native||{});
  }catch(e){return local}
}
async function saveTextPrefsBackup(){
  const snap=textPrefsSnapshot();
  try{localStorage.setItem(KEY_TEXT_PREFS,JSON.stringify(snap))}catch(e){}
  try{
    const db=await textPrefsDb();
    await new Promise((resolve,reject)=>{const tx=db.transaction('settings','readwrite');tx.objectStore('settings').put(snap);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)});
  }catch(e){}
  return true;
}
async function load(){const m=await getStored(KEY_MARKS),p=await getStored(KEY_PREFS),tp=await loadTextPrefsBackup();try{store=m?JSON.parse(m):{}}catch(e){store={}}try{prefs=Object.assign(prefs,p?JSON.parse(p):{})}catch(e){}if(tp&&typeof tp==='object'){for(const k of TEXT_PREF_FIELDS)if(tp[k]!==undefined)prefs[k]=tp[k]}if(prefs.mode==='almeida-1911-atual')prefs.mode='almeida';if(prefs.mode==='hyper'||CORPORA[prefs.mode])mode=prefs.mode;else mode='almeida';hIdx=Math.max(0,Math.min(HYPER_BLOCKS.length-1,Number(prefs.hIdx)||0));if(prefs.positions)positions=Object.assign(positions,prefs.positions);for(const k of Object.keys(CORPORA)){const cp=CORPORA[k],pp=positions[k]||{b:0,c:1};pp.b=Math.max(0,Math.min(cp.books.length-1,Number(pp.b)||0));const chapters=cp.books[pp.b].chapters,nums=chapters.map(x=>Number(x.chapter));pp.c=nums.includes(Number(pp.c))?Number(pp.c):nums[0];positions[k]=pp}}
async function saveMarks(){return setStored(KEY_MARKS,JSON.stringify(store))}
async function savePrefs(){prefs.mode=mode;prefs.hIdx=hIdx;prefs.positions=positions;const payload=JSON.stringify(prefs);let ok=false;try{localStorage.setItem(KEY_PREFS,payload);ok=true}catch(e){}try{ok=(await setStored(KEY_PREFS,payload))||ok}catch(e){}await saveTextPrefsBackup();return ok}
function applyTextPrefs(save=false){
  const size=Math.max(14,Math.min(28,Number(prefs.size)||18.5));
  const margin=Math.max(8,Math.min(42,Number(prefs.textMargin)||26));
  const align=['left','justify','center'].includes(prefs.textAlign)?prefs.textAlign:'justify';
  const showNumbers=prefs.showVerseNumbers!==false;
  const readerFont=['editorial','garamond'].includes(prefs.readerFont)?prefs.readerFont:'editorial';
  prefs.size=size;prefs.textMargin=margin;prefs.textAlign=align;prefs.showVerseNumbers=showNumbers;prefs.readerFont=readerFont;

  document.documentElement.style.setProperty('--reader-font-size',size+'px');
  document.documentElement.style.setProperty('--parallel-font-size',size+'px');
  document.documentElement.style.setProperty('--reader-side-padding',margin+'px');
  document.documentElement.style.setProperty('--parallel-side-padding',Math.max(7,Math.round(margin*.55))+'px');
  document.documentElement.style.setProperty('--reader-family',readerFont==='garamond'?"'EB Garamond',Georgia,'Times New Roman',serif":"Georgia,'Times New Roman',serif");

  document.body.dataset.readerAlign=align;
  document.body.dataset.readerFont=readerFont;
  document.body.classList.toggle('reader-hide-verse-numbers',!showNumbers);
  document.body.classList.toggle('reader-hyper-active',mode==='hyper');

  const sizeEl=document.getElementById('swSize');
  const sizeOut=document.getElementById('swSizeValue');
  const marginEl=document.getElementById('swTextMargin');
  const marginOut=document.getElementById('swTextMarginValue');
  const verseEl=document.getElementById('swVerseNumbers');
  if(sizeEl&&Number(sizeEl.value)!==size)sizeEl.value=size;
  if(sizeOut)sizeOut.textContent=String(size).replace('.',',');
  if(marginEl&&Number(marginEl.value)!==margin)marginEl.value=margin;
  if(marginOut)marginOut.textContent=margin+' px';
  if(verseEl){verseEl.checked=showNumbers;verseEl.disabled=mode==='hyper'}

  document.querySelectorAll('[data-reader-align]').forEach(b=>{
    b.classList.toggle('on',b.dataset.readerAlign===align);
    b.disabled=mode==='hyper';
  });
  document.querySelectorAll('[data-reader-font]').forEach(b=>b.classList.toggle('on',b.dataset.readerFont===readerFont));
  const hint=document.getElementById('readerTextHint');
  if(hint)hint.textContent=mode==='hyper'
    ?'A Hiperliteral está ativa: alinhamento e números permanecem na formatação editorial própria.'
    :'Alinhamento e números também acompanham a leitura paralela.';
  if(save)savePrefs();
}

function updateStorageNote(){const el=document.getElementById('storageNote');el.textContent=storageMode==='memory'?'O navegador bloqueou o armazenamento permanente. As alterações desta abertura ficam apenas na memória.':'Marcações, posição de leitura e ajustes ficam salvos neste aparelho/navegador. Use Exportar marcações para backup.'}


/* ---------- aparência ---------- */
const APPEARANCE_PRESETS={
  paper:{page:'#E6E3DA',text:'#23262C',accent:'#8C2F39',secondary:'#2F5D50',chrome:'#DEDAD0',texture:false},
  sepia:{page:'#E6CEA0',text:'#2A2117',accent:'#9A4F31',secondary:'#556B4F',chrome:'#D6BC8A',texture:true},
  white:{page:'#FBFAF7',text:'#171717',accent:'#2F5D50',secondary:'#2F5D50',chrome:'#EFEDEA',texture:false},
  night:{page:'#1E2024',text:'#DEDBD2',accent:'#C97A72',secondary:'#7FA893',chrome:'#292B30',texture:false},
  olive:{page:'#D9D6C1',text:'#28291F',accent:'#7A4F3A',secondary:'#596D4E',chrome:'#C9C5AA',texture:true}
};
let appearance={normal:{...APPEARANCE_PRESETS.paper}};
function validHex(v,fallback){return /^#[0-9a-f]{6}$/i.test(String(v||''))?String(v).toUpperCase():fallback}
function hexRgb(h){h=validHex(h,'#000000').slice(1);return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function rgbHex(a){return'#'+a.map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('').toUpperCase()}
function mixHex(a,b,t){const A=hexRgb(a),B=hexRgb(b);return rgbHex(A.map((x,i)=>x+(B[i]-x)*t))}
function normalizeAppearance(){
  const d=APPEARANCE_PRESETS.paper;
  appearance.normal=Object.assign({},d,appearance.normal||{});
  for(const k of ['page','text','accent','secondary','chrome'])appearance.normal[k]=validHex(appearance.normal[k],d[k]);
  appearance.normal.texture=!!appearance.normal.texture;
}
async function loadAppearance(){
  const raw=await getStored(KEY_APPEARANCE);
  if(raw){try{const x=JSON.parse(raw);if(x&&typeof x==='object'){
    // Migração: versões anteriores guardavam normal e paralelo separadamente.
    if(x.normal)appearance.normal=Object.assign({},appearance.normal,x.normal);
    else appearance.normal=Object.assign({},appearance.normal,x);
  }}catch(e){}}
  normalizeAppearance();applyAppearance(false)
}
async function saveAppearance(){normalizeAppearance();return setStored(KEY_APPEARANCE,JSON.stringify({normal:appearance.normal}))}
function applyAppearance(syncControls=true){
  normalizeAppearance();const r=document.documentElement.style,n=appearance.normal;
  r.setProperty('--paper',n.page);r.setProperty('--paper-2',n.chrome);r.setProperty('--ink',n.text);r.setProperty('--rubric',n.accent);r.setProperty('--verdigris',n.secondary);
  r.setProperty('--ink-soft',mixHex(n.text,n.page,.36));r.setProperty('--ink-faint',mixHex(n.text,n.page,.58));r.setProperty('--rule',mixHex(n.page,n.text,.18));r.setProperty('--hit',mixHex(n.page,n.accent,.28));
  // Variáveis antigas ficam espelhadas para compatibilidade, mas o paralelo usa o mesmo tema do leitor.
  r.setProperty('--parallel-paper',n.page);r.setProperty('--parallel-ink',n.text);r.setProperty('--parallel-accent',n.accent);r.setProperty('--parallel-chrome',n.chrome);
  document.body.classList.toggle('normal-paper-texture',n.texture);
  if(syncControls)syncAppearanceControls();
}
function syncAppearanceControls(){
  const n=appearance.normal,map={normalPageColor:n.page,normalTextColor:n.text,normalAccentColor:n.accent,normalChromeColor:n.chrome};
  for(const [id,val] of Object.entries(map)){const el=document.getElementById(id);if(el)el.value=val}
  const nt=document.getElementById('normalTexture');if(nt)nt.checked=n.texture;
}
let appearanceSaveTimer=null;function scheduleAppearanceSave(){clearTimeout(appearanceSaveTimer);appearanceSaveTimer=setTimeout(saveAppearance,120)}
function bindAppearance(){
  syncAppearanceControls();
  const bindings=[['normalPageColor','page'],['normalTextColor','text'],['normalAccentColor','accent'],['normalChromeColor','chrome']];
  bindings.forEach(([id,key])=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('input',()=>{appearance.normal[key]=el.value;applyAppearance(false);scheduleAppearanceSave()})});
  const nt=document.getElementById('normalTexture');if(nt)nt.onchange=e=>{appearance.normal.texture=e.target.checked;applyAppearance(false);scheduleAppearanceSave()};
  document.querySelectorAll('.theme-preset[data-theme-target="normal"]').forEach(b=>b.onclick=()=>{const src=APPEARANCE_PRESETS[b.dataset.themePreset];if(!src)return;appearance.normal={...src};applyAppearance(true);saveAppearance()});
  const reset=document.getElementById('normalAppearanceReset');if(reset)reset.onclick=()=>{appearance.normal={...APPEARANCE_PRESETS.paper};applyAppearance(true);saveAppearance()};
}

/* ---------- Strong+ / OSHB ---------- */
const OSHB_BOOK_INDEX=Object.fromEntries(OSHB_STRONG.b.map((x,i)=>[x,i]));
const OSHB_LEX_CACHE=new Map();
let strongCurrent=null;
const HEB_PREFIX={b:'ב',c:'ו',d:'ה',k:'כ',l:'ל',m:'מ',i:'ה',s:'ש'};
const HEB_PREFIX_LABEL={b:'preposição בְּ',c:'conjunção וְ',d:'artigo definido הַ',k:'preposição כְּ',l:'preposição לְ',m:'preposição מִן/מִ־',i:'partícula interrogativa הֲ',s:'partícula relativa שֶׁ'};
function oshbVerse(book,chapter,verse){const bi=OSHB_BOOK_INDEX[book];return bi==null?null:OSHB_STRONG.d?.[bi]?.[chapter-1]?.[verse-1]||null}
function oshbTokenText(items){let out='';for(const it of items||[]){if(Array.isArray(it)){if(out&&!out.endsWith('־')&&!out.endsWith(' '))out+=' ';out+=it[0]}else if(it==='־'){out=out.replace(/\s+$/,'')+'־'}else if(it==='׃'){out=out.replace(/\s+$/,'')+' ׃'}else{out+=(out&&!out.endsWith(' ')?' ':'')+it}}return out.trim()}
function renderOshbVerse(book,chapter,v){const items=oshbVerse(book,chapter,v.number);if(!items)return '<span class="verse" id="v'+v.number+'"><sup class="vnum">'+v.number+'</sup>'+esc(v.text)+'</span>';let h='<span class="verse'+(focusVerse===v.number?' focus':'')+'" id="v'+v.number+'"><sup class="vnum">'+v.number+'</sup>';for(let ti=0;ti<items.length;ti++){const it=items[ti],prev=items[ti-1];if(Array.isArray(it)){if(ti>0&&Array.isArray(prev))h+=' ';h+='<span class="oshb-word" tabindex="0" role="button" data-b="'+esc(book)+'" data-c="'+chapter+'" data-v="'+v.number+'" data-ti="'+ti+'">'+esc(it[0])+'</span>'}else if(it==='־'){h+='<span class="oshb-punct">־</span>'}else{h+='<span class="oshb-punct"> '+esc(it)+'</span>'}}return h+'</span>'}
function lexicalFromToken(tok){if(!tok||tok[3]<0)return null;return OSHB_STRONG.l[tok[3]]||null}
function mainLemmaFromAttr(attr){const p=String(attr||'').split('/').reverse().find(x=>/^\d/.test(x.trim()));return p?p.trim():''}
function prefixesFromAttr(attr){return String(attr||'').split('/').map(x=>x.trim()).filter(x=>x&&!/^\d/.test(x)).map(x=>HEB_PREFIX_LABEL[x]||x)}
function morphSegment(code,lang){if(!code)return'';let c=code;if(c[0]==='H'||c[0]==='A'){lang=c[0];c=c.slice(1)}const L=lang==='A'?'Aramaico':'Hebraico';const pos={A:'adjetivo',C:'conjunção',D:'advérbio',N:'substantivo',P:'pronome',R:'preposição',S:'sufixo',T:'partícula',V:'verbo'};const gender={b:'ambos os gêneros',c:'gênero comum',f:'feminino',m:'masculino',x:'gênero não especificado'};const number={d:'dual',p:'plural',s:'singular',x:'número não especificado'};const state={a:'absoluto',c:'construto',d:'determinado',x:'estado não especificado'};const person={'1':'1ª pessoa','2':'2ª pessoa','3':'3ª pessoa',x:'pessoa não especificada'};let a=[L];if(!c)return a.join(' · ');const p=c[0];a.push(pos[p]||p);
 if(p==='V'){const stemsH={q:'Qal',N:'Nifal',p:'Piel',P:'Pual',h:'Hifil',H:'Hofal',t:'Hitpael',o:'Polel',O:'Polal',r:'Hitpolel',m:'Poel',M:'Poal',k:'Palel',K:'Pulal',Q:'Qal passivo',l:'Pilpel',L:'Polpal',f:'Hitpalpel',D:'Nitpael',j:'Pealal',i:'Pilel',u:'Hotpaal',c:'Tifil',v:'Hishtafel',w:'Nitpalel',y:'Nitpoel',z:'Hitpoel'};const stemsA={q:'Peal',Q:'Peil',u:'Hitpeel',p:'Pael',P:'Itpaal',M:'Hitpaal',a:'Afel',h:'Hafel',s:'Safel',e:'Shafel',H:'Hofal',i:'Itpeel',t:'Hishtafel',v:'Ishtafel',w:'Hitafel',o:'Polel',z:'Itpoel',r:'Hitpolel',f:'Hitpalpel',b:'Hefal',c:'Tifel',m:'Poel',l:'Palpel',L:'Itpalpel',O:'Itpolel',G:'Ittafal'};const types={p:'perfeito (qatal)',q:'perfeito sequencial (weqatal)',i:'imperfeito (yiqtol)',w:'imperfeito sequencial (wayyiqtol)',h:'coortativo',j:'jussivo',v:'imperativo',r:'particípio ativo',s:'particípio passivo',a:'infinitivo absoluto',c:'infinitivo construto'};a.push((lang==='A'?stemsA:stemsH)[c[1]]||c[1]);a.push(types[c[2]]||c[2]);let i=3;if(['p','q','i','w','h','j','v'].includes(c[2])){if(person[c[i]])a.push(person[c[i]]);i++;if(gender[c[i]])a.push(gender[c[i]]);i++;if(number[c[i]])a.push(number[c[i]])}else if(['r','s'].includes(c[2])){if(gender[c[i]])a.push(gender[c[i]]);i++;if(number[c[i]])a.push(number[c[i]]);i++;if(state[c[i]])a.push(state[c[i]])}}
 else if(p==='N'){const typ={c:'comum',g:'gentílico',p:'nome próprio'};if(typ[c[1]])a.push(typ[c[1]]);if(gender[c[2]])a.push(gender[c[2]]);if(number[c[3]])a.push(number[c[3]]);if(state[c[4]])a.push(state[c[4]])}
 else if(p==='A'){const typ={a:'qualificativo',c:'número cardinal',g:'gentílico',o:'número ordinal'};if(typ[c[1]])a.push(typ[c[1]]);if(gender[c[2]])a.push(gender[c[2]]);if(number[c[3]])a.push(number[c[3]]);if(state[c[4]])a.push(state[c[4]])}
 else if(p==='P'){const typ={d:'demonstrativo',f:'indefinido',i:'interrogativo',p:'pessoal',r:'relativo'};if(typ[c[1]])a.push(typ[c[1]]);if(person[c[2]])a.push(person[c[2]]);if(gender[c[3]])a.push(gender[c[3]]);if(number[c[4]])a.push(number[c[4]])}
 else if(p==='R'){if(c[1]==='d')a.push('com artigo definido assimilado')}
 else if(p==='S'){const typ={d:'he direcional',h:'he paragógico',n:'nun paragógico',p:'pronominal'};if(typ[c[1]])a.push(typ[c[1]]);if(c[1]==='p'){if(person[c[2]])a.push(person[c[2]]);if(gender[c[3]])a.push(gender[c[3]]);if(number[c[4]])a.push(number[c[4]])}}
 else if(p==='T'){const typ={a:'afirmação',d:'artigo definido',e:'exortação',i:'interrogativa',j:'interjeição',m:'demonstrativa',n:'negativa',o:'marcador de objeto direto',r:'relativa'};if(typ[c[1]])a.push(typ[c[1]])}
 return a.filter(Boolean).join(' · ')}
function decodeMorph(full){if(!full)return'—';let lang=full[0]==='A'?'A':'H';return full.split('/').map((s,i)=>morphSegment(s,i===0?null:lang)).join(' + ')}
function strongEsc(s){return esc(s||'')}
function openStrong(el){document.querySelectorAll('.oshb-word.sel').forEach(x=>x.classList.remove('sel'));el.classList.add('sel');const book=el.dataset.b,c=+el.dataset.c,v=+el.dataset.v,ti=+el.dataset.ti,items=oshbVerse(book,c,v),tok=items?.[ti];if(!tok)return;strongCurrent={book,c,v,ti,tok,lex:lexicalFromToken(tok),parallelSide:el.dataset.side||null};renderStrongLex();setStrongTab('lex');document.getElementById('strongBackdrop').classList.add('on');document.getElementById('strongSheet').classList.add('on');document.getElementById('strongSheet').setAttribute('aria-hidden','false');document.body.classList.add('strong-open')}
function closeStrong(){document.getElementById('strongBackdrop').classList.remove('on');document.getElementById('strongSheet').classList.remove('on');document.getElementById('strongSheet').setAttribute('aria-hidden','true');document.body.classList.remove('strong-open');document.querySelectorAll('.oshb-word.sel').forEach(x=>x.classList.remove('sel'))}
function renderStrongLex(){const s=strongCurrent;if(!s)return;const tok=s.tok,lex=s.lex,lemmaAttr=OSHB_STRONG.la[tok[1]]||'',morph=OSHB_STRONG.m[tok[2]]||'';document.getElementById('strongForm').textContent=tok[0];document.getElementById('strongXlit').textContent=lex?.[4]||'';const pref=prefixesFromAttr(lemmaAttr);let grid='';const cell=(l,v,cl='')=>'<div class="strong-cell"><div class="strong-label">'+strongEsc(l)+'</div><div class="strong-value '+cl+'">'+(v||'—')+'</div></div>';grid+=cell('Lema',lex?.[3]?strongEsc(lex[3]):'—','he');grid+=cell('Strong',lex?strongEsc(lex[1]+(lex[2]?' · variante '+lex[2]+' OSHB':'')):'—');grid+=cell('Raiz',lex?.[5]?strongEsc(lex[5]):'—','he');grid+=cell('Ocorrências',lex?Number(lex[12]).toLocaleString('pt-BR'):'—');let html='<div class="strong-grid">'+grid+'</div>';html+='<div class="strong-section"><h3>Morfologia</h3><p>'+strongEsc(decodeMorph(morph))+'</p><div class="strong-badges">'+(pref.length?pref.map(x=>'<span class="strong-badge">'+strongEsc(x)+'</span>').join(''):'')+'<span class="strong-badge">OSHB '+strongEsc(morph)+'</span></div></div>';if(lex){const pt=doxaStrongPtEntry(lex);html+='<div class="strong-section"><span class="strong-pt-kicker">Português · Doxa</span><h3>Significado em português</h3>'+(pt.m.length?'<div class="strong-meanings">'+pt.m.map(x=>'<span class="strong-meaning">'+strongEsc(x)+'</span>').join('')+'</div>':'<p>Sentido lexical dependente do contexto.</p>')+'<p class="muted">Camada PT-BR vinculada ao número Strong; o original é preservado abaixo para conferência.</p></div>';html+='<div class="strong-section"><h3>Resumo lexical</h3><p>'+strongEsc(doxaStrongPtSummary(lex))+'</p></div>';if(lex[11])html+='<div class="strong-section"><h3>Origem / derivação</h3><p>'+strongEsc(doxaPtEnLex(lex[11]))+'</p></div>';let refs=[];if(lex[13])refs.push('BDB '+lex[13]);if(lex[14])refs.push('TWOT '+lex[14]);if(refs.length)html+='<div class="strong-section"><h3>Referências lexicais</h3><p class="muted">'+refs.map(strongEsc).join(' · ')+'</p></div>';html+='<details class="lex-original"><summary>Ver original em inglês</summary><div class="lex-original-body">'+(lex[7]?'<b>Glosa OSHB</b><p>'+strongEsc(lex[7])+'</p>':'')+(lex[8]?.length?'<b>BDB · glosas</b><p>'+lex[8].map(strongEsc).join(' · ')+'</p>':'')+(lex[9]?'<b>Strong · significado</b><p>'+strongEsc(lex[9])+'</p>':'')+(lex[10]?'<b>Strong · usos</b><p>'+strongEsc(lex[10])+'</p>':'')+(lex[11]?'<b>Strong · origem</b><p>'+strongEsc(lex[11])+'</p>':'')+'</div></details>'}else html+='<div class="strong-section"><h3>Morfema gramatical</h3><p>Esta unidade não possui um número Strong lexical próprio no atributo de lema do OSHB.</p></div>';document.getElementById('strongLex').innerHTML=html;document.getElementById('strongOcc').innerHTML='<div class="empty">Abra a aba Ocorrências para calcular a concordância deste lema.</div>'}
const OCC_PAGE_SIZE=100;
let strongOccState={lexIndex:null,book:'all',visible:OCC_PAGE_SIZE};
function cacheOccurrence(lexIndex,data){
  if(OSHB_LEX_CACHE.has(lexIndex))OSHB_LEX_CACHE.delete(lexIndex);
  OSHB_LEX_CACHE.set(lexIndex,data);
  while(OSHB_LEX_CACHE.size>6){const first=OSHB_LEX_CACHE.keys().next().value;OSHB_LEX_CACHE.delete(first)}
}
function occurrenceData(lexIndex){
  if(OSHB_LEX_CACHE.has(lexIndex)){const v=OSHB_LEX_CACHE.get(lexIndex);OSHB_LEX_CACHE.delete(lexIndex);OSHB_LEX_CACHE.set(lexIndex,v);return v}
  const hits=[],books=new Map(),forms=new Map();
  for(let bi=0;bi<OSHB_STRONG.d.length;bi++){
    const b=OSHB_STRONG.d[bi];
    for(let ci=0;ci<(b?.length||0);ci++){
      const ch=b[ci];
      for(let vi=0;vi<(ch?.length||0);vi++){
        const items=ch[vi];let found=false;
        for(const it of items||[]){if(Array.isArray(it)&&it[3]===lexIndex){found=true;forms.set(it[0],(forms.get(it[0])||0)+1)}}
        if(found){books.set(bi,(books.get(bi)||0)+1);hits.push([bi,ci+1,vi+1,oshbTokenText(items)])}
      }
    }
  }
  const r={hits,books:[...books.entries()],forms:[...forms.entries()].sort((a,b)=>b[1]-a[1])};cacheOccurrence(lexIndex,r);return r
}
function renderStrongOccurrences(reset=false){
  const s=strongCurrent,host=document.getElementById('strongOcc');
  if(!s||s.tok[3]<0){host.innerHTML='<div class="empty">Não há lema Strong associado a esta unidade.</div>';return}
  const li=s.tok[3],lex=OSHB_STRONG.l[li],o=occurrenceData(li);
  if(reset||strongOccState.lexIndex!==li){strongOccState={lexIndex:li,book:'all',visible:OCC_PAGE_SIZE}}
  const bookValue=strongOccState.book;
  const filtered=bookValue==='all'?o.hits:o.hits.filter(h=>String(h[0])===String(bookValue));
  const shown=filtered.slice(0,strongOccState.visible),wordTotal=Number(lex[12])||0,verseTotal=o.hits.length;
  const bookRows=[...o.books].sort((a,b)=>a[0]-b[0]);
  let html='<div class="occ-summary"><b>'+wordTotal.toLocaleString('pt-BR')+'</b> ocorrências da entrada lexical em <b>'+verseTotal.toLocaleString('pt-BR')+'</b> versículos do OSHB.</div>';
  html+='<div class="occ-tools"><label><span>Filtrar por livro</span><select id="occBookFilter"><option value="all">Todos os livros · '+verseTotal.toLocaleString('pt-BR')+'</option>'+bookRows.map(([bi,n])=>'<option value="'+bi+'"'+(String(bookValue)===String(bi)?' selected':'')+'>'+strongEsc(BOOK_NAMES[OSHB_STRONG.b[bi]]||OSHB_STRONG.b[bi])+' · '+n+'</option>').join('')+'</select></label></div>';
  html+='<div class="occ-books">'+[...o.books].sort((a,b)=>b[1]-a[1]).slice(0,20).map(([bi,n])=>'<button type="button" class="occ-book'+(String(bookValue)===String(bi)?' on':'')+'" data-occ-book="'+bi+'">'+strongEsc(BOOK_NAMES[OSHB_STRONG.b[bi]]||OSHB_STRONG.b[bi])+' '+n+'</button>').join('')+'</div>';
  if(o.forms.length)html+='<div class="strong-section"><h3>Formas mais frequentes</h3><div class="strong-badges">'+o.forms.slice(0,18).map(([f,n])=>'<span class="strong-badge" dir="rtl">'+strongEsc(f)+' · '+n+'</span>').join('')+'</div></div>';
  html+='<div class="occ-progress">Mostrando '+(shown.length?1:0)+'–'+shown.length.toLocaleString('pt-BR')+' de '+filtered.length.toLocaleString('pt-BR')+' versículos'+(bookValue==='all'?'':' neste livro')+'.</div>';
  html+='<ul class="occ-list">'+shown.map(([bi,c,v,text])=>'<li data-ob="'+bi+'" data-oc="'+c+'" data-ov="'+v+'"><div class="occ-ref">'+strongEsc(BOOK_NAMES[OSHB_STRONG.b[bi]]||OSHB_STRONG.b[bi])+' '+c+':'+v+'</div><div class="occ-text">'+strongEsc(text)+'</div></li>').join('')+'</ul>';
  if(shown.length<filtered.length)html+='<button class="btn occ-load-more" id="strongOccMore" type="button">Carregar mais '+Math.min(OCC_PAGE_SIZE,filtered.length-shown.length).toLocaleString('pt-BR')+'</button>';
  else if(filtered.length)html+='<div class="occ-more">Todas as ocorrências deste filtro estão carregadas.</div>';
  host.innerHTML=html;
  const sel=document.getElementById('occBookFilter');if(sel)sel.onchange=e=>{strongOccState.book=e.target.value;strongOccState.visible=OCC_PAGE_SIZE;renderStrongOccurrences(false)};
  host.querySelectorAll('[data-occ-book]').forEach(b=>b.onclick=()=>{strongOccState.book=String(b.dataset.occBook);strongOccState.visible=OCC_PAGE_SIZE;renderStrongOccurrences(false)});
  const more=document.getElementById('strongOccMore');if(more)more.onclick=()=>{strongOccState.visible+=OCC_PAGE_SIZE;renderStrongOccurrences(false);setTimeout(()=>more?.scrollIntoView({block:'nearest'}),0)};
}
function setStrongTab(name){document.querySelectorAll('.strong-tab').forEach(x=>x.classList.toggle('on',x.dataset.stab===name));document.getElementById('strongLex').classList.toggle('on',name==='lex');document.getElementById('strongOcc').classList.toggle('on',name==='occ');if(name==='occ')renderStrongOccurrences(strongOccState.lexIndex!==strongCurrent?.tok?.[3])}


/* ---------- Leitura paralela ---------- */
let parallelOn=false,parallelSync=true,parallelLayout='horizontal',parallelScrollLock=false,parallelScrollTimer=null;
let parallelState={A:{mode:'almeida',book:'Gen',chapter:1,hIdx:0},B:{mode:'wlc',book:'Gen',chapter:1,hIdx:0}};
const PARALLEL_VERSION_OPTIONS=[['almeida','Almeida 1819'],['wlc','WLC + Strong'],['tr','TR 1550'],['hyper','Hiperliteral']];
function cloneParallelState(x){return JSON.parse(JSON.stringify(x))}
async function loadParallel(){try{const raw=await getStored(KEY_PARALLEL),savedLayout=await getStored(KEY_PARALLEL_LAYOUT);if(raw){const x=JSON.parse(raw);parallelOn=!!x.on;parallelSync=x.sync!==false;if(x.state?.A&&x.state?.B)parallelState=x.state}parallelLayout=savedLayout==='vertical'?'vertical':'horizontal'}catch(e){parallelLayout='horizontal'}sanitizeParallelState('A');sanitizeParallelState('B')}
async function saveParallel(){await setStored(KEY_PARALLEL,JSON.stringify({on:parallelOn,sync:parallelSync,layout:parallelLayout,state:parallelState}));return setStored(KEY_PARALLEL_LAYOUT,parallelLayout)}
function hyperRange(i){const ref=HYPER_BLOCKS[Math.max(0,Math.min(HYPER_BLOCKS.length-1,i))]?.ref||'Gn 1.1';const m=ref.match(/Gn\s+(\d+)\.(\d+)(?:[–-](?:(\d+)\.)?(\d+))?/);if(!m)return{sc:1,sv:1,ec:1,ev:1};const sc=+m[1],sv=+m[2],ec=m[3]?+m[3]:sc,ev=m[4]?+m[4]:sv;return{sc,sv,ec,ev}}
function hyperBlockForChapter(ch){ch=+ch;let exact=HYPER_BLOCKS.findIndex((_,i)=>{const r=hyperRange(i);return ch>=r.sc&&ch<=r.ec});return exact>=0?exact:0}
function parallelCorpus(st){return st.mode==='hyper'?null:CORPORA[st.mode]}
function sanitizeParallelState(side){const st=parallelState[side]||(parallelState[side]={mode:side==='A'?'almeida':'wlc',book:'Gen',chapter:1,hIdx:0});if(!(st.mode==='hyper'||CORPORA[st.mode]))st.mode=side==='A'?'almeida':'wlc';if(st.mode==='hyper'){st.hIdx=Math.max(0,Math.min(HYPER_BLOCKS.length-1,Number(st.hIdx)||0));st.book='Gen';st.chapter=hyperRange(st.hIdx).sc;return st}const cp=CORPORA[st.mode];let bi=cp.books.findIndex(b=>b.book===st.book);if(bi<0)bi=0;const b=cp.books[bi];st.book=b.book;const nums=b.chapters.map(c=>Number(c.chapter));st.chapter=nums.includes(Number(st.chapter))?Number(st.chapter):nums[0];return st}
function parallelCanonical(side){const st=sanitizeParallelState(side);if(st.mode==='hyper'){const r=hyperRange(st.hIdx);return{book:'Gen',chapter:r.sc}}return{book:st.book,chapter:Number(st.chapter)}}
function parallelRef(side){const st=sanitizeParallelState(side);if(st.mode==='hyper')return HYPER_BLOCKS[st.hIdx].ref;const cp=CORPORA[st.mode],b=cp.books.find(x=>x.book===st.book);return (b?bookName(b):st.book)+' '+st.chapter}
function setParallelStatus(msg,bad=false){const el=document.getElementById('parallelStatus');if(!el)return;el.textContent=msg;el.style.color=bad?'var(--rubric)':'var(--ink-faint)'}
function testamentForBook(book){const b=ALMEIDA.books.find(x=>x.book===book);return b?.testament||(WLC.books.some(x=>x.book===book)?'OT':(TR.books.some(x=>x.book===book)?'NT':null))}
function originalModeForBook(book){return testamentForBook(book)==='NT'?'tr':'wlc'}
function adaptParallelTargetToPassage(side,book,chapter){
  const st=parallelState[side]||(parallelState[side]={mode:'almeida',book,chapter,hIdx:0});
  const before=st.mode;
  if(!modeHasPassage(st.mode,book,chapter)){
    if(st.mode==='wlc'||st.mode==='tr') st.mode=originalModeForBook(book);
    else if(st.mode==='hyper') st.mode='almeida';
    if(!modeHasPassage(st.mode,book,chapter)){
      for(const cand of ['almeida',originalModeForBook(book),'wlc','tr','hyper']){if(modeHasPassage(cand,book,chapter)){st.mode=cand;break}}
    }
  }
  if(st.mode==='hyper'){
    st.hIdx=hyperBlockForChapter(chapter);st.book='Gen';st.chapter=Number(chapter);
  }else{
    st.book=book;st.chapter=Number(chapter);st.hIdx=0;
  }
  return before!==st.mode;
}
function syncParallelFrom(sourceSide,{render=true}={}){
  if(!parallelSync)return false;
  const targetSide=sourceSide==='A'?'B':'A',src=parallelCanonical(sourceSide);
  const changed=adaptParallelTargetToPassage(targetSide,src.book,src.chapter);
  const t=parallelState[targetSide],ok=modeHasPassage(t.mode,src.book,src.chapter);
  if(ok)setParallelStatus(changed?'Sincronizado · versão original ajustada ao testamento.':'Sincronizado · livro, capítulo e rolagem por versículo.');
  else setParallelStatus('Não foi possível abrir esta passagem no outro painel.',true);
  if(render)renderParallel();return ok
}
function parallelRenderOshbVerse(book,chapter,v,side){const items=oshbVerse(book,chapter,v.number);if(!items)return '<span class="verse" data-v="'+v.number+'"><sup class="vnum">'+v.number+'</sup>'+esc(v.text)+'</span>';let h='<span class="verse" data-v="'+v.number+'"><sup class="vnum">'+v.number+'</sup>';for(let ti=0;ti<items.length;ti++){const it=items[ti],prev=items[ti-1];if(Array.isArray(it)){if(ti>0&&Array.isArray(prev))h+=' ';h+='<span class="oshb-word" tabindex="0" role="button" data-side="'+side+'" data-b="'+esc(book)+'" data-c="'+chapter+'" data-v="'+v.number+'" data-ti="'+ti+'">'+esc(it[0])+'</span>'}else if(it==='־'){h+='<span class="oshb-punct">־</span>'}else{h+='<span class="oshb-punct"> '+esc(it)+'</span>'}}return h+'</span>'}
function renderParallelSide(side){const st=sanitizeParallelState(side),vSel=document.getElementById('pVersion'+side),bSel=document.getElementById('pBook'+side),cSel=document.getElementById('pChapter'+side),nav=document.getElementById('pNav'+side),txt=document.getElementById('pText'+side),ref=document.getElementById('pRef'+side);vSel.innerHTML=PARALLEL_VERSION_OPTIONS.map(([v,l])=>'<option value="'+v+'">'+esc(l)+'</option>').join('');vSel.value=st.mode;ref.textContent=parallelRef(side);txt.classList.toggle('hebrew',st.mode==='wlc');txt.classList.toggle('parallel-hyper',st.mode==='hyper');txt.setAttribute('dir',st.mode==='wlc'?'rtl':'ltr');if(st.mode==='hyper'){nav.className='parallel-nav hyper';bSel.style.display='block';cSel.style.display='none';bSel.innerHTML=HYPER_BLOCKS.map((x,i)=>'<option value="'+i+'">'+(i+1)+'. '+esc(x.ref)+'</option>').join('');bSel.value=String(st.hIdx);const b=HYPER_BLOCKS[st.hIdx];txt.innerHTML=b.t.split(/\n\n+/).map(par=>{const lines=par.split('\n');return lines.map((ln,i)=>{const cls=ln.trim().startsWith('—')?'speech':(lines.length>1&&i===0?'lead':'');return'<p'+(cls?' class="'+cls+'"':'')+'>'+decorate(ln)+'</p>'}).join('')}).join('');document.getElementById('pPrev'+side).disabled=st.hIdx===0;document.getElementById('pNext'+side).disabled=st.hIdx===HYPER_BLOCKS.length-1;return}const cp=CORPORA[st.mode],bi=cp.books.findIndex(b=>b.book===st.book),b=cp.books[Math.max(0,bi)],c=b.chapters.find(x=>Number(x.chapter)===Number(st.chapter))||b.chapters[0];st.book=b.book;st.chapter=Number(c.chapter);nav.className='parallel-nav';bSel.style.display='block';cSel.style.display='block';bSel.innerHTML=cp.books.map(x=>'<option value="'+esc(x.book)+'">'+esc(bookName(x))+'</option>').join('');bSel.value=st.book;cSel.innerHTML=b.chapters.map(x=>'<option value="'+x.chapter+'">Capítulo '+x.chapter+'</option>').join('');cSel.value=String(st.chapter);txt.innerHTML=st.mode==='wlc'?c.verses.map(v=>parallelRenderOshbVerse(b.book,st.chapter,v,side)).join(''):c.verses.map(v=>'<span class="verse" data-v="'+v.number+'"><sup class="vnum">'+v.number+'</sup>'+esc(v.text)+'</span>').join('');const firstBook=cp.books[0],lastBook=cp.books.at(-1);document.getElementById('pPrev'+side).disabled=b.book===firstBook.book&&Number(st.chapter)===Number(firstBook.chapters[0].chapter);document.getElementById('pNext'+side).disabled=b.book===lastBook.book&&Number(st.chapter)===Number(lastBook.chapters.at(-1).chapter)}
function applyParallelLayout(){
  document.body.classList.toggle('parallel-layout-vertical',parallelLayout!=='horizontal');
  document.body.classList.toggle('parallel-layout-horizontal',parallelLayout==='horizontal');
  const b=document.getElementById('parallelOrientation');
  if(b){
    const horizontal=parallelLayout==='horizontal';
    b.textContent=horizontal?'↔':'↕';
    b.setAttribute('aria-pressed',String(horizontal));
    b.setAttribute('aria-label',horizontal?'Usar janelas verticais':'Usar janelas horizontais');
    b.title=horizontal?'Mudar para vertical':'Mudar para horizontal';
  }
}

function parallelStepTarget(side,delta){
  const st=sanitizeParallelState(side),step=Number(delta)>0?1:-1;
  if(st.mode==='hyper'){
    const n=st.hIdx+step;
    if(n<0||n>=HYPER_BLOCKS.length)return null;
    const r=hyperRange(n);
    return{book:'Gen',chapter:Number(r.sc)||1,hIdx:n,hyper:true};
  }
  const src=parallelCanonical(side);
  let navCorpus=CORPORA.almeida;
  let bi=navCorpus?.books?.findIndex(b=>b.book===src.book)??-1;
  if(bi<0){
    navCorpus=CORPORA[st.mode];
    bi=navCorpus?.books?.findIndex(b=>b.book===src.book)??-1;
  }
  if(!navCorpus||bi<0)return null;
  const b=navCorpus.books[bi];
  let ci=b.chapters.findIndex(c=>Number(c.chapter)===Number(src.chapter));
  if(ci<0)ci=0;
  if(step>0){
    if(ci<b.chapters.length-1)return{book:b.book,chapter:Number(b.chapters[ci+1].chapter)};
    if(bi<navCorpus.books.length-1){
      const nb=navCorpus.books[bi+1];
      return{book:nb.book,chapter:Number(nb.chapters[0].chapter)};
    }
  }else{
    if(ci>0)return{book:b.book,chapter:Number(b.chapters[ci-1].chapter)};
    if(bi>0){
      const pb=navCorpus.books[bi-1];
      return{book:pb.book,chapter:Number(pb.chapters.at(-1).chapter)};
    }
  }
  return null;
}
function refreshParallelNavButtons(){
  if(!parallelOn)return;
  for(const side of ['A','B']){
    const prev=document.getElementById('pPrev'+side),next=document.getElementById('pNext'+side);
    if(!prev||!next)continue;
    if(parallelSync){
      prev.disabled=!parallelStepTarget(side,-1);
      next.disabled=!parallelStepTarget(side,1);
    }
    prev.classList.toggle('parallel-edge-disabled',prev.disabled);
    next.classList.toggle('parallel-edge-disabled',next.disabled);
  }
}
function animateParallelPage(side,delta){
  const sides=parallelSync?['A','B']:[side];
  for(const s of sides){
    const pane=document.querySelector('.parallel-pane[data-side="'+s+'"]');
    if(!pane)continue;
    pane.classList.remove('parallel-page-forward','parallel-page-back');
    void pane.offsetWidth;
    pane.classList.add(Number(delta)>0?'parallel-page-forward':'parallel-page-back');
    setTimeout(()=>pane.classList.remove('parallel-page-forward','parallel-page-back'),360);
  }
}
function renderParallel(){
  if(!parallelOn)return;
  applyParallelLayout();
  renderParallelSide('A');renderParallelSide('B');
  document.getElementById('parallelSync').checked=parallelSync;
  document.body.classList.toggle('parallel-synced',parallelSync);
  document.querySelectorAll('.parallel-sync-clone').forEach(b=>b.setAttribute('aria-pressed',String(parallelSync)));
  for(const side of ['A','B']){
    const btn=document.getElementById('pPassage'+side);
    if(btn)btn.innerHTML='<span>'+esc(parallelRef(side))+'</span><span class="parallel-passage-chevron" aria-hidden="true">⌄</span>';
  }
  const gs=document.getElementById('parallelGlobalSync');
  if(gs){gs.classList.toggle('on',parallelSync);gs.setAttribute('aria-pressed',String(parallelSync));}
  const st=document.getElementById('parallelAppStatus');
  if(st)st.textContent=parallelSync?'Sincronizada por versículo':'Navegação independente';
  document.getElementById('hdrRef').textContent=parallelRef('A')+'  ∥  '+parallelRef('B');
  document.getElementById('hdrVersion').textContent=parallelSync?'Leitura paralela · sincronizada':'Leitura paralela · independente';
  document.getElementById('hdrPage').textContent=parallelSync?'↔':'∥';
  document.getElementById('progressFill').style.width='100%';
  refreshParallelNavButtons();
  saveParallel();
}
function singleVisibleVerse(){if(mode==='hyper')return hyperRange(hIdx).sv;const body=document.getElementById('textBody'),verses=[...body.querySelectorAll('.verse[id^="v"]')];if(!verses.length)return focusVerse||1;const header=document.querySelector('body>header'),targetY=(header?header.getBoundingClientRect().bottom:0)+8;let best=null,dist=Infinity;for(const el of verses){const r=el.getBoundingClientRect();if(r.bottom<targetY)continue;if(r.top>window.innerHeight&&best)break;const d=Math.abs(r.top-targetY);if(d<dist){best=el;dist=d}}if(!best)best=verses.find(el=>el.getBoundingClientRect().bottom>0)||verses[0];const m=(best.id||'').match(/^v(\d+)$/);return m?Number(m[1]):(focusVerse||1)}
function currentSingleAnchor(){if(mode==='hyper'){const r=hyperRange(hIdx);return{mode:'hyper',book:'Gen',chapter:r.sc,verse:singleVisibleVerse(),hIdx}}const cp=corpus(),p=pos(),b=cp.books[p.b];return{mode,book:b.book,chapter:Number(p.c),verse:singleVisibleVerse(),hIdx:0}}
function modeHasPassage(m,book,chapter){if(m==='hyper')return book==='Gen'&&Number(chapter)>=1&&Number(chapter)<=9;const cp=CORPORA[m];if(!cp)return false;const b=cp.books.find(x=>x.book===book);return !!(b&&b.chapters.some(c=>Number(c.chapter)===Number(chapter)))}
function companionModeFor(anchor,primary,preferred){if(['1En','Jub','2Esd'].includes(anchor.book)){if(preferred&&preferred!==primary&&modeHasPassage(preferred,anchor.book,anchor.chapter))return preferred;return primary}if(preferred&&preferred!==primary&&modeHasPassage(preferred,anchor.book,anchor.chapter))return preferred;if(primary!=='almeida'&&modeHasPassage('almeida',anchor.book,anchor.chapter))return'almeida';if(primary!=='wlc'&&modeHasPassage('wlc',anchor.book,anchor.chapter))return'wlc';if(primary!=='tr'&&modeHasPassage('tr',anchor.book,anchor.chapter))return'tr';if(primary!=='hyper'&&modeHasPassage('hyper',anchor.book,anchor.chapter))return'hyper';return preferred||'almeida'}
function setParallelStateAt(side,targetMode,anchor){const st=parallelState[side]||(parallelState[side]={mode:targetMode,book:anchor.book,chapter:anchor.chapter,hIdx:0});st.mode=targetMode;if(targetMode==='hyper'){st.hIdx=anchor.mode==='hyper'?anchor.hIdx:hyperBlockForChapter(anchor.chapter);st.book='Gen';st.chapter=anchor.chapter}else{st.book=anchor.book;st.chapter=Number(anchor.chapter);st.hIdx=0}sanitizeParallelState(side)}
function alignParallelToSingle(anchor){setParallelStateAt('A',anchor.mode,anchor);const preferred=parallelState.B?.mode||'wlc',second=companionModeFor(anchor,anchor.mode,preferred);setParallelStateAt('B',second,anchor);if(parallelSync)syncParallelFrom('A',{render:false})}
function scrollParallelToVerse(verse){verse=Number(verse)||1;parallelScrollLock=true;for(const side of ['A','B']){const box=document.getElementById('pText'+side),el=box?.querySelector('.verse[data-v="'+verse+'"]');if(!box||!el)continue;const br=box.getBoundingClientRect(),er=el.getBoundingClientRect();box.scrollTop+=er.top-br.top-6}clearTimeout(parallelScrollTimer);parallelScrollTimer=setTimeout(()=>{parallelScrollLock=false},120)}
function setParallelMode(on){const entering=!!on&&!parallelOn,anchor=entering?currentSingleAnchor():null;parallelOn=!!on;document.body.classList.toggle('parallel-mode',parallelOn);document.getElementById('singleReader').hidden=parallelOn;document.getElementById('parallelReader').hidden=!parallelOn;document.getElementById('parallelToggle').setAttribute('aria-pressed',String(parallelOn));document.getElementById('parallelToggleText').textContent=parallelOn?'Uma Bíblia':'Leitura paralela';if(parallelOn){if(entering&&anchor)alignParallelToSingle(anchor);else if(parallelSync)syncParallelFrom('A',{render:false});renderParallel();if(entering&&anchor)setTimeout(()=>scrollParallelToVerse(anchor.verse),30)}else{renderReader()}saveParallel()}
function parallelMove(side,delta){
  delta=Number(delta)>0?1:-1;
  const st=sanitizeParallelState(side);

  /* Sincronizado: a navegação usa uma linha bíblica completa.
     Assim WLC em Malaquias avança para Mateus e o painel original troca
     automaticamente para TR; voltando ao AT, TR volta para WLC. */
  if(parallelSync){
    const target=parallelStepTarget(side,delta);
    if(!target)return;
    if(target.hyper&&st.mode==='hyper'){
      st.hIdx=target.hIdx;st.book='Gen';st.chapter=target.chapter;
      syncParallelFrom(side,{render:false});
    }else{
      adaptParallelTargetToPassage('A',target.book,target.chapter);
      adaptParallelTargetToPassage('B',target.book,target.chapter);
      setParallelStatus('Sincronizado · '+(delta>0?'próximo':'anterior')+' capítulo.');
    }
    renderParallel();
    requestAnimationFrame(()=>{
      document.getElementById('pTextA').scrollTop=0;
      document.getElementById('pTextB').scrollTop=0;
      animateParallelPage(side,delta);
    });
    return;
  }

  if(st.mode==='hyper'){
    const n=st.hIdx+delta;
    if(n<0||n>=HYPER_BLOCKS.length)return;
    st.hIdx=n;const r=hyperRange(n);st.book='Gen';st.chapter=r.sc;
  }else{
    const cp=CORPORA[st.mode],bi=cp.books.findIndex(b=>b.book===st.book);
    if(bi<0)return;
    const b=cp.books[bi],ci=b.chapters.findIndex(c=>Number(c.chapter)===Number(st.chapter));
    if(delta>0){
      if(ci>=0&&ci<b.chapters.length-1)st.chapter=Number(b.chapters[ci+1].chapter);
      else if(bi<cp.books.length-1){st.book=cp.books[bi+1].book;st.chapter=Number(cp.books[bi+1].chapters[0].chapter)}
      else return;
    }else{
      if(ci>0)st.chapter=Number(b.chapters[ci-1].chapter);
      else if(bi>0){st.book=cp.books[bi-1].book;st.chapter=Number(cp.books[bi-1].chapters.at(-1).chapter)}
      else return;
    }
  }
  renderParallel();
  requestAnimationFrame(()=>{
    document.getElementById('pText'+side).scrollTop=0;
    animateParallelPage(side,delta);
  });
}
function parallelVisibleVerse(side){const box=document.getElementById('pText'+side),verses=[...box.querySelectorAll('.verse[data-v]')];if(!verses.length)return null;const br=box.getBoundingClientRect();let best=verses[0],dist=Infinity;for(const v of verses){const r=v.getBoundingClientRect(),d=Math.abs(r.top-(br.top+6));if(d<dist){best=v;dist=d}if(r.top>br.bottom)break}return Number(best.dataset.v)}
function syncParallelScroll(sourceSide){if(!parallelOn||!parallelSync||parallelScrollLock)return;const targetSide=sourceSide==='A'?'B':'A',a=parallelCanonical(sourceSide),b=parallelCanonical(targetSide);if(a.book!==b.book||Number(a.chapter)!==Number(b.chapter))return;const verse=parallelVisibleVerse(sourceSide);if(!verse)return;const target=document.getElementById('pText'+targetSide),el=target.querySelector('.verse[data-v="'+verse+'"]');if(!el)return;parallelScrollLock=true;const tr=target.getBoundingClientRect(),er=el.getBoundingClientRect();target.scrollTop+=er.top-tr.top-6;clearTimeout(parallelScrollTimer);parallelScrollTimer=setTimeout(()=>parallelScrollLock=false,80)}
function flashParallelPane(side){const p=document.querySelector('.parallel-pane[data-side="'+side+'"]');if(!p)return;p.classList.remove('parallel-sync-flash');void p.offsetWidth;p.classList.add('parallel-sync-flash')}
function bindParallel(){document.getElementById('parallelToggle').onclick=()=>setParallelMode(!parallelOn);document.getElementById('parallelExit').onclick=()=>setParallelMode(false);document.getElementById('parallelOrientation').onclick=()=>{parallelLayout=parallelLayout==='horizontal'?'vertical':'horizontal';applyParallelLayout();saveParallel()};document.getElementById('parallelGlobalSync').onclick=()=>{const cb=document.getElementById('parallelSync');cb.checked=!cb.checked;cb.dispatchEvent(new Event('change',{bubbles:true}))};document.getElementById('parallelSync').onchange=e=>{parallelSync=e.target.checked;if(parallelSync){syncParallelFrom('A',{render:false});setParallelStatus('Sincronizado · livro, capítulo e rolagem por versículo.')}else setParallelStatus('Independente · cada Bíblia navega e rola separadamente.');renderParallel()};document.getElementById('parallelSwap').onclick=()=>{const a=cloneParallelState(parallelState.A);parallelState.A=cloneParallelState(parallelState.B);parallelState.B=a;renderParallel()};for(const side of ['A','B']){document.getElementById('pVersion'+side).onchange=e=>{const st=parallelState[side],old=parallelCanonical(side);st.mode=e.target.value;if(st.mode==='hyper'){if(old.book==='Gen'&&old.chapter<=9)st.hIdx=hyperBlockForChapter(old.chapter);else st.hIdx=0}else{const cp=CORPORA[st.mode],bi=cp.books.findIndex(b=>b.book===old.book);if(bi>=0){st.book=old.book;const nums=cp.books[bi].chapters.map(c=>Number(c.chapter));st.chapter=nums.includes(old.chapter)?old.chapter:nums[0]}else{st.book=cp.books[0].book;st.chapter=Number(cp.books[0].chapters[0].chapter)}}if(parallelSync)syncParallelFrom(side,{render:false});renderParallel()};document.getElementById('pBook'+side).onchange=e=>{const st=parallelState[side];if(st.mode==='hyper'){st.hIdx=+e.target.value;const r=hyperRange(st.hIdx);st.book='Gen';st.chapter=r.sc}else{st.book=e.target.value;const cp=CORPORA[st.mode],b=cp.books.find(x=>x.book===st.book);st.chapter=Number(b.chapters[0].chapter)}if(parallelSync)syncParallelFrom(side,{render:false});renderParallel()};document.getElementById('pChapter'+side).onchange=e=>{parallelState[side].chapter=+e.target.value;if(parallelSync)syncParallelFrom(side,{render:false});renderParallel()};document.getElementById('pPrev'+side).onclick=e=>{e.preventDefault();e.stopPropagation();parallelMove(side,-1)};document.getElementById('pNext'+side).onclick=e=>{e.preventDefault();e.stopPropagation();parallelMove(side,1)};const txt=document.getElementById('pText'+side);txt.addEventListener('scroll',()=>requestAnimationFrame(()=>syncParallelScroll(side)),{passive:true});txt.addEventListener('click',e=>{const w=e.target.closest('.oshb-word');if(w)openStrong(w)});txt.addEventListener('keydown',e=>{const w=e.target.closest('.oshb-word');if(w&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openStrong(w)}})}document.querySelectorAll('.parallel-close-clone').forEach(b=>b.onclick=()=>setParallelMode(false));document.querySelectorAll('.parallel-sync-clone').forEach(b=>b.onclick=()=>{const cb=document.getElementById('parallelSync');cb.checked=!cb.checked;cb.dispatchEvent(new Event('change',{bubbles:true}))});document.querySelectorAll('.parallel-swap-clone').forEach(b=>b.onclick=()=>document.getElementById('parallelSwap').click())}

function buildBookOptions(){const cp=corpus(),p=pos();document.getElementById('bookSelect').innerHTML=cp.books.map((b,i)=>'<option value="'+i+'">'+esc(bookName(b))+'</option>').join('');document.getElementById('bookSelect').value=String(p.b)}
function buildChapterOptions(){const cp=corpus(),p=pos(),b=cp.books[p.b];document.getElementById('chapterSelect').innerHTML=b.chapters.map(c=>'<option value="'+c.chapter+'">Capítulo '+c.chapter+'</option>').join('');document.getElementById('chapterSelect').value=String(p.c)}
function renderReader(){const body=document.getElementById('textBody'),opening=document.getElementById('opening'),nav=document.getElementById('navgrid'),book=document.getElementById('bookSelect'),chap=document.getElementById('chapterSelect');document.body.classList.toggle('reader-hyper-active',mode==='hyper');document.getElementById('versionSelect').value=mode;body.classList.toggle('hebrew',mode==='wlc');body.setAttribute('dir',mode==='wlc'?'rtl':'ltr');document.body.classList.toggle('wlc-mode',mode==='wlc');
if(mode==='hyper'){const b=HYPER_BLOCKS[hIdx];document.getElementById('hdrRef').textContent=b.ref;document.getElementById('hdrVersion').textContent='Tradução hiperliteral';document.getElementById('hdrPage').textContent=(hIdx+1)+' / '+HYPER_BLOCKS.length;document.getElementById('progressFill').style.width=((hIdx+1)/HYPER_BLOCKS.length*100)+'%';opening.style.display=hIdx===0?'block':'none';nav.className='navgrid hyper';book.style.display='block';chap.style.display='none';book.innerHTML=HYPER_BLOCKS.map((x,i)=>'<option value="'+i+'">'+(i+1)+'. '+esc(x.ref)+'</option>').join('');book.value=String(hIdx);body.innerHTML=b.t.split(/\n\n+/).map(par=>{const lines=par.split('\n');return lines.map((ln,i)=>{const cls=ln.trim().startsWith('—')?'speech':(lines.length>1&&i===0?'lead':'');return'<p'+(cls?' class="'+cls+'"':'')+'>'+decorate(ln)+'</p>'}).join('')}).join('');document.getElementById('copyPassage').textContent='Copiar bloco';document.getElementById('prev').disabled=hIdx===0;document.getElementById('next').disabled=hIdx===HYPER_BLOCKS.length-1}
else{const cp=corpus(),p=pos(),b=cp.books[p.b],c=chapterObj();p.c=Number(c.chapter);document.getElementById('hdrRef').textContent=bookName(b)+' '+p.c;document.getElementById('hdrVersion').textContent=VERSION_META[mode].label;document.getElementById('hdrPage').textContent=(p.b+1)+' / '+cp.books.length;const done=cp.books.slice(0,p.b).reduce((s,x)=>s+x.chapters.length,0)+b.chapters.findIndex(x=>Number(x.chapter)===Number(p.c))+1,total=cp.books.reduce((s,x)=>s+x.chapters.length,0);document.getElementById('progressFill').style.width=(done/total*100)+'%';opening.style.display='none';nav.className='navgrid';book.style.display='block';chap.style.display='block';buildBookOptions();buildChapterOptions();body.innerHTML=mode==='wlc'?c.verses.map(v=>renderOshbVerse(b.book,p.c,v)).join(''):c.verses.map(v=>'<span class="verse'+(focusVerse===v.number?' focus':'')+'" id="v'+v.number+'"><sup class="vnum">'+v.number+'</sup>'+esc(v.text)+'</span>').join('');document.getElementById('copyPassage').textContent='Copiar capítulo';document.getElementById('prev').disabled=p.b===0&&Number(p.c)===Number(cp.books[0].chapters[0].chapter);const lb=cp.books.length-1,lastC=cp.books[lb].chapters.at(-1).chapter;document.getElementById('next').disabled=p.b===lb&&Number(p.c)===Number(lastC)}
const scope=mode==='hyper'?'Busca na tradução hiperliteral':'Busca em '+(VERSION_META[mode]?.label||mode)+(CORPORA[mode]?' · corpus completo':'');document.getElementById('searchScopeLabel').textContent=scope;document.getElementById('rowSup').style.opacity=mode==='hyper'?'1':'.45';document.getElementById('rowRub').style.opacity=mode==='hyper'?'1':'.45';document.getElementById('textBody').style.fontSize=(Number(prefs.size)||18.5)+'px';applyTextPrefs(false);savePrefs();renderMark();if(focusVerse&&mode!=='hyper'){setTimeout(()=>{const el=document.getElementById('v'+focusVerse);if(el)el.scrollIntoView({block:'center'})},10)}else window.scrollTo(0,0)}
function move(delta){focusVerse=null;if(mode==='hyper'){const n=hIdx+delta;if(n>=0&&n<HYPER_BLOCKS.length){hIdx=n;renderReader()}return}const cp=corpus(),p=pos(),b=cp.books[p.b],i=b.chapters.findIndex(x=>Number(x.chapter)===Number(p.c));if(delta>0){if(i<b.chapters.length-1)p.c=Number(b.chapters[i+1].chapter);else if(p.b<cp.books.length-1){p.b++;p.c=Number(cp.books[p.b].chapters[0].chapter)}}else{if(i>0)p.c=Number(b.chapters[i-1].chapter);else if(p.b>0){p.b--;p.c=Number(cp.books[p.b].chapters.at(-1).chapter)}}renderReader()}
function hyperFreq(){const m=new Map();HYPER_BLOCKS.forEach(b=>stripSup(b.t).split(/[^\p{L}א-ת'-]+/u).forEach(w=>{if(!w)return;const k=norm(w);if(k.length<3&&w!=='את')return;if(STOP.has(k))return;m.set(w,(m.get(w)||0)+1)}));return[...m.entries()].sort((a,b)=>b[1]-a[1])}
function renderChips(){const el=document.getElementById('chips');el.innerHTML=mode==='hyper'?hyperFreq().slice(0,24).map(([w,n])=>'<button class="chip" data-w="'+esc(w)+'">'+esc(w)+' <b>'+n+'</b></button>').join(''):''}
function searchHyper(term){const out=[],q=norm(term.trim());if(!q)return out;HYPER_BLOCKS.forEach((b,i)=>{const flat=stripSup(b.t).replace(/\n+/g,' '),hay=norm(flat);let from=0,p;while((p=hay.indexOf(q,from))!==-1){const a=Math.max(0,p-60),z=Math.min(flat.length,p+term.length+60);out.push({kind:'hyper',i,ref:b.ref,pre:(a>0?'…':'')+flat.slice(a,p),mid:flat.slice(p,p+term.length),post:flat.slice(p+term.length,z)+(z<flat.length?'…':'')});from=p+Math.max(1,q.length)}});return out}
function searchCorpus(term,m){const out=[],q=norm(term.trim()),cp=CORPORA[m];if(!q)return out;for(let bi=0;bi<cp.books.length;bi++){const b=cp.books[bi];for(const c of b.chapters){for(const v of c.verses){const flat=v.text,hay=norm(flat);let from=0,p;while((p=hay.indexOf(q,from))!==-1){const a=Math.max(0,p-55),z=Math.min(flat.length,p+Math.max(term.length,q.length)+80);out.push({kind:m,bi,ch:c.chapter,v:v.number,ref:bookName(b)+' '+c.chapter+'.'+v.number,pre:(a>0?'…':'')+flat.slice(a,p),mid:flat.slice(p,p+Math.max(1,term.length)),post:flat.slice(p+Math.max(1,term.length),z)+(z<flat.length?'…':'')});from=p+Math.max(1,q.length)}}}}return out}
let searchTimer=null,searchCache=[],searchShown=0,searchSig='';function renderSearch(){const term=document.getElementById('q').value,c=document.getElementById('count'),list=document.getElementById('hits'),more=document.getElementById('searchLoadMore');if(!term.trim()){searchCache=[];searchShown=0;searchSig='';c.textContent='';list.innerHTML='<li style="border:0"><div class="empty">Digite uma palavra ou expressão para buscar na versão selecionada.</div></li>';if(more)more.hidden=true;return}const sig=mode+'\u0000'+term.trim();if(sig!==searchSig){searchSig=sig;searchCache=mode==='hyper'?searchHyper(term):searchCorpus(term,mode);searchShown=Math.min(100,searchCache.length)}const shown=searchCache.slice(0,searchShown);c.textContent=searchCache.length===0?'Nenhuma ocorrência de “'+term.trim()+'”.':searchCache.length+' '+(searchCache.length===1?'ocorrência':'ocorrências')+' · '+shown.length+' exibidas';list.innerHTML=shown.map((h,n)=>'<li data-hit="'+n+'"><div class="h-ref">'+esc(h.ref)+'</div><div class="h-txt">'+esc(h.pre)+'<mark>'+esc(h.mid)+'</mark>'+esc(h.post)+'</div></li>').join('');list._hits=searchCache;if(more){more.hidden=searchShown>=searchCache.length;more.textContent='Carregar mais '+Math.min(100,searchCache.length-searchShown)}}
function markLabelFromKey(k){const p=k.split(':');if(k.startsWith('h:'))return'Hiperliteral · '+(HYPER_BLOCKS[+p[1]]?HYPER_BLOCKS[+p[1]].ref:k);const mk=Object.keys(VERSION_META).find(x=>VERSION_META[x]?.prefix===p[0]),it=mk&&CORPORA[mk];if(!it)return k;return(VERSION_META[mk]?.short||mk)+' · '+(BOOK_NAMES[p[1]]||p[1])+' '+p[2]}
function renderMark(){const key=currentKey(),rec=store[key]||{tags:[],note:''};document.getElementById('noteRef').textContent=VERSION_META[mode].short+' · '+currentRef();document.getElementById('note').value=rec.note||'';document.getElementById('tags').innerHTML=TAGS.map(t=>'<button class="tag" data-t="'+t+'" data-on="'+((rec.tags||[]).includes(t)?1:0)+'">'+t+'</button>').join('');const keys=Object.keys(store).filter(k=>{const r=store[k];return(r.tags&&r.tags.length)||(r.note&&r.note.trim())}).sort();document.getElementById('marked').innerHTML=keys.length?keys.map(k=>{const r=store[k],line=(r.tags||[]).join(' · ')+((r.tags||[]).length&&r.note?' — ':'')+(r.note||'').slice(0,90);return'<li data-key="'+esc(k)+'"><div class="h-ref">'+esc(markLabelFromKey(k))+'</div><div class="h-txt">'+esc(line)+'</div></li>'}).join(''):'<li style="border:0"><div class="empty">Nada marcado ainda.</div></li>'}
async function flash(msg){const el=document.getElementById('saved');el.textContent=msg;setTimeout(()=>{if(el.textContent===msg)el.textContent=''},1800)}
function openPanel(name){document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.p===name)));document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));document.getElementById('p-'+name).classList.add('on');if(name==='marcar')renderMark();if(name==='buscar'){renderChips();renderSearch()}window.scrollTo(0,0)}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>openPanel(t.dataset.p));
document.getElementById('versionSelect').onchange=e=>{const n=e.target.value;if(n!=='hyper'&&!CORPORA[n])return;mode=n;focusVerse=null;renderReader();renderChips();renderSearch()};
document.getElementById('bookSelect').onchange=e=>{focusVerse=null;if(mode==='hyper')hIdx=+e.target.value;else{const p=pos();p.b=+e.target.value;p.c=Number(corpus().books[p.b].chapters[0].chapter)}renderReader()};
document.getElementById('chapterSelect').onchange=e=>{if(mode!=='hyper')pos().c=+e.target.value;focusVerse=null;renderReader()};
document.getElementById('prev').onclick=()=>move(-1);document.getElementById('next').onclick=()=>move(1);
document.getElementById('copyPassage').onclick=async()=>{let text;if(mode==='hyper')text=HYPER_BLOCKS[hIdx].ref+'\n\n'+stripSup(HYPER_BLOCKS[hIdx].t);else{const cp=corpus(),p=pos(),b=cp.books[p.b],c=chapterObj();text=bookName(b)+' '+p.c+' — '+VERSION_META[mode].label+'\n\n'+c.verses.map(v=>v.number+' '+v.text).join('\n')}try{await navigator.clipboard.writeText(text);flash('Copiado.')}catch(e){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();flash('Copiado.')}};
document.getElementById('q').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(renderSearch,180)});document.getElementById('chips').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;document.getElementById('q').value=c.dataset.w;renderSearch()};document.getElementById('searchLoadMore').onclick=()=>{searchShown=Math.min(searchShown+100,searchCache.length);renderSearch()};
document.getElementById('hits').onclick=e=>{const li=e.target.closest('li[data-hit]');if(!li)return;const h=e.currentTarget._hits&&e.currentTarget._hits[+li.dataset.hit];if(!h)return;if(h.kind==='hyper'){mode='hyper';hIdx=h.i;focusVerse=null}else{mode=h.kind;positions[mode]={b:h.bi,c:Number(h.ch)};focusVerse=h.v}renderReader();openPanel('ler')};
document.getElementById('marked').onclick=e=>{const li=e.target.closest('li[data-key]');if(!li)return;const k=li.dataset.key,p=k.split(':');if(k.startsWith('h:')){mode='hyper';hIdx=+p[1];focusVerse=null}else{const reverse={a:'almeida',w:'wlc',t:'tr'};mode=reverse[p[0]]||'almeida';const cp=CORPORA[mode],bi=Math.max(0,cp.books.findIndex(b=>b.book===p[1]));positions[mode]={b:bi,c:+p[2]};focusVerse=null}renderReader();openPanel('ler')};
document.getElementById('tags').onclick=async e=>{const b=e.target.closest('.tag');if(!b)return;const k=currentKey(),rec=store[k]||(store[k]={tags:[],note:''}),t=b.dataset.t,on=b.dataset.on==='1';rec.tags=rec.tags||[];rec.tags=on?rec.tags.filter(x=>x!==t):[...rec.tags,t];const ok=await saveMarks();renderMark();flash(ok?'Marcação salva.':'Salvo apenas nesta sessão.')};
let noteTimer;document.getElementById('note').oninput=e=>{const k=currentKey(),rec=store[k]||(store[k]={tags:[],note:''});rec.note=e.target.value;clearTimeout(noteTimer);noteTimer=setTimeout(async()=>{const ok=await saveMarks();flash(ok?'Nota salva.':'Salvo apenas nesta sessão.')},600)};
document.getElementById('swSup').onchange=e=>{prefs.showSup=e.target.checked;document.body.classList.toggle('hide-sup',!prefs.showSup);savePrefs()};document.getElementById('swRub').onchange=e=>{prefs.rubric=e.target.checked;document.body.classList.toggle('plain',!prefs.rubric);savePrefs()};document.getElementById('swSize').oninput=e=>{prefs.size=Number(e.target.value);applyTextPrefs(true)};
document.getElementById('swTextMargin')?.addEventListener('input',e=>{prefs.textMargin=Number(e.target.value);applyTextPrefs(true)});
document.getElementById('swVerseNumbers')?.addEventListener('change',e=>{if(mode==='hyper'){e.target.checked=prefs.showVerseNumbers!==false;return}prefs.showVerseNumbers=e.target.checked;applyTextPrefs(true)});
document.querySelectorAll('[data-reader-align]').forEach(b=>b.addEventListener('click',()=>{if(mode==='hyper')return;prefs.textAlign=b.dataset.readerAlign;applyTextPrefs(true)}));
document.querySelectorAll('[data-reader-font]').forEach(b=>b.addEventListener('click',()=>{prefs.readerFont=b.dataset.readerFont;applyTextPrefs(true)}));
const persistReaderPrefsNow=()=>{try{localStorage.setItem(KEY_PREFS,JSON.stringify(prefs));localStorage.setItem(KEY_TEXT_PREFS,JSON.stringify(textPrefsSnapshot()))}catch(e){}saveTextPrefsBackup()};
window.addEventListener('pagehide',persistReaderPrefsNow);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persistReaderPrefsNow()});
let touchX=0,touchY=0;document.getElementById('p-ler').addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchX=t.clientX;touchY=t.clientY},{passive:true});document.getElementById('p-ler').addEventListener('touchend',e=>{if(parallelOn)return;const t=e.changedTouches[0],dx=t.clientX-touchX,dy=t.clientY-touchY;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.25)move(dx<0?1:-1)},{passive:true});document.addEventListener('keydown',e=>{if(parallelOn)return;if(!document.getElementById('p-ler').classList.contains('on'))return;if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1)});
document.getElementById('exportMarks').onclick=()=>{const data={format:'bereshit-marks',version:4,exportedAt:new Date().toISOString(),marks:store};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bereshit-marcacoes.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
document.getElementById('importMarks').onchange=async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text()),incoming=data&&data.format==='bereshit-marks'?data.marks:data;if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))throw new Error('formato');store=incoming;await saveMarks();renderMark();flash('Marcações importadas.')}catch(err){alert('Não foi possível importar este arquivo de marcações.')}e.target.value=''};
document.getElementById('clearMarks').onclick=async()=>{if(!confirm('Apagar todas as marcações e notas deste aparelho?'))return;store={};await saveMarks();renderMark();flash('Marcações apagadas.')};

document.getElementById('textBody').addEventListener('click',e=>{const w=e.target.closest('.oshb-word');if(w)openStrong(w)});
document.getElementById('textBody').addEventListener('keydown',e=>{const w=e.target.closest('.oshb-word');if(w&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openStrong(w)}});
document.getElementById('strongClose').onclick=closeStrong;document.getElementById('strongBackdrop').onclick=closeStrong;
document.querySelectorAll('.strong-tab').forEach(t=>t.onclick=()=>setStrongTab(t.dataset.stab));
document.getElementById('strongOcc').addEventListener('click',e=>{const li=e.target.closest('li[data-ob]');if(!li)return;const bi=+li.dataset.ob,c=+li.dataset.oc,v=+li.dataset.ov,code=OSHB_STRONG.b[bi],wbi=WLC.books.findIndex(x=>x.book===code);if(wbi<0)return;if(parallelOn&&strongCurrent?.parallelSide){const side=strongCurrent.parallelSide;parallelState[side]={mode:'wlc',book:code,chapter:c,hIdx:0};if(parallelSync)syncParallelFrom(side,{render:false});closeStrong();renderParallel();setTimeout(()=>{const box=document.getElementById('pText'+side),el=box.querySelector('.verse[data-v="'+v+'"]');if(el){box.scrollTop+=el.getBoundingClientRect().top-box.getBoundingClientRect().top-6;if(parallelSync)syncParallelScroll(side)}},20);return}positions.wlc={b:wbi,c};mode='wlc';focusVerse=v;closeStrong();document.querySelector(".tab[data-p=\"ler\"]").click();renderReader()});


/* ---------- DOXA V11 · textos históricos e literatura do Segundo Templo ---------- */
const OPEN_BIBLE_SPECS={
  blivre:{slug:'blivre',name:'Bíblia Livre',short:'BLIVRE',mark:'BL',license:'CC BY 4.0',scope:'AT + NT',prefix:'b',category:'bible',embeddedAlias:'almeida'}
};
const OPEN_BIBLE_ORDER=['blivre'];
const CANON_CODE_MAP={GEN:'Gen',EXO:'Exod',LEV:'Lev',NUM:'Num',DEU:'Deut',JOS:'Josh',JDG:'Judg',RUT:'Ruth','1SA':'1Sam','2SA':'2Sam','1KI':'1Kgs','2KI':'2Kgs','1CH':'1Chr','2CH':'2Chr',EZR:'Ezra',NEH:'Neh',EST:'Esth',JOB:'Job',PSA:'Ps',PRO:'Prov',ECC:'Eccl',SNG:'Song',ISA:'Isa',JER:'Jer',LAM:'Lam',EZK:'Ezek',DAN:'Dan',HOS:'Hos',JOL:'Joel',AMO:'Amos',OBA:'Obad',JON:'Jonah',MIC:'Mic',NAM:'Nah',HAB:'Hab',ZEP:'Zeph',HAG:'Hag',ZEC:'Zech',MAL:'Mal',MAT:'Matt',MRK:'Mark',LUK:'Luke',JHN:'John',ACT:'Acts',ROM:'Rom','1CO':'1Cor','2CO':'2Cor',GAL:'Gal',EPH:'Eph',PHP:'Phil',COL:'Col','1TH':'1Thess','2TH':'2Thess','1TI':'1Tim','2TI':'2Tim',TIT:'Titus',PHM:'Phlm',HEB:'Heb',JAS:'Jas','1PE':'1Pet','2PE':'2Pet','1JN':'1John','2JN':'2John','3JN':'3John',JUD:'Jude',REV:'Rev'};
const CANON_CODES=Object.keys(CANON_CODE_MAP);
const DOXA_BOOK_ORDER=['Gen','Exod','Lev','Num','Deut','Josh','Judg','Ruth','1Sam','2Sam','1Kgs','2Kgs','1Chr','2Chr','Ezra','Neh','Esth','Job','Ps','Prov','Eccl','Song','Isa','Jer','Lam','Ezek','Dan','Hos','Joel','Amos','Obad','Jonah','Mic','Nah','Hab','Zeph','Hag','Zech','Mal','Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'];

const OPEN_BIBLE_DB='doxa-textos-existentes-v1',OPEN_BIBLE_STORE='corpora';let openBibleDbPromise=null;const openBibleInstalling=new Set();
function openBibleDb(){if(openBibleDbPromise)return openBibleDbPromise;openBibleDbPromise=new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('IndexedDB indisponível'));return}const r=indexedDB.open(OPEN_BIBLE_DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(OPEN_BIBLE_STORE))db.createObjectStore(OPEN_BIBLE_STORE,{keyPath:'slug'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Falha ao abrir armazenamento'))});return openBibleDbPromise}
async function openBibleGetAll(){try{const db=await openBibleDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(OPEN_BIBLE_STORE,'readonly'),r=tx.objectStore(OPEN_BIBLE_STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}catch(e){console.warn('Doxa módulos:',e);return[]}}
async function openBiblePut(rec){const db=await openBibleDb();return new Promise((resolve,reject)=>{const tx=db.transaction(OPEN_BIBLE_STORE,'readwrite');tx.objectStore(OPEN_BIBLE_STORE).put(rec);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}
function registerOpenBible(slug,cp){const sp=OPEN_BIBLE_SPECS[slug];if(!sp||!cp?.books?.length)return false;CORPORA[slug]=cp;VERSION_META[slug]={label:sp.name,short:sp.short,prefix:sp.prefix};if(!positions[slug])positions[slug]={b:0,c:Number(cp.books[0]?.chapters?.[0]?.chapter)??1};if(!PARALLEL_VERSION_OPTIONS.some(x=>x[0]===slug))PARALLEL_VERSION_OPTIONS.splice(Math.max(1,PARALLEL_VERSION_OPTIONS.length-1),0,[slug,sp.short]);if(slug==='2-esdras-pt')ensure4EzraView();return true}
function ensureEmbeddedBlivre(){const sp=OPEN_BIBLE_SPECS.blivre,alias={...ALMEIDA,version:'blivre',name:'Bíblia Livre',language:'pt-BR',license:'CC BY 4.0',_doxaSource:{embeddedAlias:'almeida'}};registerOpenBible('blivre',alias)}
function ensure4EzraView(){const src=CORPORA['2-esdras-pt'];if(!src?.books?.[0])return false;const sourceBook=src.books[0],viewBook={...sourceBook,viewName:'4 Esdras (2 Esdras)',chapters:sourceBook.chapters.filter(c=>Number(c.chapter)>=3&&Number(c.chapter)<=14)};const cp={version:'4-ezra-view',name:'4 Esdras — visão de 2 Esdras 3–14',language:'pt-BR',license:src.license,books:[viewBook],_viewOf:'2-esdras-pt'};CORPORA['4-ezra-view']=cp;VERSION_META['4-ezra-view']={label:'4 Esdras · 2 Esdras 3–14',short:'4Esd',prefix:'q'};if(!positions['4-ezra-view'])positions['4-ezra-view']={b:0,c:3};if(!PARALLEL_VERSION_OPTIONS.some(x=>x[0]==='4-ezra-view'))PARALLEL_VERSION_OPTIONS.splice(Math.max(1,PARALLEL_VERSION_OPTIONS.length-1),0,['4-ezra-view','4Esd']);return true}
function syncLegacyVersionSelects(){const entries=[['almeida','Almeida 1819'],...OPEN_BIBLE_ORDER.filter(k=>CORPORA[k]).map(k=>[k,OPEN_BIBLE_SPECS[k].short]),['wlc','WLC + Strong'],['tr','TR 1550'],['hyper','Hiperliteral']];const unique=[];for(const x of entries)if(!unique.some(y=>y[0]===x[0]))unique.push(x);const html=unique.map(([v,l])=>'<option value="'+v+'">'+esc(l)+'</option>').join('');const vs=document.getElementById('versionSelect');if(vs){vs.innerHTML=html;vs.value=mode}for(const side of ['A','B']){const el=document.getElementById('pVersion'+side);if(el){el.innerHTML=unique.map(([v,l])=>'<option value="'+v+'">'+esc(l)+'</option>').join('');const st=parallelState?.[side];if(st)el.value=st.mode}}}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function fetchTextStrict(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('Falha ao obter '+url+' ('+r.status+').');return r.text()}
async function fetchSourceText(url){
  try{return{body:await fetchTextStrict(url),kind:'html',proxied:false}}
  catch(first){
    const proxy='https://r.jina.ai/'+url;
    let last=first;
    for(let attempt=0;attempt<4;attempt++){
      try{const r=await fetch(proxy,{cache:'no-store',headers:{Accept:'text/plain'}});if(r.status===429){last=new Error('Serviço de leitura temporariamente ocupado.');await sleep(3200*(attempt+1));continue}if(!r.ok)throw new Error('Falha no transporte alternativo ('+r.status+').');return{body:await r.text(),kind:'markdown',proxied:true}}catch(e){last=e;if(attempt<3)await sleep(1800*(attempt+1))}
    }
    throw last
  }
}
async function fetchJsonStrict(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('Falha ao obter '+url+' ('+r.status+').');return r.json()}
function normalizeAlmBook(raw,code){const book=CANON_CODE_MAP[code],ord=DOXA_BOOK_ORDER.indexOf(book),chapters=(raw?.chapters||[]).map(c=>({chapter:Number(c.number),verses:(c.verses||[]).map(v=>({number:Number(v.number),text:String(v.text??'')})).filter(v=>Number.isFinite(v.number))})).filter(c=>Number.isFinite(c.chapter)&&c.verses.length);return{book,bookId:ord+1,englishName:raw?.name||book,testament:ord>=39?'NT':'OT',chapters}}
async function installAlmeida1911(progress){const books=[];for(let i=0;i<CANON_CODES.length;i++){const code=CANON_CODES[i],url='https://raw.githubusercontent.com/damarals/biblias/main/data/canonical/ALM1911/'+code+'.json';const raw=await fetchJsonStrict(url),b=normalizeAlmBook(raw,code);if(b.chapters.length)books.push(b);progress(Math.round((i+1)/CANON_CODES.length*98));if(i%8===7)await sleep(75)}if(books.length!==66)throw new Error('O corpus Almeida 1911 chegou incompleto ('+books.length+'/66 livros).');return{version:'almeida-1911',name:'Almeida Revista e Corrigida — 1911',language:'pt-BR',license:'public-domain',books,_doxaSource:{primary:'Project Gutenberg eBook 62383 / BíbliaAlmeida.com',transport:'damarals/biblias · ALM1911 JSON canônico',verified:'2026-09-14'}}}
function parseSourceVerses(raw,kind='html',chapter=1){
  if(kind==='markdown'){
    const lines=String(raw||'').replace(/\r/g,'').split('\n'),out=[],seen=new Set();let cur=null;
    const skip=/^(Title:|URL Source:|Published Time:|Markdown Content:|Ir para|Idioma|Português|English|\[Button:|\[Select\]|Home \/|Leitura$|Reading$)/i;
    for(let line of lines){line=line.replace(/^\s{0,3}#{1,6}\s*/,'').replace(/\*\*/g,'').trim();if(!line||skip.test(line))continue;const m=line.match(/^(\d+)\s*(.+)$/);if(m){const n=Number(m[1]);if(n>0&&!seen.has(n)){if(cur)out.push(cur);cur={number:n,text:m[2].trim()};seen.add(n)}else if(cur)cur.text+=' '+line}else if(cur&&!/^[-*]\s/.test(line)){cur.text+=' '+line}}
    if(cur)out.push(cur);if(out.length)return out.map(v=>({number:v.number,text:v.text.replace(/\s+/g,' ').trim()}));
    if(Number(chapter)===0){const paras=lines.map(x=>x.replace(/^\s{0,3}#{1,6}\s*/,'').trim()).filter(x=>x&&!skip.test(x)&&x.length>12&&!/^[-*]\s/.test(x));return paras.map((x,i)=>({number:i+1,text:x.replace(/\s+/g,' ')}))}
    return[]
  }
  const doc=new DOMParser().parseFromString(raw,'text/html'),out=[],seen=new Set();let anchors=[...doc.querySelectorAll('a[href*="#v"],a[id^="v"]')];if(!anchors.length)anchors=[...doc.querySelectorAll('[id^="v"],main p,article p')].filter(a=>/^\s*\d+/.test(a.textContent.trim()));for(const a of anchors){const m=a.textContent.trim().match(/^(\d+)\s*(.*)$/);if(!m)continue;const n=Number(m[1]);if(!Number.isFinite(n)||seen.has(n))continue;let el=a.closest('[id^="v"],p,li,div')||a;let txt=(el.textContent||'').replace(/\s+/g,' ').trim().replace(new RegExp('^\\s*'+n+'\\s*'),'').trim();if(!txt||txt.length<2||txt.length>12000)continue;seen.add(n);out.push({number:n,text:txt})}out.sort((a,b)=>a.number-b.number);if(out.length)return out;if(Number(chapter)===0){const paras=[...doc.querySelectorAll('main p,article p')].map(p=>p.textContent.replace(/\s+/g,' ').trim()).filter(x=>x.length>12);return paras.map((x,i)=>({number:i+1,text:x}))}return out
}
function sourceChapterLinks(indexHtml,baseUrl,sp){const doc=new DOMParser().parseFromString(indexHtml,'text/html'),links=[];for(const a of doc.querySelectorAll('a[href]')){const t=a.textContent.trim(),href=a.getAttribute('href')||'';if(sp.hasPrologue&&/^(prólogo|prologo)$/i.test(t)){links.push({chapter:0,url:new URL(href,baseUrl).href});continue}if(/^\d+$/.test(t)){const n=Number(t);if(n>=1&&n<=sp.chapterCount&&href.includes('/'+sp.sourceSlug+'/'))links.push({chapter:n,url:new URL(href,baseUrl).href})}}const map=new Map();for(const x of links)if(!map.has(x.chapter))map.set(x.chapter,x);if(sp.hasPrologue&&!map.has(0)){for(const tail of ['prologo','prólogo','0']){try{map.set(0,{chapter:0,url:new URL(tail+'/',baseUrl.endsWith('/')?baseUrl:baseUrl+'/').href});break}catch(e){}}}for(let n=1;n<=(sp.hasPrologue?50:sp.chapterCount);n++)if(!map.has(n))map.set(n,{chapter:n,url:'https://escriturasperdidas.com.br/pt/'+sp.sourceSlug+'/'+n});return[...map.values()].sort((a,b)=>a.chapter-b.chapter)}
async function sourceChapterDocument(sp,chapter){
  const base='https://escriturasperdidas.com.br/pt/'+sp.sourceSlug+'/';
  const tails=chapter===0?['prologo','prólogo','0']:[String(chapter)];let last=null;
  for(const tail of tails){try{return await fetchSourceText(base+encodeURI(tail))}catch(e){last=e}}
  throw last||new Error('Não foi possível obter a unidade '+chapter+'.')
}
async function installEscriturasPerdidas(sp,progress){
  const chapters=[],numbers=sp.hasPrologue?[0,...Array.from({length:50},(_,i)=>i+1)]:Array.from({length:sp.chapterCount},(_,i)=>i+1);let usedProxy=false;
  for(let i=0;i<numbers.length;i++){
    const ch=numbers[i];let doc;try{doc=await sourceChapterDocument(sp,ch)}catch(e){if(ch===0)throw new Error('Não foi possível obter o prólogo de '+sp.name+'. O Doxa não instalará um corpus incompleto.');throw e}
    usedProxy=usedProxy||doc.proxied;const verses=parseSourceVerses(doc.body,doc.kind,ch);if(!verses.length){if(ch===0)throw new Error('O prólogo de '+sp.name+' não pôde ser reconhecido. O Doxa não instalará um corpus incompleto.');throw new Error('Não foi possível reconhecer os versículos de '+sp.name+' '+ch+'.')}
    chapters.push({chapter:ch,verses});progress(Math.round((i+1)/numbers.length*98));await sleep(doc.proxied?3150:130)
  }
  const expected=sp.hasPrologue?51:sp.chapterCount;if(chapters.length!==expected)throw new Error('O corpus chegou incompleto ('+chapters.length+'/'+expected+' unidades).');if(sp.hasPrologue&&!chapters.some(c=>Number(c.chapter)===0))throw new Error('O corpus chegou sem o prólogo/capítulo 0. Nenhum texto incompleto foi adicionado.');
  return{version:sp.slug,name:sp.name,language:'pt-BR',license:sp.license,books:[{book:sp.book,bookId:100+OPEN_BIBLE_ORDER.indexOf(sp.slug),englishName:sp.name,testament:'SECOND_TEMPLE',chapters}],_doxaSource:{provider:'Escrituras Perdidas',url:'https://escriturasperdidas.com.br/pt/'+sp.sourceSlug,transport:usedProxy?'Fonte pública via transporte de leitura CORS':'Fonte pública direta',attribution:'Fonte da tradução portuguesa: Escrituras Perdidas — https://escriturasperdidas.com.br/',verified:'2026-09-14'}}
}
async function installOpenBible(slug,{quiet=false}={}){const sp=OPEN_BIBLE_SPECS[slug];if(!sp)throw new Error('Texto desconhecido.');if(sp.embeddedAlias){ensureEmbeddedBlivre();renderOpenBibleManager();syncLegacyVersionSelects();return CORPORA[slug]}if(sp.kind==='view'){if(!CORPORA['2-esdras-pt'])await installOpenBible('2-esdras-pt',{quiet});ensure4EzraView();syncLegacyVersionSelects();renderOpenBibleManager();return CORPORA[slug]}if(sp.kind==='waiting'){if(!quiet)alert('A versão '+sp.name+' foi catalogada, mas ainda não será copiada por scraping pesado. O Doxa vai integrá-la assim que houver um corpus estruturado da própria fonte ou um arquivo autorizado equivalente.');return null}if(CORPORA[slug])return CORPORA[slug];if(openBibleInstalling.has(slug))return null;openBibleInstalling.add(slug);renderOpenBibleManager(slug,1);try{let corpus;const progress=p=>renderOpenBibleManager(slug,p);if(sp.kind==='alm1911')corpus=await installAlmeida1911(progress);else if(sp.kind==='ep')corpus=await installEscriturasPerdidas(sp,progress);else throw new Error('Instalador não configurado.');await openBiblePut({slug,corpus,installedAt:new Date().toISOString()});registerOpenBible(slug,corpus);syncLegacyVersionSelects();renderOpenBibleManager();if(typeof renderVersionPicker==='function')try{renderVersionPicker()}catch(e){}return corpus}catch(e){console.error('Falha ao instalar '+slug,e);if(!quiet)alert('Não foi possível instalar '+sp.name+'.\n\n'+e.message+'\n\nNenhum texto incompleto foi adicionado.');throw e}finally{openBibleInstalling.delete(slug);renderOpenBibleManager()}}
async function loadOpenBibleModules(){ensureEmbeddedBlivre();const rows=await openBibleGetAll();for(const rec of rows){if(OPEN_BIBLE_SPECS[rec.slug]&&rec.corpus)registerOpenBible(rec.slug,rec.corpus)}if(CORPORA['2-esdras-pt'])ensure4EzraView();syncLegacyVersionSelects();setTimeout(renderOpenBibleManager,0)}
function corpusStats(x){return{books:x?.books?.length||0,chapters:(x?.books||[]).reduce((s,b)=>s+b.chapters.length,0),verses:(x?.books||[]).reduce((s,b)=>s+b.chapters.reduce((z,c)=>z+c.verses.length,0),0)}}
function renderOpenBibleManager(progressSlug=null,progress=null){const list=document.getElementById('openBibleModuleList');if(!list)return;let lastCat='';let html='';for(const slug of OPEN_BIBLE_ORDER){const sp=OPEN_BIBLE_SPECS[slug],cat=sp.category==='second-temple'?'Literatura do Segundo Templo':'Bíblias';if(cat!==lastCat){html+='<div class="module-category">'+cat+'</div>';lastCat=cat}const installed=!!CORPORA[slug],loading=openBibleInstalling.has(slug),waiting=sp.kind==='waiting',view=sp.kind==='view',stats=installed?corpusStats(CORPORA[slug]):null;let status=installed?(sp.embeddedAlias?'Incluída':(view?'Visão':'Offline')):(waiting?'Aguardando corpus':(view?'Com 2 Esdras':'Baixar'));if(loading)status=progressSlug===slug&&progress?'Baixando '+progress+'%':'Baixando…';const detail=installed?(stats.books+' obra'+(stats.books===1?'':'s')+' · '+stats.chapters.toLocaleString('pt-BR')+' caps · '+stats.verses.toLocaleString('pt-BR')+' versículos'):(sp.license+' · '+sp.scope+(sp.note?' · '+sp.note:''));html+='<div class="open-bible-row '+(installed?'installed ':'')+(loading?'loading ':'')+(waiting?'waiting ':'')+(view?'view ':'')+'" data-module="'+slug+'"><span class="open-bible-mark">'+sp.mark+'</span><span class="open-bible-copy"><strong>'+esc(sp.name)+' <span style="color:var(--ink-faint);font-size:.82em">'+sp.short+'</span></strong><small>'+esc(detail)+'</small></span><button type="button" class="open-bible-action" data-install="'+slug+'" '+(loading||installed||waiting?'disabled':'')+'>'+status+'</button><span class="open-bible-progress"><i style="width:'+(progressSlug===slug&&progress?progress:0)+'%"></i></span></div>'}list.innerHTML=html;list.querySelectorAll('[data-install]').forEach(b=>b.onclick=()=>installOpenBible(b.dataset.install));const all=document.getElementById('openBibleDownloadAll');if(all){const missing=OPEN_BIBLE_ORDER.filter(k=>!CORPORA[k]&&!OPEN_BIBLE_SPECS[k].embeddedAlias&&!['waiting','view'].includes(OPEN_BIBLE_SPECS[k].kind));all.disabled=!missing.length||openBibleInstalling.size>0;all.textContent=missing.length?'Baixar disponíveis':'Disponíveis offline'}}
async function installAllOpenBibles(){for(const slug of OPEN_BIBLE_ORDER){const sp=OPEN_BIBLE_SPECS[slug];if(!CORPORA[slug]&&!sp.embeddedAlias&&!['waiting','view'].includes(sp.kind)){try{await installOpenBible(slug,{quiet:true})}catch(e){alert('A instalação foi interrompida em '+sp.short+'.\n\n'+e.message);break}}}if(CORPORA['2-esdras-pt'])ensure4EzraView();syncLegacyVersionSelects();renderOpenBibleManager()}
window.DoxaOpenBibles={specs:OPEN_BIBLE_SPECS,install:installOpenBible,installAll:installAllOpenBibles,isInstalled:slug=>!!CORPORA[slug],render:renderOpenBibleManager};
document.getElementById('openBibleDownloadAll')?.addEventListener('click',installAllOpenBibles);

(async function(){await loadOpenBibleModules();await load();await loadAppearance();await loadParallel();bindAppearance();bindParallel();document.getElementById('swSup').checked=prefs.showSup!==false;document.getElementById('swRub').checked=prefs.rubric!==false;document.getElementById('swSize').value=Number(prefs.size)||18.5;applyTextPrefs(false);document.body.classList.toggle('hide-sup',prefs.showSup===false);document.body.classList.toggle('plain',prefs.rubric===false);renderReader();if(parallelOn)setParallelMode(true);renderChips();renderSearch();updateStorageNote();const stat=(x)=>({books:x.books.length,chapters:x.books.reduce((s,b)=>s+b.chapters.length,0),verses:x.books.reduce((s,b)=>s+b.chapters.reduce((z,c)=>z+c.verses.length,0),0)}),a=stat(ALMEIDA),w=stat(WLC),t=stat(TR);document.getElementById('stats').innerHTML='Tradução hiperliteral: '+HYPER_BLOCKS.length+' blocos, Gênesis 1.1 a 9.17.<br>Almeida 1819 / Bíblia Livre incorporada: '+a.books+' livros, '+a.chapters.toLocaleString('pt-BR')+' capítulos, '+a.verses.toLocaleString('pt-BR')+' versículos.<br>WLC corrigido (OSHB v2.2): '+w.books+' livros, '+w.chapters.toLocaleString('pt-BR')+' capítulos, '+w.verses.toLocaleString('pt-BR')+' versículos.<br>TR Stephanus 1550: '+t.books+' livros, '+t.chapters.toLocaleString('pt-BR')+' capítulos, '+t.verses.toLocaleString('pt-BR')+' versículos.<br><br>O Doxa mantém Almeida 1819, Bíblia Livre, WLC/OSHB, Textus Receptus 1550 e a Tradução Hiperliteral. O WLC mantém Strong+, lema e morfologia do Open Scriptures Hebrew Bible v2.2 (CC BY 4.0).<br><br>Referências cruzadas: dados OpenBible.info (CC BY), carregados sob demanda e armazenados localmente após o primeiro uso.'})();
