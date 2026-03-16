import React, { useMemo, useState, useEffect } from 'react';
import { SHOWCASE } from '../data/showcase';
import './ShowcaseModal.css';

export default function ShowcaseModal({ open, onClose }) {
  const [filter, setFilter] = useState('Todos'); // Todos | Recta | L | C
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

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
      className="showcase-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Galería de inspiración"
    >
      <div
        className="showcase-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="showcase-header">
          <strong className="showcase-header__title">Inspírate ✨</strong>
          <div className="showcase-header__spacer" />
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>

        {/* Filtros */}
        {!selected && (
          <div className="showcase-filters">
            <div className="showcase-filterButtons">
              {['Todos', 'Recta', 'L', 'C'].map((t) => (
                <button
                  key={t}
                  className={`btn primary showcase-filterBtn ${filter === t ? 'is-active' : ''}`}
                  onClick={() => setFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título o tag…"
              className="showcase-search"
            />
          </div>
        )}

        {/* Grid o detalle */}
        {!selected ? (
          <div className="showcase-grid">
            {filtered.map((it) => (
              <article
                key={it.id}
                onClick={() => setSelected(it)}
                className="showcase-card"
                title="Ver detalle"
              >
                <div className="showcase-card__images">
                  <img
                    src={it.design}
                    alt={`${it.title} (diseño)`}
                    loading="lazy"
                    className="showcase-card__img"
                  />
                  <img
                    src={it.render}
                    alt={`${it.title} (render)`}
                    loading="lazy"
                    className="showcase-card__img"
                  />
                </div>

                <div className="showcase-card__body">
                  <div className="showcase-card__title">
                    {it.title} <span className="showcase-card__type">· {it.type}</span>
                  </div>

                  <div className="showcase-tags">
                    {(it.tags || []).slice(0, 4).map((tag) => (
                      <span key={tag} className="showcase-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="showcase-detail">
            <div className="showcase-detail__top">
              <button className="btn" onClick={() => setSelected(null)}>
                ← Volver
              </button>

              <div className="showcase-detail__title">{selected.title}</div>

              <div className="showcase-pill showcase-pill--type">
                {selected.type}
              </div>
            </div>

            <div className="showcase-detail__images">
              <figure className="showcase-figure">
                <div className="showcase-figure__label">Diseño</div>
                <img
                  src={selected.design}
                  alt={`${selected.title} (diseño)`}
                  className="showcase-detail__img"
                />
              </figure>

              <figure className="showcase-figure">
                <div className="showcase-figure__label">Render generado</div>
                <img
                  src={selected.render}
                  alt={`${selected.title} (render)`}
                  className="showcase-detail__img"
                />
              </figure>
            </div>

            <div className="showcase-detail__footer">
              <div className="showcase-detail__caption">{selected.caption}</div>

              <div className="showcase-header__spacer" />

              {(selected.tags || []).map((tag) => (
                <span key={tag} className="showcase-pill">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}