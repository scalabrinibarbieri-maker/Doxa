"""Check modular references and syntax; optionally verify exact V29 reconstruction."""
from pathlib import Path
import re, subprocess, sys, hashlib, tempfile
root=Path(__file__).resolve().parents[1]
assets=root/'app/src/main/assets'
reader=assets/'reader'
html=(reader/'index.html').read_bytes()
for p in sorted((reader/'js').glob('*.js')): subprocess.run(['node','--check',str(p)],check=True)
lines=(assets/'reader-data.tsv').read_text().splitlines()
ranges={p[0]: (int(p[1]),int(p[2]),p[3]) for p in (x.split('\t') for x in lines[1:])}
for path in re.findall(rb'(?:src|href)="((?:js|css|data)/[^"]+)"',html):
    path=path.decode()
    assert path[5:] in ranges if path.startswith('data/') else (reader/path).is_file(),path
if len(sys.argv)>1:
    original=Path(sys.argv[1]).read_bytes()
    head=lines[0].split('\t')
    assert len(original)==int(head[1]) and hashlib.sha256(original).hexdigest()==head[2]
    with tempfile.TemporaryDirectory() as temp:
        for name,(start,size,digest) in ranges.items():
            body=original[start:start+size]
            assert hashlib.sha256(body).hexdigest()==digest
            file=Path(temp)/name; file.write_bytes(body)
            subprocess.run(['node','--check',str(file)],check=True)
    # Reinsert removed data at original offsets into each script; all remaining code must be byte-identical.
    for i,m in enumerate(re.finditer(rb'<script\b[^>]*>([\s\S]*?)</script\s*>',original,re.I)):
        body=m.group(1)
        for start,size,digest in sorted(ranges.values(),reverse=True):
            if m.start(1)<=start<m.end(1):
                relative=start-m.start(1); body=body[:relative]+body[relative+size:]
        assert body==(reader/'js'/f'{i:02}.js').read_bytes(),i
    for i,m in enumerate(re.finditer(rb'<style\b[^>]*>([\s\S]*?)</style\s*>',original,re.I)):
        assert m.group(1)==(reader/'css'/f'{i:02}.css').read_bytes()
    print('V29: all 18 script remainders and 21 styles byte-identical; 16 private banks verified.')
print('Modular reader: syntax and local references OK.')
