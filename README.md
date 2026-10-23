# CSE 221: Algorithms

Course materials for **CSE 221 – Algorithms** at BRAC University, taught by Zobayer Hasan (ZBYR): lecture slides, quizzes, assignments and interactive algorithm simulators. Everything is plain HTML that opens in a browser; the lecture PDFs are generated from it with headless Chrome.

**Course website:** <https://zobayer.net/cse-221/>

## Building the PDFs

PDFs are not committed, so build them locally. You need:

- **Google Chrome** or Chromium. To use a different binary, set it with `CHROME=chromium`.
- `pdfunite`, from poppler-utils.
- Python 3, for `tools/convert_legacy.py` and `tools/place_doodles.sh`.

```sh
tools/make_pdf.sh Lecture00                # → lectures/Lecture00/Lecture00.pdf
tools/make_pdf.sh Lecture01                # → lectures/Lecture01/Lecture01.pdf
tools/make_pdf.sh lectures/Lecture02 out.pdf   # any folder, merged into one PDF
tools/make_pdf.sh quizzes/quiz1/*.html     # each file → a PDF next to it
tools/make_pdf.sh assignments/assignment1/assignment1.html
```

- **Lecture folders:** `make_pdf.sh` prints every `slideNN.html` to one 1280×720 page, in slide order, and merges the pages into one PDF.
- **Quiz and assignment files:** listed one by one, each HTML file becomes its own PDF at whatever page size its `@page` rule sets.

To check a lecture against the slide rules, run:

```sh
tools/check_slides.sh Lecture01
```

It reports content that overflows its frame or runs into the footer, stick figures that overlap text or open gaps, a slide count that doesn't match `deck.js`, British spellings, and fallback fonts in the built PDF. `tools/place_doodles.sh <Lecture> slideNN.html …` moves stick-figure overlays to the nearest free space.

The layout, style and pseudocode conventions for slides are in [CLAUDE.md](CLAUDE.md).

## Website

The course website, with the slide viewer (← / → between slides, F for full screen), the simulators and a glossary, is built from `site/` by `tools/build_site.py` and published to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`.

```sh
tools/build_site.py                        # → _site/ (add --pdf to build all PDFs too)
python3 -m http.server -d _site 8000       # preview at http://localhost:8000
```

What gets published is listed in `site/content.json`, and nothing appears until its entry is marked `"released": true`. Only lectures and simulators go on the website; quizzes and assignments stay in the repository (their `content.json` entries are used for the course Drive folder by `tools/sync_drive.sh`, where quiz solutions also need `"answersReleased": true`). `instructor/` folders are never published.

## License

The course materials (slides, quizzes, assignments and tools) are © 2026 Zobayer Hasan and licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/) (CC BY-NC-SA 4.0). You may share and adapt them for non-commercial purposes, as long as you give credit and share your adaptations under the same license. The full text is in [LICENSE](LICENSE).

These parts are not covered by that license and remain under their own terms:

- the simulators in `simulations/` and the assignment support programs in `assignments/*/support/`, under the MIT License ([simulators](simulations/LICENSE), [support programs](assignments/assignment1/support/LICENSE)), so students can use and adapt them freely, including in their own solutions. Each simulator carries the notice inside the file; its embedded IBM Plex fonts are under the SIL Open Font License;

- the BRAC University logo, a trademark of BRAC University;
- the textbook cover images in `thumbs/` folders, © their publishers;
- the Computer Modern fonts in `lectures/theme/fonts/`, under the [SIL Open Font License](lectures/theme/fonts/OFL.txt);
- the KaTeX fonts, under the [MIT License](lectures/theme/fonts/KaTeX-LICENSE.txt);
- quoted passages, such as Knuth's, © their authors.
