// src/components/AppLayout.js
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import RightPanel from './RightPanel';
import QualityPicker from './QualityPicker';
import AdminPanel from './AdminPanel';
import { ModulesProvider, useModules } from '../context/ModulesContext';
import { QUALITIES } from '../data/qualities';

import { AuthProvider, useAuth } from '../context/AuthContext';
import AdminEmailLoginModal from './AdminEmailLoginModal';

import PdfExportButton from './PdfExportButton';
import './AppLayout.css';

const LS_KEY_LAYOUT  = 'kitchen.layout.v1';
const LS_KEY_QUALITY = 'kitchen.quality.v1';

const makeWallsByType = (type) => {
  if (type === 'L') {
    return [
      { id: 'left',  name: 'Pared Izquierda', width: 4,   height: 3 },
      { id: 'right', name: 'Pared Derecha',   width: 4,   height: 3 },
    ];
  }
  if (type === 'C') {
    return [
      { id: 'left',  name: 'Pared Izquierda', width: 3.5, height: 3 },
      { id: 'front', name: 'Pared Frontal',   width: 4.0, height: 3 },
      { id: 'right', name: 'Pared Derecha',   width: 3.5, height: 3 },
    ];
  }
  return [{ id: 'front', name: 'Pared Frontal', width: 4, height: 3 }];
};

export default function AppLayout() {
  return (
    <AuthProvider>
      <ModulesProvider>
        <AppLayoutInner />
      </ModulesProvider>
    </AuthProvider>
  );
}

