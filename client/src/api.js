// fetch wrapper: adds the JWT from localStorage, returns parsed JSON,
// throws Error(server message) with .status on non-2xx.
export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(path, {
    method,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'เกิดข้อผิดพลาด'), { status: res.status });
  return data;
}

// Fetch-style variant for post pages: takes raw fetch options (FormData / pre-stringified body).
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers: { ...(token && { Authorization: `Bearer ${token}` }), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'), { status: res.status });
  return data;
}