export function calculateAge(dateOfBirth, referenceDate = new Date()) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDifference = referenceDate.getMonth() - birthDate.getMonth();
  const hasBirthdayPassed =
    monthDifference > 0 ||
    (monthDifference === 0 && referenceDate.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
}

export function formatDisplayDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export function differenceInDays(startDateString, endDateString) {
  const start = new Date(startDateString);
  const end = new Date(endDateString);
  const milliseconds = end.getTime() - start.getTime();
  return Math.round(milliseconds / (1000 * 60 * 60 * 24));
}

