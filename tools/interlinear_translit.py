"""Transliteração do hebraico bíblico para leitor brasileiro.

Pronúncia de referência: hebraico israelense (sefardita moderna), sem dobrar consoantes.
  ב b / v      כ k / rr     פ p / f      ח rr (como o rr de "carro")
  ו v (consoante), u (shureq), o (holam)   ה h aspirado (como no inglês "house")
  ש sh   שׂ e ס s (ss entre vogais)   צ ts   ק k   י y   ג g (gu antes de e/i)
  א e ע não têm som próprio; o apóstrofo marca a separação de sílaba
  shevá móvel = e; shevá quiescente = nada
  a sílaba tônica é sempre marcada com acento agudo (palavras de 2+ sílabas)
"""
import unicodedata

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


def translit(word, stress=None, lemma=False, sheva_vocal=(), qamats_hatuf=()):
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
        if l == 'ה' and last and DAGESH not in m and vm is None:
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
            if vm == QAMATS and (i in qamats_hatuf or (l == 'כ' and i + 1 < n and L[i + 1]['L'] == 'ל' and i + 1 == n - 1)):
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
                     or (i == 1 and L[0]['L'] == 'ו' and vmark(L[0]) == PATAH and l == 'י'))
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
            if last_m == SEGOL and end_letter != 'ה' and real_pen:
                stress = 2                                   # segolados: éreS, bóker, vayómer
            elif last_m == PATAH and real_pen and pen_m in (PATAH, SEGOL, QAMATS) and (
                    end_letter in 'עח' or L[-2]['L'] in 'עח'):
                stress = 2                                   # zéra, vayá'as, táchat
            elif last_m == HIRIQ and syl[-1][0].startswith('y') and pen_m in (PATAH, QAMATS):
                stress = 2                                   # máyim, shamáyim
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


FORM_STRESS = {'תֹהוּ': 2, 'וָבֹהוּ': 2, 'לָהֶם': 1, 'לָכֶם': 1, 'לְמִינֵהֶם': 1, 'לְמִינֵהוּ': 2, 'וְכִבְשֻׁהָ': 2}
FORM_QAMATS_HATUF = {'לְאָכְלָה': (1,)}
LEMMA_STRESS = {'בֹּהוּ': 2, 'תַּחַת': 2}


def form(word):
    w = unicodedata.normalize('NFC', word)
    return translit(word, stress=FORM_STRESS.get(w), qamats_hatuf=FORM_QAMATS_HATUF.get(w, ()))


def lemma(word):
    w = unicodedata.normalize('NFC', word)
    return translit(word, stress=LEMMA_STRESS.get(w), lemma=True)
