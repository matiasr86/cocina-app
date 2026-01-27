import React, { useState } from 'react';
import { QUALITIES, QUALITY_MATRIX } from '../data/qualities';
import './AppLayout.css';

export default function QualityPicker({ defaultValue, onSelect, onDismiss }) {
  const [showCompare, setShowCompare] = useState(false);
  const [selected, setSelected] = useState(defaultValue || 'premium');

  return (
    <div className="qp__overlay">
      <div className="qp__dialog">
        <div className="qp__header">
          <h2 className="qp__title">Elegí la calidad</h2>
          {onDismiss && <button className="btn ghost" onClick={onDismiss}>Cerrar</button>}
        </div>

        <div className="qp__cards">
          {QUALITIES.map(q => (
            <button
              key={q.id}
              className={`qp__card ${selected === q.id ? 'is-active' : ''}`}
              onClick={() => setSelected(q.id)}
            >
              <div className="qp__card-name">{q.name}</div>
              <div className="qp__card-hl">{q.highlight}</div>
            </button>
          ))}
        </div>

        <div className="qp__actions">
          <button className="btn ghost" onClick={() => setShowCompare(s => !s)}>
            {showCompare ? 'Ocultar comparación' : 'Comparar calidades'}
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn primary" onClick={() => onSelect?.(selected)}>
            Empezar con {QUALITIES.find(q => q.id === selected)?.name}
          </button>
        </div>

        {showCompare && (
          <div className="qp__table">
            <table>
              <thead>
                <tr>
                  <th className="sticky-col">Ítem</th>
                  {QUALITIES.map(q => <th key={q.id}>{q.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {QUALITY_MATRIX.map((sec, i) => (
                  <React.Fragment key={i}>
                    <tr className="section-row">
                      <td className="sticky-col" colSpan={QUALITIES.length + 1}>{sec.section}</td>
                    </tr>
                    {sec.header && (
                      <tr className="header-row">
                        <td className="sticky-col" />
                        {QUALITIES.map(q => (
                          <td key={q.id}><strong>{sec.header[q.id] || '—'}</strong></td>
                        ))}
                      </tr>
                    )}
                    {sec.rows.map((r, j) => (
                      <tr key={j}>
                        <td className="sticky-col">{r.label}</td>
                        {QUALITIES.map(q => <td key={q.id}>{r[q.id] || '—'}</td>)}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
