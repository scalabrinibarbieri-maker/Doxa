package com.doxa.android;
import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
public final class MigrationCheck {
    private static String hex(byte[] bytes) {
        StringBuilder out=new StringBuilder();
        for(byte b:bytes) out.append(String.format("%02x",b & 255));
        return out.toString();
    }
    public static void main(String[] args) throws Exception {
        File root=Files.createTempDirectory("doxa-migration-").toFile();
        try {
            File reader=new File(root,"reader"); reader.mkdir();
            File source=new File(reader,"index.html");
            File plan;
            if(args.length>0) {
                Files.copy(Paths.get(args[0]),source.toPath());
                plan=new File("app/src/main/assets/reader-data.tsv");
            } else {
                byte[] fixture=new byte[4096]; Arrays.fill(fixture,(byte)'x');
                Files.write(source.toPath(),fixture);
                plan=new File(root,"plan.tsv");
                String hash=hex(MessageDigest.getInstance("SHA-256").digest(fixture));
                Files.write(plan.toPath(),("source\t4096\t"+hash+"\nalmeida.js\t0\t4096\t"+hash+"\n").getBytes(StandardCharsets.UTF_8));
            }
            File sentinel=new File(root,"user-notes"); Files.write(sentinel.toPath(),new byte[]{1,2,3});
            ReaderMigration.prepare(root,new FileInputStream(plan));
            File marker=new File(root,"reader-data-v1/.ready"); long modified=marker.lastModified();
            ReaderMigration.prepare(root,new FileInputStream(plan));
            if(marker.lastModified()!=modified) throw new AssertionError("Not idempotent");
            File bank=new File(root,"reader-data-v1/almeida.js");
            Files.write(bank.toPath(),new byte[]{0});
            ReaderMigration.prepare(root,new FileInputStream(plan));
            if(bank.length()<1000) throw new AssertionError("Incomplete migration not recovered");
            if(!source.isFile() || sentinel.length()!=3) throw new AssertionError("Original data modified");
            LegacyImporter.deleteTree(new File(root,"reader-data-v1"));
            try(RandomAccessFile f=new RandomAccessFile(source,"rw")){f.seek(100);f.write(0);}
            try {ReaderMigration.prepare(root,new FileInputStream(plan)); throw new AssertionError("Corrupt source accepted");}
            catch(IOException expected) { }
            if(!source.isFile()) throw new AssertionError("Fallback lost");
            System.out.println("Migration: repeat, incomplete bank recovery, corrupt source refusal, original preservation OK.");
        } finally {LegacyImporter.deleteTree(root);}
    }
}
