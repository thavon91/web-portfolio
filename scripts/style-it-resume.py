"""Generate the IT resume with a compact sidebar and no game portfolio."""
from pathlib import Path

base = Path(__file__).with_name('style-resume.py')
source = base.read_text()
lines = source.splitlines()
# Remove the complete portfolio row, including its icon and link annotation.
start = next(i for i, line in enumerate(lines) if line.startswith('vector_icon((28, 487,'))
end = next(i for i in range(start, len(lines)) if "'https://thavon91.github.io/web-portfolio/'" in lines[i])
del lines[start:end + 1]
source = '\n'.join(lines)
source = source.replace("'Game Developer'", "'Git; Jira; AI; React.js; Docker; Threejs'")
source = source.replace("heading(30, 540, 'EXPERTISE'", "heading(30, 514, 'EXPERTISE'")
source = source.replace('y = 566', 'y = 540')
source = source.replace("heading(30, 706, 'LANGUAGE'", "heading(30, 694, 'LANGUAGE'")
source = source.replace('y = 732', 'y = 720')
source = source.replace("src/assets/pdf/Thavon_Resume.pdf", "src/assets/pdf/IT_Thavon_Resume.pdf")
source = source.replace('resume-styled.png', 'it-resume.png')
source = source.replace('THAVON PHANTHAMALAY - Resume', 'THAVON PHANTHAMALAY - IT Resume')
source = source.replace('doc.save(target,', "exec((ROOT / 'scripts/it-profile-page.py').read_text())\ndoc.save(target,")
exec(compile(source, str(base), 'exec'), {'__file__': str(base.resolve())})
