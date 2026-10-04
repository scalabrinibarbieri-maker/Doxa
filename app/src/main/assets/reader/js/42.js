(()=>{
  'use strict';
  /* Doxa 56 · A LUPA
     Modo de leitura (entra por Ferramentas): toca-se num versículo e brotam cartões com o que a
     tradução não mostra:
       1. Medidas e tempo — côvados, siclos, talentos, denários, horas, vigílias, meses → hoje.
       2. Raridades — palavras do original que só existem ali, aparecem ali pela 1ª vez, ou só naquele livro.
       3. Estrutura — palavras que se repetem no capítulo, refrões e acrósticos.
     Tudo calculado: as medidas a partir do texto em português (Almeida) e as palavras a partir do
     hebraico/grego marcado com Strong. Nada é palpite. */
  if(window.__doxa56LupaInstalled)return;
  window.__doxa56LupaInstalled=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(n,d=1)=>{const r=Math.round(n*Math.pow(10,d))/Math.pow(10,d);return r.toLocaleString('pt-BR',{maximumFractionDigits:d})};
  const NT_BOOKS=['Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'];

  /* ================= 1. MEDIDAS E TEMPO ================= */
  const NUM={um:1,uma:1,dois:2,duas:2,'três':3,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,catorze:14,quatorze:14,quinze:15,
    dezesseis:16,dezasseis:16,dezessete:17,dezassete:17,dezoito:18,dezenove:19,dezanove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,cincoenta:50,sessenta:60,setenta:70,
    oitenta:80,noventa:90,cem:100,cento:100,duzentos:200,duzentas:200,trezentos:300,trezentas:300,quatrocentos:400,quatrocentas:400,quinhentos:500,quinhentas:500,
    seiscentos:600,seiscentas:600,setecentos:700,setecentas:700,oitocentos:800,oitocentas:800,novecentos:900,novecentas:900,mil:1000,meio:0.5,meia:0.5};
  function numberBefore(text,idx){
    const words=text.slice(0,idx).toLowerCase().replace(/[^\wà-úç\s]/g,' ').trim().split(/\s+/);
    const seq=[];
    for(let i=words.length-1;i>=0&&seq.length<8;i--){const w=words[i];if(NUM[w]!=null||w==='e'){seq.unshift(w)}else if(/^\d+$/.test(w)){seq.unshift(w)}else break}
    while(seq.length&&seq[0]==='e')seq.shift();
    if(!seq.length)return null;
    if(seq.length===1&&/^\d+$/.test(seq[0]))return Number(seq[0]);
    let total=0,cur=0,any=false;
    for(const w of seq){
      if(w==='e')continue;any=true;
      if(/^\d+$/.test(w)){cur+=Number(w);continue}
      const v=NUM[w];
      if(w==='mil'){cur=(cur||1)*1000;total+=cur;cur=0}
      else if(v===0.5){cur+=0.5}
      else cur+=v;
    }
    return any?total+cur:null;
  }
  const LEN=m=>m<1?fmt(m*100,0)+' cm':m>=1000?fmt(m/1000,1)+' km':fmt(m,1)+' m';
  function lenCompare(m){
    if(m<1.5)return'';
    if(m<2.4)return'mais ou menos a altura de uma pessoa';
    if(m<40){const a=Math.max(1,Math.round(m/3));return a===1?'mais ou menos a altura de um andar de prédio':'cerca de '+a+' andares de um prédio (3 m cada)'}
    if(m<1000)return'cerca de '+fmt(m/105,1)+' campos de futebol enfileirados (105 m cada)';
    return'cerca de '+fmt(m/1000*12,0)+' minutos de caminhada';
  }
  const KG=g=>g>=1000?fmt(g/1000,1)+' kg':fmt(g,0)+' g';
  const LIT=l=>l>=1000?fmt(l/1000,1)+' mil litros':fmt(l,1)+' litros';
  const MONEY=dias=>dias<1?(dias*12*60<60?'cerca de '+fmt(dias*12*60,0)+' minutos de trabalho de um diarista':'cerca de '+fmt(dias*12,1)+' horas de trabalho de um diarista'):dias<300?'cerca de '+fmt(dias,0)+(Math.round(dias)===1?' dia':' dias')+' de trabalho de um diarista':'cerca de '+fmt(dias/300,1)+' anos de trabalho de um diarista';
  // [expressão, nome, singular, tipo, valor base, explicação]
  const UNITS=[
    [/\bc[ôo]vados?\b/gi,'côvado','len',0.45,'O côvado ia do cotovelo à ponta do dedo médio: cerca de 45 cm.'],
    [/\bpalmos?\b/gi,'palmo','len',0.22,'O palmo era a mão aberta, do polegar ao mindinho: cerca de 22 cm.'],
    [/\best[áa]dios?\b/gi,'estádio','len',185,'O estádio grego media cerca de 185 m.'],
    [/\bmilhas?\b/gi,'milha','len',1480,'A milha romana tinha mil passos: cerca de 1,5 km.'],
    [/\bsiclos?\b/gi,'siclo','wt',11.4,'O siclo era um peso (e depois moeda) de cerca de 11,4 g de prata.'],
    [/\bgeras\b/gi,'gera','wt',0.57,'A gera era a vigésima parte do siclo: cerca de 0,6 g.'],
    [/\btalentos?\b/gi,'talento','wt',34000,'O talento valia 3.000 siclos: cerca de 34 kg.'],
    [/\befas?\b/gi,'efa','vol',22,'A efa media grãos: cerca de 22 litros.'],
    [/\bg[ôo]mer(es)?\b/gi,'gômer','vol',2.2,'O gômer era a décima parte da efa (Êx 16:36): cerca de 2,2 litros.'],
    [/\bbatos?\b/gi,'bato','vol',22,'O bato media líquidos, o mesmo que a efa: cerca de 22 litros.'],
    [/\bhim\b|\bhins\b/gi,'him','vol',3.7,'O him media líquidos: cerca de 3,7 litros.'],
    [/\bcoros?\b/gi,'coro','vol',220,'O coro valia dez efas: cerca de 220 litros.'],
    [/\bden[áa]rios?\b/gi,'denário','money',1,'O denário era o pagamento de um dia de trabalho (Mt 20:2).'],
    [/\bdracmas?\b/gi,'dracma','money',1,'A dracma grega valia mais ou menos um denário: um dia de trabalho.'],
  ];
  const ORD={primeiro:1,segundo:2,terceiro:3,quarto:4,quinto:5,sexto:6,'sétimo':7,setimo:7,oitavo:8,nono:9,'décimo':10,decimo:10,'undécimo':11,undecimo:11,'duodécimo':12,duodecimo:12};
  const MESES=[null,
    ['Abibe / Nisã','março–abril','primavera; colheita da cevada','Páscoa (dia 14) e Pães Asmos (15 a 21)'],
    ['Zive','abril–maio','primavera','Páscoa tardia para quem estava impuro (dia 14, Nm 9:11)'],
    ['Sivã','maio–junho','início do verão; colheita do trigo','Pentecostes, a festa das Semanas'],
    ['4º mês','junho–julho','verão, calor forte',''],
    ['5º mês','julho–agosto','verão; uvas e figos',''],
    ['Elul','agosto–setembro','fim do verão; vindima',''],
    ['Etanim / Tisri','setembro–outubro','outono; primeiras chuvas','Trombetas (dia 1), Expiação (dia 10) e Tabernáculos (15 a 22)'],
    ['Bul','outubro–novembro','outono; tempo de arar e semear',''],
    ['Quisleu','novembro–dezembro','início do inverno','Dedicação do templo (dia 25; Jo 10:22)'],
    ['Tebete','dezembro–janeiro','inverno; chuvas',''],
    ['Sebate','janeiro–fevereiro','inverno; amendoeiras florindo',''],
    ['Adar','fevereiro–março','fim do inverno','Purim (dias 14 e 15; Et 9)']];
  const MES_NOME={abibe:1,'nisã':1,nisa:1,zive:2,'sivã':3,siva:3,elul:6,etanim:7,bul:8,quisleu:9,tebete:10,sebate:11,adar:12};
  const HORAS={primeira:['primeira','7h'],terceira:['terceira','9h da manhã'],'terça':['terceira','9h da manhã'],sexta:['sexta','meio-dia'],nona:['nona','3h da tarde'],'undécima':['undécima','5h da tarde'],undecima:['undécima','5h da tarde']};
  function measures(text,book,strongs,chap){
    const out=[];if(!text)return out;
    const nt=NT_BOOKS.includes(book);strongs=strongs||new Set();
    const palmo=(strongs.has('H2947')||strongs.has('H2948'))&&!strongs.has('H2239')?0.075:0.22;
    const longo=book==='Ezek'&&chap>=40;   // Ez 40:5: o côvado de "um côvado e um palmo"
    const comb=/c[ôo]vados?\s+e\s+(um|uma|dois|duas|três|\d+)\s+palmos?/i.exec(text);
    if(comb&&longo){out.push({k:'len',t:'côvado longo',big:'≈ 52 cm',cmp:'',sub:'Ezequiel mede o templo com o côvado longo: um côvado comum mais a largura de uma mão (Ez 40:5).'});text=text.slice(0,comb.index)+' '.repeat(comb[0].length)+text.slice(comb.index+comb[0].length)}
    else if(comb){const nc=numberBefore(text,comb.index)||1,np=NUM[comb[1].toLowerCase()]||Number(comb[1])||1,m0=nc*0.45+np*palmo;
      out.push({k:'len',t:fmt(nc,0)+' côvados e '+np+' palmo'+(np>1?'s':''),big:'≈ '+LEN(m0),cmp:lenCompare(m0),sub:palmo<0.1?'Aqui o palmo é a largura da mão (cerca de 7,5 cm): o “côvado longo” de Ezequiel tinha cerca de 52 cm.':'O côvado tinha cerca de 45 cm e o palmo cerca de 22 cm.'});
      text=text.slice(0,comb.index)+' '.repeat(comb[0].length)+text.slice(comb.index+comb[0].length);}
    for(const [re,name,kind,val,info] of UNITS){
      re.lastIndex=0;let m;
      while((m=re.exec(text))){
        let n=numberBefore(text,m.index);
        if(/meio\s+$/i.test(text.slice(Math.max(0,m.index-6),m.index)))n=0.5;
        if(name==='talento'&&nt){ // no NT o talento é dinheiro: 6.000 denários
          const q=n||1;out.push({k:'money',t:(n?fmt(n,0)+' ':'')+m[0],big:MONEY(q*6000),sub:'O talento, no Novo Testamento, era uma soma de dinheiro: cerca de 6.000 denários.'});continue}
        if(name==='coro'&&!n)continue;               // "coros" sem número é coral, não medida
        const q=n||1;let big='',cmp='';
        if(name==='palmo'&&palmo<0.1){out.push({k:'len',t:(n?fmt(n,0)+' ':'')+m[0],big:'≈ '+LEN(q*0.075),cmp:'',sub:'Este palmo (no hebraico, tefach) é a largura da mão: cerca de 7,5 cm.'});continue}
        if(name==='côvado'&&longo&&!n)continue;   // "cada côvado" já está no cartão do côvado longo
        const v2=(name==='côvado'&&longo)?0.52:val;
        if(kind==='len'){big='≈ '+LEN(q*v2);cmp=lenCompare(q*v2)}
        if(kind==='wt'){big='≈ '+KG(q*val)}
        if(kind==='vol'){big='≈ '+LIT(q*val)}
        if(kind==='money'){big=MONEY(q*val)}
        out.push({k:kind,t:(n?(n===0.5?'meio ':fmt(n,0)+' '):'')+m[0],big,cmp,sub:info});
      }
    }
    let bm;const br=/\bbraças?\b/gi;
    while((bm=br.exec(text))){const n=numberBefore(text,bm.index)||1;out.push({k:'len',t:fmt(n,0)+' '+bm[0],big:'≈ '+LEN(n*1.85),cmp:'',sub:'A braça era a medida dos braços abertos, usada para medir a profundidade do mar: cerca de 1,85 m.'})}
    if(/caminho\s+de\s+(um\s+)?s[áa]bado/i.test(text))out.push({k:'len',t:'caminho de sábado',big:'≈ 1 km',cmp:'cerca de 12 minutos de caminhada',sub:'A distância que a tradição permitia andar no sábado: 2.000 côvados.'});
    if(/\bcanas?\b/i.test(text)&&(book==='Ezek'||book==='Rev'||/\bmedir\b/i.test(text))){
      out.push({k:'len',t:'cana de medir',big:'≈ 3,1 m',cmp:'mais ou menos a altura de um andar de prédio',sub:'Seis côvados longos, cada um de um côvado e um palmo (Ez 40:5).'});}
    // horas do dia
    const hr=/\bhora\s+(primeira|terceira|ter[çc]a|sexta|nona|und[ée]cima)\b|\b(terceira|sexta|nona|und[ée]cima)\s+hora\b/gi;let h;
    while((h=hr.exec(text))){const key=(h[1]||h[2]).toLowerCase().replace('terca','terça').replace('undecima','undécima');const H=HORAS[key];if(H)out.push({k:'time',t:'hora '+H[0],big:'≈ '+H[1],sub:'As horas eram contadas a partir do nascer do sol, por volta das 6h.'})}
    // vigílias
    const vg=/vig[íi]lia\s+(da manh[ãa]|do meio|primeira|quarta|segunda|terceira)|(primeira|segunda|terceira|quarta)\s+vig[íi]lia/gi;let g;
    while((g=vg.exec(text))){const w=(g[1]||g[2]||'').toLowerCase();
      const map=nt?{primeira:'18h às 21h',segunda:'21h à meia-noite',terceira:'meia-noite às 3h',quarta:'3h às 6h, antes de amanhecer','da manhã':'3h às 6h, antes de amanhecer','da manha':'3h às 6h, antes de amanhecer'}
                  :{primeira:'do anoitecer às 22h','do meio':'22h às 2h','da manhã':'2h até o amanhecer','da manha':'2h até o amanhecer'};
      if(map[w])out.push({k:'time',t:'vigília '+w,big:'≈ '+map[w],sub:nt?'Os romanos dividiam a noite em quatro vigílias de três horas.':'Os israelitas dividiam a noite em três vigílias.'})}
    // meses (ordinal ou nome) e o dia, quando houver
    const ms=/m[êe]s\s+(primeiro|segundo|terceiro|quarto|quinto|sexto|s[ée]timo|oitavo|nono|d[ée]cimo|und[ée]cimo|duod[ée]cimo)|(primeiro|segundo|terceiro|quarto|quinto|sexto|s[ée]timo|oitavo|nono|d[ée]cimo|und[ée]cimo|duod[ée]cimo)\s+m[êe]s|m[êe]s\s+de\s+(abibe|nis[ãa]|zive|siv[ãa]|elul|etanim|bul|quisleu|tebete|sebate|adar)\b/gi;let mm;const seen=new Set();
    while((mm=ms.exec(text))){
      let n=mm[3]?MES_NOME[mm[3].toLowerCase()]:ORD[(mm[1]||mm[2]).toLowerCase()];if(!n||seen.has(n))continue;seen.add(n);
      const M=MESES[n],near=text.slice(Math.max(0,mm.index-40),mm.index+60);
      const dm=near.match(/(?:dia|aos?)\s+([a-zà-ú]+(?:\s+e\s+[a-zà-ú]+)?)\s+(?:dias\s+)?do\s+m[êe]s/i)||near.match(/a\s+([a-zà-ú]+)\s+dias\s+do\s+m[êe]s/i);
      const day=dm?numberBefore(dm[1]+' x',dm[1].length+1):null;
      let fest=M[3];
      if(day){const f={'1-14':'Páscoa','1-15':'começo dos Pães Asmos','7-1':'festa das Trombetas','7-10':'Dia da Expiação','7-15':'começo da festa dos Tabernáculos','9-25':'festa da Dedicação','12-14':'Purim'}[n+'-'+day];if(f)fest='Neste dia: '+f+'.'}
      out.push({k:'time',t:(day?'dia '+day+' do ':'')+n+'º mês ('+M[0]+')',big:'≈ '+M[1],sub:M[2][0].toUpperCase()+M[2].slice(1)+(fest?'. '+fest:'')+'.'});
    }
    if(nt){
      const qty=re=>{const m=re.exec(text);if(!m)return null;let i=m.index;const pre=text.slice(0,i).replace(/\s+(pequenas?|última|[\[\]]+)\s*$/i,' ');return numberBefore(pre,pre.length)};
      const NTM=[
        ['G3016',/moedas?/i,'lepto','money',1/128,'A menor moeda que existia: 1/128 de um denário — poucos minutos de trabalho.'],
        ['G2835',/moedas?|quadrante/i,'quadrante','money',1/64,'O quadrante valia dois leptos: 1/64 de um denário.'],
        ['G787',/moedas?/i,'asse','money',1/16,'O asse valia 1/16 de um denário — menos de uma hora de trabalho.'],
        ['G1323',/dracmas?/i,'didracma','money',2,'O imposto anual do templo: duas dracmas, ou meio siclo (Êx 30:13).'],
        ['G4715',/moedas?/i,'estáter','money',4,'O estáter valia quatro dracmas: o imposto do templo de duas pessoas.'],
        ['G1220',/dinheiros?/i,'denário','money',1,'O denário era o pagamento de um dia de trabalho (Mt 20:2).'],
        ['G3046',/arr[áa]te(is|l)/i,'arrátel (libra romana)','wt',327,'A libra romana: cerca de 327 g.'],
        ['G5518',/medidas?/i,'quênice','vol',1.1,'Cerca de 1,1 litro de grão: a ração de um homem por dia.'],
        ['G943',/medidas?/i,'bato','vol',22,'O bato media líquidos: cerca de 22 litros.'],
        ['G2884',/volumes?|medidas?/i,'coro','vol',220,'O coro media grãos: cerca de 220 litros.']];
      const done=new Set(out.map(o=>o.t.replace(/^[\d.,]+\s+/,'').toLowerCase()));
      for(const [st,re,name,kind,val,info] of NTM){
        if(!strongs.has(st))continue;
        if(name==='denário'&&[...done].some(d=>/den[áa]rio/.test(d)))continue;
        if(name==='didracma'||name==='estáter'){for(let i=out.length-1;i>=0;i--)if(/dracma/i.test(out[i].t))out.splice(i,1)}
        let n=qty(re)||1;
        if(name==='didracma'||name==='estáter')n=1;
        if(name==='quadrante'&&strongs.has('G3016'))n=1;   // "duas pequenas moedas, que fazem um quadrante"
        const big=kind==='money'?MONEY(n*val):kind==='wt'?'≈ '+KG(n*val):'≈ '+LIT(n*val);
        const tt=name==='didracma'?'imposto de duas dracmas (didracma)':name==='estáter'?'estáter (quatro dracmas)':fmt(n,0)+' '+name+(n>1&&!/\)$/.test(name)?'s':'');
        out.push({k:kind,t:tt,big,cmp:'',sub:info});
      }
      if(book==='Matt'&&/trinta\s+\[?moedas\]?\s+de\s+prata/i.test(text))out.push({k:'money',t:'30 moedas de prata',big:'cerca de 4 meses de trabalho',cmp:'',sub:'Provavelmente siclos de prata — o preço de um escravo na Lei (Êx 21:32), como em Zacarias 11:12.'});
    }
    return out;
  }

  /* ================= 2 e 3. PALAVRAS DO ORIGINAL ================= */
  const IDX={};
  function corpusFor(book){
    if(NT_BOOKS.includes(book))return typeof GREEK_STRONG!=='undefined'?{C:GREEK_STRONG,pt:typeof DOXA_STRONG_PT_G!=='undefined'?DOXA_STRONG_PT_G:{},nt:true}:null;
    if(typeof OSHB_STRONG==='undefined'||OSHB_STRONG.__stub)return null;
    return{C:OSHB_STRONG,pt:typeof DOXA_STRONG_PT_H!=='undefined'?DOXA_STRONG_PT_H:{},nt:false};
  }
  function index(cp){
    const key=cp.nt?'nt':'ot';if(IDX[key])return IDX[key];
    const C=cp.C,count=new Map(),first=new Map(),books=new Map();
    C.d.forEach((bk,bi)=>bk.forEach((ch,ci)=>ch.forEach((vs,vi)=>{for(const t of vs){if(!Array.isArray(t)||t[3]==null||t[3]<0)continue;const L=C.l[t[3]];if(!L)continue;const s=L[1];
      count.set(s,(count.get(s)||0)+1);if(!first.has(s))first.set(s,[bi,ci,vi]);let b=books.get(s);if(!b){b=new Set();books.set(s,b)}b.add(bi)}})));
    return IDX[key]={count,first,books};
  }
  const content=(pt,s)=>{const p=(pt[s]&&pt[s].p)||'';return /^(substantivo|verbo|adjetivo)/.test(p)};
  const gloss=(pt,s,L)=>{const e=pt[s];return e&&e.m&&e.m.length?e.m.slice(0,2).join(', '):(L&&L[7])||''};
  function verseTokens(cp,book,c,v){
    const bi=cp.C.b.indexOf(book);if(bi<0)return null;
    const vs=cp.C.d[bi]?.[c-1]?.[v-1];if(!vs)return null;
    return{bi,toks:vs.filter(t=>Array.isArray(t)&&t[3]!=null&&t[3]>=0).map(t=>({form:t[0],L:cp.C.l[t[3]],s:cp.C.l[t[3]][1]}))};
  }
  function rarities(cp,book,c,v){
    const vt=verseTokens(cp,book,c,v);if(!vt)return[];
    const I=index(cp),out=[],seen=new Set();
    for(const t of vt.toks){
      if(seen.has(t.s)||!content(cp.pt,t.s))continue;seen.add(t.s);
      const n=I.count.get(t.s)||0,f=I.first.get(t.s),isFirst=f&&f[0]===vt.bi&&f[1]===c-1&&f[2]===v-1,onlyBook=n>1&&I.books.get(t.s)?.size===1;
      let badge='',rank=0;
      if(n===1){badge='só aqui, em todo o '+(cp.nt?'Novo':'Antigo')+' Testamento';rank=3}
      else if(isFirst){badge='primeira vez '+(cp.nt?'no Novo Testamento':'na Bíblia')+' · '+n+' ocorrências';rank=2+Math.min(n,999)/1000}
      else if(onlyBook){badge='só existe neste livro · '+n+' vezes';rank=1}
      if(rank)out.push({lem:t.L[3],tr:t.L[4],g:gloss(cp.pt,t.s,t.L),badge,rank,s:t.s});
    }
    return out.sort((a,b)=>b.rank-a.rank).slice(0,5);
  }
  // unidades literárias maiores que um capítulo
  const UNITS_LIT=[
    {book:'Gen',from:[1,1],to:[2,3],name:'o relato da criação (Gn 1:1 – 2:3)'},
    {book:'Gen',from:[2,4],to:[3,24],name:'o Éden e a queda (Gn 2:4 – 3:24)'},
    {book:'Gen',from:[4,1],to:[4,16],name:'a história de Caim e Abel (Gn 4:1–16)'},
    {book:'Gen',from:[6,9],to:[9,17],name:'o relato do dilúvio (Gn 6:9 – 9:17)'},
    {book:'Gen',from:[11,1],to:[11,9],name:'a torre de Babel (Gn 11:1–9)'},
    {book:'Gen',from:[22,1],to:[22,19],name:'o sacrifício de Isaque (Gn 22:1–19)'},
    {book:'Gen',from:[37,2],to:[50,26],name:'a história de José (Gn 37–50)'},
    {book:'Exod',from:[7,14],to:[12,36],name:'as pragas do Egito (Êx 7:14 – 12:36)'},
    {book:'Ruth',from:[1,1],to:[4,22],name:'o livro de Rute'},
    {book:'Esth',from:[1,1],to:[10,3],name:'o livro de Ester'},
    {book:'Jonah',from:[1,1],to:[4,11],name:'o livro de Jonas'},
    {book:'Job',from:[1,1],to:[2,13],name:'o prólogo de Jó (Jó 1–2)'},
    {book:'Isa',from:[52,13],to:[53,12],name:'o cântico do Servo (Is 52:13 – 53:12)'},
    {book:'Matt',from:[5,1],to:[7,29],name:'o Sermão do Monte (Mt 5–7)'},
    {book:'John',from:[13,1],to:[17,26],name:'a despedida de Jesus (Jo 13–17)'},
    {book:'Rev',from:[2,1],to:[3,22],name:'as cartas às sete igrejas (Ap 2–3)'},
  ];
  function structure(cp,book,c,v){
    const vt=verseTokens(cp,book,c,v);if(!vt)return null;
    const bk=cp.C.d[vt.bi];
    let unit=UNITS_LIT.find(u=>u.book===book&&(c>u.from[0]||(c===u.from[0]&&v>=u.from[1]))&&(c<u.to[0]||(c===u.to[0]&&v<=u.to[1])));
    const verses=[];
    if(unit){for(let ci=unit.from[0]-1;ci<=unit.to[0]-1;ci++)(bk[ci]||[]).forEach((vs,vi)=>{const cc=ci+1,vv=vi+1;if((cc>unit.from[0]||vv>=unit.from[1])&&(cc<unit.to[0]||vv<=unit.to[1]))verses.push(vs)})}
    else (bk[c-1]||[]).forEach(vs=>verses.push(vs));
    const where=unit?unit.name:'este capítulo';
    const seq=verses.map(vs=>vs.filter(t=>Array.isArray(t)&&t[3]!=null&&t[3]>=0).map(t=>({s:cp.C.l[t[3]][1],form:t[0],L:cp.C.l[t[3]]})));
    const cnt=new Map();for(const vs of seq)for(const t of vs)cnt.set(t.s,(cnt.get(t.s)||0)+1);
    const COMMON=new Set(['H1961','H559','H6213','H935','H3318','H3605','H6440','H1510','G1510','G3004','G1096','G2192','G4160','G3956','G3779']);
    const here=[...new Set(vt.toks.map(t=>t.s))].filter(s=>!COMMON.has(s)&&(content(cp.pt,s)||/^nome/.test(cp.pt[s]?.p||''))).map(s=>({s,n:cnt.get(s)||0})).filter(x=>x.n>=3);
    const lemOf=s=>{const t=vt.toks.find(t=>t.s===s);return t?t.L:null};
    const marked=n=>n%7===0||n===10||n===12||n===40;
    const I=index(cp);if(!I.total){let t=0;for(const v of I.count.values())t+=v;I.total=t}
    const unitTok=seq.reduce((a,vs)=>a+vs.length,0)||1;
    const key=x=>(x.n/unitTok)/(((I.count.get(x.s)||1))/I.total);   // quantas vezes mais frequente aqui do que no geral
    const isName=x=>/^(nome|gent)/.test(cp.pt[x.s]?.p||'');
    // nomes só contam quando o número salta aos olhos (7, 10, 12, 40, múltiplos de 7); palavras comuns precisam ser
    // de fato a palavra-chave do trecho (6+ vezes e pelo menos 4× mais frequente ali do que no resto da Bíblia)
    const notable=here.filter(x=>isName(x)?(marked(x.n)&&x.n>=7&&key(x)>=3):((x.n>=6&&key(x)>=4)||(marked(x.n)&&x.n>=7&&key(x)>=2)));
    const words=notable.sort((a,b)=>key(b)-key(a)).slice(0,4).map(x=>{const L=lemOf(x.s);
      const mark=(x.n%7===0)?(x.n===7?'7 — o número da plenitude':x.n+' = '+(x.n/7)+' × 7'):(x.n===10||x.n===12||x.n===40)?String(x.n):'';
      return{lem:L[3],g:gloss(cp.pt,x.s,L),n:x.n,mark}});
    // refrão: a maior sequência (3 a 6 palavras) que se repete 3+ vezes e passa por este versículo
    let refrain=null;const mine=vt.toks.map(t=>t.s);
    for(let len=6;len>=3&&!refrain;len--){
      for(let i=0;i+len<=mine.length&&!refrain;i++){
        const g=mine.slice(i,i+len);if(!g.some(s=>content(cp.pt,s)))continue;
        let n=0;for(const vs of seq){const ss=vs.map(t=>t.s);for(let j=0;j+len<=ss.length;j++){let ok=true;for(let k=0;k<len;k++)if(ss[j+k]!==g[k]){ok=false;break}if(ok)n++}}
        if(n>=3&&g.filter(s=>content(cp.pt,s)&&!COMMON.has(s)).length>=2)refrain={n,forms:vt.toks.slice(i,i+len).map(t=>t.form).join(' '),pt:vt.toks.slice(i,i+len).map(t=>t.s==='H853'?'את':gloss(cp.pt,t.s,t.L).split(',')[0]).join(' · ')};
      }
    }
    // acróstico: lê a primeira letra de cada versículo no hebraico (pulando o título do salmo e
    // compensando a numeração, onde o título conta como versículo 1) e segue a ordem do alfabeto
    let acro=null;
    const AC={Ps:{25:{skip:1},34:{},37:{skip:1},119:{},145:{skip:2}},Lam:{1:{},2:{},3:{},4:{}},Prov:{31:{from:10}}};
    const cfg=!cp.nt&&AC[book]&&AC[book][c];
    if(cfg&&typeof WLC!=='undefined'){
      const chv=WLC.books.find(b=>b.book===book)?.chapters.find(x=>+x.chapter===c)?.verses||[];
      const ABC='אבגדהוזחטיכלמנסעפצקרשת',FIN={'ך':'כ','ם':'מ','ן':'נ','ף':'פ','ץ':'צ'};
      const NAMES=['álef','bet','guímel','dálet','hê','vav','záin','het','tet','iod','caf','lâmed','mem','nun','sâmec','áin','pê','tsadê','cof','resh','shin','tav'];
      const letterOf=(vn)=>{const w=chv.find(x=>+x.number===vn+(cfg.off||0));if(!w)return -1;
        let words=w.text.split(/\s+/);if(vn===1&&cfg.skip)words=words.slice(cfg.skip);
        const ch=(words.join(' ').normalize('NFD').replace(/[^\u05D0-\u05EA]/g,'').charAt(0));return ABC.indexOf(FIN[ch]||ch)};
      const grp0=book==='Ps'&&c===119?8:book==='Lam'&&c===3?3:1;
      let expected=0,cur=-1,mine=null;
      const last=Math.max(...chv.map(x=>+x.number))-(cfg.off||0);
      for(let vn=cfg.from||1;vn<=last;vn++){const L=letterOf(vn);
        let opened=false;
        if(L===expected||(L>expected&&L<=expected+2&&L>cur)){cur=L;expected=L+1;opened=true}else if(L!==cur){if(vn===v)mine=null;continue}
        if(vn===v&&L===cur&&(opened||grp0>1))mine=L}
      if(mine!=null&&mine>=0&&expected>=15){const grp=book==='Ps'&&c===119?8:book==='Lam'&&c===3?3:1;acro={letter:ABC[mine],name:NAMES[mine],pos:mine+1,group:grp}}
    }
    if(!words.length&&!refrain&&!acro)return null;
    return{where,words,refrain,acro};
  }

  /* ================= MODO E CARTÕES ================= */
  let on=false,current=null;
  const SVG_LUPA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.3"/><path d="M15.3 15.3 20.5 20.5"/></svg>';
  function ensureCard(){
    if($('toolsLupaStart'))return;
    const ref=$('toolsTimelineStart')||$('toolsHighlightStart');if(!ref)return;
    const b=document.createElement('button');b.className='tool-card';b.id='toolsLupaStart';b.type='button';
    b.innerHTML='<span class="tool-card-icon">'+SVG_LUPA+'</span><span class="tool-card-copy"><strong>Lupa</strong><small>Volte à Bíblia e toque num versículo para ver o que está escondido nele</small></span>';
    ref.after(b);b.addEventListener('click',()=>setMode(true));
  }
  function setMode(v){
    on=!!v;document.body.classList.toggle('doxa-lupa-on',on);
    const tools=$('doxa30Tools');
    if(tools){
      if(on){if(!tools.dataset.lupaPrev)tools.dataset.lupaPrev=tools.innerHTML;tools.innerHTML=SVG_LUPA+'<span>Sair da Lupa</span>';tools.classList.add('lupa-exit')}
      else if(tools.dataset.lupaPrev){tools.innerHTML=tools.dataset.lupaPrev;delete tools.dataset.lupaPrev;tools.classList.remove('lupa-exit')}
    }
    if(on){
      if(document.body.classList.contains('doxa-timeline-mode'))$('tlModeExit')?.click();
      try{openPanel('ler')}catch(e){}
      sweep();
      try{if(typeof OSHB_STRONG!=='undefined'&&OSHB_STRONG.__stub)window.DoxaLoadOshb?.()}catch(e){}
    }else closeCards();
  }
  function sweep(){
    const s=document.createElement('div');s.className='lupa-sweep';s.innerHTML='<i></i><span>'+SVG_LUPA+' Lupa ativa · toque num versículo</span>';
    document.body.appendChild(s);setTimeout(()=>s.remove(),2600);
  }
  function closeCards(){
    const f=$('lupaFloat');if(f){f.classList.add('out');setTimeout(()=>f.remove(),220)}
    document.querySelectorAll('.verse.lupa-sel').forEach(x=>x.classList.remove('lupa-sel'));current=null;
  }
  function refOf(el){
    try{const v=Number(String(el.id||'').replace(/^v/,''));if(!v||mode==='hyper'||!CORPORA[mode])return null;const p=pos(),b=CORPORA[mode].books[p.b];
      return{book:b.book,chapter:Number(p.c),verse:v,label:bookName(b)+' '+p.c+':'+v,sourceMode:mode}}catch(e){return null}
  }
  function ptText(ref){
    if(window.DoxaVersif&&ref.sourceMode){const t=window.DoxaVersif.ref(ref,'almeida');if(!t)return'';ref=t}
    const cp=(typeof CORPORA!=='undefined'&&(CORPORA.almeida||(['wlc','tr'].includes(mode)?null:CORPORA[mode])));if(!cp)return'';
    return cp.books.find(b=>b.book===ref.book)?.chapters.find(c=>+c.chapter===ref.chapter)?.verses.find(x=>+x.number===ref.verse)?.text||'';
  }
  const I0='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">';
  const ICON={len:I0+'<path d="M3 16 16 3l5 5L8 21z"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2"/></svg>',
    wt:I0+'<path d="M12 4v16M6 20h12M5 8h14"/><path d="M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z"/></svg>',
    vol:I0+'<path d="M8 3h8M9 3v3c-3 2-4 4-4 7 0 4 3 8 7 8s7-4 7-8c0-3-1-5-4-7V3"/></svg>',
    money:I0+'<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5 1-2.5 2s1 1.6 2.5 2 2.5 1 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v11"/></svg>',
    time:I0+'<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/></svg>',
    rare:I0+'<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18 3-18"/></svg>',
    struct:I0+'<path d="M4 6h16M4 12h10M4 18h16"/><circle cx="18" cy="12" r="2"/></svg>',
    lupa:I0+'<circle cx="10.5" cy="10.5" r="6.3"/><path d="M15.3 15.3 20.5 20.5"/></svg>'};
  function hebOf(ref){if(NT_BOOKS.includes(ref.book)||!window.DoxaVersif)return ref;return window.DoxaVersif.ref(Object.assign({sourceMode:'almeida'},ref),'wlc')||ref}
  function cardsFor(ref){
    const cards=[];const H=hebOf(ref);
    const cp0=corpusFor(ref.book),vt0=cp0?verseTokens(cp0,ref.book,H.chapter,H.verse):null;
    const ms=measures(ptText(ref),ref.book,new Set(vt0?vt0.toks.map(t=>t.s):[]),ref.chapter);
    for(const m of ms)cards.push('<article class="lupa-card k-'+m.k+'"><header><span class="ic">'+(ICON[m.k]||ICON.lupa)+'</span><small>'+(m.k==='time'?'TEMPO':m.k==='money'?'VALOR':'MEDIDA')+'</small></header>'
      +'<p class="lupa-q">'+esc(m.t)+'</p><p class="lupa-big">'+esc(m.big)+'</p>'+(m.cmp?'<p class="lupa-cmp">'+esc(m.cmp)+'</p>':'')+'<p class="lupa-sub">'+esc(m.sub)+'</p></article>');
    const cp=corpusFor(ref.book);
    if(cp){
      const r=rarities(cp,ref.book,H.chapter,H.verse);
      if(r.length)cards.push('<article class="lupa-card k-rare"><header><span class="ic">'+ICON.rare+'</span><small>RARIDADES</small></header>'
        +r.map(x=>'<div class="lupa-w"><b class="'+(cp.nt?'gr':'he')+'">'+esc(x.lem)+'</b><span>'+esc(x.tr)+' · '+esc(x.g)+'</span><em>'+esc(x.badge)+'</em></div>').join('')+'</article>');
      const st=structure(cp,ref.book,H.chapter,H.verse);
      if(st)cards.push('<article class="lupa-card k-struct"><header><span class="ic">'+ICON.struct+'</span><small>ESTRUTURA</small></header>'
        +(st.acro?'<div class="lupa-acro"><b class="he">'+esc(st.acro.letter)+'</b><span>Acróstico: este versículo começa com <strong>'+st.acro.name+'</strong>, a '+st.acro.pos+'ª letra do alfabeto hebraico'+(st.acro.group>1?' ('+st.acro.group+' versículos por letra)':'')+'.</span></div>':'')
        +(st.words.length?'<p class="lupa-sub">Palavras que se repetem em '+esc(st.where)+':</p>'+st.words.map(w=>'<div class="lupa-w"><b class="'+(cp.nt?'gr':'he')+'">'+esc(w.lem)+'</b><span>'+esc(w.g)+'</span><em>'+w.n+' vezes'+(w.mark?' · '+esc(w.mark):'')+'</em></div>').join(''):'')
        +(st.refrain?'<div class="lupa-ref"><p class="lupa-sub">Frase que volta '+st.refrain.n+' vezes em '+esc(st.where)+':</p><b class="'+(cp.nt?'gr':'he')+'">'+esc(st.refrain.forms)+'</b><span>'+esc(st.refrain.pt)+'</span></div>':'')
        +'</article>');
    }else if(!NT_BOOKS.includes(ref.book)){
      cards.push('<article class="lupa-card k-wait"><header><span class="ic">'+ICON.time+'</span><small>CARREGANDO</small></header><p class="lupa-sub">Preparando o texto hebraico… toque de novo em um instante.</p></article>');
    }
    if(!cards.length)cards.push('<article class="lupa-card k-none"><header><span class="ic">'+ICON.lupa+'</span><small>LUPA</small></header><p class="lupa-sub">Nada escondido neste versículo. Tente outro, uma genealogia, um salmo ou uma passagem com medidas e datas.</p></article>');
    return cards;
  }
  function show(el,ref){
    closeCards();
    current=ref.label;el.classList.add('lupa-sel');
    const f=document.createElement('div');f.id='lupaFloat';f.className='lupa-float';
    f.innerHTML='<div class="lupa-track">'+cardsFor(ref).join('')+'</div>';
    document.body.appendChild(f);
    // perto do versículo: embaixo se couber, senão em cima
    const r=el.getBoundingClientRect(),H=Math.min(window.innerHeight*0.46,320),bottomBar=110;
    let top=r.bottom+10;if(top+H>window.innerHeight-bottomBar)top=Math.max(64,r.top-H-10);
    f.style.top=top+'px';f.style.setProperty('--h',H+'px');
    f.querySelectorAll('.lupa-card').forEach((c,i)=>c.style.setProperty('--i',i));
    requestAnimationFrame(()=>f.classList.add('on'));
  }
  // toque nos versículos (antes dos outros modos), saída pela aba e fechamento ao rolar
  const host=$('textBody');
  if(host)host.addEventListener('click',e=>{
    if(!on)return;e.preventDefault();e.stopImmediatePropagation();
    const el=e.target.closest('.verse');if(!el){closeCards();return}
    const ref=refOf(el);if(!ref){closeCards();return}
    if(current===ref.label){closeCards();return}
    show(el,ref);
    // se o hebraico ainda estava chegando, refaz quando chegar
    if(!NT_BOOKS.includes(ref.book)&&typeof OSHB_STRONG!=='undefined'&&OSHB_STRONG.__stub&&window.DoxaLoadOshb)window.DoxaLoadOshb(()=>{if(current===ref.label)show(el,ref)});
  },true);
  window.addEventListener('click',e=>{
    if(!on)return;
    if(e.target.closest?.('#doxa30Tools')){e.preventDefault();e.stopImmediatePropagation();setMode(false);return}
    if(!e.target.closest?.('#lupaFloat,#textBody'))closeCards();
  },true);
  let lastY=window.scrollY;
  window.addEventListener('scroll',()=>{if(on&&$('lupaFloat')&&Math.abs(window.scrollY-lastY)>30)closeCards();lastY=window.scrollY},{passive:true});

  ensureCard();setTimeout(ensureCard,1200);
  window.DoxaLupa={setMode,measures:(t,b,st)=>measures(t,b,st),measuresAt:(b,c,v)=>{const cp=corpusFor(b),H=hebOf({book:b,chapter:c,verse:v}),vt=cp?verseTokens(cp,b,H.chapter,H.verse):null;const tx=(CORPORA.almeida.books.find(x=>x.book===b)?.chapters.find(x=>+x.chapter===c)?.verses.find(x=>+x.number===v)||{}).text||'';return measures(tx,b,new Set(vt?vt.toks.map(t=>t.s):[]),c)},rarities:(b,c,v)=>{const cp=corpusFor(b),H=hebOf({book:b,chapter:c,verse:v});return cp?rarities(cp,b,H.chapter,H.verse):null},structure:(b,c,v)=>{const cp=corpusFor(b),H=hebOf({book:b,chapter:c,verse:v});return cp?structure(cp,b,H.chapter,H.verse):null}};
})();
