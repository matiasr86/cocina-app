// src/components/Canvas.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Canvas.css';
import Module from './Module';

const AXIS_MARGIN = 50;
const BOTTOM_MARGIN = 50;
const GRID_STEP = 25;
const LABEL_STEP = 50;

const modulesKey = (wallId) => `kitchen.modules.${wallId || 'default'}`;

export default function Canvas({
  wallId = 'front',
  label,
  initialWidth = 4,
  initialHeight = 3,
  onModulesChange,
}) {
  const [modules, setModules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sizePrompt, setSizePrompt] = useState(null); // {dropX, dropY, data}
  const [zoom, setZoom] = useState(1);                // 👈 ZOOM
  const canvasRef = useRef(null);

  const pxW = initialWidth * 100;
  const pxH = initialHeight * 100;

  // ---- helpers zoom ----
  const clampZoom = (z) => Math.max(0.5, Math.min(2, z));
  const incZoom = (delta) => setZoom((z) => clampZoom(+((z + delta).toFixed(2))));
  const resetZoom = () => setZoom(1);

  // Cargar del storage por pared
  useEffect(() => {
    try {
      const raw = localStorage.getItem(modulesKey(wallId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setModules(parsed);
      }
    } catch {}
  }, [wallId]);

  // Guardar
  useEffect(() => {
    try { localStorage.setItem(modulesKey(wallId), JSON.stringify(modules)); } catch {}
  }, [wallId, modules]);

  // Avisar al parent (resumen / totales)
  useEffect(() => { onModulesChange?.(wallId, modules); }, [wallId, modules, onModulesChange]);

  const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

  const sanitizeRect = useCallback(
    (rect) => ({
      ...rect,
      width: Math.max(10, rect.width),
      height: Math.max(10, rect.height),
      x: clamp(rect.x, 0, pxW - rect.width),
      y: clamp(rect.y, 0, pxH - rect.height),
    }),
    [pxW, pxH]
  );

  const collides = useCallback(
    (rect, ignoreId = null) =>
      modules.some((m) => {
        if (m.id === ignoreId) return false;
        return (
          rect.x < m.x + m.width &&
          rect.x + rect.width > m.x &&
          rect.y < m.y + m.height &&
          rect.y + rect.height > m.y
        );
      }),
    [modules]
  );

  const handleCanvasClick = () => setSelectedId(null);

  const handleCanvasDragOver = useCallback((e) => {
    const hasPayload = e.dataTransfer?.types?.includes('application/x-module');
    if (hasPayload) e.preventDefault();
  }, []);

  // Colocar módulo (setea adjPct a partir de deltaPct de la medida elegida)
  const finalizeDrop = useCallback(
    (data, dropX, dropY, width, height) => {
      let adjPct = 0;
      if (Array.isArray(data.sizes)) {
        const found = data.sizes.find((s) => s.width === width && s.height === height);
        if (found && typeof found.deltaPct === 'number') adjPct = found.deltaPct;
      }
      const raw = {
        id: crypto.randomUUID(),
        type: data.type,
        title: data.title || 'Módulo',
        x: dropX,
        y: pxH - dropY - height,
        width,
        height,
        adjPct, // guardamos el ajuste en la instancia (no se muestra en UI)
        src: data.src || null,
        color: data.color || 'transparent',
      };
      const proposed = sanitizeRect(raw);
      if (collides(proposed, null)) return;
      setModules((p) => [...p, proposed]);
      setSelectedId(proposed.id);
    },
    [pxH, sanitizeRect, collides]
  );

  // Drop handler (ajustado por zoom)
  const handleCanvasDrop = useCallback(
    (e) => {
      const payload = e.dataTransfer.getData('application/x-module');
      if (!payload) return;
      e.preventDefault();

      let data;
      try { data = JSON.parse(payload); } catch { return; }

      const rect = canvasRef.current.getBoundingClientRect();
      // 👇 Ajustamos por zoom: convertimos a coords "reales" antes de guardar
      const dropX = (e.clientX - rect.left - AXIS_MARGIN) / zoom;
      const dropY = (e.clientY - rect.top) / zoom;

      const defaultW = Math.max(10, Math.round(data.width ?? 60));
      const defaultH = Math.max(10, Math.round(data.height ?? 60));

      if (Array.isArray(data.sizes) && data.sizes.length > 0) {
        if (data.sizes.length === 1) {
          const s = data.sizes[0];
          finalizeDrop(data, dropX, dropY, s.width, s.height);
          return;
        }
        setSizePrompt({ dropX, dropY, data });
        return;
      }

      finalizeDrop(data, dropX, dropY, defaultW, defaultH);
    },
    [finalizeDrop, zoom]
  );

  // Mover (sin redimensionar)
  const handleUpdateModule = (id, partial) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const { width, height, ...rest } = partial || {};
        let proposed = sanitizeRect({ ...m, ...rest });
        if (collides(proposed, id)) return m;
        return proposed;
      })
    );
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setModules((p) => p.filter((m) => m.id !== selectedId));
    setSelectedId(null);
  };

  const handleEdit = (key, value) => {
    if (!selectedId) return;
    if (key === 'width' || key === 'height') return; // bloqueado
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== selectedId) return m;
        let proposed = { ...m };
        if (key === 'x' || key === 'y') proposed[key] = Number(value) || 0;
        else if (key === 'color') proposed.color = value;
        proposed = sanitizeRect(proposed);
        return collides(proposed, m.id) ? m : proposed;
      })
    );
  };

  const selectedModule = modules.find((m) => m.id === selectedId);

  // Cerrar el picker con Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSizePrompt(null);
    };
    if (sizePrompt) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sizePrompt]);

  // Zoom con Ctrl + rueda (opcional, suave y no invasivo)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? -0.1 : 0.1;
      incZoom(dir);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Posicionamiento seguro del picker de medidas (no se sale del lienzo)
  const menuW = 240;
  const menuMaxH = 280;
  const pickerPos = (() => {
    if (!sizePrompt) return { left: 0, top: 0 };
    const left = Math.min(sizePrompt.dropX + AXIS_MARGIN, pxW + AXIS_MARGIN - menuW - 10);
    const top = Math.min(sizePrompt.dropY + 6, pxH - menuMaxH - 10);
    return { left: Math.max(10, left), top: Math.max(10, top) };
  })();

  // Panel de edición junto al módulo, para no taparlo
  const editorW = 230;
  const editorH = 120;
  const editorPos = (() => {
    if (!selectedModule) return { left: AXIS_MARGIN + pxW - editorW - 10, top: 10 };

    // A la derecha del módulo
    let left = AXIS_MARGIN + selectedModule.x + selectedModule.width + 8;
    // Si no entra, a la izquierda
    if (left + editorW > AXIS_MARGIN + pxW - 4) {
      left = AXIS_MARGIN + selectedModule.x - editorW - 8;
    }
    left = Math.max(10, Math.min(left, AXIS_MARGIN + pxW - editorW - 10));

    let top = selectedModule.y;
    if (top + editorH > pxH - 4) top = pxH - editorH - 10;
    top = Math.max(10, top);

    return { left, top };
  })();

  // Capa que se escala: grilla + módulos. UI (editor/picker) queda afuera sin escalar
  const zoomLayerStyle = {
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
    width: pxW + AXIS_MARGIN,
    height: pxH + BOTTOM_MARGIN,
  };

  return (
    <div style={{ flex: 1 }}>
      {/* Header con controles de zoom */}
      <div style={{ padding: 10, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn ghost" onClick={() => incZoom(-0.1)}>−</button>
          <span style={{ minWidth: 48, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button className="btn ghost" onClick={() => incZoom(+0.1)}>+</button>
          <button className="btn ghost" onClick={resetZoom}>100%</button>
        </div>
      </div>

      <div
        className="canvas-surface"
        ref={canvasRef}
        style={{
          width: pxW + AXIS_MARGIN,
          height: pxH + BOTTOM_MARGIN,
          position: 'relative',
          overflow: 'auto', // 👈 si hacés zoom in, podés scrollear y NO se corta nada
        }}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
        onClick={handleCanvasClick}
      >
        {/* Capa escalada */}
        <div style={zoomLayerStyle}>
          {/* Grilla */}
          <svg width={pxW + AXIS_MARGIN} height={pxH + BOTTOM_MARGIN} style={{ display: 'block' }}>
            <g transform={`translate(${AXIS_MARGIN}, 0)`}>
              <rect width={pxW} height={pxH} fill="#f5f5f5" stroke="#ccc" />
              {Array.from({ length: Math.floor(pxW / GRID_STEP) + 1 }, (_, i) => (
                <line key={`v${i}`} x1={i * GRID_STEP} y1={0} x2={i * GRID_STEP} y2={pxH} stroke="#eee" />
              ))}
              {Array.from({ length: Math.floor(pxH / GRID_STEP) + 1 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i * GRID_STEP} x2={pxW} y2={i * GRID_STEP} stroke="#eee" />
              ))}
            </g>
            {Array.from({ length: Math.floor(pxW / LABEL_STEP) + 1 }, (_, i) => (
              <text key={`x${i}`} x={AXIS_MARGIN + i * LABEL_STEP} y={pxH + 15} fontSize={10}>
                {i * 50} cm
              </text>
            ))}
            {Array.from({ length: Math.floor(pxH / LABEL_STEP) + 1 }, (_, i) => (
              <text key={`y${i}`} x={2} y={pxH - i * LABEL_STEP} fontSize={10}>
                {i * 50} cm
              </text>
            ))}
          </svg>

          {/* Módulos */}
          {modules.map((mod) => (
            <Module
              key={mod.id}
              module={mod}
              selected={mod.id === selectedId}
              onClick={(id) => setSelectedId(id)}
              onUpdate={handleUpdateModule}
              axisMargin={AXIS_MARGIN}
              bottomMargin={BOTTOM_MARGIN}
            />
          ))}
        </div>

        {/* Panel de edición (fuera del scale para que no tape y sea cómodo) */}
        {selectedId && selectedModule && (
          <div
            style={{
              position: 'absolute',
              left: editorPos.left,
              top: editorPos.top,
              width: editorW,
              height: editorH,
              zIndex: 10,
              background: 'white',
              padding: 10,
              border: '1px solid #ccc',
              borderRadius: 6,
              boxShadow: '0 2px 6px rgba(0,0,0,.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button onClick={handleDelete}>Eliminar</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 90px', gap: 6 }}>
              <label>X (Cm)</label>
              <input
                type="number"
                value={selectedModule.x}
                onChange={(e) => handleEdit('x', e.target.value)}
              />
              <label>Y (Cm)</label>
              <input
                type="number"
                value={selectedModule.y}
                onChange={(e) => handleEdit('y', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Picker de medidas (sin porcentajes, con scroll si hay muchas) */}
        {sizePrompt && (
          <div
            style={{
              position: 'absolute',
              left: pickerPos.left,
              top: pickerPos.top,
              width: menuW,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 8,
              zIndex: 20,
              boxShadow: '0 6px 18px rgba(0,0,0,.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Elegí una medida</div>
            <div style={{ display: 'grid', gap: 6, maxHeight: menuMaxH, overflowY: 'auto', paddingRight: 4 }}>
              {sizePrompt.data.sizes.map((s, idx) => (
                <button
                  key={idx}
                  className="btn ghost"
                  onClick={() => {
                    finalizeDrop(sizePrompt.data, sizePrompt.dropX, sizePrompt.dropY, s.width, s.height);
                    setSizePrompt(null);
                  }}
                  style={{ textAlign: 'left', whiteSpace: 'nowrap' }}
                >
                  {s.width} × {s.height} cm{ s.isStandard ? ' · Estándar' : '' }
                </button>
              ))}
              <button className="btn" onClick={() => setSizePrompt(null)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
