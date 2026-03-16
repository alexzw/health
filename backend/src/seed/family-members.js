export const seededFamilyMembers = [
  {
    id: "alex",
    name: "Alex",
    dateOfBirth: "1992-02-21",
    gender: "Male",
    familyRole: "Father",
    healthDataRecords: [
      {
        id: "09090909-0909-0909-0909-090909090909",
        category: "height",
        value: 176,
        unit: "cm",
        notes: "Baseline height",
        recordedAt: "2025-11-12T08:00:00Z"
      },
      {
        id: "10101010-1010-1010-1010-101010101010",
        category: "weight",
        value: 79.3,
        unit: "kg",
        notes: "Monthly baseline",
        recordedAt: "2025-11-12T08:00:00Z"
      },
      {
        id: "12121212-1212-1212-1212-121212121212",
        category: "weight",
        value: 78.9,
        unit: "kg",
        notes: "Post-training week",
        recordedAt: "2026-01-18T08:00:00Z"
      },
      {
        id: "11111111-1111-1111-1111-111111111111",
        category: "weight",
        value: 78.4,
        unit: "kg",
        notes: "Weekly weigh-in",
        recordedAt: "2026-03-10T08:00:00Z"
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        category: "resting_heart_rate",
        value: 58,
        unit: "bpm",
        notes: "Captured from Apple Watch summary",
        recordedAt: "2026-03-10T08:00:00Z"
      }
    ],
    growthMeasurements: [],
    exerciseLogs: [
      {
        id: "13131313-1313-1313-1313-131313131313",
        workoutType: "Strength Training",
        durationMinutes: 55,
        caloriesBurned: 410,
        notes: "Upper body session",
        performedAt: "2026-03-08T07:00:00Z"
      },
      {
        id: "14141414-1414-1414-1414-141414141414",
        workoutType: "Running",
        durationMinutes: 32,
        caloriesBurned: 325,
        notes: "Steady pace 5K",
        performedAt: "2026-03-12T06:45:00Z"
      }
    ]
  },
  {
    id: "amelie",
    name: "Amelie",
    dateOfBirth: "1991-03-27",
    gender: "Female",
    familyRole: "Mother",
    healthDataRecords: [
      {
        id: "18181818-1818-1818-1818-181818181818",
        category: "height",
        value: 165,
        unit: "cm",
        notes: "Baseline height",
        recordedAt: "2025-12-06T08:00:00Z"
      },
      {
        id: "15151515-1515-1515-1515-151515151515",
        category: "weight",
        value: 62.1,
        unit: "kg",
        notes: "Monthly check-in",
        recordedAt: "2025-12-06T08:00:00Z"
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        category: "weight",
        value: 61.2,
        unit: "kg",
        notes: "Post-workout check-in",
        recordedAt: "2026-03-12T08:00:00Z"
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        category: "sleep",
        value: 7.5,
        unit: "hours",
        notes: "Average overnight sleep",
        recordedAt: "2026-03-12T08:00:00Z"
      }
    ],
    growthMeasurements: [],
    exerciseLogs: [
      {
        id: "16161616-1616-1616-1616-161616161616",
        workoutType: "Cardio",
        durationMinutes: 40,
        caloriesBurned: 290,
        notes: "Indoor cycling",
        performedAt: "2026-03-07T18:30:00Z"
      },
      {
        id: "17171717-1717-1717-1717-171717171717",
        workoutType: "Gym Workout",
        durationMinutes: 48,
        caloriesBurned: 360,
        notes: "Leg day",
        performedAt: "2026-03-13T18:10:00Z"
      }
    ]
  },
  {
    id: "ryan",
    name: "Ryan",
    dateOfBirth: "2019-09-05",
    gender: "Male",
    familyRole: "Child",
    healthDataRecords: [
      {
        id: "55555555-5555-5555-5555-555555555555",
        category: "height",
        value: 128,
        unit: "cm",
        notes: "Monthly growth check",
        recordedAt: "2026-03-09T08:00:00Z"
      },
      {
        id: "66666666-6666-6666-6666-666666666666",
        category: "weight",
        value: 27.3,
        unit: "kg",
        notes: "Monthly growth check",
        recordedAt: "2026-03-09T08:00:00Z"
      }
    ],
    growthMeasurements: [
      {
        id: "77777777-7777-7777-7777-777777777777",
        heightCm: 108.2,
        weightKg: 18.9,
        measuredAt: "2023-12-05T08:00:00Z"
      },
      {
        id: "88888888-8888-8888-8888-888888888888",
        heightCm: 114.8,
        weightKg: 20.7,
        measuredAt: "2024-06-10T08:00:00Z"
      },
      {
        id: "99999999-9999-9999-9999-999999999999",
        heightCm: 120.1,
        weightKg: 23.5,
        measuredAt: "2025-01-18T08:00:00Z"
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        heightCm: 124.6,
        weightKg: 25.8,
        measuredAt: "2025-09-14T08:00:00Z"
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        heightCm: 128,
        weightKg: 27.3,
        measuredAt: "2026-03-09T08:00:00Z"
      }
    ],
    exerciseLogs: []
  }
];
