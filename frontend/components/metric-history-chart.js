function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("zh-HK", {
    year: "numeric",
    month: "short"
  });
}

function buildPoints(items, width, height, padding) {
  const values = items.map((item) => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  return items
    .map((item, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(items.length - 1, 1);
      const y = height - padding - ((item.value - minValue) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export function MetricHistoryChart({ items, color, label, unit }) {
  if (!items.length) {
    return (
      <div className="glass-panel rounded-[28px] p-6 shadow-glass">
        <p className="text-sm text-slate-500">暫時沒有足夠的歷史資料可繪製圖表。</p>
      </div>
    );
  }

  const width = 560;
  const height = 220;
  const padding = 28;
  const latestItem = items[items.length - 1];
  const points = buildPoints(items, width, height, padding);

  return (
    <div className="glass-panel rounded-[28px] p-6 shadow-glass">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {latestItem.value} {unit}
          </h3>
        </div>
        <p className="text-sm text-slate-500">{formatDate(latestItem.date)}</p>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="mt-6 h-52 w-full">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {items.map((item) => (
          <span key={`${item.date}-${item.value}`} className="rounded-full bg-white/70 px-3 py-1">
            {formatDate(item.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

