import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CONSENT_KEY = "consent.v1";          // registro del consentimiento (esencial)
const POLICY_VERSION = 1;                   // subilo si cambiás tu política

// Claves de preferencias que tu app guarda hoy:
const PREFERENCE_KEYS = [
  "kitchen.quality.v1",
  "kitchen.layout.v1",
  "render.userText",
  "render.bridgeStrict",
  "admin.modules.overrides.v1",

];

function wipePreferenceData() {
  try {
    // Borrar claves conocidas
    for (const k of PREFERENCE_KEYS) localStorage.removeItem(k);
    // Borrar kitchen.modules.*
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("kitchen.modules.")) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}

const ConsentCtx = createContext(null);

export function ConsentProvider({ children }) {
  // Estado del consentimiento
  const [choices, setChoices] = useState({ preferences: false, analytics: false });
  const [hasRecord, setHasRecord] = useState(false);
  const [openPanel, setOpenPanel] = useState(false);

  // Cargar registro (esencial)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return;
      const js = JSON.parse(raw);
      if (js?.version === POLICY_VERSION && js?.choices) {
        setChoices(js.choices);
        setHasRecord(true);
      }
    } catch {}
  }, []);

  const persistRecord = useCallback((nextChoices) => {
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ version: POLICY_VERSION, ts: Date.now(), choices: nextChoices })
      );
    } catch {}
  }, []);

  const acceptAll = useCallback(() => {
    const next = { preferences: true, analytics: true };
    setChoices(next);
    setHasRecord(true);
    persistRecord(next);
    setOpenPanel(false);
  }, [persistRecord]);

  const rejectNonEssential = useCallback(() => {
    const next = { preferences: false, analytics: false };
    setChoices(next);
    setHasRecord(true);
    persistRecord(next);
    wipePreferenceData();
    setOpenPanel(false);
  }, [persistRecord]);

  const saveChoices = useCallback((partial) => {
    const next = { ...choices, ...partial };
    // Si se apagan preferencias, limpiar lo previo
    if (choices.preferences && !next.preferences) wipePreferenceData();
    setChoices(next);
    setHasRecord(true);
    persistRecord(next);
    setOpenPanel(false);
  }, [choices, persistRecord]);

  // Helpers para gatear localStorage de preferencias
  const prefs = useMemo(() => ({
    get: (k) => {
      try { return localStorage.getItem(k); } catch { return null; }
    },
    set: (k, v) => {
      if (!choices.preferences) return;      // ⬅️ gateo real
      try { localStorage.setItem(k, v); } catch {}
    },
    remove: (k) => {
      if (!choices.preferences) return;
      try { localStorage.removeItem(k); } catch {}
    },
  }), [choices.preferences]);

  const value = useMemo(() => ({
    // estado
    choices, hasRecord,
    // UI panel/banner
    openPanel, setOpenPanel,
    // acciones
    acceptAll, rejectNonEssential, saveChoices,
    // helpers
    prefs,
    canUse: (cat) => !!choices[cat],
  }), [choices, hasRecord, openPanel, acceptAll, rejectNonEssential, saveChoices, prefs]);

  return <ConsentCtx.Provider value={value}>{children}</ConsentCtx.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentCtx);
  if (!ctx) throw new Error("useConsent must be used inside <ConsentProvider>");
  return ctx;
}
