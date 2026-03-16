function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("zh-HK", {
    month: "short",
    day: "numeric"
  });
}

function buildPoints(items, width, height, padding) {
  const values = items.map((item) => Number(item.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  return items
    .map((item, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(items.length - 1, 1);
      const y = height - padding - ((Number(item.value) - minValue) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export function MiniMetricChart({ items, color, label, unit, compact = false }) {
  if (!items?.length) {
    return (
      <div className="rounded-[24px] bg-white/80 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-3 text-sm text-slate-500">資料不足，暫時未能繪圖。</p>
      </div>
    );
  }

  const width = 320;
  const height = compact ? 100 : 120;
  const padding = 16;
  const latestItem = items[items.length - 1];
  const points = buildPoints(items, width, height, padding);

  return (
    <div className="rounded-[24px] bg-white/80 p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {latestItem.value} {unit}
          </p>
        </div>
        <p className="text-xs text-slate-500">{formatDate(latestItem.date)}</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className={`mt-4 w-full ${compact ? "h-24" : "h-28"}`}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{formatDate(items[0].date)}</span>
        <span>{items.length} 個點</span>
      </div>
    </div>
  );
}
