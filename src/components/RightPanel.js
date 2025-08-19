import React from 'react';

export default function RightPanel({ children }) {
  return (
    <aside className="rightpanel">
      <h3 className="rightpanel__title">Detalles</h3>
      <div className="rightpanel__body">
        {children || (
          <p className="muted">
            Acá vamos a mostrar medidas, colisiones, sugerencias y costos en tiempo real.
          </p>
        )}
      </div>
    </aside>
  );
}
