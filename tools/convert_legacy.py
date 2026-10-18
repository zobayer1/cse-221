#!/usr/bin/env python3
"""Convert an old self-contained slide deck to the shared Beamer-style theme.

usage: tools/convert_legacy.py lectures/_archive/LectureNN-v1 lectures/LectureNN
Slide 1 (cover) is skipped; it is written separately.
Embedded <img> data URIs are saved to <out-dir>/thumbs/slideNN-K.ext; rename them to something meaningful afterwards.
"""
import re, sys, base64, pathlib

src, out = map(pathlib.Path, sys.argv[1:3])

FONT_CSS = [
    (r"'Source Serif 4',\s*Georgia,\s*serif", "var(--serif)"),
    (r"'Source Serif 4'", "var(--serif)"),
    (r"'IBM Plex Sans',\s*Arial,\s*sans-serif", "var(--sans)"),
    (r"'IBM Plex Sans'", "var(--sans)"),
    (r"'IBM Plex Mono',\s*monospace", "var(--mono)"),
    (r"'IBM Plex Mono'", "var(--mono)"),
]
FONT_SVG = [
    ('font-family="Source Serif 4"', 'font-family="CMU Serif, KaTeX_Main, KaTeX_Size1"'),
    ('font-family="IBM Plex Sans"', 'font-family="CMU Sans Serif, KaTeX_Main, KaTeX_Size1"'),
    ('font-family="IBM Plex Mono"', 'font-family="CMU Typewriter Text, KaTeX_Main, KaTeX_Size1"'),
]

def extract_images(html, stem):
    """Save embedded <img> data URIs into out/thumbs/ and point the src at the file."""
    def save(m):
        ext = "jpg" if m.group(2) == "jpeg" else m.group(2)
        save.n += 1
        name = f"thumbs/{stem}-{save.n}.{ext}"
        (out / "thumbs").mkdir(exist_ok=True)
        (out / name).write_bytes(base64.b64decode(m.group(3)))
        return f'{m.group(1)}"{name}"'
    save.n = 0
    return re.sub(r'(<img[^>]*?src=)"data:image/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/=]+)"', save, html)

def convert(html, stem):
    html = extract_images(html, stem)
    html = re.sub(r"base64,[A-Za-z0-9+/=]{200,}", "base64,", html)  # fonts are not kept
    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
    style = re.search(r"<style>(.*?)</style>", html, re.S).group(1)
    # keep only the slide-specific CSS that follows the shared preamble
    style = style.split(".foot b {", 1)[1].split("}", 1)[1]
    style = re.sub(r"@font-face\s*{[^}]*}\s*", "", style)  # fonts come from the theme
    for a, b in FONT_CSS:
        style = re.sub(a, b, style)
    style = re.sub(r"\s*font-variation-settings:[^;}]*;?", "", style)
    style = style.replace("font-weight:600", "font-weight:700").replace("font-weight:500", "font-weight:400")
    # the theme centres content; spacers that push content to the edges go
    style = style.replace("margin-top:auto", "margin-top:36px")
    style = re.sub(r"\s*margin-bottom:auto;?", "", style)  # pins content to the top otherwise
    body = re.search(r'<div class="slide">(.*)</div><script>', html, re.S).group(1)
    body = re.sub(r'<div class="foot">.*?</div>', "", body, flags=re.S)
    body = re.sub(r'<div class="bands">.*?</div>', "", body, flags=re.S)
    # a heading wrapper with a tag pill: <div class="x"><h2>T</h2><span class="tag2">Discuss</span></div>
    # tags (Discuss, Think, Caution, …) go into the title bar as .ftag, colored by the old class
    TAGCOLOR = {"tagr": " red", "tagt": " amber", "tagh": " ink"}
    tag = ""
    m = re.search(r'<div[^>]*>\s*(?:<h2>(.*?)</h2>)?\s*<span class="(tag[a-z0-9]*)">(.*?)</span>\s*</div>', body, re.S)
    if m:
        tag = f'<span class="ftag{TAGCOLOR.get(m.group(2), "")}">{m.group(3).strip()}</span>'
        h2 = m.group(1)
        body = body[:m.start()] + (f"<h2>{h2}</h2>" if h2 else "") + body[m.end():]
    m = re.search(r"<h2>(.*?)</h2>", body, re.S)
    frametitle = (m.group(1).strip() if m else title) + tag
    if m:
        body = body[:m.start()] + body[m.end():]
    body = body.replace('<div class="content">', '<div class="frame">', 1)
    body = body.replace("margin-top:auto", "margin-top:36px")  # inline spacers too
    body = re.sub(r"margin-bottom:auto;?", "", body)
    for a, b in FONT_SVG:
        body = body.replace(a, b)
    # glyphs no theme font has: draw them as SVG marks in the text color
    # (only outside <svg> drawings: an <svg> inside SVG <text> is invalid)
    parts = re.split(r"(<svg\b.*?</svg>)", body, flags=re.S)
    for k, part in enumerate(parts):
        if part.startswith("<svg"):
            if "✔" in part or "✘" in part:
                print(f"warning: ✔/✘ inside an SVG drawing; draw it as a path by hand", file=sys.stderr)
            continue
        part = part.replace("✔", '<svg class="tick" viewBox="0 0 16 16"><path d="M3 8.5l3.3 3.3L13 4.6"/></svg>')
        parts[k] = part.replace("✘", '<svg class="cross" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></svg>')
    body = "".join(parts)
    body = body.replace("▷ ", "// ")                 # CLRS 3rd edition comment marker
    body = body.replace("◂", "◃").replace("▸", "▹")  # outline triangles exist in KaTeX_Main
    body = re.sub(r"([₀-₉])", lambda m: "<sub>%d</sub>" % ("₀₁₂₃₄₅₆₇₈₉".index(m.group(1))), body)
    body = re.sub(r"font-family:\s*'IBM Plex Mono'[^;\"]*", "font-family:var(--mono)", body)
    body = re.sub(r"font-family:\s*'Source Serif 4'[^;\"]*", "font-family:var(--serif)", body)
    body = re.sub(r"font-family:\s*'IBM Plex Sans'[^;\"]*", "font-family:var(--sans)", body)
    # unquoted names too (e.g. style="font-family:IBM Plex Sans")
    body = re.sub(r"font-family:\s*IBM Plex Mono[^;\"]*", "font-family:var(--mono)", body)
    body = re.sub(r"font-family:\s*IBM Plex Sans[^;\"]*", "font-family:var(--sans)", body)
    body = re.sub(r"font-family:\s*Source Serif 4[^;\"]*", "font-family:var(--serif)", body)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="../theme/theme.css"><style>
{style.strip()}
</style></head>
<body><div class="slide">
<div class="frametitle">{frametitle}</div>
{body.strip()}
</div><script src="deck.js"></script><script src="../theme/theme.js"></script></body></html>
"""

files = sorted(src.glob("slide*.html"))
for f in files[1:]:
    (out / f.name).write_text(convert(f.read_text(), f.stem))
    print(f.name, len((out / f.name).read_text()))
