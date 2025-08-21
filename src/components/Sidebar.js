// src/components/Sidebar.js
import React, { useMemo, useState, useCallback } from 'react';
import { useModules } from '../context/ModulesContext';
import './Sidebar.css';

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');

const Section = ({ title, mods }) => {
  const onDragStart = useCallback((e, m) => {
    const payload = {
      type: m.type,
      title: m.name || m.title || m.type,
      src: m.src || null,
      sizes: Array.isArray(m.sizes) ? m.sizes : [], // <-- importante
      width: m.width,   // fallback si no hubiera sizes
      height: m.height,
    };
    e.dataTransfer.setData('application/x-module', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  return (
    <div className="sb-section">
      <div className="sb-section-header">{title}</div>
      <div className="sb-section-body">
        {mods.map((m) => {
          const maxW = 140, maxH = 100;
          const pw = Math.max(30, Math.min(maxW, m.width || 100));
          const ph = Math.max(24, Math.min(maxH, m.height || 80));
          return (
            <div
              key={m.type}
              className="sb-card"
              draggable
              onDragStart={(e) => onDragStart(e, m)}
              title={`${m.name || m.title || m.type}`}
            >
              <div className="sb-card-fig" style={{ width: pw, height: ph }}>
                {m.src ? (
                  <img
                    src={m.src}
                    alt={m.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    draggable={false}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#eee' }} />
                )}
              </div>
              <div className="sb-card-meta">
                <div className="sb-card-title">{m.name || m.title || m.type}</div>
                {m.subtitle && <div className="sb-card-sub">{m.subtitle}</div>}
              </div>
              {m.sectionLabel && <span className="sb-tag">{m.sectionLabel}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Sidebar() {
  const { modules } = useModules();
  const [q, setQ] = useState('');
  const nq = norm(q);

  const list = useMemo(() => {
    return modules.filter((m) => {
      const hay = norm(`${m.name || m.title || ''} ${m.sectionLabel || ''}`);
      return nq === '' || hay.includes(nq);
    });
  }, [modules, nq]);

  // Ajustá estas secciones a tu data real
  const bm  = useMemo(() => list.filter(m => m.section === 'BM'),  [list]);
  const ala = useMemo(() => list.filter(m => m.section === 'ALA'), [list]);
  const esp = useMemo(() => list.filter(m => m.section === 'ESP'), [list]);
  const ele = useMemo(() => list.filter(m => m.section === 'ELECTRO'), [list]);

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

      <Section title="Bajo Mesada" mods={bm} />
      <Section title="Alacenas"    mods={ala} />
      <Section title="Especiales"  mods={esp} />
      <Section title="Electro"     mods={ele} />
    </aside>
  );
}
