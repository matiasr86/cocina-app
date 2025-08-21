// src/api/ModulesApi.js
const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE_URL) ||
  'http://localhost:5175/api';

async function http(method, path, body, token) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-admin-token': token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const ModulesApi = {
  // Tu backend devuelve { byType: { [type]: { name, visible, prices, sizes } } }
  async getOverrides() {
    return http('GET', '/modules/overrides');
  },

  // Devuelve { ok, saved, byType }
  async setOverride(type, patch, adminToken) {
    return http('POST', `/modules/overrides/${encodeURIComponent(type)}`, patch, adminToken);
  },

  // Devuelve { ok: true, byType: {} }
  async resetOverrides(adminToken) {
    return http('POST', '/modules/overrides/reset', {}, adminToken);
  },
};
