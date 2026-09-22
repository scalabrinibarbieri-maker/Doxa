(()=>{
  'use strict';
  /* Doxa 35 · Pão Diário completo
     - Leitura contada de verdade: chegar ao fim do capítulo E ter passado um tempo mínimo nele
       (proporcional ao número de versículos, com a tela ativa). Cada capítulo conta uma vez por dia.
     - Histórico real por dia, sequência que zera, recorde.
     - Meta ajustável (1 a 5 capítulos por dia).
     - Pão guardado: a cada 7 dias seguidos ganha 1 (máx. 2); protege sozinho UM dia perdido.
     - Planos de leitura gerados a partir do cânon da Almeida.
     - Marco dos 12 dias: a Mesa dos Pães da Proposição (Lv 24:5–9).
     Mantém as chaves antigas (last-earned/streak) atualizadas para a Home e o shell. */
  if(window.__doxa35BreadInstalled)return;
  window.__doxa35BreadInstalled=true;

  const $=id=>document.getElementById(id);
  const KEY='doxa:pao:v2';
  const OLD_EARNED='doxa:pao-diario:last-earned',OLD_STREAK='doxa:pao-diario:streak';
  const MAX_FREEZES=2,FREEZE_EVERY=7,MILESTONE=12;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dk=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const parse=k=>{const p=String(k).split('-').map(Number);return new Date(p[0],p[1]-1,p[2],12)};
  const addDays=(k,n)=>{const d=parse(k);d.setDate(d.getDate()+n);return dk(d)};
  const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/864e5);

  /* ---------- estado ---------- */
  let st=null;
  function blank(){return{v:2,goal:1,days:{},freezes:0,best:0,plan:null,milestones:{}}}
  function load(){
    try{st=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){st=null}
    if(!st||st.v!==2){
      st=blank();
      // migração: reconstrói os dias da sequência antiga
      try{
        const last=localStorage.getItem(OLD_EARNED),n=Number(localStorage.getItem(OLD_STREAK)||0);
        if(last&&n>0)for(let i=0;i<Math.min(n,400);i++)st.days[addDays(last,-i)]={ch:[],earned:true,migrated:true};
        st.best=n;
      }catch(e){}
      persist();
    }
    st.days=st.days||{};st.milestones=st.milestones||{};
  }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}syncLegacy()}
  const day=k=>st.days[k]||(st.days[k]={ch:[],earned:false});
  const done=k=>{const d=st.days[k];return!!(d&&(d.earned||d.saved))};

  /* sequência: termina hoje (se já conquistou) ou ontem */
  function streak(){
    const today=dk();let k=done(today)?today:addDays(today,-1),n=0;
    while(done(k)&&n<5000){n++;k=addDays(k,-1)}
    return n;
  }
  /* Pão guardado: se ontem ficou vazio mas anteontem estava em sequência, usa um guardado. */
  function applyFreeze(){
    const today=dk(),y=addDays(today,-1),yy=addDays(today,-2);
    if(done(y)||!done(yy)||st.freezes<1)return false;
    day(y).saved=true;st.freezes--;persist();
    return true;
  }
  function syncLegacy(){
    try{
      const s=streak(),today=dk();
      let last='';for(let i=0;i<3;i++){const k=addDays(today,-i);if(done(k)){last=k;break}}
      if(last)localStorage.setItem(OLD_EARNED,done(today)?today:last);else localStorage.removeItem(OLD_EARNED);
      localStorage.setItem(OLD_STREAK,String(s));
    }catch(e){}
  }

  /* ---------- planos ---------- */
  const PLANS={
    ano:{name:'Bíblia em 1 ano',desc:'Gênesis a Apocalipse, cerca de 3 capítulos por dia.',days:365,books:null},
    nt:{name:'Novo Testamento em 90 dias',desc:'Mateus a Apocalipse, cerca de 3 capítulos por dia.',days:90,from:'Matt'},
    evangelhos:{name:'Evangelhos em 30 dias',desc:'Mateus, Marcos, Lucas e João.',days:30,books:['Matt','Mark','Luke','John']},
    salmos:{name:'Salmos e Provérbios em 60 dias',desc:'Os 150 salmos e os 31 provérbios.',days:60,books:['Ps','Prov']}
  };
  function canon(){try{return CORPORA.almeida.books}catch(e){return[]}}
  function planChapters(id){
    const p=PLANS[id],bs=canon();if(!p||!bs.length)return[];
    let list=bs;
    if(p.books)list=p.books.map(b=>bs.find(x=>x.book===b)).filter(Boolean);
    else if(p.from){const i=bs.findIndex(b=>b.book===p.from);list=i>=0?bs.slice(i):bs}
    const out=[];for(const b of list)for(const c of b.chapters)out.push(b.book+'.'+Number(c.chapter));
    return out;
  }
  function planPortion(dayIdx){
    const pl=st.plan;if(!pl)return[];
    const all=planChapters(pl.id),n=PLANS[pl.id].days;
    const a=Math.floor(dayIdx*all.length/n),b=Math.floor((dayIdx+1)*all.length/n);
    return all.slice(a,b);
  }
  function planInfo(){
    const pl=st.plan;if(!pl||!PLANS[pl.id])return null;
    const all=planChapters(pl.id),doneSet=new Set(pl.done||[]);
    const idx=Math.max(0,Math.min(PLANS[pl.id].days-1,daysBetween(pl.start,dk())));
    // porção de hoje = primeira porção ainda não concluída até o dia de hoje
    let cur=0;for(let i=0;i<=idx;i++){if(planPortion(i).some(c=>!doneSet.has(c))){cur=i;break}cur=i}
    const portion=planPortion(cur);
    const behind=Math.max(0,idx-cur);
    return{plan:PLANS[pl.id],id:pl.id,portion,doneSet,dayNum:cur+1,total:PLANS[pl.id].days,
      pct:all.length?Math.round(doneSet.size*100/all.length):0,behind,finished:doneSet.size>=all.length&&all.length>0};
  }
  function startPlan(id){st.plan={id,start:dk(),done:[]};persist();renderSheet();renderHome()}
  function stopPlan(){st.plan=null;persist();renderSheet();renderHome()}

  /* ---------- nomes ---------- */
  function chLabel(key,short){
    const [b,c]=key.split('.');
    try{const bk=canon().find(x=>x.book===b);const n=bk?bookName(bk):b;return(short?n.replace(/^(\d)\s*/,'$1').slice(0,short):n)+' '+c}catch(e){return b+' '+c}
  }

  /* ---------- detecção de leitura ---------- */
  let curKey=null,activeMs=0,lastTick=0,chapterVerses=20;
  function currentChapter(){
    try{
      if(typeof mode==='undefined'||mode==='hyper'||!CORPORA[mode])return null;
      if(document.body.classList.contains('parallel-mode')||document.body.classList.contains('doxa-home-open'))return null;
      if(!$('p-ler')?.classList.contains('on'))return null;
      const p=pos(),b=CORPORA[mode].books[p.b],c=b.chapters.find(x=>Number(x.chapter)===Number(p.c));
      chapterVerses=c?c.verses.length:20;
      return b.book+'.'+Number(p.c);
    }catch(e){return null}
  }
  const minMs=()=>Math.max(15,Math.min(100,chapterVerses*2))*1000;   // 15 s a 100 s
  function tick(){
    const now=performance.now(),dt=lastTick?Math.min(now-lastTick,2000):0;lastTick=now;
    const k=currentChapter();
    if(k!==curKey){curKey=k;activeMs=0;return}
    if(k&&!document.hidden)activeMs+=dt;
    check();
  }
  function atEnd(){const h=$('singleReader');if(!h)return false;return h.getBoundingClientRect().bottom<=window.innerHeight+28}
  function check(){
    if(!curKey||activeMs<minMs()||!atEnd())return;
    const today=dk(),d=day(today);
    if(d.ch.includes(curKey))return;
    d.ch.push(curKey);
    if(st.plan){st.plan.done=st.plan.done||[];if(!st.plan.done.includes(curKey)&&planChapters(st.plan.id).includes(curKey))st.plan.done.push(curKey)}
    const wasEarned=d.earned;
    if(!d.earned&&d.ch.length>=st.goal){d.earned=true;d.saved=false}
    const s=streak();
    if(d.earned&&!wasEarned){
      if(s>st.best)st.best=s;
      if(s>0&&s%FREEZE_EVERY===0&&st.freezes<MAX_FREEZES){st.freezes++;toastSoon('Você ganhou um pão guardado')}
    }
    persist();
    if(d.earned&&!wasEarned){
      celebrate(s);
      if(s>=MILESTONE&&s%MILESTONE===0&&!st.milestones[today]){st.milestones[today]=s;persist();setTimeout(()=>showMilestone(s),1800)}
    }else if(!d.earned){toast('Pão Diário · '+d.ch.length+'/'+st.goal+' capítulos hoje')}
    else toast(chLabel(curKey)+' lido · '+d.ch.length+' hoje');
    renderHome();renderSheet();
  }

  /* ---------- avisos ---------- */
  let tTimer=0;
  function toast(msg){
    let el=document.querySelector('.doxa30-streak-toast');if(!el){el=document.createElement('div');el.className='doxa30-streak-toast';document.body.appendChild(el)}
    el.textContent=msg;el.classList.add('show');clearTimeout(tTimer);tTimer=setTimeout(()=>el.classList.remove('show'),2200);
  }
  const toastSoon=m=>setTimeout(()=>toast(m),2600);
  function celebrate(s){
    toast(s>1?'Pão Diário conquistado · '+s+' dias':'Pão Diário conquistado');
    const stage=$('doxa30BreadStage');if(stage){stage.classList.remove('earned-static');stage.classList.add('earned');setTimeout(()=>{stage.classList.remove('earned');stage.classList.add('earned-static')},5600)}
  }

  /* ---------- marco: Mesa dos Pães da Proposição ---------- */
  function lvText(){
    try{const b=canon().find(x=>x.book==='Lev'),c=b.chapters.find(x=>Number(x.chapter)===24);
      return c.verses.filter(v=>Number(v.number)>=5&&Number(v.number)<=9).map(v=>String(v.text).replace(/[\[\]]/g,'')).join(' ')}catch(e){return''}
  }
  function showMilestone(s){
    let m=$('doxaBreadMilestone');
    if(!m){m=document.createElement('section');m.id='doxaBreadMilestone';m.className='doxa-bread-milestone';document.body.appendChild(m)}
    const t=lvText(),short=t.length>320?t.slice(0,320).replace(/\s+\S*$/,'')+'…':t;
    m.innerHTML='<div class="dbm-inner"><small>'+s+' DIAS SEGUIDOS</small>'
      +'<div class="dbm-art"><img src="assets/pao_proposicao.webp" alt="Mesa dos pães da proposição" onerror="this.parentNode.classList.add(\'noimg\');this.remove()"></div>'
      +'<h2>A Mesa dos Pães da Proposição</h2>'
      +'<p class="dbm-lead">Doze pães, um para cada tribo, sempre diante do Senhor. Doze dias seguidos à mesa da Palavra.</p>'
      +(short?'<blockquote>'+esc(short)+'<span>Levítico 24:5–9</span></blockquote>':'')
      +'<button type="button" id="dbmClose">Continuar</button></div>';
    m.classList.add('on');$('dbmClose').onclick=()=>m.classList.remove('on');
  }

  /* ---------- Home ---------- */
  function renderHome(){
    const today=dk(),d=st.days[today],read=d?d.ch.length:0,ok=done(today),s=streak();
    const pct=Math.min(100,Math.round(read*100/st.goal));
    const set=(id,v)=>{const el=$(id);if(el)el.textContent=v};
    set('doxaHomeStreak',s+' dia'+(s===1?'':'s'));
    set('doxaHomeGoalText',Math.min(read,st.goal)+'/'+st.goal+' capítulo'+(st.goal>1?'s':''));
    const gb=$('doxaHomeGoalBar');if(gb)gb.style.width=(ok?100:pct)+'%';
    set('doxaHomeGoalPct',(ok?100:pct)+'%');
    const stage=$('doxa30BreadStage');if(stage&&!stage.classList.contains('earned')){stage.classList.toggle('earned-static',ok)}
    const week=$('doxaHomeWeek');
    if(week){
      const fmt=new Intl.DateTimeFormat('pt-BR',{weekday:'short'}),arr=[];
      for(let off=6;off>=0;off--){
        const k=addDays(today,-off),hit=done(k),saved=st.days[k]?.saved&&!st.days[k]?.earned,isT=off===0;
        const label=isT?'Hoje':fmt.format(parse(k)).replace('.','');
        arr.push('<span class="doxa-home-day '+(hit?'done ':'')+(saved?'saved ':'')+(isT?'today':'')+'"><i><img src="'+(hit?'assets/doxa_pao_ativo.png':'assets/doxa_pao_inativo.png')+'" alt=""></i><small>'+esc(label)+'</small></span>');
      }
      week.innerHTML=arr.join('');
    }
    // linha extra no cartão: plano do dia ou guardados
    const card=$('doxaHomeBreadCard');
    if(card){
      let extra=card.querySelector('.doxa-bread-extra');
      if(!extra){extra=document.createElement('span');extra.className='doxa-bread-extra';card.appendChild(extra)}
      const pi=planInfo();
      extra.innerHTML=(pi&&!pi.finished?'<b>Plano</b> '+esc(pi.portion.map(k=>chLabel(k)).join(' · '))+(pi.behind?' <em>('+pi.behind+' dia'+(pi.behind>1?'s':'')+' atrasado)</em>':''):'')
        +(st.freezes?'<i class="doxa-bread-frz">'+st.freezes+' pão'+(st.freezes>1?'es':'')+' guardado'+(st.freezes>1?'s':'')+'</i>':'');
      extra.hidden=!extra.innerHTML;
    }
  }

  /* ---------- tela do Pão Diário ---------- */
  let calMonth=null;
  function ensureSheet(){
    let s=$('doxaBreadSheet');if(s)return s;
    s=document.createElement('section');s.id='doxaBreadSheet';s.className='doxa-bread-sheet';s.setAttribute('aria-hidden','true');
    s.innerHTML='<div class="dbs-bar"><button type="button" id="dbsBack" aria-label="Voltar">‹</button><strong>Pão Diário</strong><span></span></div><div class="dbs-scroll" id="dbsBody"></div>';
    document.body.appendChild(s);
    $('dbsBack').onclick=closeSheet;
    $('dbsBody').addEventListener('click',onSheetClick);
    return s;
  }
  function openSheet(){ensureSheet();calMonth=dk().slice(0,7);renderSheet();$('doxaBreadSheet').classList.add('on');$('doxaBreadSheet').setAttribute('aria-hidden','false')}
  function closeSheet(){const s=$('doxaBreadSheet');if(!s)return;s.classList.remove('on');s.setAttribute('aria-hidden','true')}
  function calendar(){
    const [y,m]=calMonth.split('-').map(Number),first=new Date(y,m-1,1,12),daysIn=new Date(y,m,0).getDate();
    const title=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(first);
    const lead=(first.getDay()+6)%7,today=dk();
    let cells='';for(let i=0;i<lead;i++)cells+='<span></span>';
    let count=0;
    for(let d=1;d<=daysIn;d++){
      const k=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'),rec=st.days[k];
      const cls=rec?.earned?'on':rec?.saved?'saved':(rec?.ch?.length?'part':'');if(rec?.earned||rec?.saved)count++;
      cells+='<span class="dbs-d '+cls+(k===today?' today':'')+(k>today?' future':'')+'">'+d+'</span>';
    }
    return '<div class="dbs-cal"><div class="dbs-cal-head"><button type="button" data-cal="-1" aria-label="Mês anterior">‹</button><strong>'+esc(title)+'</strong><button type="button" data-cal="1" aria-label="Próximo mês"'+(calMonth>=today.slice(0,7)?' disabled':'')+'>›</button></div>'
      +'<div class="dbs-week">'+['S','T','Q','Q','S','S','D'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="dbs-grid">'+cells+'</div>'
      +'<div class="dbs-legend"><span><i class="on"></i>Conquistado</span><span><i class="saved"></i>Pão guardado</span><span><i class="part"></i>Leitura parcial</span></div>'
      +'<p class="dbs-month-count">'+count+' dia'+(count===1?'':'s')+' neste mês</p></div>';
  }
  function renderSheet(){
    const b=$('dbsBody');if(!b||!$('doxaBreadSheet')?.classList.contains('on')&&b.innerHTML)return;
    const today=dk(),read=st.days[today]?.ch?.length||0,s=streak(),pi=planInfo();
    const toMile=MILESTONE-(s%MILESTONE);
    b.innerHTML=
      '<div class="dbs-hero"><div class="dbs-bread"><img src="assets/'+(done(today)?'doxa_pao_ativo.png':'doxa_pao_inativo.png')+'" alt=""></div>'
      +'<div class="dbs-stats"><div><b>'+s+'</b><small>dias seguidos</small></div><div><b>'+Math.max(st.best,s)+'</b><small>recorde</small></div><div><b>'+st.freezes+'</b><small>guardados</small></div></div>'
      +'<p class="dbs-mile">'+(s>0?'Faltam '+toMile+' dia'+(toMile>1?'s':'')+' para a Mesa dos Pães':'Leia hoje para começar sua sequência')+'</p></div>'

      +'<h3>Meta diária</h3><div class="dbs-card dbs-goal"><div><strong>'+st.goal+' capítulo'+(st.goal>1?'s':'')+' por dia</strong><small>Hoje: '+Math.min(read,st.goal)+' de '+st.goal+'</small></div>'
      +'<div class="dbs-stepper"><button type="button" data-goal="-1"'+(st.goal<=1?' disabled':'')+'>−</button><span>'+st.goal+'</span><button type="button" data-goal="1"'+(st.goal>=5?' disabled':'')+'>+</button></div></div>'

      +'<h3>Plano de leitura</h3>'+(pi?planCard(pi):plansList())

      +'<h3>Histórico</h3>'+calendar()

      +'<h3>Como funciona</h3><div class="dbs-card dbs-help">'
      +'<p><b>Conquistar:</b> leia até o fim do capítulo. O capítulo só conta depois de um tempo mínimo de leitura, proporcional ao tamanho dele.</p>'
      +'<p><b>Pão guardado:</b> a cada '+FREEZE_EVERY+' dias seguidos você ganha um (até '+MAX_FREEZES+'). Se perder um único dia, ele é usado sozinho e a sequência continua.</p>'
      +'<p><b>Mesa dos Pães:</b> a cada '+MILESTONE+' dias seguidos, uma lembrança dos doze pães diante do Senhor.</p></div>';
  }
  function planCard(pi){
    if(pi.finished)return '<div class="dbs-card"><strong>'+esc(pi.plan.name)+'</strong><p class="dbs-done">Plano concluído. Glória a Deus!</p><button type="button" class="dbs-link" data-plan-stop>Escolher outro plano</button></div>';
    return '<div class="dbs-card dbs-plan"><div class="dbs-plan-head"><div><strong>'+esc(pi.plan.name)+'</strong><small>Dia '+pi.dayNum+' de '+pi.total+(pi.behind?' · '+pi.behind+' dia'+(pi.behind>1?'s':'')+' atrasado':'')+'</small></div><b>'+pi.pct+'%</b></div>'
      +'<div class="dbs-track"><i style="width:'+pi.pct+'%"></i></div>'
      +'<div class="dbs-chips">'+pi.portion.map(k=>'<button type="button" class="dbs-chip'+(pi.doneSet.has(k)?' on':'')+'" data-open-ch="'+k+'">'+(pi.doneSet.has(k)?'✓ ':'')+esc(chLabel(k))+'</button>').join('')+'</div>'
      +'<button type="button" class="dbs-link" data-plan-stop>Sair do plano</button></div>';
  }
  function plansList(){
    return '<div class="dbs-plans">'+Object.entries(PLANS).map(([id,p])=>'<button type="button" class="dbs-card dbs-plan-opt" data-plan="'+id+'"><strong>'+esc(p.name)+'</strong><small>'+esc(p.desc)+'</small><span>'+p.days+' dias ›</span></button>').join('')+'</div>';
  }
  function openChapter(key){
    const [book,c]=key.split('.');
    try{
      let m=(CORPORA[mode]&&mode!=='hyper')?mode:'almeida',bi=CORPORA[m].books.findIndex(b=>b.book===book);
      if(bi<0){m='almeida';bi=CORPORA[m].books.findIndex(b=>b.book===book)}
      if(bi<0)return;
      mode=m;positions[m]={b:bi,c:Number(c)};
      closeSheet();window.DoxaHome?.hide?.(false);openPanel('ler');renderReader();try{savePrefs()}catch(e){}window.scrollTo(0,0);
    }catch(e){}
  }
  async function onSheetClick(e){
    const g=e.target.closest('[data-goal]');if(g){st.goal=Math.max(1,Math.min(5,st.goal+Number(g.dataset.goal)));const d=st.days[dk()];if(d&&!d.earned&&d.ch.length>=st.goal){d.earned=true}persist();renderSheet();renderHome();return}
    const c=e.target.closest('[data-cal]');if(c){const [y,m]=calMonth.split('-').map(Number),d=new Date(y,m-1+Number(c.dataset.cal),1);calMonth=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');renderSheet();return}
    const p=e.target.closest('[data-plan]');if(p){startPlan(p.dataset.plan);toast('Plano iniciado: '+PLANS[p.dataset.plan].name);return}
    if(e.target.closest('[data-plan-stop]')){if(confirm('Sair do plano atual? O progresso dele será perdido.'))stopPlan();return}
    const o=e.target.closest('[data-open-ch]');if(o){openChapter(o.dataset.openCh)}
  }

  /* ---------- instalação ---------- */
  function init(){
    load();
    if(applyFreeze())setTimeout(()=>toast('Um pão guardado protegeu sua sequência'),1500);
    syncLegacy();
    setInterval(tick,1000);
    window.addEventListener('scroll',()=>{if(curKey)check()},{passive:true});
    // o cartão da Home abre a tela completa
    document.addEventListener('click',e=>{
      if(!e.target.closest('#doxaHomeBreadCard'))return;
      e.preventDefault();e.stopImmediatePropagation();openSheet();
    },true);
    renderHome();
    // vira o dia com o app aberto
    let lastDay=dk();setInterval(()=>{if(dk()!==lastDay){lastDay=dk();applyFreeze();syncLegacy();renderHome()}},30000);
  }
  window.DoxaBread={open:openSheet,renderHome,streak,state:()=>st,milestone:()=>showMilestone(streak()||MILESTONE)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
