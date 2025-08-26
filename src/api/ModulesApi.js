// src/api/ModulesApi.js
const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE_URL) ||
  'http://localhost:5175/api';

async function http(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`; // 👈 ahora Bearer

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const ModulesApi = {
  async getOverrides() {
    return http('GET', '/overrides');
  },
  async setOverride(type, patch, adminToken) {
    return http('PUT', `/overrides/${encodeURIComponent(type)}`, patch, adminToken);
  },
  // Tu backend expone DELETE /api/overrides (no /reset)
  async resetOverrides(adminToken) {
    return http('DELETE', '/overrides', {}, adminToken);
  },
};
