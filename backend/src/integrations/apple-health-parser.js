import fs from "node:fs";
import readline from "node:readline";
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

function decodeXmlEntities(value = "") {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function parseXmlAttributes(line) {
  const attributes = {};

  for (const match of line.matchAll(/([A-Za-z0-9_:-]+)="([^"]*)"/g)) {
    attributes[`@_${match[1]}`] = decodeXmlEntities(match[2]);
  }

  return attributes;
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

function isOnOrAfterSinceDate(dateString, sinceDate) {
  if (!sinceDate) {
    return true;
  }

  return new Date(dateString).getTime() >= sinceDate.getTime();
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

export async function parseAppleHealthExportFile(filePath, options = {}) {
  const sinceDate = options.sinceDate || null;
  const records = [];
  const workouts = [];
  const stream = fs.createReadStream(filePath, { encoding: "utf8" });
  const lineReader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  try {
    for await (const line of lineReader) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("<Record ")) {
        const mappedRecord = mapRecordToHealthRecord(parseXmlAttributes(trimmedLine));
        if (mappedRecord && isOnOrAfterSinceDate(mappedRecord.recordedAt, sinceDate)) {
          records.push(mappedRecord);
        }
      }

      if (trimmedLine.startsWith("<Workout ")) {
        const workout = mapWorkout(parseXmlAttributes(trimmedLine));
        if (isOnOrAfterSinceDate(workout.performedAt, sinceDate)) {
          workouts.push(workout);
        }
      }
    }
  } finally {
    lineReader.close();
  }

  return {
    records,
    workouts
  };
}
