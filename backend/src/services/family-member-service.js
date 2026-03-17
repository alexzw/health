import { calculateAge, formatDisplayDate } from "../lib/date.js";
import { calculateBmi, findLatestMetric } from "../lib/body-metrics.js";
import { analyzeGrowthMeasurements } from "../lib/growth.js";
import { buildHealthDashboardSummary } from "../lib/health-dashboard.js";
import { HttpError } from "../lib/http-error.js";

function normalizeIsoDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function buildDerivedGrowthMeasurements(member) {
  const groupedMeasurements = new Map();

  for (const record of member.healthDataRecords || []) {
    if (!["height", "weight"].includes(record.category)) {
      continue;
    }

    const measuredAt = normalizeIsoDate(record.recordedAt);

    if (!measuredAt) {
      continue;
    }

    const existingEntry = groupedMeasurements.get(measuredAt) || {
      id: `derived-${measuredAt}`,
      measuredAt,
      heightCm: null,
      weightKg: null
    };

    if (record.category === "height") {
      existingEntry.heightCm = Number(record.value);
    }

    if (record.category === "weight") {
      existingEntry.weightKg = Number(record.value);
    }

    groupedMeasurements.set(measuredAt, existingEntry);
  }

  return Array.from(groupedMeasurements.values())
    .filter((measurement) => measurement.heightCm !== null || measurement.weightKg !== null)
    .sort((left, right) => new Date(left.measuredAt) - new Date(right.measuredAt));
}

function presentMember(member) {
  const latestWeight =
    member.latestMetrics?.weight || findLatestMetric(member.healthDataRecords || [], "weight");
  const latestHeight =
    member.latestMetrics?.height || findLatestMetric(member.healthDataRecords || [], "height");

  return {
    ...member,
    age: calculateAge(member.dateOfBirth),
    dateOfBirthDisplay: formatDisplayDate(member.dateOfBirth),
    latestBmi: calculateBmi(latestWeight?.value || null, latestHeight?.value || null)
  };
}

function ensureNonEmpty(value, message) {
  if (!String(value || "").trim()) {
    throw new HttpError(400, message);
  }
}

function parseOptionalNumber(value, fieldName) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    throw new HttpError(400, `${fieldName} 必須是數字`);
  }

  return parsedValue;
}

export class FamilyMemberService {
  constructor(repository) {
    this.repository = repository;
  }

  async listFamilyMembers() {
    const members = await this.repository.list();
    return members.map(presentMember);
  }

  async getFamilyMember(id) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    const trendCategories = ["weight", "steps", "heart_rate", "resting_heart_rate", "sleep"];
    const trendEntries = await Promise.all(
      trendCategories.map(async (category) => [
        category,
        await this.repository.findMetricTrendByMemberId(id, category, 30)
      ])
    );

    const presentedMember = presentMember({
      ...member,
      metricTrends: Object.fromEntries(trendEntries)
    });

    if (presentedMember.familyRole !== "Child") {
      return {
        ...presentedMember,
        dashboard: buildHealthDashboardSummary(presentedMember)
      };
    }

