/* Adapter only: leaves the V29 source and its backup format unchanged. */
(() => {
  if (window.__doxaNativeFiles || !window.DoxaFiles) return;
  window.__doxaNativeFiles = true;
  const blobs = new Map();
  const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = blob => { const url = create(blob); blobs.set(url, blob); return url; };
  URL.revokeObjectURL = url => { blobs.delete(url); revoke(url); };
  let pending = null, busy = false;
  DoxaFiles.onmessage = event => {
    if (!pending) return;
    const callback = pending; pending = null;
    if (event.data === 'ok') callback.resolve();
    else callback.reject(new Error(String(event.data).replace(/^error:/, '')));
  };
  function send(payload) {
    return new Promise((resolve, reject) => {
      const timer = payload.action === 'end' ? null : setTimeout(() => { pending = null; reject(new Error('A exportação demorou demais. Tente novamente.')); }, 60000);
      pending = {
        resolve: () => { clearTimeout(timer); resolve(); },
        reject: e => { clearTimeout(timer); reject(e); }
      };
      DoxaFiles.postMessage(JSON.stringify(payload));
    });
  }
  async function save(anchor) {
    if (busy) { alert('Aguarde a exportação atual.'); return; }
    busy = true;
    const name = anchor.download || 'Doxa_Backup.json';
    const url = anchor.href;
    try {
      const blob = blobs.get(url) || await (await fetch(url)).blob();
      await send({action: 'begin', size: blob.size});
      for (let offset = 0; offset < blob.size; offset += 196608) {
        const bytes = new Uint8Array(await blob.slice(offset, offset + 196608).arrayBuffer());
        let binary = '';
        for (let start = 0; start < bytes.length; start += 8192)
          binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
        await send({action: 'chunk', data: btoa(binary)});
      }
      await send({action: 'end', name});
    } catch (error) {
      DoxaFiles.postMessage(JSON.stringify({action: 'abort'}));
      alert('Não foi possível exportar: ' + error.message);
    } finally { busy = false; }
  }
  /* Doxa 36: envia uma imagem gerada no leitor para o seletor de compartilhamento do Android. */
  window.DoxaNativeShare = async (blob, text, title) => {
    if (busy) throw new Error('Aguarde a operação atual.');
    busy = true;
    try {
      await send({action: 'begin', size: blob.size});
      for (let offset = 0; offset < blob.size; offset += 196608) {
        const bytes = new Uint8Array(await blob.slice(offset, offset + 196608).arrayBuffer());
        let binary = '';
        for (let start = 0; start < bytes.length; start += 8192)
          binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
        await send({action: 'chunk', data: btoa(binary)});
      }
      await send({action: 'share', mime: blob.type || 'image/jpeg', text: text || '', title: title || 'Compartilhar'});
    } catch (error) {
      DoxaFiles.postMessage(JSON.stringify({action: 'abort'}));
      throw error;
    } finally { busy = false; }
  };
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.href.startsWith('blob:')) { save(this); return; }
    return click.call(this);
  };
  document.addEventListener('click', event => {
    const anchor = event.target.closest && event.target.closest('a');
    if (anchor && anchor.href.startsWith('blob:')) {
      event.preventDefault(); event.stopImmediatePropagation(); save(anchor);
    }
  }, true);
})();

/* Doxa · Acampamento de Davi V3
   Quiz em camada própria, botão do Acampamento realmente removido durante o quiz
   e paleta sincronizada diretamente com as variáveis do tema ativo. */
