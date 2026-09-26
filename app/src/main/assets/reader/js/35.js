(()=>{
  'use strict';
  /* Doxa 47 · Transição entre Início, Bíblia e Ferramentas
     - A tela nova entra deslizando do lado para onde você foi (Início → Bíblia vem da direita;
       Ferramentas → Início vem da esquerda), com um leve desfoque que se dissolve; a antiga sai
       para o lado oposto. Usa as "View Transitions" do navegador do Android; em aparelhos sem
       esse recurso, só a tela nova faz a entrada.
     - Na barra, o brilho dourado e o filete de cima deslizam até a aba escolhida com um leve
       "quique", e o ícone dá um pulso.
     - Respeita "reduzir movimento" do sistema. */
  if(window.__doxa47NavInstalled)return;
  window.__doxa47NavInstalled=true;

  const ORDER={doxa30Home:0,doxa30Bible:1,doxa30Tools:2,doxa30More:3};
  const PAGES=['doxa30Home','doxa30Bible','doxa30Tools'];
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const bottom=()=>document.getElementById('doxa30Bottom');
  const activeIndex=()=>{const a=bottom()?.querySelector('.doxa30-nav-item.active');return a&&ORDER[a.id]!=null?ORDER[a.id]:1};

  /* ---------- brilho que desliza ---------- */
  function ensureGlow(){
    const b=bottom();if(!b||b.querySelector('.doxa30-nav-glow'))return;
    const g=document.createElement('span');g.className='doxa30-nav-glow';g.setAttribute('aria-hidden','true');b.prepend(g);
    const sync=()=>{b.style.setProperty('--nav-i',activeIndex());
      const a=b.querySelector('.doxa30-nav-item.active');
      if(a&&!reduced()){a.classList.remove('nav-pop');void a.offsetWidth;a.classList.add('nav-pop')}};
    new MutationObserver(sync).observe(b,{attributes:true,subtree:true,attributeFilter:['class','data-active']});
    b.style.setProperty('--nav-i',activeIndex());
  }

  /* ---------- troca de tela ---------- */
  function fallbackEnter(dir){
    const el=document.body.classList.contains('doxa-home-open')?document.getElementById('doxa30HomeScreen'):document.querySelector('.panel.on');
    if(!el)return;el.style.setProperty('--nav-dir',dir);
    el.classList.remove('doxa-tab-in');void el.offsetWidth;el.classList.add('doxa-tab-in');
    setTimeout(()=>el.classList.remove('doxa-tab-in'),520);
  }
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('.doxa30-nav-item');
    if(!btn||!PAGES.includes(btn.id)||e.__doxaNav)return;
    const from=activeIndex(),to=ORDER[btn.id];
    if(from===to||reduced())return;
    const dir=to>from?1:-1;
    if(typeof document.startViewTransition==='function'){
      e.preventDefault();e.stopImmediatePropagation();
      document.documentElement.classList.toggle('nav-back',dir<0);
      const t=document.startViewTransition(()=>{
        const ev=new MouseEvent('click',{bubbles:true,cancelable:true});ev.__doxaNav=true;btn.dispatchEvent(ev);
      });
      t.finished.finally(()=>document.documentElement.classList.remove('nav-back'));
    }else{
      setTimeout(()=>fallbackEnter(dir),0);
    }
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureGlow,{once:true});else ensureGlow();
  setTimeout(ensureGlow,1500);
})();
