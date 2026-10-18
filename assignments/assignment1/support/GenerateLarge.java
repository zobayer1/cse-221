import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.SplittableRandom;

/**
 * CSE 221 Assignment 1: writes a 1 GB input file.
 *
 * The file holds 134,217,728 random signed 64-bit integers (Java long),
 * 8 bytes each, little-endian, with no header. Make sure you have
 * at least 3 GB of free disk space (input + output + a spare copy).
 *
 * Usage:  java GenerateLarge.java [output-file] [seed]
 * Default: data_1gb.bin, seed 221
 */
public class GenerateLarge {
    static final long BYTES = 1L << 30;  // 1 GB
    static final int BUFFER = 8 << 20;   // write 8 MB at a time

    public static void main(String[] args) throws IOException {
        Path out = Path.of(args.length > 0 ? args[0] : "data_1gb.bin");
        long seed = args.length > 1 ? Long.parseLong(args[1]) : 221L;
        long count = BYTES / Long.BYTES;

        long start = System.nanoTime();
        SplittableRandom rng = new SplittableRandom(seed);
        ByteBuffer buf = ByteBuffer.allocateDirect(BUFFER).order(ByteOrder.LITTLE_ENDIAN);
        try (FileChannel ch = FileChannel.open(out, StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE)) {
            for (long i = 0; i < count; i++) {
                if (!buf.hasRemaining()) {
                    flush(ch, buf);
                    if (ch.position() % (128L << 20) == 0) {
                        System.out.printf("\r%4d / 1024 MB", ch.position() >> 20);
                    }
                }
                buf.putLong(rng.nextLong());
            }
            flush(ch, buf);
        }
        long ms = (System.nanoTime() - start) / 1_000_000;
        System.out.printf("\rwrote %s: %,d integers (%,d bytes), seed %d, %d ms%n",
                out, count, count * Long.BYTES, seed, ms);
    }

    static void flush(FileChannel ch, ByteBuffer buf) throws IOException {
        buf.flip();
        while (buf.hasRemaining()) {
            ch.write(buf);
        }
        buf.clear();
    }
}
