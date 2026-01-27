// src/utils/renderPayload.js
// Payload "estricto" para guiar al modelo SIN guías visuales.
// La imagen manda; el inventario y geometría cierran la puerta a inventos.

const asNumber = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const byTypeMap = (catalog = []) => {
  const map = new Map();
  for (const m of catalog) map.set(m.type, m);
  return map;
};

// ---- Heurísticas útiles para el back (no rompen nada) ----
function isBridge(mod) {
  const ai  = mod?.ai || {};
  const t   = String(mod?.type || '').toUpperCase();
  const tag = String(mod?.aiTag || '').toUpperCase();
  const shp = String(ai.shape || '');
  return (
    ai.bridge === true ||
    ai.subfamily === 'upperBridge' ||
    shp.startsWith('upper-bridge') ||
    t.includes('ALA60') || t.includes('ALAH60') || t.includes('EXTRA60') ||
    tag.startsWith('AP-')
  );
}
function isFridge(mod) {
  const ai  = mod?.ai || {};
  const t   = String(mod?.type || '').toUpperCase();
  const tag = String(mod?.aiTag || '').toUpperCase();
  const shp = String(ai.shape || '');
  return (
    t.includes('FRIDGE') || tag.includes('FRIDGE') || shp.startsWith('appliance-fridge')
  );
}

// Mezcla instancia del canvas con metadata del catálogo
function normalizeModule(instance, meta) {
  const ai = { ...(meta?.ai || {}), ...(instance?.ai || {}) };

  const item = {
    id: instance.id || instance._id || `${instance.type}-${Math.random().toString(36).slice(2, 8)}`,
    type: instance.type,
    aiTag: instance.aiTag || meta?.aiTag || null,
    title: meta?.title || instance.title || instance.type,
    row: instance.row || ai.row || 'base', // base | upper | tall | skirting

    // ⚠️ Coordenadas y tamaño en CENTÍMETROS.
    // Origen: esquina inferior izquierda de la pared (y=0 es el piso).
    x_cm: asNumber(instance.x, 0),
    y_cm: asNumber(instance.y, 0),
    width_cm: asNumber(instance.width, meta?.width ?? 0),
    height_cm: asNumber(instance.height, meta?.height ?? 0),

    ai: {
      ...ai,
      depth_cm: ai.depth_cm ?? null,
      family: ai.family || null,
      subfamily: ai.subfamily || null,
      front_plane: ai.front_plane || null,
      column: !!ai.column,
      shape: ai.shape || null,
      doors: typeof ai.doors === 'number' ? ai.doors : null,
      drawers: typeof ai.drawers === 'number' ? ai.drawers : null,
      open: !!ai.open,
      hinge: ai.hinge || null,
      extractor: !!ai.extractor,
      appliance: ai.appliance || null,
      corner: !!ai.corner,
      cornerSide: ai.cornerSide || null,
      bridge: !!ai.bridge,
      bbox_policy: ai.bbox_policy || 'strict',
      allow_autofill: ai.allow_autofill === true ? true : false,
      visual_signature: ai.visual_signature || null,
    },
  };
  return item;
}

function sortByX(a, b) {
  if (a.x_cm === b.x_cm) return a.width_cm - b.width_cm;
  return a.x_cm - b.x_cm;
}

function groupByRow(mods) {
  const rows = { base: [], upper: [], tall: [], skirting: [] };
  for (const m of mods) {
    const key =
      m.row === 'upper' ? 'upper' :
      m.row === 'tall' ? 'tall' :
      m.row === 'skirting' ? 'skirting' :
      'base';
    rows[key].push(m);
  }
  Object.values(rows).forEach((arr) => arr.sort(sortByX));
  return rows;
}

function toSequenceStrings(rows) {
  const f = (arr) => arr.map((m) => `${m.aiTag || m.type}@${m.x_cm}`);
  return {
    base: f(rows.base),
    upper: f(rows.upper),
    tall: f(rows.tall),
    skirting: f(rows.skirting),
  };
}

