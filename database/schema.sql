CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  family_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY,
  family_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  value NUMERIC(10, 2),
  unit TEXT,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS growth_measurements (
  id UUID PRIMARY KEY,
  family_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  height_cm NUMERIC(5, 2),
  weight_kg NUMERIC(5, 2),
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY,
  family_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  workout_type TEXT NOT NULL,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  performed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_records_family_member_recorded_at
  ON health_records (family_member_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_growth_measurements_family_member_measured_at
  ON growth_measurements (family_member_id, measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_family_member_performed_at
  ON exercise_logs (family_member_id, performed_at DESC);
