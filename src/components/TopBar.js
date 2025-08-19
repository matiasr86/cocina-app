import React from 'react';

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__brand">Diseñá tu cocina fácil en 2D</div>

      <nav className="topbar__nav">
        <button className="btn ghost">Archivo</button>
        <button className="btn ghost">Editar</button>
        <button className="btn ghost">Ver</button>
        <button className="btn ghost">Ayuda</button>
      </nav>

      <div className="topbar__actions">
        <button className="btn primary">Log In</button>
      </div>
    </header>
  );
}
