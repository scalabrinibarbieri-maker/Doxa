"""Transliteração do hebraico bíblico para leitor brasileiro.

Pronúncia de referência: hebraico israelense (sefardita moderna), sem dobrar consoantes.
  ב b / v      כ k / rr     פ p / f      ח rr (como o rr de "carro")
  ו v (consoante), u (shureq), o (holam)   ה h aspirado (como no inglês "house")
  ש sh   שׂ e ס s (ss entre vogais)   צ ts   ק k   י y   ג g (gu antes de e/i)
  א e ע não têm som próprio; o apóstrofo marca a separação de sílaba
  shevá móvel = e; shevá quiescente = nada
  a sílaba tônica é sempre marcada com acento agudo (palavras de 2+ sílabas)
"""
import unicodedata, re

SHEVA = 'ְ'
HIRIQ, TSERE, SEGOL, PATAH, QAMATS = 'ִ', 'ֵ', 'ֶ', 'ַ', 'ָ'
HOLAM, QAMATS_QATAN = 'ֹ', 'ׇ'
DAGESH, SIN_DOT, OLE = 'ּ', 'ׂ', '֫'
VOWELS = {'ֱ': 'e', 'ֲ': 'a', 'ֳ': 'o', HIRIQ: 'i', TSERE: 'e', SEGOL: 'e',
          PATAH: 'a', QAMATS: 'a', HOLAM: 'o', 'ֺ': 'o', 'ֻ': 'u', QAMATS_QATAN: 'o'}
HATAF = {'ֱ', 'ֲ', 'ֳ'}
FINALS = {'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ'}
CONS = {'ב': ('b', 'v'), 'ג': ('g', 'g'), 'ד': ('d', 'd'), 'ה': ('h', 'h'), 'ו': ('v', 'v'),
        'ז': ('z', 'z'), 'ח': ('rr', 'rr'), 'ט': ('t', 't'), 'י': ('y', 'y'), 'כ': ('k', 'rr'),
        'ל': ('l', 'l'), 'מ': ('m', 'm'), 'נ': ('n', 'n'), 'ס': ('s', 's'), 'פ': ('p', 'f'),
        'צ': ('ts', 'ts'), 'ק': ('k', 'k'), 'ר': ('r', 'r'), 'ת': ('t', 't')}
ACUTE = {'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú'}
VOW = set('aeiouáéíóú')


def parse(word):
    out = []
    for c in unicodedata.normalize('NFD', word):
        if 'א' <= c <= 'ת':
            out.append({'L': FINALS.get(c, c), 'm': set()})
        elif out and '֑' <= c <= 'ׇ':
            out[-1]['m'].add(c)
    return out


def vmark(x):
    for m in VOWELS:
        if m in x['m']:
            return m
    return None


