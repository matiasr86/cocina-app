// src/api/ModulesApi.js
const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE_URL) ||
  'http://localhost:4000/api';

async function http(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Evitar cache del navegador para GET y forzar frescura
  let url = `${API_BASE_URL}${path}`;
  if (method === 'GET') {
    url += (path.includes('?') ? '&' : '?') + `_ts=${Date.now()}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const ModulesApi = {
  async getOverrides(adminToken) {
    return http('GET', '/overrides', undefined, adminToken);
  },
  async setOverride(type, patch, adminToken) {
    return http('PUT', `/overrides/${encodeURIComponent(type)}`, patch, adminToken);
  },
  async resetOverrides(adminToken) {
    return http('DELETE', '/overrides', {}, adminToken);
  },
};
