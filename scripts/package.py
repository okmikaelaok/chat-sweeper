"""Create installable and corresponding-source archives without private test artifacts."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
out = root / 'dist'
out.mkdir(exist_ok=True)
def archive(name, paths):
    with zipfile.ZipFile(out / name, 'w', zipfile.ZIP_DEFLATED) as z:
        for path, arcname in sorted(paths, key=lambda item: item[1]):
            z.write(path, arcname)
    with zipfile.ZipFile(out / name) as z:
        assert z.testzip() is None
    print(f'Created dist/{name}')

archive('chatsweeper.zip', [(p, str(p.relative_to(root / 'extension'))) for p in (root/'extension').rglob('*') if p.is_file()])
files = []
for folder in ['src', 'scripts', 'tests', 'docs', 'licenses', 'extension']:
    files.extend((p, str(p.relative_to(root))) for p in (root/folder).rglob('*') if p.is_file())
for name in ['README.md','LICENSE','NOTICE','THIRD_PARTY_NOTICES.md','.gitignore','package.json','package-lock.json','tsconfig.json','components.json']:
    files.append((root/name, name))
archive('chatsweeper-source.zip', files)
