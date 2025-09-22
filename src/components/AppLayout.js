// src/components/AppLayout.js
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { buildRenderPayload } from '../utils/renderPayload';
import { API_BASE_URL } from '../api/http';
import * as htmlToImage from 'html-to-image';

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
import Footer from './Footer';
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

  const { modules: catalogModules } = useModules();

  const handleModulesChange = useCallback(
    (wallId, mods) => {
      setModulesByWall((prev) => ({ ...prev, [wallId]: mods }));

      const byTitle = mods.reduce((acc, m) => {
        const t = (m.title && String(m.title).trim()) || 'Módulo';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      setSummaries((prev) => ({ ...prev, [wallId]: byTitle }));

      const byTypeMeta = new Map(catalogModules.map((c) => [c.type, c]));
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
        unit: g.unit || (g.units.size === 1 ? Number([...g.units][0]) : null),
        subtotal: g.subtotal,
      }));

      const total = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);

      setBreakdowns((prev) => ({
        ...prev,
        [wallId]: { items, total, instances },
      }));
    },
    [catalogModules, priceKey]
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

  /* ------------ Captura robusta del Canvas (SIN textos) ------------ */
  const canvasWrapRef = useRef(null);

  const captureNodeAsPng = useCallback(
    async (node, { includeGrid = true, includeTags = false, scale = 2 } = {}) => {
      if (!node) throw new Error('captureNodeAsPng: missing node');

      // “Des-ocultar” ancestros (y el propio nodo) si están ocultos
      const patched = [];
      let cur = node;
      while (cur && cur !== document.body) {
        const cs = getComputedStyle(cur);
        const invisible =
          cs.display === 'none' || cs.visibility === 'hidden' || cur.offsetWidth === 0 || cur.offsetHeight === 0;

        if (invisible) {
          patched.push({
            el: cur,
            prev: {
              position: cur.style.position,
              left: cur.style.left,
              top: cur.style.top,
              display: cur.style.display,
              opacity: cur.style.opacity,
              pointerEvents: cur.style.pointerEvents,
              zIndex: cur.style.zIndex,
            },
          });
          Object.assign(cur.style, {
            position: 'absolute',
            left: '-10000px',
            top: '0',
            display: 'block',
            opacity: '1',
            pointerEvents: 'none',
            zIndex: '-1',
          });
        }
        cur = cur.parentElement;
      }

      const restore = () => patched.forEach(({ el, prev }) => Object.assign(el.style, prev));

      try {
        const dataUrl = await htmlToImage.toPng(node, {
          pixelRatio: Math.max(1, Number(scale) || 1),
          backgroundColor: '#ffffff',
          cacheBust: true,
          skipFonts: true,
          style: { animation: 'none', transition: 'none' },
          filter: (el) => {
            const cls = el?.classList;
            const name = (el?.nodeName || '').toLowerCase();
            if (!includeGrid && cls?.contains?.('grid-mesh')) return false;
            if (!includeTags) {
              if (cls?.contains?.('ai-tag') || cls?.contains?.('aitag-label') || cls?.contains?.('aitag-marker'))
                return false;
              if (name === 'text') return false; // oculta rótulos SVG
            }
            return true;
          },
        });
        return dataUrl;
      } catch (e) {
        console.warn('[capture] html-to-image falló, usando html2canvas', e);
        const html2canvas = (await import('html2canvas')).default;

        const tempHides = [];
        if (!includeGrid) {
          node.querySelectorAll('.grid-mesh').forEach((el) => {
            const prev = el.style.display; el.style.display = 'none';
            tempHides.push(() => (el.style.display = prev));
          });
        }
        if (!includeTags) {
          node.querySelectorAll('.ai-tag, .aitag-label, .aitag-marker, svg text').forEach((el) => {
            const prev = el.style.display; el.style.display = 'none';
            tempHides.push(() => (el.style.display = prev));
          });
        }

        try {
          const canvas = await html2canvas(node, {
            backgroundColor: '#ffffff',
            scale: Math.max(1, Number(scale) || 1),
            useCORS: true,
            logging: false,
          });
          return canvas.toDataURL('image/png');
        } finally {
          tempHides.forEach((fn) => fn());
        }
      } finally {
        restore();
      }
    },
    []
  );

  /* ------------ Render (OpenAI single) ------------ */
  const [isRendering, setIsRendering] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);

  const closeResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultOpen(false);
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `render-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleRenderOpenAI = useCallback(async () => {
    try {
      setIsRendering(true);

      const payload = buildRenderPayload({
        activeWall,
        modulesByWall,
        quality,
        kitchenType,
        catalog,
      });

      const resp = await fetch(`${API_BASE_URL}/render/photo.raw?size=1024x1024`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        alert('Error al renderizar: ' + txt);
        return;
      }
      const png = await resp.blob();
      const url = URL.createObjectURL(png);
      setResultUrl(url);
      setResultOpen(true);
    } catch (err) {
      console.error('render error', err);
      alert('No se pudo generar el render.');
    } finally {
      setIsRendering(false);
    }
  }, [activeWall, modulesByWall, quality, kitchenType, catalog]);

  /* ------------ Refs de los canvas visibles ------------ */
  const canvasContainerRefs = useRef({});
  const getCanvasContainerRef = useCallback((id) => {
    if (!canvasContainerRefs.current[id]) canvasContainerRefs.current[id] = React.createRef();
    return canvasContainerRefs.current[id];
  }, []);

  /* ------------ Render (Gemini single) ------------ */
  const handleRenderGemini = useCallback(async () => {
    try {
      setIsRendering(true);

      const payload = buildRenderPayload({
        activeWall,
        modulesByWall,
        quality,
        kitchenType,
        catalog,
      });

      const containerEl = canvasContainerRefs.current[activeWallId]?.current;
      if (!containerEl) {
        alert('No se encontró el canvas activo para capturar.');
        return;
      }

      const node = containerEl.querySelector('.canvas-surface') || containerEl;
      const dataUrl = await captureNodeAsPng(node, { includeGrid: false, includeTags: false, scale: 3 });

      const resp = await fetch(`${API_BASE_URL}/render/photo.gemini.raw?size=1024x1024`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, imageDataUrl: dataUrl }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        alert('Error al renderizar (Gemini): ' + txt);
        return;
      }

      const png = await resp.blob();
      const url = URL.createObjectURL(png);
      setResultUrl(url);
      setResultOpen(true);
    } catch (err) {
      console.error('Gemini render error', err);
      alert('No se pudo generar el render con Gemini.');
    } finally {
      setIsRendering(false);
    }
  }, [activeWall, activeWallId, modulesByWall, quality, kitchenType, catalog, captureNodeAsPng]);

  /* ------------ Render (Gemini multi-pared) ------------ */
  const handleRenderGeminiMulti = useCallback(async () => {
    try {
      setIsRendering(true);

      const payload = {
        kitchenType,
        walls: wallsState,
        modulesByWall,
        quality,
      };

      const order = kitchenType === 'L'
        ? ['left','right']
        : kitchenType === 'C'
        ? ['left','front','right']
        : [activeWallId];

      const dataUrls = [];
      for (const wallId of order) {
        const containerEl = canvasContainerRefs.current[wallId]?.current;
        if (!containerEl) continue;
        const node = containerEl.querySelector('.canvas-surface') || containerEl;
        const dataUrl = await captureNodeAsPng(node, { includeGrid: false, includeTags: false, scale: 3 });
        dataUrls.push(dataUrl);
      }
      if (!dataUrls.length) {
        alert('No se encontraron paredes para capturar.');
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/render/photo.gemini.multi.raw?size=1024x1024`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, imageDataUrls: dataUrls }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        alert('Error al renderizar (Gemini multi-pared): ' + txt);
        return;
      }

      const png = await resp.blob();
      const url = URL.createObjectURL(png);
      setResultUrl(url);
      setResultOpen(true);
    } catch (err) {
      console.error('Gemini multi render error', err);
      alert('No se pudo generar el render L/C.');
    } finally {
      setIsRendering(false);
    }
  }, [kitchenType, wallsState, modulesByWall, quality, activeWallId, captureNodeAsPng]);

  /* ------------ BEST-OF-3 (Gemini) ------------ */
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const closeGallery = () => {
    galleryUrls.forEach((u) => URL.revokeObjectURL(u));
    setGalleryUrls([]);
    setSelectedIdx(0);
    setGalleryOpen(false);
  };

  const downloadSelectedFromGallery = () => {
    const url = galleryUrls[selectedIdx];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `render-${Date.now()}-bestof3.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleRenderGeminiBestOf3 = useCallback(async () => {
    try {
      setIsRendering(true);

      const payload = buildRenderPayload({
        activeWall,
        modulesByWall,
        quality,
        kitchenType,
        catalog,
      });

      const containerEl = canvasContainerRefs.current[activeWallId]?.current;
      if (!containerEl) {
        alert('No se encontró el canvas activo para capturar.');
        return;
      }
      const node = containerEl.querySelector('.canvas-surface') || containerEl;
      const dataUrl = await captureNodeAsPng(node, { includeGrid: false, includeTags: false, scale: 3 });

      const makeReq = async () => {
        const r = await fetch(`${API_BASE_URL}/render/photo.gemini.raw?size=1024x1024`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload, imageDataUrl: dataUrl }),
        });
        if (!r.ok) throw new Error(await r.text().catch(() => 'Bad response'));
        return r.blob();
      };

      const results = await Promise.allSettled([makeReq(), makeReq(), makeReq()]);
      const blobs = results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter(Boolean);
      if (!blobs.length) {
        alert('No se pudieron generar renders.');
        return;
      }
      const urls = blobs.map((b) => URL.createObjectURL(b));
      setGalleryUrls(urls);
      setSelectedIdx(0);
      setGalleryOpen(true);
    } catch (err) {
      console.error('Gemini best-of-3 error', err);
      alert('No se pudo generar el best-of-3.');
    } finally {
      setIsRendering(false);
    }
  }, [activeWall, activeWallId, modulesByWall, quality, kitchenType, catalog, captureNodeAsPng]);

  /* ------------ CLICK-TO-PLACE ------------ */
  const canvasRefs = useRef({});
  const getCanvasRef = useCallback((id) => {
    if (!canvasRefs.current[id]) canvasRefs.current[id] = React.createRef();
    return canvasRefs.current[id];
  }, []);
  const handleSidebarModuleClick = useCallback((meta) => {
    const ref = canvasRefs.current[activeWallId];
    ref?.current?.placeModuleFromSidebar?.(meta);
  }, [activeWallId]);

  /* ------------ PREVISUALIZAR (L) ------------ */
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewOpen(false);
  };
  const downloadPreview = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `preview-L-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const loadImg = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const nextRAF = () => new Promise((r) => requestAnimationFrame(() => r()));

  const handlePreviewL = useCallback(async () => {
    try {
      const leftWrap  = canvasContainerRefs.current['left']?.current;
      const rightWrap = canvasContainerRefs.current['right']?.current;

      if (!leftWrap || !rightWrap) {
        alert('Necesitás tener las paredes Izquierda y Derecha en el proyecto (tipo L).');
        return;
      }

      // Forzar las DOS paredes a estar visibles (fuera de pantalla) para que tengan medidas > 0
      const wrappers = [leftWrap, rightWrap];
      const restores = wrappers.map((el) => {
        const prev = {
          display: el.style.display,
          position: el.style.position,
          left: el.style.left,
          top: el.style.top,
          opacity: el.style.opacity,
          pointerEvents: el.style.pointerEvents,
          zIndex: el.style.zIndex,
        };
        Object.assign(el.style, {
          display: 'block',
          position: 'absolute',
          left: '-10000px',
          top: '0',
          opacity: '1',
          pointerEvents: 'none',
          zIndex: '-1',
        });
        return () => Object.assign(el.style, prev);
      });

      // Esperar un frame para que el layout se calcule
      await nextRAF();

      const leftSurface  = leftWrap.querySelector('.canvas-surface')  || leftWrap;
      const rightSurface = rightWrap.querySelector('.canvas-surface') || rightWrap;

      const [leftUrl, rightUrl] = await Promise.all([
        captureNodeAsPng(leftSurface,  { includeGrid: true, includeTags: false, scale: 2 }),
        captureNodeAsPng(rightSurface, { includeGrid: true, includeTags: false, scale: 2 }),
      ]);

      // Restaurar estilos inmediatamente
      restores.forEach((fn) => fn());

      const [imgL, imgR] = await Promise.all([loadImg(leftUrl), loadImg(rightUrl)]);

      const dividerW = 10;
      const outW = imgL.width + dividerW + imgR.width;
      const outH = Math.max(imgL.height, imgR.height);

      const canvas = document.createElement('canvas');
      canvas.width  = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);

      ctx.drawImage(imgL, 0, 0);
      ctx.drawImage(imgR, imgL.width + dividerW, 0);

      ctx.fillStyle = '#39ff14'; // verde flúor
      ctx.fillRect(imgL.width, 0, dividerW, outH);

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (e) {
      console.error('Preview L error', e);
      alert('No se pudo generar la previsualización L.');
    }
  }, [captureNodeAsPng]);

  /* ------------ Modal JSON (debug) ------------ */
  const [renderOpen, setRenderOpen] = useState(false);
  const [renderJSON, setRenderJSON] = useState('');
  const handlePrepareRender = () => {
    const payload = buildRenderPayload({
      activeWall,
      modulesByWall,
      quality,
      kitchenType,
      catalog,
    });
    setRenderJSON(JSON.stringify(payload, null, 2));
    setRenderOpen(true);
  };

  return (
    <div className="app">
      {/* Overlay de carga */}
      {isRendering && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, backdropFilter: 'blur(2px)'
          }}
        >
          <div style={{
            background: '#111', color: '#fff', padding: '16px 20px',
            borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.5)',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div className="spinner" style={{
              width: 22, height: 22, borderRadius: '50%',
              border: '3px solid #444', borderTopColor: '#09f',
              animation: 'spin 0.9s linear infinite'
            }} />
            <div>Generando render…</div>
          </div>
        </div>
      )}

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
                <button className="btn primary" onClick={handleRenderOpenAI} disabled={isRendering}>
                  {isRendering ? 'Renderizando…' : 'Render (OpenAI 1024)'}
                </button>

                {kitchenType !== 'Recta' && (
                  <button className="btn outline" onClick={handleRenderGeminiMulti} disabled={isRendering}>
                    {isRendering ? 'Renderizando…' : 'Render (Gemini L/C)'}
                  </button>
                )}

                {kitchenType === 'Recta' && (
                  <>
                    <button className="btn outline" onClick={handleRenderGemini} disabled={isRendering}>
                      {isRendering ? 'Renderizando…' : 'Render (Gemini 1024)'}
                    </button>
                    <button className="btn outline" onClick={handleRenderGeminiBestOf3} disabled={isRendering}>
                      {isRendering ? 'Renderizando…' : 'Render (Gemini ×3)'}
                    </button>
                  </>
                )}

                {kitchenType === 'L' && (
                  <button className="btn outline" onClick={handlePreviewL} disabled={isRendering}>
                    Previsualizar (L)
                  </button>
                )}

                <button className="btn outline" onClick={handlePrepareRender}>
                  Ver payload
                </button>

                {user && (
                  <button className="btn outline" onClick={() => setProjectsOpen(true)}>
                    Mis proyectos
                  </button>
                )}

                {user ? (
                  <PdfExportButton
                    canvasRef={canvasWrapRef}
                    title="Diseño de cocina"
                    qualityName={qualityName}
                    breakdown={activeBreakdown}
                    summary={activeSummary}
                    brandName="Easy Kitchen Design"
                    logoUrl="/logo512.png"
                    customerName={user?.displayName || ''}
                    customerEmail={user?.email || ''}
                    businessPhone="3413289463"
                    businessAddress=""
                  />
                ) : (
                  <div style={{ color: '#666', fontSize: 14 }}>Iniciá sesión para guardar y exportar a PDF</div>
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
                <div
                  key={`${w.id}:${canvasVersion}`}
                  ref={getCanvasContainerRef(w.id)}
                  style={{ display: w.id === activeWallId ? 'block' : 'none' }}
                >
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

            <hr />
            <span className="app__center">Consejito: Usá un lienzo amplio y ajustá las paredes al final</span>
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

      {!quality && (
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

      <Footer />

      {/* -------- Modal de previsualización del JSON de render -------- */}
      {renderOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}
          onClick={() => setRenderOpen(false)}
        >
          <div
            style={{
              width: 'min(900px, 92vw)', maxHeight: '80vh', background: '#111',
              borderRadius: 10, padding: 14, boxShadow: '0 12px 40px rgba(0,0,0,.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <strong style={{ color:'#fff' }}>Payload para IA</strong>
              <div style={{ flex:1 }} />
              <button
                className="btn ghost"
                onClick={() => navigator.clipboard?.writeText(renderJSON).catch(() => {})}
              >
                Copiar JSON
              </button>
              <button className="btn" onClick={() => setRenderOpen(false)}>Cerrar</button>
            </div>
            <pre
              style={{
                margin:0, padding:12, background:'#0b0b0b', color:'#0f0',
                borderRadius:8, maxHeight:'64vh', overflow:'auto', fontSize:12, lineHeight:1.35
              }}
            >
              {renderJSON}
            </pre>
          </div>
        </div>
      )}

      {/* -------- Modal del resultado (PNG individual) -------- */}
      {resultOpen && (
        <div
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1600
          }}
          onClick={closeResult}
        >
          <div
            style={{
              width:'min(1100px, 94vw)', maxHeight:'90vh', background:'#111',
              borderRadius:12, padding:14, boxShadow:'0 12px 40px rgba(0,0,0,.45)',
              display:'flex', flexDirection:'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <strong style={{ color:'#fff' }}>Render generado</strong>
              <div style={{ flex:1 }} />
              <button className="btn ghost" onClick={downloadResult}>Descargar PNG</button>
              <button className="btn" onClick={closeResult}>Cerrar</button>
            </div>
            <div style={{ overflow:'auto', borderRadius:8, background:'#000', padding:8 }}>
              {resultUrl && (
                <img
                  src={resultUrl}
                  alt="render"
                  style={{ maxWidth:'100%', height:'auto', display:'block', margin:'0 auto' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------- Modal Best-of-3 -------- */}
      {galleryOpen && (
        <div
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.55)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1700
          }}
          onClick={closeGallery}
        >
          <div
            style={{
              width:'min(1200px,95vw)', maxHeight:'92vh', background:'#111',
              borderRadius:12, padding:14, boxShadow:'0 12px 40px rgba(0,0,0,.5)',
              display:'flex', flexDirection:'column', gap:10
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <strong style={{ color:'#fff' }}>Renders generados (elegí el más fiel)</strong>
              <div style={{ flex:1 }} />
              <button className="btn ghost" onClick={downloadSelectedFromGallery}>Descargar seleccionado</button>
              <button className="btn" onClick={closeGallery}>Cerrar</button>
            </div>

            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(3, 1fr)',
              gap:14,
              overflow:'auto',
              paddingBottom:6
            }}>
              {galleryUrls.map((u, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    borderRadius:10,
                    border: idx === selectedIdx ? '3px solid #09f' : '2px solid #333',
                    background:'#000',
                    cursor:'pointer',
                    display:'flex',
                    flexDirection:'column',
                    overflow:'hidden'
                  }}
                >
                  <div style={{ padding:8, background:'#000' }}>
                    <img src={u} alt={`opción-${idx+1}`} style={{ width:'100%', height:'auto', display:'block' }} />
                  </div>
                  <div style={{
                    textAlign:'center',
                    color:'#ddd',
                    fontSize:14,
                    padding:'6px 8px',
                    background: idx === selectedIdx ? '#0b2742' : '#181818'
                  }}>
                    {idx === selectedIdx ? 'Seleccionado' : 'Elegir'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------- Modal PREVISUALIZACIÓN L -------- */}
      {previewOpen && (
        <div
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.55)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1750
          }}
          onClick={closePreview}
        >
          <div
            style={{
              width:'min(1200px,95vw)', maxHeight:'92vh', background:'#111',
              borderRadius:12, padding:14, boxShadow:'0 12px 40px rgba(0,0,0,.5)',
              display:'flex', flexDirection:'column', gap:10
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <strong style={{ color:'#fff' }}>Previsualización (L) — vértice en verde</strong>
              <div style={{ flex:1 }} />
              <button className="btn ghost" onClick={downloadPreview}>Descargar</button>
              <button className="btn" onClick={closePreview}>Cerrar</button>
            </div>
            <div style={{ overflow:'auto', borderRadius:8, background:'#000', padding:8 }}>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="preview-L"
                  style={{ maxWidth:'100%', height:'auto', display:'block', margin:'0 auto' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
