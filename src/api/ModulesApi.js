// src/api/ModulesApi.js
import { http } from './http';

export const ModulesApi = {
  getOverrides(adminToken) {
    return http('GET', '/overrides', undefined, adminToken);
  },

  setOverride(type, patch, adminToken) {
    return http(
      'PUT',
      `/overrides/${encodeURIComponent(type)}`,
      patch,
      adminToken
    );
  },

  resetOverrides(adminToken) {
    // mejor sin body para DELETE
    return http('DELETE', '/overrides', undefined, adminToken);
  },
};
