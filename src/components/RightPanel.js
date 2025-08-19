import React from 'react';

export default function RightPanel({ summary }) {
  const entries = Object.entries(summary || {}); // { titulo: cantidad }

  const total = entries.reduce((acc, [, n]) => acc + n, 0);

  return (
    <aside className="rightpanel">
      <h3 className="rightpanel__title">Detalles</h3>

      <div className="rightpanel__body">
        {entries.length === 0 ? (
          <p className="muted">Arrastrá módulos al lienzo para ver el resumen.</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Resumen de módulos</strong>
              <span>Total: {total}</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
              {entries.map(([title, count]) => (
                <li
                  key={title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #eee',
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: '#fafafa',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{title}</span>
                  <span
                    style={{
                      minWidth: 28,
                      textAlign: 'center',
                      background: '#111',
                      color: '#fff',
                      borderRadius: 999,
                      padding: '2px 8px',
                    }}
                  >
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
