(()=>{
  'use strict';
  /* Doxa 36 · Versículo do Dia compartilhável
     Gera uma arte 1080×1350 (formato de post/status) com o versículo, a referência e a marca
     do Doxa, mostra uma prévia e envia pelo seletor do Android junto com o texto e o link oficial. */
  if(window.__doxa36ShareInstalled)return;
  window.__doxa36ShareInstalled=true;

  const LINK='https://scalabrinibarbieri-maker.github.io/Doxa/';
  const W=1080,H=1350;
  const $=id=>document.getElementById(id);
  let lastBlob=null,lastText='';

  function verseData(){
    const card=$('doxaHomeVerse');if(!card)return null;
    const text=(card.querySelector('.doxa-home-verse-copy strong')?.textContent||'').replace(/^[“"]|[”"]$/g,'').trim();
    const ref=(card.querySelector('.doxa-home-verse-copy > span')?.textContent||'').trim();
    const m=/url\(['"]?([^'")]+)['"]?\)/.exec(card.getAttribute('style')||'');
    return text?{text,ref,image:m?m[1]:'assets/home_verse.webp'}:null;
  }
  function loadImage(src,cors){
    return new Promise((res,rej)=>{const i=new Image();if(cors)i.crossOrigin='anonymous';i.onload=()=>res(i);i.onerror=rej;i.src=src});
  }
  async function background(src){
    const remote=/^https?:/i.test(src);
    try{return await loadImage(src,remote)}catch(e){}
    try{return await loadImage('assets/home_verse.webp',false)}catch(e){return null}
  }
  function cover(ctx,img){
    const r=Math.max(W/img.width,H/img.height),w=img.width*r,h=img.height*r;
    ctx.drawImage(img,(W-w)/2,(H-h)/2,w,h);
  }
  function wrap(ctx,text,maxW){
    const words=text.split(/\s+/),lines=[];let line='';
    for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w}else line=t}
    if(line)lines.push(line);return lines;
  }
  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

  async function render(v){
    try{await document.fonts?.load("600 60px 'EB Garamond'")}catch(e){}
    const serif=document.fonts?.check?.("600 60px 'EB Garamond'")?"'EB Garamond',Georgia,serif":"Georgia,'Times New Roman',serif";
    const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');

    // fundo: foto do dia com véu escuro quente, ou gradiente da marca
    ctx.fillStyle='#070504';ctx.fillRect(0,0,W,H);
    const img=await background(v.image);
    if(img){cover(ctx,img)}
    let g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'rgba(7,5,4,.62)');g.addColorStop(.45,'rgba(7,5,4,.72)');g.addColorStop(1,'rgba(7,5,4,.92)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    g=ctx.createRadialGradient(W/2,H*.42,40,W/2,H*.42,W*.75);
    g.addColorStop(0,'rgba(217,162,94,.16)');g.addColorStop(1,'rgba(217,162,94,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

    // moldura fina dourada
    ctx.strokeStyle='rgba(217,162,94,.42)';ctx.lineWidth=2;roundRect(ctx,48,48,W-96,H-96,34);ctx.stroke();

    // topo
    ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillStyle='#D9A25E';ctx.font="700 26px system-ui,Roboto,sans-serif";
    try{ctx.letterSpacing='9px'}catch(e){}
    ctx.fillText('VERSÍCULO DO DIA',W/2,160);
    try{ctx.letterSpacing='0px'}catch(e){}
    const date=new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long',year:'numeric'}).format(new Date());
    ctx.fillStyle='rgba(244,239,233,.55)';ctx.font="400 26px system-ui,Roboto,sans-serif";ctx.fillText(date,W/2,204);
    ctx.fillStyle='rgba(217,162,94,.55)';ctx.fillRect(W/2-36,236,72,2);

    // versículo: maior fonte que caiba na área
    const maxW=860,top=300,areaH=700;let size=78,lines=[],lh=0;
    for(;size>=36;size-=2){ctx.font='500 '+size+'px '+serif;lines=wrap(ctx,'“'+v.text+'”',maxW);lh=size*1.3;if(lines.length*lh<=areaH)break}
    const blockH=lines.length*lh,y0=top+(areaH-blockH)/2+size;
    ctx.fillStyle='#F4EFE9';ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=18;
    lines.forEach((ln,i)=>ctx.fillText(ln,W/2,y0+i*lh));
    ctx.shadowBlur=0;

    // referência
    ctx.fillStyle='#F1C989';ctx.font='italic 500 44px '+serif;
    ctx.fillText(v.ref,W/2,Math.min(top+areaH+70,y0+blockH+40));

    // marca
    try{
      const mark=await loadImage('assets/doxa_mark.png',false),ms=92,my=H-230;
      ctx.drawImage(mark,W/2-ms/2,my,ms,ms);
    }catch(e){}
    ctx.fillStyle='#F4EFE9';ctx.font='600 46px '+serif;ctx.fillText('Doxa',W/2,H-94);
    ctx.fillStyle='rgba(244,239,233,.55)';ctx.font="500 21px system-ui,Roboto,sans-serif";
    try{ctx.letterSpacing='5px'}catch(e){}
    ctx.fillText('BÍBLIA DE ESTUDO',W/2,H-60);
    try{ctx.letterSpacing='0px'}catch(e){}

    return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Falha ao gerar a imagem')),'image/jpeg',.92));
  }

  /* ---------- prévia ---------- */
  function ensureSheet(){
    let s=$('doxaShareSheet');if(s)return s;
    const bd=document.createElement('div');bd.id='doxaShareBackdrop';bd.className='doxa-share-backdrop';document.body.appendChild(bd);
    s=document.createElement('section');s.id='doxaShareSheet';s.className='doxa-share-sheet';s.setAttribute('aria-hidden','true');
    s.innerHTML='<div class="doxa-share-grab"></div><div class="doxa-share-preview" id="doxaSharePreview"><div class="doxa-share-loading">Preparando a arte…</div></div>'
      +'<div class="doxa-share-actions"><button type="button" id="doxaShareCancel">Fechar</button><button type="button" class="primary" id="doxaShareGo" disabled>Compartilhar</button></div>'
      +'<p class="doxa-share-note">A imagem vai acompanhada do versículo em texto e do link oficial do Doxa.</p>';
    document.body.appendChild(s);
    bd.onclick=close;$('doxaShareCancel').onclick=close;$('doxaShareGo').onclick=share;
    return s;
  }
  function close(){$('doxaShareSheet')?.classList.remove('on');$('doxaShareBackdrop')?.classList.remove('on')}
  async function open(){
    const v=verseData();if(!v)return;
    const s=ensureSheet();s.classList.add('on');$('doxaShareBackdrop').classList.add('on');
    const pv=$('doxaSharePreview'),go=$('doxaShareGo');go.disabled=true;
    pv.innerHTML='<div class="doxa-share-loading">Preparando a arte…</div>';
    lastText='“'+v.text+'”\n— '+v.ref+'\n\nLeia a Bíblia no Doxa:\n'+LINK;
    try{
      lastBlob=await render(v);
      const url=URL.createObjectURL(lastBlob);
      pv.innerHTML='<img alt="Arte do versículo do dia" src="'+url+'">';
      go.disabled=false;
    }catch(e){pv.innerHTML='<div class="doxa-share-loading">Não foi possível gerar a arte.</div>'}
  }
  async function share(){
    if(!lastBlob)return;
    const go=$('doxaShareGo');go.disabled=true;
    try{
      if(window.DoxaNativeShare){await window.DoxaNativeShare(lastBlob,lastText,'Compartilhar versículo');close()}
      else if(navigator.canShare?.({files:[new File([lastBlob],'doxa-versiculo.jpg',{type:'image/jpeg'})]})){
        await navigator.share({files:[new File([lastBlob],'doxa-versiculo.jpg',{type:'image/jpeg'})],text:lastText});close();
      }else{
        const a=document.createElement('a');a.href=URL.createObjectURL(lastBlob);a.download='doxa-versiculo.jpg';document.body.appendChild(a);a.click();a.remove();
        try{await navigator.clipboard.writeText(lastText)}catch(e){}
        close();
      }
    }catch(e){try{flash('Não foi possível compartilhar: '+e.message)}catch(_){}}
    finally{go.disabled=false}
  }

  window.DoxaShareVerse=open;open.render=render;
})();
