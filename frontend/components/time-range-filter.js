import Link from "next/link";
import { t } from "../lib/i18n";
import { TIME_RANGE_OPTIONS, getTimeRangeLabel } from "../lib/time-range";

export function TimeRangeFilter({ currentRange = "30d", basePath = "/", lang = "zh" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIME_RANGE_OPTIONS.map((option) => {
        const isActive = option.value === currentRange;
        return (
          <Link
            key={option.value}
            href={`${basePath}?range=${option.value}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive ? "bg-blue text-white" : "bg-white/80 text-slate-600 shadow-sm"
            }`}
          >
            {getTimeRangeLabel(option.value, lang)}
          </Link>
        );
      })}
    </div>
  );
}

export function TimeRangeCaption({ range, lang = "zh" }) {
  return (
    <p className="text-sm text-slate-500">
      {t(lang, "時間範圍：", "Timeframe: ")}
      {getTimeRangeLabel(range, lang)}
    </p>
  );
}
