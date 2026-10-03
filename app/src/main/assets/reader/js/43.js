(()=>{
  'use strict';
  /* Doxa 57 · CONTA DOXA (Etapa 1)
     · Entrar / criar conta por e-mail e senha (Supabase Auth, chamado direto pela API, sem biblioteca).
     · Perfil (nome) e sincronização de grifos, notas, pastas, Pão Diário e preferências.
     · Tudo continua sendo salvo primeiro no celular; a conta sincroniza quando há conexão.
     · Exclusões viram "marcas de exclusão" no servidor, para não ressuscitarem em outro aparelho.
     · Junção a 3 vias: compara aparelho, servidor e o último estado sincronizado (base) — assim só o
       que mudou de cada lado é aplicado. Quando os dois lados mudaram o mesmo item, vale o do aparelho.
     · A Bíblia continua funcionando sem conta. */
  if(window.__doxa57ContaInstalled)return;
  window.__doxa57ContaInstalled=true;

  const SB='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const APIKEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  const SITE='https://scalabrinibarbieri-maker.github.io/Doxa/conta/';
  const SKEY='doxa:conta:sessao';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ---------------- o que é sincronizado ----------------
  const COLLS=[
    {coll:'hl',key:'doxa:highlights:v1',path:'items',def:()=>({items:[]})},
    {coll:'nota',key:'doxa:notas:v1',path:'items',def:()=>({items:[],folders:[]})},
    {coll:'pasta',key:'doxa:notas:v1',path:'folders',def:()=>({items:[],folders:[]})},
  ];
  const DOCS=['doxa:pao:v2','doxa:pao-diario:last-earned','doxa:pao-diario:streak','doxa:home:liked:v1',
    'bereshit:prefs:v4','bereshit:appearance:v1','doxa:reader-text-prefs:v1','bereshit:marks:v3',
    'doxa:30.5:theme','doxa:30.6:texture','doxa:30.5:paper-texture','doxa:31.1:reader-font',
    'doxa:marcas:mostrar-notas','doxa:marcas:mostrar-grifos','doxa:chrono:tr','doxa:picker:recent'];

  // ---------------- sessão ----------------
  let sess=null;
  try{sess=JSON.parse(localStorage.getItem(SKEY)||'null')}catch(e){sess=null}
  const saveSess=()=>{try{sess?localStorage.setItem(SKEY,JSON.stringify(sess)):localStorage.removeItem(SKEY)}catch(e){}};
  const uid=()=>sess&&sess.user&&sess.user.id;

  const MSG=[
    [/invalid login credentials/i,'E-mail ou senha incorretos.'],
    [/email not confirmed/i,'Confirme seu e-mail antes de entrar: abra o link que enviamos.'],
    [/already registered|already been registered|user already exists/i,'Já existe uma conta com esse e-mail.'],
    [/password should be at least|weak password/i,'A senha precisa ter pelo menos 6 caracteres.'],
    [/unable to validate email|invalid email|email address .* is invalid/i,'Esse e-mail não parece válido.'],
    [/rate limit|too many|over_email_send_rate_limit|security purposes/i,'Muitas tentativas seguidas. Espere um pouco e tente de novo.'],
    [/signups not allowed|signup is disabled/i,'Cadastros estão temporariamente fechados.'],
  ];
  function ptError(j,status){
    const raw=(j&&(j.msg||j.message||j.error_description||j.error))||'';
    for(const [re,t] of MSG)if(re.test(raw))return t;
    if(status>=500)return'O servidor não respondeu. Tente de novo em instantes.';
    return raw?('Não deu certo: '+raw):'Não deu certo. Verifique a conexão e tente de novo.';
  }
  async function http(path,{method='GET',body,auth=true,headers={}}={}){
    if(auth)await ensureFresh();
    const h=Object.assign({'apikey':APIKEY,'Content-Type':'application/json'},headers);
    if(auth&&sess)h.Authorization='Bearer '+sess.access_token;
    let r;
    try{r=await fetch(SB+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)})}
    catch(e){throw Object.assign(new Error('Sem conexão com a internet.'),{offline:true})}
    const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}
    if(!r.ok)throw Object.assign(new Error(ptError(j,r.status)),{status:r.status,body:j});
    return j;
  }
  function takeSession(j){
    if(!j||!j.access_token)return false;
    sess={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at||Math.floor(Date.now()/1000)+(j.expires_in||3600),user:j.user||(sess&&sess.user)};
    saveSess();return true;
  }
  let refreshing=null;
  async function ensureFresh(){
    if(!sess)return;
    if((sess.expires_at||0)*1000-Date.now()>60000)return;
    if(!refreshing)refreshing=(async()=>{
      try{const j=await http('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:{refresh_token:sess.refresh_token}});takeSession(j)}
      catch(e){if(e.status===400||e.status===401){sess=null;saveSess();paintAll()}throw e}
      finally{refreshing=null}
    })();
    return refreshing;
  }
  async function signIn(email,password){const j=await http('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email,password}});takeSession(j);return j}
  async function signUp(name,email,password){
    const j=await http('/auth/v1/signup?redirect_to='+encodeURIComponent(SITE+'confirmado.html'),{method:'POST',auth:false,body:{email,password,data:{name}}});
    if(j&&j.access_token){takeSession(j);return{session:true}}
    return{session:false};
  }
  async function recover(email){await http('/auth/v1/recover?redirect_to='+encodeURIComponent(SITE+'nova-senha.html'),{method:'POST',auth:false,body:{email}})}
  async function signOut(){try{await http('/auth/v1/logout',{method:'POST'})}catch(e){}const u=uid();sess=null;saveSess();try{if(u)localStorage.removeItem('doxa:conta:base:'+u)}catch(e){}}
  async function deleteAccount(){await http('/rest/v1/rpc/delete_my_account',{method:'POST',body:{}});const u=uid();sess=null;saveSess();try{if(u)localStorage.removeItem('doxa:conta:base:'+u)}catch(e){}}
  async function loadProfile(){if(!uid())return null;const r=await http('/rest/v1/profiles?id=eq.'+uid()+'&select=display_name,username');return r&&r[0]||null}
  async function saveProfile(name){await http('/rest/v1/profiles?id=eq.'+uid(),{method:'PATCH',body:{display_name:name},headers:{Prefer:'return=minimal'}})}

  // ---------------- sincronização ----------------
  const stable=v=>{if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return'['+v.map(stable).join(',')+']';return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'};
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)+':'+s.length};
  const hv=v=>hash(stable(v));
  const readJSON=k=>{try{const x=JSON.parse(localStorage.getItem(k)||'null');return x&&typeof x==='object'?x:null}catch(e){return null}};
  const baseKey=()=>'doxa:conta:base:'+uid();
  const loadBase=()=>{try{return JSON.parse(localStorage.getItem(baseKey())||'null')||{cursor:'',items:{},docs:{},last:0}}catch(e){return{cursor:'',items:{},docs:{},last:0}}};
  const saveBase=b=>{try{localStorage.setItem(baseKey(),JSON.stringify(b))}catch(e){}};
  function localState(){
    const containers={},maps={},order={};
    for(const c of COLLS){
      if(!containers[c.key])containers[c.key]=readJSON(c.key)||c.def();
      const arr=Array.isArray(containers[c.key][c.path])?containers[c.key][c.path]:(containers[c.key][c.path]=[]);
      maps[c.coll]=new Map();order[c.coll]=[];
      for(const x of arr){if(!x||x.id==null)continue;const id=String(x.id);maps[c.coll].set(id,x);order[c.coll].push(id)}
    }
    const docs={};for(const k of DOCS){try{docs[k]=localStorage.getItem(k)}catch(e){docs[k]=null}}
    return{containers,maps,order,docs};
  }
  function isDirty(){
    if(!uid())return false;
    const b=loadBase(),L=localState();
    for(const c of COLLS){const bm=b.items[c.coll]||{};const m=L.maps[c.coll];
      if(Object.keys(bm).length!==m.size)return true;
      for(const [id,x] of m)if(bm[id]!==hv(x))return true}
    for(const k of DOCS){const v=L.docs[k];const bh=b.docs[k];if(v==null?(bh!=null):(bh!==hash(v)))return true}
    return false;
  }
  let syncing=null,lastErr='';
  function sync(opts={}){
    if(!uid())return Promise.resolve(false);
    if(syncing)return syncing;
    syncing=(async()=>{
      setStatus('sync');
      try{
        const b=loadBase();const first=!b.last;
        // 1) traz do servidor o que mudou desde a última vez (com 10 s de folga, por segurança)
        const rows=[];let cur=b.cursor||'';
        const since=cur?new Date(new Date(cur).getTime()-10000).toISOString():'';
        let page,offset=0;
        do{
          page=await http('/rest/v1/user_items?select=coll,item_id,data,deleted,updated_at&order=updated_at.asc,coll.asc,item_id.asc&limit=1000&offset='+offset+(since?'&updated_at=gt.'+encodeURIComponent(since):''));
          rows.push(...page);offset+=page.length;
        }while(page.length===1000);
        // 2) estado do aparelho
        const L=localState();const changed=new Set();
        // 3) aplica o que veio do servidor (só o que não mudou aqui desde a base)
        for(const r of rows){
          if(r.coll==='doc'){
            const k=r.item_id;if(!DOCS.includes(k))continue;
            const loc=L.docs[k],lh=loc==null?null:hash(loc),bh=b.docs[k];
            const localChanged=bh===undefined?loc!=null:lh!==bh;
            if(localChanged)continue;
            const rv=r.deleted?null:(r.data&&r.data.v!=null?String(r.data.v):null);
            if((rv==null?undefined:hash(rv))===bh)continue;
            if(rv!==loc){L.docs[k]=rv;changed.add(k)}
            if(rv==null)delete b.docs[k];else b.docs[k]=hash(rv);
            continue;
          }
          const c=COLLS.find(x=>x.coll===r.coll);if(!c)continue;
          const m=L.maps[c.coll],id=String(r.item_id),loc=m.get(id);
          const bm=b.items[c.coll]||(b.items[c.coll]={});const bh=bm[id];
          const lh=loc?hv(loc):null,localChanged=bh===undefined?!!loc:lh!==bh;
          if(r.deleted){
            if(!localChanged){if(loc){m.delete(id);changed.add(c.key)}delete bm[id]}
          }else if(r.data&&typeof r.data==='object'){
            const rh=hv(r.data);
            if(rh===bh)continue;   // o servidor não mudou desde a base: nada a aplicar
            if(!loc){m.set(id,r.data);if(!L.order[c.coll].includes(id))L.order[c.coll].push(id);changed.add(c.key);bm[id]=rh}   // edição remota vence exclusão local
            else if(!localChanged){if(rh!==lh){m.set(id,r.data);changed.add(c.key)}bm[id]=rh}
          }
        }
        // 4) grava no aparelho o que mudou
        for(const c of COLLS){
          if(!changed.has(c.key))continue;
          const arr=[];for(const id of L.order[c.coll])if(L.maps[c.coll].has(id))arr.push(L.maps[c.coll].get(id));
          L.containers[c.key][c.path]=arr;
        }
        const keysToWrite=new Set(COLLS.filter(c=>changed.has(c.key)).map(c=>c.key));
        for(const k of keysToWrite){try{localStorage.setItem(k,JSON.stringify(L.containers[k]))}catch(e){}}
        for(const k of DOCS){if(!changed.has(k))continue;try{L.docs[k]==null?localStorage.removeItem(k):localStorage.setItem(k,L.docs[k])}catch(e){}}
        // 5) envia o que mudou no aparelho
        const push=[];
        for(const c of COLLS){
          const bm=b.items[c.coll]||(b.items[c.coll]={});const m=L.maps[c.coll];
          for(const [id,x] of m){const h=hv(x);if(bm[id]!==h)push.push({row:{coll:c.coll,item_id:id,data:x,deleted:false},ok:()=>{bm[id]=h}})}
          for(const id of Object.keys(bm))if(!m.has(id))push.push({row:{coll:c.coll,item_id:id,data:null,deleted:true},ok:()=>{delete bm[id]}});
        }
        for(const k of DOCS){
          const v=L.docs[k],bh=b.docs[k];
          if(v==null){if(bh!=null)push.push({row:{coll:'doc',item_id:k,data:null,deleted:true},ok:()=>{delete b.docs[k]}})}
          else{const h=hash(v);if(bh!==h)push.push({row:{coll:'doc',item_id:k,data:{v},deleted:false},ok:()=>{b.docs[k]=h}})}
        }
        for(let i=0;i<push.length;i+=200){
          const batch=push.slice(i,i+200);
          await http('/rest/v1/user_items?on_conflict=user_id,coll,item_id',{method:'POST',body:batch.map(p=>p.row),headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
          batch.forEach(p=>p.ok());
        }
        // 6) o cursor avança só pelo que foi lido (nunca pelo que foi enviado), para não pular nada de outro aparelho
        if(rows.length)b.cursor=rows[rows.length-1].updated_at;
        b.last=Date.now();saveBase(b);lastErr='';
        setStatus('ok');
        const report={pulled:rows.length,pushed:push.length,changedHere:changed.size>0,first};
        if(changed.size>0)reloadForRemote(!!(opts.boot||opts.interactive));
        return report;
      }catch(e){lastErr=e.message||'Falha ao sincronizar';setStatus('err');return false}
      finally{syncing=null}
    })();
    return syncing;
  }
  // os módulos de grifos e notas leem o armazenamento ao abrir; quando chega algo de outro aparelho,
  // a tela é recarregada uma vez para mostrar tudo
  function reloadForRemote(auto){
    const go=()=>{try{const t=Number(sessionStorage.getItem('doxa:conta:reload-at')||0);if(Date.now()-t<20000)return;sessionStorage.setItem('doxa:conta:reload-at',String(Date.now()))}catch(e){}
      try{location.reload()}catch(e){}};
    if(auto){toast('Seus dados chegaram da nuvem. Atualizando…');setTimeout(go,1200);return}
    // no meio da leitura não interrompe: avisa e deixa a pessoa escolher a hora
    let t=$('contaToast');toast('Chegaram atualizações da sua conta.');t=$('contaToast');
    const b=document.createElement('button');b.type='button';b.textContent='Atualizar';b.className='conta-toast-btn';b.onclick=go;t.appendChild(b);clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),9000);
  }

  // ---------------- interface ----------------
  let status='idle';
  function setStatus(s){status=s;paintRow();paintStatus()}
  function since(t){if(!t)return'ainda não sincronizado';const s=Math.round((Date.now()-t)/1000);if(s<60)return'sincronizado agora';const m=Math.round(s/60);if(m<60)return'sincronizado há '+m+' min';const h=Math.round(m/60);if(h<24)return'sincronizado há '+h+' h';return'sincronizado há '+Math.round(h/24)+' dia(s)'}
  function toast(msg){let t=$('contaToast');if(!t){t=document.createElement('div');t.id='contaToast';t.className='conta-toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),2800)}
  let profile=null;
  function displayName(){return(profile&&profile.display_name)||(sess&&sess.user&&((sess.user.user_metadata&&sess.user.user_metadata.name)||sess.user.email))||''}
  function paintRow(){
    const row=$('contaRow');if(!row)return;
    const small=row.querySelector('small'),strong=row.querySelector('strong');
    if(!uid()){strong.textContent='Conta Doxa';small.textContent='Entre para guardar grifos, notas e Pão Diário na nuvem'}
    else{strong.textContent=displayName()||'Conta Doxa';small.textContent=status==='sync'?'sincronizando…':status==='err'?'não sincronizou · toque para ver':since(loadBase().last)}
  }
  function ensureRow(){
    const list=document.querySelector('#doxa30MoreOverlay .doxa30-more-list');
    if(!list||$('contaRow'))return!!$('contaRow');
    const b=document.createElement('button');b.className='doxa30-more-row';b.id='contaRow';b.type='button';
    b.innerHTML='<span class="doxa30-more-icon conta-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M5 19.5c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5"/></svg></span><span class="doxa30-more-copy"><strong>Conta Doxa</strong><small></small></span><span class="doxa30-more-arrow">›</span>';
    list.prepend(b);
    b.addEventListener('click',e=>{e.stopPropagation();$('doxa30MoreOverlay')?.classList.remove('on');setTimeout(openSheet,70)});
    paintRow();return true;
  }
  function overlay(){
    let o=$('contaOverlay');if(o)return o;
    o=document.createElement('div');o.id='contaOverlay';o.className='doxa30-overlay conta-overlay';
    o.innerHTML='<div class="doxa30-sheet conta-sheet"><div class="doxa30-grab"></div><div id="contaBody"></div></div>';
    document.body.appendChild(o);
    o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('on')});
    return o;
  }
  let view='entrar';
  function openSheet(){overlay().classList.add('on');render();if(uid())loadProfile().then(p=>{if(p){profile=p;render();paintRow()}}).catch(()=>{})}
  function render(){
    const body=$('contaBody');if(!body)return;
    if(!uid())return renderOut(body);
    const L=localState();const nHl=L.maps.hl.size,nNo=L.maps.nota.size,nPa=L.maps.pasta.size;
    const name=displayName(),email=(sess.user&&sess.user.email)||'';
    body.innerHTML='<div class="conta-head"><span class="conta-avatar">'+esc((name||email||'?').trim().charAt(0).toUpperCase())+'</span><div><h2>'+esc(name||'Sua conta')+'</h2><p>'+esc(email)+'</p></div></div>'
      +'<div class="conta-card" id="contaStatus"></div>'
      +'<div class="conta-stats"><div><b>'+nHl+'</b><span>grifos</span></div><div><b>'+nNo+'</b><span>notas</span></div><div><b>'+nPa+'</b><span>pastas</span></div></div>'
      +'<label class="conta-field"><span>Seu nome</span><input id="contaName" maxlength="60" value="'+esc(name)+'" autocomplete="name"></label>'
      +'<button class="conta-btn" id="contaSaveName" type="button">Salvar nome</button>'
      +'<button class="conta-btn primary" id="contaSyncNow" type="button">Sincronizar agora</button>'
      +'<button class="conta-btn" id="contaOut" type="button">Sair da conta</button>'
      +'<button class="conta-link danger" id="contaDelete" type="button">Excluir minha conta</button>'
      +'<p class="conta-fine">Grifos, notas, pastas, Pão Diário e preferências ficam guardados na sua conta e voltam em qualquer celular. Tudo continua sendo salvo primeiro neste aparelho. <a href="'+SITE+'privacidade.html" target="_blank" rel="noopener">Política de privacidade</a></p>';
    paintStatus();
    $('contaSyncNow').onclick=async()=>{const r=await sync({interactive:true});if(r)toast(r.pushed||r.pulled?'Sincronizado.':'Tudo em dia.');render()};
    $('contaSaveName').onclick=async()=>{const v=$('contaName').value.trim();if(!v){toast('Escreva seu nome.');return}try{await saveProfile(v);profile=Object.assign(profile||{},{display_name:v});toast('Nome salvo.');render();paintRow()}catch(e){toast(e.message)}};
    $('contaOut').onclick=async()=>{
      if(isDirty())await sync();
      await signOut();profile=null;toast('Você saiu da conta. Seus dados continuam neste celular.');render();paintRow();
    };
    $('contaDelete').onclick=()=>renderDelete(body);
  }
  function paintStatus(){
    const el=$('contaStatus');if(!el)return;
    const b=uid()?loadBase():null;
    el.className='conta-card st-'+status;
    el.innerHTML=status==='sync'?'<b>Sincronizando…</b>'
      :status==='err'?'<b>Não foi possível sincronizar</b><span>'+esc(lastErr)+' Seus dados estão seguros neste celular; tentamos de novo sozinhos.</span>'
      :'<b>'+(b&&b.last?'Sincronizado':'Ainda não sincronizado')+'</b><span>'+since(b&&b.last)+'</span>';
  }
  function renderOut(body){
    const isNew=view==='criar';
    body.innerHTML='<div class="conta-head"><span class="conta-avatar ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M5 19.5c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5"/></svg></span><div><h2>Conta Doxa</h2><p>Seus grifos, notas e Pão Diário em qualquer celular.</p></div></div>'
      +'<div class="conta-tabs"><button type="button" data-v="entrar" class="'+(isNew?'':'on')+'">Entrar</button><button type="button" data-v="criar" class="'+(isNew?'on':'')+'">Criar conta</button></div>'
      +(isNew?'<label class="conta-field"><span>Nome</span><input id="contaFName" maxlength="60" autocomplete="name"></label>':'')
      +'<label class="conta-field"><span>E-mail</span><input id="contaFEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off"></label>'
      +'<label class="conta-field"><span>Senha</span><input id="contaFPass" type="password" autocomplete="'+(isNew?'new-password':'current-password')+'" minlength="6"></label>'
      +'<p class="conta-msg" id="contaMsg"></p>'
      +'<button class="conta-btn primary" id="contaGo" type="button">'+(isNew?'Criar conta':'Entrar')+'</button>'
      +(isNew?'':'<button class="conta-link" id="contaForgot" type="button">Esqueci minha senha</button>')
      +'<p class="conta-fine">A Bíblia continua funcionando sem conta. Com a conta, o que você guardou neste celular é levado junto e volta sempre que você entrar. <a href="'+SITE+'privacidade.html" target="_blank" rel="noopener">Política de privacidade</a></p>';
    body.querySelectorAll('.conta-tabs button').forEach(b=>b.onclick=()=>{view=b.dataset.v;render()});
    const msg=t=>{const m=$('contaMsg');m.textContent=t||'';m.classList.toggle('on',!!t)};
    $('contaGo').onclick=async()=>{
      const email=$('contaFEmail').value.trim().toLowerCase(),pass=$('contaFPass').value,name=isNew?$('contaFName').value.trim():'';
      if(isNew&&!name)return msg('Escreva seu nome.');
      if(!/^\S+@\S+\.\S+$/.test(email))return msg('Escreva um e-mail válido.');
      if(pass.length<6)return msg('A senha precisa ter pelo menos 6 caracteres.');
      const btn=$('contaGo');btn.disabled=true;btn.textContent='Aguarde…';
      try{
        if(isNew){
          const r=await signUp(name,email,pass);
          if(!r.session){body.innerHTML='<div class="conta-done"><h2>Confirme seu e-mail</h2><p>Enviamos um link para <b>'+esc(email)+'</b>. Abra o e-mail, toque no link e depois volte aqui para entrar.</p><button class="conta-btn primary" id="contaBack" type="button">Voltar para entrar</button></div>';view='entrar';$('contaBack').onclick=()=>render();return}
        }else await signIn(email,pass);
        afterLogin();
      }catch(e){msg(e.message);btn.disabled=false;btn.textContent=isNew?'Criar conta':'Entrar'}
    };
    const f=$('contaForgot');if(f)f.onclick=async()=>{
      const email=$('contaFEmail').value.trim().toLowerCase();
      if(!/^\S+@\S+\.\S+$/.test(email))return msg('Escreva seu e-mail acima e toque de novo em "Esqueci minha senha".');
      try{await recover(email);msg('Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha.')}catch(e){msg(e.message)}
    };
  }
  async function afterLogin(){
    const L=localState();const n=L.maps.hl.size+L.maps.nota.size;
    render();paintRow();
    loadProfile().then(p=>{profile=p;render();paintRow()}).catch(()=>{});
    const r=await sync({interactive:true});
    if(r&&r.first&&n>0)toast('Encontramos '+L.maps.hl.size+' grifos e '+L.maps.nota.size+' notas neste celular. Agora estão guardados na sua conta.');
    else if(r)toast('Você entrou. Tudo sincronizado.');
    render();
  }
  function renderDelete(body){
    body.innerHTML='<div class="conta-done danger"><h2>Excluir a conta</h2><p>Isso apaga sua conta e tudo o que está guardado nela no servidor: perfil, grifos, notas, pastas e Pão Diário. <b>Não dá para desfazer.</b></p><p>O que está neste celular continua aqui.</p>'
      +'<label class="conta-field"><span>Para confirmar, escreva EXCLUIR</span><input id="contaDelWord" autocapitalize="characters"></label>'
      +'<p class="conta-msg" id="contaMsg"></p>'
      +'<button class="conta-btn dangerbtn" id="contaDelGo" type="button">Excluir minha conta</button><button class="conta-btn" id="contaDelCancel" type="button">Cancelar</button></div>';
    $('contaDelCancel').onclick=()=>render();
    $('contaDelGo').onclick=async()=>{
      if($('contaDelWord').value.trim().toUpperCase()!=='EXCLUIR'){const m=$('contaMsg');m.textContent='Escreva EXCLUIR para confirmar.';m.classList.add('on');return}
      try{await deleteAccount();profile=null;toast('Conta excluída.');render();paintRow()}catch(e){const m=$('contaMsg');m.textContent=e.message;m.classList.add('on')}
    };
  }
  function paintAll(){paintRow();if($('contaOverlay')?.classList.contains('on'))render()}

  // ---------------- quando sincronizar ----------------
  function boot(){
    // a linha da conta entra no menu "Mais" assim que ele existir
    if(!ensureRow()){const mo=new MutationObserver(()=>{if(ensureRow())mo.disconnect()});mo.observe(document.body,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),30000)}
    if(uid())setTimeout(()=>sync({boot:true}),1800);
    setInterval(()=>{if(uid()&&document.visibilityState==='visible'&&!syncing&&isDirty())sync()},30000);
    setInterval(()=>{if(uid()&&document.visibilityState==='visible'&&!syncing&&Date.now()-(loadBase().last||0)>5*60000)sync()},60000);
    document.addEventListener('visibilitychange',()=>{if(uid()&&document.visibilityState==='hidden'&&isDirty())sync();if(uid()&&document.visibilityState==='visible')setTimeout(()=>sync(),800)});
    setInterval(paintRow,60000);
  }
  boot();
  window.DoxaConta={sync,isDirty,signIn,signOut,open:openSheet,get user(){return sess&&sess.user||null}};
})();
