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
