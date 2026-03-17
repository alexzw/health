import { getLocale, isEnglish } from "./i18n";

export function formatChineseDate(dateString, withTime = false, lang = "zh") {
  return new Date(dateString).toLocaleString(getLocale(lang), {
    year: "numeric",
    month: isEnglish(lang) ? "short" : "long",
    day: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit"
        }
      : {})
  });
}

export function formatCompactDate(dateString, withYear = false, lang = "zh") {
  return new Date(dateString).toLocaleDateString(getLocale(lang), {
    ...(withYear ? { year: "numeric" } : {}),
    month: "short",
    day: "numeric"
  });
}

export function formatCategoryLabel(category, lang = "zh") {
  const labels = {
    zh: {
      weight: "體重",
      height: "身高",
      waist: "腰圍",
      hip: "臀圍",
      chest: "胸圍",
      sleep: "睡眠",
      steps: "步數",
      heart_rate: "心率",
      resting_heart_rate: "靜止心率",
      active_energy_burned: "活動熱量"
    },
    en: {
      weight: "Weight",
      height: "Height",
      waist: "Waist",
      hip: "Hip",
      chest: "Chest",
      sleep: "Sleep",
      steps: "Steps",
      heart_rate: "Heart Rate",
      resting_heart_rate: "Resting Heart Rate",
      active_energy_burned: "Active Energy"
    }
  };

  return labels[isEnglish(lang) ? "en" : "zh"][category] || category.replaceAll("_", " ");
}

export function formatNumber(value, maximumFractionDigits = 1, lang = "zh") {
  return new Intl.NumberFormat(getLocale(lang), {
    maximumFractionDigits
  }).format(Number(value));
}

export function formatUnitLabel(unit, lang = "zh") {
  const labels = {
    zh: {
      count: "步",
      steps: "步",
      hours: "小時",
      kg: "kg",
      cm: "cm",
      in: "in",
      bpm: "次/分鐘",
      "count/min": "次/分鐘",
      kcal: "kcal"
    },
    en: {
      count: "steps",
      steps: "steps",
      hours: "hours",
      kg: "kg",
      cm: "cm",
      in: "in",
      bpm: "bpm",
      "count/min": "bpm",
      kcal: "kcal"
    }
  };

  return labels[isEnglish(lang) ? "en" : "zh"][unit] || unit || "";
}

export function formatValueWithUnit(value, unit, options = {}) {
  if (value === null || value === undefined || value === "") {
    return options.emptyLabel || "未有資料";
  }

  const lang = options.lang || "zh";
  const number = Number(value);
  const fractionDigits =
    options.maximumFractionDigits ??
    (Number.isInteger(number) || unit === "count" || unit === "steps" || unit === "bpm" || unit === "count/min"
      ? 0
      : 1);
  const formattedNumber = formatNumber(number, fractionDigits, lang);
  const formattedUnit = formatUnitLabel(unit, lang);

  return `${formattedNumber}${formattedUnit ? ` ${formattedUnit}` : ""}`;
}

export function formatMetric(metric, options = {}) {
  if (!metric || metric.value === null || metric.value === undefined) {
    return options.emptyLabel || "未有資料";
  }

  return formatValueWithUnit(metric.value, metric.unit, options);
}
