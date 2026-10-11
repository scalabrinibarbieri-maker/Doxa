"""Gera o banco do interlinear Doxa no formato do app.

Uso: python3 tools/interlinear_export.py <oshb_strong.js do pacote core-texts> <glosas.txt> <saída .js> [livro] [capítulo]
Exemplos:
  python3 tools/interlinear_export.py ~/core-texts/data/oshb_strong.js tools/interlinear-gen-01-glosas.txt app/src/main/assets/reader/js/49d.js Gen 1
  python3 tools/interlinear_export.py ~/core-texts/data/oshb_strong.js tools/interlinear-gen-02-glosas.txt app/src/main/assets/reader/js/49-gen-02.js Gen 2

Formato das glosas: verso.palavra|glosa|parte1;parte2;... (uma parte por segmento OSHB).
"""
import json,sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from interlinear_translit import form as trform, lemma as trlemma
t=open(sys.argv[1],encoding='utf-8').read(); d=json.loads(t[t.index('{'):t.rindex('}')+1])
gl={}
for line in open(sys.argv[2],encoding='utf-8'):
    line=line.rstrip('\n')
    if not line: continue
    k,g,*p=line.split('|'); gl[k]=(g,p[0].split(';') if p else [g])
# sentidos corrigidos onde o strong-pt (chaveado só pelo número) mistura verbetes homógrafos
SENSES={'H6960b':['ajuntar-se','reunir-se'],'H4723c':['ajuntamento','reunião'],'H5774a':['voar','esvoaçar'],
        'H8577b':['monstro marinho','serpente','dragão'],'H2416c':['ser vivente','animal','fera'],
        'H6049a':['trazer nuvens','anuviar'],'H6601a':['ser espaçoso','alargar'],
        'H6327a':['espalhar-se','dispersar'],
        'H2490c':['começar (hifil)','profanar (piel/nifal)']}
# Etiquetas do OSHB contrariadas pelo contexto (o original fica visível no painel).
MORPH_FIX={  # מִמֶּנּוּ = "dele" (a árvore), não "de nós"
    ('Gen',2):{'17.6':'HR/Sp3ms','17.10':'HR/Sp3ms'},
    ('Gen',3):{'3.9':'HR/Sp3ms','11.13':'HR/Sp3ms','17.14':'HR/Sp3ms'},
    ('Gen',6):{'14.7':'HTo','21.7':'HC/Vqq2ms'},  # אֶת = marca do objeto; וְאָסַפְתָּ = weqatal
    ('Gen',7):{'14.6':'HR/Ncmsc/Sp3fs'},  # לְמִינָהּ: sufixo 3fs (OSHB marca 3fp)
}
BOOK=sys.argv[4] if len(sys.argv)>4 else 'Gen'
CH=int(sys.argv[5]) if len(sys.argv)>5 else 1
NAMES={'Gen':'Gênesis','Exod':'Êxodo'}
ch=d['d'][d['b'].index(BOOK)][CH-1]; verses=[]; lemma_tr={}; senses={}
for vi,v in enumerate(ch,1):
    out=[]; wi=0
    for w in v:
        if not isinstance(w,list): continue
        g,p=gl.pop(f'{vi}.{wi}'); segs=w[4].split('/')
        assert len(p)==len(segs),(f'{vi}.{wi}',w[4],p)
        out.append([w[0],trform(w[0],d['m'][w[2]]),g,p]); wi+=1
        li=w[3]
        if li>=0:
            l=d['l'][li]; lemma_tr[str(li)]=trlemma(l[3])
            key=l[1]+(l[2] or '')
            if key in SENSES: senses[str(li)]=SENSES[key]
    verses.append(out)
assert not gl,('glosas sem palavra correspondente',sorted(gl))
fix=MORPH_FIX.get((BOOK,CH),{})
data={'book':BOOK,'chapter':CH,'version':1,'verses':verses,'lemmaTr':lemma_tr,'senses':senses}
if fix: data['morphFix']=fix
js=('/* Doxa · Interlinear hebraico · '+NAMES.get(BOOK,BOOK)+' '+str(CH)+'\n'
    '   Texto e morfologia: WLC/OSHB (já instalados no app). Glosas e transliteração: Doxa. */\n'
    'window.DOXA_IL2=window.DOXA_IL2||{};window.DOXA_IL2["'+BOOK+'.'+str(CH)+'"]='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
dst=sys.argv[3]; os.makedirs(os.path.dirname(dst),exist_ok=True); open(dst,'w',encoding='utf-8').write(js)
print('ok',len(verses),sum(map(len,verses)),'palavras',len(lemma_tr),'lemas',sorted(senses),len(js),'bytes')
