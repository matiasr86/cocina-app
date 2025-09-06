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
import ProjectsModal from './ProjectsModal';
import { ToastProvider } from './ToastProvider';
import './AppLayout.css';

const LS_KEY_LAYOUT  = 'kitchen.layout.v1';
const LS_KEY_QUALITY = 'kitchen.quality.v1';
const modulesKey = (wallId) => `kitchen.modules.${wallId || 'default'}`;

const makeWallsByType = (type) => {
  if (type === 'L') return [
    { id: 'left',  name: 'Pared Izquierda', width: 4,   height: 3 },
    { id: 'right', name: 'Pared Derecha',   width: 4,   height: 3 },
  ];
  if (type === 'C') return [
    { id: 'left',  name: 'Pared Izquierda', width: 3.5, height: 3 },
    { id: 'front', name: 'Pared Frontal',   width: 4.0, height: 3 },
    { id: 'right', name: 'Pared Derecha',   width: 3.5, height: 3 },
  ];
  return [{ id: 'front', name: 'Pared Frontal', width: 4, height: 3 }];
};

export default function AppLayout() {
  return (
    <AuthProvider>
      <ModulesProvider>
        <ToastProvider>
          <AppLayoutInner />
        </ToastProvider>
      </ModulesProvider>
    </AuthProvider>
  );
}

function AppLayoutInner() {
  const { modules: catalog } = useModules();
  const { user, authReady, isAdmin } = useAuth();

  /* ------------ Calidad ------------ */
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
    quality === 'deluxe'  ? 'deluxe'  :
    quality === 'premium' ? 'premium' :
    'started';

  /* ------------ Layout / paredes ------------ */
  const [kitchenType, setKitchenType]   = useState('Recta');
  const [wallsState, setWallsState]     = useState(() => makeWallsByType('Recta'));
  const [activeWallId, setActiveWallId] = useState(() => makeWallsByType('Recta')[0].id);
  const [canvasVersion, setCanvasVersion] = useState(0);

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

  /* ------------ Módulos por pared ------------ */
  const [modulesByWall, setModulesByWall] = useState({});

  /* ------------ Resumen / Estimación ------------ */
  const [summaries, setSummaries] = useState({});
  const [breakdowns, setBreakdowns] = useState({});

  const handleModulesChange = useCallback(
    (wallId, mods) => {
      setModulesByWall((prev) => ({ ...prev, [wallId]: mods }));

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

  /* ------------ Admin ------------ */
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);

  const openAdmin = () => {
    if (!authReady) return;
    if (!isAdmin) { setAdminLoginOpen(true); return; }
    setAdminOpen(true);
  };
  const closeAdmin = () => setAdminOpen(false);

  /* ------------ Modal de Proyectos ------------ */
  const [projectsOpen, setProjectsOpen] = useState(false);

  const getCurrentDesign = useCallback(() => ({
    kitchenType,
    walls: wallsState,
    modulesByWall,
    quality,
    summary:   summaries,
    breakdown: breakdowns,
    activeWallId,
  }), [kitchenType, wallsState, modulesByWall, quality, summaries, breakdowns, activeWallId]);

  const handleLoadProject = useCallback((project) => {
    try {
      const {
        kitchenType: kt,
        walls:       projectWalls,
        modulesByWall: mbw,
        quality:     q,
        activeWallId: savedActive,
      } = project || {};

      const nextType  = kt || 'Recta';
      const nextWalls = (Array.isArray(projectWalls) && projectWalls.length)
        ? projectWalls
        : makeWallsByType(nextType);

      setKitchenType(nextType);
      setWallsState(nextWalls);
      setActiveWallId(savedActive || nextWalls[0]?.id || 'front');
      if (q) setQuality(q);

      const layoutPayload = {
        kitchenType: nextType,
        walls: nextWalls,
        activeWallId: savedActive || nextWalls[0]?.id || 'front',
      };
      try { localStorage.setItem(LS_KEY_LAYOUT, JSON.stringify(layoutPayload)); } catch {}

      const localMap = {};
      for (const w of nextWalls) {
        let mods = [];
        if (mbw && typeof mbw === 'object' && Array.isArray(mbw[w.id])) {
          mods = mbw[w.id];
        } else if (Array.isArray(w.modules)) {
          mods = w.modules;
        }
        localMap[w.id] = mods;
        try { localStorage.setItem(modulesKey(w.id), JSON.stringify(mods)); } catch {}
      }
      setModulesByWall(localMap);
      setCanvasVersion((v) => v + 1);
    } catch (e) {
      console.error('[load project] error', e);
      alert('No se pudo cargar el proyecto.');
    }
  }, []);

  /* ------------ Export PDF ------------ */
  const canvasWrapRef = useRef(null);
  const brandName = 'Easy Kitchen Design';
  const logoUrl = '/logo512.png';
  const businessPhone = '3413289463';
  const businessAddress = '';
  const customerName  = user?.displayName || '';
  const customerEmail = user?.email || '';

  const showQualityPicker = !quality;

  /* ------------ CLICK-TO-PLACE: refs a cada Canvas ------------ */
  const canvasRefs = useRef({});
  const getCanvasRef = useCallback((id) => {
    if (!canvasRefs.current[id]) canvasRefs.current[id] = React.createRef();
    return canvasRefs.current[id];
  }, []);
  const handleSidebarModuleClick = useCallback((meta) => {
    const ref = canvasRefs.current[activeWallId];
    ref?.current?.placeModuleFromSidebar?.(meta);
  }, [activeWallId]);

  return (
    <div className="app">
      <TopBar
        qualityName={qualityName}
        onChangeQuality={() => setQuality(null)}
        onAdmin={openAdmin}
        onOpenAdminLogin={() => setAdminLoginOpen(true)}
      />

      <div className="app__main">
        <div className="app__left">
          <Sidebar onModuleClick={handleSidebarModuleClick} />
        </div>

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

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                {/* Solo logueado: Mis proyectos */}
                {user && (
                  <button className="btn outline" onClick={() => setProjectsOpen(true)}>
                    Mis proyectos
                  </button>
                )}

                {/* Exportar PDF: sólo logueado */}
                {user ? (
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
                ) : (
                  <div style={{ color: '#666', fontSize: 14 }}>Iniciá sesión guardar y exportar a PDF</div>
                )}
              </div>
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
                <div key={`${w.id}:${canvasVersion}`} style={{ display: w.id === activeWallId ? 'block' : 'none' }}>
                  <Canvas
                    ref={getCanvasRef(w.id)}
                    wallId={w.id}
                    label={w.name}
                    initialWidth={w.width}
                    initialHeight={w.height}
                    onModulesChange={handleModulesChange}
                  />
                </div>
              ))}
            </div>
            <hr></hr>
            <spam className="app__center">Consejito: Utiliza un lienzo amplio y ajusta las paredes al final</spam>
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

      {projectsOpen && (
        <ProjectsModal
          open={projectsOpen}
          onClose={() => setProjectsOpen(false)}
          getCurrentDesign={getCurrentDesign}
          onLoadProject={handleLoadProject}
        />
      )}
    </div>
  );
}
