
(()=>{
  let done=false;
  const splash=document.getElementById('doxaBootSplash');
  if(!splash)return;
  const finish=()=>{
    if(done)return; done=true;
    try{clearTimeout(window.__doxaBootFailsafe)}catch(e){}
    const elapsed=Date.now()-(window.__doxaBootStarted||Date.now());
    const wait=Math.max(0,420-elapsed);
    setTimeout(()=>{
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        splash.classList.add('doxa-boot-splash-hide');
        document.documentElement.removeAttribute('data-doxa-boot');
        setTimeout(()=>splash.remove(),430);
      }));
    },wait);
  };
  const readerReady=()=>{
    const body=document.getElementById('textBody');
    const panel=document.getElementById('p-ler');
    return !!(body&&panel&&(body.children.length||String(body.textContent||'').trim().length));
  };
  const check=()=>{if(readerReady())finish();};
  if(document.readyState==='complete')check();
  else window.addEventListener('load',()=>{check();setTimeout(check,80)},{once:true});
  const obs=new MutationObserver(check);
  const target=document.getElementById('textBody');
  if(target)obs.observe(target,{childList:true,subtree:true,characterData:true});
  const poll=setInterval(()=>{if(done){clearInterval(poll);obs.disconnect();return}check()},120);
  // Safety valve: never leave the splash permanently over an otherwise usable app.
  setTimeout(()=>{if(!done)finish()},15000);
})();
