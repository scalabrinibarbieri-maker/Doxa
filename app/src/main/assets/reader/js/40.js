(()=>{
  'use strict';
  /* Doxa 51 · Linha do Tempo bíblica — Fase 1: Gênesis
     Nada aqui é importado de cronologias prontas. Os anos são CALCULADOS a partir do próprio
     texto: idades ao gerar e anos de vida de Gênesis 5 e 11, e as idades dadas em Gn 12–50.
     Três tradições: Texto Massorético (TM), Septuaginta (LXX, Swete) e Pentateuco Samaritano (SP).
     "Ano" = anos desde a criação, contando a partir do texto escolhido.
     Onde o texto não dá a idade diretamente, o valor é derivado e marcado como tal. */
  if(window.__doxa51ChronoInstalled)return;
  window.__doxa51ChronoInstalled=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TR=['TM','LXX','SP'];
  const TR_NAME={TM:'pelo Texto Massorético',LXX:'pela Septuaginta',SP:'pelo Pentateuco Samaritano'};
  let tradition='TM';
  try{const t=localStorage.getItem('doxa:chrono:tr');if(TR.includes(t))tradition=t}catch(e){}

  /* ---------- 1. Os números do texto ----------
     [chave, nome, idade ao gerar o próximo [TM,LXX,SP], anos de vida [TM,LXX,SP], referência] */
  const G5=[
    ['adao','Adão',[130,230,130],[930,930,930],'Gn 5:3–5'],
    ['sete','Sete',[105,205,105],[912,912,912],'Gn 5:6–8'],
    ['enos','Enos',[90,190,90],[905,905,905],'Gn 5:9–11'],
    ['caina','Cainã',[70,170,70],[910,910,910],'Gn 5:12–14'],
    ['maalalel','Maalalel',[65,165,65],[895,895,895],'Gn 5:15–17'],
    ['jarede','Jarede',[162,162,62],[962,962,847],'Gn 5:18–20'],
    ['enoque','Enoque',[65,165,65],[365,365,365],'Gn 5:21–24'],
    ['matusalem','Matusalém',[187,167,67],[969,969,720],'Gn 5:25–27'],
    ['lameque','Lameque',[182,188,53],[777,753,653],'Gn 5:28–31'],
    ['noe','Noé',[502,502,502],[950,950,950],'Gn 5:32; 7:6; 9:28–29; 11:10'],
  ];
  // Gn 11: Sem → Terá. A LXX tem uma geração a mais (Cainã) entre Arfaxade e Selá (cf. Lc 3:36).
  const G11=[
    ['sem','Sem',[100,100,100],[600,600,600],'Gn 11:10–11'],
    ['arfaxade','Arfaxade',[35,135,135],[438,565,438],'Gn 11:12–13'],
    ['caina2','Cainã (só na LXX)',[null,130,null],[null,460,null],'Gn 11:13b (LXX); Lc 3:36'],
    ['sela','Selá',[30,130,130],[433,460,433],'Gn 11:14–15'],
    ['heber','Héber',[34,134,134],[464,504,404],'Gn 11:16–17'],
    ['pelegue','Pelegue',[30,130,130],[239,339,239],'Gn 11:18–19'],
    ['reu','Reú',[32,132,132],[239,339,239],'Gn 11:20–21'],
    ['serugue','Serugue',[30,130,130],[230,330,230],'Gn 11:22–23'],
    ['naor','Naor',[29,79,79],[148,208,148],'Gn 11:24–25'],
    ['tera','Terá',[70,70,70],[205,205,145],'Gn 11:26, 32'],
  ];
  // Patriarcas — idades dadas no texto (iguais nas três tradições)
  // [chave, nome, pai, idade do pai ao nascer, anos de vida (null = não informado), ref, derivado?]
  const PAT=[
    ['abraao','Abraão','tera',70,175,'Gn 11:26; 25:7',false],
    ['sara','Sara','abraao',10,127,'Gn 17:17; 23:1',true],
    ['ismael','Ismael','abraao',86,137,'Gn 16:16; 25:17',false],
    ['isaque','Isaque','abraao',100,180,'Gn 21:5; 35:28',false],
    ['esau','Esaú','isaque',60,null,'Gn 25:26',false],
    ['jaco','Jacó','isaque',60,147,'Gn 25:26; 47:28',false],
    ['jose','José','jaco',91,110,'Gn 41:46; 45:6; 47:9; 50:26',true],
  ];
  const NOTE_DERIVED={
    jose:'Jacó tinha 91 anos quando José nasceu — valor derivado de Gn 41:46, 45:6 e 47:9: Jacó tinha 130 quando José tinha 39 (30 + 7 anos de fartura + 2 de fome).',
    sara:'Sara era 10 anos mais nova que Abraão (Gn 17:17).',
  };

  /* ---------- 2. Cálculo ---------- */
  function compute(tr){
    const ti=TR.indexOf(tr),P={},order=[];
    let y=0;
    for(const [k,n,beget,life,ref] of G5){
      P[k]={k,n,b:y,d:y+life[ti],ref,life:life[ti],g:beget[ti]};order.push(k);
      y+=beget[ti];
    }
    // Sem nasce quando Noé tem 502: Sem tinha 100 anos dois anos após o dilúvio (Gn 11:10; 7:6)
    y=P.noe.b+502;
    for(const [k,n,beget,life,ref] of G11){
      if(beget[ti]==null)continue;              // Cainã só existe na LXX
      P[k]={k,n,b:y,d:y+life[ti],ref,life:life[ti],g:beget[ti]};order.push(k);
      y+=beget[ti];
    }
    for(const [k,n,f,age,life,ref,der] of PAT){
      const b=P[f].b+age;P[k]={k,n,b,d:life==null?null:b+life,ref,life,der};order.push(k);
    }
    P.enoque.taken=true;
    return{P,order,flood:P.noe.b+600};
  }
  const CH={};TR.forEach(t=>CH[t]=compute(t));

  /* ---------- 3. Cada trecho de Gênesis ancorado em "pessoa + idade" ----------
     [cap, vers, pessoa, idade, aproximado?, rótulo] — vale até a próxima âncora. */
  const A=[
    [1,1,'adao',0,false,'Criação'],
    [3,1,'adao',0,true,'Antes do nascimento de Sete'],
    [4,25,'adao','g',false,'Nasce Sete'],[4,26,'sete','g',false,'Nasce Enos'],
    [5,1,'adao',0,false,'Geração de Adão'],[5,3,'adao','g',false,'Nasce Sete'],[5,5,'adao','d',false,'Morre Adão'],
    [5,6,'sete','g',false,'Nasce Enos'],[5,8,'sete','d',false,'Morre Sete'],
    [5,9,'enos','g',false,'Nasce Cainã'],[5,11,'enos','d',false,'Morre Enos'],
    [5,12,'caina','g',false,'Nasce Maalalel'],[5,14,'caina','d',false,'Morre Cainã'],
    [5,15,'maalalel','g',false,'Nasce Jarede'],[5,17,'maalalel','d',false,'Morre Maalalel'],
    [5,18,'jarede','g',false,'Nasce Enoque'],[5,20,'jarede','d',false,'Morre Jarede'],
    [5,21,'enoque','g',false,'Nasce Matusalém'],[5,23,'enoque','d',false,'Enoque é tomado por Deus'],
    [5,25,'matusalem','g',false,'Nasce Lameque'],[5,27,'matusalem','d',false,'Morre Matusalém'],
    [5,28,'lameque','g',false,'Nasce Noé'],[5,31,'lameque','d',false,'Morre Lameque'],
    [5,32,'noe',500,false,'Noé gera Sem, Cam e Jafé'],
    [6,1,'noe',480,true,'Antes do dilúvio (120 anos, Gn 6:3)'],
    [6,9,'noe',500,true,'Construção da arca'],
    [7,6,'noe',600,false,'Começa o dilúvio'],
    [8,13,'noe',601,false,'As águas secam'],
    [9,1,'noe',601,true,'Aliança com Noé'],
    [9,28,'noe',950,false,'Morre Noé'],
    [10,1,'sem',100,true,'Descendentes após o dilúvio'],
    [10,25,'pelegue',0,false,'Nasce Pelegue — “em seus dias se dividiu a terra”'],
    [11,1,'pelegue',0,true,'Babel, “nos dias de Pelegue” (Gn 10:25)'],
    [11,10,'sem','g',false,'Nasce Arfaxade'],[11,11,'sem','d',false,'Morre Sem'],
    [11,12,'arfaxade','g',false,'Nasce o filho de Arfaxade'],[11,13,'arfaxade','d',false,'Morre Arfaxade'],
    [11,14,'sela','g',false,'Nasce Héber'],[11,15,'sela','d',false,'Morre Selá'],
    [11,16,'heber','g',false,'Nasce Pelegue'],[11,17,'heber','d',false,'Morre Héber'],
    [11,18,'pelegue',30,false,'Nasce Reú'],[11,19,'pelegue','d',false,'Morre Pelegue'],
    [11,20,'reu','g',false,'Nasce Serugue'],[11,21,'reu','d',false,'Morre Reú'],
    [11,22,'serugue','g',false,'Nasce Naor'],[11,23,'serugue','d',false,'Morre Serugue'],
    [11,24,'naor','g',false,'Nasce Terá'],[11,25,'naor','d',false,'Morre Naor'],
    [11,26,'tera',70,false,'Nascem Abrão, Naor e Harã'],
    [11,27,'abraao',70,true,'A família de Terá vai a Harã'],[11,32,'tera','d',false,'Morre Terá'],
    [12,1,'abraao',75,false,'Abrão parte de Harã'],
    [13,1,'abraao',76,true,'Abrão e Ló se separam'],
    [14,1,'abraao',80,true,'Guerra dos reis; Melquisedeque'],
    [15,1,'abraao',85,true,'Aliança entre as partes'],
    [16,1,'abraao',85,false,'Hagar (10 anos em Canaã, Gn 16:3)'],[16,16,'abraao',86,false,'Nasce Ismael'],
    [17,1,'abraao',99,false,'Aliança da circuncisão'],
    [18,1,'abraao',99,false,'Promessa de Isaque; Sodoma'],
    [20,1,'abraao',99,true,'Abraão em Gerar'],
    [21,1,'abraao',100,false,'Nasce Isaque'],[21,8,'abraao',103,true,'Isaque é desmamado'],
    [22,1,'isaque',20,true,'O sacrifício de Isaque (idade não informada)'],
    [23,1,'sara',127,false,'Morre Sara'],
    [24,1,'isaque',40,false,'Isaque e Rebeca'],
    [25,1,'abraao',140,true,'Abraão e Quetura'],[25,7,'abraao',175,false,'Morre Abraão'],
    [25,12,'ismael',137,false,'Morre Ismael'],
    [25,19,'isaque',60,false,'Nascem Esaú e Jacó'],[25,27,'jaco',15,true,'Esaú vende a primogenitura'],
    [26,1,'isaque',80,true,'Isaque em Gerar'],[26,34,'esau',40,false,'Esaú se casa'],
    [27,1,'jaco',77,true,'Jacó recebe a bênção'],
    [28,1,'jaco',77,true,'Jacó foge para Harã; Betel'],
    [29,1,'jaco',77,true,'Jacó serve Labão'],[29,21,'jaco',84,true,'Jacó se casa com Lia e Raquel'],
    [30,22,'jaco',91,false,'Nasce José'],
    [31,1,'jaco',97,true,'Jacó volta a Canaã (20 anos com Labão, Gn 31:38)'],
    [34,1,'jaco',99,true,'Diná em Siquém'],
    [35,1,'jaco',100,true,'Jacó em Betel'],[35,28,'isaque',180,false,'Morre Isaque'],
    [36,1,'esau',100,true,'Descendentes de Esaú'],
    [37,1,'jose',17,false,'José é vendido'],
    [38,1,'jose',20,true,'Judá e Tamar'],
    [39,1,'jose',17,true,'José na casa de Potifar'],
    [40,1,'jose',28,true,'José na prisão'],
    [41,1,'jose',30,false,'José diante de Faraó'],[41,53,'jose',37,false,'Começa a fome'],
    [42,1,'jose',38,true,'Os irmãos descem ao Egito'],
    [45,1,'jose',39,false,'José se revela (2º ano da fome, Gn 45:6)'],
    [46,1,'jaco',130,false,'Jacó desce ao Egito'],
    [47,27,'jaco',147,false,'Morre Jacó'],
    [50,22,'jose',110,false,'Morre José'],
  ];
  const ageOf=(p,a)=>a==='g'?p.g:a==='d'?p.life:a;
  function anchorFor(c,v){let a=null;for(const x of A){if(x[0]<c||(x[0]===c&&x[1]<=v))a=x;else break}return a}
  const EV=A.filter(x=>!x[4]).map(x=>({c:x[0],v:x[1],k:x[2],a:x[3],t:x[5]}));

  /* ---------- 4. Tela ---------- */
  function eraName(ch,y){if(y<ch.flood)return'Antes do Dilúvio';if(y<ch.P.abraao.b)return'Do Dilúvio a Abraão';return'Os patriarcas'}
  function sheet(){
    let s=$('doxaChronoSheet');if(s)return s;
    const bd=document.createElement('div');bd.id='doxaChronoBackdrop';bd.className='tl2-backdrop';document.body.appendChild(bd);
    s=document.createElement('section');s.id='doxaChronoSheet';s.className='tl2-sheet';document.body.appendChild(s);
    bd.addEventListener('click',close);return s;
  }
  function close(){$('doxaChronoSheet')?.classList.remove('on');$('doxaChronoBackdrop')?.classList.remove('on')}
  function goTo(c,v){
    try{
      const cp=CORPORA[mode],bi=cp.books.findIndex(b=>b.book==='Gen');if(bi<0)return;
      positions[mode]={...(positions[mode]||{}),b:bi,c};focusVerse=v;
      try{savePrefs()}catch(e){}
      renderReader();close();
      setTimeout(()=>document.getElementById('v'+v)?.scrollIntoView({block:'center',behavior:'smooth'}),80);
    }catch(e){}
  }
  let lastRef=null;
  function render(ref){
    lastRef=ref;
    const ch=CH[tradition],a=anchorFor(ref.chapter,ref.verse);if(!a)return;
    const [ac,av,k,rawAge,aprox,label]=a;
    const p=ch.P[k];if(!p)return;
    const age=ageOf(p,rawAge);
    const y=p.b+age;
    const alive=ch.order.map(x=>ch.P[x]).filter(q=>q.b<=y&&(q.d==null||q.d>=y));
    const maxY=Math.max(...ch.order.map(x=>ch.P[x].d??ch.P[x].b+100));
    const pct=v=>Math.max(0,Math.min(100,v/maxY*100)).toFixed(2);
    const rows=alive.map(q=>{
      const qa=y-q.b,born=q.b===y,dies=q.d===y;
      const tag=born?'<em class="b">nasce</em>':dies?(q.taken?'<em class="t">tomado por Deus</em>':'<em class="d">morre</em>'):(q.d==null?'<em class="u">morte não registrada</em>':'');
      return '<div class="tl2-row'+(q.k===k?' me':'')+'"><div class="tl2-who"><b>'+esc(q.n)+'</b><span>'+qa+(qa===1?' ano':' anos')+'</span>'+tag+'</div>'
        +'<div class="tl2-bar"><i style="left:'+pct(q.b)+'%;width:'+pct((q.d??y)-q.b)+'%"></i><u style="left:'+pct(y)+'%"></u></div></div>';
    }).join('');
    const evY=EV.map(e=>{const q=ch.P[e.k];return{...e,y:q?q.b+ageOf(q,e.a):null}}).filter(e=>e.y!=null).sort((x,z)=>x.y-z.y);
    const prev=[...evY].reverse().find(e=>e.y<y);
    const next=evY.find(e=>e.y>y);
    const evBtn=(e,dir)=>e?'<button type="button" class="tl2-ev" data-go="'+e.c+','+e.v+'"><small>'+(dir<0?'ANTES':'DEPOIS')+' · ANO '+e.y+'</small><b>'+esc(e.t)+'</b><span>Gn '+e.c+':'+e.v+'</span></button>':'<div class="tl2-ev empty"></div>';
    const notes=[];
    if(p.der&&NOTE_DERIVED[k])notes.push(NOTE_DERIVED[k]);
    if(tradition==='LXX'&&ch.P.matusalem.d>ch.flood&&y>=ch.flood-200&&y<=ch.P.matusalem.d+50)
      notes.push('Na Septuaginta (Swete), Matusalém morreria '+(ch.P.matusalem.d-ch.flood)+' anos depois do dilúvio — uma dificuldade conhecida desse texto. O Códice Alexandrino lê 187 anos em Gn 5:25, o que resolve o problema.');
    if(alive.some(q=>q.k==='caina2'))
      notes.push('Cainã, filho de Arfaxade, aparece só na Septuaginta (Gn 11:13) e em Lucas 3:36; não está no Texto Massorético nem no Samaritano.');
    const s=sheet();
    s.innerHTML='<div class="tl2-grab"></div>'
      +'<header class="tl2-head"><div><small>LINHA DO TEMPO · '+esc(ref.label||'')+'</small><strong>Ano '+y+'<span> desde a criação</span></strong></div><button type="button" id="tl2Close" aria-label="Fechar">×</button></header>'
      +'<div class="tl2-tr">'+TR.map(t=>'<button type="button" data-tr="'+t+'" class="'+(t===tradition?'on':'')+'">'+t+'</button>').join('')+'</div>'
      +'<div class="tl2-scroll">'
      +'<div class="tl2-anchor"><span class="tl2-era">'+eraName(ch,y)+'</span><b>'+esc(label)+'</b><p>'+esc(p.n)+' tem '+age+(age===1?' ano':' anos')+(aprox?' <em>(aproximado)</em>':'')+' · cálculo '+TR_NAME[tradition]+'</p></div>'
      +'<h4>Quem estava vivo <span>'+alive.length+'</span></h4><div class="tl2-rows">'+rows+'</div>'
      +'<div class="tl2-scale"><span>Criação</span><span>ano '+maxY+'</span></div>'
      +'<h4>Antes e depois</h4><div class="tl2-evs">'+evBtn(prev,-1)+evBtn(next,1)+'</div>'
      +(notes.length?'<div class="tl2-notes">'+notes.map(n=>'<p>'+esc(n)+'</p>').join('')+'</div>':'')
      +'<p class="tl2-src">Anos calculados a partir do próprio texto: idades ao gerar e anos de vida de Gênesis 5 e 11, e as idades informadas em Gênesis 12–50. Trechos sem idade explícita aparecem como aproximados.</p>'
      +'</div>';
    s.classList.add('on');$('doxaChronoBackdrop').classList.add('on');
    s.querySelector('#tl2Close').onclick=close;
    s.querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{tradition=b.dataset.tr;try{localStorage.setItem('doxa:chrono:tr',tradition)}catch(e){}render(lastRef)});
    s.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const [c,v]=b.dataset.go.split(',').map(Number);goTo(c,v)});
  }
  const handles=ref=>!!ref&&ref.book==='Gen';
  window.DoxaChrono={render,close,handles,compute,anchorFor,CH};
})();