def translit(word, stress=None, lemma=False, sheva_vocal=(), qamats_hatuf=(), morph=''):
    """stress: sílaba tônica contada do fim (1 = última, 2 = penúltima). None = regra automática."""
    L = parse(word)
    n = len(L)
    syl = []        # [texto, marca_da_vogal]
    cur = ''
    glottal = False
    ole_syl = None
    furtive = False

    def push(v, mark):
        nonlocal cur, glottal
        pre = "'" if (glottal and not cur and syl) else ''
        syl.append([pre + cur + v, mark])
        cur = ''
        glottal = False

    for i, x in enumerate(L):
        l, m = x['L'], x['m']
        last = i == n - 1
        vm = vmark(x)
        prev = L[i - 1] if i else None
        prev_open = prev is None or (vmark(prev) is None and SHEVA not in prev['m'])
        if OLE in m:
            ole_syl = len(syl)
        # ו como vogal
        if l == 'ו' and vm is None and DAGESH in m and prev_open:
            push('u', 'u'); continue
        if l == 'ו' and vm == HOLAM and i > 0 and prev_open:
            push('o', HOLAM); continue
        # letras que só sustentam vogal
        if l == 'י' and vm is None and SHEVA not in m and prev and vmark(prev) in (HIRIQ, TSERE, SEGOL):
            continue
        if l == 'י' and vm is None and SHEVA not in m and prev and vmark(prev) == QAMATS and i == n - 2 and L[-1]['L'] == 'ו' and not L[-1]['m']:
            continue                                         # ָיו = av
        if l == 'ה' and last and DAGESH not in m and vm is None:
            continue
        if l == 'ע' and SHEVA in m and prev is not None and vmark(prev) not in (None,) and not last:
            if syl:
                syl[-1][0] += "'"                            # ע quiescente: ra'má
            continue
        if l in 'אע' and vm is None and SHEVA not in m:
            if not (last and l == 'ע'):
                glottal = True
                continue
        # consoante
        if l in 'אע':
            c = ''
        elif l == 'ש':
            c = 's' if SIN_DOT in m else 'sh'
        else:
            hard, soft = CONS[l]
            c = hard if DAGESH in m else soft
        # patah furtivo
        if last and vm == PATAH and l in 'חעה':
            if syl:
                syl[-1][0] += 'a' + c
                furtive = True
            continue
        if vm is not None:
            v = VOWELS[vm]
            if vm == QAMATS and i + 1 < n and '\u05b3' in L[i + 1]['m']:
                v = 'o'                                          # qamats antes de hataf-qamats: oholó
            if vm == QAMATS and (i in qamats_hatuf or (l == 'כ' and i + 1 == n - 1 and L[i + 1]['L'] == 'ל' and all(x['L'] in 'ובלמה' for x in L[:i]))):
                v = 'o'
            if l in 'אע' and syl:
                glottal = True
            cur += c
            push(v, vm)
        elif SHEVA in m:
            vocal = (i == 0 or i in sheva_vocal
                     or (prev is not None and SHEVA in prev['m'])
                     or (DAGESH in m and prev is not None and vmark(prev) is not None and l not in 'בגדכפת' + 'ו')
                     or (DAGESH in m and prev is not None and vmark(prev) in (PATAH, HIRIQ, SEGOL, QAMATS, TSERE) and l in 'בגדכפת')
                     or (i == 1 and L[0]['L'] == 'ו' and vmark(L[0]) == PATAH and l == 'י')
                     or (i == 1 and L[0]['L'] == 'ה' and vmark(L[0]) == QAMATS and l == 'ר')
                     or (i + 1 < n and L[i + 1]['L'] == l)                       # consoantes iguais: e-re-ráh
                     or (c == 'rr' and i + 1 < n and L[i + 1]['L'] == 'ר')          # evita "rrr": vayissakherú
                     or (i == 1 and L[0]['L'] == 'ו' and DAGESH in L[0]['m'] and vmark(L[0]) is None
                         and i + 1 < n and L[i + 1]['L'] in 'אהחע'))              # u-me-'át
            if last:
                vocal = False
            if l in 'אע':
                glottal = True
            cur += c
            if vocal:
                push('e', SHEVA)
            else:
                if syl:
                    syl[-1][0] += cur
                    cur = ''
        else:
            cur += c
    if cur:
        if syl:
            syl[-1][0] += cur
        else:
            syl.append([cur, None])

    ns = len(syl)
    word_nfc = unicodedata.normalize('NFC', word)
    if stress is None:
        stress = 1
        if ole_syl is not None:
            stress = ns - ole_syl
        elif lemma and ns >= 2:
            if syl[-1][1] == HIRIQ and syl[-1][0].startswith('y') and syl[-2][1] in (PATAH, QAMATS):
                stress = 2
        elif not lemma and ns >= 2:
            last_m, pen_m = syl[-1][1], syl[-2][1]
            end_letter = L[-1]['L']
            real_pen = pen_m not in (SHEVA, None) and pen_m not in HATAF
            yods = [x for x in L if x['L'] == 'י' and vmark(x) is not None]
            segs_m = morph.split('/') if morph else []
            word_nd = re.sub('[\u05bc\u05c1\u05c2]', '', word_nfc)  # sem dagesh e pontos do shin, para comparar sufixos
            last_v = max((k for k, x in enumerate(L) if vmark(x) is not None), default=-1)
            # nesiga no wayyiqtol: va-yí-rrar, va-yí-sha, va-yé-da (penúltima aberta, última fechada)
            wayy_retract = (bool(re.search(r'V[a-zA-Z]w', morph)) and ns == 3 and real_pen
                            and last_m in (PATAH, TSERE, HOLAM) and syl[-2][0][-1:] in VOW
                            and vmark(L[-1]) is None and L[-1]['L'] not in 'אה'
                            and last_v >= 0 and DAGESH not in L[last_v]['m'])
            if re.match(r'^H?V[a-zA-Z]p(1cs|2ms|1cp)$', segs_m[-1] if segs_m else '') and not morph.startswith('HC/'):
                stress = 2                                   # qatal 1cs/2ms/1cp: shamáti, natáta, akhálta
            elif re.search(r'\u05ea\u05b6[\u05dd\u05df]$', word_nd):
                stress = 1                                   # -tém/-tén: vihyitém
            elif re.search(r'\u05b0\u05e0\u05b8\u05d4$', word_nd) and not re.search(r'V[a-zA-Z][hp]1c', morph):
                stress = 2                                   # 3fp/2fp -na: vatipakárrna
            elif re.search(r'[\u05b5\u05b6]\u05bc?\u05e0(\u05b8\u05bc|\u05bc\u05b8)\u05d4$', word_nfc):
                stress = 2                                   # sufixo -énna: miména, torraléna
            elif re.search(r'[\u05b5\u05b6\u05b4]\u05d9?\u05da\u05b8$', word_nd):
                stress = 2                                   # sufixo -kha depois de vogal: ishtékha, apérra, tsivitírra
            elif re.search(r'([\u05b5\u05b6\u05b8\u05b7]|[\u05b5\u05b6\u05b4]\u05d9)\u05e0\u05d5$', word_nd) and not re.search(r'V[a-zA-Z]p3cp$', morph):
                stress = 2                                   # sufixo -nu: betsalménu, yadénu, miménnu, lánu
            elif 'Sp1cs' in morph and re.search(r'[\u05b5\u05b7\u05b8\u05b6]\u05e0\u05b4\u05d9$', word_nd):
                stress = 2                                   # sufixo -ni: hishi'áni
            elif re.search(r'[\u05b5\u05b8]\u05d4\u05d5$', word_nd):
                stress = 2                                   # sufixo -éhu: leminéhu
            elif end_letter == 'ה' and QAMATS in L[-1]['m']:
                stress = 2                                   # sufixo -ha: vekhivshúha, vayevi'éha
            elif last_m == SEGOL and end_letter in 'מנ' and len(L) > 1 and L[-2]['L'] in 'הכ':
                stress = 1                                   # sufixos -hem/-khem: lahém, shenehém
            elif last_m == SEGOL and end_letter != 'ה' and real_pen and not re.search(r'V[a-zA-Z]p', morph):
                stress = 2                                   # segolados: éreS, bóker, vayómer
            elif wayy_retract:
                stress = 2                                   # wayyiqtol com sílaba aberta: vayírrar, vayísha, vayéda
            elif last_m == PATAH and real_pen and pen_m in (PATAH, SEGOL, HOLAM) and (not re.search(r'V', morph) or end_letter in 'תנ') and (
                    end_letter in 'עח' or L[-2]['L'] in 'עחה'):
                stress = 2                                   # zéra, vayá'as, táchat
            elif last_m == HIRIQ and syl[-1][0].startswith('y') and pen_m in (PATAH, QAMATS) and not (yods and DAGESH in yods[-1]['m']):
                stress = 2                                   # máyim, shamáyim (não rrayím)
            elif word.endswith('ְלָה') and 'י' in word:
                stress = 2                                   # láyla
    parts = [s[0] for s in syl]
    if ns >= 2 or furtive:
        k = max(0, ns - stress)
        p = parts[k]
        for j, ch in enumerate(p):
            if ch in ACUTE:
                parts[k] = p[:j] + ACUTE[ch] + p[j + 1:]
                break
    s = ''.join(parts)
    res = ''
    for j, ch in enumerate(s):
        if ch == 's' and 0 < j < len(s) - 1 and s[j - 1] in VOW and s[j + 1] in VOW and s[j - 1:j] != 's':
            res += 'ss'
        elif ch == 'g' and j + 1 < len(s) and s[j + 1] in 'eiéí':
            res += 'gu'
        else:
            res += ch
    return res


