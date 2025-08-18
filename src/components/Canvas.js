import React, { useState, useRef, useCallback } from 'react';
import './Canvas.css';

const AXIS_MARGIN = 50;
const BOTTOM_MARGIN = 50;
const GRID_STEP = 25;
const LABEL_STEP = 50;

const Canvas = ({ label, initialWidth = 4, initialHeight = 3 }) => {
  const [modules, setModules] = useState([]);
  const [dragInfo, setDragInfo] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const canvasRef = useRef(null);

  const pxW = initialWidth * 100;
  const pxH = initialHeight * 100;

  const hasCollision = (newMod, excludeId = null) => {
    return modules.some(mod => {
      if (mod.id === excludeId) return false;
      return (
        newMod.x < mod.x + mod.width &&
        newMod.x + newMod.width > mod.x &&
        newMod.y < mod.y + mod.height &&
        newMod.y + newMod.height > mod.y
      );
    });
  };

  const handleCanvasDragOver = useCallback((e) => {
    const hasPayload = e.dataTransfer?.types?.includes('application/x-module');
    if (hasPayload || dragInfo) e.preventDefault();
  }, [dragInfo]);

  const handleCanvasDrop = useCallback((e) => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dropX = e.clientX - rect.left - AXIS_MARGIN;
    const dropY = e.clientY - rect.top;

    if (dragInfo) {
      e.preventDefault();
      const newX = dropX - dragInfo.offsetX;
      const newY = dropY - dragInfo.offsetY;
      const updated = modules.map(mod => {
        if (mod.id !== dragInfo.id) return mod;
        const proposed = {
          ...mod,
          x: Math.max(0, Math.min(newX, pxW - mod.width)),
          y: Math.max(0, Math.min(pxH - newY - mod.height, pxH - mod.height))
        };
        return hasCollision(proposed, mod.id) ? mod : proposed;
      });
      setModules(updated);
      setDragInfo(null);
      return;
    }

    const payload = e.dataTransfer.getData('application/x-module');
    if (!payload) return;
    e.preventDefault();

    let data;
    try {
      data = JSON.parse(payload);
    } catch {
      return;
    }

    const width = Math.max(10, Math.round(data.width ?? 60));
    const height = Math.max(10, Math.round(data.height ?? 60));
    const x = Math.max(0, Math.min(dropX, pxW - width));
    const y = Math.max(0, Math.min(pxH - dropY - height, pxH - height));

    const newModule = {
      id: crypto.randomUUID(),
      kind: data.kind || 'image',
      x, y, width, height,
      src: data.src || null,
      color: data.color || '#ccc'
    };

    if (!hasCollision(newModule)) {
      setModules(prev => [...prev, newModule]);
    }
  }, [dragInfo, pxW, pxH, modules]);

  const handleMouseDown = (e, mod) => {
    e.stopPropagation();
    setSelectedId(mod.id);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragInfo({
      id: mod.id,
      offsetX: e.clientX - rect.left - AXIS_MARGIN - mod.x,
      offsetY: e.clientY - rect.top - (pxH - mod.y - mod.height)
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragInfo) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - AXIS_MARGIN - dragInfo.offsetX;
    const newY = e.clientY - rect.top - dragInfo.offsetY;
    setModules(prev => prev.map(mod => {
      if (mod.id !== dragInfo.id) return mod;
      const proposed = {
        ...mod,
        x: Math.max(0, Math.min(newX, pxW - mod.width)),
        y: Math.max(0, Math.min(pxH - newY - mod.height, pxH - mod.height))
      };
      return hasCollision(proposed, mod.id) ? mod : proposed;
    }));
  }, [dragInfo, pxW, pxH, modules]);

  const handleMouseUp = () => {
    if (dragInfo) setDragInfo(null);
  };

  const handleCanvasClick = () => setSelectedId(null);

  const handleDelete = () => {
    if (selectedId) {
      setModules(prev => prev.filter(m => m.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleEdit = (key, value) => {
    setModules(prev => prev.map(mod => {
      if (mod.id !== selectedId) return mod;
      return { ...mod, [key]: value };
    }));
  };

  const selectedModule = modules.find(m => m.id === selectedId);

  return (
    <div style={{ flex: 1 }}>
      <div style={{ padding: 10, fontWeight: 'bold' }}>{label}</div>
      <div
        className="canvas-surface"
        ref={canvasRef}
        style={{ width: pxW + AXIS_MARGIN, height: pxH + BOTTOM_MARGIN }}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <svg width={pxW + AXIS_MARGIN} height={pxH + BOTTOM_MARGIN}>
          <g transform={`translate(${AXIS_MARGIN}, 0)`}>
            <rect width={pxW} height={pxH} y={0} fill="#fff" stroke="#ccc" />
            {Array.from({ length: pxW / GRID_STEP + 1 }, (_, i) => (
              <line key={`v${i}`} x1={i * GRID_STEP} y1={0} x2={i * GRID_STEP} y2={pxH} stroke="#eee" />
            ))}
            {Array.from({ length: pxH / GRID_STEP + 1 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={i * GRID_STEP} x2={pxW} y2={i * GRID_STEP} stroke="#eee" />
            ))}
            {modules.map(mod => (
              <foreignObject
                key={mod.id}
                x={mod.x}
                y={pxH - mod.y - mod.height}
                width={mod.width}
                height={mod.height}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    cursor: 'move',
                    border: mod.id === selectedId ? '2px solid blue' : 'none'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, mod)}
                >
                  {mod.src ? (
                    <img
                      src={mod.src}
                      alt="img"
                      width={mod.width}
                      height={mod.height}
                      draggable={false}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    />
                  ) : (
                    <div style={{ backgroundColor: mod.color, width: '100%', height: '100%' }} />
                  )}
                </div>
              </foreignObject>
            ))}
          </g>
          {Array.from({ length: pxW / LABEL_STEP + 1 }, (_, i) => (
            <text key={`x${i}`} x={AXIS_MARGIN + i * LABEL_STEP} y={pxH + 15} fontSize={10}>{i * 50} cm</text>
          ))}
          {Array.from({ length: pxH / LABEL_STEP + 1 }, (_, i) => (
            <text key={`y${i}`} x={2} y={pxH - i * LABEL_STEP} fontSize={10}>{i * 50} cm</text>
          ))}
        </svg>
        {selectedId && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, background: 'white', padding: 10, border: '1px solid #ccc' }}>
            <button onClick={handleDelete} style={{ marginBottom: 10 }}>Eliminar módulo</button>
            {selectedModule && (
              <div>
                <div>
                  <label>Color: </label>
                  <input type="color" value={selectedModule.color} onChange={e => handleEdit('color', e.target.value)} />
                </div>
                <div>
                  <label>Ancho (cm): </label>
                  <input type="number" value={selectedModule.width} onChange={e => handleEdit('width', parseInt(e.target.value, 10))} />
                </div>
                <div>
                  <label>Alto (cm): </label>
                  <input type="number" value={selectedModule.height} onChange={e => handleEdit('height', parseInt(e.target.value, 10))} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
