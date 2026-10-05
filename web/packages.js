/* Doxa Web · instalador dos pacotes de textos (Bíblias, hebraico, grego, interlinear…)
   É o equivalente do RemotePackageInstaller do Android:
   1. sessão anônima no Supabase (a mesma usada pelas curtidas da Home);
   2. manifesto dos pacotes ativos (função doxa-package-manifest-web, com links assinados);
   3. download de cada pacote, conferência do tamanho e do SHA-256;
   4. descompactação no próprio navegador (DecompressionStream);
   5. os arquivos ficam no cache "doxa-data", e o service worker os entrega ao leitor
      nos mesmos caminhos do Android (data/…, interlinear/…). */
(function(){
  'use strict';
  const SB='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const KEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  const DATA='doxa-data';
  const STATE='doxa:web:pkgs:v1';
  const REQUIRED=['core-texts','pt-bibles-a','pt-bibles-b','interlinear-gn-ex'];
  const WEB_CODE=100000;   // a web acompanha sempre a versão mais nova
  const base=()=>new URL('./',location.href.replace(/[^/]*$/,'')).href.replace(/web\/$/,'');
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STATE)||'{}')}catch(e){return{}}};
  const writeState=s=>{try{localStorage.setItem(STATE,JSON.stringify(s))}catch(e){}};

  async function anonToken(){
    let s=null;try{s=JSON.parse(localStorage.getItem('doxa:web:anon')||'null')}catch(e){}
    const save=r=>{s={access_token:r.access_token,refresh_token:r.refresh_token,expires_at:Date.now()+(Number(r.expires_in)||3600)*1000};try{localStorage.setItem('doxa:web:anon',JSON.stringify(s))}catch(e){}return s.access_token};
    const post=async(path,body)=>{const r=await fetch(SB+path,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body||{})});if(!r.ok)throw new Error('auth '+r.status);return r.json()};
    if(s&&s.access_token&&Date.now()<s.expires_at-60000)return s.access_token;
    if(s&&s.refresh_token){try{return save(await post('/auth/v1/token?grant_type=refresh_token',{refresh_token:s.refresh_token}))}catch(e){}}
    return save(await post('/auth/v1/signup',{}));
  }
  async function manifest(){
    const tok=await anonToken();
    let r;
    try{r=await fetch(SB+'/functions/v1/doxa-package-manifest-web',{headers:{apikey:KEY,Authorization:'Bearer '+tok},cache:'no-store'})}
    catch(e){throw new Error('Sem conexão com a internet.')}
    if(!r.ok)throw new Error('O servidor do Doxa não respondeu ('+r.status+'). Tente de novo em instantes.');
    const j=await r.json();
    return(j.packages||[]).filter(p=>(p.min_app_version_code||0)<=WEB_CODE);
  }
  async function download(p,onBytes){
    const r=await fetch(p.signed_url,{cache:'no-store'});
    if(!r.ok)throw new Error('Falha ao baixar '+p.package_key+' ('+r.status+').');
    const total=Number(p.size_bytes)||0,buf=new Uint8Array(total||0);let got=0;
    const reader=r.body.getReader();let parts=total?null:[];
    for(;;){const {done,value}=await reader.read();if(done)break;
      if(total){if(got+value.length>total)throw new Error('Pacote maior que o esperado: '+p.package_key);buf.set(value,got)}else parts.push(value);
      got+=value.length;onBytes&&onBytes(value.length)}
    const data=total?buf:new Uint8Array(await new Blob(parts).arrayBuffer());
    if(total&&got!==total)throw new Error('Download incompleto: '+p.package_key);
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(p.sha256&&hash!==p.sha256)throw new Error('Falha de integridade no pacote '+p.package_key+'.');
    return data;
  }
  async function unzip(u8){
    const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);let eocd=-1;
    for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--)if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}
    if(eocd<0)throw new Error('Pacote corrompido.');
    const n=dv.getUint16(eocd+10,true);let p=dv.getUint32(eocd+16,true);const out=[];const td=new TextDecoder();
    for(let i=0;i<n;i++){
      if(dv.getUint32(p,true)!==0x02014b50)throw new Error('Pacote corrompido.');
      const method=dv.getUint16(p+10,true),csize=dv.getUint32(p+20,true),usize=dv.getUint32(p+24,true);
      const nlen=dv.getUint16(p+28,true),elen=dv.getUint16(p+30,true),clen=dv.getUint16(p+32,true),lho=dv.getUint32(p+42,true);
      const name=td.decode(u8.subarray(p+46,p+46+nlen));p+=46+nlen+elen+clen;
      if(name.endsWith('/'))continue;
      if(name.includes('..')||name.startsWith('/'))throw new Error('Caminho inseguro no pacote.');
      const start=lho+30+dv.getUint16(lho+26,true)+dv.getUint16(lho+28,true);
      const comp=u8.subarray(start,start+csize);let data;
      if(method===0)data=comp;
      else if(method===8)data=new Uint8Array(await new Response(new Blob([comp]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      else throw new Error('Formato de compressão não suportado.');
      if(data.length!==usize)throw new Error('Arquivo corrompido no pacote: '+name);
      out.push({name,data});
    }
    return out;
  }
  const MIME={js:'application/javascript; charset=utf-8',json:'application/json; charset=utf-8',tsv:'text/tab-separated-values; charset=utf-8',
    css:'text/css; charset=utf-8',txt:'text/plain; charset=utf-8',png:'image/png',webp:'image/webp',jpg:'image/jpeg',svg:'image/svg+xml'};
  async function store(files){
    const c=await caches.open(DATA),root=base(),paths=[];
    for(const f of files){
      if(f.name==='package-manifest.json')continue;
      const ext=(f.name.split('.').pop()||'').toLowerCase();
      await c.put(new URL(f.name,root).href,new Response(new Blob([f.data]),{headers:{'Content-Type':MIME[ext]||'application/octet-stream'}}));
      paths.push(f.name);
    }
    return paths;
  }
  // instala ou atualiza: só baixa o que mudou; onProgress(baixado, total, texto)
  async function sync(onProgress){
    const list=await manifest(),st=readState();
    const todo=list.filter(p=>!st[p.package_key]||st[p.package_key].sha256!==p.sha256);
    const total=todo.reduce((a,p)=>a+(Number(p.size_bytes)||0),0);let done=0;
    onProgress&&onProgress(0,total,todo.length?'Baixando os textos…':'Tudo em dia');
    for(const p of todo){
      const data=await download(p,b=>{done+=b;onProgress&&onProgress(done,total,'Baixando '+label(p.package_key)+'…')});
      onProgress&&onProgress(done,total,'Preparando '+label(p.package_key)+'…');
      const files=await unzip(data);
      const old=st[p.package_key]&&st[p.package_key].files||[];
      const paths=await store(files);
      // remove arquivos que existiam na versão anterior e saíram desta
      if(old.length){const c=await caches.open(DATA),root=base();for(const f of old)if(!paths.includes(f))await c.delete(new URL(f,root).href)}
      st[p.package_key]={sha256:p.sha256,version:p.version,files:paths,at:Date.now()};writeState(st);
    }
    return{updated:todo.map(p=>p.package_key),total};
  }
  async function ready(){
    const st=readState();if(!REQUIRED.every(k=>st[k]))return false;
    try{const c=await caches.open(DATA);return!!(await c.match(new URL('data/almeida.js',base()).href))}catch(e){return false}
  }
  function label(k){return({'core-texts':'a Almeida, o hebraico e o grego','pt-bibles-a':'as Bíblias em português','pt-bibles-b':'mais Bíblias em português',
    'interlinear-gn-ex':'o interlinear','greek-strong':'o dicionário grego','entidades-pt':'Pessoas e Lugares','timeline':'a Linha do Tempo',
    'doxa-textus':'o Doxa Textus','lxx':'a Septuaginta'})[k]||k}
  window.DoxaWebPackages={sync,ready,manifest,unzip,REQUIRED};
})();
