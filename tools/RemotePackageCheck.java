package com.doxa.android;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.*;

public final class RemotePackageCheck {
    private static String hex(byte[] bytes) {
        StringBuilder out = new StringBuilder();
        for (byte b : bytes) out.append(String.format("%02x", b & 255));
        return out.toString();
    }

    private static File archive(File root, String entryName, byte[] content, boolean extra) throws Exception {
        File file = new File(root, UUID.randomUUID() + ".zip");
        try (ZipOutputStream zip = new ZipOutputStream(new FileOutputStream(file))) {
            zip.putNextEntry(new ZipEntry(entryName));
            zip.write(content);
            zip.closeEntry();
            zip.putNextEntry(new ZipEntry("package-manifest.json"));
            zip.write("{}".getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();
            if (extra) {
                zip.putNextEntry(new ZipEntry("data/extra.js"));
                zip.write(content);
                zip.closeEntry();
            }
        }
        return file;
    }

    public static void main(String[] args) throws Exception {
        File root = Files.createTempDirectory("doxa-remote-package-").toFile();
        byte[] content = "window.DOXA_TEST=1;".getBytes(StandardCharsets.UTF_8);
        String sha = hex(MessageDigest.getInstance("SHA-256").digest(content));
        Map<String, PackageArchive.EntrySpec> expected = new LinkedHashMap<>();
        expected.put("data/test.js", new PackageArchive.EntrySpec(content.length, sha));
        try {
            File ok = archive(root, "data/test.js", content, false);
            File stage = new File(root, "stage-ok"); stage.mkdirs();
            PackageArchive.extractVerified(ok, stage, expected);
            if (!Arrays.equals(content, Files.readAllBytes(new File(stage, "data/test.js").toPath())))
                throw new AssertionError("Valid package changed content");

            reject(root, expected, archive(root, "data/test.js", "changed".getBytes(StandardCharsets.UTF_8), false), "hash");
            reject(root, expected, archive(root, "data/test.js", content, true), "unknown");
            reject(root, expected, archive(root, "../escape.js", content, false), "traversal");
            System.out.println("Remote package: valid archive extracted; changed, unknown and traversal entries rejected.");
        } finally {
            delete(root);
        }
    }

    private static void reject(File root, Map<String, PackageArchive.EntrySpec> expected, File zip, String label) throws Exception {
        File stage = new File(root, "reject-" + label); stage.mkdirs();
        try {
            PackageArchive.extractVerified(zip, stage, expected);
            throw new AssertionError("Accepted invalid package: " + label);
        } catch (IOException expectedError) {
            // expected
        }
    }

    private static void delete(File file) throws IOException {
        if (!file.exists()) return;
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) for (File child : children) delete(child);
        }
        if (!file.delete()) throw new IOException("Could not delete " + file);
    }
}
