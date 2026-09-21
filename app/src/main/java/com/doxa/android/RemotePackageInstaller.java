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

/** Downloads, verifies, installs and incrementally updates official Doxa resource packages. */
final class RemotePackageInstaller {
    interface Progress {
        void onStatus(String text);
        void onBytes(long done, long total);
    }

    static final class UpdateInfo {
        final int packageCount;
        final long downloadBytes;
        final boolean appUpdateRequired;
        final List<String> packageKeys;

        UpdateInfo(int packageCount, long downloadBytes, boolean appUpdateRequired, List<String> packageKeys) {
            this.packageCount = packageCount;
            this.downloadBytes = downloadBytes;
            this.appUpdateRequired = appUpdateRequired;
            this.packageKeys = Collections.unmodifiableList(new ArrayList<>(packageKeys));
        }

        boolean hasUpdate() { return packageCount > 0; }
    }

    private static final String ROOT = "remote-reader-v1";
    private static final String INSTALL_STAGE = "remote-reader-staging";
    private static final String UPDATE_STAGE = "remote-reader-update-staging";
    private static final String BACKUP = "remote-reader-update-backup";
    private static final String STATE = ".packages.json";
    private static final String READY = ".ready";
    private static final String BASELINE_ASSET = "doxa-packages-v1.json";
    private static final String PREFS = "doxa_remote_auth";
    private static final long MAX_PACKAGE = 50L * 1024 * 1024;
    private static final String[] REQUIRED = {
            "core-texts", "pt-bibles-a", "pt-bibles-b", "interlinear-gn-ex"
    };

    private RemotePackageInstaller() { }

    static File root(File filesDir) { return new File(filesDir, ROOT); }

    static void recover(File filesDir) throws IOException {
        File target = root(filesDir);
        File backup = new File(filesDir, BACKUP);
        if (backup.exists()) {
            if (isReadyRoot(target)) {
                deleteTree(backup);
            } else {
                if (target.exists()) deleteTree(target);
                if (!backup.renameTo(target)) throw new IOException("Não foi possível recuperar os recursos anteriores do Doxa.");
            }
        }
        File updateStage = new File(filesDir, UPDATE_STAGE);
        if (updateStage.exists() && isReadyRoot(target)) deleteTree(updateStage);
    }

    static boolean isReady(File filesDir) { return isReadyRoot(root(filesDir)); }

    private static boolean isReadyRoot(File root) {
        return new File(root, READY).isFile()
                && new File(root, "data/almeida.js").isFile()
                && new File(root, "data/wlc.js").isFile()
                && new File(root, "data/tr.js").isFile()
                && new File(root, "data/oshb_strong.js").isFile()
                && new File(root, "interlinear/genesis/02.js").isFile()
                && new File(root, "interlinear/exodus/01.js").isFile();
    }

