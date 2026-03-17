import { t } from "../lib/i18n";

function Section({ title, children }) {
  return (
    <div className="metric-band rounded-[24px] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{children}</div>
    </div>
  );
}

export function SmartHealthCoach({ coach, lang = "zh" }) {
  if (!coach) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="section-kicker">
          {t(lang, "智能健康教練", "Smart Health Coach")}
        </p>
        <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-ink">
          {t(lang, "數據解讀與下一步", "What Your Data Means")}
        </h2>
      </div>

      <div className="soft-card rounded-[32px] p-7">
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <Section title={t(lang, "目前目標", "Current Goal")}>
              <p className="font-semibold text-ink">{coach.goal.title}</p>
              <p>{coach.goal.objective}</p>
            </Section>

            <Section title={t(lang, "今週重點", "Weekly Focus")}>
              <p>{coach.weeklyFocus}</p>
            </Section>

            <Section title={t(lang, "重點指標", "Key Metrics")}>
              {coach.metrics.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {coach.metrics.map((metric) => (
                    <div key={`${metric.label}-${metric.value}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
                      <p className="mt-1 font-semibold text-ink">
                        {metric.value}
                        {metric.unit ? ` ${metric.unit}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{t(lang, "目前還未有足夠指標可供解讀。", "There is not enough metric data to interpret yet.")}</p>
              )}
            </Section>
          </div>

          <div className="space-y-5">
            <Section title={t(lang, "數據解讀", "Interpretation")}>
              {coach.observations.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </Section>

            <Section title={t(lang, "下一步建議", "Next Best Actions")}>
              {coach.actions.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </Section>

            <Section title={t(lang, "需要留意", "Watch Outs")}>
              {coach.watchouts.length ? (
                coach.watchouts.map((item) => <p key={item}>• {item}</p>)
              ) : (
                <p>{t(lang, "目前未見需要特別升級處理的訊號。", "No stronger warning signal stands out right now.")}</p>
              )}
            </Section>

            {coach.ai?.summary ? (
              <Section title={t(lang, "AI 教練補充", "AI Coach Summary")}>
                <p className="font-semibold text-ink">{coach.ai.summary.overview}</p>
                <p>{coach.ai.summary.whyItMatters}</p>
                {coach.ai.summary.nextFocus?.map((item) => (
                  <p key={item}>• {item}</p>
                ))}
                <p className="text-xs text-slate-500">{coach.ai.summary.careNote}</p>
              </Section>
            ) : null}
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50/70 px-5 py-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">{t(lang, "使用提醒", "Safety Note")}</p>
          <p className="mt-1">{coach.disclaimer}</p>
          {!coach.ai?.enabled ? (
            <p className="mt-2 text-amber-900/80">
              {t(
                lang,
                "目前這一版先用規則化健康教練邏輯運作；如果之後加入 OPENAI_API_KEY，就可以再加上 AI 自然語言解讀。",
                "This version is currently powered by a structured coaching engine. Add OPENAI_API_KEY later to enable an extra AI-written summary."
              )}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
