# CSE 221 Assignment 1: Support Programs

Requires JDK 17 or newer. Each program is a single source file, so no compilation is needed.
The commands are the same on Windows, macOS and Linux.

| Command | What it does |
|---|---|
| `java GenerateSmall.java [file] [seed]` | Writes `data_1mb.bin`: 131,072 random integers (1 MB). |
| `java GenerateLarge.java [file] [seed]` | Writes `data_1gb.bin`: 134,217,728 random integers (1 GB). Needs about 3 GB of free disk. |
| `java Validate.java <input> <output>` | Checks that the output is the input, sorted. Prints `PASS` or `FAIL` and exits with 0 or 1. |

File format: no header; each value is a signed 64-bit integer (Java `long`), 8 bytes, little-endian.
The default seed is 221.
