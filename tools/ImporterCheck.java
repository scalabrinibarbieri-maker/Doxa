package com.doxa.android;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.*;

/** Real extraction tests; no Android device required. */
public final class ImporterCheck {
    private static final byte[] CONTENT = "<html>V29 fixture</html>".getBytes(StandardCharsets.UTF_8);
    private static byte[] zip(String name, byte[] content) throws Exception {
        ByteArrayOutputStream result = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(result)) {
            zip.putNextEntry(new ZipEntry(name)); zip.write(content); zip.closeEntry();
        }
        return result.toByteArray();
    }
    public static void main(String[] args) throws Exception {
        File parent = Files.createTempDirectory("doxa-import-check-").toFile();
        Map<String, LegacyImporter.Entry> spec = new LinkedHashMap<>();
        spec.put("index.html", new LegacyImporter.Entry(CONTENT.length, LegacyImporter.hex(MessageDigest.getInstance("SHA-256").digest(CONTENT))));
        try {
            File valid = new File(parent, "valid");
            LegacyImporter.extract(new ByteArrayInputStream(zip("assets/index.html", CONTENT)), valid, spec, (d,t) -> {});
            if (!Arrays.equals(CONTENT, Files.readAllBytes(new File(valid, "index.html").toPath()))) throw new AssertionError("Changed content");
            reject(parent, spec, "changed", zip("assets/index.html", "different".getBytes(StandardCharsets.UTF_8)));
            reject(parent, spec, "missing", zip("classes.dex", CONTENT));
            reject(parent, spec, "traversal", zip("assets/../escape", CONTENT));
            reject(parent, spec, "unknown", zip("assets/extra.js", CONTENT));
            reject(parent, spec, "oversize", zip("assets/index.html", new byte[CONTENT.length + 1]));
            reject(parent, spec, "invalid", new byte[]{1,2,3});
            System.out.println("Importer: intact bytes preserved; corrupt, missing, traversal, unknown, oversized and invalid archives rejected.");
            if (args.length > 0) {
                Map<String, LegacyImporter.Entry> actual = LegacyImporter.readManifest(new FileInputStream("app/src/main/assets/v29-manifest.tsv"));
                LegacyImporter.extract(new FileInputStream(args[0]), new File(parent, "actual-v29"), actual, (d,t) -> {});
                System.out.println("Actual V29: " + actual.size() + " assets verified byte for byte.");
            }
        } finally { LegacyImporter.deleteTree(parent); }
    }
    private static void reject(File parent, Map<String, LegacyImporter.Entry> spec, String name, byte[] zip) throws Exception {
        File stage = new File(parent, name);
        try { LegacyImporter.extract(new ByteArrayInputStream(zip), stage, spec, (d,t) -> {}); }
        catch (IOException expected) {
            if (stage.exists()) throw new AssertionError("Left partial extraction: " + name);
            return;
        }
        throw new AssertionError("Accepted invalid archive: " + name);
    }
}
