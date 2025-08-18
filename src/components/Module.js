
import React, { useState, useRef, useEffect } from 'react';

const Module = ({ module, onUpdate, onRemove, selected, onClick }) => {
  const moduleRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: module.x, y: module.y });

  useEffect(() => {
    setPosition({ x: module.x, y: module.y });
  }, [module.x, module.y]);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setDragging(true);
    onClick?.();
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const canvas = moduleRef.current?.parentElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - 50;
    const y = rect.bottom - e.clientY - 50;
    setPosition({ x, y });
    onUpdate?.(module.id, { x, y });
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <div
      ref={moduleRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'absolute',
        left: position.x,
        bottom: position.y,
        width: module.width,
        height: module.height,
        backgroundColor: module.color,
        border: selected ? '2px solid blue' : '1px dashed gray',
        backgroundImage: module.src ? `url(${module.src})` : undefined,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    />
  );
};

export default Module;
