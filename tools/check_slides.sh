#!/usr/bin/env bash
# Sweep a lecture deck against the slide rules in CLAUDE.md.
#
#   tools/check_slides.sh Lecture02
#
# Layout (headless Chrome, on a temporary copy): frame overflow, content below the
# footline or at the side edges, overlays (.doodle/.here/.ic) overlapping text.
# Static: deck.js total, British spellings, margin-top/bottom:auto spacers, base64 blobs.
# Fonts: fallback fonts in the built PDF (run tools/make_pdf.sh first).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME="${CHROME:-google-chrome}"
D="${1:?usage: tools/check_slides.sh <Lecture>}"
SRC="$ROOT/lectures/$D"
[[ -d "$SRC" ]] || { echo "error: no such deck: $SRC" >&2; exit 1; }

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
cp -r "$ROOT/lectures/theme" "$SRC" "$tmp/"
cp "$ROOT/tools/check_slides_measure.js" "$tmp/measure.js"

echo "== layout"
for f in $(find "$tmp/$D" -maxdepth 1 -name 'slide*.html' | sort -V); do
  sed -i 's|</body>|<script src="../measure.js"></script></body>|' "$f"
  r=$("$CHROME" --headless --disable-gpu --virtual-time-budget=4000 --window-size=1280,720 --dump-dom "file://$f" 2>/dev/null \
      | grep -o '<pre id="sweep">[^<]*' | sed 's/<pre id="sweep">//')
  [[ "$r" != "[]" ]] && echo "$(basename "$f"): $r"
done

echo "== static"
n=$(find "$SRC" -maxdepth 1 -name 'slide*.html' | wc -l)
t=$(grep -o 'total: [0-9]*' "$SRC/deck.js" | cut -d' ' -f2 || true)
[[ "$n" == "$t" ]] || echo "deck.js total is $t but there are $n slides"
brit=$(for f in "$SRC"/slide*.html; do sed -n '/<body>/,$p' "$f" | sed -E 's/<[^>]+>/ /g'; done \
  | grep -oiE '\b\w*(analys(e|ed|ing)|is(e|ed|ing|ation)|our|tre|lled|lling|ogue)\b' \
  | grep -iE 'analys[^i]|recognis|characteris|organis|realis|minimis|maximis|summaris|behaviour|colour|favour|centre|metre|modell|labell|travell|catalogue|practis|optimis|utilis' | sort -u | tr '\n' ' ' || true)
[[ -n "$brit" ]] && echo "British spellings: $brit"
grep -lE 'margin-(top|bottom):auto' "$SRC"/slide*.html 2>/dev/null | sed 's|.*/|auto-margin spacer in |' || true
grep -l 'base64,[A-Za-z0-9+/]\{100,\}' "$SRC"/slide*.html 2>/dev/null | sed 's|.*/|base64 blob in |' || true

echo "== fonts"
if [[ -f "$SRC/$D.pdf" ]]; then
  for p in $(seq 1 "$(pdfinfo "$SRC/$D.pdf" | awk '/^Pages/{print $2}')"); do
    f=$(pdffonts -f "$p" -l "$p" "$SRC/$D.pdf" | grep -oE 'Liberation\S*|DejaVu\S*|Noto\S*' | sort -u | tr '\n' ' ' || true)
    [[ -n "$f" ]] && echo "page $p falls back to: $f"
  done
else
  echo "no $D.pdf yet; run tools/make_pdf.sh $D"
fi
echo "done"
