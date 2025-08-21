import React, { useMemo, useState, useEffect, useCallback } from 'react';

import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import RightPanel from './RightPanel';
import QualityPicker from './QualityPicker';

import { ModulesProvider, useModules } from '../context/ModulesContext';
import AdminLoginModal from './AdminLoginModal';
import AdminPanel from './AdminPanel';
import { QUALITIES } from '../data/qualities';

import './AppLayout.css';

const LS_KEY_LAYOUT  = 'kitchen.layout.v1';
const LS_KEY_QUALITY = 'kitchen.quality.v1';

// Genera las paredes según el tipo seleccionado
const makeWallsByType = (type) => {
  if (type === 'L') {
    return [
      { id: 'left',  name: 'Pared Izquierda', width: 4,   height: 3 },
      { id: 'right', name: 'Pared Derecha',   width: 4,   height: 3 },
    ];
  }
  if (type === 'C') {
    return [
      { id: 'left',  name: 'Pared Izquierda', width: 3.5, height: 3 },
      { id: 'front', name: 'Pared Frontal',   width: 4.0, height: 3 },
      { id: 'right', name: 'Pared Derecha',   width: 3.5, height: 3 },
    ];
  }
  // Recta
  return [{ id: 'front', name: 'Pared Frontal', width: 4, height: 3 }];
};

/* ---------- Wrapper que provee el contexto ---------- */
export default function AppLayout() {
  return (
    <ModulesProvider>
      <AppLayoutInner />
    </ModulesProvider>
  );
}

