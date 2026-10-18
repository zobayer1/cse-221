# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Course materials for **CSE221 – Algorithms** (undergraduate, BRAC University), Fall 2026, Section 19. Instructor: Zobayer Hasan, initials **ZBYR**.

Lecture slides are written as HTML first, and the PDF slides are made from those HTML pages. Algorithm simulators are standalone HTML pages that students open directly in a browser. The repo is a git repository with no build system, package manager or tests. Built PDFs, `books/` and `lectures/_archive/` are git-ignored (see `.gitignore`).

## Directories

- `books/`: Algorithms textbooks as PDFs. **CLRS (*Introduction to Algorithms*) is the primary textbook**. Cite it when a reference is needed.
- `lectures/<LectureNN>/slideNN.html`: one HTML file per slide (`Introduction/`, `Lecture01/`, …). The number in the file name is the slide order. `lectures/theme/` holds the shared theme, and `lectures/_archive/` holds pre-conversion backups (local only).
- `assignments/assignmentN/`: assignment papers (HTML, built to PDF like quizzes). Each one's `instructor/` folder holds reference solutions and is git-ignored: never publish it. Each one's `support/` folder holds helper programs for students, licensed **MIT** (not CC BY-NC-SA like everything else): it needs its own `LICENSE` file, and each source file starts with `// SPDX-License-Identifier: MIT`.
- `quizzes/quizN/`: quiz questions and answer scripts. Write these in HTML first, then convert them to PDF the same way as the slides.
- `simulations/<topic>_simulator.html`: interactive algorithm simulators, one file each.
- `tools/`: `make_pdf.sh` (build PDFs), `check_slides.sh` (rule checks), `place_doodles.sh` (place stick-figure overlays), `convert_legacy.py` (old-format deck → theme).

## Slide architecture

All lectures (`Introduction/`, `Lecture01/`–`Lecture04/`) use a Beamer-style theme with a LaTeX look. The conversion steps below apply to any old-format deck brought in later; pre-conversion backups are kept locally in `lectures/_archive/<Lecture>-vN/`.

### New theme (`lectures/theme/`)
- `theme.css` holds the shared stylesheet. It defines the Computer Modern fonts (CMU Sans Serif for text, CMU Serif for math and numbers, CMU Typewriter for code), loaded from `theme/fonts/` (OFL), and the BRAC-blue palette tokens. CMU lacks math symbols such as `≤ ≥ ≈ ∫ ∑ ⟨⟩`, so each font stack (`--sans`, `--serif`, `--mono`) falls back to KaTeX_Main / KaTeX_Size1 (MIT), which are also Computer Modern–based. In an SVG, write the stack out in full, e.g. `font-family="CMU Serif, KaTeX_Main, KaTeX_Size1"`. It also sets the 1280×720 canvas with its `@page` and print rules.
  - The frame has a `.frametitle` top bar and a `.frame` content area. The frame centers its content vertically as one group, because a projected slide is read around the middle. Avoid `margin:auto` spacers that push content to the top or bottom edges. Use `.push` / `.mt-l` for fixed gaps, and `.frame.top` only for slides that must start at the top.
  - Components:
    - `ul.items` / `ol.items`: Beamer-ball lists.
    - `.block > .bt + .bb`: theorem-style blocks, with `.alert` (red) and `.example` (green) variants.
    - `.cols`: grid columns, set with `--n` and `--gap`.
    - `table.tab`: booktabs-style tables.
    - `.cells > span`: boxed array cells, with `.hi`, `.out` and `.mark` states. The name avoids the old lectures' own `.arr` diagrams.
    - `.subhd`: a bold sub-heading.
    - `.code` / `.kw` / `.ln`: CLRS pseudocode.
    - `.frametitle .ftag`: a tag in the title bar (Discuss, Think, Caution, Trivia, No submission). It's a square, solid block with white uppercase text: dark navy by default, `.red` for warnings, `.amber` for trivia, `.ink` (black) for admin notes. Tags always go in the title bar, never in the slide body, and never as rounded pills.
    - `var` / `.math`: math italic.
    - `.titlepage`: the title page.
    - `.doodle`: a stick-figure overlay (see the stick-figure rule).
    - `svg.tick` / `svg.cross`: drawn ✔/✘ marks in the text color, since no theme font has those glyphs.
  - Keep theme class names distinctive. Old slides bring their own CSS with names like `.hd`, `.row`, `.big` and `.arr`, so the theme must not define those. If an old slide uses a name the theme already defines, such as `doodle`, rename it during conversion.
