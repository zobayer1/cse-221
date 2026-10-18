#!/usr/bin/env bash
# Convert course HTML to PDF with headless Chrome.
#
#   tools/make_pdf.sh Lecture02             # lectures/Lecture02/*.html -> lectures/Lecture02/Lecture02.pdf
#   tools/make_pdf.sh path/to/dir [out.pdf] # every *.html in dir, in slide order, merged into one PDF
#   tools/make_pdf.sh a.html b.html ...     # each file -> PDF next to it (e.g. quiz papers)
#
# Page size comes from each page's @page rule (slides: 1280x720px).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME="${CHROME:-google-chrome}"

usage() { sed -n '2,8p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1; }
[[ $# -ge 1 ]] || usage
command -v "$CHROME" >/dev/null || { echo "error: $CHROME not found (set CHROME=...)" >&2; exit 1; }

# print_pdf <html> <pdf>
print_pdf() {
  local src out
  src="$(realpath "$1")"
  out="$(realpath -m "$2")"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=3000 --print-to-pdf="$out" "file://$src" 2>/dev/null
  [[ -s "$out" ]] || { echo "error: failed to print $1" >&2; exit 1; }
}

# Resolve a bare lecture name such as "Lecture02" to lectures/Lecture02.
target="$1"
if [[ ! -e "$target" && -d "$ROOT/lectures/$target" ]]; then
  target="$ROOT/lectures/$target"
fi

if [[ -d "$target" ]]; then
  command -v pdfunite >/dev/null || { echo "error: pdfunite not found (poppler-utils)" >&2; exit 1; }
  dir="$(realpath "$target")"
  name="$(basename "$dir")"
  out="${2:-$dir/$name.pdf}"

  mapfile -t pages < <(find "$dir" -maxdepth 1 -name '*.html' -printf '%f\n' | sort -V)
  [[ ${#pages[@]} -gt 0 ]] || { echo "error: no .html files in $dir" >&2; exit 1; }

  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  parts=()
  for i in "${!pages[@]}"; do
    printf '\r[%d/%d] %s' "$((i + 1))" "${#pages[@]}" "${pages[$i]}"
    part="$tmp/$(printf '%04d' "$i").pdf"
    print_pdf "$dir/${pages[$i]}" "$part"
    parts+=("$part")
  done
  echo
  pdfunite "${parts[@]}" "$out"
  echo "wrote $out (${#pages[@]} pages)"
else
  for f in "$@"; do
    [[ -f "$f" && "$f" == *.html ]] || { echo "error: not an .html file: $f" >&2; exit 1; }
    out="${f%.html}.pdf"
    print_pdf "$f" "$out"
    echo "wrote $out"
  done
fi
