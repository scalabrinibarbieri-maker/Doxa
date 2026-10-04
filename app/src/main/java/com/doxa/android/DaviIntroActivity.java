package com.doxa.android;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.VideoView;

public final class DaviIntroActivity extends Activity {
    static final String PREFS = "doxa_davi";
    private static final String KEY_INTRO_SEEN = "intro_seen_v1";
    private VideoView video;
    private boolean leaving;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        immersive();

        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        if (prefs.getBoolean(KEY_INTRO_SEEN, false)) {
            openDoxa(false);
            return;
        }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        video = new VideoView(this);
        video.setBackgroundColor(Color.BLACK);
        video.setVideoURI(Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.davi_intro));
        video.setOnPreparedListener(player -> {
            player.setLooping(false);
            player.setVideoScalingMode(android.media.MediaPlayer.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING);
            video.start();
        });
        video.setOnCompletionListener(player -> openDoxa(true));
        video.setOnErrorListener((player, what, extra) -> {
            openDoxa(true);
            return true;
        });
        root.addView(video, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
                Gravity.CENTER));

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

    private void openDoxa(boolean remember) {
        if (leaving) return;
        leaving = true;
        if (remember) getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean(KEY_INTRO_SEEN, true).apply();
        startActivity(new Intent(this, MainActivity.class));
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        finish();
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

    @Override protected void onResume() {
        super.onResume();
        immersive();
        if (video != null && !leaving && !video.isPlaying()) video.start();
    }

    @Override protected void onPause() {
        if (video != null && video.isPlaying()) video.pause();
        super.onPause();
    }
}
