(()=>{
  'use strict';
  /* Doxa 31.1 · Fontes de leitura
     - Serifada (padrão), EB Garamond incorporada e uma fonte importada pelo usuário (.ttf/.otf).
     - A escolha fica em localStorage; o arquivo importado fica no IndexedDB, então sobrevive
       a fechar e abrir o app. O hebraico nunca é afetado (regras usam :not(.hebrew)).
     - Usa a variável própria --doxa-font para não disputar com --reader-family, que scripts
       antigos (02/05) ainda redefinem durante o boot. */
  if(window.__doxa32FontsInstalled)return;
  window.__doxa32FontsInstalled=true;

  const $=s=>document.querySelector(s);
  const CHOICE_KEY='doxa:31.1:reader-font';
  const DB_NAME='doxa-fonts-v1',STORE='fonts',CUSTOM_ID='custom';
  const FAMILY_CUSTOM='Doxa Custom';
  const STACKS={
    editorial:"Georgia,'Times New Roman',serif",
    garamond:"'EB Garamond',Georgia,'Times New Roman',serif",
    custom:"'"+FAMILY_CUSTOM+"',Georgia,'Times New Roman',serif"
  };
  const MAX_BYTES=15*1024*1024;
  let customFace=null,customName='';

  const style=document.createElement('style');
  style.id='doxa32-fonts-style';
  style.textContent=`
@font-face{font-family:'EB Garamond';src:url('fonts/EBGaramond-VariableFont_wght.ttf') format('truetype');font-style:normal;font-weight:400 800;font-display:swap}
@font-face{font-family:'EB Garamond';src:url('fonts/EBGaramond-Italic-VariableFont_wght.ttf') format('truetype');font-style:italic;font-weight:400 800;font-display:swap}
.doxa-font-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.doxa-font-actions .btn{flex:1 1 auto;min-height:40px}
.doxa-font-status{margin-top:8px;font:500 11px/1.4 var(--ui);color:var(--ink-faint)}
.doxa-font-status.err{color:var(--rubric)}
#readerFontChoices{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}
`;
  document.head.appendChild(style);

  /* ---------- armazenamento ---------- */
  let dbPromise=null;
  function db(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB indisponível'));return}
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'id'})};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Falha ao abrir o armazenamento de fontes'));
    });
    return dbPromise;
  }
  async function dbGet(id){const d=await db();return new Promise((res,rej)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
  async function dbPut(rec){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(rec);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error)})}
  async function dbDel(id){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error)})}

  function storedChoice(){try{const v=localStorage.getItem(CHOICE_KEY);return STACKS[v]?v:'editorial'}catch(e){return'editorial'}}
  function saveChoice(v){try{localStorage.setItem(CHOICE_KEY,v)}catch(e){}}

  /* ---------- interface ---------- */
  function status(text,err=false){const el=$('#doxaFontStatus');if(!el)return;el.textContent=text||'';el.classList.toggle('err',!!err)}
  function syncUi(choice){
    document.querySelectorAll('.doxa-font-option').forEach(b=>b.classList.toggle('on',b.dataset.doxaFont===choice));
    const opt=$('#doxaFontCustomOption'),rm=$('#doxaFontRemove'),nm=$('#doxaFontCustomName');
    if(opt)opt.hidden=!customFace;
    if(rm)rm.hidden=!customFace;
    if(nm)nm.textContent=customName?customName:'Minha fonte';
  }
  function apply(choice,save=true){
    if(!STACKS[choice])choice='editorial';
    if(choice==='custom'&&!customFace)choice='editorial';
    document.documentElement.style.setProperty('--doxa-font',STACKS[choice]);
    document.body.dataset.doxaFont=choice;
    syncUi(choice);
    if(save)saveChoice(choice);
    if(choice==='garamond'&&document.fonts?.load)document.fonts.load("400 18px 'EB Garamond'").catch(()=>{});
  }

  /* ---------- fonte importada ---------- */
  async function registerCustom(buffer,name){
    const face=new FontFace(FAMILY_CUSTOM,buffer,{style:'normal',weight:'100 900',display:'swap'});
    await face.load();                       // recusa arquivos que não são fontes válidas
    if(customFace){try{document.fonts.delete(customFace)}catch(e){}}
    document.fonts.add(face);
    customFace=face;customName=name||'Minha fonte';
  }
  function cleanName(file){return String(file.name||'Minha fonte').replace(/\.(ttf|otf)$/i,'').replace(/[-_]+/g,' ').trim().slice(0,40)||'Minha fonte'}

  async function importFile(file){
    if(!file)return;
    if(!/\.(ttf|otf)$/i.test(file.name||'')){status('Escolha um arquivo .ttf ou .otf.',true);return}
    if(file.size>MAX_BYTES){status('Arquivo grande demais (máximo 15 MB).',true);return}
    status('Carregando fonte…');
    try{
      const buffer=await file.arrayBuffer();
      const name=cleanName(file);
      await registerCustom(buffer.slice(0),name);
      await dbPut({id:CUSTOM_ID,name,buffer,savedAt:Date.now()});
      apply('custom',true);
      status('Fonte “'+name+'” importada e aplicada.');
    }catch(e){
      status('Não foi possível ler esta fonte. Verifique se o arquivo é uma fonte TTF/OTF válida.',true);
    }
  }
  async function removeCustom(){
    try{await dbDel(CUSTOM_ID)}catch(e){}
    if(customFace){try{document.fonts.delete(customFace)}catch(e){}}
    customFace=null;customName='';
    apply(storedChoice()==='custom'?'editorial':storedChoice(),true);
    status('Fonte importada removida.');
  }

  async function restoreCustom(){
    try{
      const rec=await dbGet(CUSTOM_ID);
      if(rec&&rec.buffer)await registerCustom(rec.buffer,rec.name);
    }catch(e){}
  }

  function bind(){
    document.querySelectorAll('.doxa-font-option').forEach(b=>{
      if(b.dataset.doxaFontBound)return;b.dataset.doxaFontBound='1';
      b.addEventListener('click',()=>{apply(b.dataset.doxaFont,true);status('')});
    });
    const input=$('#doxaFontImport');
    if(input&&!input.dataset.doxaFontBound){
      input.dataset.doxaFontBound='1';
      input.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];importFile(f).finally(()=>{e.target.value=''})});
    }
    const rm=$('#doxaFontRemove');
    if(rm&&!rm.dataset.doxaFontBound){rm.dataset.doxaFontBound='1';rm.addEventListener('click',removeCustom)}
  }

  async function init(){
    bind();
    apply(storedChoice()==='custom'?'editorial':storedChoice(),false);   // imediato, sem esperar o IndexedDB
    await restoreCustom();
    apply(storedChoice(),false);
  }
  window.DoxaFonts={apply,importFile,removeCustom};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
