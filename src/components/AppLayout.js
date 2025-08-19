import React, { useMemo, useState } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import RightPanel from './RightPanel';
import './AppLayout.css';

// Helpers
const makeWallsByType = (type) => {
  if (type === 'L') {
    return [
      { id: 'left',    name: 'Pared Izquierda',  width: 4, height: 3 },
      { id: 'right',   name: 'Pared Derecha',    width: 4, height: 3 },
    ];
  }
  if (type === 'C') {
    return [
      { id: 'left',    name: 'Pared Izquierda',  width: 3.5, height: 3 },
      { id: 'front',   name: 'Pared Frontal',    width: 4.0,  height: 3 },
      { id: 'right',   name: 'Pared Derecha',    width: 3.5, height: 3 },
    ];
  }
  // Recta
  return [{ id: 'front', name: 'Pared Frontal', width: 4, height: 3 }];
};

export default function AppLayout() {
  // Tipo de cocina
  const [kitchenType, setKitchenType] = useState('Recta'); // 'Recta' | 'L' | 'C'

  // Paredes y medidas (se regeneran cuando cambia el tipo)
  const [wallsState, setWallsState] = useState(() => makeWallsByType('Recta'));
  const walls = useMemo(() => wallsState, [wallsState]);

  // Pared activa
  const [activeWallId, setActiveWallId] = useState(walls[0].id);

  // Si cambia el tipo → rehacer paredes y seleccionar la primera
  const onChangeKitchenType = (type) => {
    setKitchenType(type);
    const next = makeWallsByType(type);
    setWallsState(next);
    setActiveWallId(next[0].id);
  };

  // Cambiar medidas de la pared activa
  const updateActiveWall = (patch) => {
    setWallsState((prev) =>
      prev.map((w) => (w.id === activeWallId ? { ...w, ...patch } : w))
    );
  };

  const activeWall = walls.find((w) => w.id === activeWallId) ?? walls[0];

  // Para centrar el canvas y mantener estado por pared:
  // renderizamos TODOS los Canvas pero solo mostramos el activo (display:none en el resto).
  return (
    <div className="app">
      <TopBar />

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

            {/* Área de canvas (centrado) */}
            <div className="workspace__canvas">
              {walls.map((w) => (
                <div
                  key={w.id}
                  style={{ display: w.id === activeWallId ? 'block' : 'none' }}
                >
                  <Canvas
                    label={w.name}
                    initialWidth={w.width}   // tu Canvas usa initialWidth/initialHeight
                    initialHeight={w.height} // y recalcula en cada render → OK
                  />
                </div>
              ))}
            </div>

            {/* Controles de medidas para la pared activa */}
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
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
