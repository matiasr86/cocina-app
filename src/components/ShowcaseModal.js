import React, { useMemo, useState, useEffect } from 'react';
import { SHOWCASE } from '../data/showcase';

export default function ShowcaseModal({ open, onClose }) {
  const [filter, setFilter] = useState('Todos'); // Todos | Recta | L | C
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null); // item seleccionado

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setQ('');
      setFilter('Todos');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const t = (q || '').trim().toLowerCase();
    return SHOWCASE.filter((it) => {
      const okType = filter === 'Todos' || it.type === filter;
      const hayQ =
        !t ||
        it.title.toLowerCase().includes(t) ||
        it.tags?.some((tag) => tag.toLowerCase().includes(t)) ||
        it.caption?.toLowerCase().includes(t);
      return okType && hayQ;
    });
  }, [filter, q]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1650,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Galería de inspiración"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1200px, 96vw)',
          maxHeight: '92vh',
          background: '#111',
          borderRadius: 12,
          padding: 14,
          boxShadow: '0 10px 40px rgba(0,0,0,.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <strong style={{ color: '#fff', fontSize: 16 }}>Inspírate ✨</strong>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>

        {/* Filtros */}
        {!selected && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Todos', 'Recta', 'L', 'C'].map((t) => (
              <button
                key={t}
                className="btn primary"
                onClick={() => setFilter(t)}
                style={{
                  borderColor: filter === t ? '#09f' : '#333',
                  background: filter === t ? '#0b2742' : '#181818',
                }}
              >
                {t}
              </button>
            ))}

            <div style={{ flex: 1 }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título o tag…"
              style={{
                minWidth: 220,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #333',
                background: '#1a1a1a',
                color: '#ddd',
              }}
            />
          </div>
        )}

        {/* Grid o Detalle */}
        {!selected ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
              gap: 12,
              overflow: 'auto',
              paddingBottom: 8,
            }}
          >
            {filtered.map((it) => (
              <article
                key={it.id}
                onClick={() => setSelected(it)}
                style={{
                  border: '1px solid #2a2a2a',
                  borderRadius: 10,
                  background: '#141414',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                title="Ver detalle"
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <img
                    src={it.design}
                    alt={`${it.title} (diseño)`}
                    loading="lazy"
                    style={{ width: '100%', height: 120, objectFit: 'cover', background: '#000' }}
                  />
                  <img
                    src={it.render}
                    alt={`${it.title} (render)`}
                    loading="lazy"
                    style={{ width: '100%', height: 120, objectFit: 'cover', background: '#000' }}
                  />
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                    {it.title} <span style={{ color: '#9aa' }}>· {it.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(it.tags || []).slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="pill"
                        style={{
                          background: '#1f1f1f',
                          borderRadius: 14,
                          padding: '2px 8px',
                          color: '#bdbdbd',
                          fontSize: 12,
                          border: '1px solid #2b2b2b',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            {/* Título + volver */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn" onClick={() => setSelected(null)}>← Volver</button>
              <div style={{ color: '#fff', fontWeight: 600 }}>{selected.title}</div>
              <div className="pill" style={{ marginLeft: 'auto', background: '#181818', color: '#ddd' }}>
                {selected.type}
              </div>
            </div>

            {/* Vista lado a lado */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                overflow: 'auto',
                padding: 4,
              }}
            >
              <figure
                style={{
                  background: '#000',
                  borderRadius: 10,
                  border: '1px solid #222',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '6px 10px', color: '#ccc', fontSize: 13 }}>Diseño</div>
                <img
                  src={selected.design}
                  alt={`${selected.title} (diseño)`}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </figure>

              <figure
                style={{
                  background: '#000',
                  borderRadius: 10,
                  border: '1px solid #222',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '6px 10px', color: '#ccc', fontSize: 13 }}>Render generado</div>
                <img
                  src={selected.render}
                  alt={`${selected.title} (render)`}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </figure>
            </div>

            {/* Notas / tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ color: '#9fb', fontSize: 13 }}>{selected.caption}</div>
              <div style={{ flex: 1 }} />
              {(selected.tags || []).map((t) => (
                <span
                  key={t}
                  className="pill"
                  style={{
                    background: '#1f1f1f',
                    borderRadius: 14,
                    padding: '4px 10px',
                    color: '#bdbdbd',
                    fontSize: 12,
                    border: '1px solid #2b2b2b',
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
