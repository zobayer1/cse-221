#!/usr/bin/env bash
# Mirror the course files into _drive/ (git-ignored) and upload it to the course Google Drive folder.
#
#   tools/sync_drive.sh stage          # refresh _drive/ only
#   tools/sync_drive.sh push           # stage, then dry run: show what would be uploaded
#   tools/sync_drive.sh push --apply   # stage, then upload
#   tools/sync_drive.sh ls [path]      # list the Drive folder (recursively)
#
# _drive/ has the Drive folder's layout and names: Lectures/LectureNN.pdf (Lecture00 is the
# Introduction), Quizzes/QN/CSE221_QuizN[_Answers].pdf, Assignments/assignmentN.pdf, Simulations/*. What goes in comes from site/content.json, as for the
# website: only entries marked "released": true, and quiz answers only once answersReleased is
# also true. Build PDFs first with tools/make_pdf.sh.
#
# A staged file is replaced only when its content changes: PDF build dates and IDs are ignored, so
# a rebuild alone uploads nothing. Uploads never delete anything on Drive, and a changed file
# replaces the Drive file in place, so its share link stays the same.
#
# One-time setup (log in with the academic account):
#   rclone config create cse221 drive scope=drive root_folder_id=<FOLDER_ID>
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${DRIVE_REMOTE:-cse221:}"
STAGE="$ROOT/_drive"

usage() { sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1; }

stage() {
  python3 -I - "$ROOT" "$STAGE" <<'PY'
import json, os, re, shutil, sys

root, stage = sys.argv[1], sys.argv[2]
c = json.load(open(os.path.join(root, "site", "content.json")))
plan = {}  # staged path -> source path

for l in c["lectures"]:
    if not l.get("released"):
        continue
    d = l["dir"]
    plan[f"Lectures/{d}.pdf"] = f"lectures/{d}/{d}.pdf"
for q in c["quizzes"]:
    d, n = q["dir"], re.sub(r"\D", "", q["dir"])
    if q.get("released"):
        plan[f"Quizzes/Q{n}/CSE221_Quiz{n}.pdf"] = f"quizzes/{d}/{q['paper'][:-5]}.pdf"
        if q.get("answersReleased"):
            plan[f"Quizzes/Q{n}/CSE221_Quiz{n}_Answers.pdf"] = f"quizzes/{d}/{q['answers'][:-5]}.pdf"
for a in c["assignments"]:
    if a.get("released"):
        plan[f"Assignments/{a['dir']}.pdf"] = f"assignments/{a['dir']}/{a['paper'][:-5]}.pdf"
for s in c["simulators"]:
    if not s.get("released"):
        continue
    f = f"{s['id']}_simulator.html"
    plan[f"Simulations/{f}"] = f"simulations/{f}"
plan["Simulations/LICENSE"] = "simulations/LICENSE"

# Build dates (Chrome) and the trailer /ID (pdfunite) change on every build.
VOLATILE = re.compile(rb"/(?:CreationDate|ModDate)\s*\([^)]*\)|/ID\s*\[[^\]]*\]")
def same(a, b):
    x, y = open(a, "rb").read(), open(b, "rb").read()
    if x == y:
        return True
    return a.endswith(".pdf") and VOLATILE.sub(b"", x) == VOLATILE.sub(b"", y)

for dst, src in plan.items():
    s, t = os.path.join(root, src), os.path.join(stage, dst)
    if not os.path.isfile(s):
        print(f"missing  {src} (build it with tools/make_pdf.sh)", file=sys.stderr)
        continue
    if os.path.isfile(t) and same(s, t):
        continue
    os.makedirs(os.path.dirname(t), exist_ok=True)
    shutil.copyfile(s, t)
    print(f"staged   {src} -> {dst}")

# Drop staged files that are no longer published (Drive itself is never touched).
for d, _, files in os.walk(stage, topdown=False):
    for f in files:
        rel = os.path.relpath(os.path.join(d, f), stage)
        if rel not in plan:
            os.remove(os.path.join(d, f))
            print(f"unstaged {rel}")
    if d != stage and not os.listdir(d):
        os.rmdir(d)
PY
}

remote() {
  command -v rclone >/dev/null || { echo "error: rclone not found (sudo dnf install rclone)" >&2; exit 1; }
  rclone listremotes | grep -qx "$REMOTE" || { echo "error: no rclone remote $REMOTE (see setup above)" >&2; exit 1; }
}

cmd="${1:-}"; shift || true
case "$cmd" in
  stage)
    stage ;;
  ls)
    remote
    rclone lsf -R --format "tsp" --separator "  " "$REMOTE${1:-}" ;;
  push)
    remote
    case "${1:-}" in
      "")      flags=(--dry-run) ;;
      --apply) flags=() ;;
      *)       usage ;;
    esac
    stage
    rclone copy --checksum -v "${flags[@]}" "$STAGE" "$REMOTE" 2>&1 \
      | grep -E 'Copied|Skipped copy|ERROR' | sed -E 's/^[0-9\/ :]+(NOTICE|INFO|ERROR) *: *//' || true
    [[ ${#flags[@]} -eq 0 ]] || echo "(dry run; add --apply to upload)" ;;
  *)
    usage ;;
esac
