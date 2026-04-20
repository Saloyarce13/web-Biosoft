import re
from pathlib import Path

base = Path('src/components/ui')
pattern = re.compile(r'(["\'])(@?[^"\']+?)@[0-9][^"\']*(["\'])')
changed = 0
for path in base.rglob('*.tsx'):
    text = path.read_text(encoding='utf-8')
    new = pattern.sub(r'\1\2\3', text)
    if new != text:
        path.write_text(new, encoding='utf-8')
        changed += 1
print(f'Updated {changed} files')
