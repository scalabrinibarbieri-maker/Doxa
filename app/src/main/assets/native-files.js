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
   Mantém a Home/Pão Diário originais e adiciona apenas um acesso simples ao quiz
   dentro da tela completa do Pão Diário, logo após os planos de leitura. */
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
    .davi-camp-entry-copy strong{color:var(--d30-text,#f4eadb);font:600 18px/1.12 Georgia,'Times New Roman',serif}
    .davi-camp-entry-copy small{color:var(--d30-muted,#b8a891);font:400 12.5px/1.35 system-ui,sans-serif}
    .davi-camp-entry>i{position:relative;z-index:1;color:var(--d30-gold,#d7a55b);font:300 28px/1 Georgia,serif;font-style:normal}
    .davi-camp-entry:active{transform:scale(.993)}

    .davi-camp-overlay{
      position:fixed;inset:0;z-index:2147483000;display:none;align-items:stretch;justify-content:center;
      background:rgba(4,3,2,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    }
    .davi-camp-overlay.on{display:flex}
    .davi-camp-panel{
      position:relative;width:min(100%,560px);min-height:100%;overflow:hidden;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:72px 24px 38px;color:var(--d30-text,#f4eadb);
      background:
        radial-gradient(circle at 50% 38%,rgba(216,165,91,.11),transparent 32%),
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
      position:relative;width:min(82vw,320px);height:min(54vh,430px);margin:12px 0 2px;
      display:grid;place-items:end center;
    }
    .davi-camp-idle{
      width:100%;height:100%;object-fit:contain;object-position:center bottom;background:transparent;
      filter:drop-shadow(0 22px 24px rgba(0,0,0,.34));
    }
    .davi-camp-play{
      width:min(100%,360px);height:58px;border:0;border-radius:18px;padding:0 22px;
      background:linear-gradient(180deg,#e2b46f,#c98d3f);color:#2b1c0e;
      font:700 16px/1 system-ui,sans-serif;box-shadow:0 14px 34px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.24);
    }
    .davi-camp-play:active{transform:scale(.985)}
    .davi-camp-note{margin:12px 0 0;color:#806f5d;font:500 11px/1.3 system-ui,sans-serif;text-align:center}
    @media(max-height:660px){
      .davi-camp-panel{padding-top:62px}.davi-camp-idle-wrap{height:330px;margin-top:5px}.davi-camp-title{font-size:27px}
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
      +'<p class="davi-camp-note">5 perguntas · recompensa diária</p>'
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
      +'<span class="davi-camp-entry-copy"><strong>Acampamento de Davi</strong><small>Entre para jogar o Quiz Bíblico.</small></span>'
      +'<i>›</i>';

    body.insertBefore(heading, history);
    body.insertBefore(card, history);
  }

  function decorate(){ decorateBreadSheet(); }
  const observer = new MutationObserver(() => requestAnimationFrame(decorate));
  observer.observe(document.documentElement, {subtree:true, childList:true});

  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-davi-camp]')) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.();
      openCamp(); return;
    }
    if (event.target.closest?.('[data-davi-camp-close]')) {
      event.preventDefault(); closeCamp(); return;
    }
    if (event.target.closest?.('[data-davi-camp-play]')) {
      event.preventDefault();
      try {
        if (!window.DoxaDavi) throw new Error('bridge');
        DoxaDavi.postMessage('openQuiz');
      } catch (_) {
        alert('Atualize o aplicativo para abrir o Quiz Bíblico.');
      }
    }
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('daviCampOverlay')?.classList.contains('on')) closeCamp();
  });

  decorate();
})();
