function average(items) {
  if (!items.length) {
    return null;
  }

  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  return Math.round((total / items.length) * 10) / 10;
}

function sum(items) {
  if (!items.length) {
    return null;
  }

  const total = items.reduce((sumValue, item) => sumValue + Number(item.value || 0), 0);
  return Math.round(total * 10) / 10;
}

function getLastNDays(items, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return (items || []).filter((item) => new Date(item.date).getTime() >= cutoff);
}

function roundDelta(value) {
  return Math.round(value * 10) / 10;
}

function buildTrendSummary(items, reducer, label, unit) {
  const last7 = getLastNDays(items, 7);
  const last30 = getLastNDays(items, 30);

  const value7 = reducer(last7);
  const value30 = reducer(last30);

  return {
    label,
    unit,
    last7Value: value7,
    last30Value: value30,
    delta: value7 !== null && value30 !== null ? roundDelta(value7 - value30) : null
  };
}

function addInsight(insights, condition, title, description, severity = "info") {
  if (!condition) {
    return;
  }

  insights.push({ title, description, severity });
}

export function buildHealthDashboardSummary(member) {
  const metricTrends = member.metricTrends || {};
  const weightTrend = buildTrendSummary(metricTrends.weight || [], average, "體重", "kg");
  const stepsTrend = buildTrendSummary(metricTrends.steps || [], average, "平均步數", "steps");
  const sleepTrend = buildTrendSummary(metricTrends.sleep || [], average, "平均睡眠", "hours");
  const restingHeartRateTrend = buildTrendSummary(
    metricTrends.resting_heart_rate || [],
    average,
    "靜止心率",
    "bpm"
  );
  const heartRateTrend = buildTrendSummary(metricTrends.heart_rate || [], average, "心率", "bpm");
  const workoutCount7 = (member.exerciseLogs || []).filter(
    (entry) => new Date(entry.performedAt).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  const insights = [];

  addInsight(
    insights,
    sleepTrend.last7Value !== null && sleepTrend.last7Value < 6.5,
    "最近睡眠偏低",
    `最近 7 天平均睡眠約 ${sleepTrend.last7Value} 小時，建議留意休息與恢復。`,
    "warning"
  );

  addInsight(
    insights,
    restingHeartRateTrend.delta !== null && restingHeartRateTrend.delta >= 5,
    "靜止心率上升",
    `最近 7 天靜止心率比 30 天基準高 ${restingHeartRateTrend.delta} bpm，可能代表疲勞或壓力增加。`,
    "warning"
  );

  addInsight(
    insights,
    stepsTrend.delta !== null && stepsTrend.delta <= -2000,
    "活動量下降",
    `最近 7 天平均步數比 30 天基準少 ${Math.abs(stepsTrend.delta)}，活動量明顯下降。`,
    "warning"
  );

  addInsight(
    insights,
    workoutCount7 >= 3,
    "本週運動節奏不錯",
    `最近 7 天已有 ${workoutCount7} 次運動紀錄，節奏維持得不錯。`,
    "positive"
  );

  addInsight(
    insights,
    insights.length === 0,
    "狀態整體平穩",
    "目前沒有明顯異常變化，建議持續追蹤體重、睡眠和心率趨勢。",
    "info"
  );

  return {
    cards: {
      latestWeight: member.latestMetrics?.weight || null,
      latestSteps: metricTrends.steps?.[metricTrends.steps.length - 1]
        ? {
            value: metricTrends.steps[metricTrends.steps.length - 1].value,
            unit: metricTrends.steps[metricTrends.steps.length - 1].unit,
            recordedAt: metricTrends.steps[metricTrends.steps.length - 1].date
          }
        : null,
      latestSleep: metricTrends.sleep?.[metricTrends.sleep.length - 1]
        ? {
            value: metricTrends.sleep[metricTrends.sleep.length - 1].value,
            unit: metricTrends.sleep[metricTrends.sleep.length - 1].unit,
            recordedAt: metricTrends.sleep[metricTrends.sleep.length - 1].date
          }
        : null,
      latestRestingHeartRate: metricTrends.resting_heart_rate?.[metricTrends.resting_heart_rate.length - 1]
        ? {
            value: metricTrends.resting_heart_rate[metricTrends.resting_heart_rate.length - 1].value,
            unit: metricTrends.resting_heart_rate[metricTrends.resting_heart_rate.length - 1].unit,
            recordedAt: metricTrends.resting_heart_rate[metricTrends.resting_heart_rate.length - 1].date
          }
        : member.latestMetrics?.resting_heart_rate || null,
      latestHeartRate: metricTrends.heart_rate?.[metricTrends.heart_rate.length - 1]
        ? {
            value: metricTrends.heart_rate[metricTrends.heart_rate.length - 1].value,
            unit: metricTrends.heart_rate[metricTrends.heart_rate.length - 1].unit,
            recordedAt: metricTrends.heart_rate[metricTrends.heart_rate.length - 1].date
          }
        : member.latestMetrics?.heart_rate || null,
      bmi: member.latestBmi || null
    },
    trends: {
      weight: weightTrend,
      steps: stepsTrend,
      sleep: sleepTrend,
      restingHeartRate: restingHeartRateTrend,
      heartRate: heartRateTrend
    },
    insights
  };
}
