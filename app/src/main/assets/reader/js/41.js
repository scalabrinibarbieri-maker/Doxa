(()=>{
  'use strict';
  /* Doxa 54 · Linha do Tempo — Fase 4: Novo Testamento
     O texto do NT não continua a contagem "desde a criação". Aqui os anos são d.C./a.C.,
     ancorados nas referências históricas que o próprio texto cita:
       Lc 3:1 (15º ano de Tibério) · Mt 2 (Herodes vivo no nascimento de Jesus) · Lc 3:23 (Jesus "com cerca de 30")
       Jo 2:13; 6:4; 11:55 (três Páscoas) · At 12:20–23 (morte de Herodes Agripa I) · At 18:2 (édito de Cláudio)
       At 18:12 (Gálio procônsul) · At 24:27 (Félix → Festo após dois anos) · Gl 1:18; 2:1 (3 e 14 anos)
     Anos internos: astronômicos (1 a.C. = 0, 5 a.C. = −4). */
  if(window.__doxa54NTInstalled||!window.DoxaChrono)return;
  window.__doxa54NTInstalled=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const yr=y=>y>0?y+' d.C.':(1-y)+' a.C.';
  const BOOKS=['Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'];
  const BPT={Matt:'Mt',Mark:'Mc',Luke:'Lc',John:'Jo',Acts:'At',Rom:'Rm','1Cor':'1 Co','2Cor':'2 Co',Gal:'Gl',Eph:'Ef',Phil:'Fp',Col:'Cl','1Thess':'1 Ts','2Thess':'2 Ts','1Tim':'1 Tm','2Tim':'2 Tm',Titus:'Tt',Phlm:'Fm',Heb:'Hb',Jas:'Tg','1Pet':'1 Pe','2Pet':'2 Pe','1John':'1 Jo','2John':'2 Jo','3John':'3 Jo',Jude:'Jd',Rev:'Ap'};
  const BNAME={Rom:'Romanos','1Cor':'1 Coríntios','2Cor':'2 Coríntios',Gal:'Gálatas',Eph:'Efésios',Phil:'Filipenses',Col:'Colossenses','1Thess':'1 Tessalonicenses','2Thess':'2 Tessalonicenses','1Tim':'1 Timóteo','2Tim':'2 Timóteo',Titus:'Tito',Phlm:'Filemom',Heb:'Hebreus',Jas:'Tiago','1Pet':'1 Pedro','2Pet':'2 Pedro','1John':'1 João','2John':'2 João','3John':'3 João',Jude:'Judas',Rev:'Apocalipse'};

  /* ---------- autoridades: [chave, nome, função, início, fim, ref, grupo, fora do texto?] ---------- */
  const AUT=[
    ['augusto','César Augusto','imperador',-26,14,'Lc 2:1','roma'],
    ['tiberio','Tibério César','imperador',14,37,'Lc 3:1','roma'],
    ['caligula','Calígula','imperador (não citado no NT)',37,41,'—','roma',true],
    ['claudio','Cláudio','imperador',41,54,'At 11:28; 18:2','roma'],
    ['nero','Nero','imperador (“César”, At 25:11)',54,68,'At 25:11','roma'],
    ['domiciano','Domiciano','imperador (não citado no NT)',81,96,'—','roma',true],
    ['herodes','Herodes, o Grande','rei da Judeia',-36,-3,'Mt 2:1; Lc 1:5','herod'],
    ['arquelau','Arquelau','etnarca da Judeia',-3,6,'Mt 2:22','herod'],
    ['antipas','Herodes Antipas','tetrarca da Galileia',-3,39,'Lc 3:1; 13:31; 23:7','herod'],
    ['filipe_t','Filipe','tetrarca da Itureia',-3,34,'Lc 3:1','herod'],
    ['agripa1','Herodes Agripa I','rei da Judeia',41,44,'At 12:1–23','herod'],
    ['agripa2','Agripa II','rei',50,93,'At 25:13 – 26:32','herod'],
    ['aretas','Aretas IV','rei dos nabateus',-8,40,'2 Co 11:32','outro'],
    ['pilatos','Pôncio Pilatos','governador da Judeia',26,36,'Lc 3:1; Mt 27','gov'],
    ['sergio','Sérgio Paulo','procônsul de Chipre',46,48,'At 13:7','gov',true],
    ['galio','Gálio','procônsul da Acaia',51,52,'At 18:12','gov'],
    ['felix','Félix','governador da Judeia',52,59,'At 23:24 – 24:27','gov'],
    ['festo','Festo','governador da Judeia',59,62,'At 24:27 – 26:32','gov'],
    ['anas','Anás','sumo sacerdote (6–15 d.C.), ainda influente',6,36,'Lc 3:2; Jo 18:13; At 4:6','templo'],
    ['caifas','Caifás','sumo sacerdote',18,36,'Mt 26:3; Jo 18:13','templo'],
    ['ananias_s','Ananias','sumo sacerdote',47,59,'At 23:2; 24:1','templo',true],
  ];
  /* ---------- personagens: [chave, nome, nascimento (null), início da atuação, fim, ref, aproximado?, nota de fim] ---------- */
  const PES=[
    ['joao_b','João Batista',-5,29,31,'Lc 1:36,57; 3:1–2; Mt 14:10',true,'executado por Herodes Antipas'],
    ['jesus','Jesus',-4,29,33,'Lc 2:1–7; 3:23; Jo 2:13; 6:4; 11:55',true,'crucificado e ressuscitado'],
    ['pedro','Pedro',null,29,65,'Mt 4:18; Jo 21:18–19',true,''],
    ['tiago_z','Tiago, filho de Zebedeu',null,29,44,'Mt 4:21; At 12:2',false,'morto por Herodes Agripa I'],
    ['joao_ap','João, o apóstolo',null,29,98,'Mt 4:21; Ap 1:9',true,''],
    ['tiago_i','Tiago, irmão do Senhor',null,33,62,'Gl 1:19; At 15:13; Tg 1:1',true,''],
    ['estevao','Estêvão',null,33,34,'At 6–7',true,'apedrejado'],
    ['paulo','Paulo',null,34,66,'At 9; Gl 1:15–18; 2 Tm 4:6',true,''],
    ['barnabe','Barnabé',null,37,50,'At 9:27; 13–15',true,''],
    ['timoteo','Timóteo',null,49,67,'At 16:1; 2 Tm 1:2',true,''],
  ];
  /* ---------- onde estava Paulo ---------- */
  const PAULO=[
    [34,34,'Damasco — conversão','At 9:1–25'],[34,37,'Arábia e Damasco','Gl 1:17'],[37,37,'Jerusalém, 15 dias com Pedro','Gl 1:18; At 9:26'],
    [37,43,'Tarso e Cilícia','Gl 1:21; At 9:30'],[43,46,'Antioquia da Síria','At 11:25–26'],[46,48,'1ª viagem: Chipre e Galácia','At 13–14'],
    [48,49,'Antioquia','At 14:26–28'],[49,49,'Concílio de Jerusalém','At 15; Gl 2:1'],[49,52,'2ª viagem: Galácia, Macedônia, Atenas e Corinto','At 15:36 – 18:22'],
    [52,53,'Antioquia','At 18:22'],[53,56,'3ª viagem: Éfeso (três anos)','At 19:10; 20:31'],[56,57,'Macedônia e Grécia','At 20:1–3'],
    [57,57,'Jerusalém — preso no templo','At 21:27–36'],[57,59,'Preso em Cesareia (dois anos)','At 24:27'],[59,60,'Viagem a Roma e naufrágio em Malta','At 27–28:15'],
    [60,62,'Roma, em prisão domiciliar (dois anos)','At 28:30'],[62,66,'Libertado: Creta, Éfeso, Macedônia','1 Tm 1:3; Tt 1:5'],[66,67,'Roma — segunda prisão','2 Tm 1:17; 4:6'],
  ];
  /* ---------- cartas: [livro, ano, lugar de onde escreve, ref, aproximado?] ---------- */
  const CARTAS=[
    ['Jas',48,'Jerusalém','Tg 1:1',true],['Gal',49,'Antioquia','Gl 1–2',true],['1Thess',50,'Corinto','1 Ts 3:1–6; At 18:5',false],
    ['2Thess',51,'Corinto','2 Ts 1:1',false],['1Cor',55,'Éfeso','1 Co 16:8',false],['2Cor',56,'Macedônia','2 Co 2:13; 7:5',false],
    ['Rom',57,'Corinto','Rm 16:1,23; At 20:2–3',false],['Eph',61,'Roma (prisão)','Ef 3:1; 6:20',true],['Col',61,'Roma (prisão)','Cl 4:18',true],
    ['Phlm',61,'Roma (prisão)','Fm 1,9',true],['Phil',62,'Roma (prisão)','Fp 1:13; 4:22',true],['1Tim',63,'Macedônia','1 Tm 1:3',true],
    ['Titus',63,'Macedônia (?)','Tt 1:5; 3:12',true],['1Pet',63,'“Babilônia” (Roma)','1 Pe 5:13',true],['Heb',65,'“da Itália”','Hb 13:24',true],
    ['2Pet',65,'Roma (?)','2 Pe 1:14',true],['Jude',66,'—','Jd 1',true],['2Tim',66,'Roma — segunda prisão','2 Tm 1:17; 4:6',false],
    ['1John',90,'Éfeso (?)','1 Jo',true],['2John',90,'Éfeso (?)','2 Jo',true],['3John',90,'Éfeso (?)','3 Jo',true],['Rev',95,'Ilha de Patmos','Ap 1:9',true],
  ];
  const CARTA={};CARTAS.forEach(c=>CARTA[c[0]]=c);
  /* ---------- âncoras dos Evangelhos e de Atos: [cap, vers, ano, aproximado?, rótulo] ---------- */
  const A={
    Matt:[[1,18,-4,true,'O nascimento de Jesus'],[2,1,-4,true,'Os magos; Herodes ainda vivo'],[2,19,-3,false,'Morre Herodes; volta do Egito'],
      [3,1,29,false,'João Batista começa a pregar'],[3,13,29,true,'O batismo de Jesus'],[4,12,30,true,'João preso; Jesus na Galileia'],[5,1,30,true,'O Sermão do Monte'],
      [10,1,31,true,'Os doze são enviados'],[11,2,31,true,'João, na prisão, envia discípulos'],[14,1,31,true,'João Batista é morto'],[14,13,32,true,'A multiplicação dos pães (Páscoa, Jo 6:4)'],
      [16,13,32,true,'Em Cesareia de Filipe'],[17,1,32,true,'A transfiguração'],[19,1,33,true,'Rumo à Judeia'],[21,1,33,true,'A entrada em Jerusalém'],
      [26,1,33,true,'A Páscoa e a prisão'],[27,1,33,true,'A crucificação'],[28,1,33,true,'A ressurreição']],
    Mark:[[1,1,29,false,'João Batista no deserto'],[1,9,29,true,'O batismo de Jesus'],[1,14,30,true,'Jesus na Galileia'],[3,13,30,true,'Os doze'],
      [6,14,31,true,'João Batista é morto'],[6,30,32,true,'A multiplicação dos pães'],[8,27,32,true,'Em Cesareia de Filipe'],[9,2,32,true,'A transfiguração'],
      [10,1,33,true,'Rumo à Judeia'],[11,1,33,true,'A entrada em Jerusalém'],[14,1,33,true,'A Páscoa e a prisão'],[15,1,33,true,'A crucificação'],[16,1,33,true,'A ressurreição']],
    Luke:[[1,5,-6,true,'O anjo aparece a Zacarias'],[1,26,-5,true,'A anunciação a Maria'],[1,57,-5,true,'Nasce João Batista'],[2,1,-4,true,'O nascimento de Jesus'],
      [2,22,-4,true,'Apresentação no templo'],[2,41,8,true,'Jesus aos 12 anos no templo'],[3,1,29,false,'O 15º ano de Tibério'],[3,21,29,true,'O batismo de Jesus'],
      [4,14,30,true,'Jesus na Galileia'],[6,12,30,true,'Os doze'],[9,7,31,true,'Herodes perplexo'],[9,10,32,true,'A multiplicação dos pães'],[9,28,32,true,'A transfiguração'],
      [9,51,32,true,'Rumo a Jerusalém'],[19,28,33,true,'A entrada em Jerusalém'],[22,1,33,true,'A Páscoa e a prisão'],[23,1,33,true,'Diante de Pilatos e Herodes'],[24,1,33,true,'A ressurreição']],
    John:[[1,19,29,true,'O testemunho de João Batista'],[2,1,29,true,'As bodas em Caná'],[2,13,30,true,'A primeira Páscoa'],[4,1,30,true,'Em Samaria'],
      [5,1,31,true,'Uma festa dos judeus'],[6,4,32,true,'A Páscoa da multiplicação'],[7,2,32,true,'A festa dos Tabernáculos'],[10,22,32,true,'A festa da Dedicação'],
      [11,1,33,true,'Lázaro'],[12,1,33,true,'Seis dias antes da Páscoa'],[13,1,33,true,'A última ceia'],[18,1,33,true,'A prisão'],[19,1,33,true,'A crucificação'],
      [20,1,33,true,'A ressurreição'],[21,1,33,true,'No mar da Galileia']],
    Acts:[[1,1,33,true,'Ascensão'],[2,1,33,true,'Pentecostes'],[3,1,33,true,'Pedro e João no templo'],[6,1,34,true,'Os sete; Estêvão'],[8,1,34,true,'A dispersão; Filipe em Samaria'],
      [9,1,34,true,'Conversão de Saulo'],[9,26,37,true,'Saulo em Jerusalém (Gl 1:18)'],[10,1,38,true,'Cornélio'],[11,19,43,true,'Antioquia; “cristãos”'],
      [11,27,45,true,'A fome no tempo de Cláudio'],[12,1,44,false,'Tiago morto; Pedro preso'],[12,20,44,false,'Morre Herodes Agripa I'],[13,1,46,true,'A primeira viagem missionária'],
      [15,1,49,true,'O Concílio de Jerusalém'],[15,36,49,true,'A segunda viagem missionária'],[16,11,50,true,'Filipos'],[17,1,50,true,'Tessalônica, Bereia e Atenas'],
      [18,1,50,true,'Corinto; Áquila e Priscila (édito de Cláudio)'],[18,12,51,false,'Paulo diante de Gálio'],[18,23,53,true,'A terceira viagem missionária'],
      [19,1,53,true,'Éfeso'],[20,1,56,true,'Macedônia e Grécia'],[21,17,57,true,'Paulo em Jerusalém; a prisão'],[23,23,57,true,'Levado a Cesareia'],
      [24,27,59,false,'Festo sucede Félix'],[25,13,59,false,'Diante de Agripa II'],[27,1,59,true,'A viagem a Roma'],[28,11,60,true,'Chegada a Roma'],[28,30,62,true,'Dois anos em Roma']],
  };
  function locate(ref){
    if(CARTA[ref.book]){const c=CARTA[ref.book];return{y:c[1],ap:c[4],label:(ref.book==='Rev'?'Livro escrito em ':'Carta escrita em ')+(c[4]?'≈ ':'')+yr(c[1]),ctx:'Escrita de: '+c[2]+' · '+c[3],ac:1,av:1,letter:c}}
    const list=A[ref.book];if(!list)return null;
    let a=null;for(const x of list){if(x[0]<ref.chapter||(x[0]===ref.chapter&&x[1]<=ref.verse))a=x;else break}
    if(!a)return null;
    return{y:a[2],ap:a[3],label:a[4],ctx:'',ac:a[0],av:a[1]};
  }
  const handles=ref=>!!ref&&BOOKS.includes(ref.book)&&!!locate(ref);
  function era(y){if(y<29)return'Nascimento e infância de Jesus';if(y<=33)return'O ministério de Jesus';if(y<46)return'A igreja em Jerusalém e na Judeia';if(y<58)return'As viagens de Paulo';if(y<=67)return'Paulo prisioneiro e os últimos anos';return'O fim da era apostólica'}
  function events(){
    const out=[];
    for(const b of Object.keys(A))for(const x of A[b])out.push({book:b,c:x[0],v:x[1],y:x[2],t:x[4],ap:x[3]});
    for(const c of CARTAS)out.push({book:c[0],c:1,v:1,y:c[1],t:'Carta: '+BNAME[c[0]],ap:c[4]});
    out.sort((p,q)=>p.y-q.y||BOOKS.indexOf(p.book)-BOOKS.indexOf(q.book)||p.c-q.c||p.v-q.v);
    const seen=new Set();return out.filter(e=>{const k=e.y+'|'+e.t;if(seen.has(k))return false;seen.add(k);return true});
  }
  const EVS=events();

  function sheet(){
    let s=$('doxaChronoNT');if(s)return s;
    const bd=document.createElement('div');bd.id='doxaChronoNTBackdrop';bd.className='tl2-backdrop';document.body.appendChild(bd);
    s=document.createElement('section');s.id='doxaChronoNT';s.className='tl2-sheet';document.body.appendChild(s);
    bd.addEventListener('click',close);return s;
  }
  function close(){$('doxaChronoNT')?.classList.remove('on');$('doxaChronoNTBackdrop')?.classList.remove('on')}
  function goTo(book,c,v){
    try{
      const cp=CORPORA[mode],bi=cp.books.findIndex(b=>b.book===book);if(bi<0)return;
      positions[mode]={...(positions[mode]||{}),b:bi,c};focusVerse=v;try{savePrefs()}catch(e){}
      renderReader();close();setTimeout(()=>document.getElementById('v'+v)?.scrollIntoView({block:'center',behavior:'smooth'}),80);
    }catch(e){}
  }
  function bars(items,y,lo,hi,mine){
    const pct=v=>Math.max(0,Math.min(100,(v-lo)/(hi-lo)*100));
    return items.map(q=>'<div class="tl2-row'+(q.me?' me':'')+'"><div class="tl2-who"><b>'+esc(q.n)+'</b>'+(q.sub?'<span>'+esc(q.sub)+'</span>':'')+(q.tag||'')+'</div>'
      +'<div class="tl2-bar"><i'+(q.rg?' class="rg"':'')+' style="left:'+pct(q.s).toFixed(2)+'%;width:'+(pct(q.e)-pct(q.s)).toFixed(2)+'%"></i><u style="left:'+pct(y).toFixed(2)+'%"></u></div></div>').join('');
  }
  function render(ref){
    const L=locate(ref);if(!L)return;
    const y=L.y;
    // autoridades
    const aut=AUT.filter(a=>a[3]<=y&&a[4]>=y).map(a=>({n:a[1],sub:a[2],s:a[3],e:a[4],rg:true,
      tag:a[3]===y?'<em class="r">começa</em>':a[4]===y?'<em class="d">termina</em>':'',ext:a[7]}));
    // personagens
    const pes=PES.filter(p=>(p[2]!=null?p[2]:p[3])<=y&&p[4]>=y).map(p=>{
      const age=p[2]!=null?y-p[2]:null,active=y>=p[3];
      let tag='';
      if(p[2]===y)tag='<em class="b">nasce</em>';else if(p[4]===y&&p[7])tag='<em class="'+(p[0]==='jesus'?'t':'d')+'">'+esc(p[7])+'</em>';
      else if(active&&p[2]==null)tag='<em class="r">atuando</em>';
      return{n:p[1],sub:age!=null?(age===1?'1 ano':(age<=0?'recém-nascido':'≈ '+age+' anos')):'',s:p[2]??p[3],e:p[4],tag,me:false};
    });
    const lo0=Math.min(y-10,...aut.map(a=>a.s),...pes.map(p=>p.s)),hi0=Math.max(y+10,...aut.map(a=>a.e),...pes.map(p=>p.e));
    const lo=Math.max(lo0,y-60),hi=Math.min(hi0,y+60);
    // Paulo
    const pl=L.letter?[]:PAULO.filter(p=>(p[0]<=y&&y<p[1])||(p[0]===p[1]&&p[0]===y));
    const pauloHtml=pl.length?'<h4>Onde estava Paulo</h4>'+pl.map(p=>'<div class="tl2-prof"><div><b>'+esc(p[2])+'</b></div><p>'+(p[0]===p[1]?yr(p[0]):yr(p[0])+' – '+yr(p[1]))+' · '+esc(p[3])+'</p></div>').join(''):'';
    // cartas da mesma época
    const near=CARTAS.filter(c=>Math.abs(c[1]-y)<=3&&c[0]!==ref.book).sort((a,b)=>Math.abs(a[1]-y)-Math.abs(b[1]-y));
    const cartasHtml=near.length?'<h4>Cartas escritas por volta desta época</h4><div class="tl2-near">'+near.slice(0,6).map(c=>'<div><span class="reg reg-juda"></span><b>'+esc(BNAME[c[0]])+'</b><em>'+(c[4]?'≈ ':'')+yr(c[1])+'</em><small>de '+esc(c[2])+'</small></div>').join('')+'</div>':'';
    // antes e depois
    let here=EVS.findIndex(e=>e.book===ref.book&&e.c===L.ac&&e.v===L.av);
    if(here<0)here=EVS.findIndex(e=>e.y===y&&e.t===L.label);
    const prev=here>=0?EVS[here-1]:[...EVS].reverse().find(e=>e.y<y),next=here>=0?EVS[here+1]:EVS.find(e=>e.y>y);
    const evBtn=(e,dir)=>e?'<button type="button" class="tl2-ev" data-go="'+e.book+','+e.c+','+e.v+'"><small>'+(dir<0?'ANTES':'DEPOIS')+' · '+(e.ap?'≈ ':'')+yr(e.y).toUpperCase()+'</small><b>'+esc(e.t)+'</b><span>'+BPT[e.book]+' '+e.c+':'+e.v+'</span></button>':'<div class="tl2-ev empty"></div>';
    // notas
    const notes=['No Novo Testamento as datas são em anos d.C./a.C., ancoradas nas referências históricas que o próprio texto cita: o 15º ano de Tibério (Lc 3:1), Herodes vivo no nascimento de Jesus (Mt 2), Gálio em Corinto (At 18:12) e a troca de Félix por Festo (At 24:27).'];
    if(y<=0)notes.push('Jesus nasceu antes da morte de Herodes, o Grande (Mt 2:19), ocorrida em 4 a.C.; por isso o nascimento fica por volta de 6–4 a.C. — o calendário d.C. foi calculado séculos depois, com um pequeno erro.');
    if(y>=29&&y<=33&&['Matt','Mark','Luke','John'].includes(ref.book))notes.push('O ministério começa no 15º ano de Tibério (Lc 3:1, c. 29 d.C.) e João menciona três Páscoas (Jo 2:13; 6:4; 11:55). Por isso a crucificação fica em 33 d.C.; parte dos estudiosos prefere 30 d.C. As datas entre um evento e outro dos Evangelhos são aproximadas.');
    if(aut.some(a=>a.ext))notes.push('Algumas autoridades são citadas sem data no texto, ou nem são citadas (Calígula, Domiciano); seus períodos vêm da história romana.');
    if(L.letter)notes.push('A data e o lugar de escrita das cartas saem das indicações dentro delas (prisões, viagens, saudações) cruzadas com Atos; onde o texto não fecha, aparecem como aproximados (≈).');
    const s=sheet();
    s.innerHTML='<div class="tl2-grab"></div>'
      +'<header class="tl2-head"><div><small>LINHA DO TEMPO · '+esc(ref.label||'')+'</small><strong>'+(L.ap?'≈ ':'')+yr(y)+'</strong></div><button type="button" id="tlntClose" aria-label="Fechar">×</button></header>'
      +'<div class="tl2-scroll">'
      +'<div class="tl2-anchor"><span class="tl2-era">'+era(y)+'</span><b>'+esc(L.label)+'</b>'+(L.ctx?'<p>'+esc(L.ctx)+'</p>':'')+(L.ap&&!L.letter?'<p><em>(aproximado)</em></p>':'')+'</div>'
      +(pes.length?'<h4>Personagens <span>'+pes.length+'</span></h4><div class="tl2-rows">'+bars(pes,y,lo,hi)+'</div>':'')
      +'<h4>Autoridades <span>'+aut.length+'</span></h4><div class="tl2-rows">'+bars(aut,y,lo,hi)+'</div>'
      +'<div class="tl2-scale"><span>'+yr(Math.round(lo))+'</span><span>'+yr(Math.round(hi))+'</span></div>'
      +pauloHtml+cartasHtml
      +'<h4>Antes e depois</h4><div class="tl2-evs">'+evBtn(prev,-1)+evBtn(next,1)+'</div>'
      +'<div class="tl2-notes">'+notes.map(n=>'<p>'+esc(n)+'</p>').join('')+'</div>'
      +'</div>';
    s.classList.add('on');$('doxaChronoNTBackdrop').classList.add('on');
    s.querySelector('#tlntClose').onclick=close;
    s.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const [bk,c,v]=b.dataset.go.split(',');goTo(bk,Number(c),Number(v))});
  }
  // encaixa no motor da Linha do Tempo (js/40.js): livros do NT vêm para cá
  const C=window.DoxaChrono,oldH=C.handles,oldR=C.render;
  C.handles=ref=>handles(ref)||oldH(ref);
  C.render=ref=>handles(ref)?render(ref):oldR(ref);
  window.DoxaChronoNT={render,handles,close};
})();
