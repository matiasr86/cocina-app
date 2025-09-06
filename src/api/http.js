// src/api/http.js
//Local

export const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE_URL) ||
  'http://localhost:4000/api';


//Server
/*
export const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE_URL) ||
  'https://easydesign.dekam.com.ar/api';
  */

export async function http(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = `${API_BASE_URL}${path}`;
  if (method === 'GET') {
    url += (url.includes('?') ? '&' : '?') + `_ts=${Date.now()}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  // Intentamos parsear siempre la respuesta (éxito o error)
  const text = await res.text().catch(() => '');
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.statusText = res.statusText;
    err.data = data; // <- acá viene { error, message } si tu API lo manda
    throw err;
  }

  return data;
}
