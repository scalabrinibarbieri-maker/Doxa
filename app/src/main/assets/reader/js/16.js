
(()=>{
'use strict';
const card=document.getElementById('offlinePackCard'),btn=document.getElementById('offlineDownloadAll'),cancelBtn=document.getElementById('offlineCancel'),bar=document.getElementById('offlineProgressBar'),status=document.getElementById('offlineStatus'),storage=document.getElementById('offlineStorage'),exportBtn=document.getElementById('offlineExport'),importInput=document.getElementById('offlineImport');
if(!card||!btn)return;
const CROSS='https://raw.githubusercontent.com/neuu-org/bible-crossrefs-dataset/main/data/00_raw/openbible/cross_references.txt';
const GREEK='https://raw.githubusercontent.com/honza/textus-receptus/master/data/gnt.flat.json';
const RP_BASE='https://raw.githubusercontent.com/byztxt/byzantine-majority-text/master/csv-unicode/strongs/no-parsing/';
const SBL_BASE='https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgnt/text/';
const API='https://bible.helloao.org';
const RP={Matt:'MAT',Mark:'MAR',Luke:'LUK',John:'JOH',Acts:'ACT',Rom:'ROM','1Cor':'1CO','2Cor':'2CO',Gal:'GAL',Eph:'EPH',Phil:'PHP',Col:'COL','1Thess':'1TH','2Thess':'2TH','1Tim':'1TI','2Tim':'2TI',Titus:'TIT',Phlm:'PHM',Heb:'HEB',Jas:'JAM','1Pet':'1PE','2Pet':'2PE','1John':'1JO','2John':'2JO','3John':'3JO',Jude:'JUD',Rev:'REV'};
const SBL={Matt:'Matt',Mark:'Mark',Luke:'Luke',John:'John',Acts:'Acts',Rom:'Rom','1Cor':'1Cor','2Cor':'2Cor',Gal:'Gal',Eph:'Eph',Phil:'Phil',Col:'Col','1Thess':'1Thess','2Thess':'2Thess','1Tim':'1Tim','2Tim':'2Tim',Titus:'Titus',Phlm:'Phlm',Heb:'Heb',Jas:'Jas','1Pet':'1Pet','2Pet':'2Pet','1John':'1John','2John':'2John','3John':'3John',Jude:'Jude',Rev:'Rev'};
const COMMENTS=['matthew-henry','jamieson-fausset-brown','adam-clarke','john-gill'];
let busy=false,aborter=null,cancelled=false;

function openDb(name,store){return new Promise((res,rej)=>{const q=indexedDB.open(name,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(store))q.result.createObjectStore(store)};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function idbGet(name,store,key){try{const db=await openDb(name,store);return await new Promise((res,rej)=>{const q=db.transaction(store,'readonly').objectStore(store).get(key);q.onsuccess=()=>res(q.result??null);q.onerror=()=>rej(q.error)})}catch(e){return null}}
async function idbPut(name,store,key,val){const db=await openDb(name,store);return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(val,key);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function idbKeys(name,store){try{const db=await openDb(name,store);return await new Promise((res,rej)=>{const q=db.transaction(store,'readonly').objectStore(store).getAllKeys();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error)})}catch(e){return[]}}
const studyGet=k=>idbGet('doxa-study-v20','cache',k),studyPut=(k,v)=>idbPut('doxa-study-v20','cache',k,v);

function human(n){if(!Number.isFinite(n))return'';const u=['B','KB','MB','GB'];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++}return (n>=100||i===0?n.toFixed(0):n.toFixed(1))+' '+u[i]}
async function updateStorage(){try{const e=await navigator.storage?.estimate?.();if(e?.usage!=null)storage.textContent='Armazenamento do app: '+human(e.usage)+(e.quota?' de '+human(e.quota):'')}catch(e){}}
function setStatus(a,b=''){status.innerHTML='<strong>'+a+'</strong><span>'+b+'</span>'}
function setProgress(done,total,label=''){const p=total?Math.max(0,Math.min(100,done/total*100)):0;bar.style.width=p.toFixed(2)+'%';setStatus(label||('Baixando recursos… '+done+' / '+total),(total?Math.round(p)+'% concluído':''))}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function fetchRetry(url,type='json',tries=3){let last;for(let i=0;i<tries;i++){if(cancelled)throw new DOMException('Cancelado','AbortError');try{const r=await fetch(url,{cache:'no-store',mode:'cors',signal:aborter?.signal});if(!r.ok)throw new Error('HTTP '+r.status);return type==='text'?await r.text():await r.json()}catch(e){last=e;if(e?.name==='AbortError')throw e;if(i<tries-1)await sleep(700*(i+1))}}throw last}
async function persist(){try{if(navigator.storage?.persist)await navigator.storage.persist()}catch(e){}}
function chapRange(b){const first=Number(b.firstChapterNumber??1)||1;let last=Number(b.lastChapterNumber);if(!Number.isFinite(last)||last<first)last=first+Math.max(0,Number(b.numberOfChapters||1)-1);return[first,last]}
async function storeCrossrefs(){let c=await idbGet('doxa-crossrefs-v1','data','openbible-tsv');if(typeof c==='string'&&c.length>100000)return 'cache';const t=await fetchRetry(CROSS,'text');await idbPut('doxa-crossrefs-v1','data','openbible-tsv',t);return 'net'}
async function storeGreek(){let c=await studyGet('greek-flat');if(c&&typeof c==='object'){await idbPut('doxa-greek-strong-v1','cache','flat',c);return 'cache'}const j=await fetchRetry(GREEK,'json');await studyPut('greek-flat',j);await idbPut('doxa-greek-strong-v1','cache','flat',j);return 'net'}
async function cacheText(key,url){const c=await studyGet(key);if(typeof c==='string'&&c.length)return 'cache';const t=await fetchRetry(url,'text');await studyPut(key,t);return 'net'}
async function cacheJson(key,url){const c=await studyGet(key);if(c&&typeof c==='object')return c;const j=await fetchRetry(url,'json');await studyPut(key,j);return j}

async function buildTasks(){
  setStatus('Preparando o pacote…','Consultando os índices para descobrir exatamente quais arquivos precisam ser guardados.');
  const tasks=[];
  tasks.push({label:'Referências cruzadas',run:storeCrossrefs});
  tasks.push({label:'Strong grego',run:storeGreek});
  for(const f of Object.values(RP))tasks.push({label:'Crítica textual · RP '+f,run:()=>cacheText('rp:'+f,RP_BASE+f+'.csv')});
  for(const f of Object.values(SBL))tasks.push({label:'Crítica textual · SBL '+f,run:()=>cacheText('sbl:'+f,SBL_BASE+f+'.txt')});

  const availableComments=await cacheJson('offline:available-commentaries',API+'/api/available_commentaries.json');
  for(const id of COMMENTS){
    if(cancelled)throw new DOMException('Cancelado','AbortError');
    const books=await cacheJson('offline:commentary-books:'+id,API+'/api/c/'+id+'/books.json');
    for(const b of books?.books||[]){const bid=b.id||b.bookId||b.abbreviation;if(!bid)continue;const [a,z]=chapRange(b);for(let ch=a;ch<=z;ch++)tasks.push({label:'Comentário · '+id+' · '+bid+' '+ch,run:()=>cacheJson('c:'+id+':'+bid+':'+ch,API+'/api/c/'+id+'/'+bid+'/'+ch+'.simple.json')})}
  }

  await cacheJson('offline:available-datasets',API+'/api/available_datasets.json');
  const tbooks=await cacheJson('offline:theographic-books',API+'/api/d/theographic/books.json');
  for(const b of tbooks?.books||[]){const bid=b.id||b.bookId||b.abbreviation;if(!bid)continue;const [a,z]=chapRange(b);for(let ch=a;ch<=z;ch++)tasks.push({label:'Pessoas e lugares · '+bid+' '+ch,run:()=>cacheJson('theo:'+bid+':'+ch,API+'/api/d/theographic/'+bid+'/'+ch+'.json')})}

  const groups=[['people','people','thisPersonApiLink'],['places','places','thisPlaceApiLink'],['events','events','thisEventApiLink'],['groups','groups','thisGroupApiLink']];
  for(const [type,prop,linkKey] of groups){
    const list=await cacheJson('offline:theographic-list:'+type,API+'/api/d/theographic/'+type+'.json');
    for(const x of list?.[prop]||[]){const link=x?.[linkKey]||x?.apiLink||('/api/d/theographic/'+type+'/'+x.id+'.json');if(!link)continue;tasks.push({label:'Entidade · '+(x.name||x.id||type),run:()=>cacheJson('ent:'+link,link.startsWith('http')?link:API+link)})}
  }
  return {tasks,availableComments};
}

async function pool(tasks,concurrency=4){let next=0,done=0,failed=[];const total=tasks.length;async function worker(){while(true){if(cancelled)return;const i=next++;if(i>=total)return;const t=tasks[i];try{await t.run()}catch(e){if(e?.name==='AbortError')return;failed.push({label:t.label,error:String(e?.message||e)})}done++;setProgress(done,total,t.label);if(done%25===0)await updateStorage()}}await Promise.all(Array.from({length:concurrency},worker));return{done,total,failed}}

async function downloadAll(){if(busy)return;busy=true;cancelled=false;aborter=new AbortController();card.classList.add('busy');card.classList.remove('done');btn.disabled=true;cancelBtn.hidden=false;bar.style.width='0%';try{await persist();const {tasks}=await buildTasks();setStatus('Pacote preparado',tasks.length.toLocaleString('pt-BR')+' arquivos/entradas serão conferidos. O que já estiver no cache será reaproveitado.');const r=await pool(tasks,4);if(cancelled)throw new DOMException('Cancelado','AbortError');const meta={format:'doxa-offline-bundle-v1',completedAt:new Date().toISOString(),total:r.total,failed:r.failed};await studyPut('offline:bundle-meta',meta);if(r.failed.length){setStatus('Download concluído com '+r.failed.length+' falha(s)','Os demais recursos já estão guardados. Toque novamente para tentar somente o que estiver faltando.')}else{card.classList.add('done');setStatus('Recursos offline completos','O Doxa já pode abrir estes módulos sem depender da primeira conexão. Última preparação: '+new Date().toLocaleString('pt-BR'));bar.style.width='100%'}await updateStorage()}catch(e){if(e?.name==='AbortError')setStatus('Download interrompido','Tudo que já havia terminado continua salvo; você pode retomar depois.');else setStatus('Não foi possível concluir',String(e?.message||e))}finally{busy=false;aborter=null;btn.disabled=false;cancelBtn.hidden=true;card.classList.remove('busy')}}
btn.onclick=downloadAll;cancelBtn.onclick=()=>{cancelled=true;aborter?.abort()};

async function existingState(){const meta=await studyGet('offline:bundle-meta');if(meta?.completedAt&&!meta?.failed?.length){card.classList.add('done');bar.style.width='100%';setStatus('Recursos offline completos','Preparados em '+new Date(meta.completedAt).toLocaleString('pt-BR')+'. Você pode atualizar ou exportar um backup quando quiser.');btn.textContent='Atualizar / conferir recursos'}else if(meta?.completedAt){setStatus('Pacote parcialmente baixado','Há '+(meta.failed?.length||0)+' recurso(s) que não foram concluídos. Toque em “Baixar todos” para tentar novamente.')}await updateStorage()}

async function streamBackup(){
  setStatus('Preparando backup…','Lendo os bancos locais sem alterar o conteúdo.');
  const keys=await idbKeys('doxa-study-v20','cache'),cross=await idbGet('doxa-crossrefs-v1','data','openbible-tsv'),greek=await idbGet('doxa-greek-strong-v1','cache','flat');
  const enc=new TextEncoder();let idx=0;
  const rs=new ReadableStream({async pull(controller){try{if(idx===0){controller.enqueue(enc.encode(JSON.stringify({t:'meta',format:'doxa-resource-backup-v1',createdAt:new Date().toISOString()})+'\n'));idx++;return}if(idx===1){if(cross)controller.enqueue(enc.encode(JSON.stringify({t:'crossrefs',v:cross})+'\n'));idx++;return}if(idx===2){if(greek)controller.enqueue(enc.encode(JSON.stringify({t:'greek',v:greek})+'\n'));idx++;return}const kidx=idx-3;if(kidx<keys.length){const k=keys[kidx],v=await studyGet(k);controller.enqueue(enc.encode(JSON.stringify({t:'study',k,v})+'\n'));idx++;if(kidx%80===0)setStatus('Exportando backup…',(kidx+1)+' de '+keys.length+' registros');return}controller.close()}catch(e){controller.error(e)}}});
  let mime='application/x-ndjson',ext='.ndjson',body=rs;if('CompressionStream'in window){body=rs.pipeThrough(new CompressionStream('gzip'));mime='application/gzip';ext='.ndjson.gz'}const blob=await new Response(body,{headers:{'Content-Type':mime}}).blob();const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Doxa_Recursos_Offline_'+new Date().toISOString().slice(0,10)+ext;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);setStatus('Backup preparado','Arquivo com '+human(blob.size)+' criado a partir dos recursos armazenados no Doxa.')
}
exportBtn.onclick=async()=>{if(busy)return;exportBtn.disabled=true;try{await streamBackup()}catch(e){setStatus('Falha ao exportar backup',String(e?.message||e))}finally{exportBtn.disabled=false}};

async function importBackup(file){
  if(!file)return;
  setStatus('Importando backup…','O conteúdo será restaurado para os mesmos bancos usados pelo Doxa.');
  let stream=file.stream();
  if((file.name||'').endsWith('.gz')){
    if(!('DecompressionStream'in window))throw new Error('Este WebView não consegue descompactar GZIP. Use o backup .ndjson sem compressão.');
    stream=stream.pipeThrough(new DecompressionStream('gzip'));
  }
  const reader=stream.pipeThrough(new TextDecoderStream()).getReader();
  let buf='',count=0;
  while(true){
    const part=await reader.read();
    const value=part.value,done=part.done;
    buf+=value||'';
    let pos;
    while((pos=buf.indexOf('\n'))>=0){
      const line=buf.slice(0,pos);buf=buf.slice(pos+1);
      if(!line.trim())continue;
      const r=JSON.parse(line);
      if(r.t==='crossrefs')await idbPut('doxa-crossrefs-v1','data','openbible-tsv',r.v);
      else if(r.t==='greek'){await idbPut('doxa-greek-strong-v1','cache','flat',r.v);await studyPut('greek-flat',r.v)}
      else if(r.t==='study'&&r.k!=null)await studyPut(r.k,r.v);
      count++;
      if(count%80===0)setStatus('Importando backup…',count.toLocaleString('pt-BR')+' registros restaurados');
    }
    if(done)break;
  }
  if(buf.trim()){
    const r=JSON.parse(buf);
    if(r.t==='crossrefs')await idbPut('doxa-crossrefs-v1','data','openbible-tsv',r.v);
    else if(r.t==='greek'){await idbPut('doxa-greek-strong-v1','cache','flat',r.v);await studyPut('greek-flat',r.v)}
    else if(r.t==='study'&&r.k!=null)await studyPut(r.k,r.v);
    count++;
  }
  setStatus('Backup restaurado',count.toLocaleString('pt-BR')+' registros importados. Os módulos podem usar estes dados offline.');
  await existingState();
}
importInput.onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{await importBackup(f)}catch(err){setStatus('Falha ao importar backup',String(err?.message||err))}};

setTimeout(existingState,200);
})();
