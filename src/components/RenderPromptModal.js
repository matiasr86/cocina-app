import React, { useEffect, useMemo, useState } from 'react';
import './RenderPromptModal.css';

export default function RenderPromptModal({
  open,
  imageDataUrl,
  maxChars = 300,
  defaultText = '',
  defaultBridgeStrict = false,
  onCancel,
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
    <div className="rpm-overlay" onClick={onCancel}>
      <div className="rpm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Preview */}
        <div className="rpm-preview">
          {imageDataUrl ? (
            <img
              src={imageDataUrl}
              alt="preview"
              className="rpm-preview__img"
            />
          ) : (
            <div className="rpm-preview__empty">Sin vista previa</div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="rpm-panel">
          <div className="rpm-title">Descripción breve</div>

          <div className="rpm-description">
            Escribí sólo colores o acabados (p. ej. “frentes gris topo mate, mesada blanca”). La
            posición y cantidad de módulos salen de la imagen.
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Colores / acabado (opcional)…"
            rows={7}
            className="rpm-textarea"
          />

          <div className="rpm-options">
            <label className="rpm-check">
              <input
                type="checkbox"
                checked={bridgeStrict}
                onChange={(e) => setBridgeStrict(e.target.checked)}
              />
              <span>
                <strong>Cocina tipo puente</strong> (alacenas superiores profundas, a ras de columnas/bajo mesada)
              </span>
            </label>

            <div className={`rpm-counter ${tooLong ? 'is-error' : ''}`}>
              {remaining} caracteres
            </div>
          </div>

          <div className="rpm-actions">
            <button
              className="btn"
              onClick={onCancel}
            >
              Cancelar
            </button>

            <button
              className="btn primary"
              onClick={() => onConfirm(text.trim(), bridgeStrict)}
              disabled={tooLong}
            >
              Renderizar
            </button>
          </div>

          <div className="rpm-help">
            Si marcás “tipo puente”, reforzamos que las alacenas superiores queden enrasadas con
            columnas y bajo mesada (profundidad ~58–60 cm).
          </div>
        </div>
      </div>
    </div>
  );
}