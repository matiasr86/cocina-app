// src/api/ProjectsApi.js
import { http } from './http';

/**
 * La API responde:
 *  - GET /projects        -> { items: [...] }
 *  - POST /projects       -> { ok: true, project }
 *  - GET /projects/:id    -> { project }
 *  - PUT /projects/:id    -> { ok: true, project }
 *  - DELETE /projects/:id -> { ok: true }
 */

export const ProjectsApi = {
  async list(token) {
    const data = await http('GET', '/projects', undefined, token);
    // Normalizo a array por si en algún momento el shape cambia
    return Array.isArray(data) ? data : (data?.items || []);
  },

  async create(token, body) {
    // body debe tener: { title, kitchenType, walls, modulesByWall, quality?, summary?, breakdown? }
    const data = await http('POST', '/projects', body, token);
    return data?.project;
  },

  async read(token, id) {
    const data = await http('GET', `/projects/${id}`, undefined, token);
    return data?.project;
  },

  async update(token, id, patch) {
    const data = await http('PUT', `/projects/${id}`, patch, token);
    return data?.project;
  },

  async remove(token, id) {
    const data = await http('DELETE', `/projects/${id}`, undefined, token);
    return !!data?.ok;
  },
};
