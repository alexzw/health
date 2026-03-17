import test from "node:test";
import assert from "node:assert/strict";
import { splitDuplicates } from "../src/lib/apple-health-dedupe.js";

test("splitDuplicates skips records and workouts that already exist", () => {
  const existingRecords = [
    {
      category: "steps",
      value: 10804,
      unit: "count",
      recordedAt: "2026-03-15T16:00:00.000Z"
    }
  ];
  const existingExerciseLogs = [
    {
      workoutType: "Walking",
      durationMinutes: 30.95,
      caloriesBurned: 0,
      performedAt: "2026-03-09T03:57:00.000Z"
    }
  ];

  const incomingRecords = [
    {
      category: "steps",
      value: 10804,
      unit: "count",
      recordedAt: "2026-03-15T16:00:00.000Z"
    },
    {
      category: "heart_rate",
      value: 78,
      unit: "count/min",
      recordedAt: "2026-03-15T16:00:00.000Z"
    }
  ];
  const incomingWorkouts = [
    {
      workoutType: "Walking",
      durationMinutes: 30.95,
      caloriesBurned: 0,
      performedAt: "2026-03-09T03:57:00.000Z"
    },
    {
      workoutType: "Running",
      durationMinutes: 28,
      caloriesBurned: 280,
      performedAt: "2026-03-15T06:20:00.000Z"
    }
  ];

  const result = splitDuplicates({
    existingRecords,
    existingExerciseLogs,
    incomingRecords,
    incomingWorkouts
  });

  assert.equal(result.newRecords.length, 1);
  assert.equal(result.duplicateRecords.length, 1);
  assert.equal(result.newWorkouts.length, 1);
  assert.equal(result.duplicateWorkouts.length, 1);
});
