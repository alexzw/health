import test from "node:test";
import assert from "node:assert/strict";
import { parseAppleHealthExport } from "../src/integrations/apple-health-parser.js";

test("parseAppleHealthExport maps records and workouts into app-friendly structures", () => {
  const xml = `
    <HealthData>
      <Record
        type="HKQuantityTypeIdentifierBodyMass"
        sourceName="Apple Watch"
        unit="kg"
        value="78.1"
        startDate="2026-03-15 07:30:00 +0000"
        endDate="2026-03-15 07:30:00 +0000"
      />
      <Workout
        workoutActivityType="HKWorkoutActivityTypeRunning"
        duration="28"
        durationUnit="min"
        totalEnergyBurned="280"
        totalEnergyBurnedUnit="kcal"
        sourceName="Apple Watch"
        startDate="2026-03-15 06:20:00 +0000"
        endDate="2026-03-15 06:48:00 +0000"
      />
    </HealthData>
  `;

  const result = parseAppleHealthExport(xml);

  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].category, "weight");
  assert.equal(result.records[0].value, 78.1);
  assert.equal(result.workouts.length, 1);
  assert.equal(result.workouts[0].workoutType, "Running");
  assert.equal(result.workouts[0].durationMinutes, 28);
});
