from pathlib import Path

path = Path('ROADMAP.md')
text = path.read_text(encoding='utf-8')
changes = {
    '## P5R — Retention expansion [IN PROGRESS]': '## P5R — Retention expansion [DONE]',
    '### Parallel gameplay lane — late-world identity [IN PROGRESS]': '### Parallel gameplay lane — late-world identity [DONE]',
}
for old, new in changes.items():
    if old not in text:
        raise RuntimeError(f'marker not found: {old}')
    text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('completed roadmap section statuses closed')
