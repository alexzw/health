export function calculateBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) {
    return null;
  }

  const heightM = heightCm / 100;

  if (!heightM) {
    return null;
  }

  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

