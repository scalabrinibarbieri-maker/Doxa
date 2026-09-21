(()=>{
  'use strict';
  if(window.__doxa30PaperInstalled)return;
  window.__doxa30PaperInstalled=true;

  const STORAGE_KEY='doxa:30.5:paper-texture';
  const $=s=>document.querySelector(s);

  const style=document.createElement('style');
  style.id='doxa30-paper-style';
  style.textContent=`
    .doxa30-paper-layer{
      position:fixed;
      inset:0;
      z-index:0;
      pointer-events:none;
      opacity:0;
      transition:opacity .22s ease;
      background-image:
        radial-gradient(circle at 18% 22%,rgba(255,255,255,.30) 0 1px,transparent 1.8px),
        radial-gradient(circle at 73% 66%,rgba(0,0,0,.15) 0 1px,transparent 1.7px),
        radial-gradient(circle at 46% 84%,rgba(255,255,255,.19) 0 .8px,transparent 1.5px),
        repeating-linear-gradient(7deg,rgba(255,255,255,.025) 0 1px,transparent 1px 5px),
        repeating-linear-gradient(97deg,rgba(0,0,0,.018) 0 1px,transparent 1px 7px);
      background-size:
        17px 19px,
        23px 21px,
        29px 31px,
        100% 100%,
        100% 100%;
      mix-blend-mode:soft-light;
    }
    body.doxa30-paper-on .doxa30-paper-layer{opacity:.34}
    body[data-doxa30-theme="night"].doxa30-paper-on .doxa30-paper-layer{opacity:.22}
    body:not(.parallel-mode) #p-ler,
    body:not(.parallel-mode) main,
    body:not(.parallel-mode)>header,
    .doxa30-bottom-wrap{position:relative}
    body:not(.parallel-mode) #p-ler,
    body:not(.parallel-mode) main{z-index:1}
    body:not(.parallel-mode)>header{z-index:20}
    .doxa30-bottom-wrap{z-index:35}

    .doxa30-paper-row{
      margin-top:17px;
      padding-top:15px;
      border-top:1px solid color-mix(in srgb,var(--d30-gold) 14%,transparent);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
      color:var(--d30-text);
      font:700 14px/1 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
    }
    .doxa30-paper-label{
      display:flex;
      align-items:center;
      gap:10px;
    }
    .doxa30-paper-sample{
      width:30px;
      height:30px;
      border-radius:9px;
      border:1px solid color-mix(in srgb,var(--d30-gold) 17%,transparent);
      background:
        radial-gradient(circle at 25% 25%,rgba(255,255,255,.5) 0 1px,transparent 1.6px),
        radial-gradient(circle at 70% 70%,rgba(0,0,0,.14) 0 1px,transparent 1.7px),
        repeating-linear-gradient(8deg,rgba(255,255,255,.05) 0 1px,transparent 1px 4px),
        color-mix(in srgb,var(--d30-bg) 78%,var(--d30-text));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.12);
    }
    .doxa30-paper-switch{
      width:50px;
      height:29px;
      border:0;
      border-radius:999px;
      padding:3px;
      background:color-mix(in srgb,var(--d30-muted) 38%,transparent);
      transition:background .18s ease;
      display:flex;
      align-items:center;
      justify-content:flex-start;
    }
    .doxa30-paper-switch::after{
      content:'';
      width:23px;
      height:23px;
      border-radius:50%;
      background:var(--d30-text);
      box-shadow:0 2px 7px rgba(0,0,0,.18);
      transform:translateX(0);
      transition:transform .2s cubic-bezier(.2,.8,.2,1),background .18s ease;
    }
    .doxa30-paper-switch.on{
      background:var(--d30-gold);
    }
    .doxa30-paper-switch.on::after{
      transform:translateX(21px);
      background:color-mix(in srgb,var(--d30-bg) 8%,white);
    }
  `;
  document.head.appendChild(style);

  const layer=document.createElement('div');
  layer.className='doxa30-paper-layer';
  layer.setAttribute('aria-hidden','true');
  document.body.prepend(layer);

  function stored(){
    try{return localStorage.getItem(STORAGE_KEY)==='1'}catch(e){return false}
  }

  function syncHiddenTexture(enabled){
    // A textura agora é uma escolha independente da paleta.
    // Também mantém o controle interno do Doxa coerente, mesmo estando oculto em Ajustes.
    const texture=document.getElementById('normalTexture');
    if(!texture)return;
    if(texture.checked!==enabled){
      texture.checked=enabled;
      texture.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function apply(enabled,save=true){
    document.body.classList.toggle('doxa30-paper-on',enabled);
    const sw=$('#doxa30PaperSwitch');
    if(sw){
      sw.classList.toggle('on',enabled);
      sw.setAttribute('aria-pressed',enabled?'true':'false');
    }
    syncHiddenTexture(enabled);
    if(save){
      try{localStorage.setItem(STORAGE_KEY,enabled?'1':'0')}catch(e){}
    }
  }

  function installToggle(){
    const tray=$('.doxa30-theme-tray');
    if(!tray || $('#doxa30PaperRow'))return false;

    const row=document.createElement('div');
    row.id='doxa30PaperRow';
    row.className='doxa30-paper-row';
    row.innerHTML=`
      <span class="doxa30-paper-label">
        <span class="doxa30-paper-sample" aria-hidden="true"></span>
        <span>Papel</span>
      </span>
      <button class="doxa30-paper-switch" id="doxa30PaperSwitch"
              type="button" role="switch" aria-label="Textura de papel"
              aria-pressed="false"></button>
    `;
    tray.appendChild(row);

    const btn=$('#doxa30PaperSwitch');
    ['touchstart','touchmove','touchend','pointerdown','pointerup'].forEach(type=>{
      btn.addEventListener(type,e=>e.stopPropagation(),{passive:true});
    });
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      apply(!document.body.classList.contains('doxa30-paper-on'),true);
    });

    apply(stored(),false);
    return true;
  }

  // js/18 cria a bandeja de temas dinamicamente.
  const observer=new MutationObserver(()=>{
    if(installToggle())apply(stored(),false);
  });
  observer.observe(document.body,{childList:true,subtree:true});

  // Depois de trocar a paleta, js/18 atualiza o checkbox interno.
  // Reaplicamos a opção independente "Papel", sem alterar a cor escolhida.
  document.addEventListener('click',e=>{
    const theme=e.target.closest?.('.doxa30-theme-option');
    if(!theme)return;
    setTimeout(()=>apply(stored(),false),0);
    setTimeout(()=>apply(stored(),false),120);
  },true);

  // Na primeira instalação, "Papel" começa desligado.
  apply(stored(),false);
  installToggle();

  // Garante coerência após a inicialização dos controles antigos.
  setTimeout(()=>apply(stored(),false),500);
  setTimeout(()=>apply(stored(),false),1300);
})();