FORM_STRESS = {'תֹהוּ': 2, 'וָבֹהוּ': 2, 'לָהֶם': 1, 'לָכֶם': 1, 'לְמִינֵהֶם': 1, 'לְמִינֵהוּ': 2, 'וְכִבְשֻׁהָ': 2,
               # Gênesis 2
               'וַיַּצְמַח': 1, 'הַבְּדֹלַח': 2, 'הַשֹּׁהַם': 2, 'אַחַת': 1, 'לָקַח': 1, 'תַּחְתֶּנָּה': 2, 'אֵלֶּה': 2,
               # Gênesis 3
               'אַיֶּכָּה': 2, 'כְּאַחַד': 1,
               # chave forma|morfologia quando a mesma grafia muda de tônica
               'זָרַע|HNcmsa': 2,
               # Gênesis 4
               'לָמָּה': 2, 'וְלָמָּה': 2, 'הָאַחַת': 1, 'וּבַרְזֶל': 1, 'וַיָּקָם': 2,
               # Gênesis 5
               'תֵּשַׁע': 2,
               # Gênesis 6
               'וְאָסַפְתָּ': 1,
               # Gênesis 7
               'וַתָּרָם': 2, 'בָּאוּ': 2, 'מֵתוּ': 2,
               # Gênesis 8
               'וַתָּשָׁב': 2, 'בְּאַחַת': 1,
               # Gênesis 9
               'כְנָעַן': 2, 'כְּנָעַן': 2, 'שְׁכֶם': 2, 'אַחַר': 1,
               # Gênesis 10 (pausais e he direcional átono)
               'כָּלַח': 2, 'שָׁלַח|HNp': 2, 'לָשַׁע': 2, 'נָפֹצוּ': 2, 'גְרָרָה': 2, 'סְדֹמָה': 2, 'סְפָרָה': 2,
               # Gênesis 11
               'הָבָה': 2, 'אַרְבַּע': 1, 'וְאַרְבַּע': 1, 'תָּרַח': 2, 'אַרְצָה': 2}
