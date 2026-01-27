import React, { useState } from "react";
import { useConsent } from "../consent/ConsentContext";

// Estilos inline para evitar dependencias de CSS
const bar = {
  position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 3000,
  background: "#ffffff", color: "#111", border: "1px solid #e5e7eb",
  borderRadius: 12, padding: 14, boxShadow: "0 8px 30px rgba(0,0,0,.12)"
};
const row = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" };
const grow = { flex: 1, minWidth: 240 };
const btn = { padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 700 };
const primary = { ...btn, background: "#111", color: "#fff", borderColor: "#111" };

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 3100,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 20
};
const panel = {
  width: "min(680px, 96vw)", background: "#fff", borderRadius: 12, padding: 16,
  boxShadow: "0 16px 48px rgba(0,0,0,.25)"
};

export default function ConsentBanner() {
  const { hasRecord, openPanel, setOpenPanel, choices, saveChoices, acceptAll, rejectNonEssential } = useConsent();
  const [localChoices, setLocalChoices] = useState(choices);

  // Banner solo si no hay registro aún
  if (hasRecord && !openPanel) return null;

  return (
    <>
      {!hasRecord && (
        <div style={bar}>
          <div style={row}>
            <div style={grow}>
              <strong>Tu privacidad nos importa</strong><br/>
              Usamos tecnologías necesarias para que el sitio funcione. Con tu permiso también guardaremos tus <b>preferencias</b> (calidad y diseño) y, si lo habilitás, datos de <b>analítica</b>. Podés aceptar todo, rechazar lo no esencial o elegir por categoría.
            </div>
            <button style={btn} onClick={() => setOpenPanel(true)}>Elegir</button>
            <button style={btn} onClick={rejectNonEssential}>Rechazar no esenciales</button>
            <button style={primary} onClick={acceptAll}>Aceptar todo</button>
          </div>
        </div>
      )}

      {(openPanel || (!hasRecord && false)) && (
        <div style={overlay} onClick={() => setOpenPanel(false)}>
          <div style={panel} onClick={(e) => e.stopPropagation()}>
            <h3 style={{margin:0}}>Configuración de privacidad</h3>
            <p style={{marginTop:8}}>
              Elegí qué categorías permitís. Las esenciales se usan siempre para dar el servicio y guardar tu elección.
            </p>

            <div style={{border:"1px solid #eee", borderRadius:10, padding:12, marginTop:6}}>
              <div style={{fontWeight:800, marginBottom:4}}>Esenciales (siempre activas)</div>
              <div style={{color:"#555"}}>Imprescindibles para funcionamiento, seguridad y registrar tu consentimiento.</div>
            </div>

            <label style={{display:"flex", alignItems:"center", gap:10, border:"1px solid #eee", borderRadius:10, padding:12, marginTop:10}}>
              <input
                type="checkbox"
                checked={!!localChoices.preferences}
                onChange={(e) => setLocalChoices((c) => ({ ...c, preferences: e.target.checked }))}
              />
              <div>
                <div style={{fontWeight:800}}>Preferencias</div>
                <div style={{color:"#555"}}>Recordar calidad elegida, layout y módulos.</div>
              </div>
            </label>

            <label style={{display:"flex", alignItems:"center", gap:10, border:"1px solid #eee", borderRadius:10, padding:12, marginTop:10}}>
              <input
                type="checkbox"
                checked={!!localChoices.analytics}
                onChange={(e) => setLocalChoices((c) => ({ ...c, analytics: e.target.checked }))}
              />
              <div>
                <div style={{fontWeight:800}}>Analítica</div>
                <div style={{color:"#555"}}>Métricas agregadas para mejorar el producto.</div>
              </div>
            </label>

            <div style={{display:"flex", gap:10, justifyContent:"flex-end", marginTop:12}}>
              <button style={btn} onClick={rejectNonEssential}>Rechazar no esenciales</button>
              <button style={primary} onClick={() => saveChoices(localChoices)}>Guardar selección</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
