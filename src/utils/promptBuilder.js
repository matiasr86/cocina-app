// src/utils/promptBuilder.js
function num(n, fb = null) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fb;
}

function decideRow(m) {
  if (m.row) return m.row;                   // "base" | "upper" | "tall"
  if (m.meta?.row) return m.meta.row;
  const h = Number(m.height) || Number(m.meta?.height) || 0;
  if (h >= 120) return "tall";
  if (h >= 45 && h <= 80) return "base";
  return "upper";
}

export function makeTextPrompt({ wall, modules, kitchenType, quality, catalog }) {
  const byType = new Map((catalog || []).map(c => [c.type, c]));

  const widthM  = num(wall?.width, 4.0);
  const heightM = num(wall?.height, 2.6);

  const lineaCocina =
    kitchenType === 'L' ? 'cocina en L, mostrar pared principal de frente'
    : kitchenType === 'C' ? 'cocina en C/U, mostrar pared frontal centrada'
    : 'cocina lineal en una sola pared, vista frontal';

  // Orden por X
  const sorted = [...(modules || [])].sort((a,b) => (a.xCm ?? a.x ?? 0) - (b.xCm ?? b.x ?? 0));

  const items = sorted.map((m) => {
    const meta = byType.get(m.type) || {};
    const title = m.title || meta.title || m.type;
    const row = decideRow({ ...m, meta });
    const w = num(m.width  ?? meta.width,  null);
    const h = num(m.height ?? meta.height, null);

    const hint =
      (meta.aiHints && (meta.aiHints[quality] || meta.aiHints.common)) ||
      (m.aiHints   && (m.aiHints[quality]   || m.aiHints.common)) ||
      '';

    const sizeTxt = (w && h) ? `(${w}×${h} cm)` : '';
    const rowTxt =
      row === 'base'  ? 'bajo mesada'
    : row === 'upper' ? 'alacena superior'
    : row === 'tall'  ? 'columna/alto'
    : 'módulo';

    // 👇 añadimos orientación por defecto en upper si no se menciona
    const needsUpperOrientation =
      row === 'upper' &&
      !String(hint).toLowerCase().match(/horizontal|abatible|flap|vertical|batiente/);

    const orientation = needsUpperOrientation
      ? '; puertas horizontales abatibles hacia arriba (tipo flap)'
      : '';

    return `- 1× ${title} ${sizeTxt} — ${rowTxt}${orientation}${hint ? `; ${hint}` : ''}`;
  });

  const acabadosPorCalidad = {
    started: [
      'frentes melamina blanca o clara',
      'tiradores rectos simples',
      'mesada laminada gris claro'
    ],
    premium: [
      'frentes mate, uñero integrado fino',
      'mesada tipo cuarzo gris claro',
      'herrajes con cierre suave'
    ],
    deluxe: [
      'frentes laqueados satinados o chapa premium, sin tiradores (push/open o uña J)',
      'mesada piedra/cuarzo cantos limpios',
      'alineación perfecta y juntas mínimas'
    ],
  }[quality || 'premium'];

  const restricciones = [
    'respetar exactamente los módulos listados (tipos y cantidades)',
    'alinear todas las alacenas a la misma altura',
    'en alacenas superiores usar puertas horizontales abatibles hacia arriba (flap), salvo indicación contraria',
    'mantener líneas horizontales limpias y consistentes',
    'sin personas, sin textos superpuestos',
    'no agregar módulos no listados'
  ];

  return [
    `${lineaCocina}. Pared neutra, luz LED lineal bajo alacenas.`,
    `Proporción de pared ~ ${widthM?.toFixed?.(1) ?? widthM} m ancho × ${heightM?.toFixed?.(1) ?? heightM} m alto.`,
    `Acabados generales: ${acabadosPorCalidad.join('; ')}.`,
    'Módulos a incluir (en orden de izquierda a derecha):',
    ...items,
    'Restricciones / estilo:',
    ...restricciones.map(s => `- ${s}`),
    'Cámara: frontal (elevación), altura de ojos, focal ~50 mm.',
    'Iluminación: ambiente suave + LED bajo alacena.',
    'Fondo y piso: neutros, levemente cálidos.'
  ].join('\n');
}
