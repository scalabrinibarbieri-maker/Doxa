package com.doxa.android;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.AssetFileDescriptor;
import android.graphics.Color;
import android.graphics.SurfaceTexture;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.view.Gravity;
import android.view.Surface;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;

public final class DaviIntroActivity extends Activity implements TextureView.SurfaceTextureListener {
    static final String PREFS = "doxa_davi";
    private static final String KEY_INTRO_SEEN = "intro_seen_v1";

    private TextureView texture;
    private MediaPlayer player;
    private boolean leaving;
    private boolean prepared;
    private boolean firstFrameShown;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        immersive();

        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        if (prefs.getBoolean(KEY_INTRO_SEEN, false)) {
            openDoxa(false);
            return;
        }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        // Poster real da animação: evita qualquer flash/tela preta enquanto o decoder abre.
        ImageView poster = new ImageView(this);
        poster.setImageResource(R.drawable.davi_intro_poster);
        poster.setScaleType(ImageView.ScaleType.CENTER_CROP);
        root.addView(poster, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        // TextureView é mais confiável que VideoView/SurfaceView em algumas GPUs Android.
        texture = new TextureView(this);
        texture.setOpaque(true);
        texture.setAlpha(0f);
        texture.setSurfaceTextureListener(this);
        root.addView(texture, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        Button skip = new Button(this);
        skip.setText("Pular");
        skip.setAllCaps(false);
        skip.setTextSize(13);
        skip.setTextColor(Color.argb(225, 255, 247, 234));
        skip.setBackgroundColor(Color.TRANSPARENT);
        skip.setPadding(dp(18), dp(10), dp(18), dp(10));
        skip.setOnClickListener(v -> openDoxa(true));

        FrameLayout.LayoutParams skipParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.TOP | Gravity.END);
        skipParams.topMargin = dp(14);
        skipParams.rightMargin = dp(10);
        root.addView(skip, skipParams);

        setContentView(root);
    }

    private void prepareVideo(SurfaceTexture surfaceTexture) {
        releasePlayer();
        try {
            player = new MediaPlayer();

            try (AssetFileDescriptor afd = getResources().openRawResourceFd(R.raw.davi_intro)) {
                if (afd == null) throw new IllegalStateException("Vídeo da introdução indisponível.");
                player.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            }

            Surface surface = new Surface(surfaceTexture);
            player.setSurface(surface);
            surface.release();

            player.setLooping(false);
            player.setVolume(1f, 1f);
            player.setVideoScalingMode(MediaPlayer.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING);

            player.setOnPreparedListener(mp -> {
                prepared = true;
                if (!leaving) mp.start();
            });

            player.setOnCompletionListener(mp -> openDoxa(true));

            player.setOnErrorListener((mp, what, extra) -> {
                // Nunca deixa a pessoa presa numa tela preta.
                texture.setAlpha(0f);
                texture.postDelayed(() -> {
                    if (!leaving) openDoxa(true);
                }, 1200);
                return true;
            });

            player.prepareAsync();
        } catch (Exception error) {
            texture.setAlpha(0f);
            texture.postDelayed(() -> {
                if (!leaving) openDoxa(true);
            }, 1200);
        }
    }

    private void showFirstVideoFrame() {
        if (firstFrameShown || texture == null) return;
        firstFrameShown = true;
        texture.animate().alpha(1f).setDuration(160).start();
    }

    private void openDoxa(boolean remember) {
        if (leaving) return;
        leaving = true;
        releasePlayer();

        if (remember) {
            getSharedPreferences(PREFS, MODE_PRIVATE)
                    .edit()
                    .putBoolean(KEY_INTRO_SEEN, true)
                    .apply();
        }

        startActivity(new Intent(this, MainActivity.class));
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        finish();
    }

    private void releasePlayer() {
        prepared = false;
        if (player != null) {
            try { player.setSurface(null); } catch (Exception ignored) { }
            try { player.stop(); } catch (Exception ignored) { }
            player.reset();
            player.release();
            player = null;
        }
    }

    private int dp(float value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
        prepareVideo(surface);
    }

    @Override public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) { }

    @Override public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
        releasePlayer();
        return true;
    }

    @Override public void onSurfaceTextureUpdated(SurfaceTexture surface) {
        showFirstVideoFrame();
    }

    @Override protected void onResume() {
        super.onResume();
        immersive();
        if (prepared && player != null && !leaving && !player.isPlaying()) {
            try { player.start(); } catch (Exception ignored) { }
        }
    }

    @Override protected void onPause() {
        if (player != null && player.isPlaying()) {
            try { player.pause(); } catch (Exception ignored) { }
        }
        super.onPause();
    }

    @Override protected void onDestroy() {
        releasePlayer();
        super.onDestroy();
    }
}