    return presentedMember;
  }

  async getGrowthTracking(id) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    const growth = await this.repository.findGrowthByMemberId(id);
    const effectiveGrowth = growth.length ? growth : buildDerivedGrowthMeasurements(member);

    return {
      member: presentMember(member),
      ...analyzeGrowthMeasurements(effectiveGrowth)
    };
  }

  async updateFamilyMember(id, updates) {
    if (updates.name !== undefined) {
      ensureNonEmpty(updates.name, "姓名不能為空");
    }

    if (updates.dateOfBirth !== undefined) {
      ensureNonEmpty(updates.dateOfBirth, "生日不能為空");
    }

    const updatedMember = await this.repository.updateMember(id, updates);

    if (!updatedMember) {
      return null;
    }

    return presentMember(updatedMember);
  }

  async addHealthRecord(id, input) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    ensureNonEmpty(input.category, "請填寫紀錄類型");

    return this.repository.createHealthRecord(id, {
      category: String(input.category).trim(),
      value: parseOptionalNumber(input.value, "數值"),
      unit: String(input.unit || "").trim(),
      notes: String(input.notes || "").trim(),
      recordedAt: input.recordedAt || new Date().toISOString()
    });
  }

  async updateHealthRecord(id, recordId, input) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    const payload = {};

    if (input.category !== undefined) {
      ensureNonEmpty(input.category, "請填寫紀錄類型");
      payload.category = String(input.category).trim();
    }

    if (input.value !== undefined) {
      payload.value = parseOptionalNumber(input.value, "數值");
    }

    if (input.unit !== undefined) {
      payload.unit = String(input.unit || "").trim();
    }

    if (input.notes !== undefined) {
      payload.notes = String(input.notes || "").trim();
    }

    if (input.recordedAt !== undefined) {
      ensureNonEmpty(input.recordedAt, "請填寫紀錄日期");
      payload.recordedAt = input.recordedAt;
    }

    return this.repository.updateHealthRecord(id, recordId, payload);
  }

  async deleteHealthRecord(id, recordId) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    return this.repository.deleteHealthRecord(id, recordId);
  }

  async addGrowthMeasurement(id, input) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    if (member.familyRole !== "Child") {
      throw new HttpError(400, "只有兒童檔案可以新增成長數據");
    }

    if (
      (input.heightCm === undefined || input.heightCm === "") &&
      (input.weightKg === undefined || input.weightKg === "")
    ) {
      throw new HttpError(400, "請至少填寫身高或體重其中一項");
    }

    return this.repository.createGrowthMeasurement(id, {
      heightCm: parseOptionalNumber(input.heightCm, "身高"),
      weightKg: parseOptionalNumber(input.weightKg, "體重"),
      measuredAt: input.measuredAt || new Date().toISOString()
    });
  }

  async updateGrowthMeasurement(id, measurementId, input) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    const payload = {};

    if (input.heightCm !== undefined) {
      payload.heightCm = parseOptionalNumber(input.heightCm, "身高");
    }

    if (input.weightKg !== undefined) {
      payload.weightKg = parseOptionalNumber(input.weightKg, "體重");
    }

    if (input.measuredAt !== undefined) {
      ensureNonEmpty(input.measuredAt, "請填寫測量日期");
      payload.measuredAt = input.measuredAt;
    }

    if (Object.keys(payload).length === 0) {
      throw new HttpError(400, "沒有可更新的成長資料");
    }

    return this.repository.updateGrowthMeasurement(id, measurementId, payload);
  }

  async deleteGrowthMeasurement(id, measurementId) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    return this.repository.deleteGrowthMeasurement(id, measurementId);
  }

  async addExerciseLog(id, input) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    if (member.familyRole === "Child") {
      throw new HttpError(400, "兒童檔案暫時不支援運動紀錄");
    }

    ensureNonEmpty(input.workoutType, "請填寫運動類型");

    return this.repository.createExerciseLog(id, {
      workoutType: String(input.workoutType).trim(),
      durationMinutes: parseOptionalNumber(input.durationMinutes, "運動時長"),
      caloriesBurned: parseOptionalNumber(input.caloriesBurned, "卡路里"),
      notes: String(input.notes || "").trim(),
      performedAt: input.performedAt || new Date().toISOString()
    });
  }

  async updateExerciseLog(id, exerciseLogId, input) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    const payload = {};

    if (input.workoutType !== undefined) {
      ensureNonEmpty(input.workoutType, "請填寫運動類型");
      payload.workoutType = String(input.workoutType).trim();
    }

    if (input.durationMinutes !== undefined) {
      payload.durationMinutes = parseOptionalNumber(input.durationMinutes, "運動時長");
    }

    if (input.caloriesBurned !== undefined) {
      payload.caloriesBurned = parseOptionalNumber(input.caloriesBurned, "卡路里");
    }

    if (input.notes !== undefined) {
      payload.notes = String(input.notes || "").trim();
    }

    if (input.performedAt !== undefined) {
      ensureNonEmpty(input.performedAt, "請填寫運動日期");
      payload.performedAt = input.performedAt;
    }

    if (Object.keys(payload).length === 0) {
      throw new HttpError(400, "沒有可更新的運動資料");
    }

    return this.repository.updateExerciseLog(id, exerciseLogId, payload);
  }

  async deleteExerciseLog(id, exerciseLogId) {
    const member = await this.repository.findById(id);

    if (!member) {
      return null;
    }

    return this.repository.deleteExerciseLog(id, exerciseLogId);
  }
}
