import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [layout, setLayout] = useState('recta');

  const renderLayout = () => {
    const layoutMap = {
      recta: [4],
      l: [4, 4],
      c: [4, 4, 4],
    };

    const labelMap = {
      recta: ['Pared'],
      l: ['Pared izquierda', 'Pared derecha'],
      c: ['Pared izquierda', 'Pared central', 'Pared derecha'],
    };

    return layoutMap[layout].map((width, index) => (
      <Canvas
        key={index}
        initialWidth={width}   // ← ahora Canvas toma estos props (ver mini parche abajo)
        initialHeight={3}
        label={labelMap[layout][index]}
      />
    ));
  };

  const wrapperClass =
    layout === 'l' || layout === 'c' ? 'canvas-stack' : 'canvas-columns';

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-shell">
        <Sidebar />

        <main className="app-main">
          <h1 className="app-title">Diseñá tu cocina facil en 2D</h1>

          <div className="layout-picker">
            <label htmlFor="layout">Tipo de cocina: </label>
            <select
              id="layout"
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
            >
              <option value="recta">Recta</option>
              <option value="l">En L</option>
              <option value="c">En C</option>
            </select>
          </div>

          <div className={wrapperClass}>
            {renderLayout()}
          </div>
        </main>
      </div>
    </DndProvider>
  );
}

export default App;
