const API_BASE = '';

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : { error: await response.text() };

  if (!response.ok) {
    const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

export async function apiJson(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  return handleResponse(response);
}

export async function getProfileAnalysis(username) {
  const clean = String(username || '').trim();
  if (!clean) throw new Error('GitHub username is required.');
  return apiJson(`/api/analysis/${encodeURIComponent(clean)}`);
}

export async function compareProfiles(user1, user2) {
  if (!user1 || !user2) throw new Error('Both GitHub usernames are required.');
  if (String(user1).trim().toLowerCase() === String(user2).trim().toLowerCase()) {
    throw new Error('Choose a different GitHub profile to compare against your own.');
  }

  return apiJson(`/api/compare?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`);
}
export async function evaluateInterview(question, answer, userContext = {}) {
  return apiJson('/api/interview/evaluate', {
    method: 'POST',
    body: JSON.stringify({ question, answer, userContext }),
  });
}