function insightStyles(level) {
  if (level === "warning") {
    return "border-amber-200 bg-amber-50/80 text-amber-900";
  }

  if (level === "good") {
    return "border-emerald-200 bg-emerald-50/80 text-emerald-900";
  }

  return "border-slate-200 bg-white/80 text-slate-700";
}

export function GrowthInsights({ growth }) {
  if (!growth.summary) {
    return null;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="glass-panel rounded-[28px] p-6 shadow-glass">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Growth Summary</p>
        <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
          Ryan 累計長高了 {growth.summary.totalHeightGainCm} cm
        </h3>
        <p className="mt-3 text-sm text-slate-500">
          從第一筆紀錄到現在，體重累計增加了 {growth.summary.totalWeightGainKg} kg。
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latest Height</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
              {growth.summary.latestMeasurement.heightCm} cm
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latest Weight</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
              {growth.summary.latestMeasurement.weightKg} kg
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
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{insight.title}</h3>
            <p className="mt-2 text-sm opacity-90">{insight.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
