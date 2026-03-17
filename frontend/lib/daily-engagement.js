import { formatMetric, formatValueWithUnit } from "./format";
import { t } from "./i18n";

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

function startOfDay(dateValue) {
  const date = new Date(dateValue);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(dateValue) {
  return startOfDay(dateValue).toISOString().slice(0, 10);
}

function daysBetween(left, right) {
  return Math.round((startOfDay(left).getTime() - startOfDay(right).getTime()) / (1000 * 60 * 60 * 24));
}

function getConsecutiveDayCount(dateValues = []) {
  if (!dateValues.length) {
    return 0;
  }

  const sortedDays = [...new Set(dateValues.map(dateKey))]
    .map((value) => new Date(value))
    .sort((left, right) => right.getTime() - left.getTime());

  let streak = 1;
  for (let index = 1; index < sortedDays.length; index += 1) {
    const diff = daysBetween(sortedDays[index - 1], sortedDays[index]);
    if (diff === 1) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

function getConsecutiveWeekCount(dateValues = []) {
  if (!dateValues.length) {
    return 0;
  }

  const weekKeys = [...new Set(
    dateValues.map((dateValue) => {
      const date = new Date(dateValue);
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      return start.toISOString().slice(0, 10);
    })
  )]
    .map((value) => new Date(value))
    .sort((left, right) => right.getTime() - left.getTime());

  let streak = 1;
  for (let index = 1; index < weekKeys.length; index += 1) {
    const diff = Math.round((weekKeys[index - 1].getTime() - weekKeys[index].getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 7) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
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

function buildMemberScore(value, workoutCount, maxStepScore, maxWorkoutScore) {
  const stepScore = Math.min(maxStepScore, Math.round(value / 1500));
  const workoutScore = Math.min(maxWorkoutScore, workoutCount * 3);
  return Math.max(0, Math.min(100, 45 + stepScore * 2 + workoutScore * 2));
}

export function buildMemberScoreBreakdown({ member, growth, lang = "zh" }) {
  if (!member && !growth) {
    return [];
  }

  if (member?.id === "alex" || member?.id === "amelie") {
    const steps = Number(member?.dashboard?.cards?.latestSteps?.value || 0);
    const workouts = recentItems(member?.exerciseLogs || [], (entry) => entry.performedAt, 7).length;
    const weightTrend = Number(member?.dashboard?.trends?.weight?.delta || 0);

    return [
      {
        label: lang === "en" ? "Activity" : "活動",
        score: Math.min(35, Math.round(steps / 1600) * 4),
        detail:
          lang === "en"
            ? `${formatValueWithUnit(steps, "steps", { lang })} in the latest sync`
            : `最近同步 ${formatValueWithUnit(steps, "steps", { lang })}`
      },
      {
        label: lang === "en" ? "Workout rhythm" : "運動節奏",
        score: Math.min(35, workouts * 10),
        detail:
          lang === "en"
            ? `${workouts} workouts logged this week`
            : `本週記錄了 ${workouts} 次運動`
      },
      {
        label: lang === "en" ? "Trend quality" : "趨勢品質",
        score: weightTrend <= 0 ? 30 : 18,
        detail:
          lang === "en"
            ? weightTrend <= 0
              ? "Weight trend is stable or moving in the right direction"
              : "Weight trend needs a steadier pace"
            : weightTrend <= 0
              ? "體重趨勢穩定，或者正向目標前進"
              : "體重趨勢仍可再收得更穩定"
      }
    ];
  }

  const latestGrowth = growth?.summary?.latestMeasurement;
  return [
    {
      label: lang === "en" ? "Growth velocity" : "成長速度",
      score: growth?.summary?.status === "on_track" ? 36 : 20,
      detail:
        growth?.summary?.heightVelocityCmPerMonth !== null && growth?.summary?.heightVelocityCmPerMonth !== undefined
          ? lang === "en"
            ? `${growth.summary.heightVelocityCmPerMonth} cm per month`
            : `每月 ${growth.summary.heightVelocityCmPerMonth} cm`
          : t(lang, "仍需更多資料", "More data is needed")
    },
    {
      label: lang === "en" ? "Measurement freshness" : "量度新鮮度",
      score: recentItems(growth?.measurements || [], (entry) => entry.measuredAt, 30).length ? 32 : 16,
      detail:
        recentItems(growth?.measurements || [], (entry) => entry.measuredAt, 30).length
          ? t(lang, "最近 30 天內有新量度", "New measurements in the last 30 days")
          : t(lang, "最近 30 天未有新量度", "No measurements in the last 30 days")
    },
    {
      label: lang === "en" ? "Current check" : "目前狀態",
      score: latestGrowth ? 32 : 18,
      detail: latestGrowth
        ? lang === "en"
          ? `${latestGrowth.heightCm} cm and ${latestGrowth.weightKg} kg in the latest check`
          : `最近一次量度為 ${latestGrowth.heightCm} cm，${latestGrowth.weightKg} kg`
        : t(lang, "仍等待下一次身高體重量度", "Waiting for the next height and weight check")
    }
  ];
}

export function buildMemberHealthScores({ alex, amelie, growth }, lang = "zh") {
  const alexSteps = Number(alex?.dashboard?.cards?.latestSteps?.value || 0);
  const amelieSteps = Number(amelie?.dashboard?.cards?.latestSteps?.value || 0);
  const alexWorkouts = recentItems(alex?.exerciseLogs || [], (entry) => entry.performedAt, 7).length;
  const amelieWorkouts = recentItems(amelie?.exerciseLogs || [], (entry) => entry.performedAt, 7).length;
  const growthStatus = growth?.summary?.status;
  const latestGrowth = growth?.summary?.latestMeasurement;

  return [
    {
      id: "alex",
      name: "Alex",
      score: buildMemberScore(alexSteps, alexWorkouts, 14, 8),
      status:
        alexWorkouts >= 3
          ? t(lang, "本週節奏穩定", "Strong weekly consistency")
          : t(lang, "本週還差一點運動節奏", "Needs one more workout push"),
      detail:
        lang === "en"
          ? `${formatValueWithUnit(alexSteps, "steps", { lang })} and ${alexWorkouts} workouts this week`
          : `${formatValueWithUnit(alexSteps, "steps", { lang })}，本週 ${alexWorkouts} 次運動`
    },
    {
      id: "amelie",
      name: "Amelie",
      score: buildMemberScore(amelieSteps, amelieWorkouts, 14, 8),
      status:
        amelieWorkouts >= 3
          ? t(lang, "塑形節奏正在建立", "Body-shaping rhythm is building")
          : t(lang, "本週可再補一節訓練", "One more training session would help"),
      detail:
        lang === "en"
          ? `${formatValueWithUnit(amelieSteps, "steps", { lang })} and ${amelieWorkouts} workouts this week`
          : `${formatValueWithUnit(amelieSteps, "steps", { lang })}，本週 ${amelieWorkouts} 次運動`
    },
    {
      id: "ryan",
      name: "Ryan",
      score: growthStatus === "on_track" ? 88 : 68,
      status:
        growthStatus === "on_track"
          ? t(lang, "成長趨勢穩定", "Growth is tracking well")
          : t(lang, "建議增加量度頻率", "Needs closer follow-up"),
      detail: latestGrowth
        ? lang === "en"
          ? `Latest: ${latestGrowth.heightCm} cm and ${latestGrowth.weightKg} kg`
          : `最新：${latestGrowth.heightCm} cm，${latestGrowth.weightKg} kg`
        : t(lang, "仍等待新的身高體重記錄", "Waiting for the next height and weight check")
    }
  ];
}

export function buildConsistencySignals({ alex, amelie, growth }, lang = "zh") {
  const alexWeightDates = (alex?.healthDataRecords || [])
    .filter((record) => record.category === "weight")
    .map((record) => record.recordedAt);
  const amelieWeightDates = (amelie?.healthDataRecords || [])
    .filter((record) => record.category === "weight")
    .map((record) => record.recordedAt);
  const growthDates = (growth?.measurements || []).map((entry) => entry.measuredAt);
  const exerciseDates = [...(alex?.exerciseLogs || []), ...(amelie?.exerciseLogs || [])].map((entry) => entry.performedAt);

  const alexWeightStreak = getConsecutiveDayCount(alexWeightDates);
  const amelieWeightStreak = getConsecutiveDayCount(amelieWeightDates);
  const growthWeekStreak = getConsecutiveWeekCount(growthDates);
  const exerciseStreak = getConsecutiveDayCount(exerciseDates);
  const recentGrowthLogged = recentItems(growth?.measurements || [], (entry) => entry.measuredAt, 7).length > 0;

  return [
    {
      id: "alex-weight-streak",
      member: "Alex",
      kind: "weight",
      streak: alexWeightStreak,
      status:
        alexWeightStreak >= 3
          ? t(lang, "體重連續記錄中", "Weight logging is on a streak")
          : t(lang, "可再穩定一點", "Could use steadier logging"),
      detail:
        alexWeightStreak > 0
          ? t(lang, `連續 ${alexWeightStreak} 天有記錄`, `${alexWeightStreak} days logged in a row`)
          : t(lang, "本週未有新體重記錄", "No recent weight logs this week")
    },
    {
      id: "amelie-weight-streak",
      member: "Amelie",
      kind: "weight",
      streak: amelieWeightStreak,
      status:
        amelieWeightStreak >= 3
          ? t(lang, "體重連續記錄中", "Weight logging is on a streak")
          : t(lang, "可再穩定一點", "Could use steadier logging"),
      detail:
        amelieWeightStreak > 0
          ? t(lang, `連續 ${amelieWeightStreak} 天有記錄`, `${amelieWeightStreak} days logged in a row`)
          : t(lang, "本週未有新體重記錄", "No recent weight logs this week")
    },
    {
      id: "ryan-growth-streak",
      member: "Ryan",
      kind: "growth",
      streak: growthWeekStreak,
      status:
        recentGrowthLogged
          ? t(lang, "Ryan 本週已量度", "Ryan was measured this week")
          : t(lang, "這週仍未量度", "No Ryan measurement yet this week"),
      detail:
        growthWeekStreak > 0
          ? t(lang, `連續 ${growthWeekStreak} 週有成長記錄`, `${growthWeekStreak} weeks of growth tracking in a row`)
          : t(lang, "仍未建立每週量度節奏", "A weekly measurement rhythm has not started yet")
    },
    {
      id: "exercise-streak",
      member: t(lang, "家庭", "Family"),
      kind: "exercise",
      streak: exerciseStreak,
      status:
        exerciseStreak >= 2
          ? t(lang, "運動節奏有延續", "Exercise consistency is carrying over")
          : t(lang, "可再補一點運動節奏", "The workout rhythm could use a lift"),
      detail:
        exerciseStreak > 0
          ? t(lang, `連續 ${exerciseStreak} 天有運動記錄`, `${exerciseStreak} days with workouts in a row`)
          : t(lang, "最近未有連續運動節奏", "No recent multi-day workout rhythm")
    }
  ];
}

export function buildMemberConsistency(member, growth, lang = "zh") {
  if (member?.id === "ryan") {
    const growthDates = (growth?.measurements || []).map((entry) => entry.measuredAt);
    const streak = getConsecutiveWeekCount(growthDates);
    const recentGrowthLogged = recentItems(growth?.measurements || [], (entry) => entry.measuredAt, 7).length > 0;

    return {
      title: t(lang, "成長量度節奏", "Growth Tracking Rhythm"),
      status: recentGrowthLogged
        ? t(lang, "Ryan 本週已量度", "Ryan was measured this week")
        : t(lang, "這週仍未量度", "No Ryan measurement yet this week"),
      detail:
        streak > 0
          ? t(lang, `連續 ${streak} 週有成長記錄`, `${streak} weeks of growth tracking in a row`)
          : t(lang, "仍未建立每週量度節奏", "A weekly measurement rhythm has not started yet"),
      streak,
      accent: "emerald"
    };
  }

  const weightDates = (member?.healthDataRecords || [])
    .filter((record) => record.category === "weight")
    .map((record) => record.recordedAt);
  const workoutDates = (member?.exerciseLogs || []).map((entry) => entry.performedAt);
  const weightStreak = getConsecutiveDayCount(weightDates);
  const workoutStreak = getConsecutiveDayCount(workoutDates);

  return {
    title: t(lang, "連續記錄節奏", "Consistency Rhythm"),
    status:
      weightStreak >= 3
        ? t(lang, "體重記錄有穩定延續", "Weight logging has a steady rhythm")
        : t(lang, "體重記錄仍可再密一點", "Weight logging could be more consistent"),
    detail: t(
      lang,
      `體重連續 ${weightStreak || 0} 天，運動連續 ${workoutStreak || 0} 天`,
      `${weightStreak || 0} days of weight logs, ${workoutStreak || 0} days of workouts`
    ),
    streak: Math.max(weightStreak, workoutStreak),
    accent: "blue"
  };
}

export function buildMilestones({ alex, amelie, growth }, lang = "zh") {
  const milestones = [];
  const latestGrowthDate = growth?.summary?.latestMeasurement?.measuredAt || null;

  if (growth?.summary?.latestMeasurement?.heightCm >= 120) {
      milestones.push({
        id: "ryan-120cm",
        member: "Ryan",
        type: "growth",
        typeLabel: t(lang, "成長", "Growth"),
        achievedAt: latestGrowthDate,
        celebration:
          lang === "en"
            ? "A big growth moment for Ryan."
            : "Ryan 又跨過了一個清楚的成長節點。",
        title: lang === "en" ? "Ryan reached 120 cm" : "Ryan 達到 120 cm",
        detail: lang === "en" ? "A new growth milestone worth celebrating." : "這是一個值得記錄的成長里程碑。"
      });
  }

  const alexWeightLoss = Number(alex?.dashboard?.trends?.weight?.delta || 0);
  if (alexWeightLoss <= -5) {
      milestones.push({
        id: "alex-5kg",
        member: "Alex",
        type: "weight",
        typeLabel: t(lang, "體重", "Weight"),
        achievedAt: alex?.latestMetrics?.weight?.recordedAt || null,
        celebration:
          lang === "en"
            ? "A meaningful weight-loss milestone."
            : "這是一個很值得記低的減重成果。",
        title: lang === "en" ? "Alex lost 5 kg" : "Alex 減去 5 kg",
        detail: lang === "en" ? "A major weight milestone has been reached." : "這是一個重要的減重里程碑。"
      });
  }

  const amelieWorkouts = recentItems(amelie?.exerciseLogs || [], (entry) => entry.performedAt, 30).length;
  if (amelieWorkouts >= 5) {
      milestones.push({
        id: "amelie-5-workouts",
        member: "Amelie",
        type: "workout",
        typeLabel: t(lang, "運動", "Workout"),
        achievedAt: [...(amelie?.exerciseLogs || [])]
        .sort((left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime())[0]?.performedAt || null,
        celebration:
          lang === "en"
            ? "Consistency is starting to show."
            : "運動的一致性已經開始建立出來。",
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
      id: "alex-workout-gap",
      member: "Alex",
      ctaHref: "/family-members/alex#manage",
      ctaLabel: t(lang, "記錄運動", "Log workout"),
      title: lang === "en" ? "Alex has not exercised for 3 days" : "Alex 已 3 天沒有運動",
      detail: lang === "en" ? "A short workout can help maintain momentum." : "補一節短運動可以幫助維持節奏。"
    });
  }

  const amelieWorkoutGap = recentItems(amelie?.exerciseLogs || [], (entry) => entry.performedAt, 3).length;
  if (!amelieWorkoutGap) {
    reminders.push({
      id: "amelie-workout-gap",
      member: "Amelie",
      ctaHref: "/family-members/amelie#manage",
      ctaLabel: t(lang, "新增運動", "Add workout"),
      title: lang === "en" ? "Amelie has not exercised for 3 days" : "Amelie 已 3 天沒有運動",
      detail: lang === "en" ? "A light session is enough to restart consistency." : "一節輕量運動已足夠重新啟動節奏。"
    });
  }

  const recentGrowth = recentItems(growth?.measurements || [], (entry) => entry.measuredAt, 7).length;
  if (!recentGrowth) {
    reminders.push({
      id: "ryan-growth-gap",
      member: "Ryan",
      ctaHref: "/family-members/ryan#manage-growth",
      ctaLabel: t(lang, "新增量度", "Add measurement"),
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
    ],
    shareText:
      lang === "en"
        ? `Family Health Report\n\n${ryanText}\n${alexText}\n${amelieText}\n\nRecommended focus:\n- Keep Ryan's measurements regular.\n- Protect workout consistency for both adults.\n- Use reminders as action prompts, not pressure.`
        : `家庭健康週報\n\n${ryanText}\n${alexText}\n${amelieText}\n\n本週建議：\n- 保持 Ryan 的量度節奏穩定。\n- 兩位大人都要維持運動一致性。\n- 把提醒當成行動提示，而唔係壓力。`,
    coverTitle: lang === "en" ? "Family Health Weekly Digest" : "家庭健康每週摘要",
    coverSubtitle:
      lang === "en"
        ? "A calmer view of growth, weight, activity, and consistency."
        : "用更清楚的一頁，睇成長、體重、活動與一致性。"
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