- `theme.js` holds the course details (name, initials, term, section) in one place. It fills `data-course="…"` / `data-deck="…"` placeholders, adds the three-part footline (author name only | `CSE 221 · <deck label>` | term · page `n / N`), and scales the slide to the window. It reads the page number from the file name.
- Each lecture folder has a `deck.js` with `window.DECK = { title: 'Search Algorithms', num: 'Lecture 2', label: 'Lecture 2: Search Algorithms', total: N }`. The title page shows the logo, then a smaller "CSE 221 – Algorithms" line, then the blue box with `num` above `title`. **Update `total` whenever slides are added or removed.**
- A slide is a small file: it links `../theme/theme.css`, adds a short `<style>` for anything specific to that slide, has a `.frametitle` and a `.frame`, and ends with `<script src="deck.js"></script><script src="../theme/theme.js"></script>`. Copy an Introduction slide to start a new one.
- Check new symbols with `pdffonts`. If `DejaVu*`, `Liberation*` or `Noto*` shows up, a glyph is missing from both CMU and KaTeX.
- Images go in `lectures/<Lecture>/thumbs/` as small files, never inlined as base64. Use JPEG (or PNG for diagrams or transparency) at about 2× the size shown on the slide. Don't upscale a small source, and don't re-encode if that makes the file bigger. Once the thumbnail is in place, the downloaded originals can be deleted.

### Converting a lecture
1. Back up the folder to `lectures/_archive/<Lecture>-v1/`, then run `tools/convert_legacy.py lectures/_archive/<Lecture>-v1 lectures/<Lecture>`. It rewrites slides 2…N:
   - moves the `h2` into `.frametitle`, and a tag pill next to it into `.ftag`;
   - drops the old footer, stripes and embedded fonts;
   - maps the old fonts onto the CMU stacks;
   - turns `margin-top:auto` spacers into fixed gaps and drops `margin-bottom:auto` (which pins content to the top);
   - moves body tags (`tag2`, `tagq`, `tagr`, `tagt`, `tagh`) into the title bar as colored `.ftag`s.
   
   Write `slide01.html` (title page) by hand, copying `Lecture01/slide01.html`.
2. Keep the content. Split crowded slides into "Title (1)" / "Title (2)" slides, and renumber the `slideNN.html` files.
3. Pull any embedded images out into `thumbs/`.
4. Write `deck.js`, then build the PDF with `tools/make_pdf.sh <Lecture>` and run `tools/check_slides.sh <Lecture>`. It reports frame overflow, content under the footline, overlays overlapping text, a wrong `deck.js` total, British spellings, leftover spacers or base64, and fallback fonts. It also flags in-flow stick figures that open a gap. Move those into `.doodle` overlays, then run `tools/place_doodles.sh <Lecture> slideNN.html …`, which moves each overlay to the nearest free spot, scaling it down to 60% if needed. Then still look at every page: the nearest free spot isn't always the best one for the slide's meaning. Look for: content not centered, text running into the footline, and fallback fonts in `pdffonts`.

