// src/components/RightPanel.js
import React from 'react';

const fmt = (n) =>
  typeof n === 'number' && !Number.isNaN(n)
    ? n.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      })
    : '—';

export default function RightPanel({ summary, breakdown }) {
  const entries = Object.entries(summary || {}); // { titulo: cantidad }
  const items = breakdown?.items || [];
  const total = breakdown?.total || 0;

  return (
    <aside className="rightpanel">
      <h3 className="rightpanel__title">Detalles</h3>

      <div className="rightpanel__body">
        {/* Resumen de módulos */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>Resumen de módulos</strong>
            <span>Total: {entries.reduce((acc, [, n]) => acc + n, 0)}</span>
          </div>
          {entries.length === 0 ? (
            <p className="muted">Arrastrá módulos al lienzo para ver el resumen.</p>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: 6,
              }}
            >
              {entries.map(([title, count]) => (
                <li
                  key={title}
                  style={{
                    display: 'flex',
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
          )}
        </div>

        {/* Estimación económica */}
        <div>
          <strong>Estimación (según calidad seleccionada)</strong>
          {items.length === 0 ? (
            <p className="muted" style={{ marginTop: 6 }}>
              Sin items con precio configurado.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px 4px' }}>
                    Módulo
                  </th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #eee', padding: '6px 4px' }}>
                    Cant.
                  </th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #eee', padding: '6px 4px' }}>
                    Unit.
                  </th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #eee', padding: '6px 4px' }}>
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.type}>
                    <td style={{ padding: '6px 4px' }}>{it.title}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right' }}>{it.count}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right' }}>{fmt(it.unit)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right' }}>{fmt(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700 }}>
                    Total
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700 }}>{fmt(total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Condiciones (nuevo bloque) */}
        <div
          style={{
            marginTop: 18,
            padding: '12px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            background: '#f8fafc',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Condiciones</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: '#334155' }}>
            Precio más IVA
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: '#334155' }}>
            Entrega y Colocación 15% Adicional.
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: '#334155' }}>
            Decuentos especiales a desarrolladoras.
          </div>
        </div>
      </div>
    </aside>
  );
}
