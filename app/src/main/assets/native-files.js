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

/* Doxa · Acampamento de Davi
   Mantém a Home/Pão Diário originais e adiciona o Acampamento em construção
   após os planos de leitura. O Quiz Bíblico é online, usa Conta Doxa e XP no Supabase. */
(() => {
  if (window.__doxaDaviCamp) return;
  if (typeof document === 'undefined'
      || typeof document.createElement !== 'function'
      || typeof document.querySelectorAll !== 'function'
      || typeof MutationObserver !== 'function'
      || typeof requestAnimationFrame !== 'function') return;
  window.__doxaDaviCamp = true;

  const style = document.createElement('style');
  style.id = 'doxaDaviCampStyle';
  style.textContent = `
    .davi-camp-entry{
      position:relative;overflow:hidden;width:100%;min-height:96px;
      display:grid!important;grid-template-columns:52px minmax(0,1fr) auto;
      align-items:center;gap:14px;padding:15px 16px!important;text-align:left!important;
    }
    .davi-camp-entry::after{
      content:'';position:absolute;right:-34px;top:-42px;width:130px;height:130px;border-radius:50%;
      background:radial-gradient(circle,color-mix(in srgb,var(--d30-gold,#d7a55b) 14%,transparent),transparent 67%);
      pointer-events:none;
    }
    .davi-camp-mark{
      width:52px;height:52px;border-radius:17px;display:grid;place-items:center;
      border:1px solid color-mix(in srgb,var(--d30-gold,#d7a55b) 26%,transparent);
      background:color-mix(in srgb,var(--d30-gold,#d7a55b) 8%,var(--d30-panel,#18130f));
      color:var(--d30-gold,#d7a55b);font:500 25px/1 Georgia,'Times New Roman',serif;
    }
    .davi-camp-entry-copy{min-width:0;display:grid;gap:5px;position:relative;z-index:1}
    .davi-camp-entry-copy strong{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:var(--d30-text,#f4eadb);font:600 18px/1.12 Georgia,'Times New Roman',serif}
    .davi-camp-beta{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:999px;border:1px solid color-mix(in srgb,var(--d30-gold,#d7a55b) 30%,transparent);background:color-mix(in srgb,var(--d30-gold,#d7a55b) 9%,transparent);color:var(--d30-gold,#d7a55b);font:800 8px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
    .davi-camp-entry-copy small{color:var(--d30-muted,#b8a891);font:400 12.5px/1.35 system-ui,sans-serif}
    .davi-camp-entry>i{position:relative;z-index:1;color:var(--d30-gold,#d7a55b);font:300 28px/1 Georgia,serif;font-style:normal}
    .davi-camp-entry:active{transform:scale(.993)}

    .davi-camp-overlay{
      position:fixed;inset:0;z-index:2147483000;display:none;align-items:stretch;justify-content:center;
      background:rgba(4,3,2,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    }
    .davi-camp-overlay.on{display:flex}
    .davi-camp-panel{
      position:relative;width:min(100%,560px);height:100%;min-height:100%;overflow:hidden;box-sizing:border-box;
      display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
      padding:82px 24px 34px;color:var(--d30-text,#f4eadb);
      background:
        radial-gradient(circle at 50% 39%,rgba(216,165,91,.09),transparent 30%),
        linear-gradient(180deg,#15100c 0%,#0c0907 72%);
    }
    .davi-camp-close{
      position:absolute;top:20px;left:18px;width:44px;height:44px;border:1px solid rgba(217,165,91,.22);
      border-radius:15px;background:rgba(255,255,255,.035);color:#ead8bc;font:300 30px/38px Georgia,serif;
    }
    .davi-camp-kicker{margin:0 0 5px;color:#d9a55b;font:700 11px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase}
    .davi-camp-title{margin:0;color:#f4eadb;font:600 30px/1.05 Georgia,'Times New Roman',serif;text-align:center}
    .davi-camp-sub{max-width:330px;margin:8px 0 0;color:#b7a58d;font:400 13px/1.45 system-ui,sans-serif;text-align:center}
    .davi-camp-idle-wrap{
      position:relative;z-index:1;width:min(72vw,270px);height:clamp(290px,43vh,385px);
      margin:24px 0 18px;overflow:hidden;flex:0 0 auto;
      display:flex;align-items:flex-end;justify-content:center;
      contain:paint;isolation:isolate;
    }
    .davi-camp-idle{
      display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;background:transparent;
      pointer-events:none;position:relative;z-index:1;
      filter:drop-shadow(0 18px 20px rgba(0,0,0,.32));
    }
    .davi-camp-play{
      position:relative;z-index:20;flex:0 0 auto;width:min(100%,360px);height:58px;border:0;border-radius:18px;padding:0 22px;
      background:linear-gradient(180deg,#e2b46f,#c98d3f);color:#2b1c0e;
      font:700 16px/1 system-ui,sans-serif;box-shadow:0 14px 34px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.24);
    }
    .davi-camp-play:active{transform:scale(.985)}
    .davi-camp-note{position:relative;z-index:20;flex:0 0 auto;margin:12px 0 0;color:#806f5d;font:500 11px/1.3 system-ui,sans-serif;text-align:center}
    .davi-quiz-view{position:absolute;inset:0;z-index:5;display:none;overflow:auto;padding:72px 20px 34px;background:linear-gradient(180deg,#15100c,#0c0907 72%);color:#f4eadb}
    .davi-quiz-view.on{display:block}
    .davi-quiz-back{position:absolute;top:20px;left:18px;width:44px;height:44px;border:1px solid rgba(217,165,91,.22);border-radius:15px;background:rgba(255,255,255,.035);color:#ead8bc;font:300 30px/38px Georgia,serif}
    .davi-quiz-shell{width:min(100%,430px);margin:0 auto}
    .davi-quiz-eyebrow{margin:0 0 7px;color:#d9a55b;font:800 10px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase}
    .davi-quiz-head{margin:0;color:#f4eadb;font:600 27px/1.08 Georgia,'Times New Roman',serif}
    .davi-quiz-meta{margin:8px 0 22px;color:#96836e;font:500 12px/1.4 system-ui,sans-serif}
    .davi-quiz-progress{height:5px;margin:0 0 22px;border-radius:99px;overflow:hidden;background:rgba(255,255,255,.07)}
    .davi-quiz-progress>i{display:block;height:100%;width:0;border-radius:99px;background:#d9a55b;transition:width .22s ease}
    .davi-quiz-question{margin:0 0 18px;color:#f4eadb;font:500 23px/1.18 Georgia,'Times New Roman',serif}
    .davi-quiz-options{display:grid;gap:10px}
    .davi-quiz-option{width:100%;min-height:54px;padding:12px 15px;border:1px solid rgba(217,165,91,.18);border-radius:16px;background:#19130f;color:#e9dcc8;text-align:left;font:600 14px/1.25 system-ui,sans-serif}
    .davi-quiz-option.on{border-color:#d9a55b;background:rgba(217,165,91,.12);box-shadow:0 0 0 1px rgba(217,165,91,.12)}
    .davi-quiz-next{width:100%;height:56px;margin-top:18px;border:0;border-radius:17px;background:linear-gradient(180deg,#e2b46f,#c98d3f);color:#2b1c0e;font:800 15px/1 system-ui,sans-serif}
    .davi-quiz-next:disabled{opacity:.35}
    .davi-quiz-center{min-height:66vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
    .davi-quiz-score{font:600 64px/.95 Georgia,'Times New Roman',serif;color:#f4eadb}
    .davi-quiz-xp{margin-top:18px;padding:14px 18px;border:1px solid rgba(217,165,91,.24);border-radius:18px;background:rgba(217,165,91,.08);color:#e4b774;font:800 18px/1 system-ui,sans-serif}
    .davi-quiz-copy{max-width:330px;margin:12px auto 0;color:#a9957c;font:400 13px/1.45 system-ui,sans-serif}
    .davi-quiz-error{padding:16px;border:1px solid rgba(217,165,91,.18);border-radius:16px;background:#19130f;color:#c6b49d;font:500 13px/1.45 system-ui,sans-serif}
    @media(max-height:700px){
      .davi-camp-panel{padding-top:66px;padding-bottom:24px}
      .davi-camp-idle-wrap{width:min(64vw,235px);height:clamp(235px,38vh,300px);margin:14px 0 12px}
      .davi-camp-title{font-size:27px}.davi-camp-sub{margin-top:6px}.davi-camp-play{height:54px}
    }
    @media(max-height:590px){
      .davi-camp-panel{padding-top:60px}.davi-camp-idle-wrap{height:220px;margin:10px 0}.davi-camp-kicker{display:none}.davi-camp-sub{font-size:12px}
    }
  `;
  document.head.appendChild(style);

  function ensureOverlay(){
    let overlay = document.getElementById('daviCampOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('section');
    overlay.id = 'daviCampOverlay';
    overlay.className = 'davi-camp-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = '<div class="davi-camp-panel" role="dialog" aria-modal="true" aria-label="Acampamento de Davi">'
      +'<button type="button" class="davi-camp-close" data-davi-camp-close aria-label="Voltar">‹</button>'
      +'<p class="davi-camp-kicker">PÃO DIÁRIO</p>'
      +'<h2 class="davi-camp-title">Acampamento de Davi</h2>'
      +'<p class="davi-camp-sub">Um pequeno espaço para testar seus conhecimentos bíblicos com Davi.</p>'
      +'<div class="davi-camp-idle-wrap"><video class="davi-camp-idle" muted autoplay loop playsinline preload="auto" disablepictureinpicture src="assets/davi_idle.webm"></video></div>'
      +'<button type="button" class="davi-camp-play" data-davi-camp-play>Jogar Quiz Bíblico</button>'
      +'<p class="davi-camp-note">Online · requer Conta Doxa · XP do Acampamento</p>'
      +'<section class="davi-quiz-view" data-davi-quiz-view aria-hidden="true"><button type="button" class="davi-quiz-back" data-davi-quiz-back aria-label="Voltar">‹</button><div class="davi-quiz-shell" data-davi-quiz-shell></div></section>'
      +'</div>';
    document.body.appendChild(overlay);
    const video = overlay.querySelector('video');
    video.defaultMuted = true;
    video.setAttribute('webkit-playsinline','');
    video.addEventListener('error', () => {
      const img = document.createElement('img');
      img.className = 'davi-camp-idle';
      img.src = 'assets/davi_mascote.png';
      img.alt = 'Davi';
      video.replaceWith(img);
    }, {once:true});
    return overlay;
  }

  function openCamp(){
    const overlay = ensureOverlay();
    overlay.classList.add('on');
    overlay.setAttribute('aria-hidden','false');
    const video = overlay.querySelector('video');
    if (video) video.play().catch(()=>{});
  }
  function closeCamp(){
    closeQuiz();
    const overlay = document.getElementById('daviCampOverlay');
    if (!overlay) return;
    overlay.classList.remove('on');
    overlay.setAttribute('aria-hidden','true');
    const video = overlay.querySelector('video');
    if (video) { try { video.pause(); } catch (_) {} }
  }

  function decorateBreadSheet(){
    const body = document.getElementById('dbsBody');
    if (!body || body.querySelector('[data-davi-camp]')) return;
    const history = [...body.querySelectorAll('h3')].find(h => h.textContent.trim() === 'Histórico');
    if (!history) return;

    const heading = document.createElement('h3');
    heading.className = 'davi-camp-heading';
    heading.textContent = 'Davi';

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'dbs-card davi-camp-entry';
    card.setAttribute('data-davi-camp','');
    card.innerHTML = '<span class="davi-camp-mark">D</span>'
      +'<span class="davi-camp-entry-copy"><strong>Acampamento de Davi <em class="davi-camp-beta">Em construção</em></strong><small>Entre para jogar o Quiz Bíblico.</small></span>'
      +'<i>›</i>';

    body.insertBefore(heading, history);
    body.insertBefore(card, history);
  }

  function decorate(){ decorateBreadSheet(); }
  const observer = new MutationObserver(() => requestAnimationFrame(decorate));
  observer.observe(document.documentElement, {subtree:true, childList:true});

  const SB='https://fxruwzaaiecqsxkuxmsp.supabase.co';
  const APIKEY='sb_publishable_aDmA8htcNCaC0IfGLpT5Hg_lx7IOceG';
  let quiz=null,quizIndex=0,quizAnswers=[];

  async function quizApi(name,body={}){
    if(!navigator.onLine)throw new Error('O Quiz Bíblico funciona somente online.');
    if(!window.DoxaConta?.user){const e=new Error('Entre na sua Conta Doxa para jogar e receber XP.');e.login=true;throw e}
    const token=await window.DoxaConta.token();
    if(!token){const e=new Error('Sua sessão expirou. Entre novamente na Conta Doxa.');e.login=true;throw e}
    let r;
    try{r=await fetch(SB+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:APIKEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'})}
    catch(e){throw new Error('Sem conexão com a internet.')}
    const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}
    if(!r.ok){const raw=(j&&(j.message||j.details||j.hint))||'';throw new Error(raw.includes('authentication')?'Entre novamente na sua Conta Doxa.':'Não foi possível carregar o quiz agora.')}
    return j;
  }
  function quizView(){return document.querySelector('[data-davi-quiz-view]')}
  function quizShell(){return document.querySelector('[data-davi-quiz-shell]')}
  function closeQuiz(){const v=quizView();if(v){v.classList.remove('on');v.setAttribute('aria-hidden','true')}}
  function renderQuizQuestion(){
    const shell=quizShell();if(!shell||!quiz?.questions?.length)return;
    const q=quiz.questions[quizIndex],sel=quizAnswers[quizIndex];
    shell.innerHTML='<p class="davi-quiz-eyebrow">'+escapeHtml(quiz.title||'Quiz Bíblico')+'</p>'
      +'<h3 class="davi-quiz-head">Pergunta '+(quizIndex+1)+' de '+quiz.questions.length+'</h3>'
      +'<p class="davi-quiz-meta">Complete o round para ganhar +'+Number(quiz.xp_complete||100)+' XP'+(Number(quiz.xp_perfect_bonus||0)?' · perfeito: +'+Number(quiz.xp_perfect_bonus)+' XP extra':'')+'</p>'
      +'<div class="davi-quiz-progress"><i style="width:'+(((quizIndex+1)/quiz.questions.length)*100)+'%"></i></div>'
      +'<p class="davi-quiz-question">'+escapeHtml(q.question)+'</p>'
      +'<div class="davi-quiz-options">'+q.options.map((o,i)=>'<button type="button" class="davi-quiz-option'+(sel===i?' on':'')+'" data-davi-answer="'+i+'">'+escapeHtml(o)+'</button>').join('')+'</div>'
      +'<button type="button" class="davi-quiz-next" data-davi-next '+(sel==null?'disabled':'')+'>'+(quizIndex===quiz.questions.length-1?'Finalizar quiz':'Continuar')+'</button>';
  }
  const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function renderQuizResult(r,existing=false){
    const shell=quizShell();if(!shell)return;
    const perfect=Number(r.score)===Number(r.total);
    shell.innerHTML='<div class="davi-quiz-center"><p class="davi-quiz-eyebrow">'+(existing?'ROUND CONCLUÍDO':'RESULTADO')+'</p>'
      +'<div class="davi-quiz-score">'+Number(r.score||0)+'/'+Number(r.total||0)+'</div>'
      +'<p class="davi-quiz-copy">'+(perfect?'Perfeito. Você acertou todas.':'Round concluído. O próximo poderá ser liberado diretamente pelo Acampamento.')+'</p>'
      +(existing?'':'<div class="davi-quiz-xp">+'+Number(r.xp_awarded||0)+' XP</div>')
      +'<p class="davi-quiz-copy">XP total do Acampamento: <b>'+Number(r.xp_total||0)+'</b></p>'
      +'<button type="button" class="davi-quiz-next" data-davi-quiz-back>Voltar ao Acampamento</button></div>';
  }
  async function openQuiz(){
    const v=quizView(),shell=quizShell();if(!v||!shell)return;
    v.classList.add('on');v.setAttribute('aria-hidden','false');
    shell.innerHTML='<div class="davi-quiz-center"><p class="davi-quiz-eyebrow">ACAMPAMENTO DE DAVI</p><h3 class="davi-quiz-head">Carregando quiz…</h3></div>';
    try{
      const data=await quizApi('davi_quiz_current',{});
      if(!data?.available){shell.innerHTML='<div class="davi-quiz-center"><h3 class="davi-quiz-head">Nenhum round disponível</h3><p class="davi-quiz-copy">Davi ainda está preparando o próximo Quiz Bíblico.</p><button type="button" class="davi-quiz-next" data-davi-quiz-back>Voltar</button></div>';return}
      if(data.already_completed){renderQuizResult(data,true);return}
      quiz=data;quizIndex=0;quizAnswers=new Array(data.questions.length);renderQuizQuestion();
    }catch(e){
      shell.innerHTML='<div class="davi-quiz-center"><div class="davi-quiz-error">'+escapeHtml(e.message)+'</div><button type="button" class="davi-quiz-next" data-davi-quiz-back>Voltar</button></div>';
      if(e.login&&window.DoxaConta?.open)setTimeout(()=>{closeQuiz();closeCamp();window.DoxaConta.open()},500);
    }
  }
  async function submitQuiz(){
    const shell=quizShell();if(!shell||!quiz)return;
    shell.innerHTML='<div class="davi-quiz-center"><p class="davi-quiz-eyebrow">QUIZ BÍBLICO</p><h3 class="davi-quiz-head">Conferindo respostas…</h3></div>';
    try{const r=await quizApi('davi_quiz_submit',{p_round_id:quiz.round_id,p_answers:quizAnswers});renderQuizResult(r,!!r.already_completed)}
    catch(e){shell.innerHTML='<div class="davi-quiz-center"><div class="davi-quiz-error">'+escapeHtml(e.message)+'</div><button type="button" class="davi-quiz-next" data-davi-retry> tentar novamente </button><button type="button" class="davi-quiz-next" data-davi-quiz-back>Voltar</button></div>'}
  }

  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-davi-camp]')) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.();
      openCamp(); return;
    }
    if (event.target.closest?.('[data-davi-camp-close]')) {
      event.preventDefault(); closeCamp(); return;
    }
    if (event.target.closest?.('[data-davi-camp-play]')) {event.preventDefault();openQuiz();return}
    if (event.target.closest?.('[data-davi-quiz-back]')) {event.preventDefault();closeQuiz();return}
    const a=event.target.closest?.('[data-davi-answer]');
    if(a){event.preventDefault();quizAnswers[quizIndex]=Number(a.dataset.daviAnswer);renderQuizQuestion();return}
    if(event.target.closest?.('[data-davi-next]')){event.preventDefault();if(quizAnswers[quizIndex]==null)return;if(quizIndex<quiz.questions.length-1){quizIndex++;renderQuizQuestion()}else submitQuiz();return}
    if(event.target.closest?.('[data-davi-retry]')){event.preventDefault();submitQuiz();return}
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('daviCampOverlay')?.classList.contains('on')) closeCamp();
  });

  decorate();
})();
