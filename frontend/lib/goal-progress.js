function getRecentItems(items, getDate, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return (items || []).filter((item) => new Date(getDate(item)).getTime() >= cutoff);
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(items, getValue) {
  if (!items.length) {
    return 0;
  }

  return items.reduce((sum, item) => sum + Number(getValue(item) || 0), 0) / items.length;
}

export function enrichGoalsWithProgress(goals, member, growth) {
  const healthRecords = member?.healthDataRecords || [];
  const exerciseLogs = member?.exerciseLogs || [];
  const growthMeasurements = growth?.measurements || [];

  return (goals || []).map((goal) => {
    const target = Number(goal.targetValue || 0);
    let currentValue = 0;
    let progressPercent = goal.isCompleted ? 100 : 0;

    switch (goal.slug) {
      case "alex-weight-checkins":
        currentValue = getRecentItems(
          healthRecords.filter((record) => record.category === "weight"),
          (record) => record.recordedAt,
          7
        ).length;
        progressPercent = target ? clampPercent((currentValue / target) * 100) : progressPercent;
        break;
      case "alex-steps-floor":
        currentValue = Math.round(
          average(
            getRecentItems(
              healthRecords.filter((record) => record.category === "steps"),
              (record) => record.recordedAt,
              7
            ),
            (record) => record.value
          )
        );
        progressPercent = target ? clampPercent((currentValue / target) * 100) : progressPercent;
        break;
      case "alex-workouts":
      case "amelie-strength":
        currentValue = getRecentItems(exerciseLogs, (log) => log.performedAt, 7).length;
        progressPercent = target ? clampPercent((currentValue / target) * 100) : progressPercent;
        break;
      case "amelie-activity": {
        const recentSteps = getRecentItems(
          healthRecords.filter((record) => record.category === "steps"),
          (record) => record.recordedAt,
          7
        );
        const activeDays = new Set(
          recentSteps.filter((record) => Number(record.value || 0) >= 6000).map((record) => record.recordedAt.slice(0, 10))
        );
        currentValue = activeDays.size;
        progressPercent = target ? clampPercent((currentValue / target) * 100) : progressPercent;
        break;
      }
      case "amelie-sleep":
        currentValue = Math.round(
          average(
            getRecentItems(
              healthRecords.filter((record) => record.category === "sleep"),
              (record) => record.recordedAt,
              7
            ),
            (record) => record.value
          ) * 10
        ) / 10;
        progressPercent = target ? clampPercent((currentValue / target) * 100) : progressPercent;
        break;
      case "ryan-height-check":
      case "ryan-weight-check":
        currentValue = getRecentItems(growthMeasurements, (entry) => entry.measuredAt, 30).length;
        progressPercent = target ? clampPercent((currentValue / target) * 100) : progressPercent;
        break;
      case "ryan-growth-review":
        currentValue = getRecentItems(growthMeasurements, (entry) => entry.measuredAt, 30).length ? 1 : 0;
        progressPercent = target ? clampPercent((currentValue / target) * 100) : progressPercent;
        break;
      default:
        progressPercent = goal.isCompleted ? 100 : 0;
    }

    return {
      ...goal,
      currentValue,
      progressPercent
    };
  });
}
