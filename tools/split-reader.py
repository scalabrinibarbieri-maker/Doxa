"""Reproduce public reader code and private extraction ranges from the exact V29 HTML."""
import hashlib, re, sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]).read_bytes()
expected = (root/'app/src/main/assets/v29-manifest.tsv').read_text().splitlines()
row = next(x.split('\t') for x in expected if x.startswith('index.html\t'))
assert len(source) == int(row[1]) and hashlib.sha256(source).hexdigest() == row[2]
out = root/'app/src/main/assets/reader'
(out/'js').mkdir(parents=True, exist_ok=True)
(out/'css').mkdir(exist_ok=True)
ranges = []
def data(name, start, end):
    body = source[start:end]
    ranges.append((name, start, len(body), hashlib.sha256(body).hexdigest()))
    return '<script src="data/'+name+'"></script>\n'
replacements = []
for i, match in enumerate(re.finditer(rb'<script\b([^>]*)>([\s\S]*?)</script\s*>', source, re.I)):
    attrs, body = match.group(1), match.group(2)
    base = match.start(2)
    cuts = []
    prefix = ''
    if b'doxa-v14-strong-pt-layer' in attrs:
        m = re.search(rb'const DOXA_STRONG_PT_H\s*=.*?;(?=\s*[\r\n])', body)
        assert m
        cuts.append((m.start(), m.end(), 'strong-pt.js'))
    if i == 2:
        names = ['HYPER_BLOCKS','ALMEIDA','WLC','TR','OSHB_STRONG','BOOK_NAMES']
        starts = [re.search(rb'const '+n.encode()+rb'\s*=', body).start() for n in names]
        for j in range(5):
            a,b = starts[j:j+2]
            assert body[a:b].rstrip().endswith(b';')
            cuts.append((a,b,names[j].lower()+'.js'))
    if b'doxa-v17-local-bibles' in attrs:
        # These assignments contain single-line JSON literals; no local IIFE dependencies.
        for m in re.finditer(rb'CORPORA\["([a-z0-9]+)"\]\s*=\s*(\{[^\r\n]*?\});(?=CORPORA|\s*[\r\n])', body):
            cuts.append((m.start(),m.end(),'bible-'+m.group(1).decode()+'.js'))
        assert len(cuts) == 10, len(cuts)
    for a,b,name in cuts:
        prefix += data(name,base+a,base+b)
    for a,b,name in reversed(cuts): body = body[:a]+body[b:]
    filename = f'{i:02}.js'
    (out/'js'/filename).write_bytes(body)
    replacements.append((match.start(),match.end(),prefix.encode()+b'<script'+attrs+b' src="js/'+filename.encode()+b'"></script>'))
for i,match in enumerate(re.finditer(rb'<style\b([^>]*)>([\s\S]*?)</style\s*>',source,re.I)):
    filename=f'{i:02}.css'
    (out/'css'/filename).write_bytes(match.group(2))
    replacements.append((match.start(),match.end(),b'<link rel="stylesheet"'+match.group(1)+b' href="css/'+filename.encode()+b'">'))
html=source
for a,b,replacement in sorted(replacements,reverse=True): html=html[:a]+replacement+html[b:]
(out/'index.html').write_bytes(html)
assert len(ranges)==16
manifest = 'source\t'+str(len(source))+'\t'+hashlib.sha256(source).hexdigest()+'\n'
manifest += ''.join('\t'.join(map(str,r))+'\n' for r in ranges)
(root/'app/src/main/assets/reader-data.tsv').write_text(manifest)
print('Split:',len(html),'HTML bytes;',len(ranges),'private banks;',len(replacements),'public code blocks')
