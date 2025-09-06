import React, { createContext, useCallback, useContext, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

const ICON = {
  info: 'fa-circle-info',
  success: 'fa-circle-check',
  warning: 'fa-triangle-exclamation',
  error: 'fa-circle-exclamation',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message, opts = {}) => {
    const id = crypto.randomUUID();
    const duration = opts.duration ?? 3500;
    setToasts((t) => [...t, { id, type, message }]);
    if (duration > 0) setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, duration);
  }, []);

  const api = {
    info:    (m, o) => push('info', m, o),
    success: (m, o) => push('success', m, o),
    warning: (m, o) => push('warning', m, o),
    error:   (m, o) => push('error', m, o),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <i className={`fa-solid ${ICON[t.type]} toast-icon`} aria-hidden="true" />
            <div className="toast-msg">{t.message}</div>
            <button className="toast-close" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) || {
    info: (m) => alert(m),
    success: (m) => alert(m),
    warning: (m) => alert(m),
    error: (m) => alert(m),
  };
}
