import { seededFamilyMembers } from "../seed/family-members.js";

const RECENT_HEALTH_RECORD_LIMIT = 12;
const RECENT_EXERCISE_LOG_LIMIT = 8;

function buildLatestMetrics(records) {
  const latestMetrics = {};

  for (const record of records || []) {
    if (record.value === null || record.value === undefined) {
      continue;
    }

    if (!latestMetrics[record.category]) {
      latestMetrics[record.category] = {
        value: record.value,
        unit: record.unit,
        recordedAt: record.recordedAt
      };
    }
  }

  return latestMetrics;
}

function presentListMember(member) {
  const { growthMeasurements, healthDataRecords, exerciseLogs, ...rest } = member;

  return {
    ...rest,
    healthDataRecords: [],
    exerciseLogs: [],
    totalHealthRecordCount: healthDataRecords.length,
    totalExerciseLogCount: exerciseLogs.length,
    latestMetrics: buildLatestMetrics(
      [...healthDataRecords].sort(
        (left, right) => new Date(right.recordedAt) - new Date(left.recordedAt)
      )
    )
  };
}

function presentDetailMember(member) {
  const { growthMeasurements, ...rest } = member;
  const sortedHealthRecords = [...member.healthDataRecords].sort(
    (left, right) => new Date(right.recordedAt) - new Date(left.recordedAt)
  );
  const sortedExerciseLogs = [...member.exerciseLogs].sort(
    (left, right) => new Date(right.performedAt) - new Date(left.performedAt)
  );

  return {
    ...rest,
    healthDataRecords: sortedHealthRecords.slice(0, RECENT_HEALTH_RECORD_LIMIT),
    exerciseLogs: sortedExerciseLogs.slice(0, RECENT_EXERCISE_LOG_LIMIT),
    totalHealthRecordCount: member.healthDataRecords.length,
    totalExerciseLogCount: member.exerciseLogs.length,
    latestMetrics: buildLatestMetrics(sortedHealthRecords)
  };
}

export class InMemoryFamilyMemberRepository {
  async list() {
    return seededFamilyMembers.map(presentListMember);
  }

  async findById(id) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);

    if (!member) {
      return null;
    }

    return presentDetailMember(member);
  }

  async findGrowthByMemberId(id) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);
    return member?.growthMeasurements || [];
  }

  async findExerciseLogsByMemberId(id) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);
    return member?.exerciseLogs || [];
  }

  async findMetricTrendByMemberId(id, category, days = 30) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);

    if (!member) {
      return [];
    }

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const grouped = new Map();

    for (const entry of member.healthDataRecords) {
      if (entry.category !== category || entry.value === null || entry.value === undefined) {
        continue;
      }

      const timestamp = new Date(entry.recordedAt).getTime();

      if (timestamp < cutoff) {
        continue;
      }

      const dayKey = new Date(entry.recordedAt).toISOString().slice(0, 10);
      const current = grouped.get(dayKey) || {
        values: [],
        unit: entry.unit,
        date: `${dayKey}T00:00:00.000Z`
      };

      current.values.push(Number(entry.value));
      grouped.set(dayKey, current);
    }

    return [...grouped.values()]
      .sort((left, right) => new Date(left.date) - new Date(right.date))
      .map((entry) => {
        const reducer =
          category === "steps" || category === "sleep" || category === "active_energy_burned"
            ? entry.values.reduce((sum, value) => sum + value, 0)
            : entry.values.reduce((sum, value) => sum + value, 0) / entry.values.length;

        return {
          value: Math.round(reducer * 10) / 10,
          date: entry.date,
          unit: entry.unit
        };
      });
  }

  async updateMember(id, updates) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);

    if (!member) {
      return null;
    }

    Object.assign(member, updates);
    const { growthMeasurements, ...rest } = member;
    return rest;
  }

  async createHealthRecord(id, input) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);

    if (!member) {
      return null;
    }

    const record = {
      id: crypto.randomUUID(),
      category: input.category,
      value: input.value,
      unit: input.unit || "",
      notes: input.notes || "",
      recordedAt: input.recordedAt
    };

    member.healthDataRecords.unshift(record);
    return record;
  }

  async updateHealthRecord(id, recordId, input) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);
    const record = member?.healthDataRecords.find((entry) => entry.id === recordId);

    if (!record) {
      return null;
    }

    Object.assign(record, input);
    return record;
  }

  async deleteHealthRecord(id, recordId) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);

    if (!member) {
      return null;
    }

    const index = member.healthDataRecords.findIndex((entry) => entry.id === recordId);

    if (index === -1) {
      return null;
    }

    const [deletedRecord] = member.healthDataRecords.splice(index, 1);
    return deletedRecord;
  }

  async createGrowthMeasurement(id, input) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);

    if (!member) {
      return null;
    }

    const measurement = {
      id: crypto.randomUUID(),
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      measuredAt: input.measuredAt
    };

    member.growthMeasurements.push(measurement);
    member.growthMeasurements.sort(
      (left, right) => new Date(left.measuredAt) - new Date(right.measuredAt)
    );
    return measurement;
  }

  async updateGrowthMeasurement(id, measurementId, input) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);
    const measurement = member?.growthMeasurements.find((entry) => entry.id === measurementId);

    if (!measurement) {
      return null;
    }

    Object.assign(measurement, input);
    member.growthMeasurements.sort(
      (left, right) => new Date(left.measuredAt) - new Date(right.measuredAt)
    );
    return measurement;
  }

  async deleteGrowthMeasurement(id, measurementId) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);

    if (!member) {
      return null;
    }

    const index = member.growthMeasurements.findIndex((entry) => entry.id === measurementId);

    if (index === -1) {
      return null;
    }

    const [deletedMeasurement] = member.growthMeasurements.splice(index, 1);
    return deletedMeasurement;
  }

  async createExerciseLog(id, input) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);

    if (!member) {
      return null;
    }

    const exerciseLog = {
      id: crypto.randomUUID(),
      workoutType: input.workoutType,
      durationMinutes: input.durationMinutes,
      caloriesBurned: input.caloriesBurned,
      notes: input.notes || "",
      performedAt: input.performedAt
    };

    member.exerciseLogs.unshift(exerciseLog);
    return exerciseLog;
  }

  async updateExerciseLog(id, exerciseLogId, input) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);
    const exerciseLog = member?.exerciseLogs.find((entry) => entry.id === exerciseLogId);

    if (!exerciseLog) {
      return null;
    }

    Object.assign(exerciseLog, input);
    return exerciseLog;
  }

  async deleteExerciseLog(id, exerciseLogId) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);

    if (!member) {
      return null;
    }

    const index = member.exerciseLogs.findIndex((entry) => entry.id === exerciseLogId);

    if (index === -1) {
      return null;
    }

    const [deletedExerciseLog] = member.exerciseLogs.splice(index, 1);
    return deletedExerciseLog;
  }
}
