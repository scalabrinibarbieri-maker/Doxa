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
    P.esau.cap=147;   // morte não registrada: mostrado só por um tempo plausível (como o irmão gêmeo, Jacó)
    return{P,order,flood:P.noe.b+600};
  }

  /* ===================== FASE 2 · do Êxodo a 2 Reis =====================
     Âncoras do texto:
     · Êx 12:40 — 430 anos. TM: só no Egito (desde a entrada de Jacó, Gn 47:9).
       LXX e SP: "no Egito e em Canaã" — desde a chegada de Abrão (Gn 12:4; cf. Gl 3:17).
     · 1 Rs 6:1 — o templo começa no 480º ano após o Êxodo (TM; o SP não contém Reis) ou 440º (LXX),
       no 4º ano de Salomão.
     · Reinados: somados em sequência pelos anos dados em Reis (Judá); os reis de Israel entram pelos
       sincronismos do próprio texto ("no ano X de Asa, rei de Judá…"). Corregências não são aplicadas,
       por isso pode haver diferença de poucos anos em relação a cronologias acadêmicas. */
  const JUDA=[ // [chave, nome, idade ao assumir (null = não informada), anos de reinado, ref, morre ao fim do reinado?]
    ['roboao','Roboão',41,17,'1 Rs 14:21',true],['abias','Abias',null,3,'1 Rs 15:2',true],['asa','Asa',null,41,'1 Rs 15:10',true],
    ['josafa','Josafá',35,25,'1 Rs 22:42',true],['jeorao','Jeorão',32,8,'2 Rs 8:17',true],['acazias','Acazias',22,1,'2 Rs 8:26',true],
    ['atalia','Atalia',null,6,'2 Rs 11:3',true],['joas','Joás',7,40,'2 Rs 11:21; 12:1',true],['amazias','Amazias',25,29,'2 Rs 14:2',true],
    ['uzias','Uzias (Azarias)',16,52,'2 Rs 15:2',true],['jotao','Jotão',25,16,'2 Rs 15:33',true],['acaz','Acaz',20,16,'2 Rs 16:2',true],
    ['ezequias','Ezequias',25,29,'2 Rs 18:2',true],['manasses','Manassés',12,55,'2 Rs 21:1',true],['amom','Amom',22,2,'2 Rs 21:19',true],
    ['josias','Josias',8,31,'2 Rs 22:1',true],['jeoacaz','Jeoacaz',23,0,'2 Rs 23:31',false],['jeoaquim','Jeoaquim',25,11,'2 Rs 23:36',true],
    ['joaquim','Joaquim',18,0,'2 Rs 24:8',false],['zedequias','Zedequias',21,11,'2 Rs 24:18',false],
  ];
  const ISRAEL=[ // [chave, nome, rei de Judá do sincronismo, ano dele (0 = mesmo início), anos de reinado, ref]
    ['jeroboao','Jeroboão','roboao',1,22,'1 Rs 12:20; 14:20'],['nadabe','Nadabe','asa',2,2,'1 Rs 15:25'],
    ['baasa','Baasa','asa',3,24,'1 Rs 15:33'],['ela','Elá','asa',26,2,'1 Rs 16:8'],['zinri','Zinri','asa',27,0,'1 Rs 16:15'],
    ['onri','Onri','asa',27,12,'1 Rs 16:15–16,23'],['acabe','Acabe','asa',38,22,'1 Rs 16:29'],['acaziasI','Acazias (Israel)','josafa',17,2,'1 Rs 22:51'],
    ['joraoI','Jorão (Israel)','josafa',18,12,'2 Rs 3:1'],['jeu','Jeú','atalia',1,28,'2 Rs 10:36'],['jeoacazI','Jeoacaz (Israel)','joas',23,17,'2 Rs 13:1'],
    ['jeoasI','Jeoás (Israel)','joas',37,16,'2 Rs 13:10'],['jeroboao2','Jeroboão II','amazias',15,41,'2 Rs 14:23'],
    ['zacarias','Zacarias','uzias',38,0,'2 Rs 15:8'],['salum','Salum','uzias',39,0,'2 Rs 15:13'],['menaem','Menaém','uzias',39,10,'2 Rs 15:17'],
    ['pecaias','Pecaías','uzias',50,2,'2 Rs 15:23'],['peca','Peca','uzias',52,20,'2 Rs 15:27'],['oseias','Oseias','acaz',12,9,'2 Rs 17:1'],
  ];
  // Juízes: períodos dados no livro (opressão + descanso/juizado). A soma passa dos 480 anos de 1 Rs 6:1,
  // então são distribuídos proporcionalmente entre a morte de Josué e Samuel — sempre como aproximados.
  const JUIZES=[['otniel','Otniel',48,3,7],['eude','Eúde',98,3,12],['debora','Débora e Baraque',60,4,1],['gideao','Gideão',47,6,1],
    ['abimeleque','Abimeleque',3,9,1],['tola','Tola',23,10,1],['jair','Jair',22,10,3],['jefte','Jefté',24,10,6],['ibsa','Ibsã',7,12,8],
    ['elom','Elom',10,12,11],['abdom','Abdom',8,12,13],['sansao','Sansão (opressão filisteia)',40,13,1]];
  function compute2(tr,G){
    const P=G.P,Y={},R={},X={};
    Y.EGITO=P.jaco.b+130;                                        // Gn 47:9
    Y.EXO=tr==='TM'?Y.EGITO+430:P.abraao.b+75+430;               // Êx 12:40
    const gap=tr==='LXX'?440:480;                                 // 1 Rs 6:1
    Y.SOL=Y.EXO+gap-4;                                           // 480º ano = 4º de Salomão
    Y.DAVI=Y.SOL-40; Y.SAUL=Y.DAVI-40;                           // 2 Sm 5:4; At 13:21
    Y.CONQ=Y.EXO+46; Y.JOSUE_D=Y.EXO+66;                         // Js 14:7,10; Js 24:29 (aprox.)
    Y.ELI_D=Y.SAUL-20;                                            // 1 Sm 7:2 (aprox.)
    // juízes, distribuídos entre a morte de Josué e a morte de Eli
    const tot=JUIZES.reduce((a,j)=>a+j[2],0),span=Y.ELI_D-Y.JOSUE_D;let acc=Y.JOSUE_D;
    const JZ=[];for(const j of JUIZES){Y['J_'+j[0]]=Math.round(acc);JZ.push([j[0],j[1],Math.round(acc),Math.round(acc+j[2]*span/tot)]);acc+=j[2]*span/tot}
    Y.RUTE=Y.DAVI-30-80;                                          // 3 gerações antes de Davi (Rt 4:17–22)
    // pessoas
    const add=(k,n,b,d,ref,o={})=>{X[k]=Object.assign({k,n,b,d,ref},o)};
    add('levi','Levi',P.jaco.b+87,P.jaco.b+87+137,'Êx 6:16',{der:true,aprox:true});
    add('moises','Moisés',Y.EXO-80,Y.EXO+40,'Êx 7:7; Dt 34:7');
    add('arao','Arão',Y.EXO-83,Y.EXO+40,'Êx 7:7; Nm 33:39');
    add('calebe','Calebe',Y.EXO-39,null,'Js 14:7,10',{cap:110});
    add('eli','Eli',Y.ELI_D-98,Y.ELI_D,'1 Sm 4:15,18',{aprox:true});
    add('saul','Saul',null,Y.DAVI,'At 13:21',{reign:[Y.SAUL,Y.DAVI]});
    add('davi','Davi',Y.DAVI-30,Y.DAVI+40,'2 Sm 5:4',{reign:[Y.DAVI,Y.DAVI+40]});
    add('salomao','Salomão',null,Y.SOL+40,'1 Rs 11:42',{reign:[Y.SOL,Y.SOL+40]});
    for(const [k,n,s0,e0] of JZ)add('jz_'+k,n,null,null,'Juízes',{reign:[s0,e0],judge:true,aprox:true});
    let a=Y.SOL+40;
    for(const [k,n,age,yrs,ref,dies] of JUDA){
      R[k]={acc:a,end:a+yrs};
      add(k,n+' (Judá)',age==null?null:a-age,dies?a+yrs:null,ref,{reign:[a,a+yrs],king:'J'});
      a+=yrs;
    }
    for(const [k,n,jk,jy,yrs,ref] of ISRAEL){
      const s0=R[jk].acc+Math.max(0,jy-1);R[k]={acc:s0,end:s0+yrs};
      add(k,n,null,s0+yrs,ref,{reign:[s0,s0+yrs],king:'I'});
    }
    Y.SAMARIA=R.ezequias.acc+5;                                   // 2 Rs 18:10
    Y.QUEDA=R.zedequias.acc+10;                                   // 2 Rs 25:2,8
    Y.SOLTURA=R.zedequias.acc+36;                                 // 2 Rs 25:27 (37º ano do exílio)
    X.jeoacaz.cap=35;X.joaquim.cap=70;X.zedequias.cap=45;   // mortes não registradas em Reis
    return{Y,R,X};
  }
  const CH={};TR.forEach(t=>CH[t]=compute(t));
  TR.forEach(t=>{const c2=compute2(t,CH[t]);CH[t].Y=c2.Y;CH[t].R=c2.R;Object.assign(CH[t].P,c2.X);CH[t].order.push(...Object.keys(c2.X))});

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


  /* ---------- Âncoras da Fase 2: [cap, vers, especificação, aproximado?, rótulo]
     'y:EXO:+n' = n anos após o Êxodo · 'r:rei:N' = Nº ano do reinado · 'e:rei' = fim do reinado
     'p:pessoa:idade' = quando a pessoa tem essa idade */
  const B2={
    Exod:[[1,1,'p:levi:137',true,'Os filhos de Israel no Egito'],[1,8,'y:EXO:-81',true,'Um novo rei que não conhecera José'],
      [2,1,'p:moises:0',false,'Nasce Moisés'],[2,11,'p:moises:40',true,'Moisés foge para Midiã (At 7:23)'],
      [3,1,'p:moises:80',false,'A sarça ardente'],[7,7,'p:moises:80',false,'Moisés diante de Faraó'],
      [12,1,'y:EXO:0',false,'A Páscoa e a saída do Egito'],[16,1,'y:EXO:0',false,'O maná (2º mês)'],
      [19,1,'y:EXO:0',false,'No Sinai (3º mês)'],[32,1,'y:EXO:0',false,'O bezerro de ouro'],[40,17,'y:EXO:1',false,'O tabernáculo é erguido (2º ano)']],
    Lev:[[1,1,'y:EXO:1',false,'Leis dadas no Sinai']],
    Num:[[1,1,'y:EXO:1',false,'O censo no Sinai (2º ano)'],[10,11,'y:EXO:1',false,'Partida do Sinai'],
      [13,1,'p:calebe:40',false,'Os espias em Cades-Barneia'],[14,26,'y:EXO:1',false,'Sentença: 40 anos no deserto'],
      [15,1,'y:EXO:20',true,'Anos no deserto'],[20,1,'y:EXO:39',false,'Morre Miriã (40º ano)'],[20,22,'p:arao:123',false,'Morre Arão'],
      [21,1,'y:EXO:39',false,'A caminho de Moabe'],[33,38,'p:arao:123',false,'Morre Arão (Nm 33:39)'],[33,40,'y:EXO:39',false,'Nas planícies de Moabe']],
    Deut:[[1,1,'y:EXO:39',false,'Moisés fala ao povo (40º ano, 11º mês)'],[34,1,'p:moises:120',false,'Morre Moisés']],
    Josh:[[1,1,'y:EXO:40',false,'Josué assume'],[3,1,'y:EXO:40',false,'Travessia do Jordão'],[6,1,'y:EXO:40',false,'Jericó'],
      [11,16,'y:EXO:45',true,'Conquista da terra'],[14,6,'p:calebe:85',false,'Calebe recebe Hebrom'],
      [22,1,'y:EXO:47',true,'As tribos do outro lado do Jordão'],[23,1,'y:JOSUE_D:-5',true,'Josué já velho'],[24,29,'y:JOSUE_D:0',true,'Morre Josué (110 anos)']],
    Judg:[[1,1,'y:JOSUE_D:0',true,'Depois da morte de Josué'],[3,7,'y:J_otniel:0',true,'Otniel'],[3,12,'y:J_eude:0',true,'Eúde'],
      [4,1,'y:J_debora:0',true,'Débora e Baraque'],[6,1,'y:J_gideao:0',true,'Gideão'],[9,1,'y:J_abimeleque:0',true,'Abimeleque'],
      [10,1,'y:J_tola:0',true,'Tola'],[10,3,'y:J_jair:0',true,'Jair'],[10,6,'y:J_jefte:0',true,'Jefté'],[12,8,'y:J_ibsa:0',true,'Ibsã'],
      [12,11,'y:J_elom:0',true,'Elom'],[12,13,'y:J_abdom:0',true,'Abdom'],[13,1,'y:J_sansao:0',true,'Sansão'],
      [17,1,'y:JOSUE_D:5',true,'Mica e os danitas (início do período)'],[19,1,'y:JOSUE_D:10',true,'Gibeá (Fineias ainda vivo, Jz 20:28)']],
    Ruth:[[1,1,'y:RUTE:0',true,'Nos dias dos juízes']],
    '1Sam':[[1,1,'y:ELI_D:-30',true,'Nasce Samuel'],[3,1,'y:ELI_D:-15',true,'O menino Samuel'],[4,1,'p:eli:98',true,'Morre Eli'],
      [7,2,'y:ELI_D:20',true,'Vinte anos em Quiriate-Jearim'],[8,1,'y:SAUL:-1',true,'O povo pede um rei'],[10,1,'y:SAUL:0',false,'Saul ungido'],
      [13,1,'y:SAUL:2',true,'Reinado de Saul'],[16,1,'p:davi:15',true,'Davi ungido'],[17,1,'p:davi:17',true,'Davi e Golias'],
      [18,1,'p:davi:18',true,'Davi na corte'],[31,1,'p:davi:30',false,'Morre Saul']],
    '2Sam':[[1,1,'p:davi:30',false,'Davi rei em Hebrom'],[5,1,'p:davi:37',false,'Davi rei sobre todo Israel'],[6,1,'p:davi:38',true,'A arca em Jerusalém'],
      [7,1,'p:davi:40',true,'A aliança com Davi'],[11,1,'p:davi:50',true,'Davi e Bate-Seba'],[13,1,'p:davi:55',true,'Amnom e Tamar'],
      [15,1,'p:davi:60',true,'A revolta de Absalão'],[21,1,'p:davi:65',true,'Fome e guerras'],[24,1,'p:davi:68',true,'O recenseamento']],
    '1Kgs':[[1,1,'p:davi:70',false,'Davi velho; Salomão ungido'],[2,10,'p:davi:70',false,'Morre Davi'],[3,1,'y:SOL:1',true,'Sabedoria de Salomão'],
      [6,1,'y:SOL:3',false,'Começa o templo (4º ano)'],[6,38,'y:SOL:10',false,'O templo concluído (11º ano)'],[8,1,'y:SOL:11',true,'Dedicação do templo'],
      [9,10,'y:SOL:19',false,'Templo e palácio prontos (20 anos)'],[10,1,'y:SOL:21',true,'A rainha de Sabá'],[11,1,'y:SOL:35',true,'Salomão se desvia'],
      [11,41,'e:salomao',false,'Morre Salomão'],[12,1,'r:roboao:1',false,'O reino se divide'],[14,25,'r:roboao:5',false,'Sisaque ataca Jerusalém'],
      [15,1,'r:abias:1',false,'Abias rei de Judá'],[15,9,'r:asa:1',false,'Asa rei de Judá'],[15,25,'r:nadabe:1',false,'Nadabe rei de Israel'],
      [15,33,'r:baasa:1',false,'Baasa rei de Israel'],[16,8,'r:ela:1',false,'Elá rei de Israel'],[16,15,'r:zinri:1',false,'Zinri, sete dias'],
      [16,23,'r:onri:1',false,'Onri rei de Israel'],[16,29,'r:acabe:1',false,'Acabe rei de Israel'],[17,1,'r:acabe:3',true,'Elias e a seca'],
      [18,1,'r:acabe:6',true,'Elias no Carmelo'],[21,1,'r:acabe:18',true,'A vinha de Nabote'],[22,1,'r:acabe:21',true,'A morte de Acabe'],
      [22,41,'r:josafa:1',false,'Josafá rei de Judá'],[22,51,'r:acaziasI:1',false,'Acazias rei de Israel']],
    '2Kgs':[[1,1,'r:acaziasI:2',true,'Acazias enfermo'],[1,17,'r:joraoI:1',false,'Jorão rei de Israel'],[2,1,'r:joraoI:1',true,'Elias é arrebatado'],
      [4,1,'r:joraoI:5',true,'Milagres de Eliseu'],[8,16,'r:jeorao:1',false,'Jeorão rei de Judá'],[8,25,'r:acazias:1',false,'Acazias rei de Judá'],
      [9,1,'r:jeu:1',false,'Jeú ungido'],[11,1,'r:atalia:1',false,'Atalia usurpa o trono'],[12,1,'r:joas:1',false,'Joás rei de Judá'],
      [13,1,'r:jeoacazI:1',false,'Jeoacaz rei de Israel'],[13,10,'r:jeoasI:1',false,'Jeoás rei de Israel'],[13,20,'r:jeoasI:5',true,'Morre Eliseu'],
      [14,1,'r:amazias:1',false,'Amazias rei de Judá'],[14,23,'r:jeroboao2:1',false,'Jeroboão II rei de Israel'],[15,1,'r:uzias:1',false,'Uzias (Azarias) rei de Judá'],
      [15,8,'r:zacarias:1',false,'Zacarias rei de Israel'],[15,13,'r:salum:1',false,'Salum, um mês'],[15,17,'r:menaem:1',false,'Menaém rei de Israel'],
      [15,23,'r:pecaias:1',false,'Pecaías rei de Israel'],[15,27,'r:peca:1',false,'Peca rei de Israel'],[15,32,'r:jotao:1',false,'Jotão rei de Judá'],
      [16,1,'r:acaz:1',false,'Acaz rei de Judá'],[17,1,'r:oseias:1',false,'Oseias rei de Israel'],[17,5,'y:SAMARIA:0',false,'Queda de Samaria'],
      [18,1,'r:ezequias:1',false,'Ezequias rei de Judá'],[18,9,'y:SAMARIA:0',false,'Queda de Samaria (6º ano de Ezequias)'],[18,13,'r:ezequias:14',false,'Senaqueribe invade Judá'],
      [20,1,'r:ezequias:14',false,'Ezequias enfermo: mais 15 anos'],[21,1,'r:manasses:1',false,'Manassés rei de Judá'],[21,19,'r:amom:1',false,'Amom rei de Judá'],
      [22,1,'r:josias:1',false,'Josias rei de Judá'],[22,3,'r:josias:18',false,'O livro da Lei é achado'],[23,29,'e:josias',false,'Morre Josias em Megido'],
      [23,31,'r:jeoacaz:1',false,'Jeoacaz, três meses'],[23,36,'r:jeoaquim:1',false,'Jeoaquim rei de Judá'],[24,8,'r:joaquim:1',false,'Joaquim, três meses; primeira deportação'],
      [24,18,'r:zedequias:1',false,'Zedequias rei de Judá'],[25,1,'r:zedequias:9',false,'Cerco de Jerusalém'],[25,8,'y:QUEDA:0',false,'Jerusalém e o templo destruídos'],
      [25,27,'y:SOLTURA:0',false,'Joaquim libertado na Babilônia']],
  };
  const BOOK_PT={Gen:'Gn',Exod:'Êx',Lev:'Lv',Num:'Nm',Deut:'Dt',Josh:'Js',Judg:'Jz',Ruth:'Rt','1Sam':'1 Sm','2Sam':'2 Sm','1Kgs':'1 Rs','2Kgs':'2 Rs'};
  const BOOK_ORDER=['Gen','Exod','Lev','Num','Deut','Josh','Judg','Ruth','1Sam','2Sam','1Kgs','2Kgs'];
  const Y_LABEL={EXO:'o Êxodo',SOL:'o início do reinado de Salomão',SAUL:'o início do reinado de Saul',JOSUE_D:'a morte de Josué',ELI_D:'a morte de Eli',RUTE:''};
  const Y_FIXED={SAMARIA:'6º ano de Ezequias; 9º de Oseias (2 Rs 18:10)',QUEDA:'11º ano de Zedequias (2 Rs 25:2)',SOLTURA:'37º ano do exílio de Joaquim (2 Rs 25:27)',RUTE:'três gerações antes de Davi (Rt 4:17–22)'};
  function resolve(ch,spec){
    const [t,a,b]=spec.split(':');
    if(t==='y'){const base=ch.Y[a];if(base==null)return null;const n=Number(b||0),y=base+n;
      let ctx='';if(a==='EXO')ctx=n===0?'Ano do Êxodo':(n>0?(n+(n===1?' ano':' anos')+' após o Êxodo'):(-n+' anos antes do Êxodo'));
      else if(Y_FIXED[a]&&n===0)ctx=Y_FIXED[a];
      else if(a.startsWith('J_'))ctx='período dos juízes';else if(Y_LABEL[a])ctx=(n===0?'':Math.abs(n)+(Math.abs(n)===1?' ano ':' anos ')+(n>0?'após ':'antes de '))+Y_LABEL[a];
      if(a==='SOL'&&n>=0)ctx=(n+1)+'º ano de Salomão';
      return{y,ctx};}
    if(t==='r'){const r=ch.R[a];if(!r)return null;const n=Number(b);const who=ch.P[a];return{y:r.acc+n-1,ctx:n+'º ano de '+(who?who.n:a),who:a};}
    if(t==='e'){const q=ch.P[a];const r=ch.R[a]||(q&&q.reign?{end:q.reign[1]}:null);if(!r)return null;return{y:r.end,ctx:'fim do reinado de '+(q?q.n:a),who:a};}
    if(t==='p'){const q=ch.P[a];if(!q||q.b==null)return null;const n=Number(b);return{y:q.b+n,ctx:q.n+' tem '+n+(n===1?' ano':' anos'),who:a};}
    return null;
  }
  /* ---------- 4. Tela ---------- */
  function eraName(ch,y){
    const Y=ch.Y;
    if(y<ch.flood)return'Antes do Dilúvio';if(y<ch.P.abraao.b)return'Do Dilúvio a Abraão';if(y<Y.EGITO)return'Os patriarcas';
    if(y<Y.EXO)return'Israel no Egito';if(y<=Y.EXO+40)return'O deserto';if(y<Y.JOSUE_D)return'A conquista';if(y<Y.SAUL)return'Os juízes';
    if(y<Y.SOL+40)return'O reino unido';if(y<Y.SAMARIA)return'Os reinos de Israel e Judá';if(y<=Y.QUEDA)return'Judá depois da queda de Samaria';return'O exílio';
  }
  function locate(ch,ref){
    if(ref.book==='Gen'){
      const a=anchorFor(ref.chapter,ref.verse);if(!a)return null;
      const [ac,av,k,raw,ap,label]=a,p=ch.P[k];if(!p)return null;const age=ageOf(p,raw);
      return{y:p.b+age,label,ap,who:k,ctx:p.n+' tem '+age+(age===1?' ano':' anos'),ac,av};
    }
    const list=B2[ref.book];if(!list)return null;
    let a=null;for(const x of list){if(x[0]<ref.chapter||(x[0]===ref.chapter&&x[1]<=ref.verse))a=x;else break}
    if(!a)a=list[0];
    const r=resolve(ch,a[2]);if(!r)return null;
    return{y:r.y,label:a[4],ap:a[3],who:r.who||null,ctx:r.ctx,ac:a[0],av:a[1]};
  }
  function allEvents(ch){
    const out=[];
    for(const e of EV){const q=ch.P[e.k];if(q)out.push({book:'Gen',c:e.c,v:e.v,t:e.t,y:q.b+ageOf(q,e.a)})}
    for(const bk of Object.keys(B2))for(const x of B2[bk]){if(x[3])continue;const r=resolve(ch,x[2]);if(r)out.push({book:bk,c:x[0],v:x[1],t:x[4],y:r.y})}
    return out.sort((p,q)=>p.y-q.y||BOOK_ORDER.indexOf(p.book)-BOOK_ORDER.indexOf(q.book)||p.c-q.c||p.v-q.v);
  }
  function sheet(){
    let s=$('doxaChronoSheet');if(s)return s;
    const bd=document.createElement('div');bd.id='doxaChronoBackdrop';bd.className='tl2-backdrop';document.body.appendChild(bd);
    s=document.createElement('section');s.id='doxaChronoSheet';s.className='tl2-sheet';document.body.appendChild(s);
    bd.addEventListener('click',close);return s;
  }
  function close(){$('doxaChronoSheet')?.classList.remove('on');$('doxaChronoBackdrop')?.classList.remove('on')}
  function goTo(book,c,v){
    try{
      const cp=CORPORA[mode],bi=cp.books.findIndex(b=>b.book===book);if(bi<0)return;
      positions[mode]={...(positions[mode]||{}),b:bi,c};focusVerse=v;
      try{savePrefs()}catch(e){}
      renderReader();close();
      setTimeout(()=>document.getElementById('v'+v)?.scrollIntoView({block:'center',behavior:'smooth'}),80);
    }catch(e){}
  }
  let lastRef=null;
  function render(ref){
    lastRef=ref;
    const ch=CH[tradition],L=locate(ch,ref);if(!L)return;
    const y=L.y;
    const alive=ch.order.map(x=>ch.P[x]).filter(q=>{
      if(q.b!=null&&q.b<=y&&(q.d!=null?q.d>=y:(q.cap==null||q.b+q.cap>=y)))return true;
      return q.b==null&&q.reign&&q.reign[0]<=y&&q.reign[1]>=y;
    });
    const starts=alive.map(q=>q.b??q.reign[0]),ends=alive.map(q=>q.d??(q.cap&&q.b!=null?Math.min(q.b+q.cap,y+40):(q.reign?q.reign[1]:y)));
    let lo=Math.min(...starts,y),hi=Math.max(...ends,y);if(hi-lo<120){const m=(lo+hi)/2;lo=m-60;hi=m+60}
    const pct=v=>Math.max(0,Math.min(100,(v-lo)/(hi-lo)*100)).toFixed(2);
    const rows=alive.map(q=>{
      const hasLife=q.b!=null,qa=hasLife?y-q.b:null,born=q.b===y,dies=q.d===y,reigning=q.reign&&q.reign[0]<=y&&q.reign[1]>=y;
      let tag='';
      if(born)tag='<em class="b">nasce</em>';else if(dies)tag=q.taken?'<em class="t">tomado por Deus</em>':'<em class="d">morre</em>';
      else if(reigning)tag='<em class="r">'+(q.judge?(q.reign[0]===y?'começa a julgar':'julgando'):(q.reign[0]===y?'começa a reinar':'reinando · '+(y-q.reign[0]+1)+'º ano'))+'</em>';
      else if(hasLife&&q.d==null)tag='<em class="u">morte não registrada</em>';
      const s0=hasLife?q.b:q.reign[0],e0=hasLife?(q.d??y):q.reign[1];
      const rg=q.reign?'<b class="rg" style="left:'+pct(q.reign[0])+'%;width:'+(pct(q.reign[1])-pct(q.reign[0])).toFixed(2)+'%"></b>':'';
      return '<div class="tl2-row'+(q.k===L.who?' me':'')+'"><div class="tl2-who"><b>'+esc(q.n)+'</b>'+(hasLife?'<span>'+qa+(qa===1?' ano':' anos')+(q.aprox?' (aprox.)':'')+'</span>':'')+tag+'</div>'
        +'<div class="tl2-bar">'+(hasLife?'<i style="left:'+pct(s0)+'%;width:'+(pct(e0)-pct(s0)).toFixed(2)+'%"></i>':'')+rg+'<u style="left:'+pct(y)+'%"></u></div></div>';
    }).join('');
    const evs=allEvents(ch);
    const here=evs.findIndex(e=>e.book===ref.book&&e.c===L.ac&&e.v===L.av);
    let prev=null,next=null;
    if(here>=0){prev=evs[here-1]||null;next=evs[here+1]||null}
    else{prev=[...evs].reverse().find(e=>e.y<=y&&!(e.book===ref.book&&e.c===L.ac&&e.v===L.av))||null;next=evs.find(e=>e.y>y)||null}
    const evBtn=(e,dir)=>e?'<button type="button" class="tl2-ev" data-go="'+e.book+','+e.c+','+e.v+'"><small>'+(dir<0?'ANTES':'DEPOIS')+' · ANO '+e.y+'</small><b>'+esc(e.t)+'</b><span>'+BOOK_PT[e.book]+' '+e.c+':'+e.v+'</span></button>':'<div class="tl2-ev empty"></div>';
    const notes=[],Y=ch.Y;
    if(L.who&&ch.P[L.who]?.der&&NOTE_DERIVED[L.who])notes.push(NOTE_DERIVED[L.who]);
    if(tradition==='LXX'&&ch.P.matusalem.d>ch.flood&&y>=ch.flood-200&&y<=ch.P.matusalem.d+50)
      notes.push('Na Septuaginta (Swete), Matusalém morreria '+(ch.P.matusalem.d-ch.flood)+' anos depois do dilúvio — uma dificuldade conhecida desse texto. O Códice Alexandrino lê 187 anos em Gn 5:25, o que resolve o problema.');
    if(alive.some(q=>q.k==='caina2'))notes.push('Cainã, filho de Arfaxade, aparece só na Septuaginta (Gn 11:13) e em Lucas 3:36; não está no Texto Massorético nem no Samaritano.');
    if(y>=Y.EGITO-10&&y<=Y.EXO+40)notes.push(tradition==='TM'
      ?'Êxodo 12:40 no Texto Massorético: os 430 anos são contados só no Egito, desde a chegada de Jacó. Na Septuaginta e no Samaritano, são "no Egito e em Canaã", desde Abraão (cf. Gálatas 3:17). Troque a tradição acima para comparar.'
      :'Êxodo 12:40 nesta tradição: 430 anos "no Egito e em Canaã", contados desde a chegada de Abrão (Gn 12:4), como em Gálatas 3:17. No Texto Massorético, os 430 anos são só no Egito.');
    if(ref.book==='Judg'||(y>=Y.JOSUE_D&&y<Y.SAUL))notes.push('Somados, os períodos de Juízes passam dos 480 anos de 1 Reis 6:1 — provavelmente alguns juízes atuaram ao mesmo tempo, em regiões diferentes. Por isso este período aparece distribuído e marcado como aproximado.');
    if(BOOK_ORDER.indexOf(ref.book)>=BOOK_ORDER.indexOf('Josh')&&tradition==='SP')notes.push('O Pentateuco Samaritano contém só os cinco livros de Moisés. Daqui em diante usam-se os números do Texto Massorético, somados à data do Êxodo pelo Samaritano.');
    if(tradition==='LXX'&&y>=Y.EXO+40&&y<=Y.SOL+40)notes.push('1 Reis 6:1 na Septuaginta: o templo começa no 440º ano após o Êxodo (no Texto Massorético, 480º).');
    if(BOOK_ORDER.indexOf(ref.book)>=BOOK_ORDER.indexOf('1Kgs')&&y>=Y.SOL+40)notes.push('Reinados somados em sequência pelos anos dados em Reis; os reis de Israel entram pelos sincronismos do texto. Corregências não são aplicadas, então pode haver diferença de poucos anos em relação a cronologias acadêmicas.');
    const s=sheet();
    s.innerHTML='<div class="tl2-grab"></div>'
      +'<header class="tl2-head"><div><small>LINHA DO TEMPO · '+esc(ref.label||'')+'</small><strong>'+(L.ap?'≈ ':'')+'Ano '+y+'<span> desde a criação</span></strong></div><button type="button" id="tl2Close" aria-label="Fechar">×</button></header>'
      +'<div class="tl2-tr">'+TR.map(t=>'<button type="button" data-tr="'+t+'" class="'+(t===tradition?'on':'')+'">'+t+'</button>').join('')+'</div>'
      +'<div class="tl2-scroll">'
      +'<div class="tl2-anchor"><span class="tl2-era">'+eraName(ch,y)+'</span><b>'+esc(L.label)+'</b><p>'+esc(L.ctx||'')+(L.ap?' <em>(aproximado)</em>':'')+' · cálculo '+TR_NAME[tradition]+'</p></div>'
      +'<h4>Quem estava vivo <span>'+alive.length+'</span></h4>'+(alive.length?'<div class="tl2-rows">'+rows+'</div>':'<p class="tl2-none">O texto não informa idades nem reinados de pessoas neste ponto.</p>')
      +'<div class="tl2-scale"><span>ano '+Math.round(lo)+'</span><span>ano '+Math.round(hi)+'</span></div>'
      +'<h4>Antes e depois</h4><div class="tl2-evs">'+evBtn(prev,-1)+evBtn(next,1)+'</div>'
      +(notes.length?'<div class="tl2-notes">'+notes.map(n=>'<p>'+esc(n)+'</p>').join('')+'</div>':'')
      +'<p class="tl2-src">Anos calculados a partir do próprio texto: Gênesis 5 e 11, as idades informadas nas narrativas, Êxodo 12:40, 1 Reis 6:1 e os anos de reinado de Reis. Trechos sem idade ou data explícita aparecem como aproximados (≈).</p>'
      +'</div>';
    s.classList.add('on');$('doxaChronoBackdrop').classList.add('on');
    s.querySelector('#tl2Close').onclick=close;
    s.querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{tradition=b.dataset.tr;try{localStorage.setItem('doxa:chrono:tr',tradition)}catch(e){}render(lastRef)});
    s.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const [bk,c,v]=b.dataset.go.split(',');goTo(bk,Number(c),Number(v))});
  }
  const handles=ref=>!!ref&&BOOK_ORDER.includes(ref.book);
  window.DoxaChrono={render,close,handles,compute,anchorFor,CH};
})();
