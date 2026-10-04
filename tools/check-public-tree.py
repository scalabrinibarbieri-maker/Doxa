"""Keep personal V29 content and production secrets outside the public tree."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
paths = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard'], cwd=root, text=True).splitlines()
for name in paths:
    p = root / name
    assert p.suffix.lower() not in {'.apk', '.aab', '.jks'}, name
    assert p.suffix.lower() != '.keystore' or name == 'config/debug.keystore', name
    assert 'interlinear/genesis/' not in name and 'interlinear/exodus/' not in name, name
    assert p.stat().st_size < 1_000_000, name
manifest = (root / 'app/src/main/assets/v29-manifest.tsv').read_text().splitlines()
assert len(manifest) == 90
names = {line.split('\t')[0] for line in manifest}
assert 'index.html' in names
assert all(f'interlinear/genesis/{c:02}.js' in names for c in range(2,51))
assert all(f'interlinear/exodus/{c:02}.js' in names for c in range(1,41))
print('Public tree: no APK/corpora/production key; all 90 V29 asset identities recorded.')
