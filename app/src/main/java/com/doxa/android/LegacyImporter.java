package com.doxa.android;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.*;

/** Extracts only the known V29 assets, byte for byte. Never executes APK code. */
public final class LegacyImporter {
    private static final long MAX_EXPANDED = 192L * 1024 * 1024;
    public interface Progress { void update(int complete, int total); }
    public static final class Entry {
        final long size;
        final String sha;
        Entry(long size, String sha) { this.size = size; this.sha = sha; }
    }

    public static Map<String, Entry> readManifest(InputStream input) throws IOException {
        Map<String, Entry> entries = new LinkedHashMap<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] fields = line.split("\t");
                if (fields.length != 3 || !safePath(fields[0])) throw new IOException("Manifesto inválido.");
                entries.put(fields[0], new Entry(Long.parseLong(fields[1]), fields[2]));
            }
        }
        return entries;
    }

    private static boolean safePath(String path) {
        return !path.startsWith("/") && !path.contains("\\") &&
                !Arrays.asList(path.split("/", -1)).contains("..") && !path.contains("\u0000");
    }

    public static void extract(InputStream input, File stage, Map<String, Entry> expected,
                               Progress progress) throws Exception {
        if (stage.exists()) throw new IOException("A pasta temporária já existe.");
        if (!stage.mkdirs()) throw new IOException("Não foi possível criar a pasta temporária.");
        Set<String> seen = new HashSet<>();
        long total = 0;
        boolean success = false;
        try (ZipInputStream zip = new ZipInputStream(new BufferedInputStream(input))) {
            byte[] buffer = new byte[64 * 1024];
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (Thread.currentThread().isInterrupted()) throw new IOException("Importação interrompida.");
                String path = entry.getName();
                if (!safePath(path)) throw new IOException("Caminho inválido no arquivo.");
                if (entry.isDirectory()) continue;
                String relative = path.startsWith("assets/") ? path.substring(7) : null;
                Entry spec = relative == null ? null : expected.get(relative);
                if (relative != null && (spec == null || !seen.add(relative)))
                    throw new IOException("O arquivo não corresponde à base V29: " + relative);
                File destination = spec == null ? null : new File(stage, relative);
                if (destination != null) {
                    if (!destination.getCanonicalPath().startsWith(stage.getCanonicalPath() + File.separator))
                        throw new IOException("Caminho inválido.");
                    if (!destination.getParentFile().isDirectory() && !destination.getParentFile().mkdirs())
                        throw new IOException("Não foi possível criar as pastas.");
                }
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long size = 0;
                try (OutputStream out = destination == null ? new DiscardStream() : new FileOutputStream(destination)) {
                    int count;
                    while ((count = zip.read(buffer)) != -1) {
                        if (Thread.currentThread().isInterrupted()) throw new IOException("Importação interrompida.");
                        total += count; size += count;
                        if (total > MAX_EXPANDED || (spec != null && size > spec.size))
                            throw new IOException("Arquivo maior que a base esperada.");
                        if (spec != null) digest.update(buffer, 0, count);
                        out.write(buffer, 0, count);
                    }
                }
                if (spec != null) {
                    if (size != spec.size || !hex(digest.digest()).equals(spec.sha))
                        throw new IOException("Arquivo alterado ou incompleto: " + relative);
                    progress.update(seen.size(), expected.size());
                }
            }
            if (seen.size() != expected.size()) throw new IOException("Faltam arquivos da V29. Selecione o APK original.");
            success = true;
        } finally {
            if (!success) deleteTree(stage);
        }
    }

    public static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) result.append(String.format(Locale.ROOT, "%02x", b & 255));
        return result.toString();
    }

    public static void deleteTree(File file) throws IOException {
        if (!file.exists()) return;
        File[] children = file.listFiles();
        if (children != null) for (File child : children) deleteTree(child);
        if (!file.delete()) throw new IOException("Não foi possível remover arquivo temporário.");
    }
    private static final class DiscardStream extends OutputStream {
        @Override public void write(int b) { }
        @Override public void write(byte[] b, int off, int len) { }
    }
}
