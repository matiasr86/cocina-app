// front/src/utils/renderPayload.js
// Recibe: { activeWall, modulesByWall, quality, kitchenType, catalog }
// Devuelve: { quality, wall, kitchenType, modules: [...] } con aiHints por módulo.

export function buildRenderPayload({ activeWall, modulesByWall, quality, kitchenType, catalog }) {
  const wall = activeWall || {};
  const activeWallId = activeWall?.id || 'front';
  const placed = Array.isArray(modulesByWall?.[activeWallId]) ? modulesByWall[activeWallId] : [];

  // Índice por type para recuperar meta (aiHints, row, etc.)
  const byType = new Map((catalog || []).map(m => [m.type, m]));

  const modules = placed.map(m => {
    const meta = byType.get(m.type) || {};
    return {
      type: m.type,
      title: m.title || meta.title || m.type,
      width: Number(m.width) || null,
      height: Number(m.height) || null,
      row: m.row || meta.row || null,
      // 👇 pasamos todas las variantes por si querés por-calidad
      aiHints: meta.aiHints || null,
      // si preferís pasar un string ya resuelto, podés agregar:
      // aiHint: meta.aiHints?.[quality] || meta.aiHints?.common || null,
    };
  });

  return {
    quality: quality || 'premium',
    wall: {
      id: activeWallId,
      width: Number(wall.width) || 4,
      height: Number(wall.height) || 2.6,
    },
    kitchenType: kitchenType || 'Recta',
    modules,
  };
}
