function round(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function text(lang, zhText, enText) {
  return lang === "en" ? enText : zhText;
}

function formatMetricValue(metric) {
  if (!metric || metric.value === null || metric.value === undefined) {
    return null;
  }

  return {
    value: round(metric.value),
    unit: metric.unit || ""
  };
}

function countRecentWorkouts(exerciseLogs = [], days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return exerciseLogs.filter((entry) => new Date(entry.performedAt).getTime() >= cutoff).length;
}

function getDefaultGoal(member, lang) {
  const goals = {
    alex: {
      key: "weight_loss",
      title: text(lang, "減重", "Weight Loss"),
      objective: text(
        lang,
        "以穩定方式逐步降低體重，同時保持體能與恢復。",
        "Reduce body weight gradually while keeping daily energy and recovery stable."
      ),
      focus: ["weight", "steps", "sleep", "workouts"]
    },
    amelie: {
      key: "body_recomposition",
      title: text(lang, "塑形", "Body Shaping"),
      objective: text(
        lang,
        "以穩定活動量與力量訓練習慣，建立更緊實、更有線條的身形。",
        "Build a leaner, more defined shape with steady activity and strength-focused habits."
      ),
      focus: ["weight", "workouts", "sleep"]
    },
    ryan: {
      key: "child_growth",
      title: text(lang, "健康成長", "Healthy Growth"),
      objective: text(
        lang,
        "透過規律追蹤，支持穩定的身高與體重發展。",
        "Support steady height and weight development with regular tracking."
      ),
      focus: ["height", "weight", "growth"]
    }
  };

  return (
    goals[member.id] || {
      key: "general_health",
      title: text(lang, "一般健康", "General Health"),
      objective: text(lang, "追蹤趨勢並維持健康日常。", "Track trends and maintain healthy daily routines."),
      focus: ["weight", "sleep", "steps"]
    }
  );
}

function buildAdultCoach(member, lang) {
  const dashboard = member.dashboard || {};
  const trends = dashboard.trends || {};
  const recentWorkoutCount = countRecentWorkouts(member.exerciseLogs || []);
  const latestWeight = formatMetricValue(member.latestMetrics?.weight);
  const latestSteps = formatMetricValue(dashboard.cards?.latestSteps || member.latestMetrics?.steps);
  const latestSleep = formatMetricValue(dashboard.cards?.latestSleep || member.latestMetrics?.sleep);
  const bmi = member.latestBmi;
  const observations = [];
  const actions = [];
  const watchouts = [];

  if (member.id === "alex") {
    observations.push(
      latestWeight
        ? text(
            lang,
            `目前體重約為 ${latestWeight.value} ${latestWeight.unit}。對減脂來說，重點應該看 2 至 4 星期趨勢，而唔係單日數字。`,
            `Latest weight is ${latestWeight.value} ${latestWeight.unit}. For fat loss, the key signal is the 2 to 4 week trend rather than one daily reading.`
          )
        : text(lang, "目前體重資料仍不足，未能判斷減重是否正在發生。", "There is not enough weight data yet to judge whether fat loss is happening.")
    );

    observations.push(
      trends.steps?.delta !== null
        ? text(
            lang,
            `你最近活動量比 30 日基準${trends.steps.delta <= 0 ? "低" : "高"}約 ${Math.abs(round(trends.steps.delta))} 步。`,
            `Your recent activity level is ${trends.steps.delta <= 0 ? "below" : "above"} your 30-day baseline by about ${Math.abs(round(trends.steps.delta))} steps.`
          )
        : text(lang, "步數歷史資料仍不足，未能同基準比較。", "There is not enough step history yet to compare against your baseline.")
    );

    observations.push(
      latestSleep
        ? text(
            lang,
            `最近睡眠大約 ${latestSleep.value} ${latestSleep.unit}。睡眠會影響食慾、恢復同減重穩定性。`,
            `Recent sleep is about ${latestSleep.value} ${latestSleep.unit}. Sleep affects hunger, recovery, and fat-loss consistency.`
          )
        : text(lang, "睡眠資料仍然有限，所以較難判斷恢復質素。", "Sleep data is still limited, so recovery quality is harder to interpret.")
    );

    actions.push(text(lang, "用小而可持續的熱量赤字，不要過度節食。", "Aim for a small sustainable calorie deficit instead of aggressive restriction."));
    actions.push(text(lang, "保持穩定步行目標，盡量不要讓每週步數低過最近基準。", "Keep a steady walking target and try not to let weekly steps drop below your recent baseline."));
    actions.push(text(lang, "每週穩定量體重 3 至 5 次，會更容易看清真正趨勢。", "Log body weight consistently 3 to 5 times per week so the trend becomes easier to trust."));

    if (recentWorkoutCount < 3) {
      actions.push(text(lang, "每週加入 2 至 3 次有計劃的運動，幫助減重時保留肌肉。", "Add 2 to 3 planned workouts each week to protect muscle while losing weight."));
    }

    if (bmi && bmi >= 25) {
      watchouts.push(text(lang, "減重應該以穩定趨勢改善為目標，而唔係節食過猛或每週波動太大。", "Weight loss should focus on steady trend improvement, not crash dieting or very fast weekly changes."));
    }

    if (trends.sleep?.last7Value !== null && trends.sleep.last7Value < 6.5) {
      watchouts.push(text(lang, "睡眠不足會增加疲勞與食慾，令減重更難穩定。", "Short sleep can make fat loss harder by increasing fatigue, hunger, and inconsistency."));
    }
  } else {
    observations.push(
      recentWorkoutCount
        ? text(
            lang,
            `最近 7 日已有 ${recentWorkoutCount} 次運動紀錄。對塑形而言，穩定性通常比偶爾衝很大更重要。`,
            `You have ${recentWorkoutCount} workout logs in the last 7 days. Consistency matters more than intensity spikes for shaping goals.`
          )
        : text(lang, "最近未有運動紀錄，所以塑形建議應先由穩定每週節奏開始。", "There are no recent workout logs yet, so body-shaping guidance should start with a stable weekly routine.")
    );

    observations.push(
      latestWeight
        ? text(
            lang,
            `目前體重約為 ${latestWeight.value} ${latestWeight.unit}。對塑形來說，體重本身唔夠，要連同訓練穩定度一齊看。`,
            `Latest body weight is ${latestWeight.value} ${latestWeight.unit}. For shaping goals, weight alone is not enough; workout consistency matters too.`
          )
        : text(lang, "目前體重資料仍不足，未能建立可靠基準。", "There is not enough body-weight data yet to build a reliable baseline.")
    );

    observations.push(
      latestSleep
        ? text(
            lang,
            `最近睡眠約為 ${latestSleep.value} ${latestSleep.unit}，會直接影響恢復同訓練質素。`,
            `Recent sleep is around ${latestSleep.value} ${latestSleep.unit}, which affects recovery and training quality.`
          )
        : text(lang, "睡眠資料仍有限，所以暫時未能清楚判斷恢復狀況。", "Sleep data is still limited, so recovery quality is not yet clear.")
    );

    actions.push(text(lang, "優先安排每週 2 至 4 次力量導向訓練，對塑形更有幫助。", "Prioritize 2 to 4 strength-focused sessions per week for a better body-shaping result."));
    actions.push(text(lang, "不要只看磅數，應連同運動頻率與外觀變化一齊觀察。", "Use weight, workout frequency, and progress photos together instead of relying on scale weight alone."));
    actions.push(text(lang, "保持穩定日常活動量，令塑形成效不只靠正式訓練。", "Keep daily activity stable so shaping progress does not depend only on formal workouts."));

    if (recentWorkoutCount < 2) {
      actions.push(text(lang, "先建立每週兩次可重複的訓練，再慢慢增加複雜度。", "Start with two repeatable weekly workouts before increasing training complexity."));
    }

    if (trends.sleep?.last7Value !== null && trends.sleep.last7Value < 6.5) {
      watchouts.push(text(lang, "睡眠不足會減低恢復能力，令塑形訓練效果變差。", "Low sleep can reduce recovery and make body-shaping training less effective."));
    }

    watchouts.push(text(lang, "塑形通常更依賴漸進訓練與穩定性，而不是體重大起大落。", "Body shaping usually improves more from progressive training and consistency than from large weight swings."));
  }

  return {
    metrics: [
      { label: text(lang, "最新體重", "Latest Weight"), ...latestWeight },
      { label: "BMI", value: bmi, unit: "" },
      { label: text(lang, "最新步數", "Latest Steps"), ...latestSteps },
      { label: text(lang, "最新睡眠", "Latest Sleep"), ...latestSleep },
      { label: text(lang, "7 日運動次數", "Workouts in 7 Days"), value: recentWorkoutCount, unit: "" }
    ].filter((item) => item.value !== null && item.value !== undefined),
    observations,
    actions,
    watchouts,
    weeklyFocus:
      member.id === "alex"
        ? text(lang, "建立一個可重複的減重星期：穩定步數、足夠睡眠、至少兩次運動。", "Create one repeatable fat-loss week: stable steps, enough sleep, and at least two workouts.")
        : text(lang, "建立可重複的塑形節奏：力量訓練、步行與恢復都要穩定。", "Build a repeatable shaping routine with strength work, walking, and recovery.")
  };
}

function buildChildCoach(member, growth, lang) {
  const latestMeasurement = growth?.summary?.latestMeasurement || null;
  const observations = [];
  const actions = [];
  const watchouts = [];

  observations.push(
    latestMeasurement
      ? text(lang, `最新成長紀錄顯示 Ryan 目前約 ${latestMeasurement.heightCm} cm、${latestMeasurement.weightKg} kg。`, `Latest growth record shows ${latestMeasurement.heightCm} cm and ${latestMeasurement.weightKg} kg.`)
      : text(lang, "目前成長資料仍不足，未能解讀 Ryan 的身高體重趨勢。", "There is not enough growth data yet to interpret Ryan's height and weight trend.")
  );

  observations.push(
    growth?.measurements?.length > 1
      ? text(lang, `目前已有 ${growth.measurements.length} 筆成長測量，趨勢會較容易觀察。`, `There are ${growth.measurements.length} growth measurements available, which makes the trend easier to follow over time.`)
      : text(lang, "Ryan 仍需要更多重複身高與體重量度，長期趨勢先會更可靠。", "Ryan needs more repeated height and weight measurements before the long-term trend becomes reliable.")
  );

  actions.push(text(lang, "持續規律記錄身高與體重，最好用固定節奏。", "Keep recording height and weight regularly, ideally with a consistent schedule."));
  actions.push(text(lang, "看一段時間的趨勢方向，不要只因單次量度就下判斷。", "Use trend direction over time instead of reacting to one single measurement."));
  actions.push(text(lang, "如果擔心飲食、睡眠或成長速度，應先比較之後幾次量度再判斷。", "If there is concern about eating, sleep, or growth pace, compare future measurements before assuming there is a problem."));

  if ((growth?.measurements?.length || 0) < 3) {
    watchouts.push(text(lang, "目前成長測量次數仍偏少，未適合下太強結論。", "There are still too few growth measurements to draw strong conclusions."));
  }

  if (growth?.insights?.some((entry) => entry.level === "warning")) {
    watchouts.push(text(lang, "最近成長資料有警示訊號，所以下一次量度會特別重要。", "Recent growth data includes a warning signal, so the next measurement matters more than usual."));
  }

  return {
    metrics: latestMeasurement
      ? [
          { label: text(lang, "最新身高", "Latest Height"), value: latestMeasurement.heightCm, unit: "cm" },
          { label: text(lang, "最新體重", "Latest Weight"), value: latestMeasurement.weightKg, unit: "kg" },
          { label: text(lang, "成長紀錄數", "Growth Records"), value: growth.measurements.length, unit: "" }
        ]
      : [],
    observations,
    actions,
    watchouts,
    weeklyFocus: text(lang, "保持 Ryan 測量節奏一致，之後會更容易判讀身高與體重趨勢。", "Keep Ryan's measurements consistent so height and weight trends become easier to interpret.")
  };
}

export function buildHealthCoachPlan(member, growth = null, lang = "zh") {
  const goal = getDefaultGoal(member, lang);
  const coachBody =
    member.familyRole === "Child" ? buildChildCoach(member, growth, lang) : buildAdultCoach(member, lang);

  return {
    goal,
    disclaimer: text(
      lang,
      "這個教練功能只會解讀數據趨勢與下一步建議，並不是醫療診斷；如果有急性、不尋常或持續症狀，應由醫生評估。",
      "This coach explains trends and next steps from your data. It is not a medical diagnosis, and urgent or unusual symptoms should be reviewed by a doctor."
    ),
    updatedAt: new Date().toISOString(),
    ...coachBody
  };
}
