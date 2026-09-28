/* Doxa 54 · Quotes editoriais em Texto & manuscritos
   Transforma apenas citações de testemunhas textuais dentro da categoria
   texto_manuscritos. O restante da Ferramenta Doxa continua intacto. */
(()=>{
  'use strict';
  if(window.__doxa54ManuscriptQuotesInstalled)return;
  window.__doxa54ManuscriptQuotesInstalled=true;

  const STYLE_ID='doxa54ManuscriptQuoteStyles';
  const ANCIENT_RE=/[\u0370-\u03ff\u1f00-\u1fff\u0590-\u05ff\u0700-\u074f]/;
  const HEBREW_RE=/[\u0590-\u05ff]/;
  const SYRIAC_RE=/[\u0700-\u074f]/;
  const GREEK_RE=/[\u0370-\u03ff\u1f00-\u1fff]/;
  const QUOTED_RE=/^[\s“”„«»\"'‘’]+|[\s“”„«»\"'‘’]+$/g;
  const CUE_RE=/(l[eê]|traz|diz|preserva(?:m)?|traduz(?:em)?|segue(?:m)?|mant[eé]m|apresenta(?:m)?|usa(?:m)?|registra(?:m)?|conserva(?:m)?|testemunha(?:m)?|oferece(?:m)?)(?=\s|$|[:.,])/i;

  const WITNESSES=[
    {key:'MT',name:'Texto Massorético',aliases:['texto massorético','texto massoretico','massorético','massoretico','mt']},
    {key:'LXX',name:'Septuaginta',aliases:['septuaginta','lxx']},
    {key:'PS',name:'Pentateuco Samaritano',aliases:['pentateuco samaritano','samaritano','ps','sp']},
    {key:'PESH',name:'Peshitta',aliases:['peshitta','siríaco','siriaco','siríaca','siriaca']},
    {key:'DSS',name:'Manuscritos do Mar Morto',aliases:['manuscritos do mar morto','mar morto','qumran','dss']},
    {key:'ONK',name:'Targum Onkelos',aliases:['targum onkelos','onkelos']},
    {key:'VUL',name:'Vulgata',aliases:['vulgata']}
  ];

  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  const fold=s=>norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

  function witnessHits(text){
    const f=fold(text),found=[];
    for(const w of WITNESSES){
      let best=-1;
      for(const a of w.aliases){
        const x=fold(a);
        let at=-1;
        if(x.length<=3){
          const re=new RegExp('(^|[^a-z0-9])('+x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?=[^a-z0-9]|$)','i');
          const m=f.match(re);
          if(m)at=(m.index||0)+m[1].length;
        }else at=f.indexOf(x);
        if(at>=0&&(best<0||at<best))best=at;
      }
      if(best>=0)found.push({w,pos:best});
    }
    found.sort((a,b)=>a.pos-b.pos);
    return found.map(x=>x.w);
  }

  function explicitLead(text){
    const t=norm(text);
    for(const w of WITNESSES){
      for(const a of w.aliases){
        const re=new RegExp('^(?:no|na|o|a)?\\s*'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*[:—–-]\\s*(.+)$','i');
        const m=t.match(re);
        if(m)return{hits:[w],inline:norm(m[1])};
      }
    }
    return null;
  }

  function onlyWitnessNames(text,hits){
    if(!hits.length)return false;
    let s=fold(text);
    s=s.replace(/^(?:no|na|o|a)\s+/,'');
    for(const w of hits){
      const aliases=[...w.aliases].sort((a,b)=>b.length-a.length);
      for(const a of aliases){
        const x=fold(a);
        if(s.includes(x)){s=s.replace(x,' ');break}
      }
    }
    s=s.replace(/\b(?:e|and)\b/g,' ').replace(/[,&+·•/|()\-–—:.;]/g,' ').replace(/\s+/g,'').trim();
    return !s;
  }

  function inlineAfterCue(text,cue){
    let tail=norm(text.slice((cue.index||0)+cue[0].length));
    tail=tail.replace(/^[\s:—–-]+/,'').replace(/^por\s+/i,'');
    if(!tail)return'';

    // Frases de ligação não são o testemunho em si; a leitura costuma vir no parágrafo seguinte.
    if(!ANCIENT_RE.test(tail)&&!/[“”«»"]/u.test(tail))return'';

    // Se a frase volta à análise depois da leitura, mantém só a parte citada.
    tail=tail.replace(/,\s*(?:acompanhando|confirmando|enquanto|porém|mas)\b[\s\S]*$/i,'').trim();
    return tail;
  }

  function leadInfo(text){
    const t=norm(text);
    if(!t)return null;

    const explicit=explicitLead(t);
    if(explicit)return explicit;

    const allHits=witnessHits(t);
    if(!allHits.length)return null;

    if(onlyWitnessNames(t,allHits))return{hits:allHits,inline:''};

    const cue=t.match(CUE_RE);
    if(!cue)return null;
    const subject=t.slice(0,(cue.index||0)+cue[0].length);
    const hits=witnessHits(subject);
    if(!hits.length)return null;

    // Evita transformar parágrafos analíticos longos só porque mencionam uma testemunha.
    if(t.length>210&&!ANCIENT_RE.test(t)&&!/[“”«»"]/u.test(t))return null;
    return{hits,inline:inlineAfterCue(t,cue)};
  }

  function quoteLineKind(text){
    const t=norm(text);
    if(!t)return'';
    if(HEBREW_RE.test(t))return'original rtl he';
    if(SYRIAC_RE.test(t))return'original rtl syr';
    if(GREEK_RE.test(t))return'original grc';
    if(/^[“«\"]/.test(t)||/[”»\"]$/.test(t))return'translation';
    if(/[→←↔]/.test(t)&&t.length<=110)return'comparison';

    const words=t.split(/\s+/).filter(Boolean);
    if(t.length<=86&&words.length<=10&&!/[.!?;:]$/.test(t))return'translit';
    return'';
  }

  function displayMeta(hits){
    const unique=[];
    for(const w of hits)if(!unique.some(x=>x.key===w.key))unique.push(w);
    return{
      mark:unique.map(w=>w.key).join(' · '),
      name:unique.map(w=>w.name).join(' + ')
    };
  }

  function makeLine(text,kind){
    const el=document.createElement('div');
    el.className='doxa-ms-line '+kind.split(/\s+/).filter(Boolean).map(x=>'is-'+x).join(' ');
    el.textContent=norm(text).replace(QUOTED_RE,m=>m);
    if(kind.includes(' he'))el.lang='he';
    else if(kind.includes(' syr'))el.lang='syr';
    else if(kind.includes(' grc'))el.lang='grc';
    if(kind.includes(' rtl'))el.dir='rtl';
    return el;
  }

  function makeQuote(info,lines,index){
    const meta=displayMeta(info.hits);
    const block=document.createElement('blockquote');
    block.className='doxa-ms-quote';
    block.style.setProperty('--ms-i',String(index));
    block.setAttribute('aria-label','Testemunho textual: '+meta.name);

    const head=document.createElement('div');
    head.className='doxa-ms-head';

    const mark=document.createElement('span');
    mark.className='doxa-ms-mark';
    mark.textContent=meta.mark;

    const name=document.createElement('strong');
    name.className='doxa-ms-name';
    name.textContent=meta.name;

    const ornament=document.createElement('span');
    ornament.className='doxa-ms-ornament';
    ornament.setAttribute('aria-hidden','true');
    ornament.textContent='“';

    head.append(mark,name,ornament);

    const body=document.createElement('div');
    body.className='doxa-ms-lines';
    for(const line of lines){
      const kind=quoteLineKind(line)||'reading';
      body.appendChild(makeLine(line,kind));
    }

    block.append(head,body);
    return block;
  }

  function enhanceText(textEl){
    if(!textEl||textEl.dataset.doxaMsEnhanced==='1')return;
    textEl.dataset.doxaMsEnhanced='1';

    const paras=[...textEl.querySelectorAll(':scope > p')];
    let quoteIndex=0;

    for(let i=0;i<paras.length;i++){
      const p=paras[i];
      if(!p.isConnected)continue;

      const info=leadInfo(p.textContent);
      if(!info)continue;

      const lines=[];
      if(info.inline)lines.push(info.inline);

      let j=i+1;
      while(j<paras.length&&lines.length<5){
        const next=paras[j];
        if(!next.isConnected){j++;continue}
        const t=norm(next.textContent);
        if(!t)break;
        if(leadInfo(t))break;
        const kind=quoteLineKind(t);
        if(!kind)break;
        lines.push(t);
        j++;
      }

      if(!lines.length)continue;

      const block=makeQuote(info,lines,quoteIndex++);
      p.replaceWith(block);
      for(let k=i+1;k<j;k++)paras[k]?.remove();
      i=j-1;
    }
  }

  function enhanceAll(root=document){
    root.querySelectorAll?.('.doxa-tool-card.type-texto_manuscritos .doxa-tool-text').forEach(enhanceText);
  }

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .doxa-tool-category[data-type="texto_manuscritos"] .doxa-ms-quote{
        position:relative;overflow:hidden;
        margin:13px 0 15px;padding:13px 14px 13px 16px;
        border:1px solid color-mix(in srgb,var(--doxa-cat,#7359a6) 16%,transparent);
        border-left:2px solid color-mix(in srgb,var(--doxa-cat,#7359a6) 78%,transparent);
        border-radius:3px 14px 14px 3px;
        background:
          radial-gradient(80% 130% at 100% 0%,color-mix(in srgb,var(--doxa-cat,#7359a6) 8%,transparent),transparent 62%),
          linear-gradient(100deg,color-mix(in srgb,var(--doxa-cat,#7359a6) 7%,transparent),transparent 58%),
          color-mix(in srgb,var(--paper,#e6e3da) 96%,var(--ink,#23262c) 4%);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 5px 15px rgba(0,0,0,.025);
      }
      .doxa-tool-category[data-type="texto_manuscritos"] .doxa-ms-quote::before{
        content:"";position:absolute;left:-1px;top:12px;bottom:12px;width:2px;border-radius:8px;
        background:linear-gradient(180deg,transparent,var(--doxa-cat,#7359a6) 20%,var(--doxa-cat,#7359a6) 80%,transparent);
        box-shadow:0 0 12px color-mix(in srgb,var(--doxa-cat,#7359a6) 22%,transparent);
      }
      .doxa-ms-head{position:relative;z-index:1;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:9px;margin-bottom:9px}
      .doxa-ms-mark{
        min-height:22px;display:grid;place-items:center;padding:0 7px;border-radius:7px;
        color:color-mix(in srgb,var(--doxa-cat,#7359a6) 86%,var(--ink,#23262c));
        background:color-mix(in srgb,var(--doxa-cat,#7359a6) 10%,transparent);
        box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--doxa-cat,#7359a6) 15%,transparent);
        font:820 8.5px/1 var(--ui,system-ui,sans-serif);letter-spacing:.09em;white-space:nowrap;
      }
      .doxa-ms-name{min-width:0;color:var(--ink,#23262c);font:760 11.5px/1.25 var(--ui,system-ui,sans-serif);letter-spacing:.01em}
      .doxa-ms-ornament{
        align-self:start;margin-top:-10px;color:color-mix(in srgb,var(--doxa-cat,#7359a6) 18%,transparent);
        font:700 43px/.9 Georgia,'Times New Roman',serif;user-select:none;pointer-events:none;
      }
      .doxa-ms-lines{position:relative;z-index:1;display:grid;gap:5px}
      .doxa-ms-line{color:var(--ink,#23262c);font:500 15.5px/1.58 Georgia,'Times New Roman',serif;overflow-wrap:anywhere}
      .doxa-ms-line.is-original{font-size:17px;line-height:1.55;letter-spacing:.008em}
      .doxa-ms-line.is-original.is-rtl{font-size:18px;text-align:right;line-height:1.65}
      .doxa-ms-line.is-translation{font-style:italic;color:color-mix(in srgb,var(--ink,#23262c) 90%,var(--doxa-cat,#7359a6) 10%)}
      .doxa-ms-line.is-translit{margin-top:-1px;color:var(--ink-faint,#777);font:600 12.5px/1.5 Georgia,'Times New Roman',serif;letter-spacing:.015em}
      .doxa-ms-line.is-comparison{color:color-mix(in srgb,var(--ink,#23262c) 88%,var(--doxa-cat,#7359a6) 12%);font-weight:650}
      .doxa-ms-line.is-reading{font-size:14.5px}

      .doxa-tool-category[data-type="texto_manuscritos"].is-open .doxa-ms-quote{
        animation:doxa-ms-quote-in .36s both cubic-bezier(.22,.78,.22,1);
        animation-delay:calc(125ms + min(var(--ms-i,0),6) * 68ms);
      }
      @keyframes doxa-ms-quote-in{
        from{opacity:0;transform:translate3d(-7px,6px,0);filter:blur(1.5px)}
        to{opacity:1;transform:none;filter:none}
      }
      @media (prefers-reduced-motion:reduce){
        .doxa-tool-category[data-type="texto_manuscritos"].is-open .doxa-ms-quote{animation:none}
      }
    `;
    document.head.appendChild(style);
  }

  function init(){
    installStyles();
    enhanceAll();
    const target=document.getElementById('doxaToolBody')||document.body;
    try{
      new MutationObserver(muts=>{
        for(const m of muts){
          for(const n of m.addedNodes){
            if(!(n instanceof Element))continue;
            if(n.matches?.('.doxa-tool-card.type-texto_manuscritos .doxa-tool-text'))enhanceText(n);
            enhanceAll(n);
          }
        }
      }).observe(target,{childList:true,subtree:true});
    }catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
