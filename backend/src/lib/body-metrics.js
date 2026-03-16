function round(value) {
  return Math.round(value * 10) / 10;
}

export function calculateBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) {
    return null;
  }

  const heightM = heightCm / 100;

  if (!heightM) {
    return null;
  }

  return round(weightKg / (heightM * heightM));
}

export function findLatestMetric(records, category) {
  const candidates = records
    .filter((record) => record.category === category && record.value !== null && record.value !== undefined)
    .sort((left, right) => new Date(right.recordedAt) - new Date(left.recordedAt));

  return candidates[0] || null;
}

