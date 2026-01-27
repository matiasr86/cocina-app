import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

let idSeq = 1;

export function ToastProvider({ children }) {
  // ======= toasts simples (success/error/info) =======
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => {
    setToasts((xs) => xs.filter((t) => t.id !== id));
  }, []);
  const push = useCallback((kind, title, message, ttl = 3200) => {
    const id = idSeq++;
    setToasts((xs) => [...xs, { id, kind, title, message }]);
    if (ttl > 0) setTimeout(() => remove(id), ttl);
  }, [remove]);

  const api = useMemo(() => ({
    success: (title, message) => push('success', title, message),
    error:   (title, message) => push('error', title, message),
    info:    (title, message) => push('info', title, message),
  }), [push]);

  // ======= confirm modal (PROMISE) =======
  const [confirmState, setConfirmState] = useState({ open: false });
  const resolverRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfirmState({
        open: true,
        title: opts.title || '¿Confirmar?',
        description: opts.description || '',
        confirmText: opts.confirmText || 'Aceptar',
        cancelText: opts.cancelText || 'Cancelar',
        tone: opts.tone || 'default', // 'default' | 'danger'
      });
    });
  }, []);

  const closeConfirm = useCallback((value) => {
    const r = resolverRef.current;
    resolverRef.current = null;
    setConfirmState({ open: false });
    if (typeof r === 'function') r(!!value);
  }, []);

  const ctxValue = useMemo(() => ({ ...api, confirm }), [api, confirm]);

  return (
    <ToastCtx.Provider value={ctxValue}>
      {children}

      {/* ===== TOASTS STACK (bottom-right) ===== */}
      <div style={{
        position: 'fixed', right: 16, bottom: 16, display: 'grid', gap: 10, zIndex: 4000,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id}
               style={{
                 pointerEvents: 'auto',
                 minWidth: 260,
                 maxWidth: 360,
                 background: '#111827',
                 color: '#fff',
                 borderRadius: 10,
                 boxShadow: '0 10px 35px rgba(0,0,0,.45)',
                 border: t.kind === 'error' ? '1px solid #b91c1c'
                       : t.kind === 'success' ? '1px solid #065f46'
                       : '1px solid #1f2937',
                 padding: '10px 12px'
               }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {t.kind === 'error' ? '⚠️ ' : t.kind === 'success' ? '✅ ' : 'ℹ️ '}
              {t.title}
            </div>
            {t.message && <div style={{ opacity: .9, fontSize: 13 }}>{t.message}</div>}
          </div>
        ))}
      </div>

      {/* ===== CONFIRM MODAL (estilo “lindo”, no bloquea scroll del body) ===== */}
      {confirmState.open && (
        <div
          className="confirmOverlay"
          onClick={() => closeConfirm(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3500, backdropFilter: 'blur(2px)'
          }}
        >
          <div
            className="confirmBox"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              width: 'min(560px, 92vw)',
              background: '#111827',
              color: '#fff',
              borderRadius: 14,
              padding: 16,
              boxShadow: '0 18px 60px rgba(0,0,0,.55)',
              border: '1px solid rgba(255,255,255,.08)'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              {confirmState.title}
            </div>
            {confirmState.description && (
              <div style={{ opacity: .95, lineHeight: 1.5, marginBottom: 14 }}>
                {confirmState.description}
              </div>
            )}
            <div className="confirmActions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => closeConfirm(false)}
                style={{ padding: '8px 14px', borderRadius: 10 }}
              >
                {confirmState.cancelText || 'Cancelar'}
              </button>
              <button
                className={`btn ${confirmState.tone === 'danger' ? 'danger' : 'primary'}`}
                onClick={() => closeConfirm(true)}
                style={{ padding: '8px 14px', borderRadius: 10 }}
              >
                {confirmState.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  );
}
