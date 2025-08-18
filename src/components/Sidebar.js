import React, { useMemo, useState, useEffect, useCallback } from 'react';
import modules from '../data/modules';
import './Sidebar.css';

// normaliza texto para búsqueda (sin acentos, minúsculas)
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

const Section = ({ id, title, modules }) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(`sidebar_open_${id}`);
    if (saved !== null) setOpen(saved === '1');
  }, [id]);

  useEffect(() => {
    localStorage.setItem(`sidebar_open_${id}`, open ? '1' : '0');
  }, [id, open]);

  // payload alineado con lo que espera Canvas (application/x-module)
  const onDragStart = useCallback((e, m) => {
    // El Canvas espera: { kind, src, width, height, color }
    const payload = {
      kind: m.src ? 'image' : 'rect',
      src: m.src || null,                       // ej: '/assets/modules/fridge-right.png'
      width: Math.max(10, Math.round(m.width)), // 1 px = 1 cm en tu lienzo
      height: Math.max(10, Math.round(m.height)),
      color: m.color || '#ccc',
      title: m.title,
    };
    e.dataTransfer.setData('application/x-module', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  return (
    <div className="sb-section">
      <button className="sb-section-header" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <span className="chev">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="sb-section-body">
          {modules.map((m) => {
            const maxW = 140, maxH = 100;
            const scale = Math.min(maxW / m.width, maxH / m.height);
            const pw = Math.max(30, Math.round(m.width * scale));
            const ph = Math.max(24, Math.round(m.height * scale));
            return (
              <div
                key={`${m.section}-${m.type || m.title}`}
                className="sb-card"
                draggable
                onDragStart={(e) => onDragStart(e, m)}
                title={`${m.title} ${m.subtitle || ''} – ${m.width}×${m.height} cm`}
              >
                <div className="sb-card-fig" style={{ width: pw, height: ph }}>
                  {m.src ? (
                    <img
                      src={m.src}
                      alt={m.title}
                      draggable={false}                   // evita drag del <img>
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#eee' }} />
                  )}
                </div>
                <div className="sb-card-meta">
                  <div className="sb-card-title">{m.title}</div>
                  {m.subtitle && <div className="sb-card-sub">{m.subtitle}</div>}
                  <div className="sb-card-size">{m.width}×{m.height} cm</div>
                </div>
                <span className="sb-tag">{m.sectionLabel}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  const [q, setQ] = useState('');
  const nq = norm(q);

  // filtra por búsqueda
  const list = useMemo(() => {
    return modules.filter((m) => {
      const hay = norm(`${m.title} ${m.subtitle || ''} ${m.sectionLabel}`);
      return nq === '' || hay.includes(nq);
    });
  }, [nq]);

  // grupos por sección
  const bm  = useMemo(() => list.filter((m) => m.section === 'BM'),      [list]);
  const ala = useMemo(() => list.filter((m) => m.section === 'ALA'),     [list]);
  const esp = useMemo(() => list.filter((m) => m.section === 'ESP'),     [list]);
  const img = useMemo(() => list.filter((m) => m.section === 'ELECTRO'), [list]);

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

      <Section id="bm"  title="Bajo Mesada"        modules={bm} />
      <Section id="ala" title="Alacenas"           modules={ala} />
      <Section id="esp" title="Módulos Especiales" modules={esp} />
      <Section id="img" title="Electro"            modules={img} />
    </aside>
  );
}
