import React, { useRef } from 'react';

const DRAG_THRESHOLD = 3; // px

export default function Module({
  module,
  onUpdate,
  selected,
  onClick,
  axisMargin = 50,     // 👈 llegan desde Canvas
  bottomMargin = 50,   // 👈
}) {
  const elRef = useRef(null);

  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const offsetsRef = useRef({ x: 0, y: 0 });

  const getCanvas = () => elRef.current?.closest('.canvas-surface') || null;

  const pointerToCanvas = (clientX, clientY, rect) => {
    // coord. de puntero convertidas al sistema del lienzo (origen abajo-izquierda del área útil)
    const x = clientX - rect.left - axisMargin;
    const y = rect.bottom - clientY - bottomMargin;
    return { x, y };
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    onClick?.(module.id); // seleccionar

    const canvas = getCanvas();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const { x: px, y: py } = pointerToCanvas(e.clientX, e.clientY, rect);
    startRef.current = { x: e.clientX, y: e.clientY };
    offsetsRef.current = { x: px - module.x, y: py - module.y };

    movedRef.current = false;
    draggingRef.current = true;

    elRef.current?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;

    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (!movedRef.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      movedRef.current = true;
    }
    if (!movedRef.current) return;

    const canvas = getCanvas();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x: px, y: py } = pointerToCanvas(e.clientX, e.clientY, rect);

    // Proponemos nueva posición — el Canvas valida (clamp + colisión)
    const nx = Math.round(px - offsetsRef.current.x);
    const ny = Math.round(py - offsetsRef.current.y);

    onUpdate?.(module.id, { x: nx, y: ny });
  };

  const handlePointerUp = (e) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    try { elRef.current?.releasePointerCapture?.(e.pointerId); } catch {}
    if (!movedRef.current) onClick?.(module.id); // click limpio
    draggingRef.current = false;
    movedRef.current = false;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(module.id);
  };

  return (
    <div
    ref={elRef}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onClick={handleClick}
    className={`module${selected ? ' selected' : ''}`}
    style={{
      position: 'absolute',
      left: axisMargin + module.x,
      bottom: bottomMargin + module.y,

      width: module.width,
      height: module.height,
      boxSizing: 'border-box',

      // 🔴 Fondo blanco cuando es PNG para tapar la grilla y permitir “pegado” visual
      backgroundColor: module.src ? '#ffffff' : (module.color || 'transparent'),
      backgroundImage: module.src ? `url(${module.src})` : undefined,
      backgroundSize: '100% 100%',     
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',

      // ❌ Sin bordes que agreguen “aire” al box
      border: 'none',
      // ✅ Usamos outline solo al seleccionar (no altera layout)
      outline: selected ? '2px solid #2979ff' : 'none',
      outlineOffset: 0,

      cursor: draggingRef.current ? 'grabbing' : 'grab',
      userSelect: 'none',
      touchAction: 'none',
      zIndex: selected ? 2 : 1,
    }}
  />
  );
}
