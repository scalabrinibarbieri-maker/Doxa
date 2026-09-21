package com.doxa.android;

import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import androidx.webkit.*;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final int IMPORT = 10, PICK_FILE = 11, SAVE_FILE = 12;
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String START = ORIGIN + "/assets/index.html";
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private WebView web;
    private TextView status;
    private Button downloadButton, importButton;
    private ProgressBar progress;
    private ValueCallback<Uri[]> fileCallback;
    private volatile boolean destroyed;
    private boolean importing, updateCheckStarted;
    // All export state below is confined to the single IO executor.
    private File exportFile;
    private OutputStream exportStream;
    private long exportSize, exportWritten;
    private JavaScriptReplyProxy exportReply;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        try { RemotePackageInstaller.recover(getFilesDir()); }
        catch (IOException error) { message("O Doxa não conseguiu concluir uma recuperação de recursos."); }
        if (RemotePackageInstaller.isReady(getFilesDir())) showReader(true);
        else if (new File(getFilesDir(), "reader/.ready").isFile()) prepareReader();
        else showImport();
    }

    private void showImport() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        int pad = (int) (28 * getResources().getDisplayMetrics().density);
        layout.setPadding(pad, pad, pad, pad);
        layout.setBackgroundColor(Color.rgb(246, 242, 234));
        ImageView icon = new ImageView(this);
        icon.setImageResource(R.drawable.doxa_icon);
        layout.addView(icon, new LinearLayout.LayoutParams(pad * 4, pad * 4));
        TextView title = new TextView(this);
        title.setText("Doxa"); title.setTextSize(36); title.setGravity(Gravity.CENTER);
        title.setTextColor(Color.rgb(42, 38, 32));
        layout.addView(title);
        status = new TextView(this);
        status.setText("Prepare o Doxa uma vez e depois leia offline.\n\nBaixe o pacote oficial para trazer os textos e o interlinear para este aparelho. A importação da V29 continua disponível como recuperação.\n\nGrifos, notas e recursos já baixados em outra instalação não são transferidos automaticamente.");
        status.setTextSize(16); status.setGravity(Gravity.CENTER);
        status.setPadding(0, pad, 0, pad);
        layout.addView(status);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setVisibility(View.GONE);
        layout.addView(progress, new LinearLayout.LayoutParams(-1, pad));

        downloadButton = new Button(this);
        downloadButton.setText("Baixar Doxa");
        downloadButton.setOnClickListener(v -> installRemote());
        layout.addView(downloadButton);

        importButton = new Button(this);
        importButton.setText("Selecionar minha V29");
        importButton.setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*")
                    .addCategory(Intent.CATEGORY_OPENABLE);
            try { startActivityForResult(intent, IMPORT); }
            catch (ActivityNotFoundException e) { message("Não foi possível abrir o seletor de arquivos."); }
        });
        layout.addView(importButton);
        ScrollView scroll = new ScrollView(this); scroll.setFillViewport(true); scroll.addView(layout);
        setContentView(scroll);
    }

    private void installRemote() {
        if (importing) return;
        importing = true;
        downloadButton.setEnabled(false);
        importButton.setEnabled(false);
        progress.setVisibility(View.VISIBLE);
        progress.setIndeterminate(false);
        progress.setMax(1000);
        progress.setProgress(0);
        status.setText("Conectando ao servidor do Doxa…");
        io.execute(() -> {
            try {
                RemotePackageInstaller.install(this, new RemotePackageInstaller.Progress() {
                    @Override public void onStatus(String text) {
                        runOnUiThread(() -> { if (!destroyed && status != null) status.setText(text); });
                    }
                    @Override public void onBytes(long done, long total) {
                        if (total <= 0) return;
                        int value = (int) Math.min(1000, (done * 1000L) / total);
                        runOnUiThread(() -> { if (!destroyed && progress != null) progress.setProgress(value); });
                    }
                });
                runOnUiThread(() -> {
                    importing = false;
                    if (!destroyed) showReader(true);
                });
            } catch (Exception error) {
                runOnUiThread(() -> {
                    importing = false;
                    if (!destroyed) {
                        status.setText("Não foi possível baixar o pacote.\n\n" + error.getMessage() + "\n\nVocê pode tentar novamente ou usar sua V29.");
                        downloadButton.setEnabled(true);
                        importButton.setEnabled(true);
                        progress.setVisibility(View.GONE);
                    }
                });
            }
        });
    }

    private void importV29(Uri uri) {
        if (importing) return;
        importing = true;
        downloadButton.setEnabled(false);
        importButton.setEnabled(false);
        progress.setVisibility(View.VISIBLE);
        status.setText("Conferindo e importando a V29… Mantenha o aplicativo aberto.");
        io.execute(() -> {
            File stage = new File(getFilesDir(), "reader-staging");
            try {
                LegacyImporter.deleteTree(stage);
                Map<String, LegacyImporter.Entry> manifest = LegacyImporter.readManifest(getAssets().open("v29-manifest.tsv"));
                try (InputStream input = getContentResolver().openInputStream(uri)) {
                    if (input == null) throw new IOException("Não foi possível ler o arquivo.");
                    LegacyImporter.extract(input, stage, manifest, (done, total) -> runOnUiThread(() -> {
                        if (!destroyed) { progress.setMax(total); progress.setProgress(done); }
                    }));
                }
                try (OutputStream marker = new FileOutputStream(new File(stage, ".ready"))) { marker.write(29); }
                File destination = new File(getFilesDir(), "reader");
                if (destination.exists() || !stage.renameTo(destination)) throw new IOException("Não foi possível ativar o leitor.");
                runOnUiThread(() -> { importing = false; if (!destroyed) prepareReader(); });
            } catch (Exception error) {
                try { LegacyImporter.deleteTree(stage); } catch (IOException ignored) { }
                runOnUiThread(() -> {
                    importing = false;
                    if (!destroyed) {
                        status.setText("Não foi possível importar.\n\n" + error.getMessage());
                        downloadButton.setEnabled(true);
                        importButton.setEnabled(true);
                        progress.setVisibility(View.GONE);
                    }
                });
            }
        });
    }

    private void prepareReader() {
        showImport();
        importing = true;
        downloadButton.setVisibility(View.GONE);
        importButton.setVisibility(View.GONE);
        progress.setVisibility(View.VISIBLE);
        progress.setIndeterminate(true);
        status.setText("Preparando seu leitor…\n\nNa primeira abertura, esta atualização organiza os textos já importados. Mantenha o Doxa aberto.");
        io.execute(() -> {
            try {
                ReaderMigration.prepare(getFilesDir(), getAssets().open("reader-data.tsv"));
                runOnUiThread(() -> { importing = false; if (!destroyed) showReader(true); });
            } catch (Exception error) {
                runOnUiThread(() -> {
                    importing = false;
                    if (!destroyed) new AlertDialog.Builder(this)
                            .setTitle("Não foi possível preparar a atualização")
                            .setMessage("Sua V29 foi preservada.\n\n" + error.getMessage())
                            .setCancelable(false)
                            .setPositiveButton("Tentar novamente", (d,w) -> prepareReader())
                            .setNegativeButton("Abrir V29 preservada", (d,w) -> showReader(false)).show();
                });
            }
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void showReader(boolean modular) {
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(246, 242, 234));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // User-selected backup files only.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebViewAssetLoader.Builder builder = new WebViewAssetLoader.Builder();
        if (modular) {
            WebViewAssetLoader.AssetsPathHandler bundled = new WebViewAssetLoader.AssetsPathHandler(this);
            boolean remote = RemotePackageInstaller.isReady(getFilesDir());
            File remoteRoot = RemotePackageInstaller.root(getFilesDir());
            File dataRoot = remote ? new File(remoteRoot, "data") : new File(getFilesDir(), "reader-data-v1");
            File interlinearRoot = remote ? new File(remoteRoot, "interlinear") : new File(getFilesDir(), "reader/interlinear");
            builder.addPathHandler("/assets/data/", new WebViewAssetLoader.InternalStoragePathHandler(this, dataRoot))
                    .addPathHandler("/assets/interlinear/", new WebViewAssetLoader.InternalStoragePathHandler(this, interlinearRoot))
                    .addPathHandler("/assets/", path -> bundled.handle("reader/" + path));
        } else {
            builder.addPathHandler("/assets/", new WebViewAssetLoader.InternalStoragePathHandler(this, new File(getFilesDir(), "reader")));
        }
        WebViewAssetLoader loader = builder.build();
        boolean bridgeAvailable = WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER);
        if (bridgeAvailable) {
            WebViewCompat.addWebMessageListener(web, "DoxaFiles", Collections.singleton(ORIGIN),
                    (view, msg, origin, mainFrame, reply) -> {
                        if (!mainFrame || !ORIGIN.equals(origin.toString())) return;
                        String data = msg.getData();
                        if (data != null && data.length() <= 400000) io.execute(() -> receiveExport(data, reply));
                    });
        }
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = loader.shouldInterceptRequest(request.getUrl());
                if (response != null) return response;
                if ("appassets.androidplatform.net".equals(request.getUrl().getHost()))
                    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
                return null;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (START.equals(uri.toString()) || uri.toString().startsWith(START + "#")) return false;
                if (request.isForMainFrame()) openExternal(uri);
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (!url.equals(START) && !url.startsWith(START + "#")) return;
                if (bridgeAvailable) {
                    try { view.evaluateJavascript(readAsset("native-files.js"), null); }
                    catch (IOException error) { message("Não foi possível preparar a exportação de arquivos."); }
                }
                maybeCheckResourceUpdates();
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError error) {
                if (req.isForMainFrame()) new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Não foi possível abrir o leitor")
                        .setMessage("Os arquivos importados permanecem neste aparelho.")
                        .setPositiveButton("Tentar novamente", (d, w) -> web.loadUrl(START)).show();
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*")
                            .addCategory(Intent.CATEGORY_OPENABLE), PICK_FILE);
                } catch (ActivityNotFoundException error) { fileCallback.onReceiveValue(null); fileCallback = null; }
                return true;
            }
            @Override public boolean onJsAlert(WebView view, String url, String text, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(text)
                        .setPositiveButton("OK", (d,w) -> result.confirm())
                        .setOnCancelListener(d -> result.cancel()).show(); return true;
            }
            @Override public boolean onJsConfirm(WebView view, String url, String text, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(text)
                        .setPositiveButton("Confirmar", (d,w) -> result.confirm())
                        .setNegativeButton("Cancelar", (d,w) -> result.cancel())
                        .setOnCancelListener(d -> result.cancel()).show(); return true;
            }
        });
        web.setDownloadListener((url, agent, disposition, mime, length) -> {
            if (url.startsWith("blob:")) message("Para exportar backups, atualize o Android System WebView e reabra o Doxa.");
            else openExternal(Uri.parse(url));
        });
        setContentView(web);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
        web.loadUrl(START);
    }

    private void maybeCheckResourceUpdates() {
        if (updateCheckStarted || importing || !RemotePackageInstaller.isReady(getFilesDir())) return;
        updateCheckStarted = true;
        io.execute(() -> {
            try {
                RemotePackageInstaller.UpdateInfo info = RemotePackageInstaller.checkForUpdates(this);
                if (info.hasUpdate()) runOnUiThread(() -> {
                    if (destroyed || importing) return;
                    StringBuilder text = new StringBuilder();
                    text.append(info.packageCount == 1 ? "Há 1 pacote de recursos novo." : "Há " + info.packageCount + " pacotes de recursos novos.");
                    if (info.downloadBytes > 0) text.append("\n\nDownload: ").append(formatSize(info.downloadBytes)).append('.');
                    text.append("\n\nO Doxa baixa somente o que mudou, confere a integridade e mantém a versão anterior até a atualização terminar.");
                    new AlertDialog.Builder(this)
                            .setTitle("Atualização de recursos")
                            .setMessage(text.toString())
                            .setNegativeButton("Depois", null)
                            .setPositiveButton("Atualizar agora", (d,w) -> startResourceUpdate())
                            .show();
                });
                else if (info.appUpdateRequired) runOnUiThread(() -> {
                    if (!destroyed) message("Há recursos novos que exigem uma versão mais recente do Doxa.");
                });
            } catch (IOException ignored) {
                // Offline or server unavailable: reading remains fully usable with local resources.
            }
        });
    }

    private void startResourceUpdate() {
        if (importing) return;
        importing = true;
        if (web != null) {
            web.stopLoading();
            web.onPause();
            web.destroy();
            web = null;
        }
        showImport();
        downloadButton.setVisibility(View.GONE);
        importButton.setVisibility(View.GONE);
        progress.setVisibility(View.VISIBLE);
        progress.setIndeterminate(false);
        progress.setMax(1000);
        progress.setProgress(0);
        status.setText("Preparando atualização dos recursos…");

        io.execute(() -> {
            try {
                RemotePackageInstaller.update(this, new RemotePackageInstaller.Progress() {
                    @Override public void onStatus(String text) {
                        runOnUiThread(() -> { if (!destroyed && status != null) status.setText(text); });
                    }
                    @Override public void onBytes(long done, long total) {
                        if (total <= 0) return;
                        int value = (int) Math.min(1000, (done * 1000L) / total);
                        runOnUiThread(() -> { if (!destroyed && progress != null) progress.setProgress(value); });
                    }
                });
                runOnUiThread(() -> {
                    importing = false;
                    if (!destroyed) {
                        showReader(true);
                        message("Recursos do Doxa atualizados.");
                    }
                });
            } catch (Exception error) {
                runOnUiThread(() -> {
                    importing = false;
                    if (!destroyed) {
                        showReader(true);
                        new AlertDialog.Builder(this)
                                .setTitle("Atualização não aplicada")
                                .setMessage("Os recursos anteriores foram preservados.\n\n" + error.getMessage())
                                .setPositiveButton("OK", null)
                                .show();
                    }
                });
            }
        });
    }

    private static String formatSize(long bytes) {
        if (bytes < 1024L * 1024L) return Math.max(1, bytes / 1024L) + " KB";
        double mb = bytes / (1024.0 * 1024.0);
        return String.format(java.util.Locale.ROOT, "%.1f MB", mb);
    }

    private void receiveExport(String data, JavaScriptReplyProxy reply) {
        try {
            JSONObject payload = new JSONObject(data);
            String action = payload.getString("action");
            if (action.equals("begin")) {
                if (exportFile != null) {
                    runOnUiThread(() -> { if (!destroyed) reply.postMessage("error:Já existe uma exportação em andamento."); });
                    return;
                }
                long size = payload.getLong("size");
                if (size < 0 || size > 512L * 1024 * 1024) throw new IOException("O limite por backup é 512 MB.");
                exportFile = File.createTempFile("doxa-export-", ".tmp", getCacheDir());
                exportStream = new FileOutputStream(exportFile); exportSize = size; exportWritten = 0;
            } else if (action.equals("chunk")) {
                if (exportStream == null) throw new IOException("Exportação não iniciada.");
                byte[] bytes = Base64.decode(payload.getString("data"), Base64.NO_WRAP);
                exportWritten += bytes.length;
                if (exportWritten > exportSize) throw new IOException("Tamanho de backup inválido.");
                exportStream.write(bytes);
            } else if (action.equals("end")) {
                if (exportStream == null || exportWritten != exportSize) throw new IOException("Backup incompleto.");
                exportStream.close(); exportStream = null;
                exportReply = reply;
                String name = payload.optString("name", "Doxa_Backup.json").replaceAll("[^a-zA-Z0-9._-]", "_");
                if (name.length() > 100) name = name.substring(0, 100);
                final String fileName = name.isEmpty() ? "Doxa_Backup.json" : name;
                runOnUiThread(() -> {
                    if (destroyed) return;
                    try { startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/octet-stream")
                            .addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE, fileName), SAVE_FILE); }
                    catch (ActivityNotFoundException error) {
                        reply.postMessage("error:Não foi possível abrir o local de salvamento.");
                        io.execute(this::clearExport);
                    }
                });
                return; // Reply only after the system save dialog completes.
            } else if (action.equals("abort")) clearExport();
            else throw new IOException("Operação desconhecida.");
            runOnUiThread(() -> { if (!destroyed) reply.postMessage("ok"); });
        } catch (Exception error) {
            clearExport();
            runOnUiThread(() -> { if (!destroyed) reply.postMessage("error:" + error.getMessage()); });
        }
    }

    private void clearExport() {
        try { if (exportStream != null) exportStream.close(); } catch (IOException ignored) { }
        if (exportFile != null) exportFile.delete();
        exportFile = null; exportStream = null;
        exportReply = null;
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
        if (request == IMPORT && uri != null) importV29(uri);
        if (request == PICK_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(uri == null ? null : new Uri[]{uri}); fileCallback = null;
        }
        if (request == SAVE_FILE) io.execute(() -> {
            JavaScriptReplyProxy reply = exportReply;
            try {
                if (uri != null && exportFile != null) {
                    try (InputStream in = new FileInputStream(exportFile); OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                        if (out == null) throw new IOException("Destino indisponível.");
                        byte[] buffer = new byte[65536]; int count;
                        while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
                    }
                    runOnUiThread(() -> message("Backup salvo."));
                }
                runOnUiThread(() -> { if (!destroyed && reply != null) reply.postMessage("ok"); });
            } catch (Exception error) {
                runOnUiThread(() -> { if (!destroyed && reply != null) reply.postMessage("error:" + error.getMessage()); });
            }
            finally { clearExport(); }
        });
    }

    private String readAsset(String name) throws IOException {
        try (InputStream input = getAssets().open(name); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192]; int count;
            while ((count = input.read(buffer)) != -1) out.write(buffer, 0, count);
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        }
    }
    private void openExternal(Uri uri) {
        if (!"https".equals(uri.getScheme()) && !"http".equals(uri.getScheme())) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (ActivityNotFoundException e) { message("Nenhum navegador disponível."); }
    }
    private void message(String text) { if (!destroyed) Toast.makeText(this, text, Toast.LENGTH_LONG).show(); }
    @Override public void onBackPressed() {
        if (importing) { message("Aguarde a preparação terminar."); return; }
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("(()=>{const s=document.querySelector('#studyScreen.on,#v20Advanced.on,#verseActions.on');if(s){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return true}return false})()", value -> {
            if (!destroyed && !"true".equals(value)) new AlertDialog.Builder(this).setMessage("Fechar o Doxa?")
                    .setNegativeButton("Continuar lendo", null).setPositiveButton("Fechar", (d,w) -> finish()).show();
        });
    }
    @Override protected void onPause() { if (web != null) web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() {
        destroyed = true;
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (web != null) { web.stopLoading(); web.destroy(); }
        io.execute(this::clearExport); io.shutdown();
        super.onDestroy();
    }
}
