from pathlib import Path
import re
base=Path(__file__).resolve().parent.parent
html=(base/'index.html').read_text()
html=re.sub(r'\s*<link rel="manifest"[^>]+>', '', html)
html=re.sub(r'\s*<link rel="stylesheet"[^>]+>', '', html)
html=re.sub(r'\s*<script type="module" src="./app.js"></script>', '', html)
css=(base/'styles.css').read_text();content=(base/'content.js').read_text().replace('export const SOURCES','const SOURCES').replace('export const MODULES','const ORIGINAL_QUESTIONS');alignment=(base/'alignment.js').read_text().replace('export function','function');app=(base/'app.js').read_text();app=re.sub(r"^import[^\n]*\n",'',app,flags=re.M)
html=html.replace('</head>',f'<style>\n{css}\n</style>\n</head>')
script=content+'\n'+alignment+'\n'+app
html=html.replace('</body>',f'<script>\n{script}\n</script>\n</body>')
output=base/'Oral_Lab_Offline.html'
output.write_text(html)
print(output,output.stat().st_size)
