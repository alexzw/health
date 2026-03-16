import { XMLParser } from "fast-xml-parser";

function asArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function toIsoDate(dateString) {
  return new Date(dateString).toISOString();
}

function getSleepHours(record) {
  const start = new Date(record["@_startDate"]);
  const end = new Date(record["@_endDate"]);
  return Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 10) / 10;
}

function mapRecordToHealthRecord(record) {
  const recordType = record["@_type"];
  const startDate = toIsoDate(record["@_startDate"]);
  const source = record["@_sourceName"] || "Apple Health";

  if (recordType === "HKQuantityTypeIdentifierBodyMass") {
    return {
      category: "weight",
      value: Number(record["@_value"]),
      unit: record["@_unit"] || "kg",
      notes: `由 ${source} 匯入`,
      recordedAt: startDate
    };
  }

  if (recordType === "HKQuantityTypeIdentifierStepCount") {
    return {
      category: "steps",
      value: Number(record["@_value"]),
      unit: record["@_unit"] || "count",
      notes: `由 ${source} 匯入`,
      recordedAt: startDate
    };
  }

  if (recordType === "HKQuantityTypeIdentifierHeartRate") {
    return {
      category: "heart_rate",
      value: Number(record["@_value"]),
      unit: record["@_unit"] || "count/min",
      notes: `由 ${source} 匯入`,
      recordedAt: startDate
    };
  }

  if (recordType === "HKQuantityTypeIdentifierRestingHeartRate") {
    return {
      category: "resting_heart_rate",
      value: Number(record["@_value"]),
      unit: record["@_unit"] || "count/min",
      notes: `由 ${source} 匯入`,
      recordedAt: startDate
    };
  }

  if (recordType === "HKQuantityTypeIdentifierActiveEnergyBurned") {
    return {
      category: "active_energy_burned",
      value: Number(record["@_value"]),
      unit: record["@_unit"] || "kcal",
      notes: `由 ${source} 匯入`,
      recordedAt: startDate
    };
  }

  if (recordType === "HKCategoryTypeIdentifierSleepAnalysis") {
    return {
      category: "sleep",
      value: getSleepHours(record),
      unit: "hours",
      notes: `由 ${source} 匯入`,
      recordedAt: startDate
    };
  }

  return null;
}

function mapWorkout(workout) {
  const source = workout["@_sourceName"] || "Apple Health";
  const workoutType = String(workout["@_workoutActivityType"] || "Workout")
    .replace("HKWorkoutActivityType", "")
    .replaceAll("_", " ")
    .trim();

  return {
    workoutType: workoutType || "Workout",
    durationMinutes: Number(workout["@_duration"] || 0),
    caloriesBurned: Number(workout["@_totalEnergyBurned"] || 0),
    notes: `由 ${source} 匯入`,
    performedAt: toIsoDate(workout["@_startDate"])
  };
}

export function parseAppleHealthExport(xmlString) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });

  const parsed = parser.parse(xmlString);
  const records = asArray(parsed?.HealthData?.Record)
    .map(mapRecordToHealthRecord)
    .filter(Boolean);
  const workouts = asArray(parsed?.HealthData?.Workout).map(mapWorkout);

  return {
    records,
    workouts
  };
}

