package com.doxa.android;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/** Downloads the official Doxa Core Set into an isolated staging tree and activates it atomically. */
final class RemotePackageInstaller {
    interface Progress {
        void onStatus(String text);
        void onBytes(long done, long total);
    }

    private static final String ROOT = "remote-reader-v1";
    private static final String STAGE = "remote-reader-staging";
    private static final String PREFS = "doxa_remote_auth";
    private static final String[] REQUIRED = {
            "core-texts", "pt-bibles-a", "pt-bibles-b", "interlinear-gn-ex"
    };

    private RemotePackageInstaller() { }

    static File root(File filesDir) { return new File(filesDir, ROOT); }

    static boolean isReady(File filesDir) {
        File root = root(filesDir);
        return new File(root, ".ready").isFile()
                && new File(root, "data/almeida.js").isFile()
                && new File(root, "data/wlc.js").isFile()
                && new File(root, "data/tr.js").isFile()
                && new File(root, "data/oshb_strong.js").isFile()
                && new File(root, "interlinear/genesis/02.js").isFile()
                && new File(root, "interlinear/exodus/01.js").isFile();
    }

    static void install(Context context, Progress progress) throws IOException {
        File files = context.getFilesDir();
        if (isReady(files)) return;

        File stage = new File(files, STAGE);
        deleteTree(stage);
        if (!stage.mkdirs()) throw new IOException("Não foi possível preparar o armazenamento do Doxa.");

        try {
            progress.onStatus("Conectando ao servidor do Doxa…");
            Session session = getSession(context);
            JSONObject server = requestManifest(session.accessToken);
            JSONArray packageArray = server.optJSONArray("packages");
            if (server.optInt("schema", 0) != 1 || packageArray == null)
                throw new IOException("O servidor respondeu com um manifesto incompatível.");

            Map<String, JSONObject> packages = new LinkedHashMap<>();
            long total = 0;
            for (int i = 0; i < packageArray.length(); i++) {
                JSONObject item = packageArray.optJSONObject(i);
                if (item == null) continue;
                String key = item.optString("package_key", "");
                if (Arrays.asList(REQUIRED).contains(key)) {
                    if (packages.put(key, item) != null) throw new IOException("Pacote duplicado no servidor: " + key);
                }
            }
            for (String key : REQUIRED) {
                JSONObject item = packages.get(key);
                if (item == null) throw new IOException("Pacote obrigatório ausente: " + key);
                long size = item.optLong("size_bytes", -1);
                if (size <= 0 || size > 50L * 1024 * 1024) throw new IOException("Tamanho inválido no pacote " + key);
                total += size;
            }

            long completed = 0;
            File cache = new File(context.getCacheDir(), "doxa-remote-packages");
            deleteTree(cache);
            if (!cache.mkdirs()) throw new IOException("Não foi possível preparar o cache do download.");
            try {
                for (int i = 0; i < REQUIRED.length; i++) {
                    String key = REQUIRED[i];
                    JSONObject item = packages.get(key);
                    progress.onStatus(label(key, i + 1, REQUIRED.length));
                    File archive = new File(cache, key + ".zip");
                    download(item, archive, completed, total, progress);
                    completed += item.getLong("size_bytes");
                    installArchive(item, archive, stage);
                    if (!archive.delete() && archive.exists()) archive.deleteOnExit();
                }
            } catch (JSONException e) {
                throw new IOException("Manifesto de pacote inválido.", e);
            } finally {
                deleteTree(cache);
            }

            if (!new File(stage, "data/almeida.js").isFile()
                    || !new File(stage, "data/strong-pt.js").isFile()
                    || !new File(stage, "interlinear/genesis/02.js").isFile()
                    || !new File(stage, "interlinear/exodus/01.js").isFile())
                throw new IOException("O conjunto baixado ficou incompleto.");

            try (FileOutputStream out = new FileOutputStream(new File(stage, ".ready"))) {
                String marker = "doxa-core-set-v1\n" + server.optString("generated_at", "") + "\n";
                out.write(marker.getBytes(StandardCharsets.UTF_8));
                out.getFD().sync();
            }

            File target = root(files);
            if (target.exists()) deleteTree(target);
            if (!stage.renameTo(target)) throw new IOException("Não foi possível ativar o pacote do Doxa.");
            progress.onBytes(total, total);
            progress.onStatus("Pacote do Doxa instalado.");
        } catch (IOException | RuntimeException error) {
            try { deleteTree(stage); } catch (IOException ignored) { }
            throw error;
        }
    }