(() => {
  if (window.__doxaDaviCampV3) return;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return;
  window.__doxaDaviCampV3 = true;

  /* Limpa a UI da implementação anterior caso este arquivo seja aplicado sem matar o WebView. */
  try {
    document.getElementById('doxaDaviCampStyle')?.remove();
    document.getElementById('daviCampOverlay')?.remove();
    document.getElementById('daviQuizOverlay')?.remove();
    document.querySelectorAll('[data-davi-camp],.davi-camp-heading').forEach(el => el.remove());
  } catch (_) {}

  const style = document.createElement('style');
  style.id = 'doxaDaviCampStyleV3';
  style.textContent = `
    .davi-camp-entry-v3{
      position:relative;overflow:hidden;width:100%;min-height:96px;
      display:grid!important;grid-template-columns:52px minmax(0,1fr) auto;
      align-items:center;gap:14px;padding:15px 16px!important;text-align:left!important;
      border-color:color-mix(in srgb,var(--d30-gold) 16%,transparent)!important;
      background:linear-gradient(135deg,color-mix(in srgb,var(--d30-gold) 7%,transparent),transparent 54%),
        color-mix(in srgb,var(--d30-panel) 92%,var(--d30-bg))!important;
      color:var(--d30-text)!important;
    }
    .davi-camp-entry-v3::after{content:'';position:absolute;right:-34px;top:-42px;width:130px;height:130px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--d30-gold) 14%,transparent),transparent 67%);pointer-events:none}
    .davi-camp-mark-v3{width:52px;height:52px;border-radius:17px;display:grid;place-items:center;position:relative;z-index:1;border:1px solid color-mix(in srgb,var(--d30-gold) 28%,transparent);background:color-mix(in srgb,var(--d30-gold) 10%,var(--d30-panel));color:var(--d30-gold);font:700 23px/1 Georgia,'Times New Roman',serif;box-shadow:inset 0 1px color-mix(in srgb,var(--d30-text) 5%,transparent)}
    .davi-camp-entry-copy-v3{min-width:0;display:grid;gap:5px;position:relative;z-index:1}
    .davi-camp-entry-copy-v3 strong{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:var(--d30-text);font:600 18px/1.12 Georgia,'Times New Roman',serif}
    .davi-camp-beta-v3{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:999px;border:1px solid color-mix(in srgb,var(--d30-gold) 30%,transparent);background:color-mix(in srgb,var(--d30-gold) 9%,transparent);color:var(--d30-gold);font:800 8px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
    .davi-camp-entry-copy-v3 small{color:var(--d30-muted);font:400 12.5px/1.35 system-ui,sans-serif}
    .davi-camp-entry-v3>i{position:relative;z-index:1;color:var(--d30-gold);font:300 28px/1 Georgia,serif;font-style:normal}

    .davi-camp-overlay-v3,
    .davi-quiz-overlay-v3{
      --dv-bg:#050403;--dv-bg2:#0a0705;--dv-panel:#0d0a07;--dv-text:#f4efe9;--dv-muted:#a99b8b;--dv-accent:#d9a25e;--dv-accent2:#f1c989;
      position:fixed;inset:0;display:none;box-sizing:border-box;
    }
    .davi-camp-overlay-v3{z-index:2147483600;align-items:stretch;justify-content:center;background:color-mix(in srgb,var(--dv-text) 18%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
    .davi-camp-overlay-v3.on{display:flex}
    .davi-camp-panel-v3{position:relative;width:min(100%,560px);height:100%;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;padding:82px 24px 34px;color:var(--dv-text);background:radial-gradient(circle at 50% 39%,color-mix(in srgb,var(--dv-accent) 9%,transparent),transparent 30%),linear-gradient(180deg,color-mix(in srgb,var(--dv-panel) 94%,var(--dv-accent) 6%) 0%,var(--dv-bg) 72%)}
    .davi-camp-close-v3{position:absolute;top:20px;left:18px;width:44px;height:44px;border:1px solid color-mix(in srgb,var(--dv-accent) 22%,transparent);border-radius:15px;background:color-mix(in srgb,var(--dv-text) 4%,transparent);color:var(--dv-text);font:300 30px/38px Georgia,serif}
    .davi-camp-kicker-v3{margin:0 0 5px;color:var(--dv-accent);font:700 11px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase}
    .davi-camp-title-v3{margin:0;color:var(--dv-text);font:600 30px/1.05 Georgia,'Times New Roman',serif;text-align:center}
    .davi-camp-sub-v3{max-width:330px;margin:8px 0 0;color:var(--dv-muted);font:400 13px/1.45 system-ui,sans-serif;text-align:center}
    .davi-camp-idle-wrap-v3{position:relative;width:min(72vw,270px);height:clamp(290px,43vh,385px);margin:24px 0 18px;overflow:hidden;flex:0 0 auto;display:flex;align-items:flex-end;justify-content:center;contain:paint;isolation:isolate}
    .davi-camp-idle-v3{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;background:transparent;pointer-events:none;filter:drop-shadow(0 18px 20px rgba(0,0,0,.22))}
    .davi-camp-play-v3{flex:0 0 auto;width:min(100%,360px);height:58px;border:0;border-radius:18px;padding:0 22px;background:linear-gradient(180deg,var(--dv-accent2),var(--dv-accent));color:var(--dv-bg);font:700 16px/1 system-ui,sans-serif;box-shadow:0 14px 34px color-mix(in srgb,var(--dv-text) 12%,transparent),inset 0 1px color-mix(in srgb,#fff 24%,transparent)}
    .davi-camp-note-v3{margin:12px 0 0;color:var(--dv-muted);font:500 11px/1.3 system-ui,sans-serif;text-align:center}

    /* O quiz não mora mais dentro do painel do Acampamento. É uma tela própria. */
    .davi-quiz-overlay-v3{z-index:2147483646;overflow:auto;background:var(--dv-bg);color:var(--dv-text);padding:72px 20px max(34px,env(safe-area-inset-bottom));overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
    .davi-quiz-overlay-v3.on{display:block}
    .davi-quiz-overlay-v3::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(circle at 50% -8%,color-mix(in srgb,var(--dv-accent) 10%,transparent),transparent 36%),linear-gradient(180deg,var(--dv-bg),var(--dv-bg2))}
    .davi-quiz-back-v3{position:fixed;z-index:2;top:20px;left:18px;width:44px;height:44px;border:1px solid color-mix(in srgb,var(--dv-accent) 22%,transparent);border-radius:15px;background:color-mix(in srgb,var(--dv-panel) 88%,transparent);color:var(--dv-text);font:300 30px/38px Georgia,serif}
    .davi-quiz-shell-v3{width:min(100%,430px);margin:0 auto}
    .davi-quiz-eyebrow-v3{margin:0 0 7px;color:var(--dv-accent);font:800 10px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase}
    .davi-quiz-head-v3{margin:0;color:var(--dv-text);font:600 27px/1.08 Georgia,'Times New Roman',serif}
    .davi-quiz-meta-v3{margin:8px 0 22px;color:var(--dv-muted);font:500 12px/1.4 system-ui,sans-serif}
    .davi-quiz-progress-v3{height:5px;margin:0 0 22px;border-radius:99px;overflow:hidden;background:color-mix(in srgb,var(--dv-text) 9%,transparent)}
    .davi-quiz-progress-v3>i{display:block;height:100%;width:0;border-radius:99px;background:var(--dv-accent);transition:width .22s ease}
    .davi-quiz-question-v3{margin:0 0 18px;color:var(--dv-text);font:500 23px/1.18 Georgia,'Times New Roman',serif}
    .davi-quiz-options-v3{display:grid;gap:10px}
    .davi-quiz-option-v3{width:100%;min-height:54px;padding:12px 15px;border:1px solid color-mix(in srgb,var(--dv-accent) 18%,transparent);border-radius:16px;background:color-mix(in srgb,var(--dv-panel) 90%,var(--dv-bg));color:var(--dv-text);text-align:left;font:600 14px/1.25 system-ui,sans-serif}
    .davi-quiz-option-v3.on{border-color:var(--dv-accent);background:color-mix(in srgb,var(--dv-accent) 15%,var(--dv-panel));box-shadow:0 0 0 1px color-mix(in srgb,var(--dv-accent) 12%,transparent)}
    .davi-quiz-next-v3{width:100%;height:56px;margin-top:18px;border:0;border-radius:17px;background:linear-gradient(180deg,var(--dv-accent2),var(--dv-accent));color:var(--dv-bg);font:800 15px/1 system-ui,sans-serif}
    .davi-quiz-next-v3:disabled{opacity:.35}
    .davi-quiz-center-v3{min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
    .davi-quiz-score-v3{font:600 64px/.95 Georgia,'Times New Roman',serif;color:var(--dv-text)}
    .davi-quiz-xp-v3{margin-top:18px;padding:14px 18px;border:1px solid color-mix(in srgb,var(--dv-accent) 24%,transparent);border-radius:18px;background:color-mix(in srgb,var(--dv-accent) 10%,var(--dv-panel));color:var(--dv-accent2);font:800 18px/1 system-ui,sans-serif}
    .davi-quiz-copy-v3{max-width:330px;margin:12px auto 0;color:var(--dv-muted);font:400 13px/1.45 system-ui,sans-serif}
    .davi-quiz-error-v3{padding:16px;border:1px solid color-mix(in srgb,var(--dv-accent) 18%,transparent);border-radius:16px;background:color-mix(in srgb,var(--dv-panel) 90%,var(--dv-bg));color:var(--dv-muted);font:500 13px/1.45 system-ui,sans-serif}

    @media(max-height:700px){.davi-camp-panel-v3{padding-top:66px;padding-bottom:24px}.davi-camp-idle-wrap-v3{width:min(64vw,235px);height:clamp(235px,38vh,300px);margin:14px 0 12px}.davi-camp-title-v3{font-size:27px}.davi-camp-sub-v3{margin-top:6px}.davi-camp-play-v3{height:54px}}
    @media(max-height:590px){.davi-camp-panel-v3{padding-top:60px}.davi-camp-idle-wrap-v3{height:220px;margin:10px 0}.davi-camp-kicker-v3{display:none}.davi-camp-sub-v3{font-size:12px}}
  `;
  document.head.appendChild(style);

  const SB='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const APIKEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let quiz=null,quizIndex=0,quizAnswers=[];
  let returnToCamp=false;

  function readThemeVar(name,fallback){
    const sources=[document.documentElement,document.body,document.getElementById('doxaBreadSheet'),document.getElementById('dbsBody'),document.querySelector('.doxa30-bottom'),document.getElementById('singleReader')].filter(Boolean);
    for(const el of sources){
      try{const v=getComputedStyle(el).getPropertyValue(name).trim();if(v)return v}catch(_){}
    }
    return fallback;
  }
  function syncTheme(el){
    if(!el)return;
    const htmlStyle=getComputedStyle(document.documentElement);
    const bodyStyle=document.body?getComputedStyle(document.body):htmlStyle;
    const htmlBg=htmlStyle.backgroundColor && htmlStyle.backgroundColor!=='rgba(0, 0, 0, 0)' ? htmlStyle.backgroundColor : '#050403';
    const bodyColor=bodyStyle.color && bodyStyle.color!=='rgba(0, 0, 0, 0)' ? bodyStyle.color : '#f4efe9';
    const vals={
      '--dv-bg':readThemeVar('--d30-bg',htmlBg),
      '--dv-bg2':readThemeVar('--d30-bg2',htmlBg),
      '--dv-panel':readThemeVar('--d30-panel',readThemeVar('--normal-chrome',htmlBg)),
      '--dv-text':readThemeVar('--d30-text',readThemeVar('--ink',bodyColor)),
      '--dv-muted':readThemeVar('--d30-muted',readThemeVar('--ink-faint',bodyColor)),
      '--dv-accent':readThemeVar('--d30-gold',readThemeVar('--accent','#d9a25e')),
      '--dv-accent2':readThemeVar('--d30-gold2',readThemeVar('--accent','#f1c989'))
    };
    for(const [k,v] of Object.entries(vals))el.style.setProperty(k,v);
    const theme=document.body?.dataset?.doxa30Theme||'';
    if(theme)el.dataset.doxa30Theme=theme;
  }
  function syncAllTheme(){syncTheme(document.getElementById('daviCampOverlayV3'));syncTheme(document.getElementById('daviQuizOverlayV3'))}
  window.addEventListener('doxa:themechange',()=>requestAnimationFrame(syncAllTheme));
  const themeObserver=new MutationObserver(()=>requestAnimationFrame(syncAllTheme));
  try{themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});if(document.body)themeObserver.observe(document.body,{attributes:true,attributeFilter:['style','class','data-doxa30-theme']})}catch(_){}

  function ensureCamp(){
    let overlay=document.getElementById('daviCampOverlayV3');
    if(overlay)return overlay;
    overlay=document.createElement('section');overlay.id='daviCampOverlayV3';overlay.className='davi-camp-overlay-v3';overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<div class="davi-camp-panel-v3" role="dialog" aria-modal="true" aria-label="Acampamento de Davi">'
      +'<button type="button" class="davi-camp-close-v3" data-davi-camp-close-v3 aria-label="Voltar">‹</button>'
      +'<p class="davi-camp-kicker-v3">PÃO DIÁRIO</p><h2 class="davi-camp-title-v3">Acampamento de Davi</h2>'
      +'<p class="davi-camp-sub-v3">Um pequeno espaço para testar seus conhecimentos bíblicos com Davi.</p>'
      +'<div class="davi-camp-idle-wrap-v3"><video class="davi-camp-idle-v3" muted autoplay loop playsinline preload="auto" disablepictureinpicture src="assets/davi_idle.webm"></video></div>'
      +'<button type="button" class="davi-camp-play-v3" data-davi-camp-play-v3>Jogar Quiz Bíblico</button>'
      +'<p class="davi-camp-note-v3">Online · requer Conta Doxa · XP do Acampamento</p></div>';
    document.body.appendChild(overlay);syncTheme(overlay);
    const video=overlay.querySelector('video');if(video){video.defaultMuted=true;video.setAttribute('webkit-playsinline','');video.addEventListener('error',()=>{const img=document.createElement('img');img.className='davi-camp-idle-v3';img.src='assets/davi_mascote.png';img.alt='Davi';video.replaceWith(img)},{once:true})}
    return overlay;
  }
  function ensureQuiz(){
    let overlay=document.getElementById('daviQuizOverlayV3');
    if(overlay)return overlay;
    overlay=document.createElement('section');overlay.id='daviQuizOverlayV3';overlay.className='davi-quiz-overlay-v3';overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<button type="button" class="davi-quiz-back-v3" data-davi-quiz-back-v3 aria-label="Voltar">‹</button><div class="davi-quiz-shell-v3" data-davi-quiz-shell-v3></div>';
    document.body.appendChild(overlay);syncTheme(overlay);return overlay;
  }
  function openCamp(){const o=ensureCamp();syncTheme(o);o.classList.add('on');o.setAttribute('aria-hidden','false');const v=o.querySelector('video');if(v)v.play().catch(()=>{})}
  function closeCamp(){closeQuiz(false);const o=document.getElementById('daviCampOverlayV3');if(!o)return;o.classList.remove('on');o.setAttribute('aria-hidden','true');o.style.display='';const v=o.querySelector('video');if(v){try{v.pause()}catch(_){}}}

  function quizShell(){return document.querySelector('[data-davi-quiz-shell-v3]')}
  function hideCampForQuiz(){const c=document.getElementById('daviCampOverlayV3');if(c){returnToCamp=c.classList.contains('on');c.classList.remove('on');c.setAttribute('aria-hidden','true');c.style.display='none'}}
  function restoreCampAfterQuiz(){const c=document.getElementById('daviCampOverlayV3');if(c){c.style.display='';if(returnToCamp){syncTheme(c);c.classList.add('on');c.setAttribute('aria-hidden','false')}}returnToCamp=false}
  function closeQuiz(restore=true){const q=document.getElementById('daviQuizOverlayV3');if(q){q.classList.remove('on');q.setAttribute('aria-hidden','true')}if(restore)restoreCampAfterQuiz()}

  function decorateBreadSheet(){
    const body=document.getElementById('dbsBody');if(!body||body.querySelector('[data-davi-camp-v3]'))return;
    body.querySelectorAll('[data-davi-camp],.davi-camp-heading').forEach(el=>el.remove());
    const history=[...body.querySelectorAll('h3')].find(h=>h.textContent.trim()==='Histórico');if(!history)return;
    const heading=document.createElement('h3');heading.className='davi-camp-heading-v3';heading.textContent='Davi';
    const card=document.createElement('button');card.type='button';card.className='dbs-card davi-camp-entry-v3';card.setAttribute('data-davi-camp-v3','');
    card.innerHTML='<span class="davi-camp-mark-v3">D</span><span class="davi-camp-entry-copy-v3"><strong>Acampamento de Davi <em class="davi-camp-beta-v3">Em construção</em></strong><small>Entre para jogar o Quiz Bíblico.</small></span><i>›</i>';
    body.insertBefore(heading,history);body.insertBefore(card,history);
  }
  const uiObserver=new MutationObserver(()=>requestAnimationFrame(decorateBreadSheet));
  uiObserver.observe(document.documentElement,{subtree:true,childList:true});

  async function quizApi(name,body={}){
    if(!navigator.onLine)throw new Error('O Quiz Bíblico funciona somente online.');
    if(!window.DoxaConta?.user){const e=new Error('Entre na sua Conta Doxa para jogar e receber XP.');e.login=true;throw e}
    const token=await window.DoxaConta.token();if(!token){const e=new Error('Sua sessão expirou. Entre novamente na Conta Doxa.');e.login=true;throw e}
    let r;try{r=await fetch(SB+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:APIKEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'})}catch(_){throw new Error('Sem conexão com a internet.')}
    const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(_){}
    if(!r.ok){const raw=(j&&(j.message||j.details||j.hint))||'';if(/authentication/i.test(raw))throw new Error('Entre novamente na sua Conta Doxa.');if(/round is not current/i.test(raw))throw new Error('Este round não está mais disponível. Abra o quiz novamente.');if(/answer count mismatch|invalid answer/i.test(raw))throw new Error('As respostas não puderam ser validadas. Abra o quiz novamente.');throw new Error(name==='davi_quiz_submit'?'Não foi possível concluir o quiz agora.':'Não foi possível carregar o quiz agora.')}
    return j;
  }
  function renderQuestion(){
    const shell=quizShell();if(!shell||!quiz?.questions?.length)return;const q=quiz.questions[quizIndex],sel=quizAnswers[quizIndex];
    shell.innerHTML='<p class="davi-quiz-eyebrow-v3">'+esc(quiz.title||'Quiz Bíblico')+'</p><h3 class="davi-quiz-head-v3">Pergunta '+(quizIndex+1)+' de '+quiz.questions.length+'</h3>'
      +'<p class="davi-quiz-meta-v3">Complete o round para ganhar +'+Number(quiz.xp_complete||100)+' XP'+(Number(quiz.xp_perfect_bonus||0)?' · perfeito: +'+Number(quiz.xp_perfect_bonus)+' XP extra':'')+'</p>'
      +'<div class="davi-quiz-progress-v3"><i style="width:'+(((quizIndex+1)/quiz.questions.length)*100)+'%"></i></div><p class="davi-quiz-question-v3">'+esc(q.question)+'</p>'
      +'<div class="davi-quiz-options-v3">'+q.options.map((o,i)=>'<button type="button" class="davi-quiz-option-v3'+(sel===i?' on':'')+'" data-davi-answer-v3="'+i+'">'+esc(o)+'</button>').join('')+'</div>'
      +'<button type="button" class="davi-quiz-next-v3" data-davi-next-v3 '+(sel==null?'disabled':'')+'>'+(quizIndex===quiz.questions.length-1?'Finalizar quiz':'Continuar')+'</button>';
  }
  function renderResult(r,existing=false){
    const shell=quizShell();if(!shell)return;const perfect=Number(r.score)===Number(r.total);
    shell.innerHTML='<div class="davi-quiz-center-v3"><p class="davi-quiz-eyebrow-v3">'+(existing?'ROUND CONCLUÍDO':'RESULTADO')+'</p><div class="davi-quiz-score-v3">'+Number(r.score||0)+'/'+Number(r.total||0)+'</div>'
      +'<p class="davi-quiz-copy-v3">'+(perfect?'Perfeito. Você acertou todas.':'Round concluído. Seu próximo round fica disponível na sequência do Acampamento.')+'</p>'
      +(existing?'':'<div class="davi-quiz-xp-v3">+'+Number(r.xp_awarded||0)+' XP</div>')+'<p class="davi-quiz-copy-v3">XP total do Acampamento: <b>'+Number(r.xp_total||0)+'</b></p>'
      +'<button type="button" class="davi-quiz-next-v3" data-davi-quiz-back-v3>Voltar ao Acampamento</button></div>';
  }
  async function openQuiz(){
    const q=ensureQuiz(),shell=quizShell();if(!q||!shell)return;syncTheme(q);hideCampForQuiz();q.classList.add('on');q.setAttribute('aria-hidden','false');q.scrollTop=0;
    shell.innerHTML='<div class="davi-quiz-center-v3"><p class="davi-quiz-eyebrow-v3">ACAMPAMENTO DE DAVI</p><h3 class="davi-quiz-head-v3">Carregando quiz…</h3></div>';
    try{const data=await quizApi('davi_quiz_current',{});if(!data?.available){shell.innerHTML='<div class="davi-quiz-center-v3"><h3 class="davi-quiz-head-v3">Nenhum round disponível</h3><p class="davi-quiz-copy-v3">Você concluiu todos os rounds publicados até agora.</p><button type="button" class="davi-quiz-next-v3" data-davi-quiz-back-v3>Voltar</button></div>';return}quiz=data;quizIndex=0;quizAnswers=new Array(data.questions.length);renderQuestion()}
    catch(e){shell.innerHTML='<div class="davi-quiz-center-v3"><div class="davi-quiz-error-v3">'+esc(e.message)+'</div><button type="button" class="davi-quiz-next-v3" data-davi-quiz-back-v3>Voltar</button></div>';if(e.login&&window.DoxaConta?.open)setTimeout(()=>{closeQuiz(false);closeCamp();window.DoxaConta.open()},450)}
  }
  async function submitQuiz(){
    const shell=quizShell();if(!shell||!quiz)return;shell.innerHTML='<div class="davi-quiz-center-v3"><p class="davi-quiz-eyebrow-v3">QUIZ BÍBLICO</p><h3 class="davi-quiz-head-v3">Conferindo respostas…</h3></div>';
    try{const r=await quizApi('davi_quiz_submit',{p_round_id:quiz.round_id,p_answers:quizAnswers});renderResult(r,!!r.already_completed)}
    catch(e){shell.innerHTML='<div class="davi-quiz-center-v3"><div class="davi-quiz-error-v3">'+esc(e.message)+'</div><button type="button" class="davi-quiz-next-v3" data-davi-retry-v3>Tentar novamente</button><button type="button" class="davi-quiz-next-v3" data-davi-quiz-back-v3>Voltar</button></div>'}
  }

  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-davi-camp-v3]')){event.preventDefault();event.stopImmediatePropagation();openCamp();return}
    if(event.target.closest?.('[data-davi-camp-close-v3]')){event.preventDefault();event.stopImmediatePropagation();closeCamp();return}
    if(event.target.closest?.('[data-davi-camp-play-v3]')){event.preventDefault();event.stopImmediatePropagation();openQuiz();return}
    if(event.target.closest?.('[data-davi-quiz-back-v3]')){event.preventDefault();event.stopImmediatePropagation();closeQuiz(true);return}
    const a=event.target.closest?.('[data-davi-answer-v3]');if(a){event.preventDefault();event.stopImmediatePropagation();quizAnswers[quizIndex]=Number(a.dataset.daviAnswerV3);renderQuestion();return}
    if(event.target.closest?.('[data-davi-next-v3]')){event.preventDefault();event.stopImmediatePropagation();if(quizAnswers[quizIndex]==null)return;if(quizIndex<quiz.questions.length-1){quizIndex++;renderQuestion()}else submitQuiz();return}
    if(event.target.closest?.('[data-davi-retry-v3]')){event.preventDefault();event.stopImmediatePropagation();submitQuiz();return}
  },true);
  document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(document.getElementById('daviQuizOverlayV3')?.classList.contains('on'))closeQuiz(true);else if(document.getElementById('daviCampOverlayV3')?.classList.contains('on'))closeCamp()});

  decorateBreadSheet();
})();
