export function formatChineseDate(dateString, withTime = false) {
  return new Date(dateString).toLocaleString("zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit"
        }
      : {})
  });
}

export function formatCompactDate(dateString, withYear = false) {
  return new Date(dateString).toLocaleDateString("zh-HK", {
    ...(withYear ? { year: "numeric" } : {}),
    month: "short",
    day: "numeric"
  });
}

export function formatCategoryLabel(category) {
  const labels = {
    weight: "體重",
    height: "身高",
    sleep: "睡眠",
    steps: "步數",
    heart_rate: "心率",
    resting_heart_rate: "靜止心率",
    active_energy_burned: "活動熱量"
  };

  return labels[category] || category.replaceAll("_", " ");
}

export function formatNumber(value, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("zh-HK", {
    maximumFractionDigits
  }).format(Number(value));
}

export function formatUnitLabel(unit) {
  const labels = {
    count: "步",
    steps: "步",
    hours: "小時",
    kg: "kg",
    cm: "cm",
    bpm: "次/分鐘",
    "count/min": "次/分鐘",
    kcal: "kcal"
  };

  return labels[unit] || unit || "";
}

export function formatValueWithUnit(value, unit, options = {}) {
  if (value === null || value === undefined || value === "") {
    return options.emptyLabel || "未有資料";
  }

  const number = Number(value);
  const fractionDigits =
    options.maximumFractionDigits ??
    (Number.isInteger(number) || unit === "count" || unit === "steps" ? 0 : 1);
  const formattedNumber = formatNumber(number, fractionDigits);
  const formattedUnit = formatUnitLabel(unit);

  return `${formattedNumber}${formattedUnit ? ` ${formattedUnit}` : ""}`;
}

export function formatMetric(metric, options = {}) {
  if (!metric || metric.value === null || metric.value === undefined) {
    return options.emptyLabel || "未有資料";
  }

  return formatValueWithUnit(metric.value, metric.unit, options);
}
