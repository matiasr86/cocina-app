import React, { useMemo, useState, useEffect, useCallback } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import RightPanel from './RightPanel';
import QualityPicker from './QualityPicker';
import { QUALITIES } from '../data/qualities';
import './AppLayout.css';

const LS_KEY_LAYOUT   = 'kitchen.layout.v1';
const LS_KEY_QUALITY  = 'kitchen.quality.v1';

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
  return [{ id: 'front', name: 'Pared Frontal', width: 4, height: 3 }];
};

export default function AppLayout() {
  /* -------- Calidad -------- */
  const [quality, setQuality] = useState(null); // 'started' | 'premium' | 'deluxe'

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY_QUALITY);
    if (raw) setQuality(raw);
  }, []);
  useEffect(() => {
    if (quality) localStorage.setItem(LS_KEY_QUALITY, quality);
  }, [quality]);

  const qualityName = useMemo(
    () => QUALITIES.find(q => q.id === quality)?.name || '',
    [quality]
  );

  /* -------- Layout paredes -------- */
  const [kitchenType, setKitchenType] = useState('Recta');
  const [wallsState, setWallsState]   = useState(() => makeWallsByType('Recta'));
  const [activeWallId, setActiveWallId] = useState(() => makeWallsByType('Recta')[0].id);

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

  useEffect(() => {
    const payload = { kitchenType, walls: wallsState, activeWallId };
    try { localStorage.setItem(LS_KEY_LAYOUT, JSON.stringify(payload)); } catch {}
  }, [kitchenType, wallsState, activeWallId]);

  const walls = useMemo(() => wallsState, [wallsState]);

  const onChangeKitchenType = (type) => {
    setKitchenType(type);
    const next = makeWallsByType(type);
    setWallsState((prev) => {
      const prevMap = new Map(prev.map(w => [w.id, w]));
      return next.map(w => prevMap.get(w.id) ? { ...w, ...prevMap.get(w.id) } : w);
    });
    setActiveWallId(next[0].id);
  };
  const updateActiveWall = (patch) => {
    setWallsState((prev) => prev.map(w => (w.id === activeWallId ? { ...w, ...patch } : w)));
  };
  const activeWall = walls.find(w => w.id === activeWallId) ?? walls[0];

  /* -------- Resumen en vivo -------- */
  const [summaries, setSummaries] = useState({});
  const handleModulesChange = useCallback((wallId, modules) => {
    const counts = {};
    modules.forEach((m) => {
      const title = (m.title && String(m.title).trim()) || 'Módulo';
      counts[title] = (counts[title] || 0) + 1;
    });
    setSummaries((prev) => ({ ...prev, [wallId]: counts }));
  }, []);
  const activeSummary = summaries[activeWallId] || {};

  /* -------- Vista -------- */
  const showPicker = !quality;

  return (
    <div className="app">
      <TopBar
        qualityName={qualityName}
        onChangeQuality={() => setQuality(null)} // reabrimos el picker
      />

      <div className="app__main">
        <div className="app__left">
          <Sidebar />
        </div>

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
              {walls.map(w => (
                <button
                  key={w.id}
                  className={`walltabs__tab ${w.id === activeWallId ? 'is-active' : ''}`}
                  onClick={() => setActiveWallId(w.id)}
                >
                  {w.name}
                </button>
              ))}
            </div>

            {/* Canvas */}
            <div className="workspace__canvas">
              {walls.map(w => (
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

            {/* Medidas pared activa */}
            <div className="wall-dimensions">
              <div className="field">
                <label>Ancho de la pared (m)</label>
                <input
                  type="number"
                  min="1" step="0.1"
                  value={activeWall?.width ?? 4}
                  onChange={(e) => updateActiveWall({ width: Math.max(1, parseFloat(e.target.value) || 1) })}
                />
              </div>
              <div className="field">
                <label>Alto de la pared (m)</label>
                <input
                  type="number"
                  min="2" step="0.1"
                  value={activeWall?.height ?? 3}
                  onChange={(e) => updateActiveWall({ height: Math.max(2, parseFloat(e.target.value) || 2) })}
                />
              </div>
            </div>
          </div>
        </main>

        <div className="app__right">
          <RightPanel summary={activeSummary} />
        </div>
      </div>

      {/* Paso 0: Picker de calidad (modal/full overlay) */}
      {showPicker && (
        <QualityPicker
          defaultValue={quality || 'premium'}
          onSelect={(q) => setQuality(q)}
        />
      )}
    </div>
  );
}