    private static void installArchive(JSONObject serverPackage, File archive, File stage) throws IOException {
        try {
            JSONObject internal = readInternalManifest(archive);
            String packageKey = serverPackage.getString("package_key");
            String version = serverPackage.getString("version");
            if (!packageKey.equals(internal.optString("package_key")) || !version.equals(internal.optString("version")))
                throw new IOException("Identidade do pacote não confere: " + packageKey);

            JSONArray files = internal.optJSONArray("files");
            if (files == null || files.length() == 0) throw new IOException("Manifesto interno vazio: " + packageKey);
            Map<String, PackageArchive.EntrySpec> expected = new LinkedHashMap<>();
            for (int i = 0; i < files.length(); i++) {
                JSONObject file = files.getJSONObject(i);
                String path = file.getString("path");
                long size = file.getLong("size_bytes");
                String sha = file.getString("sha256");
                if (size <= 0 || !sha.matches("[0-9a-f]{64}") || expected.put(path, new PackageArchive.EntrySpec(size, sha)) != null)
                    throw new IOException("Manifesto interno inválido: " + packageKey);
            }
            PackageArchive.extractVerified(archive, stage, expected);
        } catch (JSONException e) {
            throw new IOException("Manifesto interno inválido.", e);
        }
    }

    private static JSONObject readInternalManifest(File archive) throws IOException {
        try (ZipFile zip = new ZipFile(archive)) {
            ZipEntry entry = zip.getEntry("package-manifest.json");
            if (entry == null || entry.isDirectory() || entry.getSize() > 1024 * 1024)
                throw new IOException("Manifesto interno ausente.");
            try (InputStream in = zip.getInputStream(entry)) {
                return new JSONObject(readLimited(in, 1024 * 1024));
            }
        } catch (JSONException e) {
            throw new IOException("Manifesto interno ilegível.", e);
        }
    }

    private static void download(JSONObject item, File destination, long base, long total, Progress progress) throws IOException, JSONException {
        String signedUrl = item.getString("signed_url");
        long expectedSize = item.getLong("size_bytes");
        String expectedHash = item.getString("sha256");
        if (!expectedHash.matches("[0-9a-f]{64}")) throw new IOException("SHA-256 inválido no servidor.");

        URL url = new URL(signedUrl);
        if (!"https".equalsIgnoreCase(url.getProtocol()) || !url.getHost().equals(new URL(BuildConfig.DOXA_SUPABASE_URL).getHost()))
            throw new IOException("Endereço de download inesperado.");

        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(20000);
        connection.setReadTimeout(45000);
        connection.setRequestProperty("Accept-Encoding", "identity");
        int code = connection.getResponseCode();
        if (code < 200 || code >= 300) {
            connection.disconnect();
            throw new IOException("Servidor recusou o download (" + code + ").");
        }

        long written = 0;
        try (InputStream in = connection.getInputStream(); FileOutputStream out = new FileOutputStream(destination)) {
            byte[] buffer = new byte[65536];
            int n;
            while ((n = in.read(buffer)) != -1) {
                written += n;
                if (written > expectedSize) throw new IOException("Pacote maior que o esperado.");
                out.write(buffer, 0, n);
                progress.onBytes(base + written, total);
            }
            out.getFD().sync();
        } finally {
            connection.disconnect();
        }
        if (written != expectedSize || !PackageArchive.digest(destination).equals(expectedHash))
            throw new IOException("Falha de integridade no pacote " + item.optString("package_key") + ".");
    }

    private static JSONObject requestManifest(String accessToken) throws IOException {
        return requestJson(BuildConfig.DOXA_SUPABASE_URL + "/functions/v1/doxa-package-manifest", "GET", null, accessToken);
    }

