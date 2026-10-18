// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Zobayer Hasan. See LICENSE in this folder.
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/**
 * CSE 221 Assignment 1: checks that a sorted output file is correct.
 *
 * Both files hold signed 64-bit integers, 8 bytes each, little-endian.
 * The output is correct when
 *   1. it has the same size as the input,
 *   2. its values are in non-decreasing order, and
 *   3. it holds exactly the same values as the input (a permutation).
 *
 * Check 3 compares order-independent fingerprints of the two files
 * (count, sum, xor and two hashed sums), so it never needs to sort.
 * A wrong output passes it only with negligible probability.
 *
 * Usage:  java Validate.java <input-file> <output-file>
 * Prints PASS or FAIL and exits with status 0 (pass) or 1 (fail).
 */
public class Validate {
    static final int BUFFER = 8 << 20;  // read 8 MB at a time

    /** Order-independent summary of a multiset of longs. */
    static final class Fingerprint {
        long count, sum, xor, h1, h2;

        void add(long x) {
            count++;
            sum += x;
            xor ^= x;
            h1 += mix(x);
            h2 += mix(x ^ 0x9E3779B97F4A7C15L);
        }

        boolean matches(Fingerprint o) {
            return count == o.count && sum == o.sum && xor == o.xor && h1 == o.h1 && h2 == o.h2;
        }
    }

    /** SplitMix64 finalizer: a strong 64-bit mixing function. */
    static long mix(long z) {
        z = (z ^ (z >>> 30)) * 0xBF58476D1CE4E5B9L;
        z = (z ^ (z >>> 27)) * 0x94D049BB133111EBL;
        return z ^ (z >>> 31);
    }

    public static void main(String[] args) throws IOException {
        if (args.length != 2) {
            System.err.println("usage: java Validate.java <input-file> <output-file>");
            System.exit(2);
        }
        Path in = Path.of(args[0]), out = Path.of(args[1]);
        long start = System.nanoTime();

        long inSize = Files.size(in), outSize = Files.size(out);
        if (inSize % Long.BYTES != 0) {
            fail("input size " + inSize + " is not a multiple of 8 bytes");
        }
        if (outSize != inSize) {
            fail("output has " + outSize + " bytes, input has " + inSize + " bytes");
        }

        Fingerprint expected = new Fingerprint();
        scan(in, expected, false);
        Fingerprint actual = new Fingerprint();
        scan(out, actual, true);
        if (!actual.matches(expected)) {
            fail("output is sorted but does not hold the same values as the input");
        }

        long ms = (System.nanoTime() - start) / 1_000_000;
        System.out.printf("PASS: %,d integers sorted correctly (checked in %d ms)%n", expected.count, ms);
    }

    /** Reads every value of the file into fp; if checkOrder, also checks it is sorted. */
    static void scan(Path file, Fingerprint fp, boolean checkOrder) throws IOException {
        ByteBuffer buf = ByteBuffer.allocateDirect(BUFFER).order(ByteOrder.LITTLE_ENDIAN);
        long index = 0, prev = Long.MIN_VALUE;
        try (FileChannel ch = FileChannel.open(file, StandardOpenOption.READ)) {
            while (ch.read(buf) >= 0 || buf.position() > 0) {
                buf.flip();
                while (buf.remaining() >= Long.BYTES) {
                    long x = buf.getLong();
                    if (checkOrder && x < prev) {
                        fail(String.format("not sorted at index %,d: %d comes after %d", index, x, prev));
                    }
                    fp.add(x);
                    prev = x;
                    index++;
                }
                buf.compact();
                if (buf.position() > 0 && ch.position() == ch.size()) {
                    fail(file + " ends with a partial value");
                }
            }
        }
    }

    static void fail(String reason) {
        System.out.println("FAIL: " + reason);
        System.exit(1);
    }
}