### Style rules
- Keep content around the vertical middle. Don't leave a gap in the middle with text pushed to the top and bottom.
- **Stick figures are afterthoughts.** They only fill gaps that already exist; never create or enlarge a gap to make room for one. Put them in a `.doodle` overlay, a direct child of `.slide` placed with inline `right/bottom` (or `left/top`) offsets and a `width`, so they never affect layout. An overlay can also be pinned to an element: make that element `position:relative` and position the figure absolutely inside it, as with the "you are here" figure on the Introduction's Prerequisites slide. Important diagrams and charts are the exception: they stay in the layout. Mark such an SVG with a `data-figure` attribute, as on Lecture 1's "Why do we need a model?" slide, so `check_slides.sh` doesn't flag it. After centering, check that no overlay overlaps text.
- Prefer blocks stacked vertically when there are only two or three of them and each holds a full sentence.
- Center the headers and values in rows of figures (credits, percentages).
- Use tables with column headers that say what the rows are (e.g. "Midterm Topics" / "Final Topics") rather than separator rows.
- **Pseudocode follows CLRS (3rd edition) syntax**, the same in every lecture and in the simulators:
  - **Procedure names** in capitals with hyphens: `INSERTION-SORT(A, n)`. A recursive variant gets a `-REC` suffix.
  - **Arrays are 0-indexed** (`A[0..n − 1]`, `for i = 0 to n − 1`, `downto` for counting down), because the other course sections use 0-based indexing. Index labels under drawn arrays, hand traces and text such as "index 3" are 0-based too. CLRS's syntax is followed; its 1-based indexing is not.
  - **Range parameters** are `lo`, `mid`, `hi` (a course choice over CLRS's `p`, `q`, `r`, which clash with the pivot index). A first call reads like `MERGE-SORT(A, 0, n − 1)`. Descriptive names (`key`, `pivot`, `third`) are fine where they read better than CLRS's single letters.
  - **Operators:** `=` assigns, `==` tests equality; use `≠ ≤ ≥`, `⌊ ⌋`, and the keywords `and`, `or`, `not`.
  - **Keywords**, styled `.kw`: `if`, `elseif`, `else`, `for … to/downto`, `while`, `repeat … until`, `return`. Write `elseif` as one word.
  - **One statement per line**, with blocks shown by indentation only: no `then`, no braces, no `end`.
  - **Book phrasing:** `exchange A[i] with A[j]`, `let C[0..n − 1] be a new array`, `NIL` for "not found", and `RANDOM(lo, hi)`.
  - **Comments** use `//`. Uppercase tags such as `◃ SPLIT` are slide annotations, not code.
  - **Line numbers** on every block (`.ln`).
  - **Simulators:** their pseudocode must match the slides line for line. Check both whenever either changes. A simulator may show several lines under one highlight key, so a slide line can be split without changing the step logic.
- Use **US English** spelling in all slides, quizzes and simulators: analyze/analyzing, behavior, characterize, recognize, color, center, modeling. Fix British spellings when converting a lecture. Quotations stay exactly as their source wrote them.
- The course schedule slides in `Introduction/` list topics decided centrally by the course committee. The order of lectures in class can differ from it, so don't renumber or restructure lectures to match the schedule.
- Only use facts the instructor has confirmed (book editions, weeks, rooms). Ask rather than guess, and take book details from the PDFs in `books/`.

### Old format (for converting legacy decks)
- Each file is self-contained, with fonts and logo inlined as base64, so it is about 2–2.5 MB. **Don't `cat` or fully `Read` one.** Strip the blobs first: `sed -E 's/base64,[A-Za-z0-9+\/=]{200,}/base64,<…>/g' file.html`.
- Every slide repeats the same CSS preamble: IBM Plex / Source Serif fonts, `.content` with an `h2` title, a `.foot` line, `.bands` stripes and an inline `fit()` script.
- Pseudocode uses `.code` / `.kw` / `.ln` spans. Arrays use `.arr .c .v/.i` cells.

## Simulator architecture

Each simulator is a single responsive HTML file (not a fixed canvas) with inline CSS and one inline `<script>`, and with its fonts embedded as base64. Simulators are licensed **MIT** (not CC BY-NC-SA): `simulations/LICENSE` holds the full text, and because each simulator is downloaded on its own, every file also starts (after `<!DOCTYPE html>`) with an `SPDX-License-Identifier: MIT` comment, which a new simulator must include. **Simulators must stay self-contained in a single HTML file** (CSS, script, fonts and images all inline, no external or shared files), so students can download one file and open it offline. Slides are the opposite: they share `lectures/theme/` and keep images in `thumbs/`. **Simulators keep their own visual theme** (IBM Plex fonts, their own layout and state colors): they don't follow the slide theme and needn't be restyled when the slides change. Only their **pseudocode** must match the slides (see the pseudocode rule). It usually has an array input, preset chips, step/play controls and a visual trace. 

## Design rules

All slides follow the same simple theme:

- Keep the text short.
- Don't crowd a slide.
- Prefer graphics, diagrams and stick figures over text.
- Write pseudocode in CLRS style (see the pseudocode rule above).
- Make the mathematical formulations easy to understand.
- Where possible, suggest slides that engage students (e.g. "Can you…?" / "Guess…" prompts followed by an answer slide).
- Lectures share these intro and outro slides: Cover and Agenda at the start; at the end, **Using the simulators** (when the lecture has simulators in `simulations/`, with screenshots in `thumbs/`), **References** (CLRS sections and pages, verified against the PDF), and the **Ending** ("What we learned today": the lecture's key learning points, plus the Questions panel). **Don't add a Next class slide**: what comes next changes too often to keep in sync.

## Workflow

New lectures, quizzes and simulators are added as topics come up. Slides are usually designed one at a time, guided by the teaching goals. To preview a file, open it in a browser (`google-chrome` is installed).

To make PDFs, use `tools/make_pdf.sh`, which runs headless Chrome and then `pdfunite`. Page size comes from each page's `@page` rule.
- `tools/make_pdf.sh Lecture02` turns every slide into one page, in `sort -V` order, and writes them all to `lectures/Lecture02/Lecture02.pdf`. A lecture takes about 30 seconds.
- `tools/make_pdf.sh <dir> [out.pdf]` merges every `*.html` in any folder into one PDF.
- `tools/make_pdf.sh a.html b.html` writes each file to a PDF next to it. Use this for quiz question and answer papers.
- `tools/check_slides.sh <Lecture>` checks a deck against these rules (layout, overlays, `deck.js` total, spelling, spacers, fonts). Run it after any change, alongside a look at the PDF.
