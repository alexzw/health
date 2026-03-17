INSERT INTO family_members (id, name, date_of_birth, gender, family_role)
VALUES
  ('alex', 'Alex', '1992-02-21', 'Male', 'Father'),
  ('amelie', 'Amelie', '1991-03-27', 'Female', 'Mother'),
  ('ryan', 'Ryan', '2019-09-05', 'Male', 'Child')
ON CONFLICT (id) DO NOTHING;

INSERT INTO health_records (id, family_member_id, category, value, unit, notes, recorded_at)
VALUES
  ('09090909-0909-0909-0909-090909090909', 'alex', 'height', 176, 'cm', 'Baseline height', '2025-11-12T08:00:00Z'),
  ('10101010-1010-1010-1010-101010101010', 'alex', 'weight', 79.3, 'kg', 'Monthly baseline', '2025-11-12T08:00:00Z'),
  ('12121212-1212-1212-1212-121212121212', 'alex', 'weight', 78.9, 'kg', 'Post-training week', '2026-01-18T08:00:00Z'),
  ('11111111-1111-1111-1111-111111111111', 'alex', 'weight', 78.4, 'kg', 'Weekly weigh-in', '2026-03-10T08:00:00Z'),
  ('22222222-2222-2222-2222-222222222222', 'alex', 'resting_heart_rate', 58, 'bpm', 'Captured from Apple Watch summary', '2026-03-10T08:00:00Z'),
  ('18181818-1818-1818-1818-181818181818', 'amelie', 'height', 165, 'cm', 'Baseline height', '2025-12-06T08:00:00Z'),
  ('15151515-1515-1515-1515-151515151515', 'amelie', 'weight', 62.1, 'kg', 'Monthly check-in', '2025-12-06T08:00:00Z'),
  ('33333333-3333-3333-3333-333333333333', 'amelie', 'weight', 61.2, 'kg', 'Post-workout check-in', '2026-03-12T08:00:00Z'),
  ('44444444-4444-4444-4444-444444444444', 'amelie', 'sleep', 7.5, 'hours', 'Average overnight sleep', '2026-03-12T08:00:00Z'),
  ('55555555-5555-5555-5555-555555555555', 'ryan', 'height', 128.0, 'cm', 'Monthly growth check', '2026-03-09T08:00:00Z'),
  ('66666666-6666-6666-6666-666666666666', 'ryan', 'weight', 27.3, 'kg', 'Monthly growth check', '2026-03-09T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO growth_measurements (id, family_member_id, height_cm, weight_kg, measured_at)
VALUES
  ('77777777-7777-7777-7777-777777777777', 'ryan', 108.2, 18.9, '2023-12-05T08:00:00Z'),
  ('88888888-8888-8888-8888-888888888888', 'ryan', 114.8, 20.7, '2024-06-10T08:00:00Z'),
  ('99999999-9999-9999-9999-999999999999', 'ryan', 120.1, 23.5, '2025-01-18T08:00:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ryan', 124.6, 25.8, '2025-09-14T08:00:00Z'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ryan', 128.0, 27.3, '2026-03-09T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO exercise_logs (id, family_member_id, workout_type, duration_minutes, calories_burned, notes, performed_at)
VALUES
  ('13131313-1313-1313-1313-131313131313', 'alex', 'Strength Training', 55, 410, 'Upper body session', '2026-03-08T07:00:00Z'),
  ('14141414-1414-1414-1414-141414141414', 'alex', 'Running', 32, 325, 'Steady pace 5K', '2026-03-12T06:45:00Z'),
  ('16161616-1616-1616-1616-161616161616', 'amelie', 'Cardio', 40, 290, 'Indoor cycling', '2026-03-07T18:30:00Z'),
  ('17171717-1717-1717-1717-171717171717', 'amelie', 'Gym Workout', 48, 360, 'Leg day', '2026-03-13T18:10:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO weekly_goals (id, family_member_id, slug, title, target_value, unit, cadence, notes, is_completed)
VALUES
  ('20111111-1111-1111-1111-111111111111', 'alex', 'weight-checkins', 'Weight Check-Ins', 4, 'times', 'weekly', 'Log weight 3 to 5 times each week.', FALSE),
  ('20222222-2222-2222-2222-222222222222', 'alex', 'daily-steps-floor', 'Daily Steps Floor', 10000, 'steps', 'weekly', 'Keep daily activity stable for fat loss.', FALSE),
  ('20333333-3333-3333-3333-333333333333', 'alex', 'planned-workouts', 'Planned Workouts', 3, 'sessions', 'weekly', 'Protect muscle while losing weight.', FALSE),
  ('20444444-4444-4444-4444-444444444444', 'amelie', 'strength-sessions', 'Strength Sessions', 3, 'sessions', 'weekly', 'Build a repeatable shaping routine.', FALSE),
  ('20555555-5555-5555-5555-555555555555', 'amelie', 'active-days', 'Active Days', 5, 'days', 'weekly', 'Stay consistent outside formal workouts.', FALSE),
  ('20666666-6666-6666-6666-666666666666', 'amelie', 'sleep-floor', 'Sleep Floor', 7, 'hours', 'weekly', 'Recovery helps body recomposition.', FALSE),
  ('20777777-7777-7777-7777-777777777777', 'ryan', 'height-check', 'Height Check', 1, 'time', 'monthly', 'Measure height once each month.', FALSE),
  ('20888888-8888-8888-8888-888888888888', 'ryan', 'weight-check', 'Weight Check', 1, 'time', 'monthly', 'Record weight together with height.', FALSE),
  ('20999999-9999-9999-9999-999999999999', 'ryan', 'growth-review', 'Growth Review', 1, 'review', 'monthly', 'Review trend instead of one isolated record.', FALSE)
ON CONFLICT (family_member_id, slug) DO NOTHING;
