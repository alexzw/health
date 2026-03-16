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

