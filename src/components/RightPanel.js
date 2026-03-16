import React, { useState } from 'react';
import FabricatorsModal from './FabricatorsModal';
import './RightPanel.css';

const fmt = (n) =>
  typeof n === 'number' && !Number.isNaN(n)
    ? n.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      })
    : '—';

export default function RightPanel({ summary = {}, breakdown = {} }) {
  const [fabricatorsOpen, setFabricatorsOpen] = useState(false);

  const instancia = (process.env.REACT_APP_INSTANCIA || 'base').toLowerCase();
  const showRegistryButton = instancia === 'base';
  const showPriceEstimate = instancia !== 'base';
  const showFabricatorsCTA = instancia !== 'fabricante';

  const entries = Object.entries(summary);
  const items = breakdown.items || [];
  const total = breakdown.total || 0;

  const handleOpenFabricators = () => {
    setFabricatorsOpen(true);
  };

  return (
    <aside className="rightpanel">
      {showFabricatorsCTA && (
        <div className="rp-cta">
          <div className="rp-cta__eyebrow">Clientes ⇆ Fabricantes</div>
          <div className="rp-cta__title">¿Buscás fabricante?</div>
          <div className="rp-cta__text">
            Encontrá los más cercanos en el <strong>Registro de Fabricantes</strong>.
          </div>
          <div className="rp-cta__text">
            ¿Sos fabricante? <strong>Registrate gratis.</strong>
          </div>
        </div>
      )}

      {showRegistryButton && (
        <button
          type="button"
          className="rp-btn"
          onClick={handleOpenFabricators}
          title="Abrir búsqueda y registro de fabricantes"
        >
          Registro de Fabricantes
        </button>
      )}

      <div className="rp-header">
        <h3 className="rightpanel__title">Detalles</h3>
      </div>

      <div className="rightpanel__body">
        <div className="rp-block">
          <div className="rp-block__hdr">
            <strong>Resumen de módulos</strong>
            <span>Total: {entries.reduce((acc, [, n]) => acc + n, 0)}</span>
          </div>

          {entries.length === 0 ? (
            <p className="muted">Arrastrá módulos al lienzo para ver el resumen.</p>
          ) : (
            <ul className="rp-list">
              {entries.map(([title, count]) => (
                <li key={title} className="rp-list__item">
                  <span className="rp-list__label">{title}</span>
                  <span className="rp-list__badge">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showPriceEstimate && (
          <div className="rp-block">
            <strong>Estimación (según calidad seleccionada)</strong>

            {items.length === 0 ? (
              <p className="muted" style={{ marginTop: 6 }}>
                Sin items con precio configurado.
              </p>
            ) : (
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th className="rp-th-left">Módulo</th>
                      <th className="rp-th-right">Cant.</th>
                      <th className="rp-th-right">Unit.</th>
                      <th className="rp-th-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.type}>
                        <td className="rp-td-left">{it.title}</td>
                        <td className="rp-td-right">{it.count}</td>
                        <td className="rp-td-right">{fmt(it.unit)}</td>
                        <td className="rp-td-right">{fmt(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="rp-td-right" colSpan={3} style={{ fontWeight: 700 }}>
                        Total
                      </td>
                      <td className="rp-td-right" style={{ fontWeight: 700 }}>
                        {fmt(total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <FabricatorsModal
        open={fabricatorsOpen}
        onClose={() => setFabricatorsOpen(false)}
      />
    </aside>
  );
}