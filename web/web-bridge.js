/* Doxa Web · ponte do leitor no navegador (entra no início do reader.html, só na versão web)
   - se os textos não estiverem instalados, volta para a tela de preparação;
   - substitui o que no Android era nativo: compartilhar imagem (Web Share) e baixar arquivos;
   - procura atualizações dos textos em segundo plano;
   - no iPhone pelo Safari (sem instalar), lembra de adicionar à Tela de Início. */
(function(){
  'use strict';
  window.DOXA_WEB=true;
  document.documentElement.classList.add('doxa-web');
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const standalone=window.navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;
  if(isIOS)document.documentElement.classList.add('doxa-ios');
  if(standalone)document.documentElement.classList.add('doxa-standalone');

  /* ---- telas grandes (computador, iPad deitado): a leitura fica numa coluna, como um livro aberto ---- */
  const embedded=window.top!==window;
  if(embedded)document.documentElement.classList.add('doxa-embedded');
  try{
    const full=localStorage.getItem('doxa:web:full')==='1';
    if(!embedded&&!full&&Math.min(screen.width,screen.height)>=700&&window.innerWidth>=900&&!/[?&]solo=1/.test(location.search)){location.replace('desk.html');return}
  }catch(e){}

  /* ---- iPhone: o Safari dá zoom ao tocar num campo com letra menor que 16 px.
     Travar a escala no foco evita o salto (o gesto de pinça continua funcionando no iOS). ---- */
  if(isIOS){
    // a ponte roda no topo da página, antes da tag de viewport existir: aplica agora e de novo quando ela aparecer
    const lockZoom=()=>{const vp=document.querySelector('meta[name="viewport"]');if(vp&&!/maximum-scale/.test(vp.content))vp.content+=', maximum-scale=1';return!!vp};
    if(!lockZoom())document.addEventListener('DOMContentLoaded',lockZoom,{once:true});
  }

  /* ---- gestos do navegador que brigam com o app ---- */
  const css=document.createElement('style');css.id='doxaWebCss';
  css.textContent=[
    // sem o "elástico" que arrasta a barra de baixo junto e sem puxar para recarregar
    'html.doxa-web,html.doxa-web body{overscroll-behavior:none}',
    // toque mais firme: sem atraso de toque duplo e sem o destaque azul do toque
    'html.doxa-web body{touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
    // o toque longo nos versículos é do Doxa (menu próprio), não do menu de copiar do iPhone
    'html.doxa-ios #textBody .verse,html.doxa-ios .parallel-pane .verse,html.doxa-ios button,html.doxa-ios nav,html.doxa-ios img{-webkit-touch-callout:none}',
    'html.doxa-ios button,html.doxa-ios nav,html.doxa-ios .doxa30-nav-item{-webkit-user-select:none;user-select:none}'
  ].join('\n');
  (document.head||document.documentElement).appendChild(css);

  // sem os textos instalados, o leitor não abre: volta para a preparação
  try{const st=JSON.parse(localStorage.getItem('doxa:web:pkgs:v1')||'{}');if(!st['core-texts']||!st['pt-bibles-a']){location.replace('index.html');return}}catch(e){}

  // compartilhar imagem gerada no leitor (no Android isso ia para o seletor nativo)
  window.DoxaNativeShare=async(blob,text,title)=>{
    const file=new File([blob],'doxa.'+((blob.type||'image/jpeg').split('/')[1]||'jpg'),{type:blob.type||'image/jpeg'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],text:text||'',title:title||'Doxa'});return}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
  };

  function toast(msg,action,fn){
    let t=document.getElementById('doxaWebToast');
    if(!t){t=document.createElement('div');t.id='doxaWebToast';t.style.cssText='position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);transform:translateX(-50%);z-index:9999;max-width:90vw;display:flex;gap:10px;align-items:center;padding:11px 15px;border-radius:15px;background:rgba(21,16,11,.96);border:1px solid rgba(217,162,94,.4);color:#f3ebe0;font:500 13px/1.4 system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.4)';document.body.appendChild(t)}
    t.innerHTML='';const s=document.createElement('span');s.textContent=msg;t.appendChild(s);
    if(action){const b=document.createElement('button');b.textContent=action;b.style.cssText='border:0;border-radius:10px;padding:7px 11px;background:linear-gradient(180deg,#e4b06a,#c98f44);color:#1b1206;font:700 12px system-ui';b.onclick=()=>{t.remove();fn()};t.appendChild(b)}
    clearTimeout(t._h);t._h=setTimeout(()=>t&&t.remove(),action?12000:3500);
  }

  // atualização dos textos em segundo plano (no máximo a cada 12 h)
  function checkUpdates(){
    try{
      const last=Number(localStorage.getItem('doxa:web:checked')||0);if(Date.now()-last<12*3600e3||!navigator.onLine)return;
      localStorage.setItem('doxa:web:checked',String(Date.now()));
      const s=document.createElement('script');s.src='web/packages.js';
      s.onload=async()=>{try{const r=await window.DoxaWebPackages.sync();if(r.updated.length)toast('Os textos do Doxa foram atualizados.','Recarregar',()=>location.reload())}catch(e){}};
      document.head.appendChild(s);
    }catch(e){}
  }
  // lembrete de instalação no iPhone
  function iosHint(){
    if(!isIOS||standalone)return;
    const k='doxa:web:ios-hint';if(Date.now()-Number(localStorage.getItem(k)||0)<3*86400e3)return;
    localStorage.setItem(k,String(Date.now()));
    const logged=!!(window.DoxaConta&&window.DoxaConta.user);
    toast(logged?'Para usar como app, toque em Compartilhar e depois em “Adicionar à Tela de Início”.':'Usando pelo Safari sem instalar, o iPhone pode apagar seus dados depois de alguns dias sem uso. Instale na Tela de Início ou crie sua Conta Doxa (em Mais) para não perder grifos e notas.');
  }
  // atualização do próprio app (service worker novo)
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});
    let reloaded=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloaded)return;reloaded=true;toast('Há uma versão nova do Doxa.','Atualizar',()=>location.reload())});
  }
  /* ---- voltar: no Android, o botão voltar fecha as telas na ordem certa (MainActivity.onBackPressed).
     No navegador, o mesmo acontece pelo histórico; só sai do app com dois toques seguidos. ---- */
  function handleBack(){
    const $=id=>document.getElementById(id);
    const on=id=>!!$(id)&&$(id).classList.contains('on');
    const click=id=>{const e=$(id);if(!e)return false;e.click();return true};
    const off=id=>{$(id).classList.remove('on');return true};
    // telas acrescentadas depois da ponte do Android
    if(on('cmtOverlay'))return off('cmtOverlay');
    if(on('contaOverlay'))return off('contaOverlay');
    if(on('doxaChronoNT')){window.DoxaChronoNT?window.DoxaChronoNT.close():off('doxaChronoNT');return true}
    if(on('doxaChronoSheet')){window.DoxaChrono?window.DoxaChrono.close():off('doxaChronoSheet');return true}
    if($('lupaFloat')){$('lupaFloat').remove();document.querySelectorAll('.verse.lupa-sel').forEach(x=>x.classList.remove('lupa-sel'));return true}
    if(document.body.classList.contains('doxa-lupa-on')&&window.DoxaLupa){window.DoxaLupa.setMode(false);return true}
    if(document.body.classList.contains('doxa-timeline-mode')&&click('tlModeExit'))return true;
    if(on('doxaRichReader')){const b=document.querySelector('#doxaRichReader .doxa-rich-reader-back');if(b){b.click();return true}}
    if(on('doxaHomeReader')&&click('doxaHomeReaderBack'))return true;
    // a mesma ordem do Android
    if(on('verseActions')||on('studyScreen')||on('v20Advanced')){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return true}
    if(on('doxa31HelpSheet')&&click('doxa31HelpClose'))return true;
    if(on('doxa30ThemeOverlay'))return off('doxa30ThemeOverlay');
    if(on('doxa30MoreOverlay'))return off('doxa30MoreOverlay');
    if(on('strongSheet')&&click('strongClose'))return true;
    if(on('xrefSheet')&&click('xrefClose'))return true;
    if(on('versionPicker')&&click('versionPickerClose'))return true;
    if(on('premiumPicker')){const st=document.querySelector('[data-picker-stage].on');const stage=st&&st.dataset.pickerStage;if(stage&&stage!=='book')click('pickerBack');else click('pickerClose');return true}
    const notes=$('toolsNotesView');if(notes&&!notes.hidden&&click('toolsNotesBack'))return true;
    if(document.body.classList.contains('parallel-mode')&&click('parallelExit'))return true;
    const active=document.querySelector('.panel.on');
    if(active&&active.id!=='p-ler'){try{openPanel('ler');return true}catch(e){}}
    return false;
  }
  try{
    history.replaceState({doxa:'base'},'');history.pushState({doxa:'guard'},'');
    let lastBack=0;
    window.addEventListener('popstate',()=>{
      let handled=false;try{handled=handleBack()}catch(e){}
      if(handled){history.pushState({doxa:'guard'},'');return}
      const now=Date.now();
      if(now-lastBack<1800){history.back();return}
      lastBack=now;history.pushState({doxa:'guard'},'');
      toast('Toque em voltar de novo para sair do Doxa.');
    });
  }catch(e){}

  function deskRow(){
    if(embedded||window.innerWidth<900)return;
    const list=document.querySelector('#doxa30MoreOverlay .doxa30-more-list');if(!list||document.getElementById('doxaWebDeskRow'))return;
    const b=document.createElement('button');b.className='doxa30-more-row';b.id='doxaWebDeskRow';b.type='button';
    b.innerHTML='<span class="doxa30-more-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="7" y="3.5" width="10" height="17" rx="2"/></svg></span><span class="doxa30-more-copy"><strong>Leitura em coluna</strong><small>Mostrar o Doxa centralizado, como um livro aberto</small></span><span class="doxa30-more-arrow">›</span>';
    list.appendChild(b);b.onclick=()=>{try{localStorage.removeItem('doxa:web:full')}catch(e){}location.replace('desk.html')};
  }
  window.addEventListener('load',()=>{setTimeout(checkUpdates,20000);setTimeout(iosHint,6000);setTimeout(deskRow,1500)});
})();
