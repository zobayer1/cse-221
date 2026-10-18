#!/usr/bin/env python3
"""Build the course website into _site/ (or another folder).

    tools/build_site.py            # copy pages and published materials into _site/
    tools/build_site.py --pdf      # also build every lecture, quiz and assignment PDF first
    tools/build_site.py --out DIR  # write somewhere else

What gets published is listed in site/content.json. Nothing is published by default: a
lecture, simulator, quiz or assignment is copied only when its entry has "released": true,
a quiz's answers only once "answersReleased" is also true, and an assignment's instructor/
folder never. Lecture titles and slide counts come from
each deck.js, and slide titles from each slide's .frametitle.

Preview with:  python3 -m http.server -d _site 8000
"""
import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_SRC = ROOT / 'site'


def warn(msg):
    print(f'warning: {msg}', file=sys.stderr)


def make_pdf(*args):
    subprocess.run([str(ROOT / 'tools' / 'make_pdf.sh'), *map(str, args)], check=True)


def read_deck(folder):
    """Parse window.DECK = { title: '…', num: '…', label: '…', total: N } from deck.js."""
    src = (folder / 'deck.js').read_text(encoding='utf-8')
    deck = {k: v for k, v in re.findall(r"(\w+):\s*'((?:[^'\\]|\\.)*)'", src)}
    m = re.search(r'total:\s*(\d+)', src)
    deck['total'] = int(m.group(1)) if m else 0
    return deck


def slide_title(path):
    src = path.read_text(encoding='utf-8')
    m = re.search(r'<div class="frametitle">(.*?)</div>', src, re.S)
    if not m:
        return ''
    t = re.sub(r'<span class="ftag[^"]*">.*?</span>', '', m.group(1), flags=re.S)
    return html.unescape(re.sub(r'<[^>]+>', '', t)).strip()


