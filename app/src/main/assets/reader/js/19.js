(()=>{
  'use strict';
  if(window.__doxa30PaperInstalled)return;
  window.__doxa30PaperInstalled=true;

  const STORAGE_KEY='doxa:30.5:paper-texture';
  const $=s=>document.querySelector(s);

  const style=document.createElement('style');
  style.id='doxa30-paper-style';
  style.textContent=`
    /* IMPORTANTE:
       não altera position/z-index do HUD, header ou painéis. */

    body.doxa30-paper-on{
      background:
        radial-gradient(circle at 12% 18%,rgba(255,255,255,.18) 0 .7px,transparent 1.5px),
        radial-gradient(circle at 72% 34%,rgba(0,0,0,.09) 0 .65px,transparent 1.45px),
        radial-gradient(circle at 36% 79%,rgba(255,255,255,.12) 0 .7px,transparent 1.6px),
        repeating-linear-gradient(8deg,rgba(255,255,255,.025) 0 1px,transparent 1px 5px),
        repeating-linear-gradient(98deg,rgba(0,0,0,.018) 0 1px,transparent 1px 7px),
        radial-gradient(circle at 50% -12%,color-mix(in srgb,var(--d30-gold) 12%,transparent),transparent 34%),
        linear-gradient(180deg,var(--d30-bg) 0%,var(--d30-bg2) 100%) !important;
      background-size:
        19px 21px,
        23px 25px,
        31px 29px,
        100% 100%,
        100% 100%,
        100% 100%,
        100% 100% !important;
      background-attachment:fixed !important;
    }

    /* Faz o papel aparecer no conteúdo sem deslocar nada. */
    body.doxa30-paper-on:not(.parallel-mode) #p-ler,
    body.doxa30-paper-on:not(.parallel-mode) #p-buscar,
    body.doxa30-paper-on:not(.parallel-mode) #p-marcar,
    body.doxa30-paper-on:not(.parallel-mode) #p-ajustes,
    body.doxa30-paper-on:not(.parallel-mode) main{
      background:transparent !important;
    }

    /* Granulação sutil no topo, preservando a paleta. */
    body.doxa30-paper-on:not(.parallel-mode)>header{
      background:
        radial-gradient(circle at 18% 28%,rgba(255,255,255,.12) 0 .7px,transparent 1.5px),
        radial-gradient(circle at 76% 58%,rgba(0,0,0,.06) 0 .7px,transparent 1.5px),
        repeating-linear-gradient(9deg,rgba(255,255,255,.018) 0 1px,transparent 1px 5px),
        linear-gradient(180deg,
          color-mix(in srgb,var(--d30-panel) 96%,transparent),
          color-mix(in srgb,var(--d30-panel) 88%,transparent) 76%,
          transparent) !important;
      background-size:21px 23px,27px 25px,100% 100%,100% 100% !important;
    }

    /* E uma textura bem leve na barra inferior, sem alterar position:fixed. */
    body.doxa30-paper-on .doxa30-bottom{
      background:
        radial-gradient(circle at 18% 30%,rgba(255,255,255,.10) 0 .65px,transparent 1.4px),
        radial-gradient(circle at 72% 64%,rgba(0,0,0,.06) 0 .65px,transparent 1.45px),
        linear-gradient(180deg,
          color-mix(in srgb,var(--d30-panel) 95%,transparent),
          color-mix(in srgb,var(--d30-bg) 97%,transparent)) !important;
      background-size:22px 24px,27px 25px,100% 100% !important;
    }

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
        radial-gradient(circle at 25% 25%,rgba(255,255,255,.40) 0 .8px,transparent 1.5px),
        radial-gradient(circle at 70% 70%,rgba(0,0,0,.11) 0 .8px,transparent 1.5px),
        repeating-linear-gradient(8deg,rgba(255,255,255,.035) 0 1px,transparent 1px 4px),
        color-mix(in srgb,var(--d30-bg) 82%,var(--d30-text));
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

  function stored(){
    try{return localStorage.getItem(STORAGE_KEY)==='1'}catch(e){return false}
  }

  /* O controle antigo de textura em Ajustes fica sempre desligado.
     A nova textura é independente e vive só em Mais > Temas. */
  function disableLegacyTexture(){
    const texture=document.getElementById('normalTexture');
    if(texture&&texture.checked){
      texture.checked=false;
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

    disableLegacyTexture();

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

      <button class="doxa30-paper-switch"
              id="doxa30PaperSwitch"
              type="button"
              role="switch"
              aria-label="Textura de papel"
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

  /* js/18 cria a bandeja de temas dinamicamente. */
  const observer=new MutationObserver(()=>{
    if(installToggle()){
      apply(stored(),false);
    }
  });

  observer.observe(document.body,{childList:true,subtree:true});

  /* Trocar a paleta não muda a opção Papel. */
  document.addEventListener('click',e=>{
    const theme=e.target.closest?.('.doxa30-theme-option');
    if(!theme)return;

    setTimeout(()=>apply(stored(),false),0);
    setTimeout(()=>apply(stored(),false),120);
  },true);

  disableLegacyTexture();
  apply(stored(),false);
  installToggle();

  /* js/18 ainda pode inicializar preferências antigas alguns ms depois. */
  setTimeout(()=>{disableLegacyTexture();apply(stored(),false)},500);
  setTimeout(()=>{disableLegacyTexture();apply(stored(),false)},1300);
})();

