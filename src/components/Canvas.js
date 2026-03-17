import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import './Canvas.css';
import Module from './Module';
import { useConsent } from '../consent/ConsentContext';

const AXIS_MARGIN = 50;
const BOTTOM_MARGIN = 50;
const RIGHT_MARGIN = 60;
const GRID_STEP = 25;
const LABEL_STEP = 50;

const modulesKey = (wallId) => `kitchen.modules.${wallId || 'default'}`;

const genId = () =>
  typeof window !== 'undefined' &&
  window.crypto &&
  typeof window.crypto.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `mod_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function CanvasInner(
  {
    wallId = 'front',
    label,
    initialWidth = 4,
    initialHeight = 3,
    onModulesChange,
  },
  ref
) {
  const [modules, setModules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const pendingSelectTimerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragIdleTimerRef = useRef(null);

  const [sizePrompt, setSizePrompt] = useState(null);
  const [linearPrompt, setLinearPrompt] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  const canvasRef = useRef(null);
  const { prefs } = useConsent();

  // 1 m = 100 px
  const pxW = initialWidth * 100;
  const pxH = initialHeight * 100;

  const canvasW = pxW + AXIS_MARGIN + RIGHT_MARGIN;
  const canvasH = pxH + BOTTOM_MARGIN;

  const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
  const clampZoom = (z) => Math.max(0.5, Math.min(2, z));
  const incZoom = useCallback(
    (d) => setZoom((z) => clampZoom(+((z + d).toFixed(2)))),
    []
  );
  const resetZoom = () => setZoom(1);

  /* ------------ carga / persistencia ------------ */
  useEffect(() => {
    try {
      const raw = prefs.get(modulesKey(wallId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setModules(parsed);
      }
    } catch {}
  }, [wallId, prefs]);

  useEffect(() => {
    try {
      prefs.set(modulesKey(wallId), JSON.stringify(modules));
    } catch {}
  }, [wallId, modules, prefs]);

  useEffect(() => {
    onModulesChange?.(wallId, modules);
  }, [wallId, modules, onModulesChange]);

  /* ------------ helpers de geometría ------------ */
  const sanitizeRect = useCallback(
    (rect) => {
      const width = Math.max(10, Math.round(rect.width));
      const height = Math.max(10, Math.round(rect.height));
      const x = clamp(Math.round(rect.x), 0, pxW - width);
      const y = clamp(Math.round(rect.y), 0, pxH - height);
      return { ...rect, width, height, x, y };
    },
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

  const handleCanvasClick = () => {
    if (pendingSelectTimerRef.current) {
      clearTimeout(pendingSelectTimerRef.current);
      pendingSelectTimerRef.current = null;
    }
    setSelectedId(null);
  };

  /* ------------ DnD desde sidebar ------------ */
  const handleCanvasDragOver = useCallback((e) => {
    const hasPayload = e.dataTransfer?.types?.includes('application/x-module');
    if (hasPayload) e.preventDefault();
  }, []);

  const finalizeDrop = useCallback(
    (data, dropX, dropY, width, height) => {
      let adjPct = 0;

      if (Array.isArray(data.sizes)) {
        const found = data.sizes.find(
          (s) => s.width === width && s.height === height
        );
        if (found && typeof found.deltaPct === 'number') adjPct = found.deltaPct;
      }

      const tagBase = (data.aiTag || data.type || data.title || 'MOD').toString();
      const aiTag = tagBase.trim().toUpperCase().replace(/\s+/g, '-');

      const raw = {
        id: genId(),
        type: data.type,
        title: data.title || data.name || 'Módulo',
        x: dropX,
        y: pxH - dropY - height,
        width,
        height,
        adjPct,
        src: data.src || null,
        color: data.color || 'transparent',
        aiTag,
        ai: data.ai || null,
      };

      const proposed = sanitizeRect(raw);
      if (collides(proposed, null)) return;
      setModules((prev) => [...prev, proposed]);
    },
    [pxH, sanitizeRect, collides]
  );

  /* ------------ lineales ------------ */
  const isLinearModule = (data) => {
    if (data?.isLinear) return true;
    if (data?.section === 'ZO') return true;
    const txt = (data?.type || data?.title || '').toString();
    return /banquina|z[oó]calo/i.test(txt);
  };

  const getLinearHeights = (data) => {
    if (Array.isArray(data?.allowedHeights) && data.allowedHeights.length) {
      return data.allowedHeights.map(Number);
    }
    if (Array.isArray(data?.heights) && data.heights.length) {
      return data.heights.map(Number);
    }
    if (Array.isArray(data?.sizes) && data.sizes.length) {
      const hs = data.sizes
        .map((s) => Number(s?.height) || 0)
        .filter(Boolean);
      return Array.from(new Set(hs));
    }
    return [10, 12, 15];
  };

  const handleCanvasDrop = useCallback(
    (e) => {
      const payload = e.dataTransfer.getData('application/x-module');
      if (!payload) return;
      e.preventDefault();

      let data;
      try {
        data = JSON.parse(payload);
      } catch {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();

      const dropX = Math.round((e.clientX - rect.left - AXIS_MARGIN) / zoom);
      let dropYLocal = (e.clientY - rect.top) / zoom;
      dropYLocal = Math.max(0, Math.min(pxH, Math.round(dropYLocal)));

      if (isLinearModule(data)) {
        const heights = getLinearHeights(data);
        setLinearPrompt({
          dropX,
          dropY: dropYLocal,
          data,
          width: Math.max(10, Math.round(data.defaultLinearWidth ?? data.width ?? 80)),
          height: heights[0] || 10,
          heights,
        });
        return;
      }

      const defaultW = Math.max(10, Math.round(data.width ?? 60));
      const defaultH = Math.max(10, Math.round(data.height ?? 60));

      if (Array.isArray(data.sizes) && data.sizes.length > 0) {
        if (data.sizes.length === 1) {
          const s = data.sizes[0];
          finalizeDrop(data, dropX, dropYLocal, s.width, s.height);
          return;
        }
        setSizePrompt({ dropX, dropY: dropYLocal, data });
        return;
      }

      finalizeDrop(data, dropX, dropYLocal, defaultW, defaultH);
    },
    [finalizeDrop, zoom, pxH]
  );

  /* ------------ click-to-place ------------ */
  const findFreeTopLeft = useCallback(
    (w, h) => {
      const step = GRID_STEP;
      for (let yTop = pxH - h; yTop >= 0; yTop -= step) {
        for (let x = 0; x <= pxW - w; x += step) {
          const candidate = sanitizeRect({ x, y: yTop, width: w, height: h });
          if (!collides(candidate, null)) {
            return { x: candidate.x, topY: candidate.y };
          }
        }
      }
      return { x: 0, topY: Math.max(0, pxH - h) };
    },
    [pxH, pxW, sanitizeRect, collides]
  );

  useImperativeHandle(
    ref,
    () => ({
      placeModuleFromSidebar: (meta) => {
        if (!meta) return;
        const baseTitle = meta.name || meta.title || meta.type || 'Módulo';

        if (isLinearModule(meta)) {
          const heights = getLinearHeights(meta);
          const w0 = Math.max(
            10,
            Math.round(meta.defaultLinearWidth ?? meta.width ?? 80)
          );
          const h0 = Math.max(10, Math.round(heights[0] || meta.height || 10));
          const { x, topY } = findFreeTopLeft(w0, h0);
          const dropX = x;
          const dropY = pxH - topY - h0;

          setLinearPrompt({
            dropX,
            dropY,
            data: { ...meta, title: baseTitle },
            width: w0,
            height: h0,
            heights,
          });
          return;
        }

        const sizes = Array.isArray(meta.sizes) ? meta.sizes : null;

        if (sizes && sizes.length > 1) {
          const first = sizes[0];
          const w0 = Math.max(10, Math.round(first.width || meta.width || 60));
          const h0 = Math.max(10, Math.round(first.height || meta.height || 60));
          const { x, topY } = findFreeTopLeft(w0, h0);
          const dropX = x;
          const dropY = pxH - topY - h0;
          setSizePrompt({ dropX, dropY, data: { ...meta, title: baseTitle } });
          return;
        }

        let w = Math.max(10, Math.round(meta.width || 60));
        let h = Math.max(10, Math.round(meta.height || 60));

        if (sizes && sizes.length === 1) {
          w = Math.max(10, Math.round(sizes[0].width || w));
          h = Math.max(10, Math.round(sizes[0].height || h));
        }

        const { x, topY } = findFreeTopLeft(w, h);
        const dropX = x;
        const dropY = pxH - topY - h;
        finalizeDrop({ ...meta, title: baseTitle }, dropX, dropY, w, h);
      },
    }),
    [finalizeDrop, findFreeTopLeft, pxH]
  );

  /* ------------ edición ------------ */
  const handleUpdateModule = (id, partial) => {
    if (pendingSelectTimerRef.current) {
      clearTimeout(pendingSelectTimerRef.current);
      pendingSelectTimerRef.current = null;
    }

    isDraggingRef.current = true;
    if (dragIdleTimerRef.current) clearTimeout(dragIdleTimerRef.current);
    dragIdleTimerRef.current = setTimeout(() => {
      isDraggingRef.current = false;
    }, 180);

    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const { width, height, ...rest } = partial || {};
        const proposed = sanitizeRect({ ...m, ...rest });
        if (collides(proposed, id)) return m;
        return proposed;
      })
    );
  };

  const requestSelect = useCallback((id) => {
    if (pendingSelectTimerRef.current) {
      clearTimeout(pendingSelectTimerRef.current);
    }

    pendingSelectTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current) setSelectedId(id);
      pendingSelectTimerRef.current = null;
    }, 160);
  }, []);

  const handleDelete = () => {
    if (!selectedId) return;
    setModules((prev) => prev.filter((m) => m.id !== selectedId));
    setSelectedId(null);
  };

  const nudgeSelected = (axis, delta) => {
    if (!selectedId) return;

    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== selectedId) return m;

        const proposed = sanitizeRect({
          ...m,
          [axis]: Number(m[axis] || 0) + delta,
        });

        return collides(proposed, m.id) ? m : proposed;
      })
    );
  };

  const handleEdit = (key, value) => {
    if (!selectedId) return;
    if (key === 'width' || key === 'height') return;

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

  const updateLinearWidth = (delta) => {
    setLinearPrompt((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        width: Math.max(10, Number(prev.width || 10) + delta),
      };
    });
  };

  const selectedModule = modules.find((m) => m.id === selectedId);

  useEffect(() => {
    return () => {
      if (pendingSelectTimerRef.current) clearTimeout(pendingSelectTimerRef.current);
      if (dragIdleTimerRef.current) clearTimeout(dragIdleTimerRef.current);
    };
  }, []);

  /* ------------ cerrar pickers con ESC ------------ */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSizePrompt(null);
        setLinearPrompt(null);
      }
    };

    if (sizePrompt || linearPrompt) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [sizePrompt, linearPrompt]);

  /* ------------ zoom con Ctrl + rueda ------------ */
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
  }, [incZoom]);

  /* ------------ scrollbars condicionales ------------ */
  const canvasOverflow = zoom > 1.001 ? 'auto' : 'hidden';

  useEffect(() => {
    if (!canvasRef.current) return;
    if (zoom <= 1.001) {
      canvasRef.current.scrollLeft = 0;
      canvasRef.current.scrollTop = 0;
    }
  }, [zoom]);

  /* ------------ posiciones UI ------------ */
  const menuW = 300;
  const menuMaxH = 360;

  const pickerPos = (() => {
    const src = sizePrompt || linearPrompt;
    if (!src) return { left: 0, top: 0 };

    const left = Math.min(src.dropX + AXIS_MARGIN, canvasW - menuW - 10);
    const top = Math.min(src.dropY + 6, pxH - menuMaxH - 10);

    return {
      left: Math.max(10, left),
      top: Math.max(10, top),
    };
  })();

  const editorW = 280;
  const editorH = 190;

  const computeEditorPos = (m) => {
    const mTop = pxH - m.y - m.height;
    const mLeft = AXIS_MARGIN + m.x;
    const mCenterX = mLeft + m.width / 2;

    const gridLeft = AXIS_MARGIN;
    const gridRight = AXIS_MARGIN + pxW;

    const preferRight = mCenterX < gridLeft + pxW / 2;

    const leftDock = 10;
    const rightDock = gridRight - editorW - 10;

    const maxTop = pxH - editorH - 6;
    const top = Math.max(10, Math.min(mTop, maxTop));

    return {
      left: Math.max(10, preferRight ? rightDock : leftDock),
      top,
    };
  };

  const editorPos = selectedModule
    ? computeEditorPos(selectedModule)
    : { left: AXIS_MARGIN + pxW - editorW - 10, top: 10 };

  const zoomLayerStyle = {
    position: 'relative',
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
    width: canvasW,
    height: canvasH,
  };

  const roInputStyle = {
    background: '#f6f7f9',
    color: '#555',
    cursor: 'not-allowed',
  };

  return (
    <div className="canvas-shell">
      <div className="canvas-toolbar">
        <span className="canvas-toolbar__label">{label}</span>

        <div className="canvas-toolbar__controls">
          <button
            className="btn ghost canvas-toolbar__btn"
            onClick={() => incZoom(-0.1)}
          >
            −
          </button>
          <span className="canvas-zoom__value">{Math.round(zoom * 100)}%</span>
          <button
            className="btn ghost canvas-toolbar__btn"
            onClick={() => incZoom(+0.1)}
          >
            +
          </button>
          <button className="btn ghost" onClick={resetZoom}>
            100%
          </button>

          <label className="canvas-grid-toggle">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            <span>Mostrar grilla</span>
          </label>
        </div>
      </div>

      <div className="canvas-stageScroll">
        <div
          className="canvas-surface"
          ref={canvasRef}
          style={{
            width: canvasW,
            height: canvasH,
            position: 'relative',
            overflow: canvasOverflow,
          }}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onClick={handleCanvasClick}
        >
          <div style={zoomLayerStyle}>
            <svg width={canvasW} height={canvasH} style={{ display: 'block' }}>
              <g transform={`translate(${AXIS_MARGIN}, 0)`}>
                <rect width={pxW} height={pxH} fill="#dcdcdc" stroke="#ccc" />

                <g
                  className="grid-mesh"
                  style={{ display: showGrid ? 'block' : 'none' }}
                >
                  {Array.from(
                    { length: Math.floor(pxW / GRID_STEP) + 1 },
                    (_, i) => (
                      <line
                        key={`v${i}`}
                        x1={i * GRID_STEP}
                        y1={0}
                        x2={i * GRID_STEP}
                        y2={pxH}
                        stroke="#eee"
                      />
                    )
                  )}

                  {Array.from(
                    { length: Math.floor(pxH / GRID_STEP) + 1 },
                    (_, j) => {
                      const y = pxH - j * GRID_STEP;
                      return (
                        <line
                          key={`h${j}`}
                          x1={0}
                          y1={y}
                          x2={pxW}
                          y2={y}
                          stroke="#eee"
                        />
                      );
                    }
                  )}
                </g>

                <g className="rulers">
                  <line x1={0} y1={pxH} x2={pxW} y2={pxH} stroke="#999" />
                  {Array.from(
                    { length: Math.floor(pxW / LABEL_STEP) + 1 },
                    (_, i) => {
                      const x = i * LABEL_STEP;
                      return (
                        <g key={`xlab${i}`}>
                          <line
                            x1={x}
                            y1={pxH}
                            x2={x}
                            y2={pxH + 6}
                            stroke="#999"
                          />
                          <text
                            x={x}
                            y={pxH + 16}
                            fontSize={10}
                            textAnchor="middle"
                            fill="#666"
                          >
                            {i * 50} cm
                          </text>
                        </g>
                      );
                    }
                  )}

                  <line x1={0} y1={0} x2={0} y2={pxH} stroke="#999" />
                  {Array.from(
                    { length: Math.floor(pxH / LABEL_STEP) + 1 },
                    (_, i) => {
                      const y = pxH - i * LABEL_STEP;
                      return (
                        <g key={`ylab${i}`}>
                          <line x1={-6} y1={y} x2={0} y2={y} stroke="#999" />
                          <text
                            x={-8}
                            y={y}
                            fontSize={10}
                            textAnchor="end"
                            dominantBaseline="middle"
                            fill="#666"
                          >
                            {i * 50} cm
                          </text>
                        </g>
                      );
                    }
                  )}
                </g>
              </g>
            </svg>

            {modules.map((mod) => {
              const left = AXIS_MARGIN + mod.x;
              const top = pxH - mod.y - mod.height;

              return (
                <React.Fragment key={mod.id}>
                  <Module
                    module={mod}
                    selected={mod.id === selectedId}
                    onClick={(id) => requestSelect(id)}
                    onUpdate={handleUpdateModule}
                    axisMargin={AXIS_MARGIN}
                    bottomMargin={BOTTOM_MARGIN}
                  />

                  {(mod.aiTag || mod.title || mod.type) && (
                    <div
                      className="aitag-marker"
                      style={{
                        position: 'absolute',
                        left,
                        top: top + 2,
                        width: mod.width,
                        textAlign: 'center',
                        fontSize: 9,
                        lineHeight: '10px',
                        color: '#555',
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        zIndex: 50,
                      }}
                    >
                      {mod.aiTag || mod.title || mod.type}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {selectedId && selectedModule && (
            <div
              className="canvas-editor"
              style={{
                left: editorPos.left,
                top: editorPos.top,
                zIndex: 10,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="canvas-editor__actions">
                <button onClick={handleDelete}>Eliminar</button>
              </div>

              <div className="canvas-editor__grid canvas-editor__grid--coords">
                <label>X (Cm)</label>
                <div className="canvas-stepper">
                  <button type="button" onClick={() => nudgeSelected('x', -1)}>
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={selectedModule.x}
                    onChange={(e) => handleEdit('x', e.target.value)}
                  />
                  <button type="button" onClick={() => nudgeSelected('x', 1)}>
                    +
                  </button>
                </div>

                <label>Y (Cm)</label>
                <div className="canvas-stepper">
                  <button type="button" onClick={() => nudgeSelected('y', -1)}>
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={selectedModule.y}
                    onChange={(e) => handleEdit('y', e.target.value)}
                  />
                  <button type="button" onClick={() => nudgeSelected('y', 1)}>
                    +
                  </button>
                </div>
              </div>

              <div className="canvas-editor__grid">
                <label>Ancho (Cm)</label>
                <input
                  type="number"
                  value={selectedModule.width}
                  readOnly
                  style={roInputStyle}
                />
                <label>Alto (Cm)</label>
                <input
                  type="number"
                  value={selectedModule.height}
                  readOnly
                  style={roInputStyle}
                />
              </div>
            </div>
          )}

          {sizePrompt && (
            <div
              className="canvas-picker"
              style={{
                left: pickerPos.left,
                top: pickerPos.top,
                zIndex: 20,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="canvas-picker__title">Elegí una medida</div>

              <div className="canvas-picker__list">
                {sizePrompt.data.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    className="btn ghost"
                    onClick={() => {
                      finalizeDrop(
                        sizePrompt.data,
                        sizePrompt.dropX,
                        sizePrompt.dropY,
                        s.width,
                        s.height
                      );
                      setSizePrompt(null);
                    }}
                    style={{ textAlign: 'left', whiteSpace: 'nowrap' }}
                  >
                    {s.width} × {s.height} cm
                    {s.isStandard ? ' · Estándar' : ''}
                  </button>
                ))}

                <button className="btn" onClick={() => setSizePrompt(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {linearPrompt && (
            <div
              className="canvas-picker canvas-picker--linear"
              style={{
                left: pickerPos.left,
                top: pickerPos.top,
                zIndex: 21,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="canvas-picker__title">
                {linearPrompt.data?.title || 'Módulo lineal'}
              </div>

              <div className="canvas-picker__field">
                <label className="canvas-picker__fieldLabel">Largo (cm)</label>

                <div className="canvas-stepper canvas-stepper--picker">
                  <button
                    type="button"
                    onClick={() => updateLinearWidth(-5)}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={10}
                    value={linearPrompt.width}
                    onChange={(e) =>
                      setLinearPrompt((prev) => ({
                        ...prev,
                        width: Math.max(10, Number(e.target.value) || 10),
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => updateLinearWidth(5)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="canvas-picker__section">
                <div className="canvas-picker__sectionTitle">Alto</div>
                <div className="canvas-picker__chips">
                  {linearPrompt.heights.map((h) => (
                    <button
                      key={h}
                      className={`btn ${
                        linearPrompt.height === h ? 'primary' : 'ghost'
                      }`}
                      onClick={() =>
                        setLinearPrompt((prev) => ({ ...prev, height: h }))
                      }
                    >
                      {h} cm
                    </button>
                  ))}
                </div>
              </div>

              <div className="canvas-picker__actions">
                <button
                  className="btn ghost"
                  onClick={() => setLinearPrompt(null)}
                >
                  Cancelar
                </button>
                <button
                  className="btn primary"
                  onClick={() => {
                    finalizeDrop(
                      linearPrompt.data,
                      linearPrompt.dropX,
                      linearPrompt.dropY,
                      Math.round(linearPrompt.width),
                      Math.round(linearPrompt.height)
                    );
                    setLinearPrompt(null);
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Canvas = forwardRef(CanvasInner);
export default Canvas;