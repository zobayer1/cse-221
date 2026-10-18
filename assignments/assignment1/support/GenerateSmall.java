import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.SplittableRandom;

/**
 * CSE 221 Assignment 1: writes a 1 MB input file.
 *
 * The file holds 131,072 random signed 64-bit integers (Java long),
 * 8 bytes each, little-endian, with no header.
 *
 * Usage:  java GenerateSmall.java [output-file] [seed]
 * Default: data_1mb.bin, seed 221
 */
public class GenerateSmall {
    static final long BYTES = 1L << 20;  // 1 MB
    static final int BUFFER = 1 << 20;   // write 1 MB at a time

    public static void main(String[] args) throws IOException {
        Path out = Path.of(args.length > 0 ? args[0] : "data_1mb.bin");
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
                }
                buf.putLong(rng.nextLong());
            }
            flush(ch, buf);
        }
        long ms = (System.nanoTime() - start) / 1_000_000;
        System.out.printf("wrote %s: %,d integers (%,d bytes), seed %d, %d ms%n",
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
