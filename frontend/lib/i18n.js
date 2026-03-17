export const LANGUAGE_COOKIE = "family-health-lang";

export function normalizeLanguage(value) {
  return value === "en" ? "en" : "zh";
}

export function isEnglish(value) {
  return normalizeLanguage(value) === "en";
}

export function t(lang, zhText, enText) {
  return isEnglish(lang) ? enText : zhText;
}

export function getLocale(lang) {
  return isEnglish(lang) ? "en-US" : "zh-HK";
}

const dynamicTranslations = {
  "成長趨勢穩定": "Stable growth trend",
  "Ryan 的身高和體重在現有紀錄中持續穩定上升，目前看起來屬於平穩趨勢。":
    "Ryan's height and weight are increasing steadily in the current records, which suggests a stable growth trend.",
  "活動量下降": "Activity is down",
  "最近 7 天平均步數比 30 天基準少 2802.3，活動量明顯下降。":
    "Average steps over the last 7 days are 2,802.3 below the 30-day baseline, showing a clear drop in activity."
};

export function translateDynamicText(lang, text) {
  if (!isEnglish(lang)) {
    return text;
  }

  return dynamicTranslations[text] || text;
}