FORM_QAMATS_HATUF = {'לְאָכְלָה': (1,), 'לְעָבְדָהּ': (1,), 'וּלְשָׁמְרָהּ': (2,), 'אֲכָלְךָ': (1,), 'אֲכָלְכֶם': (1,), 'וַיָּקָם': (2,), 'וַתָּרָם': (2,), 'וַתָּשָׁב': (2,), 'יָקְטָן': (0,), 'וְיָקְטָן': (1,)}
LEMMA_STRESS = {'בֹּהוּ': 2, 'תַּחַת': 2, 'בָּבֶל': 2}
# formas inteiras: qerê perpétuo e o Nome
FORM_FULL = {'מִלְמַעְלָה': "milmá'la", 'וַיִּוָּלְדוּ': 'vayivaledú', 'הַהִוא': 'hahí', 'הִוא': 'hi', 'יְהוָה': 'YHWH', 'יְהֹוָה': 'YHWH', 'יֱהֹוִה': 'YHWH', 'יְהוִה': 'YHWH'}
LEMMA_FULL = {'יהוה': 'YHWH'}


def form(word, morph=''):
    w = unicodedata.normalize('NFC', word)
    if w in FORM_FULL:
        return FORM_FULL[w]
    st = FORM_STRESS.get(w + '|' + morph, FORM_STRESS.get(w))
    return translit(word, stress=st, qamats_hatuf=FORM_QAMATS_HATUF.get(w, ()), morph=morph)


def lemma(word):
    w = unicodedata.normalize('NFC', word)
    if w in LEMMA_FULL:
        return LEMMA_FULL[w]
    key = re.sub('[\u0591-\u05af]', '', w)
    return translit(word, stress=LEMMA_STRESS.get(w, LEMMA_STRESS.get(key)), lemma=True)
