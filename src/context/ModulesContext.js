// src/context/ModulesContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import baseModules from '../data/modules';
import { ModulesApi } from '../api/ModulesApi';

const LS_OVERRIDES = 'admin.modules.overrides.v1';
const ModulesContext = createContext(null);

// Fallback local si la API no responde
function loadOverridesLocal() {
  try {
    const raw = localStorage.getItem(LS_OVERRIDES);
    if (!raw) return { byType: {} };
    const parsed = JSON.parse(raw);
    return parsed?.byType ? parsed : { byType: {} };
  } catch {
    return { byType: {} };
  }
}

export function ModulesProvider({ children }) {
  const [overrides, setOverrides] = useState({ byType: {} });
  const [ready, setReady] = useState(false);
  const [apiError, setApiError] = useState('');
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin.token') || '');

  // Cargar desde API al montar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (process?.env?.REACT_APP_API_BASE_URL) {
          // eslint-disable-next-line no-console
          console.info('[Modules] API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
        }
        const data = await ModulesApi.getOverrides(); // { byType }
        if (!cancelled) {
          setOverrides(data || { byType: {} });
          setReady(true);
        }
      } catch (e) {
        console.error('[Modules] getOverrides error:', e);
        setApiError(String(e?.message || e));
        if (!cancelled) {
          setOverrides(loadOverridesLocal());
          setReady(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Guardar cache local como fallback
  useEffect(() => {
    try { localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrides)); } catch {}
  }, [overrides]);

  // Catálogo para el front (merge base + overrides)
  const modules = useMemo(() => {
    const byType = overrides.byType || {};
    return baseModules
      .map((m) => {
        const ov = byType[m.type] || {};
        return {
          ...m,
          name: ov.name ?? m.name ?? m.title ?? m.type,
          subtitle: ov.subtitle ?? m.subtitle ?? null,   // 👈 subtítulo
          visible: ov.visible ?? m.visible ?? true,
          sizes: Array.isArray(ov.sizes) ? ov.sizes : (Array.isArray(m.sizes) ? m.sizes : null),
          prices: ov.prices ?? m.prices ?? null,
          // metadatos para UI
          title: m.title,
          src: m.src,
          section: m.section,
          sectionLabel: m.sectionLabel,
          type: m.type,
        };
      })
      .filter((m) => m.visible !== false);
  }, [overrides]);

  // Catálogo completo para Admin
  const catalogAdmin = useMemo(() => {
    const byType = overrides.byType || {};
    const types = new Set([...baseModules.map((m) => m.type), ...Object.keys(byType)]);
    return Array.from(types).map((type) => {
      const base = baseModules.find((b) => b.type === type) || { type, title: type };
      const ov = byType[type] || {};
      return {
        ...base,
        name: ov.name ?? base.name ?? base.title ?? type,
        subtitle: ov.subtitle ?? base.subtitle ?? null,
        visible: ov.visible ?? base.visible ?? true,
        sizes: Array.isArray(ov.sizes) ? ov.sizes : (Array.isArray(base.sizes) ? base.sizes : []),
        prices: ov.prices ?? base.prices ?? {},
      };
    });
  }, [overrides]);

  // Token admin (persistente)
  const setAdminTokenValue = useCallback((token) => {
    setAdminToken(token || '');
    if (token) localStorage.setItem('admin.token', token);
    else localStorage.removeItem('admin.token');
  }, []);

  // ---- Mutadores con referencia estable ----
  const updateOverride = useCallback(
    async (type, patch) => {
      try {
        const data = await ModulesApi.setOverride(type, patch, adminToken);
        if (data?.byType) {
          setOverrides({ byType: data.byType });
        } else {
          const ref = await ModulesApi.getOverrides();
          setOverrides(ref || { byType: {} });
        }
      } catch (e) {
        console.error('[Modules] setOverride error (fallback local):', e);
        // Fallback optimista local
        setOverrides((prev) => ({
          byType: {
            ...(prev.byType || {}),
            [type]: { ...(prev.byType?.[type] || {}), ...patch },
          }
        }));
      }
    },
    [adminToken] // 👈 sólo cambia si cambia el token
  );

  const resetOverrides = useCallback(
    async () => {
      try {
        const data = await ModulesApi.resetOverrides(adminToken);
        // Asegurate de que ModulesApi.resetOverrides haga DELETE '/overrides'
        if (data?.byType) setOverrides({ byType: data.byType });
        else setOverrides({ byType: {} });
      } catch (e) {
        console.error('[Modules] resetOverrides error:', e);
        setOverrides({ byType: {} });
      }
    },
    [adminToken] // 👈 sólo cambia si cambia el token
  );

  // Value memoizado con referencias estables
  const value = useMemo(() => ({
    ready,
    apiError,
    modules,
    catalogAdmin,
    overrides,
    adminToken,
    setAdminToken: setAdminTokenValue,
    updateOverride,
    resetOverrides,
  }), [
    ready,
    apiError,
    modules,
    catalogAdmin,
    overrides,
    adminToken,
    setAdminTokenValue,
    updateOverride,
    resetOverrides,
  ]);

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>;
}

export function useModules() {
  const ctx = useContext(ModulesContext);
  if (!ctx) throw new Error('useModules must be used within ModulesProvider');
  return ctx;
}
