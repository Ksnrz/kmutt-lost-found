
const API_BASE_URL = 'http://localhost:3000/api';

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'x-test-user': '1',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }

  return data;
}
