import { formatMetric, formatValueWithUnit } from "./format";

function recentItems(items, getDate, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return (items || []).filter((item) => new Date(getDate(item)).getTime() >= cutoff);
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function average(items, getValue) {
  if (!items.length) {
    return 0;
  }

  return round(items.reduce((sum, item) => sum + Number(getValue(item) || 0), 0) / items.length);
}

function latestByCategory(records, category) {
  return [...(records || [])]
    .filter((record) => record.category === category)
    .sort((left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime())[0];
}

export function buildFamilyHealthScore({ alex, amelie, growth }) {
  let score = 50;

  const alexSteps = Number(alex?.dashboard?.cards?.latestSteps?.value || 0);
  const amelieSteps = Number(amelie?.dashboard?.cards?.latestSteps?.value || 0);
  const alexWorkouts = recentItems(alex?.exerciseLogs || [], (entry) => entry.performedAt, 7).length;
  const amelieWorkouts = recentItems(amelie?.exerciseLogs || [], (entry) => entry.performedAt, 7).length;

  score += Math.min(15, Math.round(alexSteps / 1500));
  score += Math.min(15, Math.round(amelieSteps / 1500));
  score += Math.min(10, alexWorkouts * 3);
  score += Math.min(10, amelieWorkouts * 3);
  score += growth?.summary?.status === "on_track" ? 10 : 3;

  return Math.max(0, Math.min(100, score));
}

export function buildHealthScoreBreakdown({ alex, amelie, growth }, lang = "zh") {
  const alexSteps = Number(alex?.dashboard?.cards?.latestSteps?.value || 0);
  const amelieSteps = Number(amelie?.dashboard?.cards?.latestSteps?.value || 0);
  const alexWorkouts = recentItems(alex?.exerciseLogs || [], (entry) => entry.performedAt, 7).length;
  const amelieWorkouts = recentItems(amelie?.exerciseLogs || [], (entry) => entry.performedAt, 7).length;

  return [
    {
      label: lang === "en" ? "Alex activity" : "Alex 活動",
      score: Math.min(25, Math.round(alexSteps / 1500) + Math.min(10, alexWorkouts * 3)),
      detail:
        lang === "en"
          ? `${formatValueWithUnit(alexSteps, "steps", { lang })} and ${alexWorkouts} workouts this week`
          : `${formatValueWithUnit(alexSteps, "steps", { lang })}，本週 ${alexWorkouts} 次運動`
    },
    {
      label: lang === "en" ? "Amelie activity" : "Amelie 活動",
      score: Math.min(25, Math.round(amelieSteps / 1500) + Math.min(10, amelieWorkouts * 3)),
      detail:
        lang === "en"
          ? `${formatValueWithUnit(amelieSteps, "steps", { lang })} and ${amelieWorkouts} workouts this week`
          : `${formatValueWithUnit(amelieSteps, "steps", { lang })}，本週 ${amelieWorkouts} 次運動`
    },
    {
      label: lang === "en" ? "Ryan growth" : "Ryan 成長",
      score: growth?.summary?.status === "on_track" ? 25 : 12,
      detail:
        growth?.summary?.status === "on_track"
          ? lang === "en"
            ? "Growth velocity is within the stable range"
            : "成長速度屬穩定範圍"
          : lang === "en"
            ? "Growth trend needs closer follow-up"
            : "成長趨勢建議再密切跟進"
    },
    {
      label: lang === "en" ? "Consistency" : "記錄一致性",
      score: 25,
      detail:
        lang === "en"
          ? "Recent sync and manual logging are both active"
          : "最近有同步亦有手動記錄"
    }
  ];
}

export function buildMilestones({ alex, amelie, growth }, lang = "zh") {
  const milestones = [];

  if (growth?.summary?.latestMeasurement?.heightCm >= 120) {
    milestones.push({
      title: lang === "en" ? "Ryan reached 120 cm" : "Ryan 達到 120 cm",
      detail: lang === "en" ? "A new growth milestone worth celebrating." : "這是一個值得記錄的成長里程碑。"
    });
  }

  const alexWeightLoss = Number(alex?.dashboard?.trends?.weight?.delta || 0);
  if (alexWeightLoss <= -5) {
    milestones.push({
      title: lang === "en" ? "Alex lost 5 kg" : "Alex 減去 5 kg",
      detail: lang === "en" ? "A major weight milestone has been reached." : "這是一個重要的減重里程碑。"
    });
  }

  const amelieWorkouts = recentItems(amelie?.exerciseLogs || [], (entry) => entry.performedAt, 30).length;
  if (amelieWorkouts >= 5) {
    milestones.push({
      title: lang === "en" ? "Amelie completed 5 workouts" : "Amelie 完成 5 次運動",
      detail: lang === "en" ? "Workout consistency is building momentum." : "穩定運動的節奏已開始建立。"
    });
  }

  return milestones.slice(0, 4);
}

export function buildReminders({ alex, amelie, growth }, lang = "zh") {
  const reminders = [];

  const alexWorkoutGap = recentItems(alex?.exerciseLogs || [], (entry) => entry.performedAt, 3).length;
  if (!alexWorkoutGap) {
    reminders.push({
      title: lang === "en" ? "Alex has not exercised for 3 days" : "Alex 已 3 天沒有運動",
      detail: lang === "en" ? "A short workout can help maintain momentum." : "補一節短運動可以幫助維持節奏。"
    });
  }

  const amelieWorkoutGap = recentItems(amelie?.exerciseLogs || [], (entry) => entry.performedAt, 3).length;
  if (!amelieWorkoutGap) {
    reminders.push({
      title: lang === "en" ? "Amelie has not exercised for 3 days" : "Amelie 已 3 天沒有運動",
      detail: lang === "en" ? "A light session is enough to restart consistency." : "一節輕量運動已足夠重新啟動節奏。"
    });
  }

  const recentGrowth = recentItems(growth?.measurements || [], (entry) => entry.measuredAt, 7).length;
  if (!recentGrowth) {
    reminders.push({
      title: lang === "en" ? "Ryan has no new growth record this week" : "Ryan 本週沒有新的成長記錄",
      detail: lang === "en" ? "A fresh height and weight check will improve the growth view." : "補一筆身高體重資料會令成長分析更準確。"
    });
  }

  return reminders.slice(0, 4);
}

export function buildWeeklyAiSummary({ alex, amelie, growth }, lang = "zh") {
  const alexWeight = recentItems(
    (alex?.healthDataRecords || []).filter((record) => record.category === "weight"),
    (record) => record.recordedAt,
    7
  );
  const amelieWorkouts = recentItems(amelie?.exerciseLogs || [], (entry) => entry.performedAt, 7).length;

  let alexText =
    lang === "en"
      ? "Alex's data is still building."
      : "Alex 的週報資料仍在累積中。";

  if (alexWeight.length >= 2) {
    const delta = round(Number(alexWeight[alexWeight.length - 1].value) - Number(alexWeight[0].value));
    alexText =
      delta < 0
        ? lang === "en"
          ? `Alex reduced weight by ${Math.abs(delta)} kg this week.`
          : `Alex 本週體重下降了 ${Math.abs(delta)} kg。`
        : lang === "en"
          ? `Alex's weight changed by +${delta} kg this week.`
          : `Alex 本週體重變化為 +${delta} kg。`;
  }

  const amelieText =
    amelieWorkouts >= 3
      ? lang === "en"
        ? `Amelie completed ${amelieWorkouts} workouts this week and kept momentum.`
        : `Amelie 本週完成了 ${amelieWorkouts} 次運動，節奏保持得不錯。`
      : lang === "en"
        ? `Amelie logged ${amelieWorkouts} workouts this week and may need one more active push.`
        : `Amelie 本週記錄了 ${amelieWorkouts} 次運動，仍可再加一點活動量。`;

  const ryanText =
    growth?.summary?.heightVelocityCmPerMonth !== null && growth?.summary?.heightVelocityCmPerMonth !== undefined
      ? lang === "en"
        ? `Ryan's growth velocity is ${growth.summary.heightVelocityCmPerMonth} cm per month and ${growth.summary.status === "on_track" ? "looks stable" : "should be watched more closely"}.`
        : `Ryan 目前成長速度為每月 ${growth.summary.heightVelocityCmPerMonth} cm，${growth.summary.status === "on_track" ? "整體穩定" : "建議再密切觀察"}。`
      : lang === "en"
        ? "Ryan needs a few more measurements for a stronger growth interpretation."
        : "Ryan 還需要多幾筆量度，才可以作更清晰的成長解讀。";

  return {
    headline:
      lang === "en"
        ? "This week the family is building momentum, with Ryan's growth staying central and adult consistency shaping overall progress."
        : "本週家庭整體仍在建立節奏，Ryan 的成長是核心，而大人的一致性會直接影響整體健康進度。",
    recommendations: [
      lang === "en" ? "Keep Ryan's measurements regular." : "保持 Ryan 的量度節奏穩定。",
      lang === "en" ? "Protect workout consistency for both adults." : "兩位大人都要維持運動一致性。",
      lang === "en" ? "Use the reminders as action prompts, not pressure." : "把提醒當成行動提示，而唔係壓力。"
    ],
    memberSummaries: [
      { member: "Ryan", text: ryanText },
      { member: "Alex", text: alexText },
      { member: "Amelie", text: amelieText }
    ]
  };
}

export function buildTodaySummary({ alex, amelie, growth }, lang = "zh") {
  const alexSteps = alex?.dashboard?.cards?.latestSteps;
  const alexCalories = latestByCategory(alex?.healthDataRecords || [], "active_energy_burned");
  const amelieSteps = amelie?.dashboard?.cards?.latestSteps;
  const amelieWorkouts = recentItems(amelie?.exerciseLogs || [], (entry) => entry.performedAt, 1).length;

  return {
    ryan:
      growth?.summary?.status === "on_track"
        ? lang === "en"
          ? "Ryan growth is on track"
          : "Ryan 成長進度穩定"
        : lang === "en"
          ? "Ryan needs another growth check soon"
          : "Ryan 建議盡快再量度一次身高體重",
    alex: alexCalories
      ? lang === "en"
        ? `Alex burned ${formatValueWithUnit(alexCalories.value, alexCalories.unit || "kcal", { lang })} today`
        : `Alex 今日消耗 ${formatValueWithUnit(alexCalories.value, alexCalories.unit || "kcal", { lang })}`
      : alexSteps
        ? lang === "en"
          ? `Alex has ${formatMetric(alexSteps, { lang })} today`
          : `Alex 今日有 ${formatMetric(alexSteps, { lang })}`
        : lang === "en"
          ? "Alex has not synced activity yet"
          : "Alex 今日活動未同步",
    amelie: amelieWorkouts
      ? lang === "en"
        ? "Amelie has already logged a workout today"
        : "Amelie 今日已經記錄了運動"
      : amelieSteps
        ? lang === "en"
          ? `Amelie has ${formatMetric(amelieSteps, { lang })} today`
          : `Amelie 今日有 ${formatMetric(amelieSteps, { lang })}`
        : lang === "en"
          ? "Amelie has not exercised yet"
          : "Amelie 今日仍未開始運動"
  };
}

export function buildProactiveInsights({ alex, amelie, growth }, lang = "zh") {
  const insights = [];

  if (growth?.summary?.totalHeightGainCm !== null && growth?.summary?.totalHeightGainCm !== undefined) {
    insights.push({
      title: lang === "en" ? "Ryan growth update" : "Ryan 成長更新",
      detail:
        lang === "en"
          ? `Ryan grew +${growth.summary.totalHeightGainCm} cm in the recorded period and is ${growth.summary.status === "on_track" ? "currently on track" : "worth watching more closely"}.`
          : `Ryan 在目前記錄期內長高 +${growth.summary.totalHeightGainCm} cm，現時${growth.summary.status === "on_track" ? "屬於穩定範圍" : "建議再密切留意" }。`
    });
  }

  const alexWeightSeries = recentItems(
    (alex?.healthDataRecords || []).filter((record) => record.category === "weight"),
    (record) => record.recordedAt,
    7
  );
  if (alexWeightSeries.length >= 2) {
    const delta = round(Number(alexWeightSeries[alexWeightSeries.length - 1].value) - Number(alexWeightSeries[0].value));
    insights.push({
      title: lang === "en" ? "Alex weight trend" : "Alex 體重趨勢",
      detail:
        delta < -1.2
          ? lang === "en"
            ? `Alex's weight is dropping quickly this week (${Math.abs(delta)} kg). Check recovery and energy levels.`
            : `Alex 本週體重下降較快（${Math.abs(delta)} kg），建議同時留意恢復與精神狀態。`
          : delta > 0.8
            ? lang === "en"
              ? `Alex's weight is slightly up this week (+${delta} kg). Review meals and activity consistency.`
              : `Alex 本週體重輕微上升（+${delta} kg），可留意飲食與活動是否穩定。`
            : lang === "en"
              ? "Alex's weight is moving steadily this week."
              : "Alex 本週體重變化整體平穩。"
    });
  }

  const amelieSteps = average(
    recentItems(
      (amelie?.healthDataRecords || []).filter((record) => record.category === "steps"),
      (record) => record.recordedAt,
      7
    ),
    (record) => record.value
  );

  insights.push({
    title: lang === "en" ? "Amelie activity level" : "Amelie 活動水平",
    detail:
      amelieSteps < 5000
        ? lang === "en"
          ? "Amelie's average activity is low this week. A few lighter active days could quickly help."
          : "Amelie 本週平均活動量偏低，補幾天較輕鬆的活動已經會有幫助。"
        : lang === "en"
          ? "Amelie has kept a healthy level of daily movement this week."
          : "Amelie 本週保持了不錯的日常活動水平。"
  });

  return insights.slice(0, 4);
}
