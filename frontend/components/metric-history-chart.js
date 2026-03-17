import { formatCompactDate, formatValueWithUnit } from "../lib/format";
import { t } from "../lib/i18n";

function sampleXAxisLabels(items) {
  if (items.length <= 3) {
    return items;
  }

  const middleIndex = Math.floor((items.length - 1) / 2);
  return [items[0], items[middleIndex], items[items.length - 1]];
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

export function MetricHistoryChart({ items, color, label, unit, lang = "zh" }) {
  if (!items.length) {
    return (
      <div className="glass-panel rounded-[28px] p-6 shadow-glass">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
        <div className="mt-4 rounded-[22px] border border-dashed border-slate-200 bg-white/70 px-5 py-6">
          <p className="text-sm font-medium text-slate-700">
            {t(lang, "這張圖會用來看最近一段時間的變化。", "This chart shows how the metric changes over time.")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {t(lang, "目前這一類資料還不夠，所以先不畫圖；之後累積多幾日紀錄後會自動出現。", "There is not enough data in this category yet, so the chart will appear automatically after more records are added.")}
          </p>
        </div>
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
            {formatValueWithUnit(latestItem.value, unit, { lang })}
          </h3>
        </div>
        <p className="text-sm text-slate-500">{formatCompactDate(latestItem.date, true, lang)}</p>
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
        {sampleXAxisLabels(items).map((item) => (
          <span key={`${item.date}-${item.value}`} className="rounded-full bg-white/70 px-3 py-1">
            {formatCompactDate(item.date, true, lang)}
          </span>
        ))}
      </div>
    </div>
  );
}