function toSequenceDetailed(rows) {
  const g = (arr) =>
    arr.map((m) => ({
      id: m.id,
      tag: m.aiTag || null,
      type: m.type,
      x_cm: m.x_cm,
      width_cm: m.width_cm,
      doors: m.ai?.doors ?? null,
      drawers: m.ai?.drawers ?? null,
      shape: m.ai?.shape || null,
      bridge: !!m.ai?.bridge,
      corner: !!m.ai?.corner,
      column: !!m.ai?.column,
    }));
  return {
    base: g(rows.base),
    upper: g(rows.upper),
    tall: g(rows.tall),
    skirting: g(rows.skirting),
  };
}

function counts(mods) {
  const byType = new Map();
  const byTag = new Map();
  const byFamily = new Map();

  for (const m of mods) {
    byType.set(m.type, (byType.get(m.type) || 0) + 1);
    const tag = m.aiTag || m.type;
    byTag.set(tag, (byTag.get(tag) || 0) + 1);
    const fam = m.ai?.family || 'base';
    byFamily.set(fam, (byFamily.get(fam) || 0) + 1);
  }

  return {
    byType: Object.fromEntries(byType),
    byTag: Object.fromEntries(byTag),
    byFamily: Object.fromEntries(byFamily),
  };
}

function styleFromQuality(q) {
  if (q === 'deluxe')  return { quality: 'deluxe',  handles: 'none', gola: 'hidden'  };
  if (q === 'premium') return { quality: 'premium', handles: 'none', gola: 'visible' };
  return { quality: 'started', handles: 'bar', gola: 'none' };
}

/**
 * buildRenderPayload v4
 *  - Enfasis: imagen + inventario exacto (geometría y orden). Sin guías.
 *  - NOTA: el texto del usuario se adjunta en AppLayout como payload.userText
 */
export function buildRenderPayload({
  activeWall,
  modulesByWall,
  kitchenType = 'Recta',
  catalog = [],
  quality = 'premium',
  wallHex = '#272626', // color de pared/fondo (para que no se confunda con módulos)
  bridgeStrict = false, // ← opcional: checkbox "cocina tipo puente"
} = {}) {
  const wallId = activeWall?.id || 'front';
  const wall = {
    id: wallId,
    name: activeWall?.name || 'Pared Frontal',
    width_m: asNumber(activeWall?.width, 4),
    height_m: asNumber(activeWall?.height, 3),
  };

  const map = byTypeMap(catalog);
  const raw = Array.isArray(modulesByWall?.[wallId]) ? modulesByWall[wallId] : [];
  const mods = raw.map((m) => normalizeModule(m, map.get(m.type))).sort(sortByX);

  const rows = groupByRow(mods);
  const seqStrings = toSequenceStrings(rows);
  const seqDetailed = toSequenceDetailed(rows);
  const cts = counts(mods);

  // Señales útiles para el back
  const bridgeDetected = mods.some(isBridge);
  const fridgePresent  = mods.some(isFridge);

  // Allowed types por aiTag (o type si no hay tag)
  const allowedSet = new Set(mods.map((m) => m.aiTag || m.type));
  const allowed_types = Array.from(allowedSet);

  return {
    version: 4,
    kitchen_type: kitchenType,
    wall,
    background: { wall_hex: wallHex },

    // ← NUEVO: flags que puede leer el prompt del back
    flags: {
      bridge_strict: !!bridgeStrict,
      bridge_detected: bridgeDetected,
      fridge_present: fridgePresent,
    },

    constraints: {
      do_not_add_modules: true,
      do_not_remove_modules: true,
      allowed_types,
      total_modules: mods.length,
      bbox_policy: 'strict',
    },
    counts: {
      by_type: cts.byType,
      by_tag: cts.byTag,
      by_family: cts.byFamily,
    },
    sequences: seqStrings,           // p.ej. ["BM-2P@0","BM-3DR@120",...]
    sequences_detailed: seqDetailed, // objetos mínimos por fila
    modules: mods,                   // geometría completa (cm) + metadatos AI
    style: styleFromQuality(quality),
  };
}

export default buildRenderPayload;