function AppLayoutInner() {
  const { modules: catalog } = useModules();
  const { user, authReady, isAdmin } = useAuth();

  /* -------------------- Calidad -------------------- */
  const [quality, setQuality] = useState(null);
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY_QUALITY);
    if (raw) setQuality(raw);
  }, []);
  useEffect(() => {
    if (quality) localStorage.setItem(LS_KEY_QUALITY, quality);
  }, [quality]);

  const qualityName = useMemo(
    () => QUALITIES.find((q) => q.id === quality)?.name || '',
    [quality]
  );
  const priceKey =
    quality === 'deluxe' ? 'deluxe' :
    quality === 'premium' ? 'premium' :
    'started';

  /* -------------------- Paredes/Layout -------------------- */
  const [kitchenType, setKitchenType] = useState('Recta');
  const [wallsState, setWallsState] = useState(() => makeWallsByType('Recta'));
  const [activeWallId, setActiveWallId] = useState(() => makeWallsByType('Recta')[0].id);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_LAYOUT);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.kitchenType) setKitchenType(parsed.kitchenType);
      if (Array.isArray(parsed?.walls)) setWallsState(parsed.walls);
      if (parsed?.activeWallId) setActiveWallId(parsed.activeWallId);
    } catch {}
  }, []);

  useEffect(() => {
    const payload = { kitchenType, walls: wallsState, activeWallId };
    try { localStorage.setItem(LS_KEY_LAYOUT, JSON.stringify(payload)); } catch {}
  }, [kitchenType, wallsState, activeWallId]);

  const walls = useMemo(() => wallsState, [wallsState]);

  const onChangeKitchenType = (type) => {
    setKitchenType(type);
    const next = makeWallsByType(type);
    setWallsState((prev) => {
      const prevMap = new Map(prev.map((w) => [w.id, w]));
      return next.map((w) => (prevMap.get(w.id) ? { ...w, ...prevMap.get(w.id) } : w));
    });
    setActiveWallId(next[0].id);
  };

  const updateActiveWall = (patch) => {
    setWallsState((prev) => prev.map((w) => (w.id === activeWallId ? { ...w, ...patch } : w)));
  };

  const activeWall = walls.find((w) => w.id === activeWallId) ?? walls[0];

  /* -------------------- Resumen + Estimación (con detalle) -------------------- */
  const [summaries, setSummaries] = useState({});
  const [breakdowns, setBreakdowns] = useState({});

  const handleModulesChange = useCallback(
    (wallId, mods) => {
      const byTitle = mods.reduce((acc, m) => {
        const t = (m.title && String(m.title).trim()) || 'Módulo';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      setSummaries((prev) => ({ ...prev, [wallId]: byTitle }));

      const byTypeMeta = new Map(catalog.map((c) => [c.type, c]));
      const groups = new Map();
      const instances = [];

      const getDeltaPct = (meta, m) => {
        if (typeof m.priceDeltaPct === 'number') return m.priceDeltaPct;
        const sizes = Array.isArray(meta?.sizes) ? meta.sizes : [];
        const found = sizes.find(
          (s) => Number(s.width) === Number(m.width) && Number(s.height) === Number(m.height)
        );
        return typeof found?.deltaPct === 'number' ? found.deltaPct : 0;
      };

      for (const m of mods) {
        const meta = byTypeMeta.get(m.type);
        if (!meta) continue;

        const base = meta?.prices?.[priceKey];
        if (typeof base !== 'number') continue;

        const deltaPct = getDeltaPct(meta, m);
        const unitInstance = Math.round(base * (1 + deltaPct / 100) * 100) / 100;

        instances.push({
          type: m.type,
          title: meta?.title || m.type,
          width: Number(m.width) || null,
          height: Number(m.height) || null,
          deltaPct,
          unit: unitInstance,
        });

        const key = m.type;
        const g = groups.get(key) || {
          type: m.type,
          title: meta?.title || m.type,
          count: 0,
          subtotal: 0,
          units: new Set(),
        };
        g.count += 1;
        g.subtotal = Math.round((g.subtotal + unitInstance) * 100) / 100;
        g.units.add(unitInstance.toFixed(2));
        groups.set(key, g);
      }

      const items = Array.from(groups.values()).map((g) => ({
        type: g.type,
        title: g.title,
        count: g.count,
        unit: g.units.size === 1 ? Number([...g.units][0]) : null,
        subtotal: g.subtotal,
      }));

      const total = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);

      setBreakdowns((prev) => ({
        ...prev,
        [wallId]: { items, total, instances },
      }));
    },
    [catalog, priceKey]
  );

  const activeSummary   = summaries[activeWallId]   || {};
  const activeBreakdown = breakdowns[activeWallId] || { items: [], total: 0, instances: [] };

  /* -------------------- Admin / Login -------------------- */
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);

  const openAdmin = () => {
    if (!authReady) return;
    if (!isAdmin) {
      setAdminLoginOpen(true);
      return;
    }
    setAdminOpen(true);
  };
  const closeAdmin = () => setAdminOpen(false);

  /* -------------------- Export PDF: refs + branding -------------------- */
  const canvasWrapRef = useRef(null);

  const brandName = 'Easy Kitchen Design';
  const logoUrl = '/logo512.png';
  const businessPhone = '3413289463';
  const businessAddress = '';

  const customerName  = user?.displayName || '';
  const customerEmail = user?.email || '';

  const showQualityPicker = !quality;

  return (
    <div className="app">
      <TopBar
        qualityName={qualityName}
        onChangeQuality={() => setQuality(null)}
        onAdmin={openAdmin}
        onOpenAdminLogin={() => setAdminLoginOpen(true)}
      />

      <div className="app__main">
        <div className="app__left"><Sidebar /></div>

        <main className="app__center">
          <div className="workspace">
            <div className="workspace__toolbar" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div className="field">
                <label>Tipo de cocina</label>
                <select value={kitchenType} onChange={(e) => onChangeKitchenType(e.target.value)}>
                  <option value="Recta">Recta</option>
                  <option value="L">En L</option>
                  <option value="C">En C</option>
                </select>
              </div>

              <PdfExportButton
                canvasRef={canvasWrapRef}
                title="Diseño de cocina"
                qualityName={qualityName}
                breakdown={activeBreakdown}
                summary={activeSummary}
                brandName={brandName}
                logoUrl={logoUrl}
                customerName={customerName}
                customerEmail={customerEmail}
                businessPhone={businessPhone}
                businessAddress={businessAddress}
              />
            </div>

            <div className="walltabs">
              {walls.map((w) => (
                <button
                  key={w.id}
                  className={`walltabs__tab ${w.id === activeWallId ? 'is-active' : ''}`}
                  onClick={() => setActiveWallId(w.id)}
                >
                  {w.name}
                </button>
              ))}
            </div>

            <div className="workspace__canvas" ref={canvasWrapRef}>
              {walls.map((w) => (
                <div key={w.id} style={{ display: w.id === activeWallId ? 'block' : 'none' }}>
                  <Canvas
                    wallId={w.id}
                    label={w.name}
                    initialWidth={w.width}
                    initialHeight={w.height}
                    onModulesChange={handleModulesChange}
                  />
                </div>
              ))}
            </div>

            <div className="wall-dimensions">
              <div className="field">
                <label>Ancho de la pared (m)</label>
                <input
                  type="number" min="1" step="0.1"
                  value={activeWall?.width ?? 4}
                  onChange={(e) => updateActiveWall({ width: Math.max(1, parseFloat(e.target.value) || 1) })}
                />
              </div>
              <div className="field">
                <label>Alto de la pared (m)</label>
                <input
                  type="number" min="2" step="0.1"
                  value={activeWall?.height ?? 3}
                  onChange={(e) => updateActiveWall({ height: Math.max(2, parseFloat(e.target.value) || 2) })}
                />
              </div>
            </div>
          </div>
        </main>

        <div className="app__right">
          <RightPanel summary={activeSummary} breakdown={activeBreakdown} />
        </div>
      </div>

      {showQualityPicker && (
        <QualityPicker defaultValue={quality || 'premium'} onSelect={(q) => setQuality(q)} />
      )}

      {adminLoginOpen && <AdminEmailLoginModal onClose={() => setAdminLoginOpen(false)} />}

      {adminOpen && isAdmin && <AdminPanel onClose={closeAdmin} />}
    </div>
  );
}
