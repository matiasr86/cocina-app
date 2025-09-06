import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useModules } from '../context/ModulesContext';
import './Sidebar.css';

const norm = (s = '') =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

function moduleToPayload(m) {
  return {
    type: m.type,
    title: m.name || m.title || m.type,
    color: m.color || '#ddd',
    src: m.src || null,
    sizes: Array.isArray(m.sizes) ? m.sizes : [],
    width: m.width || 60,
    height: m.height || 60,
    isLinear: !!m.isLinear,
    allowedHeights: Array.isArray(m.allowedHeights) ? m.allowedHeights : undefined,
    section: m.section,
  };
}

function Section({ id, title, modules, onCardClick }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(`sidebar_open_${id}`);
    if (saved !== null) setOpen(saved === '1');
  }, [id]);

  useEffect(() => {
    localStorage.setItem(`sidebar_open_${id}`, open ? '1' : '0');
  }, [id, open]);

  const onDragStart = useCallback((e, m) => {
    const payload = moduleToPayload(m);
    e.dataTransfer.setData('application/x-module', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  return (
    <div className="sb-section">
      <button
        className="sb-section-header"
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <span className="sb-section-title">{title}</span>
        <span className="sb-chev">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="sb-section-body">
          {modules.map((m) => {
            const maxW = 120, maxH = 80;
            const baseW = m.sizes?.[0]?.width || m.width || 60;
            const baseH = m.sizes?.[0]?.height || m.height || 60;
            const scale = Math.min(maxW / baseW, maxH / baseH);
            const pw = Math.max(30, Math.round(baseW * scale));
            const ph = Math.max(24, Math.round(baseH * scale));

            return (
              <div
                key={m.type}
                className="sb-card sb-card--simple"
                draggable
                onDragStart={(e) => onDragStart(e, m)}
                onClick={() => onCardClick?.(moduleToPayload(m))}
                style={{ cursor: 'pointer' }}
                title="Arrastrá al lienzo o hacé click para colocar"
              >
                <div className="sb-card-fig" style={{ width: pw, height: ph }}>
                  {m.src ? (
                    <img
                      src={m.src}
                      alt={m.name || m.title || m.type}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      draggable={false}
                    />
                  ) : (
                    <div className="sb-thumb-fallback" />
                  )}
                </div>

                <div className="sb-card-meta">
                  <div className="sb-card-title">{m.name || m.title || m.type}</div>
                  {m.sectionLabel && (
                    <div className="sb-card-label">{m.sectionLabel}</div>
                  )}
                  {m.subtitle && (
                    <div className="sb-card-sub">{m.subtitle}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ onModuleClick }) {
  const { modules: catalog } = useModules();
  const [q, setQ] = useState('');
  const nq = norm(q);

  const filtered = useMemo(() => {
    if (!nq) return catalog;
    return catalog.filter(m => {
      const hay = norm(`${m.name || m.title || m.type} ${m.subtitle || ''} ${m.sectionLabel || ''}`);
      return hay.includes(nq);
    });
  }, [catalog, nq]);

  const ZO   = useMemo(() => filtered.filter(m => m.section === 'ZO'), [filtered]);
  const BM   = useMemo(() => filtered.filter(m => m.section === 'BM'), [filtered]);
  const ALA  = useMemo(() => filtered.filter(m => m.section === 'ALA'), [filtered]);
  const ALAP = useMemo(() => filtered.filter(m => m.section === 'ALAP'), [filtered]);
  const ESP  = useMemo(() => filtered.filter(m => m.section === 'ESP'), [filtered]);
  const ELE  = useMemo(() => filtered.filter(m => m.section === 'ELECTRO'), [filtered]);

  return (
    <aside className="sidebar">
      <h2 className="sb-title">Módulos</h2>

      <div className="sb-search">
        <input
          placeholder="Buscar módulo…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && <button className="clear" onClick={() => setQ('')}>✕</button>}
      </div>
      <hr />

      <Section id="zo"   title="Banquina / Zócalo"   modules={ZO}   onCardClick={onModuleClick} />
      <Section id="bm"   title="Bajo Mesada"         modules={BM}   onCardClick={onModuleClick} />
      <Section id="ala"  title="Alacenas"            modules={ALA}  onCardClick={onModuleClick} />
      <Section id="alap" title="Alacenas Puente"     modules={ALAP} onCardClick={onModuleClick} />
      <Section id="esp"  title="Especiales"          modules={ESP}  onCardClick={onModuleClick} />
      <Section id="ele"  title="Electro"             modules={ELE}  onCardClick={onModuleClick} />
    </aside>
  );
}
