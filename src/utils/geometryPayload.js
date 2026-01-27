// src/utils/geometryPayload.js
// Payload geométrico minimalista para guiar al modelo sin "marearlo".
// Origen: abajo-izquierda. Unidades: centímetros.

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export function buildGeometryPayload({
  activeWall,
  modulesByWall,
  userText,
  frontsColor = null,
  countertopColor = null,
}) {
  const wall = activeWall || { id: 'front', name: 'Pared Frontal', width: 4, height: 3 };
  const mods = Array.isArray(modulesByWall?.[wall.id]) ? modulesByWall[wall.id] : [];

  // NOTA IMPORTANTE:
  // En tu app, m.y ya está medido desde el piso (bottom). Por eso NO lo invertimos.
  const items = mods.map((m) => ({
    id: m.id ?? null,
    type: m.type,
    aiTag: m.aiTag ?? null,
    row: m.row ?? m.ai?.row ?? null, // 'base' | 'upper' | 'tall' | 'skirting'
    x_cm: num(m.x),
    y_cm: num(m.y),               // origen abajo-izquierda
    width_cm: num(m.width),
    height_cm: num(m.height),
  }));

  return {
    version: 'geo.v1',
    priorities: ['copy_layout_exactly'],
    image_info: { origin: 'bottom-left', units: 'cm' },

    wall: {
      id: wall.id,
      name: wall.name || String(wall.id),
      width_m: num(wall.width, 4),
      height_m: num(wall.height, 3),
    },

    modules: items,

    style_prefs: {
      user_text: (userText || '').slice(0, 300), // breve
      fronts_color: frontsColor,
      countertop_color: countertopColor,
    },

    negative_rules: [
      'do_not_add_modules',
      'no_cyan_lines_or_overlays',
      'no_text_or_labels',
      'no_extra_shelves_or_columns',
    ],
  };
}

export default buildGeometryPayload;
