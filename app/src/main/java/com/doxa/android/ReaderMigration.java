package com.doxa.android;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;

/** Extracts verified byte ranges without rewriting the preserved reader or user storage. */
final class ReaderMigration {
    private static String hash(byte[] bytes) throws IOException {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder out = new StringBuilder();
            for (byte b : digest) out.append(String.format(Locale.ROOT, "%02x", b & 255));
            return out.toString();
        } catch (NoSuchAlgorithmException e) { throw new IOException(e); }
    }
    private static String digest(File file) throws IOException {
        try (InputStream in = new FileInputStream(file)) {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[65536]; int n;
            while ((n = in.read(buffer)) != -1) md.update(buffer, 0, n);
            StringBuilder out = new StringBuilder();
            for (byte b : md.digest()) out.append(String.format(Locale.ROOT,"%02x",b & 255));
            return out.toString();
        } catch (NoSuchAlgorithmException e) { throw new IOException(e); }
    }
    static void prepare(File files, InputStream manifestInput) throws IOException {
        byte[] manifest;
        try (InputStream in = manifestInput; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096]; int n;
            while ((n = in.read(buffer)) != -1) out.write(buffer,0,n);
            manifest = out.toByteArray();
        }
        String[] lines = new String(manifest,StandardCharsets.UTF_8).trim().split("\n");
        String identity = hash(manifest);
        File target = new File(files,"reader-data-v1");
        File marker = new File(target, ".ready");
        if (marker.isFile()) {
            String saved;
            try (BufferedReader r = new BufferedReader(new FileReader(marker))) { saved = r.readLine(); }
            boolean complete = identity.equals(saved);
            for (int i=1;i<lines.length;i++) {
                String[] p=lines[i].split("\t");
                complete &= new File(target,p[0]).length()==Long.parseLong(p[2]);
            }
            if (complete) return;
        }
        File source = new File(files,"reader/index.html");
        String[] header = lines[0].split("\t");
        if (source.length()!=Long.parseLong(header[1]) || !digest(source).equals(header[2]))
            throw new IOException("O conteúdo importado não corresponde à V29 esperada.");
        File stage = new File(files,"reader-data-staging");
        LegacyImporter.deleteTree(stage);
        if (!stage.mkdirs()) throw new IOException("Não foi possível preparar o armazenamento.");
        try (RandomAccessFile input = new RandomAccessFile(source,"r")) {
            byte[] buffer = new byte[65536];
            for (int i=1;i<lines.length;i++) {
                String[] p=lines[i].split("\t");
                if (p.length!=4 || !p[0].matches("[a-z0-9_-]+\\.js")) throw new IOException("Plano inválido.");
                long offset=Long.parseLong(p[1]), remaining=Long.parseLong(p[2]);
                if (offset<0 || remaining<=0 || offset>input.length()-remaining) throw new IOException("Intervalo inválido.");
                File destination=new File(stage,p[0]);
                input.seek(offset);
                try (FileOutputStream out=new FileOutputStream(destination)) {
                    while (remaining>0) {
                        int n=input.read(buffer,0,(int)Math.min(buffer.length,remaining));
                        if (n<0) throw new EOFException();
                        out.write(buffer,0,n); remaining-=n;
                    }
                    out.getFD().sync();
                }
                if (!digest(destination).equals(p[3])) throw new IOException("Falha ao conferir "+p[0]);
            }
            try (FileOutputStream out=new FileOutputStream(new File(stage,".ready"))) {
                out.write(identity.getBytes(StandardCharsets.UTF_8)); out.getFD().sync();
            }
            // Only derived banks are replaceable. Original reader and WebView data stay untouched.
            LegacyImporter.deleteTree(target);
            if (!stage.renameTo(target)) throw new IOException("Não foi possível ativar os bancos.");
        } catch (IOException | RuntimeException error) {
            LegacyImporter.deleteTree(stage); throw error;
        }
    }
}
