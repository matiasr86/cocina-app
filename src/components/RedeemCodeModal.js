import React, { useEffect, useRef, useState } from 'react';
import './RedeemCodeModal.css';

export default function RedeemCodeModal({
  open,
  onClose,
  onRedeemed,
  apiBase,
  getIdToken,
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setCode('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const close = () => {
    if (!busy) onClose?.();
  };

  const submit = async () => {
    const v = code.trim();
    if (!v) {
      setError('Ingresá un código.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      const token = await getIdToken();
      const r = await fetch(`${apiBase}/credits/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: v }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data?.ok) {
        const map = {
          missing_code: 'Ingresá un código válido.',
          invalid_code: 'Código inválido.',
          code_not_found: 'El código no existe.',
          code_expired: 'El código está vencido.',
          code_already_used_in_odoo: 'Ese código ya fue utilizado.',
          code_already_redeemed: 'Ese código ya fue usado en esta app.',
          not_a_gift_card: 'El código no corresponde a una gift card.',
          unable_to_resolve_credits: 'No pudimos determinar los créditos de este código.',
          redeem_failed: 'No se pudo canjear el código.',
        };

        setError(map[data?.error] || data?.message || `No se pudo canjear (HTTP ${r.status}).`);
        return;
      }

      onRedeemed?.(
        data?.newTotal ?? data?.credits_total ?? null,
        data?.added ?? 0,
        data?.gift?.programName ?? data?.program ?? ''
      );

      onClose?.();
    } catch (e) {
      setError('Error de red. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="redeem-modal__mask" onClick={close} role="presentation">
      <div
        className="redeem-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="redeem-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="redeem-modal__header">
          <div className="redeem-modal__icon">🎟️</div>
          <div id="redeem-title" className="redeem-modal__title">
            Canjear código
          </div>
          <div className="redeem-modal__spacer" />
          <button className="btn" onClick={close} disabled={busy}>
            Cerrar
          </button>
        </div>

        <div className="redeem-modal__body">
          <div className="redeem-modal__field">
            <label htmlFor="redeem-code">
              Ingresá el código que recibiste por email
            </label>

            <input
              id="redeem-code"
              ref={inputRef}
              className="redeem-modal__input"
              type="text"
              placeholder="p. ej. 044E-4FC0-4D1A"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={busy}
              autoComplete="one-time-code"
              inputMode="text"
            />

            {error ? (
              <div className="redeem-modal__error">{error}</div>
            ) : (
              <div className="redeem-modal__helper">
                El canje suma créditos inmediatamente a tu cuenta.
              </div>
            )}
          </div>

          <div className="redeem-modal__actions">
            <button className="btn" onClick={close} disabled={busy}>
              Cancelar
            </button>

            <button className="btn primary" onClick={submit} disabled={busy}>
              {busy && <span className="redeem-modal__spinner" />}
              Canjear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}