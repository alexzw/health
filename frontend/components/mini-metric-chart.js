import { formatCompactDate, formatValueWithUnit } from "../lib/format";
import { t } from "../lib/i18n";

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

export function MiniMetricChart({ items, color, label, unit, compact = false, lang = "zh" }) {
  if (!items?.length) {
    return (
      <div className="rounded-[24px] bg-white/80 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5">
          <p className="text-sm font-medium text-slate-600">{t(lang, "暫時未有足夠資料", "Not enough data yet")}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {t(lang, `之後匯入更多 ${label} 紀錄，這裡就會自動顯示最近趨勢。`, `Import more ${label} records and the latest trend will appear here automatically.`)}
          </p>
        </div>
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
          <p className="mt-2 text-2xl font-semibold text-ink">{formatValueWithUnit(latestItem.value, unit, { lang })}</p>
        </div>
        <p className="text-xs text-slate-500">{formatCompactDate(latestItem.date, false, lang)}</p>
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
        <span>{formatCompactDate(items[0].date, false, lang)}</span>
        <span>{items.length} {t(lang, "日資料", "days")}</span>
      </div>
    </div>
  );
}