    static void install(Context context, Progress progress) throws IOException {
        File files = context.getFilesDir();
        recover(files);
        if (isReady(files)) return;

        File stage = new File(files, INSTALL_STAGE);
        deleteTree(stage);
        if (!stage.mkdirs()) throw new IOException("Não foi possível preparar o armazenamento do Doxa.");

        try {
            progress.onStatus("Conectando ao servidor do Doxa…");
            Session session = getSession(context);
            JSONObject server = requestManifest(session.accessToken);
            LinkedHashMap<String, ServerPackage> packages = parseServerPackages(server);
            requireCore(packages);

            long total = 0;
            for (ServerPackage item : packages.values()) {
                if (item.minAppVersionCode <= BuildConfig.VERSION_CODE) total += item.sizeBytes;
            }

            long completed = 0;
            LinkedHashMap<String, JSONObject> statePackages = new LinkedHashMap<>();
            File cache = prepareCache(context);
            try {
                int index = 0;
                int compatibleCount = compatibleCount(packages);
                for (ServerPackage item : packages.values()) {
                    if (item.minAppVersionCode > BuildConfig.VERSION_CODE) continue;
                    index++;
                    progress.onStatus(downloadLabel(item.key, index, compatibleCount, false));
                    File archive = new File(cache, safeCacheName(item.key));
                    download(item, archive, completed, total, progress);
                    completed += item.sizeBytes;
                    JSONObject statePackage = installArchive(item, archive, stage);
                    statePackages.put(item.key, statePackage);
                    if (!archive.delete() && archive.exists()) archive.deleteOnExit();
                }
            } finally {
                deleteTree(cache);
            }

            validateRoot(stage);
            writeState(stage, statePackages);
            writeReady(stage, server.optString("generated_at", ""));

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

    static UpdateInfo checkForUpdates(Context context) throws IOException {
        File files = context.getFilesDir();
        recover(files);
        if (!isReady(files)) return new UpdateInfo(0, 0, false, Collections.emptyList());

        LinkedHashMap<String, JSONObject> installed = loadOrBootstrapState(context);
        Session session = getSession(context);
        JSONObject server = requestManifest(session.accessToken);
        LinkedHashMap<String, ServerPackage> remote = parseServerPackages(server);
        requireCore(remote);
        ChangePlan plan = planChanges(installed, remote);
        return new UpdateInfo(plan.changedKeys.size(), plan.downloadBytes, plan.appUpdateRequired, plan.changedKeys);
    }

    static void update(Context context, Progress progress) throws IOException {
        File files = context.getFilesDir();
        recover(files);
        if (!isReady(files)) throw new IOException("Os recursos do Doxa ainda não estão instalados.");

        LinkedHashMap<String, JSONObject> installed = loadOrBootstrapState(context);
        progress.onStatus("Conferindo recursos no servidor…");
        Session session = getSession(context);
        JSONObject server = requestManifest(session.accessToken);
        LinkedHashMap<String, ServerPackage> remote = parseServerPackages(server);
        requireCore(remote);
        ChangePlan plan = planChanges(installed, remote);
        if (plan.changedKeys.isEmpty()) {
            if (plan.appUpdateRequired) throw new IOException("Há recursos novos que exigem uma versão mais recente do aplicativo.");
            progress.onStatus("Seus recursos já estão atualizados.");
            return;
        }

        File target = root(files);
        File stage = new File(files, UPDATE_STAGE);
        File backup = new File(files, BACKUP);
        deleteTree(stage);
        deleteTree(backup);
        progress.onStatus("Preparando atualização segura…");
        copyTree(target, stage);

        LinkedHashMap<String, JSONObject> nextState = new LinkedHashMap<>(installed);
        try {
            for (String key : plan.removedKeys) {
                JSONObject old = nextState.remove(key);
                if (old != null) deletePackageFiles(stage, old);
            }

            File cache = prepareCache(context);
            long completed = 0;
            try {
                int index = 0;
                for (String key : plan.downloadKeys) {
                    index++;
                    ServerPackage item = remote.get(key);
                    JSONObject old = nextState.get(key);
                    if (old != null) deletePackageFiles(stage, old);
                    progress.onStatus(downloadLabel(key, index, plan.downloadKeys.size(), true));
                    File archive = new File(cache, safeCacheName(key));
                    download(item, archive, completed, plan.downloadBytes, progress);
                    completed += item.sizeBytes;
                    JSONObject statePackage = installArchive(item, archive, stage);
                    nextState.put(key, statePackage);
                    if (!archive.delete() && archive.exists()) archive.deleteOnExit();
                }
            } finally {
                deleteTree(cache);
            }

            validateRoot(stage);
            writeState(stage, nextState);
            writeReady(stage, server.optString("generated_at", ""));

            if (!target.renameTo(backup)) throw new IOException("Não foi possível preservar a versão anterior dos recursos.");
            if (!stage.renameTo(target)) {
                if (!backup.renameTo(target)) throw new IOException("Falha ao ativar e ao restaurar os recursos anteriores.");
                throw new IOException("Não foi possível ativar os recursos atualizados.");
            }
            try { deleteTree(backup); } catch (IOException ignored) { }
            progress.onBytes(plan.downloadBytes, plan.downloadBytes);
            progress.onStatus("Recursos do Doxa atualizados.");
        } catch (IOException | RuntimeException error) {
            try { if (stage.exists()) deleteTree(stage); } catch (IOException ignored) { }
            if (!target.exists() && backup.exists()) {
                if (!backup.renameTo(target)) throw new IOException("A atualização falhou e os recursos anteriores precisam ser recuperados.", error);
            }
            throw error;
        }
    }

    private static LinkedHashMap<String, JSONObject> loadOrBootstrapState(Context context) throws IOException {
        File root = root(context.getFilesDir());
        File stateFile = new File(root, STATE);
        JSONObject state;
        if (stateFile.isFile()) {
            state = readJsonFile(stateFile, 2 * 1024 * 1024);
        } else {
            try (InputStream in = context.getAssets().open(BASELINE_ASSET)) {
                state = new JSONObject(readLimited(in, 2 * 1024 * 1024));
            } catch (JSONException e) {
                throw new IOException("Estado inicial dos pacotes inválido.", e);
            }
            verifyStateFiles(root, state);
            writeJsonFile(stateFile, state);
        }
        return stateMap(state);
    }

    private static void verifyStateFiles(File root, JSONObject state) throws IOException {
        LinkedHashMap<String, JSONObject> packages = stateMap(state);
        requireStateCore(packages);
        for (JSONObject pkg : packages.values()) {
            JSONArray files = pkg.optJSONArray("files");
            if (files == null || files.length() == 0) throw new IOException("Estado inicial incompleto.");
            for (int i = 0; i < files.length(); i++) {
                JSONObject entry = files.optJSONObject(i);
                if (entry == null) throw new IOException("Estado inicial inválido.");
                String path = entry.optString("path", "");
                long size = entry.optLong("size_bytes", -1);
                File local = managedFile(root, path);
                if (!local.isFile() || local.length() != size)
                    throw new IOException("Os recursos instalados não correspondem ao conjunto esperado: " + path);
            }
        }
    }

    private static ChangePlan planChanges(LinkedHashMap<String, JSONObject> installed,
                                          LinkedHashMap<String, ServerPackage> remote) throws IOException {
        ArrayList<String> changed = new ArrayList<>();
        ArrayList<String> downloads = new ArrayList<>();
        ArrayList<String> removed = new ArrayList<>();
        long bytes = 0;
        boolean appRequired = false;

        for (Map.Entry<String, JSONObject> entry : installed.entrySet()) {
            String key = entry.getKey();
            if (!remote.containsKey(key) && !isRequired(key)) {
                changed.add(key);
                removed.add(key);
            }
        }

        for (ServerPackage item : remote.values()) {
            JSONObject local = installed.get(item.key);
            boolean differs = local == null
                    || !item.version.equals(local.optString("version", ""))
                    || !item.sha256.equals(local.optString("sha256", ""))
                    || !item.storagePath.equals(local.optString("storage_path", ""));
            if (!differs) continue;
            if (item.minAppVersionCode > BuildConfig.VERSION_CODE) {
                appRequired = true;
                continue;
            }
            changed.add(item.key);
            downloads.add(item.key);
            bytes += item.sizeBytes;
        }
        return new ChangePlan(changed, downloads, removed, bytes, appRequired);
    }

    private static LinkedHashMap<String, ServerPackage> parseServerPackages(JSONObject server) throws IOException {
        JSONArray packageArray = server.optJSONArray("packages");
        if (server.optInt("schema", 0) != 1 || packageArray == null)
            throw new IOException("O servidor respondeu com um manifesto incompatível.");

        LinkedHashMap<String, ServerPackage> packages = new LinkedHashMap<>();
        for (int i = 0; i < packageArray.length(); i++) {
            JSONObject item = packageArray.optJSONObject(i);
            if (item == null) continue;
            ServerPackage parsed = ServerPackage.parse(item);
            if (packages.put(parsed.key, parsed) != null)
                throw new IOException("Pacote duplicado no servidor: " + parsed.key);
        }
        return packages;
    }

    private static void requireCore(Map<String, ServerPackage> packages) throws IOException {
        for (String key : REQUIRED) if (!packages.containsKey(key)) throw new IOException("Pacote obrigatório ausente: " + key);
    }

    private static void requireStateCore(Map<String, JSONObject> packages) throws IOException {
        for (String key : REQUIRED) if (!packages.containsKey(key)) throw new IOException("Estado local incompleto: " + key);
    }

    private static boolean isRequired(String key) {
        for (String required : REQUIRED) if (required.equals(key)) return true;
        return false;
    }

    private static int compatibleCount(Map<String, ServerPackage> packages) {
        int count = 0;
        for (ServerPackage item : packages.values()) if (item.minAppVersionCode <= BuildConfig.VERSION_CODE) count++;
        return count;
    }

    private static JSONObject installArchive(ServerPackage serverPackage, File archive, File stage) throws IOException {
        try {
            JSONObject internal = readInternalManifest(archive);
            if (!serverPackage.key.equals(internal.optString("package_key"))
                    || !serverPackage.version.equals(internal.optString("version")))
                throw new IOException("Identidade do pacote não confere: " + serverPackage.key);

            JSONArray files = internal.optJSONArray("files");
            if (files == null || files.length() == 0) throw new IOException("Manifesto interno vazio: " + serverPackage.key);
            Map<String, PackageArchive.EntrySpec> expected = new LinkedHashMap<>();
            JSONArray stateFiles = new JSONArray();
            for (int i = 0; i < files.length(); i++) {
                JSONObject file = files.getJSONObject(i);
                String path = file.getString("path");
                long size = file.getLong("size_bytes");
                String sha = file.getString("sha256");
                if (size <= 0 || !sha.matches("[0-9a-f]{64}")
                        || expected.put(path, new PackageArchive.EntrySpec(size, sha)) != null)
                    throw new IOException("Manifesto interno inválido: " + serverPackage.key);
                stateFiles.put(new JSONObject().put("path", path).put("size_bytes", size).put("sha256", sha));
            }
            PackageArchive.extractVerified(archive, stage, expected);
            return new JSONObject()
                    .put("package_key", serverPackage.key)
                    .put("version", serverPackage.version)
                    .put("storage_path", serverPackage.storagePath)
                    .put("sha256", serverPackage.sha256)
                    .put("size_bytes", serverPackage.sizeBytes)
                    .put("files", stateFiles);
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

    private static void deletePackageFiles(File root, JSONObject statePackage) throws IOException {
        JSONArray files = statePackage.optJSONArray("files");
        if (files == null) return;
        for (int i = 0; i < files.length(); i++) {
            JSONObject entry = files.optJSONObject(i);
            if (entry == null) continue;
            String path = entry.optString("path", "");
            File file = managedFile(root, path);
            if (file.exists() && !file.delete()) throw new IOException("Não foi possível substituir " + path);
        }
    }

    private static File managedFile(File root, String path) throws IOException {
        if (!safeManagedPath(path)) throw new IOException("Caminho de recurso inválido: " + path);
        String rootPath = root.getCanonicalPath() + File.separator;
        File file = new File(root, path);
        if (!file.getCanonicalPath().startsWith(rootPath)) throw new IOException("Caminho de recurso inseguro.");
        return file;
    }

    private static boolean safeManagedPath(String path) {
        return path.matches("data/[a-z0-9_-]+\\.js")
                || path.matches("interlinear/[a-z0-9_-]+/[0-9]{2,3}\\.js");
    }

    private static void validateRoot(File root) throws IOException {
        if (!new File(root, "data/almeida.js").isFile()
                || !new File(root, "data/strong-pt.js").isFile()
                || !new File(root, "data/wlc.js").isFile()
                || !new File(root, "data/tr.js").isFile()
                || !new File(root, "data/oshb_strong.js").isFile()
                || !new File(root, "interlinear/genesis/02.js").isFile()
                || !new File(root, "interlinear/exodus/01.js").isFile())
            throw new IOException("O conjunto de recursos ficou incompleto.");
    }

    private static LinkedHashMap<String, JSONObject> stateMap(JSONObject state) throws IOException {
        if (state.optInt("schema", 0) != 1) throw new IOException("Estado local dos pacotes incompatível.");
        JSONArray array = state.optJSONArray("packages");
        if (array == null) throw new IOException("Estado local dos pacotes inválido.");
        LinkedHashMap<String, JSONObject> out = new LinkedHashMap<>();
        for (int i = 0; i < array.length(); i++) {
            JSONObject pkg = array.optJSONObject(i);
            if (pkg == null) throw new IOException("Estado local dos pacotes inválido.");
            String key = pkg.optString("package_key", "");
            if (!key.matches("[a-z0-9][a-z0-9-]{0,63}") || out.put(key, pkg) != null)
                throw new IOException("Estado local contém pacote inválido.");
        }
        return out;
    }

    private static void writeState(File root, LinkedHashMap<String, JSONObject> packages) throws IOException {
        try {
            JSONArray array = new JSONArray();
            for (JSONObject pkg : packages.values()) array.put(pkg);
            JSONObject state = new JSONObject().put("schema", 1).put("packages", array);
            writeJsonFile(new File(root, STATE), state);
        } catch (JSONException e) {
            throw new IOException(e);
        }
    }

    private static JSONObject readJsonFile(File file, int limit) throws IOException {
        try (InputStream in = new FileInputStream(file)) {
            try { return new JSONObject(readLimited(in, limit)); }
            catch (JSONException e) { throw new IOException("Arquivo de estado inválido.", e); }
        }
    }

    private static void writeJsonFile(File file, JSONObject object) throws IOException {
        File parent = file.getParentFile();
        if (parent == null || (!parent.isDirectory() && !parent.mkdirs())) throw new IOException("Não foi possível gravar o estado dos recursos.");
        File temp = new File(parent, file.getName() + ".tmp");
        try (FileOutputStream out = new FileOutputStream(temp)) {
            out.write(object.toString().getBytes(StandardCharsets.UTF_8));
            out.getFD().sync();
        }
        if (file.exists() && !file.delete()) throw new IOException("Não foi possível substituir o estado dos recursos.");
        if (!temp.renameTo(file)) throw new IOException("Não foi possível ativar o estado dos recursos.");
    }

    private static void writeReady(File root, String generatedAt) throws IOException {
        try (FileOutputStream out = new FileOutputStream(new File(root, READY))) {
            String marker = "doxa-core-set-v1\n" + generatedAt + "\n";
            out.write(marker.getBytes(StandardCharsets.UTF_8));
            out.getFD().sync();
        }
    }

    private static File prepareCache(Context context) throws IOException {
        File cache = new File(context.getCacheDir(), "doxa-remote-packages");
        deleteTree(cache);
        if (!cache.mkdirs()) throw new IOException("Não foi possível preparar o cache do download.");
        return cache;
    }

    private static void download(ServerPackage item, File destination, long base, long total, Progress progress) throws IOException {
        URL url = new URL(item.signedUrl);
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
                if (written > item.sizeBytes) throw new IOException("Pacote maior que o esperado.");
                out.write(buffer, 0, n);
                progress.onBytes(base + written, total);
            }
            out.getFD().sync();
        } finally {
            connection.disconnect();
        }
        if (written != item.sizeBytes || !PackageArchive.digest(destination).equals(item.sha256))
            throw new IOException("Falha de integridade no pacote " + item.key + ".");
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

    private static void copyTree(File source, File destination) throws IOException {
        if (source.isDirectory()) {
            if (!destination.isDirectory() && !destination.mkdirs()) throw new IOException("Não foi possível preparar a cópia segura dos recursos.");
            File[] children = source.listFiles();
            if (children == null) throw new IOException("Não foi possível ler os recursos instalados.");
            for (File child : children) copyTree(child, new File(destination, child.getName()));
            return;
        }
        File parent = destination.getParentFile();
        if (parent == null || (!parent.isDirectory() && !parent.mkdirs())) throw new IOException("Não foi possível preparar a cópia segura dos recursos.");
        try (InputStream in = new FileInputStream(source); FileOutputStream out = new FileOutputStream(destination)) {
            byte[] buffer = new byte[65536];
            int n;
            while ((n = in.read(buffer)) != -1) out.write(buffer, 0, n);
            out.getFD().sync();
        }
    }

    private static String downloadLabel(String key, int index, int total, boolean updating) {
        String name;
        if ("core-texts".equals(key)) name = "textos essenciais";
        else if ("pt-bibles-a".equals(key)) name = "Bíblias PT 1/2";
        else if ("pt-bibles-b".equals(key)) name = "Bíblias PT 2/2";
        else if ("interlinear-gn-ex".equals(key)) name = "interlinear de Gênesis e Êxodo";
        else if (key.startsWith("interlinear-")) name = "novo interlinear";
        else name = key.replace('-', ' ');
        return (updating ? "Atualizando " : "Baixando ") + name + "… (" + index + "/" + total + ")";
    }

    private static String safeCacheName(String key) throws IOException {
        if (!key.matches("[a-z0-9][a-z0-9-]{0,63}")) throw new IOException("Nome de pacote inválido.");
        return key + ".zip";
    }

    private static void deleteTree(File file) throws IOException {
        if (!file.exists()) return;
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) for (File child : children) deleteTree(child);
        }
        if (!file.delete()) throw new IOException("Não foi possível limpar " + file.getName());
    }

    private static final class ChangePlan {
        final List<String> changedKeys, downloadKeys, removedKeys;
        final long downloadBytes;
        final boolean appUpdateRequired;
        ChangePlan(List<String> changedKeys, List<String> downloadKeys, List<String> removedKeys,
                   long downloadBytes, boolean appUpdateRequired) {
            this.changedKeys = changedKeys;
            this.downloadKeys = downloadKeys;
            this.removedKeys = removedKeys;
            this.downloadBytes = downloadBytes;
            this.appUpdateRequired = appUpdateRequired;
        }
    }

    private static final class ServerPackage {
        final String key, version, storagePath, sha256, signedUrl;
        final long sizeBytes;
        final int minAppVersionCode;

        ServerPackage(String key, String version, String storagePath, String sha256, String signedUrl,
                      long sizeBytes, int minAppVersionCode) {
            this.key = key;
            this.version = version;
            this.storagePath = storagePath;
            this.sha256 = sha256;
            this.signedUrl = signedUrl;
            this.sizeBytes = sizeBytes;
            this.minAppVersionCode = minAppVersionCode;
        }

        static ServerPackage parse(JSONObject item) throws IOException {
            String key = item.optString("package_key", "");
            String version = item.optString("version", "");
            String path = item.optString("storage_path", "");
            String sha = item.optString("sha256", "");
            String signed = item.optString("signed_url", "");
            long size = item.optLong("size_bytes", -1);
            int min = item.optInt("min_app_version_code", 0);
            if (!key.matches("[a-z0-9][a-z0-9-]{0,63}")
                    || version.isEmpty() || path.isEmpty() || signed.isEmpty()
                    || !sha.matches("[0-9a-f]{64}") || size <= 0 || size > MAX_PACKAGE || min < 0)
                throw new IOException("Manifesto de pacote inválido no servidor.");
            return new ServerPackage(key, version, path, sha, signed, size, min);
        }
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