def copy(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.is_dir():
        shutil.copytree(src, dst, dirs_exist_ok=True)
    else:
        shutil.copy2(src, dst)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', default=str(ROOT / '_site'))
    ap.add_argument('--pdf', action='store_true', help='build the PDFs with tools/make_pdf.sh first')
    a = ap.parse_args()

    out = Path(a.out).resolve()
    if out == ROOT or ROOT.is_relative_to(out):
        sys.exit(f'error: refusing to write into {out}')
    content = json.loads((SITE_SRC / 'content.json').read_text(encoding='utf-8'))
    glossary = json.loads((SITE_SRC / 'glossary.json').read_text(encoding='utf-8'))

    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    # Site pages and assets.
    for p in SITE_SRC.iterdir():
        if p.suffix != '.json':
            copy(p, out / p.name)
    (out / '.nojekyll').touch()

    # Lectures.
    copy(ROOT / 'lectures' / 'theme', out / 'lectures' / 'theme')
    lectures = []
    for lec in content['lectures']:
        if not lec.get('released'):
            continue
        d = ROOT / 'lectures' / lec['dir']
        slides = sorted(d.glob('slide*.html'), key=lambda p: int(re.sub(r'\D', '', p.stem)))
        deck = read_deck(d)
        if deck['total'] != len(slides):
            warn(f"{lec['dir']}/deck.js says total {deck['total']}, found {len(slides)} slides")
        if a.pdf:
            make_pdf(lec['dir'])
        dst = out / 'lectures' / lec['dir']
        for f in slides + [d / 'deck.js']:
            copy(f, dst / f.name)
        if (d / 'thumbs').is_dir():
            copy(d / 'thumbs', dst / 'thumbs')
        pdf = d / f"{lec['dir']}.pdf"
        if pdf.exists():
            copy(pdf, dst / pdf.name)
        else:
            warn(f'no PDF for {lec["dir"]} (run with --pdf)')
        titles = [slide_title(f) for f in slides]
        titles[0] = titles[0] or 'Title page'
        lectures.append({**lec, 'title': deck.get('title', lec['dir']), 'num': deck.get('num', ''),
                         'label': deck.get('label', ''), 'total': len(slides), 'slides': titles,
                         'pdf': pdf.name if pdf.exists() else None})
    listed = {l['dir'] for l in content['lectures']}
    for d in sorted((ROOT / 'lectures').glob('*/deck.js')):
        if d.parent.name not in listed:
            warn(f'lectures/{d.parent.name} is not listed in site/content.json')

    # Simulators: single self-contained files, copied as they are.
    sims = []
    for s in content['simulators']:
        if not s.get('released'):
            continue
        f = ROOT / 'simulations' / f"{s['id']}_simulator.html"
        if not f.exists():
            warn(f'missing simulator {f.name}')
            continue
        copy(f, out / 'simulations' / f.name)
        sims.append({**s, 'file': f'simulations/{f.name}'})
    copy(ROOT / 'simulations' / 'LICENSE', out / 'simulations' / 'LICENSE.txt')
    listed = {s['id'] for s in content['simulators']}
    for f in sorted((ROOT / 'simulations').glob('*_simulator.html')):
        if f.name.removesuffix('_simulator.html') not in listed:
            warn(f'simulations/{f.name} is not listed in site/content.json')

    def paper(folder, name, rel):
        """Copy one HTML paper (and its PDF); return its links."""
        src = folder / name
        if a.pdf:
            make_pdf(src)
        copy(src, out / rel / name)
        pdf = src.with_suffix('.pdf')
        if pdf.exists():
            copy(pdf, out / rel / pdf.name)
        return {'html': f'{rel}/{name}', 'pdf': f'{rel}/{pdf.name}' if pdf.exists() else None}

    # Quizzes: answers only once released.
    quizzes = []
    for q in content['quizzes']:
        if not q.get('released'):
            continue
        folder, rel = ROOT / 'quizzes' / q['dir'], f"quizzes/{q['dir']}"
        item = {'title': q['title'], 'topics': q.get('topics', ''), 'paper': paper(folder, q['paper'], rel)}
        if q.get('answers') and q.get('answersReleased'):
            item['answers'] = paper(folder, q['answers'], rel)
        quizzes.append(item)

    # Assignments: the paper, its assets/, and support/ (also as a zip). Never instructor/.
    assignments = []
    for asg in content['assignments']:
        if not asg.get('released'):
            continue
        folder, rel = ROOT / 'assignments' / asg['dir'], f"assignments/{asg['dir']}"
        item = {k: asg[k] for k in ('title', 'subtitle', 'due') if k in asg}
        item['paper'] = paper(folder, asg['paper'], rel)
        if (folder / 'assets').is_dir():
            copy(folder / 'assets', out / rel / 'assets')
        sup = folder / 'support'
        if sup.is_dir():
            files = sorted(p for p in sup.iterdir() if p.is_file())
            for f in files:
                copy(f, out / rel / 'support' / f.name)
            zname = f"{asg['dir']}-support.zip"
            with zipfile.ZipFile(out / rel / zname, 'w', zipfile.ZIP_DEFLATED) as z:
                for f in files:
                    z.write(f, f'{asg["dir"]}-support/{f.name}')
            item['support'] = [f'{rel}/support/{f.name}' for f in files]
            item['zip'] = f'{rel}/{zname}'
        assignments.append(item)
    assert not list(out.rglob('instructor')), 'instructor/ folder leaked into the site'

    data = {'course': content['course'], 'lectures': lectures, 'simulators': sims,
            'quizzes': quizzes, 'assignments': assignments, 'links': content['links'],
            'glossary': sorted(glossary, key=lambda t: t['term'].lower())}
    (out / 'assets' / 'data.js').write_text(
        '// Generated by tools/build_site.py from site/content.json and site/glossary.json.\n'
        'window.SITE = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')

    size = sum(p.stat().st_size for p in out.rglob('*') if p.is_file()) / 2**20
    print(f'wrote {out} ({len(lectures)} lectures, {len(sims)} simulators, {len(quizzes)} quizzes, '
          f'{len(assignments)} assignments, {size:.1f} MB)')


if __name__ == '__main__':
    main()
