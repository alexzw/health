import Link from "next/link";
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

export function MetricHistoryChart({
  items,
  color,
  label,
  unit,
  lang = "zh",
  timeframeLabel,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionHref
}) {
  if (!items.length) {
    return (
      <div className="soft-card rounded-[28px] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
        <div className="mt-4 rounded-[22px] border border-dashed border-slate-200 bg-white/70 px-5 py-6">
          <p className="text-sm font-medium text-slate-700">
            {emptyTitle || t(lang, "暫時未有足夠資料可繪製這張圖。", "No chart data yet.")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {emptyDescription ||
              t(
                lang,
                "先補上這類健康資料，之後就可以在這裡看到清晰趨勢。",
                "Add more records in this category to unlock a clear trend view here."
              )}
          </p>
          {emptyActionLabel && emptyActionHref ? (
            <Link href={emptyActionHref} className="button-secondary mt-4 px-4 py-2 text-sm font-semibold">
              {emptyActionLabel}
            </Link>
          ) : null}
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
    <div className="soft-card rounded-[28px] p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {formatValueWithUnit(latestItem.value, unit, { lang })}
          </h3>
          {timeframeLabel ? <p className="mt-2 text-sm text-slate-500">{timeframeLabel}</p> : null}
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
