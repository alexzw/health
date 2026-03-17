import { t } from "./i18n";

export const TIME_RANGE_OPTIONS = [
  { value: "7d", days: 7 },
  { value: "30d", days: 30 },
  { value: "90d", days: 90 },
  { value: "all", days: null }
];

export function normalizeTimeRange(value) {
  return TIME_RANGE_OPTIONS.some((option) => option.value === value) ? value : "30d";
}

export function getTimeRangeDays(range) {
  return TIME_RANGE_OPTIONS.find((option) => option.value === range)?.days ?? 30;
}

export function getTimeRangeLabel(range, lang = "zh") {
  switch (normalizeTimeRange(range)) {
    case "7d":
      return t(lang, "最近 7 天", "Last 7 days");
    case "90d":
      return t(lang, "最近 3 個月", "Last 3 months");
    case "all":
      return t(lang, "全部時間", "All time");
    default:
      return t(lang, "最近 30 天", "Last 30 days");
  }
}

export function filterItemsByRange(items, range, getDate) {
  const normalizedRange = normalizeTimeRange(range);
  const days = getTimeRangeDays(normalizedRange);

  if (!days) {
    return items;
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const value = getDate(item);
    return new Date(value).getTime() >= cutoff;
  });
}

function formatDateKey(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

export function buildMetricSeriesFromRecords(records, category, range, aggregation = "latest") {
  const filtered = filterItemsByRange(
    (records || []).filter((record) => record.category === category),
    range,
    (record) => record.recordedAt
  );

  const grouped = new Map();

  for (const record of filtered) {
    const key = formatDateKey(record.recordedAt);
    const current = grouped.get(key) || [];
    current.push(record);
    grouped.set(key, current);
  }

  return [...grouped.entries()]
    .sort((left, right) => new Date(left[0]).getTime() - new Date(right[0]).getTime())
    .map(([date, dayRecords]) => {
      const sortedRecords = [...dayRecords].sort(
        (left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime()
      );
      const unit = sortedRecords[sortedRecords.length - 1]?.unit || "";

      if (aggregation === "sum") {
        const total = sortedRecords.reduce((sum, item) => sum + Number(item.value || 0), 0);
        return { date, value: Math.round(total * 10) / 10, unit };
      }

      if (aggregation === "average") {
        const total = sortedRecords.reduce((sum, item) => sum + Number(item.value || 0), 0);
        return {
          date,
          value: Math.round((total / sortedRecords.length) * 10) / 10,
          unit
        };
      }

      const latest = sortedRecords[sortedRecords.length - 1];
      return {
        date,
        value: latest?.value ?? null,
        unit
      };
    });
}
