import { getPool } from "../db/pool.js";

function mapRowToMember(row) {
  return {
    id: row.id,
    name: row.name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    familyRole: row.family_role,
    healthDataRecords: row.health_data_records || [],
    exerciseLogs: row.exercise_logs || []
  };
}

function mapHealthRecordRow(row) {
  return {
    id: row.id,
    category: row.category,
    value: row.value === null ? null : Number(row.value),
    unit: row.unit,
    notes: row.notes,
    recordedAt: row.recorded_at
  };
}

function mapGrowthMeasurementRow(row) {
  return {
    id: row.id,
    heightCm: Number(row.height_cm),
    weightKg: Number(row.weight_kg),
    measuredAt: row.measured_at
  };
}

function mapExerciseLogRow(row) {
  return {
    id: row.id,
    workoutType: row.workout_type,
    durationMinutes: row.duration_minutes,
    caloriesBurned: row.calories_burned,
    notes: row.notes,
    performedAt: row.performed_at
  };
}

const memberProjection = `
  fm.id,
  fm.name,
  TO_CHAR(fm.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
  fm.gender,
  fm.family_role,
  COALESCE((
    SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', hr.id,
        'category', hr.category,
        'value', hr.value,
        'unit', hr.unit,
        'notes', hr.notes,
        'recordedAt', hr.recorded_at
      )
      ORDER BY hr.recorded_at DESC
    )
    FROM health_records hr
    WHERE hr.family_member_id = fm.id
  ), '[]'::json) AS health_data_records,
  COALESCE((
    SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', el.id,
        'workoutType', el.workout_type,
        'durationMinutes', el.duration_minutes,
        'caloriesBurned', el.calories_burned,
        'notes', el.notes,
        'performedAt', el.performed_at
      )
      ORDER BY el.performed_at DESC
    )
    FROM exercise_logs el
    WHERE el.family_member_id = fm.id
  ), '[]'::json) AS exercise_logs
`;

export class PostgresFamilyMemberRepository {
  async list() {
    const pool = getPool();
    const result = await pool.query(`
      SELECT
        ${memberProjection}
      FROM family_members fm
      ORDER BY
        CASE fm.family_role
          WHEN 'Father' THEN 1
          WHEN 'Mother' THEN 2
          WHEN 'Child' THEN 3
          ELSE 4
        END,
        fm.name ASC;
    `);

    return result.rows.map(mapRowToMember);
  }

  async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT
          ${memberProjection}
        FROM family_members fm
        WHERE fm.id = $1;
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapRowToMember(result.rows[0]);
  }

  async findGrowthByMemberId(id) {
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT id, height_cm, weight_kg, measured_at
        FROM growth_measurements
        WHERE family_member_id = $1
        ORDER BY measured_at ASC;
      `,
      [id]
    );

    return result.rows.map(mapGrowthMeasurementRow);
  }

  async findExerciseLogsByMemberId(id) {
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT id, workout_type, duration_minutes, calories_burned, notes, performed_at
        FROM exercise_logs
        WHERE family_member_id = $1
        ORDER BY performed_at DESC;
      `,
      [id]
    );

    return result.rows.map(mapExerciseLogRow);
  }

  async updateMember(id, updates) {
    const pool = getPool();
    await pool.query(
      `
        UPDATE family_members
        SET
          name = COALESCE($2, name),
          date_of_birth = COALESCE($3, date_of_birth),
          gender = COALESCE($4, gender),
          updated_at = NOW()
        WHERE id = $1;
      `,
      [id, updates.name || null, updates.dateOfBirth || null, updates.gender || null]
    );

    return this.findById(id);
  }

  async createHealthRecord(id, input) {
    const pool = getPool();
    const recordId = crypto.randomUUID();
    const result = await pool.query(
      `
        INSERT INTO health_records (id, family_member_id, category, value, unit, notes, recorded_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, category, value, unit, notes, recorded_at;
      `,
      [recordId, id, input.category, input.value, input.unit, input.notes, input.recordedAt]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapHealthRecordRow(result.rows[0]);
  }

  async updateHealthRecord(id, recordId, input) {
    const pool = getPool();
    const result = await pool.query(
      `
        UPDATE health_records
        SET
          category = COALESCE($3, category),
          value = COALESCE($4, value),
          unit = COALESCE($5, unit),
          notes = COALESCE($6, notes),
          recorded_at = COALESCE($7, recorded_at)
        WHERE family_member_id = $1 AND id = $2
        RETURNING id, category, value, unit, notes, recorded_at;
      `,
      [
        id,
        recordId,
        input.category || null,
        input.value ?? null,
        input.unit ?? null,
        input.notes ?? null,
        input.recordedAt ?? null
      ]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapHealthRecordRow(result.rows[0]);
  }

  async createGrowthMeasurement(id, input) {
    const pool = getPool();
    const measurementId = crypto.randomUUID();
    const result = await pool.query(
      `
        INSERT INTO growth_measurements (id, family_member_id, height_cm, weight_kg, measured_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, height_cm, weight_kg, measured_at;
      `,
      [measurementId, id, input.heightCm, input.weightKg, input.measuredAt]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapGrowthMeasurementRow(result.rows[0]);
  }

  async updateGrowthMeasurement(id, measurementId, input) {
    const pool = getPool();
    const result = await pool.query(
      `
        UPDATE growth_measurements
        SET
          height_cm = COALESCE($3, height_cm),
          weight_kg = COALESCE($4, weight_kg),
          measured_at = COALESCE($5, measured_at)
        WHERE family_member_id = $1 AND id = $2
        RETURNING id, height_cm, weight_kg, measured_at;
      `,
      [id, measurementId, input.heightCm ?? null, input.weightKg ?? null, input.measuredAt ?? null]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapGrowthMeasurementRow(result.rows[0]);
  }

  async createExerciseLog(id, input) {
    const pool = getPool();
    const exerciseLogId = crypto.randomUUID();
    const result = await pool.query(
      `
        INSERT INTO exercise_logs (
          id,
          family_member_id,
          workout_type,
          duration_minutes,
          calories_burned,
          notes,
          performed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, workout_type, duration_minutes, calories_burned, notes, performed_at;
      `,
      [
        exerciseLogId,
        id,
        input.workoutType,
        input.durationMinutes,
        input.caloriesBurned,
        input.notes,
        input.performedAt
      ]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapExerciseLogRow(result.rows[0]);
  }

  async updateExerciseLog(id, exerciseLogId, input) {
    const pool = getPool();
    const result = await pool.query(
      `
        UPDATE exercise_logs
        SET
          workout_type = COALESCE($3, workout_type),
          duration_minutes = COALESCE($4, duration_minutes),
          calories_burned = COALESCE($5, calories_burned),
          notes = COALESCE($6, notes),
          performed_at = COALESCE($7, performed_at)
        WHERE family_member_id = $1 AND id = $2
        RETURNING id, workout_type, duration_minutes, calories_burned, notes, performed_at;
      `,
      [
        id,
        exerciseLogId,
        input.workoutType ?? null,
        input.durationMinutes ?? null,
        input.caloriesBurned ?? null,
        input.notes ?? null,
        input.performedAt ?? null
      ]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapExerciseLogRow(result.rows[0]);
  }
}
