# CSE 221: Algorithms

Course materials for **CSE 221 – Algorithms**, an undergraduate course in the Department of Computer Science and Engineering at BRAC University. Taught by Zobayer Hasan (ZBYR), Fall 2026, Section 19.

The repository holds the lecture slides, quizzes, assignments and a set of interactive algorithm simulators. Everything is plain HTML that opens in a browser, with no build system and no server. The lecture PDFs are generated from the HTML with headless Chrome.

## Lectures

| Folder | Lecture | Topics |
|---|---|---|
| `lectures/Introduction` | Introduction | Course goals, schedule, prerequisites, textbooks, assessment and attendance; what an algorithm and a computational problem are; Knuth's five features; algorithms vs programs; what makes an algorithm good |
| `lectures/Lecture01` | Lecture 1: Analyzing Algorithms | Running time and memory, input size, counting steps, order of growth, common growth rates, best/worst/average case, upper bounds, the RAM model |
| `lectures/Lecture02` | Lecture 2: Search Algorithms | Linear, binary and ternary search, iterative and recursive; time complexity; off-by-one errors and duplicates; finding a peak |
| `lectures/Lecture03` | Lecture 3: Sorting Algorithms | Comparison sorting; bubble, insertion and selection sort with best and worst case analysis |
| `lectures/Lecture04` | Lecture 4: Merge Sort, Quicksort and the Lower Bound | Divide and conquer, merge sort, quicksort and pivot choice, stable and in-place sorting, the Ω(*n* log *n*) comparison-sorting lower bound |

Every slide is its own file (`slide01.html`, `slide02.html`, …), and you can open any of them directly in a browser. All lectures use the shared Beamer-style theme in `lectures/theme/`. Each one ends with the same closing slides: **Using the simulators** (where the lecture has simulators), **References** to CLRS sections and pages, and **What we learned today**.

## Repository layout

```
lectures/
  theme/              shared stylesheet, fonts, logo and footer script
  Introduction/       one folder per lecture: slideNN.html, deck.js, thumbs/
  Lecture01/ …
  _archive/           pre-conversion copies of converted lectures (local only, not in git)
assignments/          assignment papers (HTML, built to PDF; instructor/ folders are not in git)
quizzes/quizN/        quiz papers and answer scripts (HTML, built to PDF)
simulations/          standalone algorithm simulators
tools/                PDF build, slide-checking and slide-conversion scripts
books/                the textbooks as PDFs (not in git; see below)
```

## Textbooks

The PDFs in `books/` are ignored by git. If you need the books, get your own copies:

- **Main textbook:** Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest and Clifford Stein, *Introduction to Algorithms* (CLRS), 3rd edition, The MIT Press, 2009. [Amazon](https://www.amazon.com/dp/0262033844)
- Robert Sedgewick and Kevin Wayne, *Algorithms*, 4th edition, Addison-Wesley, 2011. [Amazon](https://www.amazon.com/dp/032157351X)
- Jeff Erickson, *Algorithms*, 1st edition, 2019. [Amazon](https://www.amazon.com/dp/1792644833). A free copy is available on [the author's site](https://jeffe.cs.illinois.edu/teaching/algorithms/).
- Daniel Zingaro, *Algorithmic Thinking: A Problem-Based Introduction*, 1st edition, No Starch Press, 2021. [Amazon](https://www.amazon.com/dp/1718500807)

## Simulators

Each simulator in `simulations/` is a single HTML file. Download it and open it in any modern browser. It works offline and needs no installation. Simulators keep their own look, separate from the slide theme, and their pseudocode matches the slides line for line.

| File | What it shows |
|---|---|
| `linear_search_simulator.html` | Checking each element from left to right; best, worst and not-present cases |
| `binary_search_simulator.html` | Halving the range `[lo, hi]` on every comparison; standard, leftmost-match with duplicates, and a buggy `lo = mid` version |
| `ternary_search_simulator.html` | Two cuts `m1` and `m2` splitting a sorted array's range in three |
| `basic_sorting_simulator.html` | Bubble, selection and insertion sort, one comparison or move per step |
| `merge_sort_simulator.html` | The array splitting down, then merging back up |
| `quicksort_simulator.html` | Each pivot partitioning its block; last-element and median-of-three pivots |

They all work the same way:

1. Type an array, and a target for the search simulators, or pick a preset such as *Lecture example*, *Random*, *Reverse sorted* or *Already sorted*.
2. Press **Start / Restart**.
3. Step through with **← Prev** and **Next →**, or press **▶ Play** and choose a speed (Slow, Normal or Fast).

Keyboard shortcuts:

| Key | Action |
|---|---|
| → / ← | Next / previous step |
| Space | Play / pause |
| Home / End | First / last step |
| Enter (in a field) | Restart |

## Building the PDFs

PDFs are not committed, so build them locally. You need:

- **Google Chrome** or Chromium. To use a different binary, set it with `CHROME=chromium`.
- `pdfunite`, from poppler-utils.
- Python 3, for `tools/convert_legacy.py` and `tools/place_doodles.sh`.

```sh
tools/make_pdf.sh Introduction             # → lectures/Introduction/Introduction.pdf
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

### Editing slides

- **Course details:** the course name, instructor, term and section are set once, in `lectures/theme/theme.js`.
- **Per-lecture settings:** each lecture's title and slide count are in its `deck.js`. Update `total` when you add or remove slides.
- **Starting a new slide:** copy an existing slide from the same lecture, then build and check it.
- **Pseudocode:** CLRS syntax with 0-based arrays, e.g. `for i = 0 to n − 1`, `exchange A[i] with A[j]`, `NIL`.
- **Full conventions:** the layout, style and pseudocode rules, and how to convert an old-format lecture, are in [CLAUDE.md](CLAUDE.md).

## License

The course materials (slides, quizzes, simulators and tools) are © 2026 Zobayer Hasan and licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/) (CC BY-NC-SA 4.0). You may share and adapt them for non-commercial purposes, as long as you give credit and share your adaptations under the same license. The full text is in [LICENSE](LICENSE).

These parts are not covered by that license and remain under their own terms:

- the BRAC University logo, a trademark of BRAC University;
- the textbook cover images in `thumbs/` folders, © their publishers;
- the Computer Modern fonts in `lectures/theme/fonts/`, under the [SIL Open Font License](lectures/theme/fonts/OFL.txt);
- the KaTeX fonts, under the [MIT License](lectures/theme/fonts/KaTeX-LICENSE.txt);
- quoted passages, such as Knuth's, © their authors.
