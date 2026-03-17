function createGoal(id, title, targetValue, unit, cadence, notes = "", isCompleted = false) {
  return {
    id,
    title,
    targetValue,
    unit,
    cadence,
    notes,
    isCompleted
  };
}

export function buildDefaultWeeklyGoals(member) {
  if (member.id === "alex") {
    return [
      createGoal("alex-weight-checkins", "Weight Check-Ins", 4, "times", "weekly", "Log weight 3 to 5 times each week."),
      createGoal("alex-steps-floor", "Daily Steps Floor", 10000, "steps", "weekly", "Keep daily activity stable for fat loss."),
      createGoal("alex-workouts", "Planned Workouts", 3, "sessions", "weekly", "Protect muscle while losing weight.")
    ];
  }

  if (member.id === "amelie") {
    return [
      createGoal("amelie-strength", "Strength Sessions", 3, "sessions", "weekly", "Build a repeatable shaping routine."),
      createGoal("amelie-activity", "Active Days", 5, "days", "weekly", "Stay consistent outside formal workouts."),
      createGoal("amelie-sleep", "Sleep Floor", 7, "hours", "weekly", "Recovery helps body recomposition.")
    ];
  }

  if (member.id === "ryan") {
    return [
      createGoal("ryan-height-check", "Height Check", 1, "time", "monthly", "Measure height once each month."),
      createGoal("ryan-weight-check", "Weight Check", 1, "time", "monthly", "Record weight together with height."),
      createGoal("ryan-growth-review", "Growth Review", 1, "review", "monthly", "Review trend instead of one isolated record.")
    ];
  }

  return [];
}

