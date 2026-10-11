from pathlib import Path
import re

base = Path(__file__).resolve().parent.parent
html = (base / 'index.html').read_text(encoding='utf-8')
html = re.sub(r'\s*<link rel="manifest"[^>]+>', '', html)
html = re.sub(r'\s*<link rel="stylesheet"[^>]+>', '', html)
html = re.sub(r'\s*<script type="module" src="./app.js"></script>', '', html)

css = (base / 'styles.css').read_text(encoding='utf-8')
content = (base / 'content.js').read_text(encoding='utf-8').replace('export const SOURCES', 'const SOURCES').replace('export const MODULES', 'const ORIGINAL_QUESTIONS')
alignment = (base / 'alignment.js').read_text(encoding='utf-8').replace('export function', 'function').replace('export const', 'const')
app = (base / 'app.js').read_text(encoding='utf-8')
app = re.sub(r"^import[^\n]*\n", '', app, flags=re.M)

html = html.replace('</head>', f'<style>\n{css}\n</style>\n</head>')
script = content + '\n' + alignment + '\n' + app
html = html.replace('</body>', f'<script>\n{script}\n</script>\n</body>')

# Gera tanto Oral_Lab_Offline.html quanto index-publicacao.html atualizados
for filename in ['Oral_Lab_Offline.html', 'index-publicacao.html']:
    target = base / filename
    target.write_text(html, encoding='utf-8')
    print(f'Gerado com sucesso: {target.name} ({target.stat().st_size} bytes)')