    private static Session getSession(Context context) throws IOException {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long now = System.currentTimeMillis() / 1000L;
        String access = prefs.getString("access_token", "");
        String refresh = prefs.getString("refresh_token", "");
        long expiresAt = prefs.getLong("expires_at", 0);
        if (!access.isEmpty() && expiresAt > now + 90) return new Session(access, refresh, expiresAt);

        if (!refresh.isEmpty()) {
            try {
                JSONObject body = new JSONObject().put("refresh_token", refresh);
                Session session = parseSession(requestJson(BuildConfig.DOXA_SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", "POST", body, null));
                saveSession(prefs, session);
                return session;
            } catch (Exception ignored) {
                prefs.edit().clear().apply();
            }
        }

        try {
            JSONObject body = new JSONObject()
                    .put("data", new JSONObject())
                    .put("gotrue_meta_security", new JSONObject().put("captcha_token", JSONObject.NULL));
            Session session = parseSession(requestJson(BuildConfig.DOXA_SUPABASE_URL + "/auth/v1/signup", "POST", body, null));
            saveSession(prefs, session);
            return session;
        } catch (JSONException e) {
            throw new IOException(e);
        }
    }

    private static Session parseSession(JSONObject root) throws IOException {
        JSONObject session = root.optJSONObject("session");
        if (session == null) session = root;
        String access = session.optString("access_token", "");
        String refresh = session.optString("refresh_token", "");
        long expiresAt = session.optLong("expires_at", 0);
        if (expiresAt <= 0) expiresAt = System.currentTimeMillis() / 1000L + session.optLong("expires_in", 3600);
        if (access.isEmpty() || refresh.isEmpty()) throw new IOException("O Supabase não criou a sessão anônima do Doxa.");
        return new Session(access, refresh, expiresAt);
    }

    private static void saveSession(SharedPreferences prefs, Session session) {
        prefs.edit()
                .putString("access_token", session.accessToken)
                .putString("refresh_token", session.refreshToken)
                .putLong("expires_at", session.expiresAt)
                .apply();
    }

    private static JSONObject requestJson(String address, String method, JSONObject body, String accessToken) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(address).openConnection();
        connection.setConnectTimeout(15000);
        connection.setReadTimeout(30000);
        connection.setRequestMethod(method);
        connection.setRequestProperty("apikey", BuildConfig.DOXA_SUPABASE_PUBLISHABLE_KEY);
        connection.setRequestProperty("Accept", "application/json");
        if (accessToken != null && !accessToken.isEmpty())
            connection.setRequestProperty("Authorization", "Bearer " + accessToken);
        if (body != null) {
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream out = connection.getOutputStream()) { out.write(bytes); }
        }

        int code = connection.getResponseCode();
        InputStream stream = code >= 200 && code < 300 ? connection.getInputStream() : connection.getErrorStream();
        String text = stream == null ? "" : readLimited(stream, 2 * 1024 * 1024);
        connection.disconnect();
        if (code < 200 || code >= 300) {
            String detail = "";
            try {
                JSONObject error = new JSONObject(text);
                detail = error.optString("msg", error.optString("message", error.optString("error_description", "")));
            } catch (JSONException ignored) { }
            if (detail.isEmpty()) detail = "HTTP " + code;
            throw new IOException(detail);
        }
        try { return new JSONObject(text); }
        catch (JSONException e) { throw new IOException("Resposta inválida do servidor do Doxa.", e); }
    }

    private static String readLimited(InputStream in, int limit) throws IOException {
        try (InputStream input = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int total = 0, n;
            while ((n = input.read(buffer)) != -1) {
                total += n;
                if (total > limit) throw new IOException("Resposta do servidor grande demais.");
                out.write(buffer, 0, n);
            }
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    private static String label(String key, int index, int total) {
        String name;
        if ("core-texts".equals(key)) name = "textos essenciais";
        else if ("pt-bibles-a".equals(key)) name = "Bíblias PT 1/2";
        else if ("pt-bibles-b".equals(key)) name = "Bíblias PT 2/2";
        else name = "interlinear de Gênesis e Êxodo";
        return "Baixando " + name + "… (" + index + "/" + total + ")";
    }

    private static void deleteTree(File file) throws IOException {
        if (!file.exists()) return;
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) for (File child : children) deleteTree(child);
        }
        if (!file.delete()) throw new IOException("Não foi possível limpar " + file.getName());
    }

    private static final class Session {
        final String accessToken, refreshToken;
        final long expiresAt;
        Session(String accessToken, String refreshToken, long expiresAt) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresAt = expiresAt;
        }
    }
}
