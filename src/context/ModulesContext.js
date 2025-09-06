// src/context/ModulesContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import baseModules from '../data/modules';
import { ModulesApi } from '../api/ModulesApi';
import { auth } from '../firebaseClient';
import { getIdToken } from 'firebase/auth';

const LS_OVERRIDES = 'admin.modules.overrides.v1';
const ModulesContext = createContext(null);

/* ------------------------ Fallback local ------------------------ */
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

/* ------------------------ Helpers merge ------------------------ */
function mergeModules(base, byType) {
  const map = new Map(base.map((m) => [m.type, { ...m }]));
  for (const type of Object.keys(byType || {})) {
    const ov = byType[type] || {};
    const cur = map.get(type) || { type, title: type };
    map.set(type, {
      ...cur,
      name: ov.name ?? cur.name ?? cur.title ?? type,
      subtitle: ov.subtitle ?? cur.subtitle ?? null,
      visible: ov.visible ?? cur.visible ?? true,
      sizes: Array.isArray(ov.sizes)
        ? ov.sizes
        : Array.isArray(cur.sizes)
        ? cur.sizes
        : [],
      prices: ov.prices ?? cur.prices ?? {},
    });
  }
  return Array.from(map.values()).filter((m) => m.visible !== false);
}

export function ModulesProvider({ children }) {
  const [overrides, setOverrides] = useState({ byType: {} });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [ready, setReady] = useState(false);

  // Refs para evitar re-renders y controlar TTL/de-dup
  const overridesRef = useRef(overrides);
  const lastLoadRef = useRef(0);
  const inflightRef = useRef(null);
  const didInitRef = useRef(false);

  useEffect(() => {
    overridesRef.current = overrides;
    try {
      localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrides));
    } catch {}
  }, [overrides]);

  // Token fresco solo cuando hace falta (no se guarda en state)
  const getFreshIdToken = useCallback(async () => {
    try {
      const u = auth.currentUser;
      if (!u) return '';
      // true => fuerza refresh si está por expirar
      const t = await getIdToken(u, true);
      return t || '';
    } catch {
      return '';
    }
  }, []);

  /* ------------------------ Carga (con TTL + de-dup) ------------------------ */
  const TTL_MS = 2 * 60 * 1000; // 2 minutos

  const reloadCatalog = useCallback(
    async ({ force = false, noFallback = false } = {}) => {
      const now = Date.now();
      if (!force && now - lastLoadRef.current < TTL_MS) {
        // Dentro del TTL: devolver lo que ya hay y no golpear la API
        return overridesRef.current;
      }
      if (inflightRef.current) {
        // De-dup: hay una carga en curso, reusar esa promesa
        return inflightRef.current;
      }

      const p = (async () => {
        try {
          setLoading(true);
          const token = await getFreshIdToken(); // vacío si no hay admin
          const data = await ModulesApi.getOverrides(token);
          setOverrides(data || { byType: {} });
          setApiError('');
          setReady(true);
          lastLoadRef.current = Date.now();
          return data;
        } catch (e) {
          console.error('[Modules] getOverrides error:', e);
          setApiError(String(e?.message || e));
          if (!noFallback) {
            setOverrides(loadOverridesLocal());
            setReady(true);
          }
          throw e;
        } finally {
          setLoading(false);
          inflightRef.current = null;
        }
      })();

      inflightRef.current = p;
      return p;
    },
    [getFreshIdToken]
  );

  // Carga inicial (una sola vez, a prueba de StrictMode)
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    reloadCatalog({ force: true, noFallback: false }).catch(() => {
      // si falla y noFallback=false, ya hicimos fallback local arriba
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------ Mutadores admin ------------------------ */
  const updateOverride = useCallback(
    async (type, patch) => {
      try {
        const token = await getFreshIdToken();
        const data = await ModulesApi.setOverride(type, patch, token);
        if (data?.byType) {
          setOverrides({ byType: data.byType });
        } else {
          // Fallback: volver a pedir overrides (respetará de-dup/TTL si aplica)
          await reloadCatalog({ force: true, noFallback: true });
        }
      } catch (e) {
        console.error('[Modules] setOverride error (aplico en memoria):', e);
        // Optimista en memoria para no perder cambios si la API falló
        setOverrides((prev) => ({
          byType: {
            ...(prev.byType || {}),
            [type]: { ...(prev.byType?.[type] || {}), ...patch },
          },
        }));
      }
    },
    [getFreshIdToken, reloadCatalog]
  );

  const resetOverrides = useCallback(
    async () => {
      try {
        const token = await getFreshIdToken();
        const data = await ModulesApi.resetOverrides(token);
        if (data?.byType) setOverrides({ byType: data.byType });
        else setOverrides({ byType: {} });
      } catch (e) {
        console.error('[Modules] resetOverrides error:', e);
        setOverrides({ byType: {} });
      }
    },
    [getFreshIdToken]
  );

  /* ------------------------ Derivados ------------------------ */
  const modules = useMemo(() => {
    const byType = overrides.byType || {};
    return mergeModules(baseModules, byType);
  }, [overrides]);

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
        sizes: Array.isArray(ov.sizes)
          ? ov.sizes
          : Array.isArray(base.sizes)
          ? base.sizes
          : [],
        prices: ov.prices ?? base.prices ?? {},
      };
    });
  }, [overrides]);

  /* ------------------------ Context value ------------------------ */
  const value = useMemo(
    () => ({
      ready,
      apiError,
      loading,
      modules,
      catalogAdmin,
      overrides,
      // compat: exponemos estas funciones con la misma firma que usa tu app
      reloadCatalog,     // ({ force?, noFallback? })
      updateOverride,    // (type, patch)
      resetOverrides,    // ()
      // compat (no-ops): ya no manejamos token en state
      adminToken: '',
      setAdminToken: () => {},
    }),
    [
      ready,
      apiError,
      loading,
      modules,
      catalogAdmin,
      overrides,
      reloadCatalog,
      updateOverride,
      resetOverrides,
    ]
  );

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>;
}

export function useModules() {
  const ctx = useContext(ModulesContext);
  if (!ctx) throw new Error('useModules must be used within ModulesProvider');
  return ctx;
}
