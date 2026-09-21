package com.doxa.android;

import java.io.*;
import java.security.*;
import java.util.*;
import java.util.zip.*;

/** Verifies and extracts one downloaded Doxa package into a staging directory. */
final class PackageArchive {
    static final class EntrySpec {
        final long size;
        final String sha256;
        EntrySpec(long size, String sha256) {
            this.size = size;
            this.sha256 = sha256;
        }
    }

    private PackageArchive() { }

    static String digest(File file) throws IOException {
        try (InputStream in = new FileInputStream(file)) {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[65536];
            int n;
            while ((n = in.read(buffer)) != -1) md.update(buffer, 0, n);
            return hex(md.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new IOException(e);
        }
    }

    static void extractVerified(File archive, File stage, Map<String, EntrySpec> expected) throws IOException {
        if (expected.isEmpty()) throw new IOException("Pacote sem arquivos.");
        String stagePath = stage.getCanonicalPath() + File.separator;
        Set<String> seen = new HashSet<>();
        int manifestCount = 0;

        try (ZipFile zip = new ZipFile(archive)) {
            Enumeration<? extends ZipEntry> entries = zip.entries();
            while (entries.hasMoreElements()) {
                ZipEntry entry = entries.nextElement();
                String name = entry.getName();
                if (name == null || name.isEmpty() || name.startsWith("/") || name.contains("\\"))
                    throw new IOException("Caminho inválido no pacote.");

                if (entry.isDirectory()) {
                    if (!safeDirectory(name)) throw new IOException("Diretório inesperado no pacote: " + name);
                    continue;
                }
                if ("package-manifest.json".equals(name)) {
                    manifestCount++;
                    if (manifestCount > 1) throw new IOException("Manifesto duplicado no pacote.");
                    continue;
                }
                if (!safeFile(name)) throw new IOException("Arquivo inesperado no pacote: " + name);

                EntrySpec spec = expected.get(name);
                if (spec == null) throw new IOException("Arquivo não declarado no pacote: " + name);
                if (!seen.add(name)) throw new IOException("Arquivo duplicado no pacote: " + name);
                if (entry.getSize() >= 0 && entry.getSize() != spec.size)
                    throw new IOException("Tamanho inválido em " + name);

                File destination = new File(stage, name);
                String destinationPath = destination.getCanonicalPath();
                if (!destinationPath.startsWith(stagePath)) throw new IOException("Tentativa de sair da pasta do Doxa.");
                if (destination.exists()) throw new IOException("Arquivo repetido entre pacotes: " + name);
                File parent = destination.getParentFile();
                if (parent == null || (!parent.isDirectory() && !parent.mkdirs()))
                    throw new IOException("Não foi possível criar a pasta do pacote.");

                long written = 0;
                MessageDigest md;
                try { md = MessageDigest.getInstance("SHA-256"); }
                catch (NoSuchAlgorithmException e) { throw new IOException(e); }
                try (InputStream in = zip.getInputStream(entry); FileOutputStream out = new FileOutputStream(destination)) {
                    byte[] buffer = new byte[65536];
                    int n;
                    while ((n = in.read(buffer)) != -1) {
                        written += n;
                        if (written > spec.size) throw new IOException("Arquivo maior que o esperado: " + name);
                        md.update(buffer, 0, n);
                        out.write(buffer, 0, n);
                    }
                    out.getFD().sync();
                }
                if (written != spec.size || !hex(md.digest()).equals(spec.sha256))
                    throw new IOException("Falha ao conferir " + name);
            }
        }

        if (manifestCount != 1) throw new IOException("Manifesto interno ausente.");
        if (!seen.equals(expected.keySet())) throw new IOException("Pacote incompleto.");
    }

    private static boolean safeDirectory(String name) {
        return name.equals("data/") || name.equals("interlinear/") ||
                name.matches("interlinear/[a-z0-9_-]+/");
    }

    private static boolean safeFile(String name) {
        return name.matches("data/[a-z0-9_-]+\\.js") ||
                name.matches("interlinear/[a-z0-9_-]+/[0-9]{2,3}\\.js");
    }

    private static String hex(byte[] bytes) {
        StringBuilder out = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) out.append(String.format(Locale.ROOT, "%02x", b & 255));
        return out.toString();
    }
}
