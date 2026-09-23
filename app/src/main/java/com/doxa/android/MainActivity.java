package com.doxa.android;

import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.*;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import androidx.webkit.*;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
    private volatile boolean appUpdateCheckStarted;
    // Doxa 40: a página oficial (site) e o repositório de onde ela lê a versão mais recente.
    private static final String OFFICIAL_SITE_URL = "https://scalabrinibarbieri-maker.github.io/Doxa/";
    private static final String LATEST_RELEASE_API = "https://api.github.com/repos/scalabrinibarbieri-maker/Doxa/releases/latest";
    private long lastBackPressAt;
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
        else showFirstRun();
    }

    private void showFirstRun() {
        showImport();
        downloadButton.setVisibility(View.GONE);
        importButton.setVisibility(View.GONE);
        status.setText("Preparando o Doxa…\n\nNa primeira abertura, os textos e recursos essenciais serão baixados automaticamente. Depois disso, o Doxa funciona offline.");
        installRemote();
    }

    private void showImport() {
        final float density = getResources().getDisplayMetrics().density;
        final int screenWidth = getResources().getDisplayMetrics().widthPixels;
        final int pad = (int) (26 * density);
        final int progressWidth = Math.min((int) (356 * density), (int) (screenWidth * .77f));
        final int iconSize = Math.min((int) (254 * density), (int) (screenWidth * .56f));
        final int glowSize = Math.min((int) (372 * density), (int) (screenWidth * .80f));

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(1, 1, 1));
        root.setClipChildren(false);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER_HORIZONTAL);
        layout.setPadding(pad, pad, pad, pad);
        layout.setClipChildren(false);

        FrameLayout.LayoutParams contentParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
        root.addView(layout, contentParams);

        FrameLayout iconStage = new FrameLayout(this);
        iconStage.setClipChildren(false);
        LinearLayout.LayoutParams stageParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, iconSize);
        layout.addView(iconStage, stageParams);

        View glowView = new View(this);
        GradientDrawable glow = new GradientDrawable();
        glow.setShape(GradientDrawable.OVAL);
        glow.setGradientType(GradientDrawable.RADIAL_GRADIENT);
        glow.setGradientCenter(.5f, .5f);
        glow.setGradientRadius(glowSize / 2f);
        glow.setColors(new int[]{
                Color.argb(92, 220, 146, 62),
                Color.argb(38, 116, 67, 24),
                Color.TRANSPARENT
        });
        glowView.setBackground(glow);
        FrameLayout.LayoutParams glowParams = new FrameLayout.LayoutParams(glowSize, glowSize, Gravity.CENTER);
        iconStage.addView(glowView, glowParams);

        ImageView icon = new ImageView(this);
        icon.setAdjustViewBounds(true);
        icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        try (InputStream in = getAssets().open("reader/doxa_splash_icon.png")) {
            icon.setImageBitmap(BitmapFactory.decodeStream(in));
        } catch (IOException error) {
            icon.setImageResource(R.drawable.doxa_icon);
        }
        FrameLayout.LayoutParams iconParams = new FrameLayout.LayoutParams(iconSize, iconSize, Gravity.CENTER);
        iconStage.addView(icon, iconParams);
        icon.setAlpha(0f);
        icon.setScaleX(.94f);
        icon.setScaleY(.94f);
        icon.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(900).start();

        TextView title = new TextView(this);
        title.setText("DOXA");
        title.setTextSize(50);
        title.setGravity(Gravity.CENTER);
        title.setTextColor(Color.rgb(243, 210, 161));
        title.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
        title.setLetterSpacing(.17f);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        titleParams.topMargin = (int) (30 * density);
        layout.addView(title, titleParams);

        status = new TextView(this);
        status.setText("Preparando o Doxa…");
        status.setTextSize(15);
        status.setGravity(Gravity.CENTER);
        status.setTextColor(Color.argb(240, 244, 234, 219));
        status.setTypeface(Typeface.create("sans-serif", Typeface.BOLD));
        LinearLayout.LayoutParams statusParams = new LinearLayout.LayoutParams(
                progressWidth, ViewGroup.LayoutParams.WRAP_CONTENT);
        statusParams.topMargin = (int) (28 * density);
        layout.addView(status, statusParams);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setVisibility(View.GONE);
        progress.setMax(1000);
        progress.setProgress(0);

        GradientDrawable track = new GradientDrawable();
        track.setColor(Color.rgb(12, 10, 8));
        track.setCornerRadius(999 * density);
        track.setStroke(Math.max(1, (int) density), Color.argb(46, 214, 161, 100));

        GradientDrawable fill = new GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{Color.rgb(156, 97, 43), Color.rgb(217, 154, 82),
                        Color.rgb(241, 201, 143), Color.rgb(255, 240, 209)});
        fill.setCornerRadius(999 * density);
        ClipDrawable clippedFill = new ClipDrawable(fill, Gravity.LEFT, ClipDrawable.HORIZONTAL);
        LayerDrawable progressDrawable = new LayerDrawable(new Drawable[]{track, clippedFill});
        progressDrawable.setId(0, android.R.id.background);
        progressDrawable.setId(1, android.R.id.progress);
        progress.setProgressDrawable(progressDrawable);

        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(
                progressWidth, Math.max((int) (8 * density), 8));
        progressParams.topMargin = (int) (15 * density);
        layout.addView(progress, progressParams);

        downloadButton = new Button(this);
        downloadButton.setText("Baixar Doxa");
        downloadButton.setAllCaps(false);
        downloadButton.setTextColor(Color.rgb(243, 210, 161));
        downloadButton.setTextSize(15);
        GradientDrawable downloadBackground = new GradientDrawable();
        downloadBackground.setColor(Color.rgb(18, 15, 12));
        downloadBackground.setCornerRadius(18 * density);
        downloadBackground.setStroke(Math.max(1, (int) density), Color.argb(105, 214, 161, 100));
        downloadButton.setBackground(downloadBackground);
        downloadButton.setOnClickListener(v -> installRemote());
        LinearLayout.LayoutParams downloadParams = new LinearLayout.LayoutParams(
                progressWidth, ViewGroup.LayoutParams.WRAP_CONTENT);
        downloadParams.topMargin = (int) (20 * density);
        layout.addView(downloadButton, downloadParams);

        importButton = new Button(this);
        importButton.setText("Selecionar minha V29");
        importButton.setAllCaps(false);
        importButton.setTextColor(Color.argb(215, 244, 234, 219));
        importButton.setTextSize(14);
        GradientDrawable importBackground = new GradientDrawable();
        importBackground.setColor(Color.rgb(10, 9, 8));
        importBackground.setCornerRadius(18 * density);
        importBackground.setStroke(Math.max(1, (int) density), Color.argb(55, 214, 161, 100));
        importButton.setBackground(importBackground);
        importButton.setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*")
                    .addCategory(Intent.CATEGORY_OPENABLE);
            try { startActivityForResult(intent, IMPORT); }
            catch (ActivityNotFoundException e) { message("Não foi possível abrir o seletor de arquivos."); }
        });
        LinearLayout.LayoutParams importParams = new LinearLayout.LayoutParams(
                progressWidth, ViewGroup.LayoutParams.WRAP_CONTENT);
        importParams.topMargin = (int) (10 * density);
        layout.addView(importButton, importParams);

        TextView tagline = new TextView(this);
        tagline.setText("A PALAVRA TRANSFORMA");
        tagline.setTextSize(11);
        tagline.setGravity(Gravity.CENTER);
        tagline.setTextColor(Color.argb(220, 204, 164, 118));
        tagline.setTypeface(Typeface.create("sans-serif", Typeface.BOLD));
        tagline.setLetterSpacing(.34f);
        FrameLayout.LayoutParams taglineParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
        taglineParams.leftMargin = pad;
        taglineParams.rightMargin = pad;
        taglineParams.bottomMargin = (int) (44 * density);
        root.addView(tagline, taglineParams);

        setContentView(root);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
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
                        downloadButton.setText("Tentar novamente");
                        downloadButton.setVisibility(View.VISIBLE);
                        importButton.setVisibility(View.VISIBLE);
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
        web.setBackgroundColor(Color.rgb(1, 1, 1));
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
                maybeCheckAppUpdate();
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

    /* Doxa 40: avisa quando existe uma publicação mais nova na página oficial (GitHub Releases),
       do mesmo jeito que o app já avisa sobre pacotes de recursos novos no Supabase — mas aqui
       o "Atualizar agora" abre a página, porque instalar o APK exige o navegador, não a WebView.
       O run number da tag da release (ex.: v39-201) equivale ao versionCode instalado
       (1000 + run number, ver app/build.gradle), então a comparação não depende de nenhum
       número extra publicado à parte. */
    private void maybeCheckAppUpdate() {
        if (appUpdateCheckStarted || importing) return;
        appUpdateCheckStarted = true;
        io.execute(() -> {
            try {
                // Sem pausa entre checagens: são poucos aparelhos e o GitHub permite 60 consultas
                // por hora sem autenticação, então checar a cada abertura do app é tranquilo.
                HttpURLConnection connection = (HttpURLConnection) new URL(LATEST_RELEASE_API).openConnection();
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                int code = connection.getResponseCode();
                if (code < 200 || code >= 300) { connection.disconnect(); return; }
                StringBuilder body = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) body.append(line);
                } finally { connection.disconnect(); }

                JSONObject release = new JSONObject(body.toString());
                String tag = release.optString("tag_name", "");
                Matcher m = Pattern.compile("-(\\d+)$").matcher(tag);
                if (!m.find()) return;                                  // release sem o formato esperado: nada a comparar
                int remoteVersionCode = 1000 + Integer.parseInt(m.group(1));
                int installedVersionCode;
                try {
                    installedVersionCode = getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
                } catch (PackageManager.NameNotFoundException e) { return; }
                if (remoteVersionCode <= installedVersionCode) return;

                String versionLabel = tag.replaceFirst("^v", "").replaceFirst("-\\d+$", "");
                runOnUiThread(() -> {
                    if (destroyed || importing) return;
                    new AlertDialog.Builder(this)
                            .setTitle("Nova versão do Doxa")
                            .setMessage("A versão " + versionLabel + " já está disponível na página oficial.\n\n" +
                                    "Toque em Atualizar agora para abrir a página e instalar por cima da versão atual. " +
                                    "Seus grifos, notas e o Pão Diário continuam no lugar.")
                            .setNegativeButton("Depois", null)
                            .setPositiveButton("Atualizar agora", (d, w) -> openExternal(Uri.parse(OFFICIAL_SITE_URL)))
                            .show();
                });
            } catch (Exception ignored) {
                // Sem internet, GitHub fora do ar, ou resposta inesperada: a versão instalada segue normalmente.
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
            } else if (action.equals("share")) {
                // Doxa 36: compartilhar imagem gerada no leitor (versículo do dia) pelo seletor do Android.
                if (exportStream == null || exportWritten != exportSize) throw new IOException("Imagem incompleta.");
                exportStream.close(); exportStream = null;
                File dir = new File(getCacheDir(), "share");
                if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Sem espaço para a imagem.");
                String mime = payload.optString("mime", "image/jpeg");
                if (!mime.equals("image/png")) mime = "image/jpeg";
                File image = new File(dir, mime.equals("image/png") ? "doxa-versiculo.png" : "doxa-versiculo.jpg");
                if (image.exists() && !image.delete()) throw new IOException("Não foi possível preparar a imagem.");
                if (!exportFile.renameTo(image)) {
                    try (InputStream in = new FileInputStream(exportFile); OutputStream out = new FileOutputStream(image)) {
                        byte[] buffer = new byte[65536]; int count;
                        while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
                    }
                    exportFile.delete();
                }
                exportFile = null;
                final String shareText = payload.optString("text", "");
                final String shareTitle = payload.optString("title", "Compartilhar");
                final String shareMime = mime;
                final Uri shareUri = androidx.core.content.FileProvider.getUriForFile(this, getPackageName() + ".share", image);
                runOnUiThread(() -> {
                    if (destroyed) return;
                    try {
                        Intent send = new Intent(Intent.ACTION_SEND).setType(shareMime)
                                .putExtra(Intent.EXTRA_STREAM, shareUri)
                                .putExtra(Intent.EXTRA_TEXT, shareText)
                                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        send.setClipData(ClipData.newRawUri("", shareUri));
                        startActivity(Intent.createChooser(send, shareTitle));
                        reply.postMessage("ok");
                    } catch (ActivityNotFoundException error) {
                        reply.postMessage("error:Nenhum aplicativo disponível para compartilhar.");
                    }
                });
                return;
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

        final String backScript =
                "(()=>{" +
                "const on=id=>document.getElementById(id)?.classList.contains('on');" +
                "const click=id=>{const e=document.getElementById(id);if(!e)return false;e.click();return true};" +

                "if(on('verseActions')||on('studyScreen')||on('v20Advanced')){" +
                "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return true}" +

                "if(on('doxa31HelpSheet')){click('doxa31HelpClose');return true}" +
                "if(on('doxa30ThemeOverlay')){document.getElementById('doxa30ThemeOverlay').classList.remove('on');return true}" +
                "if(on('doxa30MoreOverlay')){document.getElementById('doxa30MoreOverlay').classList.remove('on');return true}" +

                "if(on('strongSheet')){click('strongClose');return true}" +
                "if(on('xrefSheet')){click('xrefClose');return true}" +
                "if(on('versionPicker')){click('versionPickerClose');return true}" +

                "if(on('premiumPicker')){" +
                "const stage=document.querySelector('[data-picker-stage].on')?.dataset.pickerStage;" +
                "if(stage&&stage!=='book'){click('pickerBack')}else{click('pickerClose')}return true}" +

                "const notes=document.getElementById('toolsNotesView');" +
                "if(notes&&!notes.hidden){click('toolsNotesBack');return true}" +

                "if(document.body.classList.contains('parallel-mode')){click('parallelExit');return true}" +

                "const active=document.querySelector('.panel.on');" +
                "if(active&&active.id!=='p-ler'){try{openPanel('ler');return true}catch(e){}}" +

                "return false" +
                "})()";

        web.evaluateJavascript(backScript, value -> {
            if (destroyed) return;

            if ("true".equals(value)) {
                lastBackPressAt = 0L;
                return;
            }

            long now = android.os.SystemClock.elapsedRealtime();
            if (now - lastBackPressAt <= 1800L) {
                lastBackPressAt = 0L;
                new AlertDialog.Builder(this)
                        .setMessage("Fechar o Doxa?")
                        .setNegativeButton("Continuar lendo", null)
                        .setPositiveButton("Fechar", (d,w) -> finish())
                        .show();
            } else {
                lastBackPressAt = now;
                Toast.makeText(this, "Pressione Voltar novamente para sair", Toast.LENGTH_SHORT).show();
            }
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
