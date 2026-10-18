#!/usr/bin/env bash
# Move each .doodle overlay to the nearest free spot (see tools/place_doodles.js).
#
#   tools/place_doodles.sh Lecture02 slide09.html slide12.html   # rewrites those slides
#
# Each overlay's left/top/width is rewritten in place. Review the result afterwards:
# the nearest free spot is not always the best one for the slide's meaning.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME="${CHROME:-google-chrome}"
D="${1:?usage: tools/place_doodles.sh <Lecture> <slideNN.html>...}"; shift
SRC="$ROOT/lectures/$D"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
cp -r "$ROOT/lectures/theme" "$SRC" "$tmp/"
cp "$ROOT/tools/place_doodles.js" "$tmp/place.js"
for name in "$@"; do
  f="$tmp/$D/$name"
  sed -i 's|</body>|<script src="../place.js"></script></body>|' "$f"
  r=$("$CHROME" --headless --disable-gpu --virtual-time-budget=4000 --window-size=1280,720 --dump-dom "file://$f" 2>/dev/null \
      | grep -o '<pre id="place">[^<]*' | sed 's/<pre id="place">//')
  python3 - "$SRC/$name" "$r" <<'EOF'
import json, re, sys
path, res = sys.argv[1], json.loads(sys.argv[2])
s = open(path).read()
tags = list(re.finditer(r'<div class="doodle" style="[^"]*">', s))
for p in sorted(res, key=lambda p: -p["idx"]):
    if p.get("none"):
        print(f"{path}: overlay {p['idx']}: no free spot, left as is"); continue
    m = tags[p["idx"]]
    new = f'<div class="doodle" style="left:{p["left"]}px;top:{p["top"]}px;width:{p["width"]}px">'
    s = s[:m.start()] + new + s[m.end():]
    print(f"{path.rsplit('/',1)[-1]}: overlay {p['idx']} → left {p['left']}, top {p['top']}, width {p['width']} (scale {p['scale']}, moved {p['dist']}px)")
open(path, "w").write(s)
EOF
done
