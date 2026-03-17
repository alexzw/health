import { t, translateDynamicText } from "../lib/i18n";

function insightStyles(level) {
  if (level === "warning") {
    return "border-amber-200 bg-amber-50/80 text-amber-900";
  }

  if (level === "good") {
    return "border-emerald-200 bg-emerald-50/80 text-emerald-900";
  }

  return "border-slate-200 bg-white/80 text-slate-700";
}

export function GrowthInsights({ growth, lang = "zh" }) {
  if (!growth.summary) {
    return null;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="soft-card rounded-[28px] p-6">
        <p className="section-kicker">{t(lang, "成長摘要", "Growth Summary")}</p>
        <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
          {t(
            lang,
            `Ryan 對比第一筆記錄已長高 ${growth.summary.totalHeightGainCm} cm`,
            `Ryan is +${growth.summary.totalHeightGainCm} cm since the first record`
          )}
        </h3>
        <p className="mt-3 text-sm text-slate-500">
          {t(
            lang,
            `從第一筆紀錄到現在，體重累計增加了 ${growth.summary.totalWeightGainKg} kg。`,
            `Since the first record, weight has increased by ${growth.summary.totalWeightGainKg} kg.`
          )}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {translateDynamicText(lang, growth.summary.summaryText)}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="metric-band rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t(lang, "最新身高", "Latest Height")}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
              {growth.summary.latestMeasurement.heightCm} cm
            </p>
          </div>
          <div className="metric-band rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t(lang, "最新體重", "Latest Weight")}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
              {growth.summary.latestMeasurement.weightKg} kg
            </p>
          </div>
          <div className="metric-band rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t(lang, "成長速度", "Growth Velocity")}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
              {growth.summary.heightVelocityCmPerMonth !== null && growth.summary.heightVelocityCmPerMonth !== undefined
                ? `${growth.summary.heightVelocityCmPerMonth} cm/mo`
                : "—"}
            </p>
          </div>
          <div className="metric-band rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t(lang, "6 個月預測", "6-Month Estimate")}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
              {growth.summary.predictedHeightInSixMonthsCm !== null && growth.summary.predictedHeightInSixMonthsCm !== undefined
                ? `${growth.summary.predictedHeightInSixMonthsCm} cm`
                : "—"}
            </p>
          </div>
          <div className="metric-band rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t(lang, "目前狀態", "Current Status")}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
              {growth.summary.status === "on_track"
                ? t(lang, "穩定範圍", "Within normal range")
                : t(lang, "建議留意", "Needs attention")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {growth.insights.map((insight) => (
          <div
            key={insight.title}
            className={`rounded-[24px] border p-5 ${insightStyles(insight.level)}`}
          >
            <p className="text-xs uppercase tracking-[0.22em] opacity-70">{insight.level}</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
              {translateDynamicText(lang, insight.title)}
            </h3>
            <p className="mt-2 text-sm opacity-90">{translateDynamicText(lang, insight.detail)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
