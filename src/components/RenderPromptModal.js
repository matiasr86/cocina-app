import React, { useEffect, useMemo, useState } from 'react';

export default function RenderPromptModal({
  open,
  imageDataUrl,
  maxChars = 300,
  defaultText = '',
  // ⬇️ nuevo: estado inicial del checkbox
  defaultBridgeStrict = false,
  onCancel,
  // IMPORTANTE: ahora llamamos onConfirm(userText, bridgeStrict)
  onConfirm,
}) {
  const [text, setText] = useState(defaultText || '');
  const [bridgeStrict, setBridgeStrict] = useState(!!defaultBridgeStrict);

  useEffect(() => {
    setText(defaultText || '');
  }, [defaultText, open]);

  useEffect(() => {
    setBridgeStrict(!!defaultBridgeStrict);
  }, [defaultBridgeStrict, open]);

  const remaining = useMemo(() => maxChars - (text?.length || 0), [text, maxChars]);
  const tooLong = remaining < 0;

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1650,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: 'min(1100px, 96vw)',
          maxHeight: '92vh',
          background: '#111',
          color: '#e5e7eb',
          borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,.6)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview */}
        <div style={{ background: '#000', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {imageDataUrl ? (
            <img
              src={imageDataUrl}
              alt="preview"
              style={{ maxWidth: '100%', maxHeight: '86vh', display: 'block', borderRadius: 8 }}
            />
          ) : (
            <div style={{ color: '#888' }}>Sin vista previa</div>
          )}
        </div>

        {/* Panel derecho */}
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Descripción breve</div>
          <div style={{ fontSize: 13, color: '#a3a3a3', lineHeight: 1.45 }}>
            Escribí sólo colores o acabados (p. ej. “frentes gris topo mate, mesada blanca”). La
            posición y cantidad de módulos salen de la imagen.
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Colores / acabado (opcional)…"
            rows={7}
            style={{
              width: '100%',
              resize: 'vertical',
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #2a2a2a',
              outline: 'none',
              background: '#151515',
              color: '#e5e7eb',
              fontSize: 14,
              lineHeight: 1.45,
              minHeight: 120,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={bridgeStrict}
                onChange={(e) => setBridgeStrict(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14 }}>
                <strong>Cocina tipo puente</strong> (alacenas superiores profundas, a ras de columnas/bajo mesada)
              </span>
            </label>

            <div style={{ fontSize: 12, color: tooLong ? '#ff6961' : '#9ca3af' }}>
              {remaining} caracteres
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            <button
              className="btn"
              onClick={onCancel}
              style={{ padding: '8px 12px', borderRadius: 10 }}
            >
              Cancelar
            </button>
            <button
              className="btn primary"
              onClick={() => onConfirm(text.trim(), bridgeStrict)}
              disabled={tooLong}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                opacity: tooLong ? 0.6 : 1,
                cursor: tooLong ? 'not-allowed' : 'pointer',
              }}
            >
              Renderizar
            </button>
          </div>

          <div style={{ fontSize: 12, color: '#8b8b8b', marginTop: 2 }}>
            Si marcás “tipo puente”, reforzamos que las alacenas superiores queden enrasadas con
            columnas y bajo mesada (profundidad ~58–60 cm).
          </div>
        </div>
      </div>
    </div>
  );
}
