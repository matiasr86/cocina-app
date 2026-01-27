// src/utils/promptBuilder.js
// Construye el prompt textual a partir del payload + catálogo
// Reglas clave: cocina puente (ALAP 58 cm a ras con BM/columnas) y ALA 35 cm retrasadas.

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
  const byType = new Map((catalog || []).map((c) => [c.type, c]));

  const widthM  = num(wall?.width, 4.0);
  const heightM = num(wall?.height, 2.6);

  const lineaCocina =
    kitchenType === "L"
      ? "cocina en L, mostrar pared principal de frente"
      : kitchenType === "C"
      ? "cocina en C/U, mostrar pared frontal centrada"
      : "cocina lineal en una sola pared, vista frontal";

  // Ordenamos por posición X (que llega en el payload)
  const sorted = [...(modules || [])].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));

  // Conteos para resumen estricto y validación de planos
  let cntBridge = 0, cntUpper35 = 0, cntBase = 0, cntTall = 0;
  const colTypes = new Set();

  const items = sorted.map((m) => {
    const meta = byType.get(m.type) || {};
    const title = m.title || meta.title || m.type;
    const row = decideRow({ ...m, meta });
    const w = num(m.width ?? meta.width, null);
    const h = num(m.height ?? meta.height, null);

    const section = m.section || meta.section || "";
    const isBridge = section === "ALAP"; // alacena PUENTE (58 cm)
    const isUpper35 = section === "ALA"; // alacena 35 cm
    const isBase = row === "base" || section === "BM";
    const isTall = row === "tall";

    if (isBridge) cntBridge++;
    if (isUpper35) cntUpper35++;
    if (isBase) cntBase++;
    if (isTall) {
      cntTall++;
      if ((meta.aiTag || "").startsWith("COL") || /colum/i.test(m.type || ""))
        colTypes.add(title);
    }

    const hint =
      (meta.aiHints && (meta.aiHints[quality] || meta.aiHints.common)) ||
      (m.aiHints && (m.aiHints[quality] || m.aiHints.common)) ||
      "";

    const sizeTxt = w && h ? `(${w}×${h} cm)` : "";
    const rowTxt =
      row === "base"
        ? "bajo mesada"
        : row === "upper"
        ? (isBridge ? "alacena PUENTE (58 cm)" : "alacena 35 cm (retrasada)")
        : row === "tall"
        ? "columna/alto"
        : "módulo";

    // si es upper y no aclara orientación, forzamos flap horizontal
    const needsUpperOrientation =
      row === "upper" &&
      !String(hint).toLowerCase().match(/horizontal|abatible|flap|vertical|batiente/);

    const orientation = needsUpperOrientation
      ? "; puertas horizontales abatibles hacia arriba (tipo flap)"
      : "";

    return `- 1× ${title} ${sizeTxt} — ${rowTxt}${orientation}${
      hint ? `; ${hint}` : ""
    }`;
  });

  const acabadosPorCalidad =
    {
      started: [
        "frentes melamina blanca o clara",
        "tiradores rectos simples",
        "mesada laminada gris claro",
      ],
      premium: [
        "frentes mate, uñero integrado fino",
        "mesada tipo cuarzo gris claro",
        "herrajes con cierre suave",
      ],
      deluxe: [
        "frentes laqueados satinados o chapa premium, sin tiradores (push/open o uña J)",
        "mesada piedra/cuarzo cantos limpios",
        "alineación perfecta y juntas mínimas",
      ],
    }[quality || "premium"];

  // Resumen estricto + regla de planos (clave para 'cocina puente')
  const resumenEstricto = [
    `conteo ESTRICTO: columnas/altos = ${cntTall} (tipos: ${
      [...colTypes].join(", ") || "—"
    }),`,
    `bajos mesada = ${cntBase}, alacenas PUENTE 58 cm = ${cntBridge}, alacenas 35 cm (retrasadas) = ${cntUpper35}.`,
    `NO agregar módulos distintos a los listados. Si hay dudas, dejar huecos.`,
  ].join(" ");

  const reglaPlanos = [
    `profundidades: plano FRONTAL (0 cm) = columnas/altos, bajo mesadas y alacenas PUENTE (58 cm).`,
    `plano RETRASADO (~−23 cm) = alacenas 35 cm.`,
    `crear un NICH0 continuo entre las dos columnas usando alacenas 35 cm,`,
    `sin adelantar ni convertir esas alacenas 35 cm a puente.`,
    `alinear las puertas superiores en una sola línea horizontal.`,
  ].join(" ");

  const restricciones = [
    "respetar exactamente los módulos listados (tipos y cantidades)",
    "NO inventar columnas, laterales ni tapacantos extra",
    "NO sustituir cajones por puertas ni viceversa",
    "en alacenas superiores usar puertas horizontales (flap) salvo que el ítem indique vertical",
    "mantener líneas horizontales limpias y consistentes",
    "sin personas, sin textos superpuestos",
  ];

  return [
    `${lineaCocina}. Pared neutra, luz LED lineal bajo alacenas.`,
    `Proporción de pared ~ ${widthM?.toFixed?.(1) ?? widthM} m ancho × ${heightM?.toFixed?.(1) ?? heightM} m alto.`,
    `Acabados generales: ${acabadosPorCalidad.join("; ")}.`,
    `Layout y planos: ${reglaPlanos}`,
    `Resumen: ${resumenEstricto}`,
    "Módulos a incluir (en orden de izquierda a derecha):",
    ...items,
    "Restricciones / estilo:",
    ...restricciones.map((s) => `- ${s}`),
    "Cámara: frontal (elevación), altura de ojos, focal ~50 mm.",
    "Iluminación: ambiente suave + LED bajo alacena.",
    "Fondo y piso: neutros, levemente cálidos.",
  ].join("\n");
}
