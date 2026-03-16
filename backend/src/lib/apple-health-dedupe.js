function recordKey(record) {
  return JSON.stringify([
    record.category,
    record.value,
    record.unit || "",
    new Date(record.recordedAt).toISOString()
  ]);
}

function workoutKey(workout) {
  return JSON.stringify([
    workout.workoutType,
    workout.durationMinutes || 0,
    workout.caloriesBurned || 0,
    new Date(workout.performedAt).toISOString()
  ]);
}

export function splitDuplicates({ existingRecords, existingExerciseLogs, incomingRecords, incomingWorkouts }) {
  const existingRecordKeys = new Set((existingRecords || []).map(recordKey));
  const existingWorkoutKeys = new Set((existingExerciseLogs || []).map(workoutKey));

  const newRecords = [];
  const duplicateRecords = [];
  const newWorkouts = [];
  const duplicateWorkouts = [];

  for (const record of incomingRecords) {
    const key = recordKey(record);
    if (existingRecordKeys.has(key)) {
      duplicateRecords.push(record);
    } else {
      existingRecordKeys.add(key);
      newRecords.push(record);
    }
  }

  for (const workout of incomingWorkouts) {
    const key = workoutKey(workout);
    if (existingWorkoutKeys.has(key)) {
      duplicateWorkouts.push(workout);
    } else {
      existingWorkoutKeys.add(key);
      newWorkouts.push(workout);
    }
  }

  return {
    newRecords,
    duplicateRecords,
    newWorkouts,
    duplicateWorkouts
  };
}

