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
import { onIdTokenChanged, getIdToken } from 'firebase/auth';
import { auth } from '../firebaseClient';

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
  const [adminToken, setAdminToken] = useState(''); // ID token Firebase
  const [loading, setLoading] = useState(false);

  /* Mantener ID token actualizado:
   * - onIdTokenChanged: se dispara en login/logout y cuando Firebase refresca el token.
   * - refresco extra en foco e intervalos (tokens ~1h): evitamos 401 por expiración.
   */
  useEffect(() => {
    let mounted = true;
    const unsub = onIdTokenChanged(auth, async (user) => {
      try {
        if (!mounted) return;
        if (user) {
          // fuerza refresh la 1ra vez tras cambio de usuario
          const idt = await getIdToken(user, true);
          setAdminToken(idt || '');
        } else {
          setAdminToken('');
        }
      } catch {
        setAdminToken('');
      }
    });

    // refresco al recuperar foco
    const onFocus = async () => {
      try {
        const u = auth.currentUser;
        if (u) {
          const idt = await getIdToken(u, true);
          setAdminToken(idt || '');
        }
      } catch {}
    };
    window.addEventListener('focus', onFocus);

    // refresco periódico (cada 45 minutos)
    const t = setInterval(async () => {
      try {
        const u = auth.currentUser;
        if (u) {
          const idt = await getIdToken(u, true);
          setAdminToken(idt || '');
        }
      } catch {}
    }, 45 * 60 * 1000);

    return () => {
      mounted = false;
      unsub();
      window.removeEventListener('focus', onFocus);
      clearInterval(t);
    };
  }, []);

  const mergeModules = useCallback((base, byType) => {
    const map = new Map(base.map((m) => [m.type, { ...m }]));
    const keys = Object.keys(byType || {});
    for (const type of keys) {
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
  }, []);

  /**
   * Recarga explícita desde la API.
   * - noFallback=true: NO usa localStorage si la API falla (útil para Admin).
   * - noFallback=false: permite mostrar cache local si falla (útil para front público).
   */
  const reloadCatalog = useCallback(
    async ({ force = false, noFallback = false } = {}) => {
      setLoading(true);
      try {
        const data = await ModulesApi.getOverrides(adminToken); // envía token si hay
        setOverrides(data || { byType: {} });
        setApiError('');
        setReady(true);
      } catch (e) {
        console.error('[Modules] getOverrides error:', e);
        setApiError(String(e?.message || e));
        if (!noFallback) {
          setOverrides(loadOverridesLocal());
        }
        setReady(true);
      } finally {
        setLoading(false);
      }
    },
    [adminToken]
  );

  // Carga inicial (permite fallback local si la API falla)
  useEffect(() => {
    reloadCatalog({ force: true, noFallback: false });
  }, [reloadCatalog]);

  // Guardar cache local como fallback
  useEffect(() => {
    try {
      localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrides));
    } catch {}
  }, [overrides]);

  // Catálogo para el front (merge base + overrides)
  const modules = useMemo(() => {
    const byType = overrides.byType || {};
    return mergeModules(baseModules, byType);
  }, [overrides, mergeModules]);

  // Catálogo para Admin (incluye tipos base y de overrides)
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

  // Compat: mantenemos la firma pero ya no persistimos token en localStorage
  const setAdminTokenValue = useCallback((token) => {
    setAdminToken(token || '');
  }, []);

  // Mutadores
  const updateOverride = useCallback(
    async (type, patch) => {
      try {
        const data = await ModulesApi.setOverride(type, patch, adminToken);
        if (data?.byType) {
          setOverrides({ byType: data.byType });
        } else {
          const ref = await ModulesApi.getOverrides(adminToken);
          setOverrides(ref || { byType: {} });
        }
      } catch (e) {
        console.error('[Modules] setOverride error (fallback local):', e);
        // Fallback optimista local (no pierde la edición si la API falla)
        setOverrides((prev) => ({
          byType: {
            ...(prev.byType || {}),
            [type]: { ...(prev.byType?.[type] || {}), ...patch },
          },
        }));
      }
    },
    [adminToken]
  );

  const resetOverrides = useCallback(async () => {
    try {
      const data = await ModulesApi.resetOverrides(adminToken);
      if (data?.byType) setOverrides({ byType: data.byType });
      else setOverrides({ byType: {} });
    } catch (e) {
      console.error('[Modules] resetOverrides error:', e);
      setOverrides({ byType: {} });
    }
  }, [adminToken]);

  const value = useMemo(
    () => ({
      ready,
      apiError,
      loading,
      modules,
      catalogAdmin,
      overrides,
      adminToken,
      setAdminToken: setAdminTokenValue, // compat
      updateOverride,
      resetOverrides,
      reloadCatalog,
    }),
    [
      ready,
      apiError,
      loading,
      modules,
      catalogAdmin,
      overrides,
      adminToken,
      setAdminTokenValue,
      updateOverride,
      resetOverrides,
      reloadCatalog,
    ]
  );

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>;
}

export function useModules() {
  const ctx = useContext(ModulesContext);
  if (!ctx) throw new Error('useModules must be used within ModulesProvider');
  return ctx;
}
