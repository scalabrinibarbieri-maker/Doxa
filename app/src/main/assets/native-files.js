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

/* Doxa · Davi Fase 1
   Integra o mascote ao Pão Diário e usa a ponte Android DoxaDavi para abrir o quiz nativo. */
(() => {
  if (window.__doxaDaviPhase1) return;
  /* O verificador do CI executa este arquivo em um sandbox Node sem DOM completo.
     A integração do Davi só deve iniciar dentro de um WebView/navegador real. */
  if (typeof document === 'undefined'
      || typeof document.createElement !== 'function'
      || typeof document.querySelectorAll !== 'function'
      || typeof MutationObserver !== 'function'
      || typeof requestAnimationFrame !== 'function') return;
  window.__doxaDaviPhase1 = true;

  const style = document.createElement('style');
  style.id = 'doxaDaviPhase1Style';
  style.textContent = `
    #doxaHomeBreadCard.davi-integrated .doxa-home-bread-art{overflow:visible;isolation:isolate}
    #doxaHomeBreadCard.davi-integrated .doxa-home-bread-stage{position:absolute;z-index:3;left:-20px;bottom:-10px;width:88px!important;height:88px!important}
    #doxaHomeBreadCard .davi-home-mascot{position:absolute;z-index:2;right:-24px;bottom:-28px;width:auto;height:205px;max-width:none;object-fit:contain;pointer-events:none;filter:drop-shadow(0 14px 18px rgba(0,0,0,.34));transform-origin:50% 100%;animation:daviHomeArrive .65s cubic-bezier(.2,.85,.25,1) both}
    #doxaHomeBreadCard video.davi-home-mascot{background:transparent;object-fit:contain}
    #doxaHomeBreadCard .davi-home-balance{position:absolute;z-index:5;right:0;top:2px;display:none;align-items:center;gap:5px;padding:7px 10px;border:1px solid color-mix(in srgb,var(--d30-gold,#d7a55b) 34%,transparent);border-radius:999px;background:color-mix(in srgb,var(--d30-panel,#18130f) 82%,transparent);backdrop-filter:blur(8px);color:var(--d30-gold,#e1b36e);font:700 11px/1 system-ui,sans-serif;box-shadow:0 8px 20px rgba(0,0,0,.18)}
    #doxaHomeBreadCard .davi-home-balance.on{display:flex}
    @keyframes daviHomeArrive{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}

    .davi-challenge-block{position:relative;overflow:hidden;min-height:116px;display:grid!important;grid-template-columns:76px minmax(0,1fr) auto;align-items:center;gap:13px;padding:12px 14px!important;text-align:left!important}
    .davi-challenge-art{align-self:end;width:72px;height:100px;object-fit:contain;filter:drop-shadow(0 10px 12px rgba(0,0,0,.28));margin-bottom:-13px}
    .davi-challenge-copy{min-width:0}
    .davi-challenge-copy strong{font:600 18px/1.15 Georgia,'Times New Roman',serif!important;color:var(--d30-text)!important}
    .davi-challenge-copy small{margin-top:5px!important;font:400 12.5px/1.35 system-ui,sans-serif!important;color:var(--d30-muted)!important}
    .davi-challenge-copy em{display:block;margin-top:8px;color:var(--d30-gold);font:700 10px/1 system-ui,sans-serif;letter-spacing:.06em;font-style:normal;text-transform:uppercase}
    .davi-challenge-balance{align-self:center;white-space:nowrap;padding:9px 10px;border-radius:999px;background:color-mix(in srgb,var(--d30-gold) 10%,transparent);color:var(--d30-gold);font:700 12px/1 system-ui,sans-serif}
    .davi-challenge-block:active{transform:scale(.992);background:color-mix(in srgb,var(--d30-gold) 10%,var(--d30-panel))}

    @media(min-width:681px){
      #doxaHomeBreadCard.davi-integrated .doxa-home-bread-stage{left:-28px;bottom:6px;width:132px!important;height:132px!important}
      #doxaHomeBreadCard .davi-home-mascot{right:-26px;bottom:-52px;height:330px}
      #doxaHomeBreadCard .davi-home-balance{right:8px;top:8px}
    }
    @media(max-width:370px){
      #doxaHomeBreadCard.davi-integrated .doxa-home-bread-stage{left:-17px;width:74px!important;height:74px!important}
      #doxaHomeBreadCard .davi-home-mascot{right:-27px;height:184px;bottom:-26px}
      .davi-challenge-block{grid-template-columns:62px minmax(0,1fr) auto;gap:9px;padding-left:10px!important;padding-right:10px!important}
      .davi-challenge-art{width:60px;height:90px}
      .davi-challenge-balance{padding:8px;font-size:11px}
    }
    @media(prefers-reduced-motion:reduce){#doxaHomeBreadCard .davi-home-mascot{animation:none!important}}
  `;
  document.head.appendChild(style);

  let state = {breadTotal:0,rewardedToday:false,lastScore:-1};
  function paintState(){
    document.querySelectorAll('[data-davi-balance]').forEach(el => el.textContent = String(Math.max(0,Number(state.breadTotal)||0)));
    document.querySelectorAll('.davi-home-balance').forEach(el => el.classList.toggle('on',(Number(state.breadTotal)||0)>0));
  }
  function refreshState(){
    try { if (window.DoxaDavi) DoxaDavi.postMessage('state'); } catch (_) {}
  }
  if (window.DoxaDavi) {
    DoxaDavi.onmessage = event => {
      try {
        const parsed = JSON.parse(String(event.data||'{}'));
        if (parsed && typeof parsed === 'object') state = Object.assign(state, parsed);
        paintState();
      } catch (_) {}
    };
  }

  function decorateHome(){
    const card = document.getElementById('doxaHomeBreadCard');
    const art = card?.querySelector('.doxa-home-bread-art');
    if (!card || !art) return;
    card.classList.add('davi-integrated');
    if (!art.querySelector('.davi-home-mascot')) {
      const video = document.createElement('video');
      video.className = 'davi-home-mascot davi-home-idle';
      video.src = 'assets/davi_idle.webm';
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('disablepictureinpicture', '');
      video.setAttribute('aria-label', 'Davi');
      const fallback = () => {
        if (!video.isConnected) return;
        const img = document.createElement('img');
        img.className = 'davi-home-mascot';
        img.src = 'assets/davi_mascote.png';
        img.alt = 'Davi';
        video.replaceWith(img);
      };
      video.addEventListener('error', fallback, {once:true});
      video.addEventListener('canplay', () => video.play().catch(()=>{}), {once:true});
      art.appendChild(video);
      video.play().catch(()=>{});
    }
    if (!art.querySelector('.davi-home-balance')) {
      const pill = document.createElement('span');
      pill.className = 'davi-home-balance';
      pill.innerHTML = '🍞 <b data-davi-balance>0</b>';
      art.appendChild(pill);
    }
    paintState();
  }

  function decorateBreadSheet(){
    const body = document.getElementById('dbsBody');
    if (!body || body.querySelector('.davi-challenge-block')) return;
    const history = [...body.querySelectorAll('h3')].find(h => h.textContent.trim() === 'Histórico');
    if (!history) return;

    const heading = document.createElement('h3');
    heading.className = 'davi-challenge-heading';
    heading.textContent = 'Desafios';

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'dbs-card davi-challenge-block';
    card.setAttribute('data-davi-challenge','');
    card.innerHTML = '<img class="davi-challenge-art" src="assets/davi_mascote.png" alt="">'
      +'<span class="davi-challenge-copy"><strong>Desafios do Davi</strong><small>Teste seus conhecimentos e ganhe pães.</small><em>Quiz do dia · +1 pão · bônus 5/5</em></span>'
      +'<span class="davi-challenge-balance">🍞 <b data-davi-balance>0</b></span>';

    body.insertBefore(heading, history);
    body.insertBefore(card, history);
    paintState();
  }

  function decorate(){ decorateHome(); decorateBreadSheet(); }
  const observer = new MutationObserver(() => requestAnimationFrame(decorate));
  observer.observe(document.documentElement, {subtree:true, childList:true});

  document.addEventListener('click', event => {
    const target = event.target.closest?.('[data-davi-challenge]');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    try {
      if (!window.DoxaDavi) throw new Error('bridge');
      DoxaDavi.postMessage('openQuiz');
    } catch (_) {
      alert('Atualize o aplicativo para abrir os Desafios do Davi.');
    }
  }, true);

  function resumeIdle(){
    const video = document.querySelector('video.davi-home-idle');
    if (video && !document.hidden && video.paused) video.play().catch(()=>{});
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshState();resumeIdle()}});
  window.addEventListener('focus', ()=>{refreshState();resumeIdle()});
  setInterval(()=>{if(!document.hidden)refreshState()},5000);
  decorate();
  refreshState();
})();
