package com.doxa.android;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public final class DaviChallengeActivity extends Activity {
    private static final String PREFS = "doxa_davi";
    private static final String KEY_BREADS = "bread_total";
    private static final String KEY_REWARD_DAY = "last_reward_date";
    private static final String KEY_LAST_SCORE = "last_score";

    private static final int BG = Color.rgb(12, 10, 8);
    private static final int PANEL = Color.rgb(24, 19, 15);
    private static final int PANEL_2 = Color.rgb(31, 24, 18);
    private static final int GOLD = Color.rgb(217, 165, 91);
    private static final int GOLD_SOFT = Color.rgb(239, 207, 158);
    private static final int CREAM = Color.rgb(247, 237, 220);
    private static final int MUTED = Color.rgb(184, 168, 145);
    private static final int BORDER = Color.rgb(82, 62, 43);
    private static final int CORRECT = Color.rgb(48, 89, 59);
    private static final int WRONG = Color.rgb(101, 48, 49);

    private final Question[] questions = new Question[]{
            new Question("Quem derrotou Golias?", new String[]{"Davi", "Saul", "Samuel", "Jônatas"}, 0),
            new Question("Quem construiu a arca antes do dilúvio?", new String[]{"Abraão", "Moisés", "Noé", "Jacó"}, 2),
            new Question("Em qual livro está: “No princípio criou Deus os céus e a terra”?", new String[]{"Êxodo", "Salmos", "Gênesis", "João"}, 2),
            new Question("Quantos Evangelhos há no Novo Testamento?", new String[]{"3", "4", "5", "7"}, 1),
            new Question("Quem foi lançado na cova dos leões?", new String[]{"Jeremias", "Daniel", "Elias", "Eliseu"}, 1)
    };

    private int index;
    private int score;
    private boolean answered;
    private LinearLayout rootContent;
    private TextView balanceText;
    private TextView progressText;
    private TextView questionText;
    private TextView feedbackText;
    private ProgressBar progressBar;
    private Button nextButton;
    private final List<Button> answerButtons = new ArrayList<>();

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        setContentView(buildQuizScreen());
        renderQuestion();
    }

    private View buildQuizScreen() {
        FrameLayout frame = new FrameLayout(this);
        frame.setBackgroundColor(BG);

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setClipToPadding(false);
        frame.addView(scroll, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        rootContent = new LinearLayout(this);
        rootContent.setOrientation(LinearLayout.VERTICAL);
        rootContent.setPadding(dp(18), dp(18), dp(18), dp(34));
        scroll.addView(rootContent, new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        rootContent.addView(top, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        Button back = new Button(this);
        back.setText("‹");
        back.setTextSize(30);
        back.setTextColor(GOLD_SOFT);
        back.setBackground(round(Color.TRANSPARENT, dp(15), BORDER, 1));
        back.setPadding(0, 0, 0, dp(3));
        back.setOnClickListener(v -> finish());
        top.addView(back, new LinearLayout.LayoutParams(dp(46), dp(46)));

        TextView title = text("Desafios do Davi", 20, CREAM, Typeface.BOLD);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        titleParams.leftMargin = dp(12);
        top.addView(title, titleParams);

        balanceText = text("🍞 " + getBreadTotal(this), 15, GOLD_SOFT, Typeface.BOLD);
        balanceText.setGravity(Gravity.CENTER);
        balanceText.setPadding(dp(12), dp(9), dp(12), dp(9));
        balanceText.setBackground(round(PANEL_2, dp(999), BORDER, 1));
        top.addView(balanceText, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        LinearLayout hero = new LinearLayout(this);
        hero.setOrientation(LinearLayout.HORIZONTAL);
        hero.setGravity(Gravity.BOTTOM);
        hero.setPadding(dp(18), dp(8), dp(14), 0);
        hero.setBackground(round(PANEL, dp(24), BORDER, 1));
        LinearLayout.LayoutParams heroParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(180));
        heroParams.topMargin = dp(18);
        rootContent.addView(hero, heroParams);

        LinearLayout heroCopy = new LinearLayout(this);
        heroCopy.setOrientation(LinearLayout.VERTICAL);
        heroCopy.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams heroCopyParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f);
        hero.addView(heroCopy, heroCopyParams);

        TextView kicker = text("QUIZ DO DIA", 11, GOLD, Typeface.BOLD);
        kicker.setLetterSpacing(.13f);
        heroCopy.addView(kicker);
        TextView heroTitle = text("Vamos testar seu conhecimento?", 24, CREAM, Typeface.NORMAL);
        heroTitle.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
        LinearLayout.LayoutParams heroTitleParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        heroTitleParams.topMargin = dp(8);
        heroCopy.addView(heroTitle, heroTitleParams);
        TextView reward = text("Conclua: +1 pão  •  5/5: +1 extra", 12, MUTED, Typeface.NORMAL);
        LinearLayout.LayoutParams rewardParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        rewardParams.topMargin = dp(10);
        heroCopy.addView(reward, rewardParams);

        ImageView davi = new ImageView(this);
        davi.setImageResource(R.drawable.davi_mascote);
        davi.setScaleType(ImageView.ScaleType.FIT_CENTER);
        hero.addView(davi, new LinearLayout.LayoutParams(dp(122), ViewGroup.LayoutParams.MATCH_PARENT));

        LinearLayout progressRow = new LinearLayout(this);
        progressRow.setOrientation(LinearLayout.HORIZONTAL);
        progressRow.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams progressRowParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        progressRowParams.topMargin = dp(22);
        rootContent.addView(progressRow, progressRowParams);

        progressText = text("1/5", 13, GOLD, Typeface.BOLD);
        progressRow.addView(progressText);
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(questions.length);
        progressBar.setProgressTintList(ColorStateList.valueOf(GOLD));
        progressBar.setProgressBackgroundTintList(ColorStateList.valueOf(Color.rgb(47, 39, 31)));
        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(0, dp(8), 1f);
        progressParams.leftMargin = dp(12);
        progressRow.addView(progressBar, progressParams);

        questionText = text("", 25, CREAM, Typeface.BOLD);
        questionText.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
        questionText.setLineSpacing(0, 1.05f);
        LinearLayout.LayoutParams qParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        qParams.topMargin = dp(20);
        rootContent.addView(questionText, qParams);

        for (int i = 0; i < 4; i++) {
            final int answerIndex = i;
            Button answer = new Button(this);
            answer.setAllCaps(false);
            answer.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
            answer.setTextSize(16);
            answer.setTextColor(CREAM);
            answer.setPadding(dp(18), dp(4), dp(16), dp(4));
            answer.setBackground(round(PANEL, dp(17), BORDER, 1));
            answer.setOnClickListener(v -> choose(answerIndex));
            LinearLayout.LayoutParams aParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, dp(58));
            aParams.topMargin = dp(10);
            rootContent.addView(answer, aParams);
            answerButtons.add(answer);
        }

        feedbackText = text("", 14, MUTED, Typeface.BOLD);
        feedbackText.setVisibility(View.GONE);
        LinearLayout.LayoutParams fParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        fParams.topMargin = dp(16);
        rootContent.addView(feedbackText, fParams);

        nextButton = new Button(this);
        nextButton.setText("Continuar");
        nextButton.setAllCaps(false);
        nextButton.setTextSize(16);
        nextButton.setTypeface(Typeface.DEFAULT_BOLD);
        nextButton.setTextColor(Color.rgb(36, 24, 12));
        nextButton.setBackground(round(GOLD, dp(17), GOLD, 0));
        nextButton.setVisibility(View.GONE);
        nextButton.setOnClickListener(v -> next());
        LinearLayout.LayoutParams nParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(56));
        nParams.topMargin = dp(18);
        rootContent.addView(nextButton, nParams);

        return frame;
    }

    private void renderQuestion() {
        answered = false;
        Question q = questions[index];
        progressText.setText((index + 1) + "/" + questions.length);
        progressBar.setProgress(index + 1);
        questionText.setText(q.text);
        feedbackText.setVisibility(View.GONE);
        nextButton.setVisibility(View.GONE);
        nextButton.setText(index == questions.length - 1 ? "Ver resultado" : "Continuar");
        for (int i = 0; i < answerButtons.size(); i++) {
            Button b = answerButtons.get(i);
            b.setEnabled(true);
            b.setAlpha(1f);
            b.setText((char) ('A' + i) + "   " + q.answers[i]);
            b.setTextColor(CREAM);
            b.setBackground(round(PANEL, dp(17), BORDER, 1));
        }
    }

    private void choose(int selected) {
        if (answered) return;
        answered = true;
        Question q = questions[index];
        boolean correct = selected == q.correct;
        if (correct) score++;

        for (int i = 0; i < answerButtons.size(); i++) {
            Button b = answerButtons.get(i);
            b.setEnabled(false);
            if (i == q.correct) {
                b.setBackground(round(CORRECT, dp(17), Color.rgb(102, 151, 109), 1));
                b.setTextColor(Color.WHITE);
            } else if (i == selected) {
                b.setBackground(round(WRONG, dp(17), Color.rgb(160, 91, 91), 1));
                b.setTextColor(Color.WHITE);
            } else {
                b.setAlpha(.54f);
            }
        }

        feedbackText.setText(correct ? "Correto." : "Resposta correta: " + q.answers[q.correct] + ".");
        feedbackText.setTextColor(correct ? Color.rgb(152, 201, 157) : Color.rgb(222, 158, 154));
        feedbackText.setVisibility(View.VISIBLE);
        nextButton.setVisibility(View.VISIBLE);
    }

    private void next() {
        if (!answered) return;
        if (index < questions.length - 1) {
            index++;
            renderQuestion();
            return;
        }
        showResult();
    }

    private void showResult() {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        String today = todayKey();
        boolean alreadyRewarded = today.equals(prefs.getString(KEY_REWARD_DAY, ""));
        int earned = 0;
        int total = prefs.getInt(KEY_BREADS, 0);
        if (!alreadyRewarded) {
            earned = 1 + (score == questions.length ? 1 : 0);
            total += earned;
        }
        SharedPreferences.Editor edit = prefs.edit().putInt(KEY_LAST_SCORE, score);
        if (!alreadyRewarded) edit.putInt(KEY_BREADS, total).putString(KEY_REWARD_DAY, today);
        edit.apply();
        if (balanceText != null) balanceText.setText("🍞 " + total);

        FrameLayout frame = new FrameLayout(this);
        frame.setBackgroundColor(BG);
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        frame.addView(scroll, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);
        box.setPadding(dp(24), dp(28), dp(24), dp(32));
        scroll.addView(box, new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView label = text("DESAFIO CONCLUÍDO", 11, GOLD, Typeface.BOLD);
        label.setLetterSpacing(.15f);
        box.addView(label);

        ImageView davi = new ImageView(this);
        davi.setImageResource(R.drawable.davi_mascote);
        davi.setScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams dParams = new LinearLayout.LayoutParams(dp(190), dp(300));
        dParams.topMargin = dp(12);
        box.addView(davi, dParams);

        TextView scoreView = text(score + "/" + questions.length, 52, CREAM, Typeface.BOLD);
        scoreView.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
        box.addView(scoreView);

        String message;
        if (score == questions.length) message = "Perfeito. Você acertou todas.";
        else if (score >= 3) message = "Boa jornada. Amanhã tem um novo desafio.";
        else message = "Continue estudando. Amanhã você tenta de novo.";
        TextView msg = text(message, 17, MUTED, Typeface.NORMAL);
        msg.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams msgParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        msgParams.topMargin = dp(8);
        box.addView(msg, msgParams);

        LinearLayout rewardCard = new LinearLayout(this);
        rewardCard.setOrientation(LinearLayout.VERTICAL);
        rewardCard.setGravity(Gravity.CENTER);
        rewardCard.setPadding(dp(18), dp(16), dp(18), dp(16));
        rewardCard.setBackground(round(PANEL, dp(20), BORDER, 1));
        LinearLayout.LayoutParams rewardCardParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        rewardCardParams.topMargin = dp(22);
        box.addView(rewardCard, rewardCardParams);

        TextView rewardTitle = text(alreadyRewarded ? "Recompensa de hoje já recebida" : "+" + earned + (earned == 1 ? " pão" : " pães"), 20, GOLD_SOFT, Typeface.BOLD);
        rewardTitle.setGravity(Gravity.CENTER);
        rewardCard.addView(rewardTitle);
        TextView totalView = text("Seu saldo: 🍞 " + total, 14, MUTED, Typeface.NORMAL);
        totalView.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams totalParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        totalParams.topMargin = dp(7);
        rewardCard.addView(totalView, totalParams);

        Button back = new Button(this);
        back.setText("Voltar ao Pão Diário");
        back.setAllCaps(false);
        back.setTextSize(16);
        back.setTypeface(Typeface.DEFAULT_BOLD);
        back.setTextColor(Color.rgb(36, 24, 12));
        back.setBackground(round(GOLD, dp(17), GOLD, 0));
        back.setOnClickListener(v -> finish());
        LinearLayout.LayoutParams backParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(58));
        backParams.topMargin = dp(20);
        box.addView(back, backParams);

        setContentView(frame);
    }

    static int getBreadTotal(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt(KEY_BREADS, 0);
    }

    static String stateJson(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            JSONObject out = new JSONObject();
            out.put("breadTotal", prefs.getInt(KEY_BREADS, 0));
            out.put("rewardedToday", todayKey().equals(prefs.getString(KEY_REWARD_DAY, "")));
            out.put("lastScore", prefs.getInt(KEY_LAST_SCORE, -1));
            return out.toString();
        } catch (Exception ignored) {
            return "{\"breadTotal\":0,\"rewardedToday\":false,\"lastScore\":-1}";
        }
    }

    private static String todayKey() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    private TextView text(String value, float size, int color, int style) {
        TextView v = new TextView(this);
        v.setText(value);
        v.setTextSize(size);
        v.setTextColor(color);
        v.setTypeface(Typeface.create("sans-serif", style));
        return v;
    }

    private GradientDrawable round(int fill, float radius, int stroke, int strokeWidthDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(radius);
        if (strokeWidthDp > 0) d.setStroke(dp(strokeWidthDp), stroke);
        return d;
    }

    private int dp(float value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private static final class Question {
        final String text;
        final String[] answers;
        final int correct;
        Question(String text, String[] answers, int correct) {
            this.text = text;
            this.answers = answers;
            this.correct = correct;
        }
    }
}
