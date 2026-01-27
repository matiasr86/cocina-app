// src/api/config.js
// Lee la base de la API una sola vez y la exporta sin trailing slash
const raw =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE_URL) ||
  'http://localhost:4000/api';

// Para Server
/*
const raw =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE_URL) ||
  'https://easydesign.dekam.com.ar/api';

*/

export const API_BASE_URL = raw.replace(/\/+$/, '');