/* ---------- Componente interno que consume el contexto ---------- */
function AppLayoutInner() {
  const { modules: catalog } = useModules(); // catálogo (con visibilidad, sizes, prices)

  /* -------------------- Calidad -------------------- */
  const [quality, setQuality] = useState(null); // 'started' | 'premium' | 'deluxe'
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY_QUALITY);
    if (raw) setQuality(raw);
  }, []);
  useEffect(() => {
    if (quality) localStorage.setItem(LS_KEY_QUALITY, quality);
  }, [quality]);

  const qualityName = useMemo(
    () => QUALITIES.find((q) => q.id === quality)?.name || '',
    [quality]
  );
  const priceKey = quality === 'deluxe' ? 'deluxe' : quality === 'premium' ? 'premium' : 'started';

  /* -------------------- Paredes/Layout -------------------- */
  const [kitchenType, setKitchenType] = useState('Recta');
  const [wallsState, setWallsState] = useState(() => makeWallsByType('Recta'));
  const [activeWallId, setActiveWallId] = useState(() => makeWallsByType('Recta')[0].id);

  // Hidratar desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_LAYOUT);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.kitchenType) setKitchenType(parsed.kitchenType);
      if (Array.isArray(parsed?.walls)) setWallsState(parsed.walls);
      if (parsed?.activeWallId) setActiveWallId(parsed.activeWallId);
    } catch {}
  }, []);

  // Persistir layout
  useEffect(() => {
    const payload = { kitchenType, walls: wallsState, activeWallId };
    try { localStorage.setItem(LS_KEY_LAYOUT, JSON.stringify(payload)); } catch {}
  }, [kitchenType, wallsState, activeWallId]);

  const walls = useMemo(() => wallsState, [wallsState]);

  const onChangeKitchenType = (type) => {
    setKitchenType(type);
    const next = makeWallsByType(type);
    setWallsState((prev) => {
      const prevMap = new Map(prev.map((w) => [w.id, w]));
      return next.map((w) => (prevMap.get(w.id) ? { ...w, ...prevMap.get(w.id) } : w));
    });
    setActiveWallId(next[0].id);
  };

  const updateActiveWall = (patch) => {
    setWallsState((prev) => prev.map((w) => (w.id === activeWallId ? { ...w, ...patch } : w)));
  };

  const activeWall = walls.find((w) => w.id === activeWallId) ?? walls[0];

  /* -------------------- Resumen + Estimación -------------------- */
  // summary: { [wallId]: { [title]: count } }
  const [summaries, setSummaries] = useState({});
  // breakdown: { [wallId]: { items: [{type,title,count,unit,subtotal}], total } }
  const [breakdowns, setBreakdowns] = useState({});

  const handleModulesChange = useCallback(
    (wallId, mods) => {
      // Resumen por título (para la lista simple)
      const byTitle = mods.reduce((acc, m) => {
        const t = (m.title && String(m.title).trim()) || 'Módulo';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      setSummaries((prev) => ({ ...prev, [wallId]: byTitle }));

      // Precios por tipo con ajuste por adjPct
      const byTypeMap = new Map(catalog.map((c) => [c.type, c]));
      // agrupamos por type para construir filas; el subtotal se calcula sumando cada módulo con su adjPct
      const countsByType = mods.reduce((acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
        return acc;
      }, {});
      const items = Object.entries(countsByType).map(([type, count]) => {
        const meta = byTypeMap.get(type);
        const title = meta?.name || meta?.title || type;
        const baseUnit = meta?.prices?.[priceKey] ?? null;

        const subtotal = mods
          .filter((m) => m.type === type)
          .reduce((acc, m) => {
            if (baseUnit == null) return acc;
            const pct = typeof m.adjPct === 'number' ? m.adjPct : 0;
            const unitFinal = Math.round((baseUnit * (1 + pct / 100)) * 100) / 100;
            return acc + unitFinal;
          }, 0);

        return { type, title, count, unit: baseUnit, subtotal };
      });

      const total = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
      setBreakdowns((prev) => ({ ...prev, [wallId]: { items, total } }));
    },
    [catalog, priceKey]
  );

  const activeSummary = summaries[activeWallId] || {};
  const activeBreakdown = breakdowns[activeWallId] || { items: [], total: 0 };

  /* -------------------- Admin -------------------- */
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminLogged, setAdminLogged] = useState(false);

  /* -------------------- Render -------------------- */
  const showQualityPicker = !quality;

  return (
    <div className="app">
      <TopBar
        qualityName={qualityName}
        onChangeQuality={() => setQuality(null)}
        onAdmin={() => setAdminOpen(true)}
      />

      <div className="app__main">
        {/* Sidebar izquierda */}
        <div className="app__left">
          <Sidebar />
        </div>

        {/* Centro */}
        <main className="app__center">
          <div className="workspace">
            {/* Selector de tipo */}
            <div className="workspace__toolbar">
              <div className="field">
                <label>Tipo de cocina</label>
                <select
                  value={kitchenType}
                  onChange={(e) => onChangeKitchenType(e.target.value)}
                >
                  <option value="Recta">Recta</option>
                  <option value="L">En L</option>
                  <option value="C">En C</option>
                </select>
              </div>
            </div>

            {/* Pestañas de paredes */}
            <div className="walltabs">
              {walls.map((w) => (
                <button
                  key={w.id}
                  className={`walltabs__tab ${w.id === activeWallId ? 'is-active' : ''}`}
                  onClick={() => setActiveWallId(w.id)}
                >
                  {w.name}
                </button>
              ))}
            </div>

            {/* Canvas (montamos todos, mostramos el activo) */}
            <div className="workspace__canvas">
              {walls.map((w) => (
                <div key={w.id} style={{ display: w.id === activeWallId ? 'block' : 'none' }}>
                  <Canvas
                    wallId={w.id}
                    label={w.name}
                    initialWidth={w.width}
                    initialHeight={w.height}
                    onModulesChange={handleModulesChange}
                  />
                </div>
              ))}
            </div>

            {/* Controles de medidas de la pared activa */}
            <div className="wall-dimensions">
              <div className="field">
                <label>Ancho de la pared (m)</label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={activeWall?.width ?? 4}
                  onChange={(e) =>
                    updateActiveWall({ width: Math.max(1, parseFloat(e.target.value) || 1) })
                  }
                />
              </div>
              <div className="field">
                <label>Alto de la pared (m)</label>
                <input
                  type="number"
                  min="2"
                  step="0.1"
                  value={activeWall?.height ?? 3}
                  onChange={(e) =>
                    updateActiveWall({ height: Math.max(2, parseFloat(e.target.value) || 2) })
                  }
                />
              </div>
            </div>
          </div>
        </main>

        {/* Panel derecho */}
        <div className="app__right">
          <RightPanel summary={activeSummary} breakdown={activeBreakdown} />
        </div>
      </div>

      {/* Paso 0: selección de calidad */}
      {showQualityPicker && (
        <QualityPicker
          defaultValue={quality || 'premium'}
          onSelect={(q) => setQuality(q)}
        />
      )}

      {/* Admin: login + panel */}
      {adminOpen && !adminLogged && (
        <AdminLoginModal
          onClose={() => setAdminOpen(false)}
          onSuccess={() => setAdminLogged(true)}
        />
      )}
      {adminLogged && (
        <AdminPanel onClose={() => { setAdminLogged(false); setAdminOpen(false); }} />
      )}
    </div>
  );
}
