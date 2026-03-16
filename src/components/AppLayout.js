// src/components/AppLayout.js
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { buildRenderPayload } from '../utils/renderPayload';
import { API_BASE_URL_CREDITS } from '../api/http';

import * as htmlToImage from 'html-to-image';

import TopBar from './TopBar';
import ShowcaseModal from './ShowcaseModal';
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
import { ToastProvider, useToast } from './ToastProvider';
import RedeemCodeModal from './RedeemCodeModal';
import Footer from './Footer';
import RenderPromptModal from './RenderPromptModal';
import ConsentBanner from './ConsentBanner';
import { ConsentProvider, useConsent } from '../consent/ConsentContext';
import CreditsShopModal from "./CreditsShopModal";


import './AppLayout.css';

const LS_KEY_LAYOUT  = 'kitchen.layout.v1';
const LS_KEY_QUALITY = 'kitchen.quality.v1';
const LS_KEY_PROMPT  = 'render.userText';
const LS_KEY_BRIDGE  = 'render.bridgeStrict';
const modulesKey = (wallId) => `kitchen.modules.${wallId || 'default'}`;

const makeWallsByType = () => [{ id: 'front', name: 'Pared Frontal', width: 4, height: 3 }];

// Helpers
function fmtCountdown(msLeft) {
  if (msLeft <= 0) return '0:00';
  const s = Math.ceil(msLeft / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function AppLayout() {
  return (
    <ConsentProvider>
      <AuthProvider>
        <ModulesProvider>
          <ToastProvider>
            <AppLayoutInner />
            <ConsentBanner />
          </ToastProvider>
        </ModulesProvider>
      </AuthProvider>
    </ConsentProvider>
  );
}

function AppLayoutInner() {
  const { modules: catalog } = useModules();
  const { user, authReady, isAdmin } = useAuth();
  const toast = useToast();
  const { prefs } = useConsent();
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [welcomeTipOpen, setWelcomeTipOpen] = useState(false);

  const instancia = (process.env.REACT_APP_INSTANCIA || 'base').trim().toLowerCase();
  const isBaseInstance = instancia === 'base';


  /* ------------ Créditos ------------ */
  const [credits, setCredits] = useState({
    total: 0,
    cooldownUntil: null,
    inflight: false,
    hasPurchasedCredits: false,
    welcomeMonthlyQuota: { limit: 100, used: 0, remaining: 100, reached: false },
  });
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [redeemBusy] = useState(false); // solo leemos el flag (sin setter)

  const loadCredits = useCallback(async () => {
    if (!user) return;
    try {
      setCreditsLoading(true);
      const token = await user.getIdToken();
      const r = await fetch(`${API_BASE_URL_CREDITS}/credits/me?ts=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const js = await r.json();

      setCredits(prev => {
        const prevMs = prev?.cooldownUntil ? new Date(prev.cooldownUntil).getTime() : 0;
        const srvMs  = js?.cooldownUntil ? new Date(js.cooldownUntil).getTime() : 0;
        const chosen = (srvMs > prevMs ? js.cooldownUntil : prev.cooldownUntil) || null;

        return {
          total: Number(js?.total ?? prev.total ?? 0),
          cooldownUntil: chosen,
          inflight: typeof js?.inflight === 'boolean' ? js.inflight : !!prev.inflight,

          hasPurchasedCredits: typeof js?.hasPurchasedCredits === 'boolean'
            ? js.hasPurchasedCredits
            : !!prev.hasPurchasedCredits,
          welcomeMonthlyQuota: js?.welcomeMonthlyQuota
            ? js.welcomeMonthlyQuota
            : (prev?.welcomeMonthlyQuota || { limit: 100, used: 0, remaining: 100, reached: false }),
        };
      });
    } catch (e) {
      console.error('[credits] load error:', e);
    } finally {
      setCreditsLoading(false);
    }
  }, [user]);



  useEffect(() => {
    if (authReady && user) loadCredits();
  }, [authReady, user, loadCredits]);

  // ---- Cooldown: combinar el valor del backend con uno local inmediato ----
  const [localCooldownUntil, setLocalCooldownUntil] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now());

  const cooldownMsLeft = useMemo(() => {
    const untilMs = credits?.cooldownUntil
      ? new Date(credits.cooldownUntil).getTime()
      : 0;
    return Math.max(0, untilMs - nowMs);
  }, [credits?.cooldownUntil, nowMs]);



  const isCooldownActive = cooldownMsLeft > 0;

  useEffect(() => {
    if (!isCooldownActive) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isCooldownActive]);


  const welcomeBlocked =
  !credits.hasPurchasedCredits && !!credits?.welcomeMonthlyQuota?.reached;

  /* ------------ Calidad ------------ */
  const [quality, setQuality] = useState(() => (isBaseInstance ? 'premium' : null));
  const [qpOpen, setQpOpen] = useState(false); // abre QualityPicker

  useEffect(() => {
    try {
      // 👇 Instancia base: no usamos selector de calidad
      if (isBaseInstance) {
        setQuality((prev) => prev || 'premium'); // calidad interna fija (ajustable)
        setQpOpen(false);
        return;
      }

      const raw = prefs.get(LS_KEY_QUALITY);
      if (raw) {
        setQuality(raw);
        setQpOpen(false);
      } else {
        setQpOpen(true); // primera vez: mostramos selector
      }
    } catch {}
  }, [prefs, isBaseInstance]);

  useEffect(() => {
    try {
      if (quality) prefs.set(LS_KEY_QUALITY, quality);
    } catch {}
  }, [quality, prefs]);

  const qualityName = useMemo(
    () => QUALITIES.find((q) => q.id === quality)?.name || '',
    [quality]
  );
  const priceKey =
    quality === 'deluxe' ? 'deluxe' :
    quality === 'premium' ? 'premium' :
    'started';

  /* ------------ Tipo de cocina (UI) ------------ */
  const [kitchenType, setKitchenType] = useState('Recta');

  /* ------------ Layout (Recta) ------------ */
  const [wallsState, setWallsState] = useState(() => makeWallsByType());
  const [activeWallId, setActiveWallId] = useState(() => makeWallsByType()[0].id);
  const [canvasVersion, setCanvasVersion] = useState(0);

  // cargar layout
  useEffect(() => {
    try {
      const raw = prefs.get(LS_KEY_LAYOUT);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const nextWalls =
        Array.isArray(parsed?.walls) && parsed.walls.length
          ? parsed.walls.filter((w) => w?.id === 'front' || w?.name)?.slice(0, 1)
          : makeWallsByType();
      setWallsState(nextWalls);
      setActiveWallId(parsed?.activeWallId || nextWalls[0].id);
    } catch {}
  }, [prefs]);

  // guardar layout
  useEffect(() => {
    const payload = { kitchenType: 'Recta', walls: wallsState, activeWallId };
    try {
      prefs.set(LS_KEY_LAYOUT, JSON.stringify(payload));
    } catch {}
  }, [wallsState, activeWallId, prefs]);

  const walls = useMemo(() => wallsState, [wallsState]);
  const activeWall = walls.find((w) => w.id === activeWallId) ?? walls[0];
  const updateActiveWall = (patch) => {
    setWallsState((prev) => prev.map((w) => (w.id === activeWallId ? { ...w, ...patch } : w)));
  };

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

      // costos
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
        const g =
          groups.get(key) || {
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
  const openAdmin  = () => { if (!authReady) return; if (!isAdmin) { setAdminLoginOpen(true); return; } setAdminOpen(true); };
  const closeAdmin = () => setAdminOpen(false);

  /* ------------ Proyectos ------------ */
  const [projectsOpen, setProjectsOpen] = useState(false);
  const getCurrentDesign = useCallback(
    () => ({
      kitchenType: 'Recta',
      walls: wallsState,
      modulesByWall,
      quality,
      summary: summaries,
      breakdown: breakdowns,
      activeWallId,
    }),
    [wallsState, modulesByWall, quality, summaries, breakdowns, activeWallId]
  );

  const handleLoadProject = useCallback(
    (project) => {
      try {
        const { walls: projectWalls, modulesByWall: mbw, quality: q, activeWallId: savedActive } = project || {};
        const nextWalls =
          Array.isArray(projectWalls) && projectWalls.length ? [projectWalls[0]] : makeWallsByType();

        setWallsState(nextWalls);
        setActiveWallId(savedActive || nextWalls[0]?.id || 'front');
        if (q) setQuality(q);

        const layoutPayload = {
          kitchenType: 'Recta',
          walls: nextWalls,
          activeWallId: savedActive || nextWalls[0]?.id || 'front',
        };
        try {
          prefs.set(LS_KEY_LAYOUT, JSON.stringify(layoutPayload));
        } catch {}

        const localMap = {};
        for (const w of nextWalls) {
          let mods = [];
          if (mbw && typeof mbw === 'object' && Array.isArray(mbw[w.id])) mods = mbw[w.id];
          else if (Array.isArray(w.modules)) mods = w.modules;
          localMap[w.id] = mods;
          try {
            prefs.set(modulesKey(w.id), JSON.stringify(mods));
          } catch {}
        }
        setModulesByWall(localMap);
        setCanvasVersion((v) => v + 1);
      } catch (e) {
        console.error('[load project] error', e);
        alert('No se pudo cargar el proyecto.');
      }
    },
    [prefs]
  );

  /* ------------ Captura limpia (sin textos/guías) ------------ */
  const canvasWrapRef = useRef(null);

  const captureNodeAsPng = useCallback(
    async (node, { includeGrid = false, includeTags = false, scale = 3 } = {}) => {
      if (!node) throw new Error('captureNodeAsPng: missing node');

      const target = node;
      const rect = target.getBoundingClientRect();
      const width  = Math.max(target.scrollWidth || 0, target.clientWidth || 0, Math.ceil(rect.width));
      const height = Math.max(target.scrollHeight || 0, target.clientHeight || 0, Math.ceil(rect.height));

      const prev = {
        overflow: target.style.overflow,
        transform: target.style.transform,
        width: target.style.width,
        height: target.style.height,
      };
      target.style.overflow = 'visible';
      target.style.transform = 'none';
      target.style.width = `${width}px`;
      target.style.height = `${height}px`;

      const patched = [];
      let cur = target;
      while (cur && cur !== document.body) {
        const cs = getComputedStyle(cur);
        const invisible =
          cs.display === 'none' ||
          cs.visibility === 'hidden' ||
          cur.offsetWidth === 0 ||
          cur.offsetHeight === 0;
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
      const restoreAncestors = () =>
        patched.forEach(({ el, prev }) => Object.assign(el.style, prev));

      try {
        const dataUrl = await htmlToImage.toPng(target, {
          width,
          height,
          pixelRatio: Math.max(1, Number(scale) || 1),
          backgroundColor: '#ffffff',
          cacheBust: true,
          skipFonts: true,
          style: { animation: 'none', transition: 'none', transform: 'none', overflow: 'visible' },
          filter: (el) => {
            const cls = el?.classList;
            const tag = (el?.nodeName || '').toLowerCase();
            if (!includeGrid && cls?.contains?.('grid-mesh')) return false;
            if (!includeTags) {
              if (cls?.contains?.('ai-tag') || cls?.contains?.('aitag-label') || cls?.contains?.('aitag-marker')) return false;
              if (tag === 'text') return false;
            }
            return true;
          },
        });
        return dataUrl;
      } catch (e) {
        console.warn('[capture] html-to-image falló, usando html2canvas', e);
        const html2canvas = (await import('html2canvas')).default;

        const tempHides = [];
        if (!includeGrid)
          target.querySelectorAll('.grid-mesh').forEach((el) => {
            const prevD = el.style.display;
            el.style.display = 'none';
            tempHides.push(() => (el.style.display = prevD));
          });
        if (!includeTags)
          target
            .querySelectorAll('.ai-tag, .aitag-label, .aitag-marker, svg text')
            .forEach((el) => {
              const prevD = el.style.display;
              el.style.display = 'none';
              tempHides.push(() => (el.style.display = prevD));
            });

        try {
          const canvas = await html2canvas(target, {
            backgroundColor: '#ffffff',
            scale: Math.max(1, Number(scale) || 1),
            useCORS: true,
            logging: false,
            width,
            height,
            windowWidth: width,
            windowHeight: height,
            scrollX: 0,
            scrollY: 0,
          });
          return canvas.toDataURL('image/png');
        } finally {
          tempHides.forEach((fn) => fn());
        }
      } finally {
        target.style.overflow = prev.overflow;
        target.style.transform = prev.transform;
        target.style.width = prev.width;
        target.style.height = prev.height;
        restoreAncestors();
      }
    },
    []
  );

  /* ------------ Estado render / galerías ------------ */
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

  const canvasContainerRefs = useRef({});
  const getCanvasContainerRef = useCallback((id) => {
    if (!canvasContainerRefs.current[id]) canvasContainerRefs.current[id] = React.createRef();
    return canvasContainerRefs.current[id];
  }, []);

  /* ======== Modal de prompt para render ======== */
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptDefaultText, setPromptDefaultText] = useState(() => prefs.get(LS_KEY_PROMPT) || '');
  const [promptDefaultBridge, setPromptDefaultBridge] = useState(() => prefs.get(LS_KEY_BRIDGE) === '1');
  const [pendingMode, setPendingMode] = useState(null); // 'best3'
  const [previewCleanUrl, setPreviewCleanUrl] = useState(null);

  const openPromptFor = useCallback(async () => {
    if (!authReady || !user) {
      toast.info('Iniciá sesión para renderizar.');
      return;
    }
    if (welcomeBlocked) {
      toast.info('Se alcanzó el cupo mensual de renders de bienvenida. Para seguir, comprá créditos o canjeá un código.');
      return;
    }
    if (!credits?.total) {
      toast.info('No tenés créditos. Podés comprarlos o canjear un código.');
      return;
    }
    if (isCooldownActive) {
      toast.info(`El modelo está ocupado. Podrás reintentar en ${fmtCountdown(cooldownMsLeft)}.`);
      return;
    }

    const containerEl = canvasContainerRefs.current[activeWallId]?.current;
    if (!containerEl) {
      toast.error('No se encontró el canvas activo para capturar.');
      return;
    }
    const node = containerEl;
    const cleanDataUrl = await captureNodeAsPng(node, { includeGrid: false, includeTags: false, scale: 3 });

    setPreviewCleanUrl(cleanDataUrl);
    setPendingMode('best3');
    setPromptOpen(true);
  }, [toast, authReady, user, credits?.total, isCooldownActive, cooldownMsLeft, activeWallId, captureNodeAsPng,welcomeBlocked]);

  const handleConfirmPrompt = useCallback(
    async (userText, bridgeStrict) => {
      setPromptOpen(false);
      if (!previewCleanUrl || pendingMode !== 'best3') return;

      try {
        prefs.set(LS_KEY_PROMPT, userText || '');
        prefs.set(LS_KEY_BRIDGE, bridgeStrict ? '1' : '0');
        setPromptDefaultText(userText || '');
        setPromptDefaultBridge(!!bridgeStrict);
      } catch {}

      const base = buildRenderPayload({
        activeWall,
        modulesByWall,
        kitchenType: 'Recta',
        catalog,
        quality: quality || 'premium',
      });

      const enriched = { ...base };
      enriched.quality = quality || base?.style?.quality || 'premium';
      enriched.kitchenType = 'Recta';
      enriched.userText = userText || '';
      enriched.bridgeStrict = !!bridgeStrict;

      const wallWidthM  = base?.wall?.width_m ?? activeWall?.width;
      const wallHeightM = base?.wall?.height_m ?? activeWall?.height;
      enriched.wall = { ...(base.wall || {}), width: wallWidthM, height: wallHeightM };
      enriched.activeWall = { id: activeWall?.id, name: activeWall?.name, width: wallWidthM, height: wallHeightM };
      if (Array.isArray(enriched.modules)) {
        enriched.modules = enriched.modules.map((m) => ({
          ...m,
          x: m.x_cm, y: m.y_cm, width: m.width_cm, height: m.height_cm,
          xCm: m.x_cm, yCm: m.y_cm, widthCm: m.width_cm, heightCm: m.height_cm,
        }));
      }

      const makeReqTriad = async () => {
        const token = await user.getIdToken();
        const r = await fetch(`${API_BASE_URL_CREDITS}/render/triad`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ payload: enriched, imageDataUrl: previewCleanUrl }),
        });
        const js = await r.json().catch(() => null);
        if (!r.ok) {
          const msg = js?.message || js?.error || `HTTP ${r.status}`;
          throw Object.assign(new Error(msg), { status: r.status, code: js?.code, data: js });
        }
        return js; // { ok, images: [...], txId, newTotal }
      };

      try {
        setIsRendering(true);
        const out = await makeReqTriad();

        const urls = (out?.images || [])
          .map((durl) => {
            try {
              const b64 = durl.split(',')[1] || '';
              const blob = b64 ? new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: 'image/png' }) : null;
              return blob ? URL.createObjectURL(blob) : null;
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        if (!urls.length) {
          toast.error('No se pudieron generar los renders.');
        } else {
          setGalleryUrls(urls);
          setSelectedIdx(0);
          setGalleryOpen(true);
        }

        await loadCredits();
      } catch (err) {
        console.log('[render error]', {
          status: err?.status,
          message: err?.message,
          code: err?.code,
          data: err?.data
        });

        // status robusto (sin mezclar ?? y ||)
        const status = (() => {
          if (typeof err?.status === 'number') return err.status;
          const m = String(err?.message ?? '').match(/HTTP\s+(\d{3})/);
          return m ? Number(m[1]) : null;
        })();
        const code = err?.data?.error ?? err?.code ?? null;

        if (code === 'cooldown' || code === 'model_failed' || status === 503) {
          const secs = Number(err?.data?.cooldownSeconds) || 600; // 10 min
          const untilIso = new Date(Date.now() + secs * 1000).toISOString();

          // 1) reflejo inmediato en UI (oculta botón ya)
          setCredits(prev => ({ ...prev, cooldownUntil: untilIso }));
          // empujo el reloj para que el useMemo recalcule ya
          setNowMs(Date.now());

          // 2) sincronizo después, sin pisar lo local si el server aún no guardó
          setTimeout(() => { loadCredits(); }, 400);

          toast.info(`El modelo de IA está ocupado. Podrás reintentar en ${fmtCountdown(secs * 1000)}.`);
        } else if (code === 'welcome_monthly_limit' || status === 429) {
          // ✅ El backend avisó que se agotó el cupo global mensual de bienvenida
          toast.info('Se alcanzó el límite mensual de renders con créditos de bienvenida. Para seguir, comprá créditos o canjeá un código.');

          // ✅ Reflejo inmediato en UI: esto hace que aparezcan Comprar/Canjear
          setCredits(prev => ({
            ...prev,
            welcomeMonthlyQuota: {
              ...(prev.welcomeMonthlyQuota || { limit: 100, used: 100, remaining: 0, reached: true }),
              reached: true,
              remaining: 0,
            },
          }));

          // opcional: abrir automáticamente el modal de compra
          setShopOpen(true);

          // sincronizá con backend (por si querés "used" real)
          setTimeout(() => { loadCredits(); }, 200);

        } else if (code === 'no_credits' || status === 402) {
          toast.error('No tenés créditos disponibles.');
        } else {
          toast.error('No se pudo generar el render. Probá nuevamente en unos minutos.');
        }
      } finally {

        setIsRendering(false);
        setPendingMode(null);
        setPreviewCleanUrl(null);
      }
    },
    [toast, previewCleanUrl, pendingMode, quality, activeWall, modulesByWall, catalog, user, loadCredits, prefs]
  );

  const handleCancelPrompt = () => {
    setPromptOpen(false);
    setPendingMode(null);
    setPreviewCleanUrl(null);
  };

  /* ------------ Best-of-3 (galería) ------------ */
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

  /* ------------ Click-to-place ------------ */
  const canvasRefs = useRef({});
  const getCanvasRef = useCallback((id) => {
    if (!canvasRefs.current[id]) canvasRefs.current[id] = React.createRef();
    return canvasRefs.current[id];
  }, []);
  
  const handleSidebarModuleClick = useCallback(
    (meta) => {
      const ref = canvasRefs.current[activeWallId];
      ref?.current?.placeModuleFromSidebar?.(meta);
    },
    [activeWallId]
  );

  /* ------------ Canjear código (frontend) ------------ */
  const [redeemOpen, setRedeemOpen] = useState(false);
  // Modal "Packs de créditos"
  const [shopOpen, setShopOpen] = useState(false);

  /* ------------ UI ------------ */
  return (
    <div className="app">
      {/* Overlay de carga */}
      {isRendering && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            style={{
              background: '#111',
              color: '#fff',
              padding: '16px 20px',
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0,0,0,.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              className="spinner"
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: '3px solid #444',
                borderTopColor: '#09f',
                animation: 'spin 0.9s linear infinite',
              }}
            />
            <div>Generando render…</div>
          </div>
        </div>
      )}

      <TopBar
        qualityName={qualityName}
        showQualityControls={!isBaseInstance} // 👈 ocultar en base
        onChangeQuality={() => {
          if (!isBaseInstance) setQpOpen(true); // 👈 bloqueo extra
        }}
        onAdmin={openAdmin}
        onOpenAdminLogin={() => setAdminLoginOpen(true)}
        onOpenShowcase={() => setShowcaseOpen(true)}
      />

      <div className="app__main">
        <div className="app__left">
          <Sidebar onModuleClick={handleSidebarModuleClick} />
        </div>

        <main className="app__center">
          <div className="workspace">
            {/* Toolbar */}
            <div
              className="workspace__toolbar"
            >
              {/* IZQUIERDA */}
              <div className="workspace__toolbar-left">
                <div className="workspace__toolbar-actions">
                  {(!authReady || !user) ? (
                    <div style={{ color: '#888', fontSize: 14, fontWeight: 'bold'}}>Iniciá sesión para gestionar tus proyectos, exportar a PDF y renderizar con IA.</div>
                  ) : (
                    <>
                      {welcomeBlocked && (
                        <div
                          className="pill"
                          style={{
                            background: '#2a1800',
                            color: '#f2c16b',
                            padding: '6px 10px',
                            borderRadius: 20,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                          title="Se agotó el cupo mensual de renders con créditos de bienvenida. Para renderizar
                          deberas comprar créditos, encontrá el pack que más se adapte a tus necesidades!."
                        >
                          ⚠️ Cupo de bienvenida agotado
                        </div>
                      )}
                      {(() => {
                        const showPayActions = (credits.total <= 0) || welcomeBlocked;
                        const canRender = (credits.total > 0) && !welcomeBlocked && !isCooldownActive;

                        if (canRender) {
                          return (
                            <button
                              className="btn primary"
                              onClick={openPromptFor}
                              disabled={isRendering}
                              title="Genera 3 variantes con IA a partir de tu diseño. Consume 1 crédito."
                              aria-label="Renderizar con IA (consume 1 crédito)"
                            >
                              {isRendering ? 'Renderizando…' : 'Renderizar con IA ✨'}
                            </button>
                          );
                        }

                        if (showPayActions) {
                          return (
                            <>
                              <button
                                className="btn outline"
                                onClick={() => setShopOpen(true)}
                                title="Ver packs de créditos"
                              >
                                Comprar créditos
                              </button>

                              <button
                                className="btn outline"
                                onClick={() => setRedeemOpen(true)}
                                disabled={redeemBusy}
                              >
                                {redeemBusy ? 'Canjeando…' : 'Canjear código'}
                              </button>
                            </>
                          );
                        }

                        return null;
                      })()}

                      <button className="btn outline" onClick={() => setProjectsOpen(true)}>
                        Mis proyectos 📁
                      </button>

                      <PdfExportButton
                        canvasRef={canvasWrapRef}
                        title="Diseño de cocina"
                        qualityName={qualityName}
                        breakdown={activeBreakdown}
                        summary={activeSummary}
                        brandName="Cocina Play"
                        logoUrl="/logo512.png"
                        customerName={user?.displayName || ''}
                        customerEmail={user?.email || ''}
                        businessPhone=""
                        businessAddress=""
                      />

                      {credits.total > 0 && isCooldownActive && (
                        <div
                          className="pill"
                          title="El Modelo de IA está teniendo problemas para generar los renders en este momento"
                          style={{ background: '#2a1800', color: '#f2c16b', padding: '6px 10px', borderRadius: 20 }}
                        >
                          ⏳ Cooldown {fmtCountdown(cooldownMsLeft)}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Select Tipo de cocina */}
                <div className="field">
                  <label style={{fontWeight: 'bold', color: '#000000ff', fontSize: 14}}>Tipo de cocina</label>
                  <select
                    value={kitchenType}
                    onChange={(e) => setKitchenType(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: 8, background: '#222', color: '#ddd', border: '1px solid #333' }}
                  >
                    <option value="Recta">Cocina Recta</option>
                    <option value="L" disabled>
                      Cocina en L (Próximamente)
                    </option>
                    <option value="C" disabled>
                      Cocina en C (Próximamente)
                    </option>
                  </select>
                </div>
              </div>

              {authReady && user && (
                <div className="workspace__toolbar-right">
                  <div
                    className="pill"
                    title="Renderizar con IA (consume 1 crédito)"
                    style={{
                      background: '#141414',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: 20,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span role="img" aria-label="coin">💰</span>
                    <strong>Créditos:</strong>
                    <span>{creditsLoading ? '…' : credits.total}</span>
                  </div>

                  {/* 👇 Info de bienvenida: solo si NUNCA compró créditos */}
                  {!credits.hasPurchasedCredits && (
                    <div
                      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                      onMouseEnter={() => setWelcomeTipOpen(true)}
                      onMouseLeave={() => setWelcomeTipOpen(false)}
                    >
                      <button
                        type="button"
                        className="btn outline"
                        onClick={() => setWelcomeTipOpen((v) => !v)}
                        title="Info sobre renders de bienvenida"
                        aria-label="Info sobre renders de bienvenida"
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          lineHeight: 1,
                        }}
                      >
                        ⓘ
                      </button>

                      {welcomeTipOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            width: 320,
                            background: '#111',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 10,
                            padding: 10,
                            boxShadow: '0 10px 30px rgba(0,0,0,.35)',
                            zIndex: 3000,
                            fontSize: 13,
                          }}
                          role="tooltip"
                        >
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>Renders de bienvenida</div>
                          <div style={{ opacity: 0.9, lineHeight: 1.35 }}>
                            Hay un cupo <strong>global</strong> de <strong>200</strong> renders por mes para créditos de bienvenida.
                            Si se agota, podrás renderizar solo con créditos comprados.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="workspace__canvas" ref={canvasWrapRef}>
              {walls.map((w) => (
                <div
                  key={`${w.id}:${canvasVersion}`}
                  ref={getCanvasContainerRef(w.id)}
                  style={{
                    display: w.id === activeWallId ? 'block' : 'none',
                    width: '100%',
                    minWidth: 0,
                  }}
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
            <span className="workspace__hint">Consejito: Usá un lienzo amplio y ajustá las paredes al final</span>
            <div className="wall-dimensions">
              <div className="field">
                <label>Ancho de la pared (m)</label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={activeWall?.width ?? 4}
                  onChange={(e) => updateActiveWall({ width: Math.max(1, parseFloat(e.target.value) || 1) })}
                />
              </div>
              <div className="field">
                <label>Alto de la pared (m)</label>
                <input
                  type="number"
                  min="2"
                  step="0.1"
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

      {/* —— QualityPicker controlado —— */}
      {!isBaseInstance && qpOpen && (
        <div className="qp__overlay" onClick={() => setQpOpen(false)}>
          <div className="qp__dialog" onClick={(e) => e.stopPropagation()}>
            <QualityPicker
              defaultValue={quality || 'premium'}
              onSelect={(q) => {
                setQuality(q);
                setQpOpen(false);
              }}
            />
          </div>
        </div>
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

      {/* -------- Modal resultado -------- */}
      {resultOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1600,
          }}
          onClick={closeResult}
        >
          <div
            style={{
              width: 'min(1100px, 94vw)',
              maxHeight: '90vh',
              background: '#111',
              borderRadius: 12,
              padding: 14,
              boxShadow: '0 12px 40px rgba(0,0,0,.45)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <strong style={{ color: '#fff' }}>Render generado</strong>
              <div style={{ flex: 1 }} />
              <button className="btn primary" onClick={downloadResult}>
                Descargar PNG
              </button>
              <button className="btn" onClick={closeResult}>
                Cerrar
              </button>
            </div>
            <div style={{ overflow: 'auto', borderRadius: 8, background: '#000', padding: 8 }}>
              {resultUrl && (
                <img
                  src={resultUrl}
                  alt="render"
                  style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
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
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1700,
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Renders generados"
        >
          <div
            style={{
              width: 'min(1200px,95vw)',
              maxHeight: '92vh',
              background: '#111',
              borderRadius: 12,
              padding: 14,
              boxShadow: '0 6px 18px rgba(0,0,0,.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ color: '#fff' }}>Renders generados (elegí el más fiel)</strong>
              <div style={{ flex: 1 }} />
              <button className="btn primary" onClick={downloadSelectedFromGallery}>
                Descargar seleccionado
              </button>
              <button className="btn" onClick={closeGallery}>
                Cerrar
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 14,
                overflow: 'auto',
                paddingBottom: 6,
              }}
            >
              {galleryUrls.map((u, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    borderRadius: 10,
                    border: idx === selectedIdx ? '3px solid #09f' : '2px solid #333',
                    background: '#000',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: 8, background: '#000' }}>
                    <img src={u} alt={`opción-${idx + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#ddd',
                      fontSize: 14,
                      padding: '6px 8px',
                      background: idx === selectedIdx ? '#0b2742' : '#181818',
                    }}
                  >
                    {idx === selectedIdx ? 'Seleccionado' : 'Elegir'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------- Modal Comprar Creditos -------- */}
      <CreditsShopModal open={shopOpen} onClose={() => setShopOpen(false)} />

      {/* -------- Modal Descripción Breve + checkbox Puente -------- */}
      <RenderPromptModal
        open={promptOpen}
        imageDataUrl={previewCleanUrl}
        maxChars={300}
        defaultText={promptDefaultText}
        defaultBridgeStrict={promptDefaultBridge}
        onCancel={handleCancelPrompt}
        onConfirm={handleConfirmPrompt}
      />

      {/* -------- Modal para canjear los códigos -------- */}
      <RedeemCodeModal
        open={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        apiBase={API_BASE_URL_CREDITS}
        getIdToken={() => user.getIdToken()}
        onRedeemed={async (newTotal, added, program) => {
          const detail = program ? ` (${program})` : '';
          toast.success('¡Código aplicado!', `Sumaste ${added} crédito(s)${detail}.`);
          await loadCredits();
          setRedeemOpen(false);
        }}
      />

      <ShowcaseModal open={showcaseOpen} onClose={() => setShowcaseOpen(false)} />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
