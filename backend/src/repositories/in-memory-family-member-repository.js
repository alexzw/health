import { seededFamilyMembers } from "../seed/family-members.js";

export class InMemoryFamilyMemberRepository {
  async list() {
    return seededFamilyMembers.map(({ growthMeasurements, ...member }) => member);
  }

  async findById(id) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);

    if (!member) {
      return null;
    }

    const { growthMeasurements, ...rest } = member;
    return rest;
  }

  async findGrowthByMemberId(id) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);
    return member?.growthMeasurements || [];
  }

  async findExerciseLogsByMemberId(id) {
    const member = seededFamilyMembers.find((entry) => entry.id === id);
    return member?.exerciseLogs || [];
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
}
