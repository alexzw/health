const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

async function handleResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `API request failed with status ${response.status}`);
  }

  return payload;
}

export async function getFamilyMembers() {
  const response = await fetch(`${API_BASE_URL}/family-members`, {
    cache: "no-store"
  });
  const payload = await handleResponse(response);
  return payload.data;
}

export async function getFamilyMember(id) {
  const response = await fetch(`${API_BASE_URL}/family-members/${id}`, {
    cache: "no-store"
  });
  const payload = await handleResponse(response);
  return payload.data;
}

export async function getGrowthTracking(id) {
  const response = await fetch(`${API_BASE_URL}/family-members/${id}/growth-tracking`, {
    cache: "no-store"
  });
  const payload = await handleResponse(response);
  return payload.data;
}

export async function updateFamilyMember(id, body) {
  const response = await fetch(`${API_BASE_URL}/family-members/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response);
  return payload.data;
}

export async function createHealthRecord(id, body) {
  const response = await fetch(`${API_BASE_URL}/family-members/${id}/health-records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response);
  return payload.data;
}

export async function updateHealthRecord(id, recordId, body) {
  const response = await fetch(`${API_BASE_URL}/family-members/${id}/health-records/${recordId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response);
  return payload.data;
}

export async function createGrowthMeasurement(id, body) {
  const response = await fetch(`${API_BASE_URL}/family-members/${id}/growth-tracking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response);
  return payload.data;
}

export async function updateGrowthMeasurement(id, measurementId, body) {
  const response = await fetch(
    `${API_BASE_URL}/family-members/${id}/growth-tracking/${measurementId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const payload = await handleResponse(response);
  return payload.data;
}

export async function createExerciseLog(id, body) {
  const response = await fetch(`${API_BASE_URL}/family-members/${id}/exercise-logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response);
  return payload.data;
}

export async function updateExerciseLog(id, exerciseLogId, body) {
  const response = await fetch(`${API_BASE_URL}/family-members/${id}/exercise-logs/${exerciseLogId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response);
  return payload.data;
}

export async function importAppleHealth(memberId, file) {
  const formData = new FormData();
  formData.append("familyMemberId", memberId);
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/apple-health/import`, {
    method: "POST",
    body: formData
  });

  const payload = await handleResponse(response);
  return payload.data;
}
