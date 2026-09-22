(()=>{
  'use strict';
  /* Doxa 36.1 · Voltar para a leitura no mesmo ponto
     O openPanel() do js/02.js termina sempre com window.scrollTo(0,0). Por isso, ao tocar em
     "Grifar" (ou ao voltar pela aba Bíblia), a leitura recomeçava do início do capítulo.
     Guardamos a altura da leitura ao sair e devolvemos ao voltar, desde que ainda seja o
     mesmo capítulo. Quando o app vai abrir um versículo específico, ele rola depois e manda. */
  if(window.__doxa361KeepScrollInstalled)return;
  window.__doxa361KeepScrollInstalled=true;

  const orig=window.openPanel;
  if(typeof orig!=='function'||orig.__doxa361)return;
  let saved=null;

  function readingKey(){
    try{
      if(typeof mode==='undefined')return null;
      if(mode==='hyper')return 'hyper.'+hIdx;
      const p=pos(),b=CORPORA[mode]?.books[p.b];
      return b?mode+'.'+b.book+'.'+Number(p.c):null;
    }catch(e){return null}
  }
  const reading=()=>document.getElementById('p-ler')?.classList.contains('on');

  const wrapped=function(name){
    if(reading()&&window.scrollY>4)saved={key:readingKey(),y:window.scrollY};
    const result=orig.apply(this,arguments);
    if(name==='ler'&&saved&&saved.key&&saved.key===readingKey()){
      const y=saved.y;
      const go=()=>{try{window.scrollTo({top:y,left:0,behavior:'instant'})}catch(e){window.scrollTo(0,y)}};
      go();requestAnimationFrame(go);        // depois do desenho do painel
    }
    return result;
  };
  wrapped.__doxa361=true;
  window.openPanel=wrapped;
})();
